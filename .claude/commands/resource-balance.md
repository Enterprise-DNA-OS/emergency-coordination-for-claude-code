---
description: Reconcile declared stock, reservations and receipts.
---

Read CLAUDE.md first. Reconcile declared stock, reservations and receipts.

Run `node scripts/coordination.mjs resource-balance` with the operator's supplied values. Use `--json` when reading the result for further work.

Report the recorded facts, source codes and gaps. Do not infer real-world availability from a stock record. If the result is empty, say so.

No alerts, dispatch, evacuation instructions, triage or sending are performed here.
