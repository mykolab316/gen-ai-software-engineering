"""Tests for pipeline/fraud_detector.py (Stage 2)."""
import pytest

from pipeline.fraud_detector import _hour_utc, process_transaction


def validated(**overrides):
    rec = {
        "transaction_id": "TXN001",
        "timestamp": "2026-03-16T12:00:00Z",
        "amount": "1000.00",
        "currency": "USD",
        "transaction_type": "transfer",
        "metadata": {"country": "US"},
        "status": "validated",
    }
    rec.update(overrides)
    return rec


def test_low_risk_is_clear():
    result = process_transaction(validated())
    assert result["status"] == "clear"
    assert result["risk_score"] == 0.0


def test_high_value_adds_half():
    result = process_transaction(validated(amount="25000.00"))
    assert result["risk_score"] == 0.5
    assert "high_value" in result["risk_reasons"]


def test_off_hours_signal():
    result = process_transaction(validated(timestamp="2026-03-16T02:47:00Z"))
    assert "off_hours" in result["risk_reasons"]
    assert result["risk_score"] == pytest.approx(0.3)


def test_cross_border_signal():
    result = process_transaction(validated(metadata={"country": "DE"}))
    assert "cross_border" in result["risk_reasons"]
    assert result["risk_score"] == pytest.approx(0.2)


def test_wire_transfer_signal():
    result = process_transaction(validated(transaction_type="wire_transfer"))
    assert "wire_transfer" in result["risk_reasons"]


def test_combined_signals_flag_transaction():
    # high value + wire = 0.6 -> flagged
    result = process_transaction(
        validated(amount="25000.00", transaction_type="wire_transfer")
    )
    assert result["status"] == "flagged"
    assert result["risk_score"] == pytest.approx(0.6)


def test_score_clamped_to_one():
    # all signals: 0.5 + 0.3 + 0.2 + 0.1 = 1.1 -> clamps to 1.0
    result = process_transaction(
        validated(amount="99999.00", timestamp="2026-03-16T01:00:00Z",
                  metadata={"country": "DE"}, transaction_type="wire_transfer")
    )
    assert result["risk_score"] == 1.0
    assert result["status"] == "flagged"


def test_rejected_record_passes_through_unscored():
    rec = validated(status="rejected", reason="bad")
    result = process_transaction(rec)
    assert result["status"] == "rejected"
    assert "risk_score" not in result


def test_negative_amount_uses_absolute_value():
    result = process_transaction(
        validated(amount="-25000.00", transaction_type="refund")
    )
    assert "high_value" in result["risk_reasons"]


@pytest.mark.parametrize("ts,expected", [
    ("2026-03-16T02:47:00Z", 2),
    ("2026-03-16T23:00:00Z", 23),
    ("bad-timestamp", None),
    ("", None),
])
def test_hour_utc_parsing(ts, expected):
    assert _hour_utc(ts) == expected
