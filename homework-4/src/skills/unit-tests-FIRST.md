# Skill: Unit Tests — FIRST Principles

**Purpose**: Give the Unit Test Generator a concrete standard for well-formed unit tests.
Every test it writes must satisfy **FIRST**, and it must record a FIRST compliance
checklist in `test-report.md`.

Use this skill whenever you generate or evaluate unit tests.

---

## FIRST

- **F — Fast**: tests run in milliseconds. No real network, disk, timers, or `sleep`.
  Stub/mocked async (e.g. a resolved Promise) is fine; a real 150 ms API delay is not.
- **I — Independent**: no test depends on another's order or shared mutable state. Each
  builds its own fixtures; no leakage between tests. Do not rely on execution order.
- **R — Repeatable**: same result every run, on any machine. No dependence on current
  date/time, random values, locale, or environment. Freeze/inject such inputs.
- **S — Self-validating**: the test asserts a boolean pass/fail via explicit `expect`s.
  No "eyeball the console output" — a human should never have to interpret results.
- **T — Timely**: tests target the specific new/changed behavior and are written
  alongside the change. Cover the bug that was fixed (a regression test) and its edges.

## Scope rule

Generate tests **only for code that changed** in this pipeline run (as listed in
`fix-summary.md`). Do not re-test untouched modules. For each fixed defect, include at
least one test that would have **failed before** the fix and **passes after** it.

## Framework conventions (this project)

- Runner: **Vitest**. Import `{ describe, it, expect }` from `vitest`.
- React components: **@testing-library/react** (`render`, queries); DOM env is `jsdom`.
- Put generated specs in `tests/generated/` named `*.test.ts` / `*.test.tsx`.
- Keep each test's arrange/act/assert visible and small.

---

## Required output: FIRST checklist in `test-report.md`

Include a table rating the generated suite against each FIRST letter:

| Principle | Met? | How it is satisfied |
|-----------|------|---------------------|
| Fast | yes/no | … |
| Independent | yes/no | … |
| Repeatable | yes/no | … |
| Self-validating | yes/no | … |
| Timely | yes/no | … |

Also report: files generated, number of tests, the exact run command, and the pass/fail
result of actually running them.
