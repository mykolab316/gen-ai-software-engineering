# Research Notes — context7 Queries (Agent 2)

While generating the pipeline code, Agent 2 used the **context7** MCP server to
look up current, authoritative documentation for the chosen framework/stack
instead of relying on the model's training memory. Two queries are documented
below, as required.

---

## Query 1: Decimal / monetary arithmetic for Python

- **Search:** "decimal Decimal quantize with ROUND_HALF_UP for monetary rounding
  to 2 decimal places"
- **context7 library ID:** `/python/cpython` (Doc/library/decimal.rst)
- **Key result:** `Decimal.quantize(exp, rounding=...)` returns a value with the
  exponent of `exp`, applying the given rounding mode. `ROUND_HALF_UP` means
  "round to nearest, ties going away from zero." Example from the docs:
  `Decimal('3.214').quantize(Decimal('0.01'))`.
- **Applied:** In `pipeline/common.py`, the `money()` helper does
  `to_decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)`. The
  settlement stage uses it for `fee = amount * Decimal("0.005")` and
  `net = amount - fee`, guaranteeing consistent 2-decimal monetary results and
  never touching `float`. This directly satisfies the spec's Implementation Note
  on money handling.

---

## Query 2: FastAPI CORS for the React frontend

- **Search:** "enable CORS with CORSMiddleware to allow a React frontend origin"
- **context7 library ID:** `/fastapi/fastapi` (docs/en/docs/tutorial/cors.md)
- **Key result:** FastAPI enables Cross-Origin Resource Sharing via
  `CORSMiddleware`, added with `app.add_middleware(CORSMiddleware,
  allow_origins=[...], allow_credentials=True, allow_methods=["*"],
  allow_headers=["*"])`. The browser sends a preflight `OPTIONS` request; the
  middleware answers it with the right headers so the React app's `fetch` calls
  are allowed.
- **Applied:** In `backend/api.py`, `CORSMiddleware` is registered with the Vite
  dev origin (`http://localhost:5173`) so the React dashboard can call
  `POST /api/run` and `GET /api/results` without cross-origin errors.

---

## Why context7 (not just training memory)

Both APIs have version-sensitive details (rounding-mode constants; the exact
`add_middleware` signature and preflight behavior). Pulling the current docs
avoided guessing a stale signature and let the code compile and run correctly
on the first pass.
