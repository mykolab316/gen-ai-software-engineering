---
description: Run the transaction processing pipeline end-to-end and summarize results
---

Run the transaction processing pipeline end-to-end.

Steps:
1. Check that `sample-transactions.json` exists in the homework-6 root.
2. Clear the `shared/` directories (the orchestrator resets them automatically
   on each run).
3. Run the pipeline: `.venv/bin/python orchestrator.py`
   (fall back to `python orchestrator.py` if the venv is already activated).
4. Show a summary of results from `shared/results/`: total processed and the
   counts of settled / flagged / rejected.
5. Report any transactions that were rejected and why, and any that were flagged
   for fraud review with their risk score.
