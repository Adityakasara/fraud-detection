"""
Model evaluation: Precision, Recall, F1, PR-AUC, Confusion Matrix,
PR Curve, and score distribution data.
"""
import numpy as np
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    average_precision_score, confusion_matrix,
    precision_recall_curve,
)


def evaluate(model, X_test, y_test, model_type: str):
    is_isolation = model_type == "isolation_forest"

    if is_isolation:
        # IsolationForest: score_samples → lower = more anomalous
        raw_scores = model.score_samples(X_test)
        # Normalize to 0–1 fraud probability (invert and scale)
        min_s, max_s = raw_scores.min(), raw_scores.max()
        risk_scores = 1 - (raw_scores - min_s) / (max_s - min_s + 1e-9)
        y_pred = (risk_scores > 0.5).astype(int)
    else:
        proba = model.predict_proba(X_test)
        risk_scores = proba[:, 1]
        y_pred = (risk_scores > 0.5).astype(int)

    precision = float(precision_score(y_test, y_pred, zero_division=0))
    recall = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))

    try:
        pr_auc = float(average_precision_score(y_test, risk_scores))
    except Exception:
        pr_auc = 0.0

    cm = confusion_matrix(y_test, y_pred).tolist()

    # PR Curve points (downsample to 100 pts for JSON size)
    prec_pts, rec_pts, _ = precision_recall_curve(y_test, risk_scores)
    step = max(1, len(prec_pts) // 100)
    pr_curve = {
        "precision": prec_pts[::step].tolist(),
        "recall": rec_pts[::step].tolist(),
    }

    # Score distribution (20 bins)
    fraud_scores = risk_scores[y_test == 1]
    legit_scores = risk_scores[y_test == 0]
    bins = np.linspace(0, 1, 21)
    fraud_hist, _ = np.histogram(fraud_scores, bins=bins)
    legit_hist, _ = np.histogram(legit_scores, bins=bins)

    score_distribution = {
        "bins": [round((bins[i] + bins[i + 1]) / 2, 3) for i in range(20)],
        "fraud": fraud_hist.tolist(),
        "legitimate": legit_hist.tolist(),
    }

    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "pr_auc": pr_auc,
        "confusion_matrix": cm,
        "pr_curve": pr_curve,
        "score_distribution": score_distribution,
    }
