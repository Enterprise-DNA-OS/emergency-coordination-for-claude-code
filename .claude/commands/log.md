---
description: Append an attributed note without changing earlier history.
---

Read CLAUDE.md first. Append an attributed note without changing earlier history.

Run `node scripts/coordination.mjs log <entity> <reference>` with the operator's supplied values. Use `--json` when reading the result for further work.

Available flags: `--note=<value>`, `--actor=<value>`. Run `help` for the complete CLI inventory.

Read the current records first. Use the operator's name for actor attribution. Ask for missing evidence or decisions; never invent an owner, quantity, priority, approval, receipt or completion. Run the command only within the operator's authorised scope. A validation error is a reason to correct the evidence, never to bypass the CLI with direct SQL.

No alerts, dispatch, evacuation instructions, triage or sending are performed here.
