# Verified Research — Bug 001

## Verification Summary
- **Result**: PASS
- **Research Quality**: Level 4 — **VERIFIED**
- **Accuracy**: 5/5 (1.0)

All references and quoted snippets resolve correctly against the provided source, with zero PARTIAL and zero FAILED claims.

## Verified Claims

| reference | claim | status | note |
|-----------|-------|--------|------|
| `app/lib/transform.ts:15` | `filterByStatus` returns non-matching users via `return users.filter((u) => u.status !== status);` (should be `===`) | VERIFIED | Line 15 is exactly `  return users.filter((u) => u.status !== status);` |
| `app/lib/transform.ts:24` | `sortByValueDesc` sorts ascending via `[...users].sort((a, b) => a.value - b.value);` (should be `b.value - a.value`) | VERIFIED | Line 24 is exactly `  return [...users].sort((a, b) => a.value - b.value);` |
| `app/components/UserTable.tsx:26` | Description cell uses `dangerouslySetInnerHTML={{ __html: u.description }}` on untrusted data | VERIFIED | Line 26 is `            <td dangerouslySetInnerHTML={{ __html: u.description }} />` |
| `app/api/mockApi.ts` (`<img ... onerror>` payload) | Seeds `<img src=x onerror=...>` payload in `description` | VERIFIED | Carol: `description: 'Team lead <img src=x onerror="window.__xss=1">'` |
| `app/api/mockApi.ts` (`<script>` payload) | Seeds `<script>` payload in `description` | VERIFIED | Dan: `description: 'New hire <script>window.__xss=1</script>'` |

## Discrepancies Found
None.

## Research Quality Assessment
Level 4 — **VERIFIED**. Every one of the 5 claims was confirmed against the actual source: both comparison-operator bugs in `transform.ts` are at the stated line numbers with exact snippet matches, the `dangerouslySetInnerHTML` XSS sink is at `UserTable.tsx:26` as claimed, and the mock API seeds both an `<img onerror>` and a `<script>` payload in `description`. Accuracy is 1.0 with zero FAILED and zero PARTIAL claims, so the research is safe for the Bug Planner to consume.

## References
- `app/lib/transform.ts:15` — `filterByStatus` inverted `!==` comparator
- `app/lib/transform.ts:24` — `sortByValueDesc` reversed `a.value - b.value`
- `app/components/UserTable.tsx:26` — `dangerouslySetInnerHTML` on `u.description`
- `app/api/mockApi.ts:14` — Carol record with `<img src=x onerror=...>` payload
- `app/api/mockApi.ts:21` — Dan record with `<script>` payload
