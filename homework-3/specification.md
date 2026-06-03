# Card Replacement & Notifications — Specification

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High- and Mid-Level Objectives. This document is the single source of truth: an engineering team **or** an AI coding agent should be able to execute it without guessing.

> **Status:** Specification only (homework-3). No production code is part of this deliverable.
> **Domain:** Regulated card-issuing product — replacement of lost/stolen/damaged cards and the notifications that accompany the flow.

---

## Glossary

| Term | Meaning |
|------|---------|
| **PAN** | Primary Account Number (the 16-digit card number). Sensitive; never logged in full. |
| **Card token** | Non-sensitive surrogate identifier for a card used across services in place of the PAN. |
| **Reissue** | Issuance of a new physical/virtual card that inherits the funding account of a prior card. |
| **Replacement request (RR)** | A cardholder- or ops-initiated request that drives the reissue state machine. |
| **MLO** | Mid-Level Objective (used as a traceability tag, e.g. `→ MLO-3`). |
| **Idempotency key** | Client-supplied unique key that guarantees a state-changing request is applied at most once. |
| **Quiet hours** | Time window during which non-critical notifications are deferred per user locale. |

---

## High-Level Objective

- Enable a cardholder to **replace a lost, stolen, or damaged card** and receive **timely, multi-channel notifications** at every meaningful step, while giving ops/compliance and fraud full auditability and control.
- **Scope boundary:** This feature covers the replacement *request → reissue → activation* lifecycle and its notifications only; it does **not** cover original card onboarding, statementing, payments authorization, or dispute/chargeback handling.

---

## Stakeholders & Lenses

| Stakeholder | Primary interest | Used to tag objectives |
|-------------|------------------|------------------------|
| **Cardholder (end-user)** | Fast, clear, safe replacement; stay informed | `[user]` |
| **Ops / Compliance** | Auditability, regulated controls, override authority | `[ops]` |
| **Fraud** | Detect abuse of the replacement channel; freeze risky flows | `[fraud]` |

---

## Mid-Level Objectives

Each objective is **observable** — it describes what changes in the world when it succeeds. Each carries a stakeholder lens and an ID for traceability.

- **MLO-1 `[user]` — Initiate replacement.** A cardholder can open a replacement request for an eligible card, selecting a reason (lost / stolen / damaged) and a delivery address; the originating card is immediately blocked for new authorizations when the reason is lost/stolen.
- **MLO-2 `[user]` — Reissue with continuity.** A new card token is issued that inherits the funding account, limits, and standing of the prior card, with a new PAN/expiry/CVV; the old card token transitions to a terminal `REPLACED` state.
- **MLO-3 `[fraud]` — Risk gating.** Each replacement request is scored against fraud signals (velocity, address change, device/geo anomalies); high-risk requests are routed to manual review instead of auto-approval.
- **MLO-4 `[user]` — Multi-channel notifications.** The cardholder receives notifications (push, email, SMS) at request-received, approved/blocked, shipped, and activated milestones, honoring channel preferences and quiet hours.
- **MLO-5 `[ops]` — Ops control & override.** Ops/compliance can view any replacement request, approve/deny a request in manual review, and force-cancel a request, with every action attributed and audit-logged.
- **MLO-6 `[ops][fraud]` — Auditability.** Every state transition and notification dispatch produces an immutable, queryable audit record sufficient to reconstruct the full timeline of any replacement request.
- **MLO-7 `[user]` — Activation.** A cardholder can activate a delivered replacement card, after which it becomes usable and the request reaches the terminal `COMPLETED` state.

---

## Non-Functional & Policy Requirements

All numeric values are **assumed targets** for a FinTech UX/ops context with a one-line justification; they are not measured production figures.

### Security & Privacy
- **PAN handling:** Full PAN is never logged, never returned in list endpoints, and only ever displayed masked (`**** **** **** 1234`). *Justification: PCI-DSS requirement; reduces breach blast radius.*
- **CVV/expiry:** CVV is never stored at rest after issuance; expiry returned only to the authenticated owner.
- **Transport/at-rest:** TLS 1.2+ in transit; AES-256 (or KMS-managed equivalent) at rest for any card-data table. *Justification: industry baseline for cardholder data.*
- **Authorization:** Cardholders may act only on their own cards; ops/fraud actions require role-based scopes (`ops:replacement.review`, `fraud:replacement.hold`).

