"""Stage 2 — Fraud Detection.

Scores each transaction for risk on a 0.0-1.0 scale from additive signals:
    +0.5  high value        (abs amount > $10,000)
    +0.3  off-hours         (00:00-05:00 UTC)
    +0.2  cross-border      (metadata.country != "US")
    +0.1  wire transfer
Score is clamped to 1.0. Transactions scoring >= 0.5 are flagged for review.
Records already rejected by the validator pass through untouched.
"""
from __future__ import annotations

from pipeline.common import Decimal, audit, to_decimal

HIGH_VALUE_THRESHOLD = Decimal("10000")
FLAG_THRESHOLD = 0.5

# Signal weights.
W_HIGH_VALUE = 0.5
W_OFF_HOURS = 0.3
W_CROSS_BORDER = 0.2
W_WIRE = 0.1


def _hour_utc(timestamp: str) -> int | None:
    """Extract the UTC hour from an ISO 8601 ``...THH:MM:SSZ`` timestamp."""
    try:
        return int(timestamp[11:13])
    except (ValueError, TypeError, IndexError):
        return None


def process_transaction(record: dict) -> dict:
    """Score a validated transaction for fraud risk.

    Rejected records are returned unchanged. Otherwise sets ``risk_score`` and
    ``status`` (``flagged`` or ``clear``).
    """
    data = dict(record)
    transaction_id = data.get("transaction_id") or "UNKNOWN"

    if data.get("status") == "rejected":
        return data  # never score a record that failed validation

    score = 0.0
    reasons: list[str] = []

    amount = abs(to_decimal(data["amount"]))
    if amount > HIGH_VALUE_THRESHOLD:
        score += W_HIGH_VALUE
        reasons.append("high_value")

    hour = _hour_utc(data.get("timestamp", ""))
    if hour is not None and 0 <= hour < 5:
        score += W_OFF_HOURS
        reasons.append("off_hours")

    country = (data.get("metadata") or {}).get("country")
    if country and country != "US":
        score += W_CROSS_BORDER
        reasons.append("cross_border")

    if data.get("transaction_type") == "wire_transfer":
        score += W_WIRE
        reasons.append("wire_transfer")

    score = min(round(score, 2), 1.0)
    data["risk_score"] = score
    data["risk_reasons"] = reasons
    data["status"] = "flagged" if score >= FLAG_THRESHOLD else "clear"
    audit("fraud_detector", transaction_id, f"{data['status']} (risk={score})")
    return data
