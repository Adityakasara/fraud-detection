# FraudShield 🛡️ — Credit Card Fraud Detection & Anomaly Analytics

A full-stack machine learning web application that detects fraudulent credit card transactions in real-time with explainable AI and automated risk triage.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://adityakasara.github.io/fraud-detection/)
![Tech Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)
![Tech Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react)
![Tech Stack](https://img.shields.io/badge/ML-scikit--learn%20%7C%20XGBoost-F7931E?style=flat-square)
![Tech Stack](https://img.shields.io/badge/DB-SQLite-003B57?style=flat-square&logo=sqlite)

> **🌐 Live Interactive App**: [https://adityakasara.github.io/fraud-detection/](https://adityakasara.github.io/fraud-detection/)

---

## 🏛️ Context for Synchrony Financial Analytics Roles

Synchrony Financial (NYSE: SYF) is the largest provider of private-label store credit cards in the US (financing cards for **Amazon, Lowe's, CareCredit, Sam's Club, PayPal**). This project demonstrates the exact analytical problem-solving required in a Synchrony Fraud Risk & Analytics role:

1. **The Core Business Trade-off**: Fraud analytics at Synchrony isn't just about catching fraudsters—it's about protecting retail partner relationships by minimizing the **Customer Insult Rate** (declining legitimate cardholders at checkout) while reducing **Fraud Loss Basis Points (bps)**:
   $$\text{Fraud bps} = \left(\frac{\text{Fraud Loss \$}}{\text{Purchase Volume \$}}\right) \times 10,000$$
2. **Handling Extreme Class Imbalance (0.17%)**: Real credit card fraud represents only ~17 out of every 10,000 transactions. Predicting "legitimate" 100% of the time yields 99.83% naive accuracy while catching zero fraud. We evaluate models using **Precision-Recall AUC (PR-AUC)** and cost-matrix curves rather than deceptive accuracy.
3. **Regulatory Explainability (FCRA & ECOA Compliance)**: Regulated banking requires that adverse action decisions (declined transactions) provide clear, non-discriminatory reasons. We use **TreeSHAP** to attribute risk scores to individual features and generate human-readable reason codes.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📂 **Upload** | Drag-and-drop CSV upload with column validation and sensitive field masking |
| 🏋️ **Train** | 4 model types (Logistic Regression, Random Forest, XGBoost, Isolation Forest) with SMOTE / class-weight imbalance handling |
| 📊 **Metrics** | Precision, Recall, F1, PR-AUC, Confusion Matrix, PR Curve, Score Distribution charts |
| 🔍 **Predict** | Single transaction form with risk score gauge, SHAP feature bars, and human-readable reason codes |
| 📦 **Batch Predict** | Upload a CSV and get predictions for all rows with export |
| 📈 **Dashboard** | Fraud trends over time, top risky transactions table, flagged transaction CSV export |

---

## 🗂️ Project Structure

```
fraud-detection/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── database.py              # SQLAlchemy + SQLite setup
│   ├── models.py                # ORM models
│   ├── schemas.py               # Pydantic schemas
│   ├── requirements.txt
│   ├── generate_sample_data.py  # Synthetic dataset generator
│   ├── ml/
│   │   ├── preprocessor.py      # Feature cleaning + scaling pipeline
│   │   ├── trainer.py           # Model training (LR/RF/XGB/IsolForest)
│   │   ├── evaluator.py         # Metrics + chart data
│   │   ├── inference.py         # Single + batch prediction
│   │   └── explainer.py        # SHAP values + reason codes
│   └── routers/
│       ├── data.py              # POST /upload
│       ├── train.py             # POST /train
│       ├── predict.py           # POST /predict, /predict/batch
│       ├── metrics.py           # GET /metrics
│       └── dashboard.py        # GET /dashboard/*
└── frontend/
    ├── src/
    │   ├── App.jsx              # Sidebar layout + routing
    │   ├── api.js               # Axios API client
    │   ├── index.css            # Dark glassmorphism design system
    │   └── pages/
    │       ├── UploadPage.jsx
    │       ├── TrainPage.jsx
    │       ├── MetricsPage.jsx
    │       ├── PredictPage.jsx
    │       └── DashboardPage.jsx
    └── package.json
```

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/Adityakasara/fraud-detection.git
cd fraud-detection
```

### 2. Backend setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Generate sample data (or use Kaggle dataset)
```bash
# Option A: Generate synthetic 10k-row dataset
python generate_sample_data.py

# Option B: Download the real dataset
# https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud
# Place creditcard.csv in this directory
```

### 4. Start the backend
```bash
uvicorn main:app --port 8000 --reload
```

### 5. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
```

### 6. Open the app
Visit **http://localhost:5173**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Upload transaction CSV |
| `POST` | `/train` | Train a fraud detection model |
| `GET` | `/metrics` | Get evaluation metrics of active model |
| `POST` | `/predict` | Single transaction prediction |
| `POST` | `/predict/batch` | Batch predictions from CSV |
| `GET` | `/dashboard/stats` | Fraud stats and trends |
| `GET` | `/dashboard/top-risky` | Top 20 highest-risk transactions |
| `GET` | `/dashboard/export` | Download flagged transactions CSV |

Full interactive docs at **http://localhost:8000/docs**

---

## 🧠 Supported Models

| Model | Type | Best For |
|---|---|---|
| Logistic Regression | Supervised | Fast baseline, interpretable |
| Random Forest | Supervised | High accuracy, supports SHAP |
| XGBoost | Supervised | Best performance on tabular data |
| Isolation Forest | Unsupervised | No labels required, anomaly detection |

---

## 📊 Dataset

Built for the [Kaggle Credit Card Fraud Dataset](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud):
- 284,807 transactions, 492 fraud (0.17%)
- 30 features: `Time`, `Amount`, `V1`–`V28` (PCA-anonymized)
- Target column: `Class` (0 = legit, 1 = fraud)

---

## 🛡️ Privacy & Security

- Sensitive fields (card numbers, customer IDs) are **auto-detected and masked** on upload
- Raw personal data is never stored
- Model files are excluded from git (`.gitignore`)

---

## 📋 SRS Compliance

This project implements all functional requirements from the SRS:

- ✅ FR-3 to FR-8: Data upload, validation, preprocessing
- ✅ FR-9 to FR-10: Multi-model training + imbalance handling
- ✅ FR-11 to FR-12: Evaluation metrics + charts
- ✅ FR-13 to FR-14: Single & batch prediction
- ✅ FR-15 to FR-16: SHAP explainability + reason codes
- ✅ FR-17 to FR-19: Dashboard, trends, export
- ✅ FR-20: Prediction storage with model version + timestamp