### Audit & Logging
- **Immutability:** Audit records are append-only; no UPDATE/DELETE on the audit store.
- **Attribution:** Every state-changing action records actor identity, role, source IP, timestamp (UTC, ISO-8601), and a correlation/request ID.
- **Retention:** Audit retention **7 years**. *Justification: typical regulatory record-keeping horizon for card operations.*
- **Sensitive data in logs:** Logs carry card **token** + last4 only — never PAN, CVV, or full address.

### Reliability
- **Notification delivery:** At-least-once delivery with dedupe; target **≥ 99.5%** of notifications delivered to the provider within SLA. *Justification: balances cost vs. cardholder trust for a non-payment-critical channel.*
- **State durability:** No replacement request may be lost on partial failure; the state machine is recoverable from the audit/event log.

### Performance (assumed targets)
| Metric | Target | Justification |
|--------|--------|---------------|
| Create replacement request API | **p95 ≤ 400 ms**, p99 ≤ 800 ms | Interactive user action; sub-second feels instant. |
| Read request status API | **p95 ≤ 250 ms** | High-frequency polling/refresh path. |
| Auto-decision (fraud score → approve/route) | **≤ 2 s** end-to-end | Synchronous enough to show outcome before user leaves screen. |
| Notification enqueue→provider dispatch | **p95 ≤ 5 s** for critical (blocked/shipped); **≤ 60 s** for informational | Critical events drive user action; info events tolerate batching. |
| Read-after-write consistency (status visible) | **≤ 1 s** | User expects to see their just-created request. |
| List pagination | **page size default 20, max 100** | Bounds payload + DB cost. |
| Rate limit (create RR) | **5 requests / cardholder / hour** | Throttles fraud abuse and accidental duplicates. |

---

## Implementation Notes (Guardrails for Builders)

- **Money & identifiers:** Use `Decimal` for any monetary value (limits, fees); never floats. Card tokens are opaque ULIDs/UUIDs; never derive a token from the PAN.
- **Idempotency:** All state-changing endpoints require an `Idempotency-Key` header. Re-sending the same key returns the original result without creating a duplicate request. *Critical for the create-RR and activate endpoints.*
- **State machine (single source of truth for status):**
  - States: `REQUESTED → RISK_REVIEW → APPROVED → SHIPPED → DELIVERED → ACTIVATED → COMPLETED`, plus side states `DENIED`, `CANCELLED`, and the old card's `REPLACED`.
  - Transitions are explicit and validated; illegal transitions are rejected with a typed error, never silently ignored.
- **Error semantics:** Use typed domain errors mapped to stable HTTP codes — `400` validation, `403` authorization, `404` not found, `409` conflict/illegal transition, `422` business-rule violation, `429` rate limit. Error bodies carry a machine-readable `code` and a human `message`, never sensitive data.
- **Card status coupling:** A `lost`/`stolen` reason MUST block the old card for new authorizations **before** the request returns success (fail closed). A `damaged` reason keeps the old card usable until the replacement is activated.
- **Notifications:** Templated, localized, channel-aware. Respect per-user channel preferences and quiet hours **except** for security-critical events (lost/stolen block), which always send immediately on all enabled channels.
- **PII formatting:** Addresses masked in logs and list views; full address only in the detail view to authorized actors.
- **Time:** All timestamps stored and logged in UTC ISO-8601; localization applied only at presentation.
- **Conventions an agent must not violate:** never log PAN/CVV; never auto-approve a `RISK_REVIEW` request; never mutate an audit record; never expose another cardholder's request.

---

## Context

### Beginning context (assumed to exist before work starts)
- A card-issuing platform exposing a **Card service** (read card by token, set card status) — hypothetical internal API.
- An **Account/identity service** providing authenticated user identity, roles, and channel/locale preferences.
- A **Notification provider** abstraction (push/email/SMS) — hypothetical, behind an interface.
- A relational datastore (PostgreSQL assumed) and an append-only audit store.
- Repo skeleton: NestJS + TypeScript service with module/controller/service/repository conventions (consistent with prior coursework). No replacement feature exists yet.

### Ending context (artifacts/state that exist after work)
- `replacement` module: controller, service, state-machine, DTOs, repository.
- `notifications` module: dispatcher, channel adapters (interface + stubs), template registry.
- `fraud` integration: a scoring port + a stub adapter with documented signals.
- Persistence: `replacement_request`, `replacement_event` (audit), `notification_log` tables (schemas documented).
- A documented set of REST endpoints (see Low-Level Tasks) and their acceptance criteria.
- Test documentation: unit/integration/e2e categories and fixtures described (as documentation, not necessarily executed for this homework).

---

## Low-Level Tasks

