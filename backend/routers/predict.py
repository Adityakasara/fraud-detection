"""
Router: prediction (single and batch).
POST /predict
POST /predict/batch
"""
import io
import json
import uuid
import pandas as pd
from fastapi import APIRouter, HTTPException, File, UploadFile, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Prediction
from schemas import SinglePredictRequest
from ml.inference import predict_single, predict_batch
from ml.explainer import explain_prediction
from ml.trainer import load_active_model

router = APIRouter(prefix="/predict", tags=["Prediction"])


def _model_or_error():
    try:
        return load_active_model()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="No trained model found. Please train a model first."
        )


@router.post("")
def predict_single_transaction(req: SinglePredictRequest, db: Session = Depends(get_db)):
    model, model_meta = _model_or_error()
    result = predict_single(req.features)
    X = result.pop("X")
    model_meta_res = result.pop("model_meta")

    contribs, reason_codes = explain_prediction(model, model_meta, X)

    pred = Prediction(
        transaction_id=result["transaction_id"],
        amount=float(req.features.get("Amount", req.features.get("amount", 0))),
        fraud_label=result["fraud_label"],
        risk_score=result["risk_score"],
        model_version=model_meta.get("model_version", "unknown"),
        explanation_json=json.dumps(contribs),
        source="single",
    )
    db.add(pred)
    db.commit()

    return {
        **result,
        "explanation": contribs,
        "reason_codes": reason_codes,
        "model_version": model_meta.get("model_version", "unknown"),
    }


@router.post("/batch")
async def predict_batch_transactions(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    model, model_meta = _model_or_error()

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse CSV: {e}")

    if df.empty:
        raise HTTPException(status_code=422, detail="CSV is empty.")

    results, X_all, _ = predict_batch(df)

    # Persist batch predictions
    for i, r in enumerate(results):
        amount = float(df.iloc[i].get("Amount", df.iloc[i].get("amount", 0)) if hasattr(df.iloc[i], 'get') else 0)
        row = df.iloc[i]
        amount = float(row["Amount"]) if "Amount" in row else (float(row["amount"]) if "amount" in row else 0.0)
        pred = Prediction(
            transaction_id=str(uuid.uuid4()),
            amount=amount,
            fraud_label=r["fraud_label"],
            risk_score=r["risk_score"],
            model_version=model_meta.get("model_version", "unknown"),
            source="batch",
        )
        db.add(pred)
    db.commit()

    return {"total": len(results), "predictions": results}
