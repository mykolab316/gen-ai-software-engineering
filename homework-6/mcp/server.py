"""Custom FastMCP server — makes the pipeline queryable over MCP.

Exposes:
  - tool  get_transaction_status(transaction_id)  -> status from shared/results/
  - tool  list_pipeline_results()                 -> summary of all processed txns
  - resource pipeline://summary                    -> latest run summary as text

Run standalone:
    .venv/bin/python mcp/server.py
Or via mcp.json (server name: pipeline-status).
"""
from __future__ import annotations

import json
from pathlib import Path

from fastmcp import FastMCP

ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "shared" / "results"
SUMMARY_FILE = RESULTS / "_summary.json"

mcp = FastMCP("pipeline-status")


# --- plain helpers (unit-testable, no MCP machinery) ----------------------
def _load_result(transaction_id: str) -> dict | None:
    f = RESULTS / f"{transaction_id}.json"
    if not f.exists():
        return None
    return json.loads(f.read_text())["data"]


def _all_results() -> list[dict]:
    if not RESULTS.exists():
        return []
    out = []
    for f in sorted(RESULTS.glob("*.json")):
        if f.name.startswith("_"):
            continue
        out.append(json.loads(f.read_text())["data"])
    return out


def _summary_text() -> str:
    if not SUMMARY_FILE.exists():
        return ("No pipeline summary yet. Run the pipeline first "
                "(python orchestrator.py).")
    s = json.loads(SUMMARY_FILE.read_text())
    lines = [
        "Transaction Pipeline — Latest Run Summary",
        f"Generated at : {s.get('generated_at')}",
        f"Total        : {s.get('total')}",
        "",
        "By status:",
    ]
    for status, count in sorted(s.get("by_status", {}).items()):
        lines.append(f"  {status:<10}: {count}")
    if s.get("rejected"):
        lines.append("\nRejected:")
        for r in s["rejected"]:
            lines.append(f"  - {r['transaction_id']}: {r['reason']}")
    if s.get("flagged"):
        lines.append("\nFlagged for review:")
        for fl in s["flagged"]:
            lines.append(f"  - {fl['transaction_id']}: risk {fl['risk_score']}")
    return "\n".join(lines)


# --- MCP surface ----------------------------------------------------------
@mcp.tool
def get_transaction_status(transaction_id: str) -> dict:
    """Return the current status and settlement details of one transaction.

    Reads the latest outcome from shared/results/. If the transaction is not
    found (e.g. the pipeline has not been run), returns ``found: false``.
    """
    data = _load_result(transaction_id)
    if data is None:
        return {
            "transaction_id": transaction_id,
            "found": False,
            "message": f"No result for {transaction_id}. Has the pipeline run?",
        }
    return {
        "transaction_id": transaction_id,
        "found": True,
        "status": data.get("status"),
        "risk_score": data.get("risk_score"),
        "amount": data.get("amount"),
        "currency": data.get("currency"),
        "fee": data.get("fee"),
        "net_amount": data.get("net_amount"),
        "reason": data.get("reason"),
    }


@mcp.tool
def list_pipeline_results() -> dict:
    """Return a summary of all processed transactions from shared/results/."""
    results = _all_results()
    by_status: dict[str, int] = {}
    items = []
    for d in results:
        status = d.get("status", "unknown")
        by_status[status] = by_status.get(status, 0) + 1
        items.append({
            "transaction_id": d.get("transaction_id"),
            "status": status,
            "risk_score": d.get("risk_score"),
        })
    return {"total": len(results), "by_status": by_status, "transactions": items}


@mcp.resource("pipeline://summary")
def pipeline_summary() -> str:
    """The latest pipeline run summary as human-readable text."""
    return _summary_text()


if __name__ == "__main__":
    mcp.run()
