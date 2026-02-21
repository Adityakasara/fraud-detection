"""
Router: evaluation metrics.
GET /metrics
"""
import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import TrainedModel

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get("")
def get_metrics(db: Session = Depends(get_db)):
    model = db.query(TrainedModel).filter(TrainedModel.is_active == True).first()
    if model is None:
        raise HTTPException(status_code=404, detail="No active model found. Please train a model first.")

    metrics = json.loads(model.metrics_json)

    return {
        "model_type": model.model_type,
        "model_version": model.model_version,
        "trained_at": model.trained_at.isoformat() if model.trained_at else None,
        "precision": model.precision,
        "recall": model.recall,
        "f1": model.f1,
        "pr_auc": model.pr_auc,
        **metrics,
    }


@router.get("/history")
def get_metrics_history(db: Session = Depends(get_db)):
    models = db.query(TrainedModel).order_by(TrainedModel.trained_at.desc()).all()
    return [
        {
            "model_version": m.model_version,
            "model_type": m.model_type,
            "is_active": m.is_active,
            "precision": m.precision,
            "recall": m.recall,
            "f1": m.f1,
            "pr_auc": m.pr_auc,
            "trained_at": m.trained_at.isoformat() if m.trained_at else None,
        }
        for m in models
    ]