> Each task names the file/function, gives a precise instruction, links to the MLO it serves, and ends with **Acceptance Criteria (DoD)**. Tasks are ordered to build bottom-up.

### 1. Define the replacement domain model & state machine `→ MLO-2, MLO-7`
- **Prompt:** "Create the `ReplacementRequest` entity and a `CardReplacementStateMachine` enforcing the documented transitions; reject illegal transitions with a typed `IllegalTransitionError`."
- **File:** `src/replacement/domain/replacement-request.entity.ts`, `src/replacement/domain/state-machine.ts`
- **Function/Class:** `ReplacementRequest`, `CardReplacementStateMachine.transition(from, to)`
- **Details:** States and side states exactly per Implementation Notes; transition table is data-driven; expose `canTransition()` and `assertTransition()`.
- **Acceptance Criteria (DoD):**
  - Every legal transition listed in the spec is allowed; every other transition throws `IllegalTransitionError` (HTTP 409).
  - `REPLACED` is terminal for the old card; `COMPLETED`, `DENIED`, `CANCELLED` are terminal for the request.
  - Unit tests enumerate all legal + a sample of illegal transitions.

### 2. Define DTOs & validation for create-RR `→ MLO-1`
- **Prompt:** "Create `CreateReplacementRequestDto` with validation for reason enum, masked-safe address, and required `Idempotency-Key`."
- **File:** `src/replacement/dto/create-replacement-request.dto.ts`
- **Function/Class:** `CreateReplacementRequestDto`
- **Details:** `reason ∈ {lost, stolen, damaged}`; address fields validated; reject unknown fields; `cardToken` required and owned by caller.
- **Acceptance Criteria (DoD):**
  - Invalid reason / missing address / missing idempotency key → `400` with machine-readable `code`.
  - Unknown/extra fields are rejected (whitelist validation).

### 3. Implement create-replacement-request endpoint `→ MLO-1, MLO-3`
- **Prompt:** "Create `POST /cards/:cardToken/replacements` that validates ownership, enforces idempotency + rate limit, blocks the old card on lost/stolen, computes a fraud score, and persists a `REQUESTED` (or `RISK_REVIEW`) request."
- **File:** `src/replacement/replacement.controller.ts`, `src/replacement/replacement.service.ts`
- **Function/Class:** `ReplacementController.create()`, `ReplacementService.createRequest()`
- **Details:** Ownership check; on lost/stolen call Card service to block **before** returning; fail closed if block fails. Route to `RISK_REVIEW` if score ≥ threshold else `APPROVED`-eligible.
- **Acceptance Criteria (DoD):**
  - Same `Idempotency-Key` returns the original request, no duplicate row (verified by integration test).
  - Lost/stolen: old card is blocked before a `201` is returned; if blocking fails, request is not created and a `409`/`5xx` is returned.
  - >5 requests/hour for one cardholder → `429`.
  - High-risk score → state `RISK_REVIEW`, never auto-approved.

### 4. Implement fraud scoring port + stub adapter `→ MLO-3`
- **Prompt:** "Define a `FraudScoringPort` interface and a `StubFraudAdapter` that scores on documented signals."
- **File:** `src/fraud/fraud-scoring.port.ts`, `src/fraud/stub-fraud.adapter.ts`
- **Function/Class:** `FraudScoringPort.score(context)`, `StubFraudAdapter`
- **Details:** Signals: request velocity, shipping-address change vs. on-file, device/geo anomaly, recency of prior replacement. Return `{score: 0..100, reasons: string[]}`.
- **Acceptance Criteria (DoD):**
  - Score ≥ documented threshold sets `RISK_REVIEW`; reasons are persisted to the audit event (no PII beyond masked).
  - Adapter is swappable via DI without touching the service.

### 5. Implement reissue (card continuity) `→ MLO-2`
- **Prompt:** "On approval, issue a new card token via the Card service inheriting funding account + limits, and transition the old card to `REPLACED`."
- **File:** `src/replacement/replacement.service.ts`
- **Function/Class:** `ReplacementService.reissue()`
- **Details:** New PAN/expiry/CVV are produced by the Card service (never by this module); link new token to the request; old token → `REPLACED` (terminal).
- **Acceptance Criteria (DoD):**
  - New card inherits funding account + limits + standing; verified by integration test against the Card service stub.
  - Old card token is `REPLACED` and cannot be reissued again.
  - No PAN appears in any log or response except masked last4.

