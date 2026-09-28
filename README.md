# Credit Card Fraud Detection

An interview-ready end-to-end Machine Learning and Analytics project designed to solve real-world credit card transaction risk scoring under severe class imbalance (0.17% fraud rate), featuring cost-based decision threshold optimization and an interactive live Streamlit demo.

[![Streamlit App](https://img.shields.io/badge/Demo-Streamlit-FF4B4B?style=flat-square&logo=streamlit)](http://localhost:8501)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9%2B-blue?style=flat-square&logo=python)](https://www.python.org/)
[![scikit-learn](https://img.shields.io/badge/Library-scikit--learn-F7931E?style=flat-square&logo=scikit-learn)](https://scikit-learn.org/)

---

## Problem Statement

Fraud detection is a classic **extreme class imbalance** classification problem where missing a fraudulent transaction (False Negative) and incorrectly declining or challenging a legitimate customer (False Positive / Customer Insult) carry radically different business consequences. 

In retail credit card issuing (such as Synchrony Financial's store credit card partnerships with Amazon, Lowe's, Sam's Club, and PayPal):
1. **False Negative (Missed Fraud)** leads to direct chargeback financial losses and operational write-offs.
2. **False Positive (Customer Insult)** creates checkout friction, frustrates legitimate cardholders at the register, and damages merchant partner GMV and brand loyalty.

Standard machine learning models defaulted to an arbitrary `0.50` decision threshold fail to capture this asymmetry. This project builds a transparent, leakage-free pipeline and optimizes the classification threshold specifically to minimize total estimated financial cost.

---

## Dataset

This project uses the benchmark [ULB / Kaggle Credit Card Fraud Detection Dataset](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud):
- **Total Transactions:** 284,807 transactions recorded over two days in September 2013 by European cardholders.
- **Fraudulent Transactions:** 492 cases (**0.173%** of all transactions).
- **Legitimate Transactions:** 284,315 cases (**99.827%**).
- **Features (30 total input columns):**
  - `Time`: Elapsed seconds between this transaction and the first transaction in the dataset.
  - `V1`–`V28`: Principal components obtained via PCA (anonymized for privacy protection).
  - `Amount`: Transaction amount in Euros (ranges from €0.00 to €25,691.16, exhibiting severe right-skew and extreme outliers).
- **Target:** `Class` (`0` = Legitimate, `1` = Fraudulent).

---

## Approach & Pipeline

```
Dataset (284,807 transactions, 0.17% fraud)
   ↓
Train/Test Split (Stratified 80/20, preserving 0.17% fraud proportion)
   ↓
RobustScaler (Fitted strictly on X_train to prevent data leakage)
   ↓
SMOTE (Applied strictly on X_train_scaled to 20% minority ratio)
   ↓
Logistic Regression (max_iter=1000, random_state=42)
   ↓
Model Evaluation (Precision, Recall, F1, PR-AUC, Confusion Matrix)
   ↓
Cost-Based Threshold Optimization (Testing cutoffs 0.10 → 0.90 with FN=$150, FP=$5)
   ↓
Live Streamlit Prediction Demo (Instant transaction scoring & batch CSV analysis)
```

---

## Why These Techniques?

| Technique | Rationale & Interview Talking Point |
|---|---|
| **Stratified Split (80/20)** | Fraud occurs in only ~17 out of every 10,000 transactions. A random split could cause severe variance in fraud representation across splits; stratification guarantees both train and test partitions preserve the exact 0.173% minority distribution. |
| **RobustScaler** | The `Amount` and `Time` features contain extreme outliers. Standard scaling (mean/variance) is skewed heavily by outliers. `RobustScaler` uses the median and Interquartile Range (IQR, 25th–75th percentiles), ensuring robust scaling. |
| **Fit Scaler on Training Only** | **Preventing Data Leakage**: Fitting a scaler on the whole dataset leaks test-set distributional parameters into training. We strictly use `scaler.fit_transform(X_train)` and `scaler.transform(X_test)`. |
| **SMOTE (20% ratio)** | Raw 0.17% balance causes classifiers to predict legitimate nearly 100% of the time. Synthetic Minority Over-sampling Technique (SMOTE) generates synthetic samples along minority feature vectors, raising minority ratio to 20% (`sampling_strategy=0.2`) to provide a balanced decision surface. |
| **SMOTE on Training Only** | Applying oversampling to test data creates synthetic, unrealistic test samples and leaks synthetic boundaries. The test set must reflect untouched real-world transaction distributions. |
| **Logistic Regression** | Interpretable, probabilistically well-behaved linear model. It provides smooth risk probabilities essential for fine-grained threshold sweeps, avoiding black-box complexity. |
| **PR-AUC over ROC-AUC** | Under severe class imbalance, ROC-AUC is artificially inflated because the huge number of True Negatives drives the False Positive Rate denominator (`FP / (FP + TN)`) to near-zero. **Precision-Recall AUC (PR-AUC)** focuses strictly on minority-class precision and recall. |
| **Cost-Based Threshold Optimization** | Default `0.50` probability cutoff assumes equal business penalty for FP and FN. Calibrating the cutoff to business costs directly optimizes financial outcome. |

---

## Actual Model Performance (Validated Results)

The pipeline was executed and evaluated on the untouched test partition (**56,962 transactions**, including **98 true fraud cases**):

### 1. Default Threshold (0.50) Performance
- **PR-AUC:** `0.7388`
- **Precision:** `0.2052` (20.52%)
- **Recall:** `0.8878` (88.78% — 87 of 98 fraud cases caught)
- **F1-Score:** `0.3333`
- **Confusion Matrix:**
  - True Negatives (TN): `56,527`
  - False Positives (FP): `337` (unnecessary customer alerts)
  - False Negatives (FN): `11` (missed fraud)
  - True Positives (TP): `87` (detected fraud)
- **Estimated Financial Cost** (at assumed FN=$150, FP=$5): **$3,335**

---

### 2. Business-Based Threshold Optimization

> **Illustrative Business Cost Assumptions** *(Assumed parameters for analytics modeling; not actual Synchrony Financial values)*:
> - **Cost of False Negative (Missed Fraud):** **$150** (chargeback amount, recovery fees)
> - **Cost of False Positive (Customer Friction):** **$5** (customer support overhead, friction / insult cost)
>
> $$\text{Financial Cost} = (\text{FN} \times 150) + (\text{FP} \times 5)$$

By sweeping candidate thresholds between `0.10` and `0.90` (step `0.01`):

| Metric | Default Threshold (`0.50`) | Cost-Optimized Threshold (`0.84`) | Net Business Impact |
|---|:---:|:---:|:---:|
| **Decision Threshold** | `0.50` (50.0%) | **`0.84` (84.0%)** | Shifted to optimal cost point |
| **Detected Fraud (TP)** | 87 / 98 | **87 / 98** | **Same high recall preserved** |
| **Missed Fraud (FN)** | 11 / 98 | **11 / 98** | **Zero additional fraud missed** |
| **False Alerts (FP)** | 337 | **79** | **76.6% reduction in customer insults** |
| **Precision** | 20.52% | **52.41%** | **+31.89 percentage points** |
| **Recall** | 88.78% | **88.78%** | Maintained at 88.78% |
| **Estimated Cost** | $3,335 | **$2,045** | **$1,290 saved (-38.7% reduction)** |

**Key Analytical Insight:** Because the model assigns high confidence to true fraud instances while border cases generate small probabilities, raising the decision threshold from `0.50` to `0.84` eliminates **258 false alarms (a 76.6% reduction in customer friction)** without letting a single extra fraudulent transaction slip through!

---

## Project Structure

```
fraud-detection/
├── app.py                     # Interactive Streamlit application (Live demo & CSV upload)
├── train.py                   # Complete training, evaluation, & threshold optimization script
├── requirements.txt           # Minimal, verified Python package dependencies
├── README.md                  # Comprehensive project documentation
├── EXPLAINING_FOR_SYNCHRONY.md # 3–5 minute interview walkthrough & talking points
│
├── notebooks/
│   └── fraud_detection_analysis.ipynb  # Clean 7-cell Google Colab notebook
│
├── data/
│   └── demo_transactions.csv  # 30 representative test transactions (15 fraud, 15 legit)
│
├── model/
│   ├── model.pkl              # Serialized Logistic Regression model (~1.1 KB)
│   ├── scaler.pkl             # Fitted RobustScaler artifact (~1.4 KB)
│   └── config.json            # Model metadata, optimal threshold (0.84), & cost curves
│
└── screenshots/               # Application UI previews
```

---

## Quickstart & Installation

### 1. Clone the repository
```bash
git clone https://github.com/Adityakasara/fraud-detection.git
cd fraud-detection
```

### 2. Set up environment & install dependencies
```bash
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. (Optional) Run the Training Script
Trained artifacts are already pre-generated in `model/`. To re-run the full pipeline and regenerate artifacts:
```bash
python3 train.py
```

### 4. Run the 7-Cell Notebook
Open `notebooks/fraud_detection_analysis.ipynb` in Jupyter Notebook, VS Code, or upload directly to Google Colab. The notebook executes sequentially across 7 clean cells without extra setup.

### 5. Launch the Live Streamlit Demo
```bash
streamlit run app.py
```
Open **http://localhost:8501** in your browser.

---

## 60-Second Live Interview Demo Steps

When demonstrating this project live in an interview:

1. **Open the Streamlit App:** Note the "Model Status: Loaded ✓" indicator in the sidebar showing cached inference.
2. **Select a Legitimate Sample:** In the **Option A** tab, select `Transaction #01` (Amount: $0.77). Click **"Analyze Transaction"**.
   - Show: Fraud Probability: `~0.51%`, Risk Score: `0.5 / 100`, Threshold: `84.0%`.
   - Result: 🟢 **LEGITIMATE** (Instant approval).
3. **Select a Fraudulent Sample:** Select `Transaction #05` (Amount: $385.00). Click **"Analyze Transaction"**.
   - Show: Fraud Probability: `~99.98%`, Risk Score: `100.0 / 100`, Threshold: `84.0%`.
   - Result: 🔴 **FRAUD** (Trigger 2FA / Authorization Challenge).
4. **Explain Threshold Optimization:** Open the sidebar to highlight how tuning the cutoff to `0.84` reduced false alarms by 76.6% and saved an estimated $1,290 in business costs.
5. **(Optional) Batch Scoring:** Switch to **Option B**, upload `data/demo_transactions.csv`, and click **"Score Uploaded Transactions"** to show instant multi-transaction batch processing and CSV export.

---

## Synchrony Financial Context & Interview Defensibility

- **No Fabricated Claims:** This repository does not claim unrealistic "99.9% accuracy" or complex, unverifiable deep learning models. It delivers a solid, leak-free linear baseline with rigorous PR-AUC evaluation and cost optimization.
- **The Core Trade-off:** Direct focus on balancing **Chargeback Losses** vs **Customer Insult Rate** at retail partner checkout.
- **Explainability:** Built on transparent logistic regression with accessible coefficients and risk probabilities rather than uninterpretable black boxes.
