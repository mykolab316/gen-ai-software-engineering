"""Tests for pipeline/common.py helpers."""
from decimal import Decimal

import pytest

from pipeline.common import (
    ISO_4217,
    make_envelope,
    mask_account,
    money,
    now_iso,
    to_decimal,
)


def test_to_decimal_from_string_and_number():
    assert to_decimal("10.50") == Decimal("10.50")
    assert to_decimal(3) == Decimal("3")


def test_money_rounds_half_up_to_two_places():
    # 1.005 -> 1.01 with ROUND_HALF_UP (tie goes away from zero)
    assert money("1.005") == Decimal("1.01")
    assert money("2.344") == Decimal("2.34")
    assert money(Decimal("100") * Decimal("0.005")) == Decimal("0.50")


def test_mask_account_hides_pii():
    assert mask_account("ACC-1001") == "ACC-1***"
    assert mask_account("") == "***"
    assert mask_account(None) == "***"


def test_now_iso_is_utc_zulu():
    stamp = now_iso()
    assert stamp.endswith("Z")
    assert "T" in stamp


def test_make_envelope_shape():
    env = make_envelope({"transaction_id": "X1"}, "validator", "fraud_detector")
    assert env["source_stage"] == "validator"
    assert env["target_stage"] == "fraud_detector"
    assert env["message_type"] == "transaction"
    assert env["data"]["transaction_id"] == "X1"
    assert env["message_id"]  # uuid present
    assert env["timestamp"].endswith("Z")


def test_iso_4217_contains_majors():
    for code in ("USD", "EUR", "GBP", "JPY"):
        assert code in ISO_4217
    assert "XYZ" not in ISO_4217


@pytest.mark.parametrize("bad", ["abc", "", "1.2.3"])
def test_to_decimal_raises_on_garbage(bad):
    from decimal import InvalidOperation

    with pytest.raises(InvalidOperation):
        to_decimal(bad)
