"""Fraud detection agent microservice (default port 8002).

Run:  uvicorn services.fraud_service:app --port 8002
"""
from pipeline import fraud_detector
from services.base import create_agent_app

app = create_agent_app("fraud_detector", fraud_detector.process_transaction)
