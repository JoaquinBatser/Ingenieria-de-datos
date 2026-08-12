"""Generate the prepared data used by the Unit 10 and Unit 11 chart variants.

The calculations intentionally mirror the code published in the corresponding
articles, including the exact train split and the temporal rolling expressions.
Only chart-ready rows are written; the source datasets are not copied into the
site bundle.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import subprocess
import tempfile
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import signal
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer
from sklearn.manifold import TSNE
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

AMES_URL = "https://www.kaggle.com/api/v1/datasets/download/shashanknecrothapa/ames-housing-dataset?datasetVersionNumber=1"
AMES_SHA256 = "fce3f8f24bbc27cf7679f41eee7e51f6447ec8b1fadac5756cc06a42f5990df1"
CALIFORNIA_URL = "https://raw.githubusercontent.com/ageron/handson-ml2/master/datasets/housing/housing.csv"
CALIFORNIA_SHA256 = "8a3727f4cf54ac1a327f69b1d5b4db54c5834ea81c6e4efc0d163300022a685e"
ONLINE_RETAIL_URL = "https://archive.ics.uci.edu/static/public/352/online+retail.zip"
ONLINE_RETAIL_SHA256 = "f5385cbb54bbebf7196389109c6b0621faab0c304e3702548165e71c84aede8b"
OUTPUT_DIRECTORY = Path("src/data/tanstack")


def download(url: str) -> bytes:
    return subprocess.run(
        ["curl", "--fail", "--location", "--silent", "--show-error", url],
        check=True,
        capture_output=True,
    ).stdout


def verify_source(source: bytes, expected_sha256: str, label: str) -> None:
    if hashlib.sha256(source).hexdigest() != expected_sha256:
        raise ValueError(f"The {label} source no longer matches the pinned artifact.")


def round_rows(frame: pd.DataFrame, columns: list[str], digits: int = 6) -> list[dict]:
    output = frame.copy()
    output[columns] = output[columns].round(digits)
    return output.to_dict(orient="records")


def make_unit10(ames_archive: bytes, california_csv: bytes) -> dict:
    with zipfile.ZipFile(io.BytesIO(ames_archive)) as archive:
        ames = pd.read_csv(archive.open("AmesHousing.csv"))

    numerical_columns = ames.select_dtypes(include=["int64", "float64"]).columns.tolist()
    categorical_columns = ames.select_dtypes(include=["object", "str"]).columns.tolist()
    numerical_columns.remove("SalePrice")
    ames[numerical_columns] = SimpleImputer(strategy="median").fit_transform(ames[numerical_columns])
    ames[categorical_columns] = SimpleImputer(strategy="most_frequent").fit_transform(
        ames[categorical_columns]
    )
    label_encoder = LabelEncoder()
    for column in categorical_columns:
        ames[column] = label_encoder.fit_transform(ames[column].astype(str))

    ames_features = ames.drop("SalePrice", axis=1)
    standardized_ames = StandardScaler().fit_transform(ames_features)
    ames_pca = PCA().fit(standardized_ames)
    loadings = ames_pca.components_.T * np.sqrt(ames_pca.explained_variance_)
    loading_frame = pd.DataFrame(
        {"feature": ames_features.columns, "pc1": loadings[:, 0], "pc2": loadings[:, 1]}
    )
    selected_loading_indices = sorted(
        set(loading_frame["pc1"].abs().nlargest(15).index)
        | set(loading_frame["pc2"].abs().nlargest(15).index)
    )
    loading_frame = loading_frame.loc[selected_loading_indices]

    california = pd.read_csv(io.BytesIO(california_csv))
    target_column = "median_house_value"
    california_columns = california.select_dtypes(include=[np.number]).columns.tolist()
    california_columns.remove(target_column)
    california = california[california_columns + [target_column]].dropna()
    features = StandardScaler().fit_transform(california[california_columns].to_numpy())
    target = california[target_column].to_numpy()
    training_features, _, training_target, _ = train_test_split(
        features, target, test_size=0.2, random_state=42
    )

    embedding_pca = PCA(n_components=2)
    pca_rows = embedding_pca.fit_transform(training_features)
    tsne_rows = TSNE(
        n_components=2,
        random_state=42,
        perplexity=30,
        max_iter=1000,
    ).fit_transform(training_features[:500])

    pca_frame = pd.DataFrame(
        {"x": pca_rows[:, 0], "y": pca_rows[:, 1], "target": training_target}
    )
    pca_sample = pca_frame.sample(n=min(6000, len(pca_frame)), random_state=42).sort_index()
    tsne_frame = pd.DataFrame(
        {"x": tsne_rows[:, 0], "y": tsne_rows[:, 1], "target": training_target[:500]}
    )

    return {
        "source": {
            "amesUrl": AMES_URL,
            "amesSha256": hashlib.sha256(ames_archive).hexdigest(),
            "californiaUrl": CALIFORNIA_URL,
            "californiaSha256": hashlib.sha256(california_csv).hexdigest(),
        },
        "loadings": round_rows(loading_frame, ["pc1", "pc2"]),
        "pc1Variance": round(float(ames_pca.explained_variance_ratio_[0]), 6),
        "pc2Variance": round(float(ames_pca.explained_variance_ratio_[1]), 6),
        "pcaEmbedding": round_rows(pca_sample, ["x", "y", "target"], 5),
        "pcaEmbeddingPopulation": len(pca_frame),
        "pcaEmbeddingVariance": round(float(embedding_pca.explained_variance_ratio_.sum()), 6),
        "tsneEmbedding": round_rows(tsne_frame, ["x", "y", "target"], 5),
    }


def histogram_rows(values: pd.Series | np.ndarray, bins: int, series: str) -> list[dict]:
    numeric = pd.Series(values).dropna().to_numpy(dtype=float)
    counts, edges = np.histogram(numeric, bins=bins)
    return [
        {
            "series": series,
            "x1": round(float(left), 6),
            "x2": round(float(right), 6),
            "count": int(count),
        }
        for left, right, count in zip(edges[:-1], edges[1:], counts, strict=True)
    ]


def prepare_orders(retail: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    retail = retail.dropna(subset=["CustomerID"])
    retail = retail[~retail["InvoiceNo"].astype(str).str.startswith("C")]
    retail = retail[(retail["Quantity"] > 0) & (retail["UnitPrice"] > 0)]
    retail = retail.rename(
        columns={
            "CustomerID": "user_id",
            "InvoiceDate": "order_date",
            "InvoiceNo": "order_id",
            "StockCode": "product_id",
            "UnitPrice": "price",
        }
    )
    retail["order_date"] = pd.to_datetime(retail["order_date"])
    retail["total_amount"] = retail["Quantity"] * retail["price"]
    retail = retail.sort_values(["user_id", "order_date"]).reset_index(drop=True)
    retail["order_dow"] = retail["order_date"].dt.dayofweek
    retail["order_hour_of_day"] = retail["order_date"].dt.hour

    orders = (
        retail.groupby(
            ["order_id", "user_id", "order_date", "order_dow", "order_hour_of_day"]
        )
        .agg({"product_id": "count", "total_amount": "sum"})
        .reset_index()
    )
    orders.columns = [
        "order_id",
        "user_id",
        "order_date",
        "order_dow",
        "order_hour_of_day",
        "cart_size",
        "order_total",
    ]
    orders = orders.sort_values(["user_id", "order_date"]).reset_index(drop=True)
    orders["order_number"] = orders.groupby("user_id").cumcount() + 1
    orders["days_since_prior_order"] = orders.groupby("user_id")["order_date"].diff().dt.days

    # These expressions match the published article and therefore the PNGs.
    orders["rolling_cart_mean_3"] = (
        orders.groupby("user_id")["cart_size"]
        .shift(1)
        .rolling(window=3, min_periods=1)
        .mean()
        .reset_index(level=0, drop=True)
    )
    orders["rolling_cart_std_3"] = (
        orders.groupby("user_id")["cart_size"]
        .shift(1)
        .rolling(window=3, min_periods=1)
        .std()
        .reset_index(level=0, drop=True)
    )
    orders["total_orders_so_far"] = orders.groupby("user_id").cumcount()
    orders["expanding_total_spent"] = (
        orders.groupby("user_id")["order_total"]
        .shift(1)
        .expanding(min_periods=1)
        .sum()
        .reset_index(level=0, drop=True)
        .fillna(0)
    )
    return retail, orders


def add_time_windows(orders: pd.DataFrame) -> pd.DataFrame:
    output = orders.copy()
    output[["orders_7d", "orders_30d", "orders_90d"]] = 0
    for _, group in output.groupby("user_id", sort=False):
        indices = group.index.to_numpy()
        dates = group["order_date"].to_numpy(dtype="datetime64[ns]")
        for days, column in [(7, "orders_7d"), (30, "orders_30d"), (90, "orders_90d")]:
            start = 0
            counts = np.zeros(len(group), dtype=int)
            window = np.timedelta64(days, "D")
            for position, date in enumerate(dates):
                while start < position and dates[start] < date - window:
                    start += 1
                counts[position] = position - start
            output.loc[indices, column] = counts
    return output


def make_fourier_rows() -> dict:
    np.random.seed(42)
    sample_count = 1000
    dates = pd.date_range(start="2020-01-01", periods=sample_count, freq="D")
    positions = np.arange(sample_count)
    weekly_pattern = np.sin(2 * np.pi * positions / 7)
    monthly_pattern = np.sin(2 * np.pi * positions / 30)
    quarterly_pattern = np.sin(2 * np.pi * positions / 90)
    trend_input = np.linspace(0, 2, sample_count)
    noise = np.random.normal(0, 0.3, sample_count)
    target_probability = (
        0.3
        + 0.2 * weekly_pattern
        + 0.15 * monthly_pattern
        + 0.1 * quarterly_pattern
        + 0.1 * trend_input
        + noise
    ).clip(0, 1)
    value = 10 + 2 * weekly_pattern + 1.5 * monthly_pattern + np.random.normal(0, 1, sample_count)

    target = (target_probability > 0.5).astype(int)
    frequencies = np.fft.fftfreq(sample_count)
    power = np.abs(np.fft.fft(target)) ** 2
    median_trend = signal.medfilt(value, kernel_size=7)
    detrended = value - median_trend
    seasonal = np.zeros(sample_count)
    for day in range(7):
        mask = dates.dayofweek == day
        seasonal[mask] = detrended[mask].mean()

    temporal_frame = pd.DataFrame(
        {"day": positions, "date": dates.strftime("%Y-%m-%d"), "value": target_probability}
    )
    spectrum_frame = pd.DataFrame(
        {"frequency": frequencies[: sample_count // 2], "power": power[: sample_count // 2]}
    )
    decomposition_rows = []
    for index in range(200):
        date = dates[index].strftime("%Y-%m-%d")
        decomposition_rows.extend(
            [
                {"day": index, "date": date, "series": "Original", "value": value[index]},
                {"day": index, "date": date, "series": "Tendencia", "value": median_trend[index]},
                {
                    "day": index,
                    "date": date,
                    "series": "Tendencia + Estacional",
                    "value": median_trend[index] + seasonal[index],
                },
            ]
        )
    decomposition_frame = pd.DataFrame(decomposition_rows)
    return {
        "series": round_rows(temporal_frame, ["value"]),
        "spectrum": round_rows(spectrum_frame, ["frequency", "power"]),
        "decomposition": round_rows(decomposition_frame, ["value"]),
    }


def make_unit11(retail: pd.DataFrame, retail_source: dict[str, str]) -> dict:
    _, orders = prepare_orders(retail)
    orders = add_time_windows(orders)

    rolling = orders[orders["user_id"] == 12748].head(20).copy()
    rolling["lower"] = rolling["rolling_cart_mean_3"] - rolling["rolling_cart_std_3"].fillna(0)
    rolling["upper"] = rolling["rolling_cart_mean_3"] + rolling["rolling_cart_std_3"].fillna(0)

    reference_date = orders["order_date"].max()
    orders["recency_days"] = (reference_date - orders["order_date"]).dt.days
    orders["frequency_total_orders"] = orders.groupby("user_id")["order_id"].transform("count")
    orders["monetary_avg"] = orders["expanding_total_spent"] / orders[
        "total_orders_so_far"
    ].replace(0, 1)

    window_scatter = orders[["orders_90d", "orders_7d"]].rename(
        columns={"orders_90d": "historical", "orders_7d": "recent"}
    )
    window_scatter_sample = window_scatter.sample(
        n=min(6000, len(window_scatter)), random_state=42
    ).sort_index()
    windows = [
        {"window": "7 días", "orders": round(float(orders["orders_7d"].mean()), 6)},
        {"window": "30 días", "orders": round(float(orders["orders_30d"].mean()), 6)},
        {"window": "90 días", "orders": round(float(orders["orders_90d"].mean()), 6)},
    ]

    rfm = {
        "recency": histogram_rows(orders["recency_days"], 50, "Recency"),
        "frequency": histogram_rows(orders["frequency_total_orders"], 30, "Frequency"),
        "monetary": histogram_rows(orders["monetary_avg"], 50, "Monetary"),
    }

    available_hours = sorted(orders["order_hour_of_day"].unique())
    available_days = sorted(orders["order_dow"].unique())
    cyclic_hours = [
        {
            "period": f"{hour}h",
            "sin": round(float(np.sin(2 * np.pi * hour / 24)), 6),
            "cos": round(float(np.cos(2 * np.pi * hour / 24)), 6),
        }
        for hour in available_hours
    ]
    cyclic_days = [
        {
            "period": str(day),
            "sin": round(float(np.sin(2 * np.pi * day / 7)), 6),
            "cos": round(float(np.cos(2 * np.pi * day / 7)), 6),
        }
        for day in available_days
    ]
    weekend_rows = (
        orders.assign(period=np.where(orders["order_dow"] >= 5, "Weekend", "Weekday"))
        .groupby("period", as_index=False)["cart_size"]
        .mean()
        .rename(columns={"cart_size": "average"})
    )

    rolling_columns = [
        "order_number",
        "cart_size",
        "rolling_cart_mean_3",
        "lower",
        "upper",
    ]
    return {
        "source": retail_source,
        "windows": windows,
        "windowScatter": window_scatter_sample.to_dict(orient="records"),
        "windowScatterPopulation": len(window_scatter),
        "rolling": round_rows(
            rolling[rolling_columns],
            ["cart_size", "rolling_cart_mean_3", "lower", "upper"],
        ),
        "rfm": rfm,
        "cyclicHours": cyclic_hours,
        "cyclicDays": cyclic_days,
        "weekend": round_rows(weekend_rows, ["average"]),
        "fourier": make_fourier_rows(),
        "models": [
            {"method": "Manual Features", "auc": 0.6700, "std": 0.0034},
            {"method": "Manual + Fourier", "auc": 0.6776, "std": 0.0071},
            {"method": "All Features", "auc": 0.6762, "std": 0.0034},
        ],
    }


def load_retail(path: Path | None) -> tuple[pd.DataFrame, dict[str, str]]:
    if path is not None:
        source = path.read_bytes()
        return pd.read_csv(io.BytesIO(source)), {
            "kind": "local-csv-export",
            "path": str(path.resolve()),
            "sha256": hashlib.sha256(source).hexdigest(),
        }

    archive_bytes = download(ONLINE_RETAIL_URL)
    if hashlib.sha256(archive_bytes).hexdigest() != ONLINE_RETAIL_SHA256:
        raise ValueError("The Online Retail source archive no longer matches the pinned artifact.")
    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as archive:
        workbook = archive.read("Online Retail.xlsx")
    with tempfile.NamedTemporaryFile(suffix=".xlsx") as workbook_file:
        workbook_file.write(workbook)
        workbook_file.flush()
        return pd.read_excel(workbook_file.name), {
            "kind": "source-archive",
            "url": ONLINE_RETAIL_URL,
            "sha256": hashlib.sha256(archive_bytes).hexdigest(),
        }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--online-retail-csv",
        type=Path,
        help="Optional CSV export of the UCI workbook (avoids requiring openpyxl).",
    )
    args = parser.parse_args()

    ames_archive = download(AMES_URL)
    california_csv = download(CALIFORNIA_URL)
    verify_source(ames_archive, AMES_SHA256, "Ames")
    verify_source(california_csv, CALIFORNIA_SHA256, "California housing")
    retail, retail_source = load_retail(args.online_retail_csv)

    OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
    payloads = {
        "unit10.json": make_unit10(ames_archive, california_csv),
        "unit11.json": make_unit11(retail, retail_source),
    }
    for filename, payload in payloads.items():
        (OUTPUT_DIRECTORY / filename).write_text(
            json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n"
        )


if __name__ == "__main__":
    main()
