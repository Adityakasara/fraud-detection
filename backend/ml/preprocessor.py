"""
Data preprocessing pipeline: handles missing values, scaling, encoding.
Persists the fitted pipeline via joblib.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

SAVED_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "saved_models")
PIPELINE_PATH = os.path.join(SAVED_MODELS_DIR, "preprocessor.joblib")
FEATURE_META_PATH = os.path.join(SAVED_MODELS_DIR, "feature_meta.json")

# Columns that should NOT be used as features
EXCLUDE_COLS = {"transaction_id", "id", "card_number", "customer_id", "name"}
TARGET_ALIASES = {"class", "fraud", "is_fraud", "label", "target"}


def detect_target_column(df: pd.DataFrame) -> str:
    for col in df.columns:
        if col.strip().lower() in TARGET_ALIASES:
            return col
    return None


def get_feature_columns(df: pd.DataFrame, target_col: str):
    exclude = EXCLUDE_COLS | {target_col.lower()}
    numeric_cols = []
    categorical_cols = []
    for col in df.columns:
        if col.strip().lower() in exclude:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            numeric_cols.append(col)
        else:
            categorical_cols.append(col)
    return numeric_cols, categorical_cols


def build_preprocessor(numeric_cols, categorical_cols):
    numeric_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    steps = [("num", numeric_pipeline, numeric_cols)]

    if categorical_cols:
        categorical_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ])
        steps.append(("cat", categorical_pipeline, categorical_cols))

    return ColumnTransformer(steps, remainder="drop")


def fit_and_save(df: pd.DataFrame, target_col: str):
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    numeric_cols, categorical_cols = get_feature_columns(df, target_col)
    preprocessor = build_preprocessor(numeric_cols, categorical_cols)
    X = df[numeric_cols + categorical_cols]
    preprocessor.fit(X)
    joblib.dump(preprocessor, PIPELINE_PATH)
    meta = {
        "numeric_cols": numeric_cols,
        "categorical_cols": categorical_cols,
        "target_col": target_col,
    }
    with open(FEATURE_META_PATH, "w") as f:
        json.dump(meta, f)
    return preprocessor, meta


def load_preprocessor():
    preprocessor = joblib.load(PIPELINE_PATH)
    with open(FEATURE_META_PATH) as f:
        meta = json.load(f)
    return preprocessor, meta


def transform(df: pd.DataFrame, preprocessor, meta: dict) -> np.ndarray:
    numeric_cols = meta["numeric_cols"]
    categorical_cols = meta["categorical_cols"]
    all_cols = numeric_cols + categorical_cols
    # Fill any missing columns with NaN
    for col in all_cols:
        if col not in df.columns:
            df[col] = np.nan
    return preprocessor.transform(df[all_cols])


def get_feature_names(preprocessor, meta: dict):
    """Return ordered list of feature names after transformation."""
    numeric_cols = meta["numeric_cols"]
    categorical_cols = meta["categorical_cols"]
    names = list(numeric_cols)
    if categorical_cols:
        ohe = preprocessor.named_transformers_["cat"]["encoder"]
        names += list(ohe.get_feature_names_out(categorical_cols))
    return names
