"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class TrainRequest(BaseModel):
    model_type: str = "random_forest"   # logistic_regression | random_forest | xgboost | isolation_forest
    imbalance_method: str = "class_weight"  # class_weight | smote | none
    test_size: float = 0.2


class SinglePredictRequest(BaseModel):
    features: Dict[str, Any]


class PredictionResult(BaseModel):
    transaction_id: str
    fraud_label: int
    risk_score: float
    explanation: List[Dict[str, Any]]
    reason_codes: List[str]


class MetricsResponse(BaseModel):
    model_type: str
    model_version: str
    precision: float
    recall: float
    f1: float
    pr_auc: float
    confusion_matrix: List[List[int]]
    pr_curve: Dict[str, List[float]]
    score_distribution: Dict[str, List]
    trained_at: str


class DashboardStats(BaseModel):
    total_predictions: int
    total_fraud: int
    total_legitimate: int
    fraud_rate: float
    daily_trends: List[Dict[str, Any]]
    top_risky: List[Dict[str, Any]]


class UploadResponse(BaseModel):
    filename: str
    num_rows: int
    num_cols: int
    columns: List[str]
    preview: List[Dict[str, Any]]
    target_column: Optional[str]
    message: str
