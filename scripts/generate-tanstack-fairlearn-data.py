"""Materialize the exact Boston/Titanic summaries used by unit 07 charts."""

from __future__ import annotations

import io
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

import numpy as np
import pandas as pd

SOURCES = {
    "boston": {
        "url": "https://lib.stat.cmu.edu/datasets/boston",
        "sha256": "1df1f5ccfcd1cb9e8f9eaa2c871bb3355eafdde755267bcd593f817b21b92a7b",
    },
    "titanic": {
        "url": "https://raw.githubusercontent.com/datasciencedojo/datasets/f0ccab6a7ceafdff780052166fb6fab3311398eb/titanic.csv",
        "sha256": "4a437fde05fe5264e1701a7387ac6fb75393772ba38bb2c9c566405af5af4bd7",
    },
}
OUTPUT = Path("src/data/tanstack/fairlearn.json")


def hist(values: pd.Series, bins: int = 30) -> list[dict[str, float]]:
    counts, edges = np.histogram(values.dropna().to_numpy(dtype=float), bins=bins)
    return [{"x": float((a + b) / 2), "count": int(c)} for a, b, c in zip(edges[:-1], edges[1:], counts, strict=True)]


def fetch_verified(name: str) -> bytes:
    source = SOURCES[name]
    with urlopen(source["url"]) as response:
        content = response.read()

    sha256 = hashlib.sha256(content).hexdigest()
    if sha256 != source["sha256"]:
        raise RuntimeError(
            f"La fuente {name} cambió: se esperaba {source['sha256']} y se obtuvo {sha256}"
        )

    return content


def load_boston() -> pd.DataFrame:
    boston_bytes = fetch_verified("boston")
    raw = pd.read_csv(io.BytesIO(boston_bytes), sep=r"\s+", skiprows=22, header=None, engine="python")
    data = np.hstack([raw.values[::2, :], raw.values[1::2, :2]])
    target = raw.values[1::2, 2]
    names = ["CRIM", "ZN", "INDUS", "CHAS", "NOX", "RM", "AGE", "DIS", "RAD", "TAX", "PTRATIO", "B", "LSTAT"]
    frame = pd.DataFrame(data, columns=names)
    frame["MEDV"] = target
    frame["Bk_racial"] = np.sqrt(frame["B"] / 1000) + 0.63
    frame["racial_group"] = pd.cut(frame["Bk_racial"], bins=3, labels=["Low_African_American", "Medium_African_American", "High_African_American"])
    return frame


def main() -> None:
    boston = load_boston()
    groups = boston.groupby("racial_group", observed=True)["MEDV"].agg(["mean", "median", "count"]).reset_index()
    corr_fields = ["MEDV", "Bk_racial", "LSTAT", "CRIM"]
    correlation = [
        {"x": left, "y": right, "value": float(boston[corr_fields].corr().loc[left, right])}
        for left in corr_fields
        for right in corr_fields
    ]
    scatter = boston[["Bk_racial", "MEDV", "racial_group"]].rename(columns={"Bk_racial": "racial", "MEDV": "price"}).to_dict(orient="records")

    titanic_bytes = fetch_verified("titanic")
    titanic = pd.read_csv(io.BytesIO(titanic_bytes))[["Survived", "Pclass", "Sex", "Age", "Fare"]].dropna()
    gender = titanic.groupby("Sex", as_index=False)["Survived"].mean().rename(columns={"Sex": "group", "Survived": "rate"})
    class_rates = titanic.groupby("Pclass", as_index=False)["Survived"].mean().rename(columns={"Pclass": "group", "Survived": "rate"})
    intersection = titanic.pivot_table(values="Survived", index="Sex", columns="Pclass", aggfunc="mean", fill_value=0).reset_index().melt(id_vars="Sex", var_name="class", value_name="rate")
    counts = titanic.assign(group=titanic["Sex"] + " · Clase " + titanic["Pclass"].astype(str)).groupby("group").size().reset_index(name="count")

    payload = {
        "sources": SOURCES,
        "boston": {
            "groups": groups.to_dict(orient="records"),
            "correlation": correlation,
            "histogram": hist(boston["Bk_racial"]),
            "scatter": scatter,
        },
        "titanic": {
            "gender": gender.to_dict(orient="records"),
            "classRates": class_rates.to_dict(orient="records"),
            "intersection": intersection.to_dict(orient="records"),
            "counts": counts.to_dict(orient="records"),
        },
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
