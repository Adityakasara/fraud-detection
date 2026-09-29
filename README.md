# Credit Card Fraud Detection

An interview-ready end-to-end Machine Learning and Analytics project designed to solve real-world credit card transaction risk scoring under severe class imbalance (0.17% fraud rate), featuring cost-based decision threshold optimization and an interactive live web demo on GitHub Pages.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2ea44f?style=for-the-badge&logo=github)](https://adityakasara.github.io/fraud-detection/)
[![Web Application](https://img.shields.io/badge/Web%20App-React%2018%20%2B%20Vite-61dafb?style=flat-square&logo=react)](https://adityakasara.github.io/fraud-detection/)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9%2B-blue?style=flat-square&logo=python)](https://www.python.org/)
[![scikit-learn](https://img.shields.io/badge/Library-scikit--learn-F7931E?style=flat-square&logo=scikit-learn)](https://scikit-learn.org/)

> 🌐 **Live Web Application:** [https://adityakasara.github.io/fraud-detection/](https://adityakasara.github.io/fraud-detection/)  
> Runs 100% client-side in your browser with zero setup — instant transaction risk scoring, interactive Synchrony cost-benefit threshold curves, and 1-click batch CSV analysis.


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
Live Web Application on GitHub Pages (Instant client scoring, Cost Optimizer, & batch CSV analysis)
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

### 5. Access the Live Web Demo (GitHub Pages)
No local installation required — access the live web application immediately:
👉 **[https://adityakasara.github.io/fraud-detection/](https://adityakasara.github.io/fraud-detection/)**

*(Optional) If you want to run the local Streamlit demo alternatively:*
```bash
streamlit run app.py
```
Open **http://localhost:8501** in your browser.

---

## 60-Second Live Interview Demo Steps

When demonstrating this project live in an interview:

1. **Open the Live Web Demo:** Navigate to [https://adityakasara.github.io/fraud-detection/](https://adityakasara.github.io/fraud-detection/). Notice the "Live on GitHub Pages" status and active in-browser Scikit-Learn inference engine.
2. **Review Single Transaction Scoring:** Go to **"Predict & Score"**:
   - Click preset **`🟢 Demo #01: Legit ($0.77)`** and click **"Analyze Transaction"**:
     - Result: 🟢 **LEGITIMATE** (Risk Score: `0.5%`, well below cutoff `84.0%` -> Approved).
   - Click preset **`🔴 Demo #05: Fraud ($261.87)`** and click **"Analyze Transaction"**:
     - Result: 🔴 **FRAUD DETECTED** (Risk Score: `100.0%`, exceeds cutoff `84.0%` -> Step-Up 2FA Challenge).
     - Point out the feature attribution waterfall bars (e.g. `V14`, `Amount`, `V4`) showing exact explainability reason codes.
3. **Walk Through Cost-Benefit Threshold Optimization:** Click **"Cost Optimizer"** in the sidebar:
   - Highlight the interactive U-shaped financial loss curve from cutoff `0.10` to `0.90`.
   - Show how moving from standard `0.50` cutoff to optimal `0.84` cutoff slashes customer insults from **337 to 79** (**76.6% reduction**) and saves **$1,290** (a **38.7% cost reduction**) on the holdout test set.
4. **Demonstrate Batch Scoring:** Switch to the **"Batch CSV Analysis"** tab in Predict:
   - Click **"Load 30 Interview Demo Transactions"** to score all 30 transactions in 0 milliseconds.
   - Filter by Fraud / Legit and click **"Download Scored CSV"** to export enriched results.

---

## Synchrony Financial Context & Interview Defensibility

- **No Fabricated Claims:** This repository does not claim unrealistic "99.9% accuracy" or complex, unverifiable deep learning models. It delivers a solid, leak-free linear baseline with rigorous PR-AUC evaluation and cost optimization.
- **The Core Trade-off:** Direct focus on balancing **Chargeback Losses** vs **Customer Insult Rate** at retail partner checkout.
- **Explainability:** Built on transparent logistic regression with accessible coefficients and risk probabilities rather than uninterpretable black boxes.
