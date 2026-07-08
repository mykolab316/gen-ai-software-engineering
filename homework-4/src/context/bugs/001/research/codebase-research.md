# Codebase Research — Bug 001

> Produced by the Bug Researcher (seeded fixture). Input to the Bug Research Verifier.

## Summary
The Team Dashboard shows incorrect user lists and renders untrusted API HTML. Three root
causes were identified in the data-transform layer and the table component.

## Findings

### Finding 1 — Inverted status filter
- **Reference**: `app/lib/transform.ts:15`
- **Claim**: `filterByStatus` returns users whose status does **not** match, via
  `return users.filter((u) => u.status !== status);`. The comparison should be `===`.
- **Impact**: the dashboard's "active" view lists inactive users.

### Finding 2 — Reversed sort comparator
- **Reference**: `app/lib/transform.ts:24`
- **Claim**: `sortByValueDesc` sorts ascending because the comparator is
  `[...users].sort((a, b) => a.value - b.value);`. Descending requires `b.value - a.value`.
- **Impact**: lowest-value users appear first.

### Finding 3 — Unsanitized HTML injection (XSS)
- **Reference**: `app/components/UserTable.tsx:26`
- **Claim**: the description cell uses `dangerouslySetInnerHTML={{ __html: u.description }}`
  on untrusted API data with no sanitization.
- **Supporting reference**: `app/api/mockApi.ts` seeds `<img src=x onerror=...>` and
  `<script>` payloads in `description`.
- **Impact**: stored/reflected XSS.

## Suggested fix direction
Correct the two comparisons in `transform.ts`; sanitize `description` with DOMPurify (or
render as text) in `UserTable.tsx`.

## References
- `app/lib/transform.ts:15`
- `app/lib/transform.ts:24`
- `app/components/UserTable.tsx:26`
- `app/api/mockApi.ts`
