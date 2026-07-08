"""Tests for the custom FastMCP server (mcp/server.py).

The local ``mcp/`` directory shares a name with the installed ``mcp`` package,
so the server module is loaded by file path under a distinct module name to
avoid the import clash.
"""
import asyncio
import importlib.util
import json
from pathlib import Path

import pytest

SERVER_PATH = Path(__file__).resolve().parent.parent / "mcp" / "server.py"


def load_server():
    spec = importlib.util.spec_from_file_location("mcp_pipeline_server", SERVER_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture
def server(tmp_path, monkeypatch):
    """Fresh server module with RESULTS redirected to a temp dir."""
    mod = load_server()
    results = tmp_path / "results"
    results.mkdir()
    monkeypatch.setattr(mod, "RESULTS", results)
    monkeypatch.setattr(mod, "SUMMARY_FILE", results / "_summary.json")
    return mod


def _write_result(results: Path, txn_id: str, **data):
    payload = {"data": {"transaction_id": txn_id, **data}}
    (results / f"{txn_id}.json").write_text(json.dumps(payload))


def test_load_result_found(server):
    _write_result(server.RESULTS, "TXN1", status="settled", amount="10.00")
    assert server._load_result("TXN1")["status"] == "settled"


def test_load_result_missing(server):
    assert server._load_result("NOPE") is None


def test_all_results_skips_summary(server):
    _write_result(server.RESULTS, "TXN1", status="settled")
    (server.RESULTS / "_summary.json").write_text("{}")
    assert len(server._all_results()) == 1


def test_summary_text_before_any_run(server):
    assert "No pipeline summary yet" in server._summary_text()


def test_summary_text_with_data(server):
    server.SUMMARY_FILE.write_text(json.dumps({
        "generated_at": "2026-01-01T00:00:00Z",
        "total": 2,
        "by_status": {"settled": 1, "rejected": 1},
        "rejected": [{"transaction_id": "T2", "reason": "bad currency"}],
        "flagged": [{"transaction_id": "T3", "risk_score": 0.6}],
    }))
    text = server._summary_text()
    assert "Total        : 2" in text
    assert "T2: bad currency" in text
    assert "T3: risk 0.6" in text


def test_get_transaction_status_tool_via_client(server):
    _write_result(server.RESULTS, "TXN2", status="flagged", risk_score=0.6,
                  amount="25000.00", currency="USD", fee="125.00",
                  net_amount="24875.00")

    async def run():
        from fastmcp import Client
        async with Client(server.mcp) as c:
            names = {t.name for t in await c.list_tools()}
            assert {"get_transaction_status", "list_pipeline_results"} <= names

            r = await c.call_tool("get_transaction_status",
                                  {"transaction_id": "TXN2"})
            assert r.data["found"] is True
            assert r.data["status"] == "flagged"

            missing = await c.call_tool("get_transaction_status",
                                        {"transaction_id": "NOPE"})
            assert missing.data["found"] is False

            listed = await c.call_tool("list_pipeline_results", {})
            assert listed.data["total"] == 1

            resources = {str(x.uri) for x in await c.list_resources()}
            assert "pipeline://summary" in resources

    asyncio.run(run())
