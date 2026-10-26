---
description: Register counted consumable supplies.
---

Read CLAUDE.md first. Register counted consumable supplies.

Run `node scripts/coordination.mjs add-resource` with the operator's supplied values. Use `--json` when reading the result for further work.

Available flags: `--code=<value>`, `--name=<value>`, `--site=<value>`, `--item=<value>`, `--unit=<value>`, `--quantity=<value>`, `--inspection-due=<value>`, `--owner=<value>`, `--actor=<value>`. Run `help` for the complete CLI inventory.

Read the current records first. Use the operator's name for actor attribution. Ask for missing evidence or decisions; never invent an owner, quantity, priority, approval, receipt or completion. Run the command only within the operator's authorised scope. A validation error is a reason to correct the evidence, never to bypass the CLI with direct SQL.

No alerts, dispatch, evacuation instructions, triage or sending are performed here.
