"""
FastAPI application entry point.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models  # ensures all models are registered

from routers import data, train, predict, metrics, dashboard

# Create all DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fraud Detection & Anomaly Analytics API",
    description="ML-powered credit card fraud detection system with explainability.",
    version="1.0.0",
)

# Allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router)
app.include_router(train.router)
app.include_router(predict.router)
app.include_router(metrics.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "Fraud Detection API is running.", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
