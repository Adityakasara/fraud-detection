"""
Router: model training.
POST /train
"""
import os
import json
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import UploadedDataset, TrainedModel
from schemas import TrainRequest
from ml.trainer import train_model
from ml.evaluator import evaluate

router = APIRouter(prefix="/train", tags=["Training"])


@router.post("")
def train(req: TrainRequest, db: Session = Depends(get_db)):
    # Find latest uploaded dataset
    dataset = db.query(UploadedDataset).order_by(UploadedDataset.uploaded_at.desc()).first()
    if dataset is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded. Please upload a CSV first.")

    if not os.path.exists(dataset.filepath):
        raise HTTPException(status_code=400, detail="Dataset file not found on disk.")

    df = pd.read_csv(dataset.filepath)

    try:
        model, X_test, y_test, model_version, model_meta = train_model(
            df,
            model_type=req.model_type,
            imbalance_method=req.imbalance_method,
            test_size=req.test_size,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ImportError as e:
        raise HTTPException(status_code=400, detail=str(e))

    metrics = evaluate(model, X_test, y_test, req.model_type)

    # Deactivate all previous models
    db.query(TrainedModel).update({"is_active": False})

    trained = TrainedModel(
        model_type=req.model_type,
        imbalance_method=req.imbalance_method,
        model_version=model_version,
        is_active=True,
        precision=metrics["precision"],
        recall=metrics["recall"],
        f1=metrics["f1"],
        pr_auc=metrics["pr_auc"],
        metrics_json=json.dumps(metrics),
    )
    db.add(trained)
    db.commit()

    return {
        "message": f"Model '{req.model_type}' trained successfully.",
        "model_version": model_version,
        "metrics": metrics,
    }
