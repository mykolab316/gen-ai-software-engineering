"""Settlement agent microservice (default port 8003).

Run:  uvicorn services.settlement_service:app --port 8003
"""
from pipeline import settlement
from services.base import create_agent_app

app = create_agent_app("settlement", settlement.process_transaction)
