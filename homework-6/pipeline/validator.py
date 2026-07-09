"""Stage 1 — Validation.

Checks required fields, a parseable non-zero Decimal amount (negative allowed
only for refunds), and an ISO 4217 currency. Rejected records carry a
human-readable ``reason``.

Run standalone in dry-run mode to inspect the sample file:
    python -m pipeline.validator --dry-run
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from pipeline.common import ISO_4217, InvalidOperation, audit, to_decimal

REQUIRED_FIELDS = ("transaction_id", "amount", "currency", "timestamp")


def _reject(data: dict, transaction_id: str, reason: str) -> dict:
    data["status"] = "rejected"
    data["reason"] = reason
    audit("validator", transaction_id, f"rejected ({reason})")
    return data


def process_transaction(record: dict) -> dict:
    """Validate a single transaction ``data`` dict. Returns it with a status.

    On success: ``status = "validated"``.
    On failure: ``status = "rejected"`` plus a ``reason``.
    """
    data = dict(record)
    transaction_id = data.get("transaction_id") or "UNKNOWN"

    missing = [f for f in REQUIRED_FIELDS if not data.get(f)]
    if missing:
        return _reject(data, transaction_id,
                       f"missing required field(s): {', '.join(missing)}")

    try:
        amount = to_decimal(data["amount"])
    except InvalidOperation:
        return _reject(data, transaction_id,
                       f"amount '{data['amount']}' is not a valid decimal")

    if amount == 0:
        return _reject(data, transaction_id, "amount must be non-zero")

    if amount < 0 and data.get("transaction_type") != "refund":
        return _reject(data, transaction_id,
                       "negative amount only allowed for refunds")

    if data["currency"] not in ISO_4217:
        return _reject(data, transaction_id,
                       f"currency '{data['currency']}' is not a valid ISO 4217 code")

    data["status"] = "validated"
    audit("validator", transaction_id, "validated")
    return data


def _dry_run(sample_path: Path) -> int:
    """Validate every record in the sample file without processing further."""
    records = json.loads(sample_path.read_text())
    valid, invalid = [], []
    for record in records:
        result = process_transaction(record)
        (valid if result["status"] == "validated" else invalid).append(result)

    print(f"\nTotal: {len(records)}  |  Valid: {len(valid)}  |  "
          f"Invalid: {len(invalid)}\n")
    print(f"{'TXN':<8} {'STATUS':<10} REASON")
    print("-" * 50)
    for r in valid + invalid:
        print(f"{r.get('transaction_id',''):<8} {r['status']:<10} "
              f"{r.get('reason','')}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Validation stage")
    parser.add_argument("--dry-run", action="store_true",
                        help="validate sample-transactions.json and report")
    parser.add_argument("--sample", default="sample-transactions.json")
    args = parser.parse_args()
    if args.dry_run:
        return _dry_run(Path(args.sample))
    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
