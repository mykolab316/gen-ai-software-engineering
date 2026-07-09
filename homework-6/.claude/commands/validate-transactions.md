---
description: Validate all transactions without running the full pipeline
---

Validate all transactions in `sample-transactions.json` without processing them.

Steps:
1. Run the validator stage in dry-run mode:
   `.venv/bin/python -m pipeline.validator --dry-run`
   (fall back to `python -m pipeline.validator --dry-run` if the venv is active).
2. Report: total count, valid count, invalid count, and the reason for each
   rejection.
3. Show the table of per-transaction results that the dry-run prints.
