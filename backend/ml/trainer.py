"""
Model training module. Supports Logistic Regression, Random Forest,
XGBoost, and Isolation Forest. Handles class imbalance via class_weight or SMOTE.
"""
import os
import json
import uuid
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

from ml.preprocessor import fit_and_save, transform, detect_target_column

SAVED_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "saved_models")
ACTIVE_MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "active_model.joblib")
ACTIVE_META_PATH = os.path.join(SAVED_MODELS_DIR, "active_model_meta.json")


def train_model(df: pd.DataFrame, model_type: str, imbalance_method: str, test_size: float):
    target_col = detect_target_column(df)
    if target_col is None:
        raise ValueError("No target column found. Expected a column named 'fraud', 'class', 'is_fraud', or 'label'.")

    # Fit preprocessor
    preprocessor, meta = fit_and_save(df, target_col)

    y = df[target_col].astype(int).values
    X = transform(df, preprocessor, meta)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )

    # Handle imbalance
    if imbalance_method == "smote":
        smote = SMOTE(random_state=42)
        X_train, y_train = smote.fit_resample(X_train, y_train)

    use_class_weight = imbalance_method == "class_weight"

    # Build model
    if model_type == "logistic_regression":
        model = LogisticRegression(
            max_iter=1000,
            class_weight="balanced" if use_class_weight else None,
            random_state=42,
        )
    elif model_type == "random_forest":
        model = RandomForestClassifier(
            n_estimators=100,
            class_weight="balanced" if use_class_weight else None,
            random_state=42,
            n_jobs=-1,
        )
    elif model_type == "xgboost":
        if not HAS_XGB:
            raise ImportError("xgboost not installed.")
        scale_pos = float(np.sum(y_train == 0) / np.sum(y_train == 1)) if use_class_weight else 1.0
        model = XGBClassifier(
            n_estimators=100,
            scale_pos_weight=scale_pos,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        )
    elif model_type == "isolation_forest":
        contamination = float(np.sum(y == 1) / len(y))
        model = IsolationForest(contamination=contamination, random_state=42, n_jobs=-1)
    else:
        raise ValueError(f"Unknown model type: {model_type}")

    model.fit(X_train, y_train)

    model_version = f"{model_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    joblib.dump(model, ACTIVE_MODEL_PATH)

    active_meta = {
        "model_type": model_type,
        "model_version": model_version,
        "imbalance_method": imbalance_method,
        "is_isolation_forest": model_type == "isolation_forest",
    }
    with open(ACTIVE_META_PATH, "w") as f:
        json.dump(active_meta, f)

    return model, X_test, y_test, model_version, active_meta


def load_active_model():
    model = joblib.load(ACTIVE_MODEL_PATH)
    with open(ACTIVE_META_PATH) as f:
        meta = json.load(f)
    return model, meta
