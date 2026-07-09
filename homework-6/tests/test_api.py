"""Tests for the FastAPI backend (backend/api.py)."""
from fastapi.testclient import TestClient

from backend.api import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_run_endpoint(isolated_shared, local_agents, sample_file, monkeypatch):
    # Make the endpoint run against the controlled sample file.
    import orchestrator

    real_run = orchestrator.run
    monkeypatch.setattr(
        orchestrator, "run", lambda *a, **k: real_run(sample_path=sample_file)
    )

    res = client.post("/api/run")
    assert res.status_code == 200
    body = res.json()
    assert body["summary"]["total"] == 4
    assert len(body["results"]) == 4


def test_results_endpoint_after_run(isolated_shared, local_agents, sample_file):
    import orchestrator

    orchestrator.run(sample_path=sample_file)
    res = client.get("/api/results")
    assert res.status_code == 200
    body = res.json()
    assert body["summary"]["total"] == 4
    ids = {r["transaction_id"] for r in body["results"]}
    assert ids == {"T1", "T2", "T3", "T4"}


def test_results_endpoint_empty_when_no_run(isolated_shared):
    # isolated_shared has empty results/ and no summary file yet.
    res = client.get("/api/results")
    assert res.status_code == 200
    body = res.json()
    assert body["summary"] is None
    assert body["results"] == []
