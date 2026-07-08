# Skill: Research Quality Measurement

**Purpose**: Give the Bug Research Verifier a consistent, objective way to rate the
quality of a `codebase-research.md` document and to structure its `verified-research.md`
result file. This skill defines the quality levels and the required output sections.

Use this skill whenever you write `verified-research.md`.

---

## What "quality" measures

Research quality is a function of how well every factual claim in the research document
holds up against the actual source code. A claim is one of:

- a **reference** — a `file:line` (or `file` + symbol) pointer, and/or
- a **snippet** — a quoted piece of code the research says exists at that location.

For each claim, classify it as:

- **VERIFIED** — the file exists, the line/symbol is correct, and any quoted snippet
  matches the source (allowing for trivial whitespace differences).
- **PARTIAL** — the file/symbol is right but the line number or snippet is slightly off
  (e.g. shifted lines, paraphrased code).
- **FAILED** — the reference does not resolve (wrong file, missing symbol) or the snippet
  contradicts the source.

Compute `accuracy = VERIFIED / total_claims`.

## Quality levels

| Level | Label | Criteria |
|------:|-------|----------|
| 4 | **VERIFIED** | `accuracy == 1.0` and **zero** FAILED claims. Every reference and snippet checks out. |
| 3 | **MOSTLY VERIFIED** | `accuracy >= 0.8` and **zero** FAILED claims (only PARTIALs remain). |
| 2 | **PARTIALLY VERIFIED** | `accuracy >= 0.5`, or any FAILED claims exist but the core findings still hold. |
| 1 | **UNVERIFIED** | `accuracy < 0.5`, or a central claim is FAILED such that a fix cannot safely proceed. |

**Pass/fail rule**: level **3 or 4 = PASS** (safe for the Bug Planner to consume);
level **1 or 2 = FAIL** (research must be revised before planning).

---

## Required output: `verified-research.md`

Write these sections, in this order:

1. **Verification Summary** — overall `PASS`/`FAIL`, the **Research Quality** level + label
   from the table above, and the `accuracy` fraction (VERIFIED/total).
2. **Verified Claims** — a table of every checked claim: `reference | claim | status
   (VERIFIED/PARTIAL/FAILED) | note`.
3. **Discrepancies Found** — each PARTIAL/FAILED claim with what the research said vs. what
   the source actually shows (quote the real line). If none, state "None".
4. **Research Quality Assessment** — the level + label, and 2–4 sentences of reasoning
   that justify it from the counts above.
5. **References** — the list of source `file:line` locations you inspected to verify.

Keep every judgement grounded in the actual source — never assert a claim is VERIFIED
without having read the referenced location.
