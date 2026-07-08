"""Tests for pipeline/settlement.py (Stage 3)."""
from decimal import Decimal

from pipeline.settlement import process_transaction


def scored(**overrides):
    rec = {
        "transaction_id": "TXN001",
        "amount": "1000.00",
        "currency": "USD",
        "status": "clear",
        "risk_score": 0.0,
    }
    rec.update(overrides)
    return rec


def test_clear_transaction_is_settled():
    result = process_transaction(scored())
    assert result["status"] == "settled"
    assert result["settled"] is True


def test_fee_is_half_percent():
    result = process_transaction(scored(amount="1000.00"))
    assert result["fee"] == "5.00"          # 1000 * 0.005
    assert result["net_amount"] == "995.00"  # 1000 - 5


def test_fee_uses_round_half_up():
    # 9999.99 * 0.005 = 49.99995 -> 50.00
    result = process_transaction(scored(amount="9999.99"))
    assert result["fee"] == "50.00"
    assert result["net_amount"] == "9949.99"


def test_flagged_transaction_settled_but_keeps_flag():
    result = process_transaction(scored(status="flagged", risk_score=0.6))
    assert result["status"] == "flagged"   # flag preserved for review
    assert result["settled"] is True
    assert "fee" in result


def test_rejected_transaction_not_settled():
    result = process_transaction(
        {"transaction_id": "TXN006", "amount": "10.00", "status": "rejected",
         "reason": "bad currency"}
    )
    assert result["settled"] is False
    assert "fee" not in result


def test_negative_refund_settlement():
    result = process_transaction(
        scored(amount="-100.00", currency="GBP", transaction_type="refund")
    )
    assert result["fee"] == "-0.50"
    assert result["net_amount"] == "-99.50"
    assert result["settled"] is True


def test_amounts_are_decimal_exact():
    # 0.1 + 0.2 float trap: ensure Decimal path keeps it exact
    result = process_transaction(scored(amount="0.30"))
    assert Decimal(result["net_amount"]) == Decimal("0.30") - Decimal(result["fee"])
