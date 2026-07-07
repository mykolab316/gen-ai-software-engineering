# Bug Context — 001: Team Dashboard defects

**App under test**: `src/app` — a React + TypeScript mini-dashboard that fetches users
from a fake API (`app/api/mockApi.ts`), filters and sorts them (`app/lib/transform.ts`),
and renders them (`app/components/UserTable.tsx`, `Dashboard.tsx`).

This file documents the intentionally seeded defects the 4-agent pipeline must detect,
fix, review, and test. The pristine buggy source is snapshotted under
`context/bugs/001/before/app/` — the pipeline restores `src/app` from it on every run so
each run starts from this exact state.

---

## Defect 1 — Inverted status filter (LOGIC BUG)

- **File**: `app/lib/transform.ts`
- **Symbol**: `filterByStatus(users, status)`
- **What's wrong**: filters with `u.status !== status`, so it returns every user who does
  **not** match the requested status (the exact opposite of intent).
- **Symptom**: the dashboard's "Active users" view shows the *inactive* users.
- **Correct behavior**: keep users where `u.status === status`.
- **Detected by**: `tests/transform.test.ts` → "keeps only users matching the requested status".

## Defect 2 — Reversed sort comparator (LOGIC BUG)

- **File**: `app/lib/transform.ts`
- **Symbol**: `sortByValueDesc(users)`
- **What's wrong**: comparator is `a.value - b.value`, which sorts **ascending** despite
  the function name/intent of descending.
- **Symptom**: the dashboard lists lowest-value users first instead of highest.
- **Correct behavior**: comparator `b.value - a.value` (descending). Must stay non-mutating.
- **Detected by**: `tests/transform.test.ts` → "orders users by value, highest first".

## Defect 3 — XSS via unsanitized HTML injection (SECURITY)

- **File**: `app/components/UserTable.tsx`
- **Location**: the description cell — `<td dangerouslySetInnerHTML={{ __html: u.description }} />`
- **What's wrong**: `description` is untrusted, free-text API data
  (`app/api/mockApi.ts` seeds `<img src=x onerror=...>` and `<script>` payloads) and is
  injected as raw HTML with no sanitization → stored/reflected **XSS**.
- **Severity**: HIGH.
- **Correct behavior**: sanitize with **DOMPurify** before injection (or render as plain
  text). The benign text portion must still render.
- **Detected by**: `tests/UserTable.security.test.tsx` → "does not emit raw <script> tags",
  "strips inline event handlers such as onerror".

---

## Baseline (before pipeline)

`npm test` from `src/` reports **5 failing / 3 passing** — the 5 failures are the three
defects above; the 3 passes (`totalValue`, `sortByValueDesc` non-mutation, benign-text
render) are controls that must stay green through the fix.
