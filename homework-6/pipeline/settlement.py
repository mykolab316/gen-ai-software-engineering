"""Stage 3 — Settlement.

For every non-rejected transaction, computes a 0.5% fee and the net amount
using Decimal arithmetic with ROUND_HALF_UP, then marks it settled. Flagged
transactions are still settled but keep their ``flagged`` status so a reviewer
can follow up. Rejected records are passed through unchanged (never settled).
"""
from __future__ import annotations

from pipeline.common import Decimal, audit, money, to_decimal

FEE_RATE = Decimal("0.005")  # 0.5%


def process_transaction(record: dict) -> dict:
    """Settle a scored transaction: add ``fee``, ``net_amount``, ``settled``.

    Rejected records are returned unchanged.
    """
    data = dict(record)
    transaction_id = data.get("transaction_id") or "UNKNOWN"

    if data.get("status") == "rejected":
        data["settled"] = False
        return data

    amount = to_decimal(data["amount"])
    fee = money(amount * FEE_RATE)
    net = money(amount - fee)

    data["fee"] = str(fee)
    data["net_amount"] = str(net)
    data["settled"] = True

    # A flagged transaction is settled but keeps its flag for manual review.
    if data.get("status") != "flagged":
        data["status"] = "settled"

    audit("settlement", transaction_id, f"settled (fee={fee}, net={net})")
    return data
