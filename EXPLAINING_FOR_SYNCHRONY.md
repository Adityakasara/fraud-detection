# 💡 How to Explain this Fraud Detection Project for an Analytics Role at Synchrony

This guide gives you the exact talking points, metrics, and business rationale to present this project confidently in an interview at **Synchrony Financial** (or any credit card / retail financing risk analytics team).

---

## 🎯 1. The 30-Second Elevator Pitch

> *"I built **FraudShield**, an end-to-end credit card fraud detection system designed to solve the exact trade-off faced by retail credit card issuers like Synchrony. Using extreme class-imbalance machine learning and TreeSHAP explainability, the system scores transactions in real time, minimizes chargeback losses, avoids unnecessary customer friction at checkout, and generates regulatory-compliant reason codes for adverse action notices."*

---

## 🏛️ 2. The Synchrony Business Context (Why This Matters)

Synchrony Financial (NYSE: SYF) is the largest issuer of private-label credit cards (PLCC) in the US, financing over **$180 Billion in annual purchase volume** across marquee retail partners:
- **Digital**: Amazon Store Card, PayPal Cashback Mastercard, Venmo Credit Card
- **Retail & Home**: Lowe's Advantage Card, Sam's Club Mastercard, TJX Companies
- **Health & Wellness**: CareCredit (medical, dental, veterinary financing)

### Key Concept: The "Insult Rate" vs. Fraud Loss
- In traditional banking, declining a transaction is between the bank and the customer.
- At Synchrony, **merchant partner relationships are on the line**. If fraud rules are overly aggressive, good customers are declined at the checkout register (called the **Customer Insult Rate** or False Alarm Ratio). Retail partners like Amazon or Lowe's lose sales GMV and get furious.
- Therefore, a fraud analyst at Synchrony must optimize the balance between:
  1. **Fraud Loss Basis Points (bps)**: $\left(\frac{\text{Fraud Loss \$}}{\text{Purchase Volume \$}}\right) \times 10,000$ (Target is typically <15 bps).
  2. **Approval Rate**: Maintaining >97.5% frictionless approvals.

---

## 📊 3. Technical & Modeling Highlights

### A. Severe Class Imbalance (0.17% Rare Events)
- In the real world, only ~17 out of every 10,000 transactions are fraud (0.17%).
- **Why Accuracy is a trap**: A naive model that classifies every transaction as "legitimate" achieves **99.83% accuracy** while catching 0% of fraud!
- **How we handle it**: 
  - `class_weight='balanced'` to penalize misclassifications on minority fraud cases.
  - SMOTE (Synthetic Minority Over-sampling Technique) for balanced decision boundary learning.

### B. Why We Use PR-AUC Over ROC-AUC
- In rare-event fraud, ROC-AUC is misleading because the False Positive Rate denominator includes millions of True Negatives, making ROC-AUC look artificially high (0.98+).
- **Precision-Recall AUC (PR-AUC)** focuses strictly on the minority fraud class (Precision vs. Recall). It is the industry gold standard in banking fraud analytics.

### C. Regulatory Explainability (FCRA & ECOA Compliance)
- Federal banking regulations (Fair Credit Reporting Act and Equal Credit Opportunity Act) mandate that when a customer or transaction is declined or challenged, the bank **must provide the principal reason codes**. Black-box models cannot be deployed without explainability.
- We integrate **TreeSHAP (Shapley Additive exPlanations)** to compute local feature contributions for every transaction and translate them into human-readable reason codes (e.g. *Unusually high transaction amount*, *Velocity pattern anomaly*).

---

## 🎬 4. How to Walk Through the Live Demo

Follow these 4 steps in your interview:

1. **Dashboard (`/dashboard`)**:
   - Show the total transaction volume, fraud rate, and daily trends.
   - Mention: *"This monitors the portfolio health in real time, tracking flagged transaction volume and top high-risk accounts."*
2. **Model Metrics (`/metrics`)**:
   - Highlight the **PR-AUC curve** and **Confusion Matrix**.
   - Mention: *"Notice how the score distribution cleanly separates normal transactions (clustered near 0.0) from anomalous transactions (clustered near 1.0). This separation allows us to tune our decision threshold based on business costs."*
3. **Live Predictor (`/predict`)**:
   - Click the **`🟢 Clean Transaction`** preset and click "Predict".
     - Show: Risk Score ~0%, status "LEGITIMATE".
   - Click the **`🔴 Stolen Card Attack`** preset and click "Predict".
     - Show: Risk Score ~95%, status "FRAUD DETECTED".
     - Point out the **SHAP feature contribution bars** and the generated **Reason Codes**.
     - Mention: *"Notice how SHAP highlights the exact behavioral features that increased risk, satisfying FCRA adverse action compliance."*
4. **Retraining & Imbalance Handling (`/train`)**:
   - Explain how the pipeline supports Random Forest, Logistic Regression, and Isolation Forest with SMOTE or class-weighting.

---

## 💬 5. Top 3 Questions You Might Get & How to Answer

### Q1: *"How would you decide where to set the fraud threshold in production?"*
> **Answer**: *"I would construct a cost-benefit matrix balancing the dollar loss of missed fraud against the customer lifetime value (LTV) and interchange lost from a false positive. By sweeping the threshold across the PR curve, we find the cutoff that maximizes net P&L while keeping the customer insult ratio within our partner SLA (e.g., fewer than 4 false positives per true fraudster blocked)."*

### Q2: *"How does this pipeline prevent data leakage?"*
> **Answer**: *"Preprocessing (imputation, standard scaling) is fit strictly on the training partition via an isolated `ColumnTransformer` and persisted as an artifact. Feature engineering uses past historical rolling statistics, ensuring future transaction data is never leaked into training."*

### Q3: *"How do you monitor for model drift once deployed?"*
> **Answer**: *"We track two types of drift: Data Drift (using Population Stability Index (PSI) on incoming feature distributions) and Concept Drift (monitoring chargeback lag and changes in the PR-AUC curve over rolling 30-day cohorts)."*
