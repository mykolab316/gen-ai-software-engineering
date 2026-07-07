# Security Report — Bug 001

## Scope
Adversarial security review of the files changed in Bug 001:
- `app/lib/transform.ts` (filter logic + sort comparator fixes)
- `app/components/UserTable.tsx` (XSS remediation via DOMPurify)

Review covers injection/XSS/CSRF, hardcoded secrets, insecure comparisons,
input validation/output encoding, and unsafe dependency usage on the "after" state.

## Findings

| Severity | Location | Finding | Remediation |
|----------|----------|---------|-------------|
| INFO | app/components/UserTable.tsx:28 | Seeded XSS is remediated: `u.description` is passed through `DOMPurify.sanitize()` before `dangerouslySetInnerHTML`. Sanitization applied at the render boundary (correct — closest to the sink). Dangerous tags/handlers are stripped; test suite confirms 3 XSS-safety tests pass. | None required. Optionally document a canonical `DOMPurify.sanitize` config for consistency. |
| LOW | app/components/UserTable.tsx:1,28 | DOMPurify is used with default config. Default profile permits some HTML (e.g. `<b>`, `<a href>`), which is intended per fix (benign markup preserved). If descriptions are truly free-text with no need for HTML, rendering as plain text (`<td>{u.description}</td>`) would be strictly safer and eliminate the `dangerouslySetInnerHTML` sink entirely. | If rich text is not a product requirement, drop `dangerouslySetInnerHTML` and render the value as text. Otherwise, pin an explicit allow-list config (e.g. `ALLOWED_TAGS`, `ALLOWED_ATTR`). |
| INFO | app/components/UserTable.tsx:28 | DOMPurify runs client-side (browser DOM). In SSR/Node environments the client-side build is a no-op unless configured with a DOM (e.g. jsdom). Tests run under vitest jsdom so pass, but SSR-rendered HTML could bypass sanitization. | If this component is server-rendered, ensure DOMPurify is initialized with a server DOM (`createDOMPurify(new JSDOM('').window)`) or sanitize on the server. |
| INFO | app/lib/transform.ts:15 | `filterByStatus` now uses strict `===` comparison — correct and not a security concern. No user input flows to a sensitive/auth comparison. | None. |
| INFO | app/lib/transform.ts:24 | `sortByValueDesc` uses immutable copy `[...users]` and numeric comparator. No injection or mutation risk. | None. |
| INFO | app/lib/transform.ts / UserTable.tsx | No hardcoded secrets, credentials, SQL, or shell commands present in the changed code. No CSRF surface (pure presentational component + pure functions). | None. |

## Seeded XSS Status
**REMEDIATED (PASS).** The original vulnerability — `u.description` (untrusted API
free-text) injected directly via `dangerouslySetInnerHTML` — is now sanitized with
`DOMPurify.sanitize(u.description)` at the render sink, which is the correct boundary.
`<script>` tags and event handlers (e.g. `onerror`) are stripped while benign markup is
preserved. The 3 dedicated XSS-safety tests pass. Residual risk is limited to (a) reliance
on DOMPurify's default allow-list, and (b) potential SSR no-op behavior — both LOW/INFO.

## Summary
The changed code is clean with no CRITICAL or HIGH findings. The seeded XSS in
`UserTable.tsx` is properly remediated using DOMPurify at the correct output boundary.
Remaining items are informational/low-risk: consider plain-text rendering if HTML is not
required, pin an explicit DOMPurify allow-list, and verify sanitization behavior under SSR.
No secrets, injection, or insecure comparisons were introduced.
