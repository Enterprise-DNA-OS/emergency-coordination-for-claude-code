# Verification

26 October 2026: npm test passed 129 assertions across all 34 CLI commands on Linux with Node 22.23.4 and PGlite. The same suite passed on an isolated PostgreSQL 18.4 server. Each test uses disposable storage and leaves working records alone.

The suite checks repeated migrations and seeding, ambiguous and empty references, case-insensitive codes, UUID prefixes, strict arguments, invalid dates, approval gates, matching item units, inspected stock, reservation limits, receipt evidence, partial receipts, cancellation, programme closure, append-only history, import rollback, duplicate IDs, changed-file reconciliation, mapping, exports, escaped HTML and real CLI subprocesses. Both document and view renderers are exercised.

npm run demo, npm run view and npm run docs passed. All 35 slash commands share one library. Prose was checked for brand violations and author placeholders.

The actual landing template rendered in a local isolated preview at desktop and mobile sizes. Browser checks confirmed noindex, three service paths, three captured output tables, tracked booking links, no horizontal page overflow and no JavaScript errors. Screenshots were inspected; a clipped mobile heading was shortened. Branded report screenshots were also inspected.

[GitHub verification run](https://github.com/Enterprise-DNA-OS/emergency-coordination-for-claude-code/actions/runs/40416465170) was blocked before any job steps ran. GitHub reported failed account payments or a spending-limit restriction. Windows Node 20/22 and hosted Postgres 17 verification therefore remain unexecuted. The workflow is present for those checks when the account restriction is resolved. Local Postgres 18.4 success is not a Windows result.

The repository was pushed privately. The page content was pushed with live=false and status=drafted. Hosting deployment is separate from the Git push and is checked by the lane runner.
