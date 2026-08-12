"""Materialize the Ames summaries used by the chart-only MDX variants.

The source and the missing-value recipe are copied from unit 05's notebook.
The script intentionally writes aggregates and histogram bins, not a second
copy of the complete source table.
"""

from __future__ import annotations

import hashlib
import io
import json
import zipfile
from pathlib import Path
from urllib.request import urlopen

import numpy as np
import pandas as pd
from sklearn.preprocessing import FunctionTransformer, MaxAbsScaler, PowerTransformer, QuantileTransformer, Normalizer, StandardScaler

SOURCE_URL = "https://www.kaggle.com/api/v1/datasets/download/shashanknecrothapa/ames-housing-dataset?datasetVersionNumber=1"
SOURCE_SHA256 = "fce3f8f24bbc27cf7679f41eee7e51f6447ec8b1fadac5756cc06a42f5990df1"
OUTPUT = Path("src/data/tanstack/ames.json")
SELECTED = ["SalePrice", "Lot Area", "Overall Qual", "Year Built", "1st Flr SF", "Gr Liv Area"]


def histogram(values: pd.Series | np.ndarray, bins: int = 30) -> list[dict[str, float]]:
    numeric = pd.to_numeric(pd.Series(values), errors="coerce").dropna().to_numpy(dtype=float)
    counts, edges = np.histogram(numeric, bins=bins)
    return [
        {"x": float((left + right) / 2), "count": int(count)}
        for left, right, count in zip(edges[:-1], edges[1:], counts, strict=True)
    ]


def add_series(rows: list[dict], key: str, values: pd.Series | np.ndarray, bins: int = 30) -> None:
    rows.extend({"series": key, **point} for point in histogram(values, bins))


def make_missing_frame(df: pd.DataFrame) -> pd.DataFrame:
    frame = df.copy()
    np.random.seed(42)
    frame.loc[np.random.random(len(frame)) < 0.08, "Year Built"] = np.nan
    none_garage = frame["Garage Type"] == "None"
    frame.loc[none_garage, "Garage Area"] = frame.loc[none_garage, "Garage Area"].sample(
        frac=0.7, random_state=42
    )
    high_price = frame["SalePrice"] > frame["SalePrice"].quantile(0.85)
    frame.loc[high_price, "SalePrice"] = frame.loc[high_price, "SalePrice"].sample(
        frac=0.2, random_state=42
    )
    return frame


def make_unit05(df: pd.DataFrame) -> dict:
    frame = make_missing_frame(df)
    missing_per_row = (
        frame.isna()
        .sum(axis=1)
        .value_counts()
        .sort_index()
        .rename_axis("missing")
        .reset_index(name="count")
    )

    outlier_summaries = []
    for column in ["SalePrice", "Lot Area", "Year Built", "Garage Area"]:
        values = pd.to_numeric(frame[column], errors="coerce").dropna().sort_values()
        q1 = float(values.quantile(0.25))
        median = float(values.quantile(0.5))
        q3 = float(values.quantile(0.75))
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        inliers = values[(values >= lower_bound) & (values <= upper_bound)]
        outliers = values[(values < lower_bound) | (values > upper_bound)]
        outlier_summaries.append(
            {
                "feature": column,
                "q1": q1,
                "median": median,
                "q3": q3,
                "lowerBound": lower_bound,
                "upperBound": upper_bound,
                "whiskerLow": float(inliers.iloc[0]),
                "whiskerHigh": float(inliers.iloc[-1]),
                "outliers": [float(value) for value in outliers],
            }
        )

    imputed = frame.copy()
    for column in imputed.columns:
        if pd.api.types.is_numeric_dtype(imputed[column]):
            imputed[column] = imputed[column].fillna(imputed[column].median())
        elif imputed[column].isna().any():
            imputed[column] = imputed[column].fillna(imputed[column].mode().iloc[0])

    fields = ["SalePrice", "Lot Area", "Year Built", "Garage Area", "Overall Qual", "Gr Liv Area", "Total Bsmt SF"]
    before = frame[fields].corr(numeric_only=True)
    after = imputed[fields].corr(numeric_only=True)
    correlations = [
        {"state": state, "x": left, "y": right, "value": float(matrix.loc[right, left])}
        for state, matrix in [("Original", before), ("Imputado", after)]
        for right in fields
        for left in fields
    ]

    distributions: list[dict] = []
    for column in ["SalePrice", "Lot Area", "Year Built", "Garage Area"]:
        add_series(distributions, f"{column} · Original", frame[column], bins=20)
        add_series(distributions, f"{column} · Imputado", imputed[column], bins=20)

    category_distributions = []
    for column in ["Neighborhood", "House Style"]:
        for state, source in [("Original", frame), ("Imputado", imputed)]:
            counts = source[column].dropna().astype(str).value_counts()
            category_distributions.extend(
                {
                    "feature": column,
                    "state": state,
                    "category": category,
                    "count": int(count),
                }
                for category, count in counts.items()
            )

    return {
        "missingPerRow": missing_per_row.to_dict(orient="records"),
        "outlierSummaries": outlier_summaries,
        "distributions": distributions,
        "categoryDistributions": category_distributions,
        "correlations": correlations,
    }


def make_unit06(df: pd.DataFrame) -> dict:
    raw: list[dict] = []
    for column in SELECTED:
        add_series(raw, column, df[column])

    transform_input = df[["SalePrice", "Lot Area"]].dropna().to_numpy(dtype=float)
    transformed: list[dict] = []
    standardized: list[dict] = []
    operations = {
        "Yeo-Johnson": PowerTransformer(method="yeo-johnson", standardize=False),
        "QuantileTransformer": QuantileTransformer(output_distribution="normal", random_state=42),
        "MaxAbsScaler": MaxAbsScaler(),
        "Normalizer L2": Normalizer(),
        "FunctionTransformer (log1p)": FunctionTransformer(np.log1p),
    }
    for label, transformer in operations.items():
        values = transformer.fit_transform(transform_input)
        for index, column in enumerate(["SalePrice", "Lot Area"]):
            add_series(transformed, f"{label} · {column}", values[:, index])
        scaled = StandardScaler().fit_transform(values)
        for index, column in enumerate(["SalePrice", "Lot Area"]):
            add_series(standardized, f"{label} + StandardScaler · {column}", scaled[:, index])

    ratios = []
    for column in ["Lot Area", "SalePrice", "Overall Qual"]:
        values = pd.to_numeric(df[column], errors="coerce").dropna()
        ratios.append({"feature": column, "ratio": float(values.max() / values.min())})

    return {"raw": raw, "transformed": transformed, "standardized": standardized, "ratios": ratios}


def main() -> None:
    with urlopen(SOURCE_URL) as response:
        archive = response.read()

    archive_sha256 = hashlib.sha256(archive).hexdigest()
    if archive_sha256 != SOURCE_SHA256:
        raise RuntimeError(
            f"La fuente Ames cambió: se esperaba {SOURCE_SHA256} y se obtuvo {archive_sha256}"
        )

    with zipfile.ZipFile(io.BytesIO(archive)) as zipped:
        csv_name = next(name for name in zipped.namelist() if name.endswith("AmesHousing.csv"))
        df = pd.read_csv(zipped.open(csv_name))

    payload = {
        "source": {"url": SOURCE_URL, "sha256": SOURCE_SHA256, "rows": len(df)},
        "unit05": make_unit05(df),
        "unit06": make_unit06(df),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
