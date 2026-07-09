"""Orchestrator — drives the agent microservices over HTTP.

The agent execution order and service endpoints are **configuration, not code**:
they are read from ``pipeline-config.json``. For each transaction the
orchestrator POSTs the record to each agent service in the configured order and
persists the returned record as a JSON envelope in ``shared/``.

    pipeline-config.json
            │ order + urls
            ▼
    orchestrator ──POST──▶ :8001 validator
                 ──POST──▶ :8002 fraud_detector
                 ──POST──▶ :8003 settlement ──▶ shared/results/

Shared-directory flow (audit trail preserved at every hop):
    input/ ─▶ processing/ ─▶ output/ (recycled to input/) ─▶ … ─▶ results/

Usage:
    python orchestrator.py            # requires the agent services to be running
    ./demo.sh                         # starts services, runs, tears down
"""
from __future__ import annotations

import json
import shutil
from collections import Counter
from pathlib import Path

import httpx

from pipeline.common import audit, make_envelope, now_iso

ROOT = Path(__file__).resolve().parent
SHARED = ROOT / "shared"
INPUT = SHARED / "input"
PROCESSING = SHARED / "processing"
OUTPUT = SHARED / "output"
RESULTS = SHARED / "results"
SUMMARY_FILE = RESULTS / "_summary.json"
CONFIG_FILE = ROOT / "pipeline-config.json"


class AgentUnreachableError(RuntimeError):
    """Raised when an agent microservice cannot be reached."""


def load_config(config_path: Path | None = None) -> dict:
    
    """Read the agent order and endpoints from pipeline-config.json."""
    path = config_path or CONFIG_FILE
    config = json.loads(path.read_text())
    if not config.get("agents"):
        raise ValueError(f"No agents configured in {path}")
    return config


def call_agent(agent: dict, record: dict, timeout: float = 10.0) -> dict:
    """POST a record to one agent service and return the updated record.

    Tests monkeypatch this to dispatch in-process instead of over HTTP.
    """
    try:
        response = httpx.post(agent["url"], json=record, timeout=timeout)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as exc:
        raise AgentUnreachableError(
            f"Agent '{agent['name']}' at {agent['url']} is unreachable: {exc}\n"
            f"Start the agent services first (see demo.sh or HOWTORUN.md)."
        ) from exc


def reset_shared() -> None:
    """Clear and recreate all shared directories."""
    if SHARED.exists():
        shutil.rmtree(SHARED)
    for d in (INPUT, PROCESSING, OUTPUT, RESULTS):
        d.mkdir(parents=True, exist_ok=True)


def load_input(sample_path: Path) -> int:
    """Drop each raw record into shared/input/ as an envelope. Returns count."""
    records = json.loads(sample_path.read_text())
    first_agent = load_config()["agents"][0]["name"]
    for record in records:
        envelope = make_envelope(record, source_stage="orchestrator",
                                 target_stage=first_agent)
        txn_id = record.get("transaction_id", envelope["message_id"])
        (INPUT / f"{txn_id}.json").write_text(json.dumps(envelope, indent=2))
    return len(records)


def _outcome(data: dict) -> str:
    """Short human-readable outcome for the audit line."""
    status = data.get("status", "unknown")
    if status == "rejected":
        return f"rejected ({data.get('reason')})"
    if data.get("settled"):
        return f"settled (fee={data.get('fee')}, net={data.get('net_amount')})"
    if "risk_score" in data:
        return f"{status} (risk={data['risk_score']})"
    return status


def run_stage(agent: dict, target: str, final: bool, timeout: float = 10.0) -> None:
    """Drain shared/input/, call this agent service for each record, persist.

    Each service also logs its own audit line locally; the orchestrator emits
    one here too so a single terminal shows the whole distributed run.
    """
    dest = RESULTS if final else OUTPUT
    for src in sorted(INPUT.glob("*.json")):
        # Move into processing/ to signal "in progress".
        working = PROCESSING / src.name
        shutil.move(str(src), str(working))

        envelope = json.loads(working.read_text())
        new_data = call_agent(agent, envelope["data"], timeout=timeout)
        audit(agent["name"], new_data.get("transaction_id", "UNKNOWN"),
              _outcome(new_data))
        new_envelope = make_envelope(new_data, source_stage=agent["name"],
                                     target_stage=target)
        (dest / src.name).write_text(json.dumps(new_envelope, indent=2))
        working.unlink()

    # Recycle this stage's output back into input/ for the next agent.
    if not final:
        for out in OUTPUT.glob("*.json"):
            shutil.move(str(out), str(INPUT / out.name))


def build_summary(total: int) -> dict:
    """Aggregate final results/ into a summary report."""
    statuses: Counter[str] = Counter()
    rejected, flagged = [], []
    for result_file in RESULTS.glob("*.json"):
        if result_file.name.startswith("_"):
            continue
        data = json.loads(result_file.read_text())["data"]
        status = data.get("status", "unknown")
        statuses[status] += 1
        if status == "rejected":
            rejected.append({"transaction_id": data.get("transaction_id"),
                             "reason": data.get("reason")})
        if status == "flagged":
            flagged.append({"transaction_id": data.get("transaction_id"),
                            "risk_score": data.get("risk_score")})
    return {
        "generated_at": now_iso(),
        "total": total,
        "by_status": dict(statuses),
        "rejected": rejected,
        "flagged": flagged,
    }


def print_summary(summary: dict) -> None:
    print("\n" + "=" * 52)
    print("  PIPELINE SUMMARY")
    print("=" * 52)
    print(f"  Total processed : {summary['total']}")
    for status, count in sorted(summary["by_status"].items()):
        print(f"  {status:<16}: {count}")
    if summary["rejected"]:
        print("\n  Rejected:")
        for r in summary["rejected"]:
            print(f"    - {r['transaction_id']}: {r['reason']}")
    if summary["flagged"]:
        print("\n  Flagged for review:")
        for f in summary["flagged"]:
            print(f"    - {f['transaction_id']}: risk {f['risk_score']}")
    print("=" * 52 + "\n")


def run(sample_path: Path | None = None, config_path: Path | None = None) -> dict:
    """Run the full pipeline through the agent services and return the summary."""
    sample_path = sample_path or (ROOT / "sample-transactions.json")
    config = load_config(config_path)
    agents = config["agents"]
    timeout = float(config.get("timeout_seconds", 10))

    reset_shared()
    total = load_input(sample_path)

    order = " → ".join(a["name"] for a in agents)
    print(f"\nLoaded {total} transactions into shared/input/")
    print(f"Agent order (from pipeline-config.json): {order}\n")
    print(f"{'AUDIT LOG':<24} (timestamp | stage | txn | outcome)")
    print("-" * 70)

    for i, agent in enumerate(agents):
        final = i == len(agents) - 1
        target = "results" if final else agents[i + 1]["name"]
        run_stage(agent, target, final=final, timeout=timeout)

    summary = build_summary(total)
    SUMMARY_FILE.write_text(json.dumps(summary, indent=2))
    print_summary(summary)
    return summary


if __name__ == "__main__":
    run()
