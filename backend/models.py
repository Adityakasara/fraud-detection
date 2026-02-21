from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from database import Base


class UploadedDataset(Base):
    __tablename__ = "uploaded_datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    num_rows = Column(Integer)
    num_cols = Column(Integer)
    columns = Column(Text)          # JSON list of column names
    filepath = Column(String)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())


class TrainedModel(Base):
    __tablename__ = "trained_models"

    id = Column(Integer, primary_key=True, index=True)
    model_type = Column(String, nullable=False)
    imbalance_method = Column(String)
    model_version = Column(String, unique=True)
    is_active = Column(Boolean, default=False)
    precision = Column(Float)
    recall = Column(Float)
    f1 = Column(Float)
    pr_auc = Column(Float)
    metrics_json = Column(Text)     # Full metrics JSON
    trained_at = Column(DateTime(timezone=True), server_default=func.now())


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, index=True)
    amount = Column(Float)
    fraud_label = Column(Integer)   # 0 or 1
    risk_score = Column(Float)      # 0–1
    model_version = Column(String)
    explanation_json = Column(Text) # Top features JSON
    source = Column(String)         # 'single' or 'batch'
    predicted_at = Column(DateTime(timezone=True), server_default=func.now())
