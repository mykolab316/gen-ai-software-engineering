"""Validator agent microservice (default port 8001).

Run:  uvicorn services.validator_service:app --port 8001
"""
from pipeline import validator
from services.base import create_agent_app

app = create_agent_app("validator", validator.process_transaction)