### 6. Implement ops review endpoints (approve/deny) `→ MLO-5, MLO-3`
- **Prompt:** "Create ops endpoints to approve or deny a `RISK_REVIEW` request, gated by role scope, fully audited."
- **File:** `src/replacement/ops/ops-review.controller.ts`
- **Function/Class:** `OpsReviewController.approve()`, `.deny()`
- **Details:** Requires `ops:replacement.review`; approve → triggers reissue (task 5); deny → `DENIED` with reason.
- **Acceptance Criteria (DoD):**
  - Caller without scope → `403`; action without a reason on deny → `422`.
  - Approve/deny are idempotent and recorded with actor attribution.

### 7. Implement force-cancel endpoint `→ MLO-5`
- **Prompt:** "Create an ops force-cancel that moves an in-flight request to `CANCELLED` and unblocks the old card if appropriate."
- **File:** `src/replacement/ops/ops-review.controller.ts`
- **Function/Class:** `OpsReviewController.cancel()`
- **Details:** Only legal from non-terminal states; records reason; if old card was blocked solely by this request and no replacement issued, optionally unblock per policy.
- **Acceptance Criteria (DoD):**
  - Cancel from a terminal state → `409`.
  - Cancellation reason + actor are audited.

### 8. Implement activation endpoint `→ MLO-7`
- **Prompt:** "Create `POST /cards/:cardToken/activate` that activates a delivered replacement and completes the request."
- **File:** `src/replacement/replacement.controller.ts`
- **Function/Class:** `ReplacementController.activate()`
- **Details:** Requires ownership + `Idempotency-Key`; legal only from `DELIVERED`; on success card becomes usable, request → `COMPLETED`.
- **Acceptance Criteria (DoD):**
  - Activation from a non-`DELIVERED` state → `409`.
  - Re-sending the same idempotency key does not double-activate.

### 9. Persist the request & audit/event store `→ MLO-6`
- **Prompt:** "Create repositories and schemas for `replacement_request` and append-only `replacement_event`."
- **File:** `src/replacement/persistence/*.ts`, migration docs
- **Function/Class:** `ReplacementRepository`, `ReplacementEventRepository`
- **Details:** Every transition writes a `replacement_event` row (actor, role, from, to, reason, correlationId, UTC ts). No UPDATE/DELETE permitted on events.
- **Acceptance Criteria (DoD):**
  - The full timeline of any request is reconstructable from `replacement_event` alone.
  - Attempted UPDATE/DELETE on events is rejected (DB grant or app guard).

### 10. Implement notification dispatcher + channel adapters `→ MLO-4`
- **Prompt:** "Create a `NotificationDispatcher` with push/email/SMS adapter interfaces and stubs, honoring preferences and quiet hours."
- **File:** `src/notifications/dispatcher.ts`, `src/notifications/channels/*.ts`
- **Function/Class:** `NotificationDispatcher.dispatch(event)`
- **Details:** At-least-once with dedupe key per (requestId, milestone, channel); critical events bypass quiet hours; informational events may be deferred.
- **Acceptance Criteria (DoD):**
  - Duplicate dispatch with the same dedupe key sends once (verified by test).
  - Lost/stolen block notification ignores quiet hours; informational notification respects them.
  - Every dispatch writes a `notification_log` row.

### 11. Wire milestone notifications to state transitions `→ MLO-4, MLO-6`
- **Prompt:** "Emit notifications on REQUESTED, APPROVED/DENIED, SHIPPED, DELIVERED, ACTIVATED transitions."
- **File:** `src/replacement/replacement.service.ts`, `src/notifications/dispatcher.ts`
- **Function/Class:** transition hook → `NotificationDispatcher.dispatch()`
- **Details:** Notification dispatch is decoupled from the transaction commit (outbox/after-commit) so a notification failure never rolls back a state change.
- **Acceptance Criteria (DoD):**
  - A notification-provider failure does not roll back or lose the state transition; the dispatch is retried.
  - Each milestone produces exactly one logical notification per enabled channel.

### 12. Implement status read + list endpoints with pagination `→ MLO-1, MLO-5`
- **Prompt:** "Create `GET /replacements/:id` and `GET /replacements` (scoped by owner or ops) with bounded pagination."
- **File:** `src/replacement/replacement.controller.ts`
- **Function/Class:** `ReplacementController.getOne()`, `.list()`
- **Details:** Owner sees only their requests; ops sees all within scope; default page 20, max 100; never return PAN.
- **Acceptance Criteria (DoD):**
  - A cardholder cannot read another cardholder's request (`404`/`403`).
  - Page size > 100 is clamped/rejected; responses contain masked card data only.

