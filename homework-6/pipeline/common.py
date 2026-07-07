"""Shared helpers for all pipeline stages.

This module is the single home for the project's hard rules:
- money is always ``decimal.Decimal`` (never float), rounded ROUND_HALF_UP
- currencies are validated against an ISO 4217 allow-list
- PII (account numbers) is masked before it ever reaches a log line
- every stage emits a structured audit line

See ``agents.md`` and ``specification.md`` for the rationale.
"""
from __future__ import annotations

import logging
import sys
import uuid
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation

# --- Currencies (ISO 4217 allow-list) -------------------------------------
# A pragmatic subset; extend as needed. Anything not here is rejected.
ISO_4217 = {
    "USD", "EUR", "GBP", "JPY", "CHF", "CAD",
    "AUD", "CNY", "SEK", "NZD", "NOK", "SGD",
}

# Exponent used for all monetary rounding (2 decimal places).
CENTS = Decimal("0.01")

# --- Audit logging ---------------------------------------------------------
logger = logging.getLogger("pipeline")
if not logger.handlers:
    _handler = logging.StreamHandler(sys.stdout)
    _handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(_handler)
    logger.setLevel(logging.INFO)


def now_iso() -> str:
    """Current UTC time as an ISO 8601 string with a ``Z`` suffix."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def to_decimal(value) -> Decimal:
    """Parse a value into a Decimal. Raises InvalidOperation on bad input.

    Always goes through ``str`` so a stray float never introduces binary
    floating-point error.
    """
    return Decimal(str(value))


def money(value) -> Decimal:
    """Quantize a value to 2 decimal places using ROUND_HALF_UP.

    Pattern taken from the CPython ``decimal`` docs (context7 Query 1).
    """
    return to_decimal(value).quantize(CENTS, rounding=ROUND_HALF_UP)


def mask_account(account: str | None) -> str:
    """Mask a PII account number for safe logging, e.g. ``ACC-1001`` -> ``ACC-1***``."""
    if not account:
        return "***"
    return account[:5] + "***"


def audit(stage: str, transaction_id: str, outcome: str) -> None:
    """Emit one structured audit line: ``timestamp | stage | txn_id | outcome``.

    Never includes PII (account numbers / names).
    """
    logger.info("%s | %-14s | %-8s | %s", now_iso(), stage, transaction_id, outcome)


def make_envelope(data: dict, source_stage: str, target_stage: str) -> dict:
    """Wrap a transaction ``data`` dict in the standard hand-off envelope."""
    return {
        "message_id": str(uuid.uuid4()),
        "timestamp": now_iso(),
        "source_stage": source_stage,
        "target_stage": target_stage,
        "message_type": "transaction",
        "data": data,
    }


__all__ = [
    "ISO_4217", "CENTS", "InvalidOperation", "Decimal",
    "now_iso", "to_decimal", "money", "mask_account", "audit", "make_envelope",
]
