---
description: Register a location and its responsible owner.
---

Read CLAUDE.md first. Register a location and its responsible owner.

Run `node scripts/coordination.mjs add-site` with the operator's supplied values. Use `--json` when reading the result for further work.

Available flags: `--code=<value>`, `--name=<value>`, `--owner=<value>`, `--jurisdiction=<value>`, `--actor=<value>`. Run `help` for the complete CLI inventory.

Read the current records first. Use the operator's name for actor attribution. Ask for missing evidence or decisions; never invent an owner, quantity, priority, approval, receipt or completion. Run the command only within the operator's authorised scope. A validation error is a reason to correct the evidence, never to bypass the CLI with direct SQL.

No alerts, dispatch, evacuation instructions, triage or sending are performed here.
