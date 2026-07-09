# 🏦 Transaction Processing Pipeline

> **Created by Mykola Bernadskyi** — Homework 6 Final Capstone
> An AI-powered, file-based transaction processing pipeline with a fraud-risk
> engine, a React dashboard, a custom MCP server, and a coverage-gated test suite.

---

## What this system does

This project ingests raw bank transactions and runs each one through a chain of
independent **agent microservices** — **validation → fraud detection →
settlement**. Each agent is its own FastAPI service exposing `POST /process`;
the orchestrator reads the agent order and endpoints from
**`pipeline-config.json`** and calls each service over HTTP in that order. Every
hop is persisted as a JSON envelope in `shared/`, so each transaction ends up in
`shared/results/` with a full audit trail: whether it was accepted or rejected
(and why), its fraud risk score, and its settlement figures.

Because the execution order lives in configuration rather than code, you can
reorder or repoint agents **without touching a single line of Python**.

A **React + TypeScript dashboard** lets you trigger a run and observe the outcome
(status counts, a risk chart, and a per-transaction table), while a custom
**FastMCP server** makes the results queryable in natural language from Claude
("what's the status of TXN002?"). Monetary values use `decimal.Decimal`
throughout — never floats — and account numbers are treated as PII and never
logged in plaintext.

---

## Agent responsibilities

Each agent is a separate microservice (`services/*.py`) wrapping pure logic from
`pipeline/*.py`, and exposes `POST /process` + `GET /health`.

- **Validator** (`:8001`) — checks required fields, parses the amount as a
  `Decimal` (non-zero; negative allowed only for refunds), and verifies the
  currency is a valid ISO 4217 code. Rejects bad records with a human-readable
  reason.
- **Fraud Detector** (`:8002`) — scores each transaction `0.0–1.0` from additive
  signals (high value > $10k, off-hours 00:00–05:00 UTC, cross-border, wire
  transfer) and flags anything scoring ≥ 0.5 for review.
- **Settlement** (`:8003`) — computes a 0.5% fee and net amount with
  `ROUND_HALF_UP`, marks the transaction settled, and preserves the fraud flag
  for downstream review. Rejected records are never settled.
- **Orchestrator** (`orchestrator.py`) — reads `pipeline-config.json`, resets the
  shared directories, loads `sample-transactions.json`, POSTs each record to
  every agent service in the configured order, and writes a summary.

---

## Architecture

```
                    ┌──────────────────────────────────────┐
                    │  React + TypeScript (Vite) dashboard  │
                    │  ▶ Run Pipeline · tiles · risk chart  │
                    └──────────────────┬───────────────────┘
                                       │ HTTP (REST, CORS)
                    ┌──────────────────▼───────────────────┐
                    │       FastAPI gateway (backend/)      │
                    │    POST /api/run   GET /api/results   │
                    └──────────────────┬───────────────────┘
                                       │ invokes
   sample-transactions.json ──────────►│
                                       ▼
   pipeline-config.json ──(order)──► orchestrator.py
                                       │
             ┌─────────────────────────┼─────────────────────────┐
             │ HTTP POST /process      │ HTTP POST /process      │ HTTP POST /process
             ▼                         ▼                         ▼
   ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
   │ validator  :8001  │──►│ fraud_detector    │──►│ settlement :8003  │
   │  (microservice)   │   │      :8002        │   │  (microservice)   │
   └───────────────────┘   └───────────────────┘   └───────────────────┘
             │                         │                         │
             └──────── orchestrator persists every hop ──────────┘
                                       ▼
     shared/input ──► shared/processing ──► shared/output ──► shared/results
                                       ▲
                                       │ reads
                    ┌──────────────────┴───────────────────┐
                    │   FastMCP server (mcp/server.py)      │
                    │   get_transaction_status ·            │
                    │   list_pipeline_results ·             │
                    │   resource pipeline://summary         │
                    └──────────────────────────────────────┘
```

> Agents never call each other — only the orchestrator calls them, in the order
> defined by `pipeline-config.json`. HTTP is the invocation mechanism; the
> `shared/` files are the audit trail.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Agent microservices & orchestrator | Python 3.12 |
| Money arithmetic | `decimal.Decimal` + `ROUND_HALF_UP` |
| Agent transport | HTTP REST (`httpx` client, FastAPI services) |
| API gateway | FastAPI + uvicorn |
| Frontend | React 18 + TypeScript + Vite |
| Date formatting | dayjs |
| Custom MCP server | FastMCP 3 |
| Docs-lookup MCP | context7 |
| Tests & coverage | pytest + pytest-cov (gate ≥ 80%, actual ≈ 98%) |
| Coverage gate | git `pre-push` hook + Claude Code `PreToolUse` hook |

---

## Quick start

```bash
cd homework-6
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

./demo.sh                       # starts all agent services, runs the pipeline, tears down
pytest --cov                    # run tests with coverage
```

`demo.sh` is the one-command path. To run the pieces manually, start each agent
service on its configured port and then `python orchestrator.py` — see
[HOWTORUN.md](HOWTORUN.md).

For the dashboard, MCP server, and full walkthrough, see **[HOWTORUN.md](HOWTORUN.md)**.

---

## Project layout

```
homework-6/
├── pipeline-config.json     # agent ORDER + service URLs (read by orchestrator)
├── demo.sh                  # one-shot: start services, run, tear down
├── orchestrator.py          # reads config, calls agent services over HTTP
├── pipeline/                # business logic: validator, fraud_detector, settlement, common
├── services/                # each agent as a FastAPI microservice (:8001-:8003)
├── shared/                  # audit trail: input → processing → output → results
├── backend/api.py           # FastAPI gateway for the dashboard
├── frontend/                # React + TS + Vite dashboard
├── mcp/server.py            # custom FastMCP server
├── mcp.json                 # context7 + pipeline-status
├── tests/                   # pytest suite (~98% coverage)
├── scripts/                 # coverage gate + hook installer
├── .claude/                 # /write-spec, /run-pipeline, /validate-transactions + hook
├── specification.md         # the plan (Agent 1)
├── agents.md                # project context for AI agents
└── research-notes.md        # context7 queries (Agent 2)
```

---

## The four workflow agents

This capstone was built with four AI workflow roles, each backed by an artifact:

| Agent | Role | Proof |
|-------|------|-------|
| Agent 1 — Specification | Wrote `specification.md` | `/write-spec` skill |
| Agent 2 — Code generation | Built the pipeline | `research-notes.md` (context7 queries) |
| Agent 3 — Unit tests | Tests + coverage gate | hook blocks push < 80% |
| Agent 4 — Documentation | This README & docs | author credit above |
