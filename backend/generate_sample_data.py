"""
Synthetic dataset generator for testing.
Generates a CSV mimicking the Kaggle credit card fraud dataset structure.
Usage: python generate_sample_data.py
Output: sample_creditcard.csv (10,000 rows, ~1.7% fraud)
"""
import numpy as np
import pandas as pd

np.random.seed(42)

N = 10_000
FRAUD_RATE = 0.017
n_fraud = int(N * FRAUD_RATE)
n_legit = N - n_fraud

# Generate anonymized PCA features V1–V28 (like Kaggle dataset)
def make_rows(n, is_fraud):
    rows = {}
    rows["Time"] = np.random.uniform(0, 172800, n)
    for i in range(1, 29):
        mean = np.random.uniform(-2, 2) if is_fraud else np.random.uniform(-0.5, 0.5)
        rows[f"V{i}"] = np.random.normal(mean, 1.5, n)
    rows["Amount"] = (
        np.random.exponential(200, n) if not is_fraud
        else np.random.exponential(500, n)
    )
    rows["Class"] = int(is_fraud)
    return pd.DataFrame(rows)

legit_df = make_rows(n_legit, False)
fraud_df = make_rows(n_fraud, True)
df = pd.concat([legit_df, fraud_df], ignore_index=True).sample(frac=1, random_state=42)
df.to_csv("sample_creditcard.csv", index=False)
print(f"Generated sample_creditcard.csv: {len(df)} rows ({n_fraud} fraud, {n_legit} legitimate)")
