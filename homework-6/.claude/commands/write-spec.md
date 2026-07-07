---
description: Generate specification.md for the transaction pipeline from the project template
---

# /write-spec — Specification generator (Agent 1)

You are **Agent 1 — Specification**. Produce a complete, precise
`specification.md` for the transaction processing pipeline, following the
template below. This is written **before any pipeline code**.

## Steps

1. **Load context.** Read `agents.md` for the stack, hard rules (Decimal money,
   ISO 4217 currencies, PII handling), repository layout, and the pipeline
   stage summary. Read `sample-transactions.json` to ground the spec in the real
   input shape and its edge cases (invalid currency `XYZ`, negative refund,
   high-value wires, off-hours + cross-border records).
2. **Generate `specification.md`** in the repo root using the exact 5-section
   structure below. Every section is required.
3. **Ground every decision** in the sample data and the `agents.md` rules — no
   generic filler. Thresholds, currencies, and field names must match reality.
4. **Report** a short summary of what was produced and any assumptions made.

## Required structure for `specification.md`

```markdown
# Transaction Processing Pipeline — Specification

> Author: Mykola Bernadskyi

## 1. High-Level Objective
One sentence describing what the pipeline does.

## 2. Mid-Level Objectives
4–5 concrete, testable requirements. Each must be verifiable by a test.
Examples to adapt (do not copy verbatim):
- Transactions above $10,000 are flagged for fraud review with a risk score.
- Rejected transactions are written to shared/results/ with a `reason` field.
- All pipeline stages log operations with ISO 8601 timestamps.

## 3. Implementation Notes
- Monetary values: decimal.Decimal only, never float; ROUND_HALF_UP.
- Currency codes: ISO 4217 (USD, EUR, GBP, JPY, …); reject others.
- Logging: audit trail with timestamp, stage name, transaction ID, outcome.
- PII: account numbers and names are sensitive — no plaintext logging.
- File-based hand-off envelope (message_id, source_stage, target_stage, data).

## 4. Context
- Beginning state: sample-transactions.json with raw records (list the fields).
- Ending state: processed results in shared/results/, a pipeline summary
  report, and test coverage >= 90%.

## 5. Low-Level Tasks
One entry per pipeline stage (validator, fraud_detector, settlement), each in
this exact format:

    Task: [Pipeline Stage Name]
    Prompt: "[Exact prompt you will give Claude Code / Copilot to build it]"
    File to CREATE: pipeline/<stage>.py
    Function to CREATE: process_transaction(record: dict) -> dict
    Details: [What the stage checks, transforms, or decides — with thresholds]
```

## Quality checklist (self-verify before finishing)

- [ ] All 5 sections present and non-empty.
- [ ] Mid-Level Objectives are testable (each maps to a future test).
- [ ] Implementation Notes cover Decimal, ISO 4217, logging, PII.
- [ ] One Low-Level Task per stage, each with the 5 required fields.
- [ ] Thresholds and field names match `sample-transactions.json` and `agents.md`.
