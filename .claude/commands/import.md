---
description: Import a configured Salesforce request report atomically.
---

Read CLAUDE.md first. Import a configured Salesforce request report atomically.

Run `node scripts/coordination.mjs import salesforce <report.csv>` with the operator's supplied values. Use `--json` when reading the result for further work.

Available flags: `--source=<value>`, `--mapping=<value>`, `--dry-run`, `--actor=<value>`. Run `help` for the complete CLI inventory.

Read the current records first. Use the operator's name for actor attribution. Ask for missing evidence or decisions; never invent an owner, quantity, priority, approval, receipt or completion. Run the command only within the operator's authorised scope. A validation error is a reason to correct the evidence, never to bypass the CLI with direct SQL.

Follow docs/replace-salesforce-emergency-program-management.md. Start with a dry run, reconcile the source count and retain the stable source label. Source approvals do not become local approvals.

No alerts, dispatch, evacuation instructions, triage or sending are performed here.
