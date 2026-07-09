"""FastAPI bridge between the React dashboard and the pipeline.

Endpoints:
    POST /api/run      -> runs the full pipeline, returns summary + results
    GET  /api/results  -> returns the latest summary + results (no re-run)
    GET  /api/health   -> liveness check

Run from the homework-6 root:
    uvicorn backend.api:app --reload --port 8000

CORS is configured for the Vite dev server (http://localhost:5173) following
the FastAPI CORSMiddleware pattern (context7 Query 2).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Make the homework-6 root importable so `orchestrator` and `pipeline` resolve
# regardless of the current working directory.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import orchestrator  # noqa: E402  (import after sys.path tweak)

RESULTS = ROOT / "shared" / "results"
SUMMARY_FILE = RESULTS / "_summary.json"

app = FastAPI(title="Transaction Pipeline API", version="1.0.0")


# Allow the React dev server to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_results() -> list[dict]:
    """Return the ``data`` payload of every result file (excluding _summary).

    Reads from ``orchestrator.RESULTS`` at call time (single source of truth),
    so tests that redirect the orchestrator's shared dirs are honored here too.
    """
    results_dir = orchestrator.RESULTS
    if not results_dir.exists():
        return []
    items = []
    for f in sorted(results_dir.glob("*.json")):
        if f.name.startswith("_"):
            continue
        items.append(json.loads(f.read_text())["data"])
    return items


def _load_summary() -> dict | None:
    summary_file = orchestrator.SUMMARY_FILE
    if summary_file.exists():
        return json.loads(summary_file.read_text())
    return None


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/run")
def run_pipeline() -> dict:
    """Run the pipeline end to end and return the fresh summary + results."""
    summary = orchestrator.run()
    return {"summary": summary, "results": _load_results()}


@app.get("/api/results")
def get_results() -> dict:
    """Return the latest results without re-running the pipeline."""
    return {"summary": _load_summary(), "results": _load_results()}
