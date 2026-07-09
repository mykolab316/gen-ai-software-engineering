"""Tests for the agent microservices and the orchestrator's HTTP transport."""
import json

import httpx
import pytest
from fastapi.testclient import TestClient

import orchestrator
from services.fraud_service import app as fraud_app
from services.settlement_service import app as settlement_app
from services.validator_service import app as validator_app

validator_client = TestClient(validator_app)
fraud_client = TestClient(fraud_app)
settlement_client = TestClient(settlement_app)


# --- each service exposes the same contract -------------------------------
@pytest.mark.parametrize("client,name", [
    (validator_client, "validator"),
    (fraud_client, "fraud_detector"),
    (settlement_client, "settlement"),
])
def test_service_health(client, name):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "agent": name}


def test_validator_service_accepts_valid_record():
    record = {
        "transaction_id": "TXN001", "timestamp": "2026-03-16T09:00:00Z",
        "amount": "1500.00", "currency": "USD", "transaction_type": "transfer",
    }
    res = validator_client.post("/process", json=record)
    assert res.status_code == 200
    assert res.json()["status"] == "validated"


def test_validator_service_rejects_bad_currency():
    record = {
        "transaction_id": "TXN006", "timestamp": "2026-03-16T10:05:00Z",
        "amount": "200.00", "currency": "XYZ", "transaction_type": "transfer",
    }
    body = validator_client.post("/process", json=record).json()
    assert body["status"] == "rejected"
    assert "ISO 4217" in body["reason"]


def test_fraud_service_scores_high_value_wire():
    record = {
        "transaction_id": "TXN002", "timestamp": "2026-03-16T09:15:00Z",
        "amount": "25000.00", "currency": "USD",
        "transaction_type": "wire_transfer",
        "metadata": {"country": "US"}, "status": "validated",
    }
    body = fraud_service_post(record)
    assert body["status"] == "flagged"
    assert body["risk_score"] == pytest.approx(0.6)


def fraud_service_post(record):
    return fraud_client.post("/process", json=record).json()


def test_settlement_service_computes_fee_and_net():
    record = {"transaction_id": "TXN001", "amount": "1000.00",
              "currency": "USD", "status": "clear", "risk_score": 0.0}
    body = settlement_client.post("/process", json=record).json()
    assert body["fee"] == "5.00"
    assert body["net_amount"] == "995.00"
    assert body["settled"] is True


# --- orchestrator config + HTTP transport ---------------------------------
def test_load_config_reads_agent_order():
    config = orchestrator.load_config()
    names = [a["name"] for a in config["agents"]]
    assert names == ["validator", "fraud_detector", "settlement"]
    for agent in config["agents"]:
        assert agent["url"].startswith("http://")


def test_load_config_rejects_empty_agents(tmp_path):
    bad = tmp_path / "bad-config.json"
    bad.write_text(json.dumps({"agents": []}))
    with pytest.raises(ValueError, match="No agents configured"):
        orchestrator.load_config(bad)


def test_call_agent_returns_updated_record(monkeypatch):
    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"transaction_id": "T1", "status": "validated"}

    monkeypatch.setattr(httpx, "post", lambda *a, **k: FakeResponse())
    agent = {"name": "validator", "url": "http://localhost:8001/process"}
    result = orchestrator.call_agent(agent, {"transaction_id": "T1"})
    assert result["status"] == "validated"


def test_call_agent_raises_when_service_unreachable(monkeypatch):
    def boom(*args, **kwargs):
        raise httpx.ConnectError("connection refused")

    monkeypatch.setattr(httpx, "post", boom)
    agent = {"name": "validator", "url": "http://localhost:8001/process"}
    with pytest.raises(orchestrator.AgentUnreachableError, match="unreachable"):
        orchestrator.call_agent(agent, {"transaction_id": "T1"})
