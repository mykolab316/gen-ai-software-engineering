# 🤖 Homework 4: 4-Agent Pipeline

> **Student Name**: Mykola Bernadskyi
> **Date Submitted**: 2026-07-07
> **AI Tools Used**: Claude Code (Opus 4.8)

An automated **4-agent code-quality pipeline** that verifies bug research, fixes the bugs,
security-reviews the changes, and generates unit tests — running end-to-end from **one
command** against a small React + TypeScript dashboard.

---

## What it does

The pipeline operates on a deliberately buggy **Team Dashboard** app (`src/app`) that has
three seeded defects (2 logic bugs + 1 security vulnerability). Running the pipeline
detects, fixes, reviews, and tests them, producing a set of artifact reports.

```
Bug Research Verifier ──▶ Bug Fixer ──▶ Security Verifier
                                    └──▶ Unit Test Generator
```

Each agent is a `*.agent.md` file (system prompt + frontmatter). A single orchestrator
(`src/pipeline/runPipeline.ts`) reads each agent, injects its skill, feeds its inputs,
calls the **real Claude API with that agent's prescribed model**, writes the artifacts,
runs the relevant tests, and prints a per-agent execution log.

## The four agents & model choices

| Agent | Model | Why this model |
|-------|-------|----------------|
| **Bug Research Verifier** | `claude-opus-4-8` | High-stakes fact-checking of `file:line` references and snippet matches — needs the strongest reasoning to avoid rubber-stamping bad research. |
| **Bug Fixer** | `claude-haiku-4-5` | Mechanical application of an explicit before/after plan — a fast, cheap model is sufficient and keeps the pipeline economical. |
| **Security Verifier** | `claude-opus-4-8` | Adversarial security reasoning to catch subtle vulnerabilities (injection, XSS, unsafe sinks) — accuracy matters most here. |
| **Unit Test Generator** | `claude-sonnet-5` | Strong code generation for correct, idiomatic tests at a balanced cost/quality point. |

Rule of thumb applied: **stronger reasoning models for verification/security, a
faster/cheaper model for routine fixes, a balanced model for test scaffolding.**

## Skills

- **`src/skills/research-quality-measurement.md`** — defines a 4-level research-quality
  scale (VERIFIED / MOSTLY VERIFIED / PARTIALLY VERIFIED / UNVERIFIED) and the required
  sections of `verified-research.md`. Used by the Research Verifier.
- **`src/skills/unit-tests-FIRST.md`** — defines **FIRST** (Fast, Independent, Repeatable,
  Self-validating, Timely) and the checklist recorded in `test-report.md`. Used by the
  Unit Test Generator.

## Seeded defects

| # | Type | File | Fix |
|---|------|------|-----|
| 1 | Logic | `src/app/lib/transform.ts` — `filterByStatus` uses `!==` | change to `===` |
| 2 | Logic | `src/app/lib/transform.ts` — `sortByValueDesc` comparator reversed | `b.value - a.value` |
| 3 | Security (XSS) | `src/app/components/UserTable.tsx` — `dangerouslySetInnerHTML` on untrusted API data | sanitize with DOMPurify |

Documented in `src/context/bugs/001/bug-context.md`.

## How to run

See **[HOWTORUN.md](HOWTORUN.md)** for full detail. Short version (from `src/`):

```bash
cd src
npm install
npm test            # BEFORE: 5 failing (the 3 defects), 3 passing controls
cp .env.example .env && echo "add your ANTHROPIC_API_KEY to .env"
npm run pipeline    # runs all 4 agents in order; prints per-agent log; writes artifacts
npm test            # AFTER: 8 passing
npm run dev         # view the fixed dashboard
```

The pipeline is **idempotent**: step 0 restores `src/app` from the pristine
`src/context/bugs/001/before/app` snapshot, so every run starts from the same buggy state.

## Reproducibility design

- A **canonical committed test suite** (`src/tests/`) proves the RED→GREEN transition
  deterministically, independent of LLM wording.
- The **Unit Test Generator** additionally produces its own live tests in
  `src/tests/generated/` (its deliverable), which the pipeline runs and records.

## Agent output artifacts

All written under `src/context/bugs/001/`:

| Artifact | Produced by |
|----------|-------------|
| `research/verified-research.md` | Bug Research Verifier |
| `fix-summary.md` | Bug Fixer (+ real test result appended by pipeline) |
| `security-report.md` | Security Verifier |
| `test-report.md` | Unit Test Generator (+ real test result appended by pipeline) |

## Project structure

```
homework-4/
├── README.md, HOWTORUN.md, TASKS.md, PIPELINE_PROMPT.md   # docs
├── docs/screenshots/                                       # pipeline run, fixes, security, tests
└── src/                                                    # everything code-related
    ├── package.json, tsconfig.json, vite.config.ts, index.html, .env.example
    ├── app/{main,App}.tsx, app/api/mockApi.ts, app/lib/transform.ts, app/components/*
    ├── tests/ (canonical)  +  tests/generated/ (agent-produced)
    ├── agents/*.agent.md            # the 4 agents (model in frontmatter)
    ├── skills/*.md                  # research-quality + FIRST
    ├── pipeline/runPipeline.ts      # single-command orchestrator
    └── context/bugs/001/            # bug-context, before/ snapshot, fixtures, outputs
```

## Deliverables checklist

- [x] 4 agents in `src/agents/` with explicit per-agent model selection
- [x] 2 skills (`research-quality-measurement`, `unit-tests-FIRST`)
- [x] Sample app with 2 bugs + 1 security issue (`src/app`)
- [x] Single-command pipeline (`npm run pipeline`) with per-agent proof-of-execution log
- [x] Agent outputs (`verified-research.md`, `fix-summary.md`, `security-report.md`, `test-report.md`)
- [ ] Screenshots in `docs/screenshots/` (captured from a real run — see HOWTORUN)

---

<div align="center">

*This project was completed as part of the AI-Assisted Development course.*

</div>
