"""Tests for pipeline/validator.py (Stage 1)."""
import pytest

from pipeline.validator import _dry_run, process_transaction


def base_record(**overrides):
    rec = {
        "transaction_id": "TXN001",
        "timestamp": "2026-03-16T09:00:00Z",
        "amount": "1500.00",
        "currency": "USD",
        "transaction_type": "transfer",
    }
    rec.update(overrides)
    return rec


def test_valid_transaction_is_validated():
    result = process_transaction(base_record())
    assert result["status"] == "validated"
    assert "reason" not in result


def test_missing_amount_is_rejected():
    rec = base_record()
    del rec["amount"]
    result = process_transaction(rec)
    assert result["status"] == "rejected"
    assert "amount" in result["reason"]


def test_invalid_currency_is_rejected():
    result = process_transaction(base_record(currency="XYZ"))
    assert result["status"] == "rejected"
    assert "XYZ" in result["reason"]
    assert "ISO 4217" in result["reason"]


def test_non_decimal_amount_is_rejected():
    result = process_transaction(base_record(amount="not-a-number"))
    assert result["status"] == "rejected"
    assert "decimal" in result["reason"]


def test_zero_amount_is_rejected():
    result = process_transaction(base_record(amount="0.00"))
    assert result["status"] == "rejected"
    assert "non-zero" in result["reason"]


def test_negative_amount_rejected_for_non_refund():
    result = process_transaction(base_record(amount="-100.00",
                                             transaction_type="transfer"))
    assert result["status"] == "rejected"
    assert "refund" in result["reason"]


def test_negative_amount_allowed_for_refund():
    result = process_transaction(base_record(amount="-100.00",
                                             transaction_type="refund",
                                             currency="GBP"))
    assert result["status"] == "validated"


def test_missing_id_defaults_to_unknown_but_still_validates_fields():
    rec = base_record()
    del rec["transaction_id"]
    result = process_transaction(rec)
    assert result["status"] == "rejected"
    assert "transaction_id" in result["reason"]


def test_dry_run_reports_counts(sample_file, capsys):
    rc = _dry_run(sample_file)
    out = capsys.readouterr().out
    assert rc == 0
    assert "Total: 4" in out
    assert "Valid: 3" in out
    assert "Invalid: 1" in out


def test_process_does_not_mutate_input():
    rec = base_record()
    process_transaction(rec)
    assert "status" not in rec  # original untouched
