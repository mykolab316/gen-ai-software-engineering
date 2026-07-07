# How To Run — Homework 4

All commands run from the **`src/`** directory (the project root).

## Prerequisites
- Node.js 20.11+ (or 22.x) and npm.
- An Anthropic API key (only for the pipeline step): https://console.anthropic.com/

## 1. Install
```bash
cd src
npm install
```

## 2. See the app and the bugs (BEFORE state)
```bash
npm run dev
```
Open the printed URL. You'll see the **Team Dashboard** listing the wrong users
(inverted filter), sorted lowest-value-first (reversed sort), and rendering unsanitized
HTML from the API (the XSS payload from Carol/Dan).

Run the tests to see the defects as failures:
```bash
npm test
```
Expected: **5 failing, 3 passing** — the 5 failures are the 2 logic bugs + the XSS
(2 assertions), the 3 passes are control tests that must stay green.

## 3. Configure the API key (pipeline only)
```bash
cp .env.example .env
```
Edit `.env` and set:
```
ANTHROPIC_API_KEY=sk-ant-...
```
`.env` is gitignored; the orchestrator auto-loads it.

## 4. Run the 4-agent pipeline (single command)
```bash
npm run pipeline
```
This runs, in order:
1. **research-verifier** (`claude-opus-4-8`) → `context/bugs/001/research/verified-research.md`
2. **bug-fixer** (`claude-haiku-4-5`) → edits `app/…` + `context/bugs/001/fix-summary.md`, then the pipeline runs `npm test`
3. **security-verifier** (`claude-opus-4-8`) → `context/bugs/001/security-report.md`
4. **unit-test-generator** (`claude-sonnet-5`) → `tests/generated/*` + `context/bugs/001/test-report.md`, then the pipeline runs those generated tests

You'll see a per-agent log line: `[i/4] <agent> model=<model> in=<file> out=<file> PASS`.

## 5. Verify the fixes (AFTER state)
```bash
npm test
```
Expected: **8 passing**. Then `npm run dev` again to see the corrected, sanitized dashboard.

## 6. Re-run safely
`npm run pipeline` is idempotent — step 0 restores `app/` from
`context/bugs/001/before/app`, so you can run it repeatedly and always start from the
buggy baseline.

## Capturing screenshots (for submission)
Save these into `../docs/screenshots/`:
1. `pipeline-run.png` — the terminal output of `npm run pipeline` (per-agent log).
2. `fixes.png` — a diff or the fixed `transform.ts` / `UserTable.tsx`.
3. `security-report.png` — the generated `security-report.md`.
4. `tests-passing.png` — `npm test` showing 8 passing.