### 13. Authorization guards & scopes `→ MLO-5, security policy`
- **Prompt:** "Add guards enforcing ownership for cardholder actions and scopes for ops/fraud actions."
- **File:** `src/auth/guards/*.ts`
- **Function/Class:** `OwnershipGuard`, `ScopeGuard`
- **Acceptance Criteria (DoD):**
  - Missing/empty scope → `403`; cross-owner access → blocked; covered by tests.

### 14. Rate limiting & idempotency middleware `→ MLO-1, performance policy`
- **Prompt:** "Add rate-limit (5/hour create-RR) and an idempotency store keyed by header."
- **File:** `src/common/idempotency.interceptor.ts`, `src/common/rate-limit.guard.ts`
- **Acceptance Criteria (DoD):**
  - Exceeding limit → `429` with `Retry-After`.
  - Idempotency store returns the cached response for a repeated key within its TTL.

---

## Edge Cases & Failure Modes

| # | Scenario | Trigger | Expected user-visible behavior | Audit / compliance implication |
|---|----------|---------|-------------------------------|--------------------------------|
| E1 | Empty state | Cardholder has no replacement requests | List returns empty array + `200`, not an error | None; read logged |
| E2 | Duplicate submit | Same `Idempotency-Key` resent (double-tap) | Original request returned; no second request | Single audit chain; no duplicate `REQUESTED` event |
| E3 | Concurrent requests | Two create-RR for the same card in-flight | Second is rejected with `409 already in progress` | Both attempts audited; only one active request |
| E4 | Card-block failure | Lost/stolen but Card service block fails | Request not created; user told to retry | Fail-closed event logged; no orphan `REQUESTED` |
| E5 | High fraud score | Velocity/address/geo anomaly | "Under review" status; no auto-approval | `RISK_REVIEW` with reasons (masked) audited |
| E6 | Illegal transition | Activate a non-delivered card | `409` typed error | Rejected-transition event logged |
| E7 | Stale card data | Old card already `REPLACED`/closed | `409`/`422`, no new request | Conflict audited |
| E8 | Permission boundary | Cardholder reads another's request | `404`/`403`, no data leak | Access-denied event logged |
| E9 | Notification provider down | Push/email/SMS provider error | State still advances; user notified on retry/other channel | Dispatch failure + retry logged; state intact |
| E10 | Duplicate notification | Same milestone dispatched twice | User receives one message | Dedupe key prevents second `notification_log` send |
| E11 | Quiet hours vs critical | Lost/stolen block during quiet hours | Critical alert sent immediately anyway | Override-of-quiet-hours reason logged |
| E12 | Partial reissue failure | New token issued but link write fails | Request stays in-flight, retried; no double-issue | Compensating action audited; idempotent reissue |
| E13 | Ops deny without reason | Deny submitted with empty reason | `422` | No state change; rejected action logged |
| E14 | Rate-limit abuse | >5 create-RR/hour | `429 Retry-After` | Throttle event logged for fraud review |

---

## Verification

How we know each Mid-Level Objective is met. Test categories are documentation for this homework (not necessarily executed).

| Objective | Verification method |
|-----------|--------------------|
| **MLO-1 Initiate** | Integration test: create-RR happy path + E2/E3/E14; review checkpoint that lost/stolen blocks the card before `201`. |
| **MLO-2 Reissue continuity** | Integration test against Card-service stub asserting funding account/limits inherited and old token `REPLACED` (E12 covered). |
| **MLO-3 Risk gating** | Unit tests on `StubFraudAdapter` thresholds; integration test asserting high score → `RISK_REVIEW` and never auto-approved (E5). |
| **MLO-4 Notifications** | Unit test for quiet-hours/critical logic (E11); integration test for dedupe (E10) and provider-failure resilience (E9). |
| **MLO-5 Ops control** | Integration tests for approve/deny/cancel with scope guards (E8, E13); manual compliance review of attribution fields. |
| **MLO-6 Auditability** | Reconciliation check: replay `replacement_event` to reconstruct a request timeline; assert append-only (no UPDATE/DELETE). |
| **MLO-7 Activation** | Integration test: activate from `DELIVERED` → `COMPLETED`; illegal activation → `409` (E6); idempotent re-activate. |

**Fixtures (documented):** a seeded cardholder with one active card, an ops user with `ops:replacement.review`, a fraud user with `fraud:replacement.hold`, and a high-risk profile that trips the score threshold.

**Definition of Done for the feature:** all 14 low-level tasks meet their acceptance criteria, every edge case E1–E14 has a corresponding test or documented manual check, and the audit replay successfully reconstructs at least one full `REQUESTED → COMPLETED` timeline.
