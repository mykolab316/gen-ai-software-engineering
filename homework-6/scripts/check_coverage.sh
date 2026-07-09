#!/usr/bin/env bash
# Coverage gate for the transaction pipeline.
#
# Runs the pytest suite with coverage. The 80% hard floor is enforced by
# `fail_under = 80` in pyproject.toml, so pytest exits non-zero when coverage
# drops below the threshold — which this script surfaces as a failed gate.
#
# Exit 0 = coverage OK (>= 80%). Exit 1 = gate failed (< 80% or tests broke).
set -uo pipefail

HW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HW_DIR"

if [ -x ".venv/bin/python" ]; then
  PY=".venv/bin/python"
else
  PY="$(command -v python3)"
fi

echo "🔍 Coverage gate: running tests (minimum 80%)…"
if $PY -m pytest --cov --cov-report=term-missing "$@"; then
  echo "✅ Coverage gate passed."
  exit 0
else
  echo "❌ Coverage gate FAILED — coverage below 80%. Push blocked." >&2
  exit 1
fi
