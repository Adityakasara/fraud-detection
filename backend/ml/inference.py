"""
Inference module: single-row and batch prediction.
"""
import uuid
import numpy as np
import pandas as pd

from ml.preprocessor import load_preprocessor, transform
from ml.trainer import load_active_model


def predict_single(features: dict) -> dict:
    model, model_meta = load_active_model()
    preprocessor, prep_meta = load_preprocessor()

    df = pd.DataFrame([features])
    X = transform(df, preprocessor, prep_meta)

    is_isolation = model_meta.get("is_isolation_forest", False)

    if is_isolation:
        raw = model.score_samples(X)[0]
        # Normalize — we don't know global min/max so use heuristic
        risk_score = float(np.clip(1 - (raw + 0.5), 0, 1))
        fraud_label = int(risk_score > 0.5)
    else:
        proba = model.predict_proba(X)[0]
        risk_score = float(proba[1])
        fraud_label = int(risk_score > 0.5)

    return {
        "transaction_id": str(uuid.uuid4()),
        "fraud_label": fraud_label,
        "risk_score": round(risk_score, 4),
        "X": X,
        "model_meta": model_meta,
    }


def predict_batch(df: pd.DataFrame) -> list:
    model, model_meta = load_active_model()
    preprocessor, prep_meta = load_preprocessor()

    X = transform(df, preprocessor, prep_meta)
    is_isolation = model_meta.get("is_isolation_forest", False)

    if is_isolation:
        raw_scores = model.score_samples(X)
        min_s, max_s = raw_scores.min(), raw_scores.max()
        risk_scores = 1 - (raw_scores - min_s) / (max_s - min_s + 1e-9)
    else:
        risk_scores = model.predict_proba(X)[:, 1]

    results = []
    for i, (score, row) in enumerate(zip(risk_scores, df.itertuples(index=False))):
        results.append({
            "row_index": i,
            "fraud_label": int(score > 0.5),
            "risk_score": round(float(score), 4),
        })
    return results, X, model_meta
