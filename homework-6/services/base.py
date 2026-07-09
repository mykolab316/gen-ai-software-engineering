"""Factory for agent microservices.

Every pipeline agent is a separate REST service exposing the same contract:

    POST /process   body: {...transaction record...}  -> updated record
    GET  /health    -> {"status": "ok", "agent": "<name>"}

The business logic lives in ``pipeline/*.py`` and is reused unchanged — a
service is only a thin HTTP wrapper around ``process_transaction``.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Callable

from fastapi import FastAPI

# Make the homework-6 root importable regardless of cwd.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def create_agent_app(name: str, process_fn: Callable[[dict], dict]) -> FastAPI:
    """Build a FastAPI app that exposes ``process_fn`` over HTTP."""
    app = FastAPI(title=f"{name} agent", version="1.0.0")

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok", "agent": name}

    @app.post("/process")
    def process(record: dict) -> dict:
        """Run this agent's stage over a single transaction record."""
        return process_fn(record)

    return app
