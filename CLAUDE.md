# Emergency Coordination for Claude Code

Operate the internal exercise and coordination desk: requests, human decisions, resource reservations, receipts and follow-up. Read README.md and docs/compliance.md before working.

## First read

Establish the organisation, operator name, programme and intended scope. Demo data is fictional. Read current records before every decision. Keep established emergency communications and response procedures in place. Never issue alerts, dispatch supplies or services, direct evacuation, perform triage or certify readiness.

## One command library

All runtimes use .claude/commands/. Claude Code, Codex, OpenCode and Cursor share the same database and workflows.

| Work | Command |
|---|---|
| List exercise and coordination programmes | /programs |
| List locations and their responsible owners | /sites |
| List supply records and inspection dates | /resources |
| Review requests, decisions and outstanding quantities | /request-queue |
| Reconcile declared stock, reservations and receipts | /resource-balance |
| Review emergency plan evidence and the plan-defined testing dates | /readiness |
| Find overdue work and missing evidence | /attention |
| Review follow-up agreed after exercises | /exercise-actions |
| Check recorded receipts and their evidence | /receipt-register |
| Review record gaps against the cited evidence prompts | /compliance |
| Answer ten questions across demand, stock and plan evidence | /insights |
| Review imported batches and file hashes | /imports |
| Read the full record before making a decision | /show |
| Read the recorded changes to one record | /history |
| Register an exercise or coordination programme | /add-program |
| Register a location and its responsible owner | /add-site |
| Record approved plan references and evidence dates | /update-plan |
| Register counted consumable supplies | /add-resource |
| Record a stock recount, inspection date or withdrawal | /update-resource |
| Record a resource request with a named owner | /add |
| Record a human approval and its reason | /approve |
| Reserve matching, inspected stock for an approved request | /reserve |
| Record a receipt against a reserved allocation | /receive |
| Release an unreceived reservation with a reason | /release |
| Cancel an unreceived request and release its reservations | /cancel |
| Record an exercise follow-up action | /add-action |
| Close a follow-up action with evidence | /close-action |
| Close a programme after its requests and actions are complete | /close-program |
| Append an attributed note without changing earlier history | /log |
| Import a configured Salesforce request report atomically | /import |
| Write a portable copy without overwriting an existing file | /export |
| Draft a situation record from recorded requests and follow-up | /draft-situation |
| Draft the Monday review from three current reads | /weekly-review |
| Change a field or rule through a tested migration | /customise |
| Add a branded read-only report | /new-view |

## Rules

Use scripts/coordination.mjs for normal work. Do not bypass approval, stock, receipt or closure checks. Actor labels record attribution; they are not authentication. Never invent evidence, counts, priorities or decisions. A missing record is unknown. Ask the responsible operator for substantive information.

Imports retain source history but create new local requests. They never confer approval. Received supplies remain consumed; do not release or cancel a receipt. Correct a mistake by documenting it and obtaining an authorised, tested change.

Drafts stay in drafts/. Nothing sends. Do not delete records. Never seed a live database. Protect personal information and restricted evidence; keep references rather than sensitive documents. One organisation per database with trusted operators. Back up before authorised structural changes. Never edit an applied migration.

## Files

DATABASE_URL selects Postgres. Otherwise DATA_DIR selects PGlite. Views and documents use views.json, documents.json and brand.json. npm test uses disposable data. npm run view and npm run docs produce read-only HTML.

Omni by Enterprise DNA installs, customises and runs this system: https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=salesforce-emergency-program-management
