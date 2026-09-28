# 💡 Explaining this Fraud Detection Project for Synchrony Analytics

This guide gives you the exact script, numbers, and business rationale to present this project with total confidence in a **3–5 minute Synchrony Analytics interview**.

---

## 🎯 1. The 45-Second Core Elevator Pitch (Memorize This)

> *"I worked on a credit card fraud detection problem with severe class imbalance, where fraud represents only 0.17% of transactions. I first split the dataset using stratification, then applied RobustScaler fitted strictly on training data to prevent data leakage. Because fraud was such a rare minority class, I applied SMOTE only to the training set to bring it to a 20% ratio.*
>
> *I trained an interpretable Logistic Regression model and evaluated it using Precision, Recall, F1, and PR-AUC rather than misleading accuracy. The key differentiator was business-based threshold optimization: instead of blindly accepting the default 0.50 cutoff, I modeled asymmetric business costs—assuming a \$150 cost for missed fraud and \$5 for customer false alarm friction. By sweeping thresholds, I found that an optimal threshold of 0.84 reduced false positive customer insults by 76.6% and cut estimated business costs by 38.7% while catching the exact same 87 fraud cases.*
>
> *Finally, I deployed the trained model into an interactive Streamlit application where any transaction can be scored live in milliseconds."*

---

## 🏛️ 2. Synchrony Business Context (Why This Rings True)

Synchrony Financial (NYSE: SYF) is the premier private-label credit card (PLCC) issuer in the United States, backing retail partnerships with **Amazon, Lowe's, Sam's Club, PayPal, and CareCredit**.

In retail financing analytics:
1. **The Asymmetry of Fraud**:
   - **False Negative (Missed Fraud)**: Direct chargeback dollar loss and write-off.
   - **False Positive (Customer Insult)**: Declining a legitimate cardholder at checkout register. This damages the retail partner relationship (e.g. Amazon or Lowe's losing a sale GMV) and causes cardholder churn.
2. **Why Accuracy is a Trap**:
   - In a dataset with 99.83% legitimate transactions, predicting "Legitimate" 100% of the time yields 99.83% accuracy while stopping **zero fraud**.
   - PR-AUC (Precision-Recall AUC) of **0.7388** measures genuine minority-class identification.
3. **Threshold Calibration**:
   - The default `0.50` threshold assumes equal penalty for false positives and false negatives. 
   - Aligning the decision cutoff to business economics turns a theoretical ML model into a decision engine that saves money and protects partner relationships.

---

## 📊 3. Exact Model Numbers & Results (Keep These Ready)

| Metric | Training Setup / Default (0.50) | Optimized Threshold (0.84) |
|---|:---:|:---:|
| **Dataset Size** | 284,807 transactions | 56,962 test set transactions |
| **Fraud Prevalence** | 492 cases (0.173%) | 98 test fraud cases |
| **Imbalance Handling** | SMOTE (sampling_strategy=0.2) on train only | 45,490 synthetic fraud in train |
| **PR-AUC Score** | `0.7388` | `0.7388` |
| **Precision** | `20.52%` (87 TP / 424 flagged) | **`52.41%` (87 TP / 166 flagged)** |
| **Recall** | `88.78%` (87 / 98 caught) | **`88.78%` (87 / 98 caught)** |
| **False Positives (Customer Insults)** | 337 | **79 (-76.6% drop)** |
| **Missed Fraud (False Negatives)** | 11 | **11 (Zero increase)** |
| **Estimated Financial Cost** (FN=\$150, FP=\$5) | \$3,335 | **\$2,045 (\$1,290 / 38.7% savings)** |

---

## 🎬 4. The 60-Second Live Streamlit Demo Walkthrough

When you share your screen:

1. **Launch Streamlit**:
   ```bash
   streamlit run app.py
   ```
2. **Point to Sidebar**:
   - *"Notice the model and scaler are pre-loaded and cached. The optimal threshold is dynamically configured at 84% based on cost optimization."*
3. **Demo Step 1: Legitimate Transaction**:
   - Under **Option A**, select `Transaction #01` (Amount: \$0.77).
   - Click **"Analyze Transaction"**.
   - Show:
     - Fraud Probability: **0.51%**
     - Model Risk Score: **0.5 / 100**
     - Decision: 🟢 **LEGITIMATE**
   - Comment: *"The model correctly identifies low risk; this transaction is approved with zero customer friction."*
4. **Demo Step 2: Fraudulent Transaction**:
   - Select `Transaction #05` (Amount: \$385.00).
   - Click **"Analyze Transaction"**.
   - Show:
     - Fraud Probability: **99.98%**
     - Model Risk Score: **100.0 / 100**
     - Decision: 🔴 **FRAUD**
   - Comment: *"The probability cleanly crosses our 84% threshold, flagging the transaction for secondary authentication or hold."*
5. **Demo Step 3 (If Asked): Batch Analysis**:
   - Switch to **Option B**, upload `data/demo_transactions.csv`, and show multi-row scoring and CSV export.

---

## 💬 5. Tough Interview Questions & How to Defend Them

### Q1: *"Why did you use Logistic Regression instead of XGBoost or a Deep Neural Network?"*
> **Answer:** *"In banking analytics and credit risk, interpretability, regulatory explainability, and speed are critical. Logistic Regression provides well-calibrated probabilities that directly map to risk scoring. Because my goal was sound analytical reasoning, leak-free preprocessing, and cost-based threshold tuning, a clean Logistic Regression baseline allowed me to demonstrate end-to-end business value without black-box complexity."*

### Q2: *"Why did you apply SMOTE only on training data and not on the whole dataset?"*
> **Answer:** *"Applying SMOTE before train/test splitting is a critical data leakage error. SMOTE creates synthetic samples interpolated between nearest neighbors. If applied globally, synthetic points in the training set would be generated using test set information, causing artificially optimistic test evaluation. Furthermore, the test set must reflect the real-world operational fraud prevalence of 0.17%."*

### Q3: *"Why RobustScaler instead of StandardScaler?"*
> **Answer:** *"Credit card transaction amounts and timestamps have extreme outliers—most purchases are under \$50, but occasional transactions exceed \$10,000. StandardScaler relies on the mean and standard deviation, which are heavily distorted by outliers. RobustScaler uses the median and Interquartile Range (IQR), making the feature scaling robust against extreme transaction spikes."*

### Q4: *"How did you determine the \$150 and \$5 cost values?"*
> **Answer:** *"These are assumed illustrative values chosen to reflect the business asymmetry between fraud chargebacks and customer friction. In an actual role at Synchrony, I would collaborate with fraud operations and merchant partnership teams to pull real loss metrics: the average net recovery loss per chargeback for FN, and the merchant interchange and customer service handling cost per false alert for FP. The optimization curve logic would remain identical."*

### Q5: *"Why did shifting threshold from 0.50 to 0.84 not hurt fraud recall?"*
> **Answer:** *"Because the model is confident on genuine fraud cases, assigning them probabilities near 0.95–1.0. Between 0.50 and 0.84 lay 258 ambiguous borderline legitimate transactions. Shifting the threshold eliminated those 258 false customer alerts without crossing the probability mass of the 87 true positive frauds."*
