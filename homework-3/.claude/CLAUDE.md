# CLAUDE.md — Editor/AI Rules (Card Replacement & Notifications)

Project-level rules for AI-assisted coding in this repository. Read `specification.md` and `agents.md` first; this file encodes the day-to-day editor defaults.

## Project Context
- FinTech card-issuing feature: replace lost/stolen/damaged cards + multi-channel notifications.
- Stack: NestJS + TypeScript + PostgreSQL. Money via `Decimal`. External systems behind ports/stubs.
- This repo is for a **regulated** environment — security and auditability come before convenience.

## Naming Conventions
- Files: `kebab-case.ts` (`replacement-request.entity.ts`).
- Classes/types: `PascalCase`; methods/vars: `camelCase`; constants: `UPPER_SNAKE_CASE`.
- Modules grouped by domain: `replacement/`, `notifications/`, `fraud/`, `auth/`, `common/`.
- Card identifier in code/logs is always `cardToken` (never `pan`).

## Preferred Patterns
- Thin controllers, fat-free services with single responsibility; business rules live in services/domain.
- Ports & adapters for all external systems (Card service, fraud, notification provider).
- State changes flow through the documented state machine — no ad-hoc status writes.
- Idempotent state-changing endpoints (`Idempotency-Key` required).
- After-commit/outbox for notifications so dispatch never blocks or rolls back a transaction.
- Config-driven thresholds (fraud score, rate limits, latency budgets) — no magic numbers.

## FinTech-Sensitive Defaults (always apply)
- Mask PAN to last4 everywhere; never log PAN/CVV/full address.
- Never store CVV at rest after issuance.
- Audit every state-changing action with actor, role, IP, UTC timestamp, correlation ID.
- Append-only audit store — never generate UPDATE/DELETE against `replacement_event`.
- Lost/stolen → block old card before returning success (fail closed).
- Critical security notifications bypass quiet hours; informational ones respect them.

## What to Avoid
- Do NOT use floats for money — use `Decimal`.
- Do NOT auto-approve `RISK_REVIEW` requests.
- Do NOT expose another cardholder's data; enforce ownership/scope guards.
- Do NOT swallow illegal state transitions — throw a typed `409` error.
- Do NOT let a notification failure roll back a committed state change.
- Do NOT add comments/docs unless they explain non-obvious domain reasoning.

## Error & Response Conventions
- Typed domain errors → stable HTTP codes: `400` validation, `403` authz, `404` not found, `409` conflict/illegal transition, `422` business rule, `429` rate limit.
- Error body: `{ code, message }` — machine-readable code, human message, never sensitive data.
- Timestamps: UTC ISO-8601; localize only at presentation.

## Testing Expectations
- Unit-test the state machine, fraud thresholds, and quiet-hours logic.
- Integration-test create/approve/deny/cancel/activate against stubs.
- Cover edge cases E1–E14 from `specification.md`.
- Never weaken or delete tests to force a pass.
