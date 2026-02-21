"""
Router: dashboard analytics and export.
GET /dashboard/stats
GET /dashboard/top-risky
GET /dashboard/export
"""
import io
import json
import csv
import pandas as pd
from datetime import datetime, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Prediction

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    predictions = db.query(Prediction).all()

    total = len(predictions)
    total_fraud = sum(1 for p in predictions if p.fraud_label == 1)
    total_legit = total - total_fraud
    fraud_rate = round(total_fraud / total * 100, 2) if total > 0 else 0.0

    # Daily trends — group by date
    daily = defaultdict(lambda: {"date": "", "fraud": 0, "legitimate": 0, "total": 0})
    for p in predictions:
        if p.predicted_at:
            date_str = p.predicted_at.strftime("%Y-%m-%d")
            daily[date_str]["date"] = date_str
            daily[date_str]["total"] += 1
            if p.fraud_label == 1:
                daily[date_str]["fraud"] += 1
            else:
                daily[date_str]["legitimate"] += 1

    daily_trends = sorted(daily.values(), key=lambda x: x["date"])

    return {
        "total_predictions": total,
        "total_fraud": total_fraud,
        "total_legitimate": total_legit,
        "fraud_rate": fraud_rate,
        "daily_trends": daily_trends,
    }


@router.get("/top-risky")
def get_top_risky(limit: int = 20, db: Session = Depends(get_db)):
    predictions = (
        db.query(Prediction)
        .filter(Prediction.fraud_label == 1)
        .order_by(Prediction.risk_score.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": p.id,
            "transaction_id": p.transaction_id,
            "amount": p.amount,
            "risk_score": p.risk_score,
            "model_version": p.model_version,
            "predicted_at": p.predicted_at.isoformat() if p.predicted_at else None,
        }
        for p in predictions
    ]


@router.get("/export")
def export_flagged(db: Session = Depends(get_db)):
    predictions = (
        db.query(Prediction)
        .filter(Prediction.fraud_label == 1)
        .order_by(Prediction.risk_score.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["transaction_id", "amount", "risk_score", "model_version", "predicted_at"])
    for p in predictions:
        writer.writerow([
            p.transaction_id,
            p.amount,
            p.risk_score,
            p.model_version,
            p.predicted_at.isoformat() if p.predicted_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=flagged_transactions.csv"},
    )
