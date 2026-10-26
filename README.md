# Emergency Coordination for Claude Code

Keep resource requests, approval reasons, stock reservations, receipts and exercise follow-up in one database. The weekly question is simple: what was requested, what is committed, what arrived, and who still owes a decision?

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free MIT code. Install and operate it yourself. | Your request categories, approval rules, reports and data migration. | Installed and operated through Omni by Enterprise DNA. |
| [Quick start](#quick-start) | One setup fee, then a retainer. [Build our version](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=salesforce-emergency-program-management) | One setup fee, then a retainer. [Talk to Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=salesforce-emergency-program-management) |

## The annual bill

[Salesforce's Public Sector pricing](https://www.salesforce.com/government/solutions/pricing/) lists Service Core at US$275 per user per month, billed annually, checked 26 October 2026. A 20-user planning scenario is US$66,000 per year before implementation. This is the wider Public Sector platform price, not a stand-alone Emergency Program Management quote or an observed customer invoice. Confirm the applications and services included in your own contract.

This independent project covers the internal coordination records behind requests, resources, decisions and receipts. It does not reproduce Salesforce, its portal, maps, messaging or field dispatch. It is not affiliated with Salesforce. Exercise and retrospective coordination are the supplied operating scope. A qualified emergency manager must validate procedures before operational use. Keep established emergency communications and response systems in place. This software does not issue alerts, direct evacuation, triage people, dispatch services or determine whether a workplace is safe.

## Quick start

Node 20 or later. The embedded PGlite database runs locally. Postgres 15 or later supports a shared database for trusted internal operators.

```bash
git clone https://github.com/Enterprise-DNA-OS/emergency-coordination-for-claude-code.git
cd emergency-coordination-for-claude-code
npm install
npm test
npm run demo
npm run view
npm run docs
node scripts/coordination.mjs help
```

Open the folder in Claude Code, Codex, OpenCode or Cursor. All four use the same `.claude/commands/` library. Demo data describes fictional exercises, with incomplete plan evidence, overdue checks, stock shortages and unfinished actions. Seeding is idempotent and dates are relative to the first seed. Never seed a live database. Start business records with a fresh `DATA_DIR` and `npm run migrate` only.

## The five weekly rituals

1. `/request-queue`: review requests, the named owner, approval and outstanding quantity.
2. `/resource-balance`: reconcile declared stock, reservations and receipts.
3. `/readiness`: review plan references, review dates and the plan's testing interval.
4. `/receipt-register`: reconcile what arrived against the recorded receipt evidence.
5. `/exercise-actions`: chase the actions agreed after an exercise.

`/attention` collects overdue work. `/weekly-review` drafts a Monday review from the request queue, resource balance and attention list. `/draft-situation` writes a programme summary to `drafts/`. Neither sends anything.

## Record a complete request

Every CLI command supports `--json`. Flags use `--key=value`. Mutations require a nonempty `--actor` label. That label is attribution, not authenticated identity. Codes and full names match without case sensitivity. UUID prefixes and name fragments also work. Ambiguous references list the candidates and exit 1.

```bash
node scripts/coordination.mjs add --code=REQ-NEW --name="Exercise water request" --program=EX-01 --site=HUB --item="drinking water" --unit=carton --quantity=10 --owner="Morgan Ellis" --due=2027-01-15 --priority=routine --actor="Morgan Ellis"
node scripts/coordination.mjs approve REQ-NEW --note="Exercise controller confirmed quantity" --actor="Taylor Brooks"
node scripts/coordination.mjs reserve REQ-NEW --code=ALLOC-NEW --resource=WATER-N --quantity=10 --actor="Avery Cole"
node scripts/coordination.mjs receive ALLOC-NEW --receipt="Signed exercise receipt R-15" --actor="Morgan Ellis"
```

Use a real due date and current stock for your own exercise. Requests start `new`. Approval records a reason and actor. Reservation requires matching item and unit, sufficient uncommitted stock and a current inspection date. A receipt consumes the full allocation; split a request into smaller allocations for partial receipts. Full received quantity marks the request fulfilled. A received allocation cannot be released or cancelled. An unreceived reservation can be released. Cancelling an unreceived request releases all its reservations atomically. A programme closes only when its requests and follow-up actions are complete.

Stock quantity means the total declared supply in this register, including units already received. Available stock equals declared quantity minus reservations minus receipts. Replenishment raises the declared total after a count and a recorded note. This base is for consumable supplies, not reusable equipment checkout or inventory valuation. Stock inspection dates are local operating controls, not statutory inspection intervals.

## Import the Salesforce report

```bash
node scripts/coordination.mjs import salesforce examples/salesforce-requests.csv --source=exercise-report --dry-run --actor="Demo operator"
node scripts/coordination.mjs import salesforce examples/salesforce-requests.csv --source=exercise-report --actor="Demo operator"
node scripts/coordination.mjs export --out=coordination-export.json
node scripts/coordination.mjs export --format=csv --out=request-register.csv
```

Export a Details Only CSV report, choose UTF-8 and map the report's column headings. The fixture is synthetic and demonstrates a configured report; it is not a captured vendor export or a claim about Salesforce's default headings. Existing programme and site codes must match. A custom mapping file handles different labels. See [the switching guide](docs/replace-salesforce-emergency-program-management.md).

The import validates every row, then writes the whole batch in one transaction. Source IDs, original rows and original statuses are retained. All imported requests start `new` and need a local decision. An identical file from the same source is a no-op. Changed data with an existing source ID is rejected for explicit reconciliation. Importing from a different `--source` creates a separate dataset, so use one stable source label per organisation/report. Never import approved or delivered history as current authority. Review closed historical requests and cancel their new local records if appropriate.

## Ten questions to ask

`insights` answers every question below from the records today. These are cross-record questions included in this build, not a claim that Salesforce cannot build equivalent custom reports.

1. Which approved requests still lack resources?
2. Which requests are past their needed date?
3. Which resources are reserved but not received?
4. Which stock has an overdue inspection?
5. Which sites have incomplete plan evidence?
6. Which sites missed their own testing interval?
7. Which exercise actions are overdue and who owns them?
8. Which imported requests still need a local decision?
9. Which owners have both overdue requests and open exercise actions?
10. Which item demand exceeds inspected available stock?

## Documents, views and compliance

`npm run docs` writes situation records, receipt records and emergency plan evidence checklists to `docs-out/`. `npm run view` writes the coordination week, stock balance and readiness views to `views/`. These are read-only HTML files, with no application server or editing controls. Set business name, logo and colours in `brand.json`. `/new-view` adds a report.

`/compliance` checks references for the plan, evacuation, notification, medical assistance, communications, training and testing, plus the recorded review and test dates. [Compliance sources](docs/compliance.md) distinguish NZ duties, Australian model guidance and local operating choices. A complete record does not prove an adequate plan, worker competence or legal compliance. The checks never choose a response or certify readiness.

## Your first hour: ten things to ask for

1. Put our name and colours on the situation record.
2. Create our two exercise programmes.
3. Add each supply location with its responsible owner.
4. Record the references to our approved emergency plans.
5. Set each plan's own testing frequency and last exercise evidence.
6. Import a small Salesforce report and reconcile the count.
7. Show imported approvals that need a local decision.
8. Record a stock reservation and its signed receipt.
9. Compare open demand with available, inspected supplies.
10. Add a delivery-zone field through `/customise` and a tested migration.

## Operating boundaries

One organisation per database. Trusted operators only. No authentication service, public portal, email, scheduler or external integration ships in this base. Database roles have row-level security enabled without public policies; deployments need purpose-built access controls. Owners can bypass application checks, so protect database credentials. Do not store patient records, vulnerability assessments or sensitive personal histories here. Keep evidence references rather than copies of restricted documents.

Changes are transactional and attributed. The history rejects updates and deletes through ordinary SQL, but a database owner can alter those protections. Use protected storage and tested native database backups. JSON export carries every domain record and audit event; it is a portable record copy, not a tested restore mechanism. CSV exports escape spreadsheet formulas. Generated files use restrictive permissions where supported.

`npm test` uses disposable storage, exercises all 34 CLI commands and checks approval, stock, receipts, closure, import rollback, duplicates and rendering. The manual CI workflow covers Linux and Windows on Node 20/22 and Postgres 17. Actual results are recorded in [verification](docs/verification.md).

MIT. Salesforce and its product names belong to their owners.
