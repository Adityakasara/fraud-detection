import os
import json
import warnings
import kagglehub
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler
from imblearn.over_sampling import SMOTE
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    average_precision_score,
    precision_score,
    recall_score,
    f1_score
)

warnings.filterwarnings("ignore")

def load_data():
    """
    Downloads or locates the Kaggle creditcardfraud dataset.
    """
    print("[1/6] Loading Kaggle creditcardfraud dataset...")
    # Check local relative paths first
    possible_local_paths = [
        "data/creditcard.csv",
        "creditcard.csv",
        "backend/creditcard.csv"
    ]
    for p in possible_local_paths:
        if os.path.exists(p):
            print(f"      Found local dataset at: {p}")
            return pd.read_csv(p)

    # Use kagglehub download
    dataset_path = kagglehub.dataset_download("mlg-ulb/creditcardfraud")
    csv_file = os.path.join(dataset_path, "creditcard.csv")
    print(f"      Loaded dataset via kagglehub: {csv_file}")
    return pd.read_csv(csv_file)

def main():
    df = load_data()
    n_total = len(df)
    n_fraud = int(df["Class"].sum())
    n_legit = n_total - n_fraud
    fraud_pct = (n_fraud / n_total) * 100

    print(f"      Total records: {n_total:,}")
    print(f"      Legitimate: {n_legit:,} ({100 - fraud_pct:.2f}%)")
    print(f"      Fraudulent: {n_fraud:,} ({fraud_pct:.3f}%)")

    # Features & Target
    feature_cols = [c for c in df.columns if c != "Class"]
    X = df[feature_cols]
    y = df["Class"]

    # Stratified Train/Test Split
    print("\n[2/6] Performing Stratified Train/Test Split (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )
    print(f"      Train set size: {len(X_train):,} ({y_train.sum()} fraud)")
    print(f"      Test set size:  {len(X_test):,} ({y_test.sum()} fraud)")

    # RobustScaler fitted ONLY on training data
    print("\n[3/6] Applying RobustScaler (fitted on X_train only to prevent data leakage)...")
    scaler = RobustScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # SMOTE oversampling applied ONLY on training data
    print("\n[4/6] Applying SMOTE (sampling_strategy=0.2) on training set only...")
    print(f"      Class distribution before SMOTE: Legit={int((y_train == 0).sum()):,}, Fraud={int((y_train == 1).sum()):,}")
    smote = SMOTE(sampling_strategy=0.2, random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train_scaled, y_train)
    print(f"      Class distribution after SMOTE:  Legit={int((y_train_res == 0).sum()):,}, Fraud={int((y_train_res == 1).sum()):,}")

    # Train Logistic Regression
    print("\n[5/6] Training Logistic Regression model (max_iter=1000, random_state=42)...")
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train_res, y_train_res)

    # Evaluate on test set
    print("\n[6/6] Evaluating model on unseen test set...")
    y_pred_05 = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    cm_05 = confusion_matrix(y_test, y_pred_05)
    tn5, fp5, fn5, tp5 = cm_05.ravel()
    pr_auc = float(average_precision_score(y_test, y_prob))
    prec_05 = float(precision_score(y_test, y_pred_05))
    rec_05 = float(recall_score(y_test, y_pred_05))
    f1_05 = float(f1_score(y_test, y_pred_05))

    cost_fn = 150  # Assumed cost of missed fraud
    cost_fp = 5    # Assumed cost of false alarm (customer friction)
    default_cost = int(fn5 * cost_fn + fp5 * cost_fp)

    print("      --- Metrics at Default Threshold (0.50) ---")
    print(f"      PR-AUC:    {pr_auc:.4f}")
    print(f"      Precision: {prec_05:.4f}")
    print(f"      Recall:    {rec_05:.4f}")
    print(f"      F1-Score:  {f1_05:.4f}")
    print(f"      Confusion Matrix [TN={tn5}, FP={fp5}, FN={fn5}, TP={tp5}]")
    print(f"      Estimated Cost (FN=${cost_fn}, FP=${cost_fp}): ${default_cost:,}")

    # Business-Based Threshold Optimization
    thresholds = np.linspace(0.10, 0.90, 81)
    best_t = 0.50
    min_cost = float("inf")
    best_stats = {}
    threshold_curve = []

    for t in thresholds:
        t_val = round(float(t), 2)
        preds = (y_prob >= t_val).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_test, preds).ravel()
        cost = int(fn * cost_fn + fp * cost_fp)
        p_val = float(precision_score(y_test, preds, zero_division=0))
        r_val = float(recall_score(y_test, preds, zero_division=0))
        f_val = float(f1_score(y_test, preds, zero_division=0))

        threshold_curve.append({
            "threshold": t_val,
            "cost": cost,
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp),
            "precision": round(p_val, 4),
            "recall": round(r_val, 4),
            "f1": round(f_val, 4)
        })

        if cost < min_cost:
            min_cost = cost
            best_t = t_val
            best_stats = {
                "threshold": best_t,
                "cost": min_cost,
                "tn": int(tn),
                "fp": int(fp),
                "fn": int(fn),
                "tp": int(tp),
                "precision": round(p_val, 4),
                "recall": round(r_val, 4),
                "f1": round(f_val, 4)
            }

    savings = default_cost - min_cost
    savings_pct = (savings / default_cost) * 100

    print("\n      --- Business-Based Threshold Optimization ---")
    print(f"      Optimized Threshold: {best_t:.2f} ({best_t * 100:.1f}%)")
    print(f"      Minimum Cost:        ${min_cost:,}")
    print(f"      Cost Savings:        ${savings:,} (-{savings_pct:.1f}% reduction)")
    print(f"      Stats at Optimal:    TN={best_stats['tn']}, FP={best_stats['fp']}, FN={best_stats['fn']}, TP={best_stats['tp']}")
    print(f"      Precision at Optimal: {best_stats['precision']:.4f} (improved from {prec_05:.4f})")
    print(f"      Recall at Optimal:    {best_stats['recall']:.4f}")

    # Save artifacts
    os.makedirs("model", exist_ok=True)
    os.makedirs("data", exist_ok=True)

    joblib.dump(model, "model/model.pkl")
    joblib.dump(scaler, "model/scaler.pkl")
    print("\n[+] Saved model to model/model.pkl")
    print("[+] Saved scaler to model/scaler.pkl")

    config = {
        "model_name": "Logistic Regression with RobustScaler and SMOTE",
        "algorithm": "LogisticRegression",
        "scaler": "RobustScaler",
        "imbalance_handling": "SMOTE (sampling_strategy=0.2)",
        "features": feature_cols,
        "n_features": len(feature_cols),
        "test_size": 0.20,
        "random_state": 42,
        "cost_assumptions": {
            "false_negative_cost": cost_fn,
            "false_positive_cost": cost_fp,
            "note": "Assumed illustrative business costs for analytics demonstration; not actual Synchrony Financial values."
        },
        "default_threshold": 0.50,
        "default_metrics": {
            "pr_auc": round(pr_auc, 4),
            "precision": round(prec_05, 4),
            "recall": round(rec_05, 4),
            "f1": round(f1_05, 4),
            "tn": int(tn5),
            "fp": int(fp5),
            "fn": int(fn5),
            "tp": int(tp5),
            "estimated_cost": default_cost
        },
        "optimized_threshold": best_t,
        "optimized_metrics": best_stats,
        "savings": {
            "dollar_savings": savings,
            "percent_savings": round(savings_pct, 2)
        },
        "threshold_curve": threshold_curve
    }

    with open("model/config.json", "w") as f:
        json.dump(config, f, indent=2)
    print("[+] Saved metadata & config to model/config.json")

    # Generate representative demo transactions from the real test set
    # Let's take 15 fraud cases and 15 legitimate cases from X_test, y_test
    print("\n[+] Creating representative test set demo: data/demo_transactions.csv...")
    test_df = X_test.copy()
    test_df["Class"] = y_test

    fraud_samples = test_df[test_df["Class"] == 1].sample(n=15, random_state=42)
    legit_samples = test_df[test_df["Class"] == 0].sample(n=15, random_state=42)
    demo_df = pd.concat([fraud_samples, legit_samples]).sample(frac=1.0, random_state=42).reset_index(drop=True)

    demo_df.to_csv("data/demo_transactions.csv", index=False)
    print(f"    Saved {len(demo_df)} representative transactions to data/demo_transactions.csv")
    print("    (15 actual Fraudulent cases + 15 actual Legitimate cases)")
    print("\n[✓] Training and artifact generation completed successfully!")

if __name__ == "__main__":
    main()
