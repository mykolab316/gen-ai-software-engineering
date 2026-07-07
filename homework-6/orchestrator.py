"""Orchestrator — runs the transaction pipeline end to end.

Flow (file-based hand-off through ``shared/``):

    sample-transactions.json
        -> shared/input/         (orchestrator drops raw records)
        -> [validator]  input   -> processing -> output   (recycled to input)
        -> [fraud]      input    -> processing -> output   (recycled to input)
        -> [settlement] input    -> processing -> results  (final)

``input/`` is the live queue each stage drains; ``processing/`` holds a record
while a stage works on it; ``output/`` stages results for the next stage;
``results/`` holds final outcomes. Every hop writes a valid JSON envelope.

Usage:
    python orchestrator.py
"""
from __future__ import annotations

import json
import shutil
from collections import Counter
from pathlib import Path

from pipeline import fraud_detector, settlement, validator
from pipeline.common import make_envelope, now_iso

ROOT = Path(__file__).resolve().parent
SHARED = ROOT / "shared"
INPUT = SHARED / "input"
PROCESSING = SHARED / "processing"
OUTPUT = SHARED / "output"
RESULTS = SHARED / "results"
SUMMARY_FILE = RESULTS / "_summary.json"

STAGES = [
    ("validator", validator.process_transaction, "fraud_detector"),
    ("fraud_detector", fraud_detector.process_transaction, "settlement"),
    ("settlement", settlement.process_transaction, "results"),
]


def reset_shared() -> None:
    """Clear and recreate all shared directories."""
    if SHARED.exists():
        shutil.rmtree(SHARED)
    for d in (INPUT, PROCESSING, OUTPUT, RESULTS):
        d.mkdir(parents=True, exist_ok=True)


def load_input(sample_path: Path) -> int:
    """Drop each raw record into shared/input/ as an envelope. Returns count."""
    records = json.loads(sample_path.read_text())
    for record in records:
        envelope = make_envelope(record, source_stage="orchestrator",
                                 target_stage="validator")
        txn_id = record.get("transaction_id", envelope["message_id"])
        (INPUT / f"{txn_id}.json").write_text(json.dumps(envelope, indent=2))
    return len(records)


def run_stage(name, process_fn, target, final: bool) -> None:
    """Drain shared/input/, process each record, write to the next location."""
    dest = RESULTS if final else OUTPUT
    for src in sorted(INPUT.glob("*.json")):
        # Move into processing/ to signal "in progress".
        working = PROCESSING / src.name
        shutil.move(str(src), str(working))

        envelope = json.loads(working.read_text())
        new_data = process_fn(envelope["data"])
        new_envelope = make_envelope(new_data, source_stage=name,
                                     target_stage=target)
        (dest / src.name).write_text(json.dumps(new_envelope, indent=2))
        working.unlink()

    # Recycle this stage's output back into input/ for the next stage.
    if not final:
        for out in OUTPUT.glob("*.json"):
            shutil.move(str(out), str(INPUT / out.name))


def build_summary(total: int) -> dict:
    """Aggregate final results/ into a summary report."""
    statuses = Counter()
    rejected = []
    flagged = []
    for result_file in RESULTS.glob("*.json"):
        if result_file.name.startswith("_"):
            continue
        data = json.loads(result_file.read_text())["data"]
        statuses[data.get("status", "unknown")] += 1
        if data.get("status") == "rejected":
            rejected.append({"transaction_id": data.get("transaction_id"),
                             "reason": data.get("reason")})
        if data.get("status") == "flagged":
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


def run(sample_path: Path | None = None) -> dict:
    """Run the full pipeline and return the summary dict."""
    sample_path = sample_path or (ROOT / "sample-transactions.json")
    reset_shared()
    total = load_input(sample_path)

    print(f"\nLoaded {total} transactions into shared/input/\n")
    print(f"{'AUDIT LOG':<24} (timestamp | stage | txn | outcome)")
    print("-" * 70)
    for i, (name, fn, target) in enumerate(STAGES):
        run_stage(name, fn, target, final=(i == len(STAGES) - 1))

    summary = build_summary(total)
    SUMMARY_FILE.write_text(json.dumps(summary, indent=2))
    print_summary(summary)
    return summary


if __name__ == "__main__":
    run()
