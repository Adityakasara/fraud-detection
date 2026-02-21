"""
Explainability module: SHAP values + human-readable reason codes.
"""
import numpy as np

try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

from ml.preprocessor import load_preprocessor, get_feature_names


def explain_prediction(model, model_meta: dict, X: np.ndarray, top_n: int = 6):
    """
    Returns list of {feature, contribution, direction} for the top-N features,
    plus human-readable reason codes.
    """
    preprocessor, prep_meta = load_preprocessor()
    feature_names = get_feature_names(preprocessor, prep_meta)
    model_type = model_meta.get("model_type", "")
    is_isolation = model_meta.get("is_isolation_forest", False)

    contributions = _get_contributions(model, model_type, X, feature_names, is_isolation)

    # Sort by absolute value
    sorted_contribs = sorted(contributions, key=lambda x: abs(x["contribution"]), reverse=True)[:top_n]

    reason_codes = _build_reason_codes(sorted_contribs)
    return sorted_contribs, reason_codes


def _get_contributions(model, model_type, X, feature_names, is_isolation):
    if HAS_SHAP and not is_isolation:
        try:
            return _shap_contributions(model, model_type, X, feature_names)
        except Exception:
            pass
    # Fallback: feature importance for tree models
    return _feature_importance_contributions(model, X, feature_names, is_isolation)


def _shap_contributions(model, model_type, X, feature_names):
    if model_type in ("random_forest", "xgboost"):
        explainer = shap.TreeExplainer(model)
        values = explainer.shap_values(X)
        # For binary classifiers, values is list [neg_class, pos_class]
        if isinstance(values, list):
            vals = values[1][0]
        else:
            vals = values[0]
    else:
        explainer = shap.LinearExplainer(model, X)
        vals = explainer.shap_values(X)[0]

    contribs = []
    for name, val in zip(feature_names, vals):
        contribs.append({
            "feature": name,
            "contribution": round(float(val), 5),
            "direction": "increases_risk" if val > 0 else "decreases_risk",
        })
    return contribs


def _feature_importance_contributions(model, X, feature_names, is_isolation):
    """Fallback using raw feature importances (trees) or coefficients (LR)."""
    contribs = []
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        # Weight by actual feature values for directionality
        x_vals = X[0]
        for name, imp, xval in zip(feature_names, importances, x_vals):
            direction = "increases_risk" if float(xval) > 0 else "decreases_risk"
            contribs.append({
                "feature": name,
                "contribution": round(float(imp * abs(xval)), 5),
                "direction": direction,
            })
    elif hasattr(model, "coef_"):
        coefs = model.coef_[0]
        x_vals = X[0]
        for name, coef, xval in zip(feature_names, coefs, x_vals):
            val = float(coef * xval)
            contribs.append({
                "feature": name,
                "contribution": round(val, 5),
                "direction": "increases_risk" if val > 0 else "decreases_risk",
            })
    else:
        # IsolationForest — no clean attributions; use raw values
        x_vals = X[0]
        for name, xval in zip(feature_names, x_vals):
            contribs.append({
                "feature": name,
                "contribution": round(abs(float(xval)), 5),
                "direction": "unusual",
            })
    return contribs


def _build_reason_codes(top_contribs):
    """Map top features to human-readable reason codes."""
    KNOWN_PATTERNS = {
        "amount": "Unusually high transaction amount",
        "time": "Transaction at unusual time",
        "hour": "Transaction at unusual hour",
        "v1": "Anomalous anonymized behavior signal V1",
        "v2": "Anomalous anonymized behavior signal V2",
        "v3": "Anomalous anonymized behavior signal V3",
        "v4": "Suspicious pattern in feature V4",
        "v14": "High-risk anonymized signal V14",
        "merchant": "Unusual merchant category",
        "location": "Unfamiliar transaction location",
        "device": "Unrecognized device or browser",
    }

    codes = []
    for item in top_contribs:
        if item["direction"] == "decreases_risk":
            continue
        fname = item["feature"].lower()
        matched = False
        for key, msg in KNOWN_PATTERNS.items():
            if key in fname:
                codes.append(msg)
                matched = True
                break
        if not matched:
            codes.append(f"Elevated contribution from feature '{item['feature']}'")
    return codes[:4]  # Return top 4 reason codes
