"""Materialize the deterministic synthetic data used by unit 08's plots."""

from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path
from urllib.request import urlopen

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_selection import mutual_info_regression
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

OUTPUT = Path("src/data/tanstack/unit08.json")
BOSTON_URL = "https://lib.stat.cmu.edu/datasets/boston"
BOSTON_SHA256 = "1df1f5ccfcd1cb9e8f9eaa2c871bb3355eafdde755267bcd593f817b21b92a7b"


def histogram(values: pd.Series, series: str, bins: int = 30) -> list[dict[str, float | int | str]]:
    counts, edges = np.histogram(values.to_numpy(dtype=float), bins=bins)
    return [
        {"series": series, "x": float((left + right) / 2), "count": int(count)}
        for left, right, count in zip(edges[:-1], edges[1:], counts, strict=True)
    ]


def boston_results() -> dict:
    with urlopen(BOSTON_URL) as response:
        source = response.read()

    source_sha256 = hashlib.sha256(source).hexdigest()
    if source_sha256 != BOSTON_SHA256:
        raise RuntimeError(
            f"La fuente Boston cambió: se esperaba {BOSTON_SHA256} y se obtuvo {source_sha256}"
        )

    raw = pd.read_csv(io.BytesIO(source), sep=r"\s+", skiprows=22, header=None, engine="python")
    values = np.hstack([raw.values[::2, :], raw.values[1::2, :2]])
    target = raw.values[1::2, 2]
    feature_names = [
        "CRIM",
        "ZN",
        "INDUS",
        "CHAS",
        "NOX",
        "RM",
        "AGE",
        "DIS",
        "RAD",
        "TAX",
        "PTRATIO",
        "B",
        "LSTAT",
    ]
    frame = pd.DataFrame(values, columns=feature_names)
    frame["MEDV"] = target
    frame["price_per_room"] = frame["MEDV"] / (frame["RM"] + 1e-6)
    frame["crime_per_capita"] = frame["CRIM"] / (frame["ZN"] + 1)
    frame["nox_per_industry"] = frame["NOX"] / (frame["INDUS"] + 1e-6)
    frame["distance_per_age"] = frame["DIS"] / (frame["AGE"] + 1)
    frame["rm_x_age"] = frame["RM"] * frame["AGE"]
    frame["nox_x_crim"] = frame["NOX"] * frame["CRIM"]
    frame["lstat_x_age"] = frame["LSTAT"] * frame["AGE"]
    frame["log_crim"] = np.log1p(frame["CRIM"])
    frame["sqrt_lstat"] = np.sqrt(frame["LSTAT"])
    frame["sq_rm"] = frame["RM"] ** 2

    x = frame.drop(columns=["MEDV"])
    y = frame["MEDV"]
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)

    mi_scores = mutual_info_regression(x_train, y_train, random_state=42)
    mutual_information = (
        pd.DataFrame({"feature": x_train.columns, "score": mi_scores})
        .sort_values("score", ascending=False)
        .head(10)
        .to_dict(orient="records")
    )

    all_model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=1)
    all_model.fit(x_train, y_train)
    all_predictions = all_model.predict(x_test)
    random_forest = (
        pd.DataFrame({"feature": x_train.columns, "score": all_model.feature_importances_})
        .sort_values("score", ascending=False)
        .head(10)
        .to_dict(orient="records")
    )

    original_model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=1)
    original_model.fit(x_train[feature_names], y_train)
    original_predictions = original_model.predict(x_test[feature_names])

    predictions = [
        {"model": "Original", "actual": float(actual), "predicted": float(predicted)}
        for actual, predicted in zip(y_test, original_predictions, strict=True)
    ] + [
        {"model": "Features derivadas", "actual": float(actual), "predicted": float(predicted)}
        for actual, predicted in zip(y_test, all_predictions, strict=True)
    ]

    return {
        "predictions": predictions,
        "metrics": [
            {
                "model": "Original",
                "r2": float(r2_score(y_test, original_predictions)),
                "mse": float(mean_squared_error(y_test, original_predictions)),
            },
            {
                "model": "Features derivadas",
                "r2": float(r2_score(y_test, all_predictions)),
                "mse": float(mean_squared_error(y_test, all_predictions)),
            },
        ],
        "mutualInformation": mutual_information,
        "randomForest": random_forest,
    }


def main() -> None:
    np.random.seed(42)
    frame = pd.DataFrame(
        {
            "price": np.random.lognormal(mean=12, sigma=0.5, size=1000),
            "sqft": np.random.normal(2000, 500, 1000).clip(800, 5000),
            "bedrooms": np.random.choice([2, 3, 4, 5], size=1000, p=[0.2, 0.4, 0.3, 0.1]),
            "year_built": np.random.randint(1950, 2020, 1000),
            "lot_size": np.random.normal(8000, 2000, 1000).clip(3000, 15000),
            "distance_to_city": np.random.exponential(10, 1000).clip(0, 50),
            "school_rating": np.random.choice([1, 2, 3, 4, 5], size=1000, p=[0.1, 0.2, 0.3, 0.3, 0.1]),
            "crime_rate": np.random.gamma(shape=2, scale=5, size=1000).clip(0, 50),
        }
    )

    frame["price_per_sqft"] = frame["price"] / frame["sqft"]
    frame["sqft_per_bedroom"] = frame["sqft"] / frame["bedrooms"].replace(0, 1)
    frame["price_per_bedroom"] = frame["price"] / frame["bedrooms"].replace(0, 1)
    frame["build_density"] = frame["sqft"] / frame["lot_size"]
    frame["property_age"] = 2024 - frame["year_built"]
    frame["log_price"] = np.log1p(frame["price"])
    frame["sqrt_sqft"] = np.sqrt(frame["sqft"])
    frame["sqft_squared"] = frame["sqft"] ** 2
    frame["luxury_score"] = (
        (frame["sqft"] / frame["sqft"].max()) * 0.4
        + (frame["bedrooms"] / frame["bedrooms"].max()) * 0.3
        + (frame["price"] / frame["price"].max()) * 0.3
    )
    frame["location_score"] = (
        (1 - frame["distance_to_city"] / frame["distance_to_city"].max()) * 0.4
        + (frame["school_rating"] / 5) * 0.4
        + (1 - frame["crime_rate"] / frame["crime_rate"].max()) * 0.2
    )
    frame["space_efficiency"] = frame["sqft"] / frame["lot_size"]
    frame["crowded_property"] = frame["bedrooms"] / frame["sqft"]

    derived = [
        row
        for column in ["space_efficiency", "crowded_property", "location_score"]
        for row in histogram(frame[column], column)
    ]
    analysis = [
        row
        for column in [
            "price_per_sqft",
            "sqft_per_bedroom",
            "property_age",
            "log_price",
            "sqrt_sqft",
            "sqft_squared",
        ]
        for row in histogram(frame[column], column)
    ]

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(
            {
                "source": {
                    "description": "Dataset sintético de la unidad 08, generado con el seed y las distribuciones del MDX",
                    "seed": 42,
                    "rows": 1000,
                    "boston": {"url": BOSTON_URL, "sha256": BOSTON_SHA256},
                },
                "derived": derived,
                "analysis": analysis,
                "boston": boston_results(),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )


if __name__ == "__main__":
    main()
