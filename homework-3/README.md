# Homework 3 — Specification-Driven Design

## Student & Task Summary

- **Student:** Mykola Bernadskyi
- **Assignment:** Design a documentation-only **specification package** for a finance-oriented feature. No implementation required; the graded artifact is the specification itself.
- **Chosen feature:** **Card Replacement & Notifications** — replacing a lost/stolen/damaged card, fraud gating, and multi-channel (push/email/SMS) notifications across the replacement lifecycle, in a regulated card-issuing context.

### Package contents

| File | Purpose |
|------|---------|
| `specification.md` | The layered, graded spec: objectives → policy → implementation notes → context → 14 traceable low-level tasks → edge-case table → verification. |
| `agents.md` | Binding AI-agent guidelines: stack, banking domain rules, security/compliance, edge-case defaults, testing. |
| `.claude/CLAUDE.md` | Editor/AI rules: naming, patterns, FinTech-sensitive defaults, what to avoid. |
| `README.md` | This file — rationale and best-practices mapping. |

---

## Rationale

### Why this structure
I followed the layered model required by `TASKS.md` so intent flows top-down and stays **traceable**: a single High-Level Objective, seven **observable** Mid-Level Objectives (each tagged by stakeholder lens), then a Non-Functional/Policy layer, Implementation Notes as guardrails, explicit Beginning/Ending context, and finally **14 small low-level tasks**. Every task carries a traceability tag (`→ MLO-x`) and ends with **Acceptance Criteria (DoD)**, so no task is an orphan and no objective is unverifiable.

### Why a state machine drives the design
Card replacement is inherently a lifecycle problem, so I made an explicit state machine the single source of truth for status. This concentrates the riskiest logic (illegal transitions, fail-closed blocking, terminal states) in one well-tested place and gives the audit trail a clean event stream to replay.

### How I chose performance targets
The numbers in the Non-Functional section are labeled **assumed targets** with one-line justifications. They are anchored to FinTech UX/ops reality rather than invented precision:
- **Interactive APIs (create p95 ≤ 400 ms, read p95 ≤ 250 ms):** sub-second responses feel instant for a user-initiated action.
- **Auto-decision ≤ 2 s:** keeps the approve/route outcome on-screen before the user navigates away.
- **Notification dispatch (critical p95 ≤ 5 s, informational ≤ 60 s):** critical security alerts must drive immediate user action; informational events tolerate batching to cut cost.
- **Rate limit 5/hour and read-after-write ≤ 1 s:** throttle replacement-channel abuse while preserving the expectation that a user sees their own just-created request.

### How I chose verification depth
Each Mid-Level Objective maps to at least one verification method, and every edge case (E1–E14) maps to a test or documented manual check. I included an **audit-replay reconciliation** check because, in a regulated context, the ability to reconstruct a full timeline from immutable events is itself a control — not just a nice-to-have.

---

## Industry Best Practices (and where they appear)

| Best practice | Where it appears |
|---------------|------------------|
| **PCI-style PAN protection** (mask to last4, never log, no CVV at rest) | `specification.md` → *Non-Functional & Policy → Security & Privacy*; `agents.md` §3; `.claude/CLAUDE.md` → *FinTech-Sensitive Defaults* |
| **Immutable, attributed audit trail** (append-only, 7-yr retention) | `specification.md` → *Audit & Logging* + Task 9 (MLO-6); `agents.md` §3 |
| **Idempotency for state-changing APIs** | `specification.md` → *Implementation Notes* + Tasks 3, 8, 14; `agents.md` §4; `.claude/CLAUDE.md` → *Preferred Patterns* |
| **Fail-closed on security action** (block card before success on lost/stolen) | `specification.md` → *Implementation Notes* + Task 3 (E4); `agents.md` §2 |
| **Explicit state machine + typed illegal-transition errors** | `specification.md` → *Implementation Notes* + Task 1 (E6) |
| **Fraud risk gating with human-in-the-loop** (no auto-approve of `RISK_REVIEW`) | `specification.md` → MLO-3 + Tasks 4, 6 (E5); `agents.md` §2 |
| **Decoupled notifications** (outbox/after-commit, at-least-once + dedupe) | `specification.md` → Tasks 10, 11 (E9, E10); `agents.md` §4 |
| **Least-privilege authorization** (ownership + scopes) | `specification.md` → Task 13 (E8); `agents.md` §3 |
| **Bounded pagination & rate limiting** | `specification.md` → *Performance* + Tasks 12, 14 (E14) |
| **Decimal money handling** | `specification.md` → *Implementation Notes*; `agents.md` §1; `.claude/CLAUDE.md` → *What to Avoid* |
| **Quiet-hours respect with critical-event override** | `specification.md` → *Implementation Notes* + Task 10 (E11); `agents.md` §4 |
| **Stable error taxonomy** (`400/403/404/409/422/429`, machine code + human message) | `specification.md` → *Implementation Notes*; `agents.md` §5; `.claude/CLAUDE.md` → *Error & Response Conventions* |

---

## Traceability at a Glance

- **Objectives → Tasks:** MLO-1 (T2,T3,T12,T14) · MLO-2 (T1,T5) · MLO-3 (T3,T4,T6) · MLO-4 (T10,T11) · MLO-5 (T6,T7,T12,T13) · MLO-6 (T9,T11) · MLO-7 (T1,T8)
- **Objectives → Verification:** every MLO has a row in `specification.md` → *Verification*.
- **Edge cases → Behavior:** E1–E14 each specify expected user-visible behavior **and** the audit/compliance implication.
