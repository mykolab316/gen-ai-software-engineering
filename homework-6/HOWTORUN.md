# How to Run

Step-by-step instructions to set up and run every part of the transaction
processing pipeline. All commands are run from the `homework-6/` directory.

> **Author:** Mykola Bernadskyi

---

## 0. Prerequisites

- **Python 3.12+** (required — FastMCP needs ≥ 3.10; the system's 3.9 is too old)
- **Node.js 18+** and **npm** (for the dashboard)

Check:
```bash
python3.12 --version   # -> Python 3.12.x
node --version         # -> v18+ or newer
```

---

## 1. Set up the Python environment

```bash
cd homework-6
python3.12 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

You should now have FastAPI, uvicorn, FastMCP, pytest, and pytest-cov installed.

---

## 2. Run the pipeline (core deliverable)

```bash
python orchestrator.py
```

Expected: an audit log for each stage, then a summary. All 8 transactions from
`sample-transactions.json` are written to `shared/results/`:

```
PIPELINE SUMMARY
  Total processed : 8
  flagged         : 3
  rejected        : 1
  settled         : 4
  Rejected: TXN006 — currency 'XYZ' is not a valid ISO 4217 code
```

Inspect the outputs:
```bash
ls shared/results/                 # one JSON per transaction + _summary.json
cat shared/results/TXN002.json     # a flagged, settled transaction
```

---

## 3. Validate transactions only (no full run)

```bash
python -m pipeline.validator --dry-run
```

Prints total / valid / invalid counts and a table with rejection reasons.

---

## 4. Run the dashboard (front-end)

The dashboard needs the backend API running. Use **two terminals**.

**Terminal A — backend (FastAPI on :8000):**
```bash
source .venv/bin/activate
uvicorn backend.api:app --reload --port 8000
```

**Terminal B — frontend (React on :5173):**
```bash
cd frontend
npm install          # first time only
npm run dev
```

Open **http://localhost:5173** and click **▶ Run Pipeline**. You'll see status
tiles, a fraud-risk chart with the `flag ≥ 0.5` threshold, and a results table.
Toggle your OS light/dark mode to see the dashboard follow it.

---

## 5. Run the tests with coverage

```bash
pytest --cov --cov-report=term-missing
```

Expected: **56 passed**, total coverage **≈ 98%** (gate floor is 80%).

---

## 6. Enable the coverage-gate hook (blocks push < 80%)

```bash
bash scripts/install-hooks.sh      # points git hooksPath at .githooks/
```

Now `git push` runs the coverage gate first and is blocked if coverage drops
below 80%. To test the gate directly:
```bash
bash scripts/check_coverage.sh                 # passes at current coverage
bash scripts/check_coverage.sh --cov-fail-under=100   # forces a FAIL (demo)
```
Disable again with: `git config --unset core.hooksPath`.

---

## 7. Run the custom MCP server

Standalone:
```bash
python mcp/server.py
```

Or register both MCP servers via `mcp.json` (context7 + pipeline-status) in your
MCP client. The server exposes:
- **tool** `get_transaction_status(transaction_id)`
- **tool** `list_pipeline_results()`
- **resource** `pipeline://summary`

> Run the pipeline (step 2) at least once so `shared/results/` is populated
> before querying the MCP server.

---

## 8. Slash-command skills (Claude Code)

Open `homework-6/` as the workspace in Claude Code to use:
- `/write-spec` — regenerate the specification from the template
- `/run-pipeline` — run the pipeline end to end and summarize
- `/validate-transactions` — validate the sample without processing

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ModuleNotFoundError: fastapi` | Activate the venv: `source .venv/bin/activate` |
| Dashboard shows "Backend not reachable" | Start the backend (step 4, Terminal A) |
| `fastmcp` install fails | You're on Python 3.9 — use `python3.12` for the venv |
| Port already in use | `lsof -ti:8000 | xargs kill` (or `:5173`) |
