---
description: Draft a situation record from recorded requests and follow-up.
---

Read CLAUDE.md first. Draft a situation record from recorded requests and follow-up.

Run `node scripts/coordination.mjs draft-situation <program>` with the operator's supplied values. Use `--json` when reading the result for further work.

Report the recorded facts, source codes and gaps. Do not infer real-world availability from a stock record. If the result is empty, say so.

Open the generated draft, check it against the current CLI reads, and return the draft in chat. Never send it.

No alerts, dispatch, evacuation instructions, triage or sending are performed here.
