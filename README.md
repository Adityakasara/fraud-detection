# FraudShield 🛡️ — Credit Card Fraud Detection & Anomaly Analytics

A full-stack ML web application that detects fraudulent credit card transactions in near real-time, built as per the SRS specification.

![Tech Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)
![Tech Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react)
![Tech Stack](https://img.shields.io/badge/ML-scikit--learn%20%7C%20XGBoost-F7931E?style=flat-square)
![Tech Stack](https://img.shields.io/badge/DB-SQLite-003B57?style=flat-square&logo=sqlite)

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
git clone https://github.com/YOUR_USERNAME/fraud-detection.git
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
