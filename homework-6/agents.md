# Project Context for AI Agents

> This file is the "worldview" any AI agent (Claude Code / Copilot) should load
> before working in this repo. It describes **how to behave here** — the stack,
> the conventions, and where things live. The **what to build** lives in
> `specification.md`.
>
> Author: Mykola Bernadskyi

---

## 1. What this project is

An **AI-powered transaction processing pipeline**. It ingests raw bank
transactions from `sample-transactions.json`, runs them through a sequence of
independent stages (validation → fraud detection → settlement), and writes the
final outcomes to `shared/results/`. A React dashboard and a custom MCP server
let a human (or Claude) observe and query the results.

This is Homework 6 — the final capstone. The **output** is the working pipeline;
the **deliverable** is the pipeline plus the skills, hooks, and MCP integrations
that powered the workflow.

## 2. The four workflow agents

These are development-time roles, each backed by a concrete artifact:

| Agent | Role | Artifact (proof) |
|-------|------|------------------|
| Agent 1 — Specification | Produces `specification.md` | Skill `/write-spec` |
| Agent 2 — Code generation | Builds the pipeline stages | `research-notes.md` (2+ context7 queries) |
| Agent 3 — Unit tests | Writes tests + coverage gate | Hook that blocks push if coverage < 80% |
| Agent 4 — Documentation | Writes README/docs | `README.md` includes author name |

## 3. Tech stack

| Layer | Technology |
|-------|-----------|
| Pipeline stages, orchestrator | Python 3.11+ |
| Money arithmetic | `decimal.Decimal` (never `float`) |
| API bridge (frontend ↔ pipeline) | FastAPI + uvicorn |
| Frontend dashboard | React + TypeScript + Vite |
| Charts / visuals | Built-in `dataviz` conventions (no external plugin) |
| Custom MCP server | FastMCP (Python) |
| Docs lookup MCP | context7 (`@upstash/context7-mcp`) |
| Tests + coverage | pytest + pytest-cov (gate at 80%, target 90%) |

## 4. Hard rules (non-negotiable conventions)

- **Money:** always `decimal.Decimal`, parsed from string. NEVER `float` for
  amounts, fees, or settlement math. Use `ROUND_HALF_UP` for rounding.
- **Currencies:** validate against ISO 4217 (USD, EUR, GBP, JPY, …).
  `XYZ` and other non-ISO codes must be rejected.
- **Timestamps:** ISO 8601 with `Z` (UTC), e.g. `2026-03-16T10:00:00Z`.
- **PII:** account numbers and names are sensitive — never log them in
  plaintext. Mask (e.g. `ACC-1***`) or omit from audit logs.
- **Logging:** every stage logs an audit line with timestamp, stage name,
  transaction ID, and outcome.
- **Determinism:** stages are pure functions of their input record; no hidden
  global state. Same input → same output.

## 5. Repository layout

```
homework-6/
├── sample-transactions.json     # input data (8 records, with edge cases)
├── pipeline-config.json         # agent ORDER + service URLs (read by orchestrator)
├── demo.sh                      # one-shot: start services, run, tear down
├── specification.md             # WHAT we build (Agent 1 output)
├── agents.md                    # this file — HOW to work here
├── research-notes.md            # context7 queries (Agent 2)
├── orchestrator.py              # reads config, calls agent services over HTTP
├── pipeline/                    # business logic (pure functions)
│   ├── validator.py             # agent 1 logic
│   ├── fraud_detector.py        # agent 2 logic
│   └── settlement.py            # agent 3 logic
├── services/                    # each agent as a FastAPI microservice
│   ├── base.py                  # create_agent_app(name, process_fn)
│   ├── validator_service.py     # :8001
│   ├── fraud_service.py         # :8002
│   └── settlement_service.py    # :8003
├── shared/                      # audit trail written by the orchestrator
│   ├── input/  processing/  output/  results/
├── backend/api.py               # FastAPI gateway: /api/run, /api/results
├── frontend/                    # React + TS + Vite dashboard
├── mcp/server.py                # custom FastMCP server
├── mcp.json                     # context7 + pipeline-status servers
├── tests/                       # pytest suite (>= 80% coverage)
├── .claude/
│   ├── commands/                # /write-spec, /run-pipeline, /validate-transactions
│   └── settings.json            # coverage-gate hook
└── docs/                        # presentation.pdf + screenshots/
```

## 6. Agents as microservices (summary — full detail in specification.md)

Each agent runs as its **own FastAPI microservice**, exposing `POST /process`
(record in → record out) and `GET /health`. The orchestrator reads the agent
order and endpoints from **`pipeline-config.json`** and calls each service over
HTTP in that order. Services never call each other.

1. **Validator** (:8001) — required fields present, amount is a valid non-zero
   `Decimal` (negative allowed only for `refund`), currency is ISO 4217.
   Rejects bad records with a `reason`.
2. **Fraud Detector** (:8002) — scores risk `0.0–1.0` from signals: high value
   (> $10,000), off-hours activity (00:00–05:00 UTC), cross-border
   (country ≠ US), and transaction type. Flags scores ≥ 0.5.
3. **Settlement** (:8003) — for non-rejected records, computes fee (0.5%), net
   amount, and marks `settled`. Uses `Decimal` + `ROUND_HALF_UP`.

The business logic lives in `pipeline/*.py`; `services/*.py` are thin HTTP
wrappers built by `services/base.py::create_agent_app`. **The order is
configuration, not code** — reorder `pipeline-config.json` and the pipeline
changes with no code edit.

Run everything with `./demo.sh` (starts services, runs, tears down).

## 7. File-based hand-off protocol

The orchestrator persists every hop to `shared/` as a JSON envelope (agents
themselves never touch `shared/`). HTTP is the *invocation* mechanism; the files
are the *audit trail*. Standard envelope:

```json
{
  "message_id": "uuid4-string",
  "timestamp": "2026-03-16T10:00:00Z",
  "source_stage": "validator",
  "target_stage": "fraud_detector",
  "message_type": "transaction",
  "data": { "transaction_id": "TXN001", "amount": "1500.00", "currency": "USD", "status": "validated" }
}
```

Flow: `input/` → validator → `output/` → fraud_detector → `output/` →
settlement → `results/`. `processing/` holds the record while a stage works on it.

## 8. Known edge cases in the sample data

The 8 sample records are chosen to exercise the pipeline:

- **TXN002 / TXN005** — $25k / $75k → fraud flag (high value).
- **TXN003** — $9,999.99 → just under the $10k threshold (boundary test).
- **TXN004** — 02:47 UTC, country DE → off-hours + cross-border signals.
- **TXN006** — currency `XYZ` → validation rejection (not ISO 4217).
- **TXN007** — amount `-100.00`, type `refund` → negative allowed for refunds.

Any change to stage logic must keep these behaviors correct.

## 9. How agents hand off work

All state lives in **files on disk**, not in a single chat session. A new
session becomes productive by reading `specification.md` (the plan), this file
(the rules), and the existing code. Keep both docs current when scope changes.
