"""Shared pytest fixtures.

The key one, ``isolated_shared``, redirects the orchestrator's shared/ working
directories into a pytest ``tmp_path`` so tests never touch the real shared/
tree (required by the spec: "Isolate tests from real shared/").
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

import orchestrator


@pytest.fixture
def isolated_shared(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Point orchestrator (and, transitively, the backend) at a temp shared/."""
    shared = tmp_path / "shared"
    inp = shared / "input"
    proc = shared / "processing"
    out = shared / "output"
    res = shared / "results"
    for d in (inp, proc, out, res):
        d.mkdir(parents=True)

    monkeypatch.setattr(orchestrator, "SHARED", shared)
    monkeypatch.setattr(orchestrator, "INPUT", inp)
    monkeypatch.setattr(orchestrator, "PROCESSING", proc)
    monkeypatch.setattr(orchestrator, "OUTPUT", out)
    monkeypatch.setattr(orchestrator, "RESULTS", res)
    monkeypatch.setattr(orchestrator, "SUMMARY_FILE", res / "_summary.json")
    return shared


@pytest.fixture
def sample_file(tmp_path: Path) -> Path:
    """A small, controlled set of transactions covering each outcome."""
    records = [
        {  # normal domestic transfer -> settled
            "transaction_id": "T1", "timestamp": "2026-03-16T09:00:00Z",
            "source_account": "ACC-1", "destination_account": "ACC-2",
            "amount": "100.00", "currency": "USD",
            "transaction_type": "transfer", "description": "ok",
            "metadata": {"channel": "online", "country": "US"},
        },
        {  # high-value wire -> flagged
            "transaction_id": "T2", "timestamp": "2026-03-16T09:00:00Z",
            "source_account": "ACC-3", "destination_account": "ACC-4",
            "amount": "50000.00", "currency": "USD",
            "transaction_type": "wire_transfer", "description": "big",
            "metadata": {"channel": "branch", "country": "US"},
        },
        {  # invalid currency -> rejected
            "transaction_id": "T3", "timestamp": "2026-03-16T09:00:00Z",
            "source_account": "ACC-5", "destination_account": "ACC-6",
            "amount": "10.00", "currency": "XYZ",
            "transaction_type": "transfer", "description": "bad ccy",
            "metadata": {"channel": "online", "country": "US"},
        },
        {  # negative refund -> allowed, settled
            "transaction_id": "T4", "timestamp": "2026-03-16T09:00:00Z",
            "source_account": "ACC-7", "destination_account": "ACC-8",
            "amount": "-25.00", "currency": "GBP",
            "transaction_type": "refund", "description": "refund",
            "metadata": {"channel": "online", "country": "GB"},
        },
    ]
    path = tmp_path / "sample.json"
    path.write_text(json.dumps(records))
    return path
