"""
COVID-19 Model Trainer
Loads covid_cases.csv and environmental_data.csv, engineers features,
trains a RandomForestRegressor (case prediction) and IsolationForest
(anomaly detection), then saves both as pickle files.
"""

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
from sklearn.preprocessing import LabelEncoder

BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR   = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "backend", "models")
os.makedirs(MODELS_DIR, exist_ok=True)


# ─── Load data ────────────────────────────────────────────────────────────────

def load_and_merge() -> pd.DataFrame:
    print("Loading datasets…")
    cases_path = os.path.join(DATA_DIR, "covid_cases.csv")
    env_path   = os.path.join(DATA_DIR, "environmental_data.csv")

    cases = pd.read_csv(cases_path, parse_dates=["date"])
    env   = pd.read_csv(env_path,   parse_dates=["date"])

    print(f"  covid_cases.csv     : {len(cases)} rows")
    print(f"  environmental_data  : {len(env)} rows")

    # Merge on date + state (nearest available)
    cases_agg = (
        cases.groupby(["date", "state"], as_index=False)
             .agg(
                 new_cases_daily=("new_cases_daily", "sum"),
                 new_deaths_daily=("new_deaths_daily", "sum"),
                 confirmed_cases=("confirmed_cases", "sum"),
                 case_fatality_rate=("case_fatality_rate", "mean"),
                 recovery_rate=("recovery_rate", "mean"),
                 testing_rate_per_100k=("testing_rate_per_100k", "mean"),
             )
    )

    env_agg = (
        env.groupby(["date", "state"], as_index=False)
           .agg(
               temperature_celsius=("temperature_celsius", "mean"),
               humidity_percent=("humidity_percent", "mean"),
               air_quality_index=("air_quality_index", "mean"),
               pollution_pm25=("pollution_pm25", "mean"),
               population_density=("population_density", "mean"),
               mobility_index=("mobility_index", "mean"),
               lockdown_level=("lockdown_level", "mean"),
               vaccination_coverage_percent=("vaccination_coverage_percent", "mean"),
           )
    )

    merged = pd.merge(cases_agg, env_agg, on=["date", "state"], how="inner")
    print(f"  Merged rows         : {len(merged)}")
    return merged


# ─── Feature engineering ─────────────────────────────────────────────────────

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    print("Engineering features…")
    df = df.sort_values(["state", "date"]).reset_index(drop=True)

    # Rolling averages per state
    df["rolling_7day_avg"]  = (
        df.groupby("state")["new_cases_daily"]
          .transform(lambda x: x.rolling(7,  min_periods=1).mean())
    )
    df["rolling_14day_avg"] = (
        df.groupby("state")["new_cases_daily"]
          .transform(lambda x: x.rolling(14, min_periods=1).mean())
    )

    # Growth rate: (today - yesterday) / yesterday
    df["prev_day_cases"] = (
        df.groupby("state")["new_cases_daily"].shift(1)
    )
    df["growth_rate"] = (
        (df["new_cases_daily"] - df["prev_day_cases"])
        / df["prev_day_cases"].replace(0, np.nan)
    ).fillna(0).clip(-1, 10)

    # Doubling time: ln(2) / growth_rate  (capped to avoid inf)
    df["doubling_time"] = np.where(
        df["growth_rate"] > 0.001,
        np.log(2) / df["growth_rate"].clip(lower=0.001),
        365.0
    )

    # Day-of-year and year as numeric features
    df["day_of_year"] = df["date"].dt.dayofyear
    df["year"]        = df["date"].dt.year

    # Encode state
    le = LabelEncoder()
    df["state_encoded"] = le.fit_transform(df["state"].astype(str))

    df.drop(columns=["prev_day_cases"], inplace=True)
    print(f"  Feature-engineered dataframe: {df.shape}")
    return df


# ─── Train RandomForestRegressor ──────────────────────────────────────────────

FEATURE_COLS = [
    "rolling_7day_avg", "rolling_14day_avg", "growth_rate", "doubling_time",
    "temperature_celsius", "humidity_percent", "air_quality_index",
    "pollution_pm25", "population_density", "mobility_index",
    "lockdown_level", "vaccination_coverage_percent",
    "case_fatality_rate", "recovery_rate", "testing_rate_per_100k",
    "day_of_year", "year", "state_encoded",
]

TARGET_COL = "new_cases_daily"


def train_rf(df: pd.DataFrame) -> RandomForestRegressor:
    print("Training RandomForestRegressor…")
    feat_cols = [c for c in FEATURE_COLS if c in df.columns]
    data = df[feat_cols + [TARGET_COL]].dropna()

    X = data[feat_cols].values
    y = data[TARGET_COL].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    rf = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)

    train_r2 = r2_score(y_train, rf.predict(X_train))
    test_r2  = r2_score(y_test,  rf.predict(X_test))
    print(f"  RandomForest  Train R²: {train_r2:.4f}  |  Test R²: {test_r2:.4f}")
    return rf


# ─── Train IsolationForest ────────────────────────────────────────────────────

ISO_FEATURE_COLS = [
    "new_cases_daily", "new_deaths_daily", "rolling_7day_avg",
    "growth_rate", "doubling_time", "lockdown_level",
    "vaccination_coverage_percent",
]


def train_iso(df: pd.DataFrame) -> IsolationForest:
    print("Training IsolationForest (anomaly detection)…")
    feat_cols = [c for c in ISO_FEATURE_COLS if c in df.columns]
    data = df[feat_cols].dropna()

    iso = IsolationForest(
        n_estimators=150,
        contamination=0.05,
        random_state=42,
        n_jobs=-1,
    )
    iso.fit(data.values)

    preds         = iso.predict(data.values)
    anomaly_count = (preds == -1).sum()
    print(f"  IsolationForest anomalies detected: {anomaly_count} / {len(data)}")
    return iso


# ─── Save models ─────────────────────────────────────────────────────────────

def save_model(model, filename: str) -> None:
    path = os.path.join(MODELS_DIR, filename)
    with open(path, "wb") as f:
        pickle.dump(model, f)
    size_kb = os.path.getsize(path) / 1024
    print(f"  Saved: {path}  ({size_kb:.1f} KB)")


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("COVID-19 Model Training Pipeline")
    print("=" * 60)

    df         = load_and_merge()
    df         = engineer_features(df)
    rf_model   = train_rf(df)
    iso_model  = train_iso(df)

    print("Saving models…")
    save_model(rf_model,  "rf_model.pkl")
    save_model(iso_model, "iso_model.pkl")

    print()
    print("=" * 60)
    print("Verification:")
    for fname in ["rf_model.pkl", "iso_model.pkl"]:
        fpath = os.path.join(MODELS_DIR, fname)
        if os.path.exists(fpath):
            size_kb = os.path.getsize(fpath) / 1024
            print(f"  {fname:20s}  ✓ exists  ({size_kb:.1f} KB)")
        else:
            print(f"  {fname:20s}  MISSING!")
    print("=" * 60)
    print("Training complete.")
