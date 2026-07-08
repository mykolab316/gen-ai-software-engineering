"""End-to-end integration test for the full pipeline via orchestrator.run().

Uses the ``isolated_shared`` fixture so it never touches the real shared/ tree.
"""
import json

import orchestrator


def _results(shared):
    """Load all final result payloads (excluding the summary file)."""
    out = {}
    for f in (shared / "results").glob("*.json"):
        if f.name.startswith("_"):
            continue
        data = json.loads(f.read_text())["data"]
        out[data["transaction_id"]] = data
    return out


def test_all_transactions_reach_results(isolated_shared, sample_file):
    summary = orchestrator.run(sample_path=sample_file)
    results = _results(isolated_shared)

    # Every input transaction has a result.
    assert summary["total"] == 4
    assert set(results) == {"T1", "T2", "T3", "T4"}


def test_outcomes_match_expectations(isolated_shared, sample_file):
    orchestrator.run(sample_path=sample_file)
    results = _results(isolated_shared)

    assert results["T1"]["status"] == "settled"        # normal
    assert results["T2"]["status"] == "flagged"        # high-value wire
    assert results["T3"]["status"] == "rejected"       # bad currency
    assert results["T4"]["status"] == "settled"        # negative refund ok


def test_summary_counts(isolated_shared, sample_file):
    summary = orchestrator.run(sample_path=sample_file)
    assert summary["by_status"]["settled"] == 2
    assert summary["by_status"]["flagged"] == 1
    assert summary["by_status"]["rejected"] == 1
    assert summary["rejected"][0]["transaction_id"] == "T3"


def test_summary_file_written(isolated_shared, sample_file):
    orchestrator.run(sample_path=sample_file)
    summary_file = isolated_shared / "results" / "_summary.json"
    assert summary_file.exists()
    data = json.loads(summary_file.read_text())
    assert data["total"] == 4


def test_envelope_format_preserved(isolated_shared, sample_file):
    orchestrator.run(sample_path=sample_file)
    any_file = next(
        f for f in (isolated_shared / "results").glob("*.json")
        if not f.name.startswith("_")
    )
    envelope = json.loads(any_file.read_text())
    assert envelope["source_stage"] == "settlement"
    assert envelope["message_type"] == "transaction"
    assert "message_id" in envelope


def test_run_is_deterministic(isolated_shared, sample_file):
    first = orchestrator.run(sample_path=sample_file)["by_status"]
    second = orchestrator.run(sample_path=sample_file)["by_status"]
    assert first == second


def test_real_sample_produces_eight_results(isolated_shared):
    """Uses the committed sample-transactions.json (default sample path)."""
    summary = orchestrator.run()
    assert summary["total"] == 8
    results = _results(isolated_shared)
    assert len(results) == 8
