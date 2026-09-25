"""
Router: data upload and validation.
POST /upload
"""
import os
import json
import shutil
import aiofiles
import pandas as pd
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import UploadedDataset
from schemas import UploadResponse
from ml.preprocessor import detect_target_column

router = APIRouter(prefix="/upload", tags=["Data"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    # Save file
    filepath = os.path.join(UPLOAD_DIR, file.filename)
    async with aiofiles.open(filepath, "wb") as out:
        content = await file.read()
        await out.write(content)

    # Parse and validate
    try:
        df = pd.read_csv(filepath)
    except Exception as e:
        os.remove(filepath)
        raise HTTPException(status_code=422, detail=f"Could not parse CSV: {e}")

    if df.empty:
        raise HTTPException(status_code=422, detail="Uploaded CSV is empty.")

    # Mask sensitive columns
    for col in df.columns:
        lcol = col.lower()
        if any(k in lcol for k in ("card", "customer", "name", "phone", "email", "ssn")):
            df[col] = df[col].astype(str).str[:4] + "****"

    df.to_csv(filepath, index=False)

    num_rows, num_cols = df.shape
    columns = df.columns.tolist()
    target_col = detect_target_column(df)

    # Store metadata in DB
    existing = db.query(UploadedDataset).filter(UploadedDataset.filename == file.filename).first()
    if existing:
        db.delete(existing)
    record = UploadedDataset(
        filename=file.filename,
        num_rows=num_rows,
        num_cols=num_cols,
        columns=json.dumps(columns),
        filepath=filepath,
    )
    db.add(record)
    db.commit()

    preview = df.head(5).fillna("").to_dict(orient="records")

    return UploadResponse(
        filename=file.filename,
        num_rows=num_rows,
        num_cols=num_cols,
        columns=columns,
        preview=preview,
        target_column=target_col,
        message=f"Dataset uploaded successfully. {'Target column detected: ' + target_col if target_col else 'Warning: no target column found (upload for batch prediction only).'}",
    )


@router.post("/sample", response_model=UploadResponse)
def load_sample_dataset(db: Session = Depends(get_db)):
    sample_path = os.path.join(os.path.dirname(__file__), "..", "sample_creditcard.csv")
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail="Sample dataset not found.")

    filepath = os.path.join(UPLOAD_DIR, "sample_creditcard.csv")
    shutil.copy(sample_path, filepath)

    df = pd.read_csv(filepath)
    num_rows, num_cols = df.shape
    columns = df.columns.tolist()
    target_col = detect_target_column(df)

    existing = db.query(UploadedDataset).filter(UploadedDataset.filename == "sample_creditcard.csv").first()
    if existing:
        db.delete(existing)
    record = UploadedDataset(
        filename="sample_creditcard.csv",
        num_rows=num_rows,
        num_cols=num_cols,
        columns=json.dumps(columns),
        filepath=filepath,
    )
    db.add(record)
    db.commit()

    preview = df.head(5).fillna("").to_dict(orient="records")
    return UploadResponse(
        filename="sample_creditcard.csv",
        num_rows=num_rows,
        num_cols=num_cols,
        columns=columns,
        preview=preview,
        target_column=target_col,
        message="Loaded 10,000-row sample credit card dataset with 'Class' target column.",
    )
