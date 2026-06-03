# agents.md — AI Agent Guidelines (Card Replacement & Notifications)

These rules govern how an AI coding partner must behave when implementing the `Card Replacement & Notifications` feature defined in `specification.md`. The agent must treat this file as binding.

---

## 1. Tech Stack Assumptions

- **Language/runtime:** TypeScript on Node.js (LTS).
- **Framework:** NestJS (modules → controllers → services → repositories), consistent with prior coursework.
- **Persistence:** PostgreSQL via a repository abstraction; migrations are explicit and reviewed.
- **Money:** all monetary values use `Decimal` (e.g. `decimal.js`); **never** `number`/float.
- **IDs:** card tokens and request IDs are opaque ULIDs/UUIDs; never derived from PAN.
- **External systems** are accessed only through ports/interfaces with stub adapters (Card service, Fraud scoring, Notification provider).

## 2. Domain Rules (Banking / Card Issuing)

- A `lost` or `stolen` reason **must block the old card for new authorizations before** the create-request call returns success (**fail closed**). If the block fails, do not create the request.
- A `damaged` reason keeps the old card usable until the replacement is activated.
- Reissue **never generates PAN/expiry/CVV locally** — always delegate to the Card service. The new card inherits funding account, limits, and standing.
- The card-replacement **state machine** in `specification.md` is the single source of truth. Illegal transitions raise a typed error (`409`), never a silent no-op.
- **Never auto-approve** a request in `RISK_REVIEW`; it requires an ops action.

## 3. Security & Compliance Constraints

- **Never log, return in lists, or display in full** a PAN. Display only masked last4 (`**** **** **** 1234`).
- **Never store CVV at rest** after issuance.
- Logs may contain card **token** + last4 only — never PAN, CVV, or full address.
- All state-changing actions are **attributed** (actor, role, source IP, UTC ISO-8601 timestamp, correlation ID).
- Audit store is **append-only**: never emit code that UPDATEs or DELETEs audit/event rows.
- Enforce authorization: ownership for cardholder actions; scopes (`ops:replacement.review`, `fraud:replacement.hold`) for privileged actions.

## 4. Edge-Case Handling (agent defaults)

- **Always prefer idempotent writes.** All state-changing endpoints require an `Idempotency-Key`; a repeated key returns the original result with no duplicate side effect.
- Treat concurrent requests for the same card as a conflict (`409`), not a second active request.
- On notification-provider failure, **advance state anyway** and retry the dispatch (use outbox/after-commit); a notification failure must never roll back a state change.
- Apply notification dedupe keyed by `(requestId, milestone, channel)`.
- Respect quiet hours and channel preferences for informational events; **bypass quiet hours only for security-critical events** (lost/stolen block).
- Refer to the `Edge Cases & Failure Modes` table (E1–E14) in `specification.md` and implement the documented expected behavior for each.

## 5. Code Style

- Small, single-responsibility services; controllers stay thin.
- Typed domain errors mapped to stable HTTP codes (`400/403/404/409/422/429`); error bodies expose a machine `code` + human `message`, never sensitive data.
- Validate all input with DTOs + whitelist validation (reject unknown fields).
- No magic numbers — thresholds, limits, and budgets come from named config.
- Timestamps in UTC ISO-8601; localize only at presentation.
- No comments unless they explain non-obvious domain reasoning; prefer clear names.

## 6. Testing & Verification Expectations

- Provide **unit** tests for the state machine, fraud thresholds, and quiet-hours logic.
- Provide **integration** tests for create/approve/deny/cancel/activate against stub adapters.
- Cover every edge case E1–E14 with a test or a documented manual check.
- Include an **audit-replay** check that reconstructs a full `REQUESTED → COMPLETED` timeline from `replacement_event`.
- Use the documented fixtures (cardholder, ops user, fraud user, high-risk profile). Do not weaken or delete tests to make them pass.

## 7. Things the Agent Must Never Do

- Never log/return a full PAN or CVV.
- Never auto-approve a `RISK_REVIEW` request.
- Never mutate an audit/event record.
- Never expose another cardholder's request.
- Never use floats for money.
- Never let a notification failure roll back a committed state transition.
