# Replace the coordination register in Salesforce

This guide migrates request records into an internal coordination desk. It does not migrate or replace the whole Public Sector platform, public portal, maps, user permissions or emergency communications.

## Export

Salesforce documents [Details Only report export](https://help.salesforce.com/s/articleView?id=sf.reports_export.htm&language=en_US). An operator needs Export Reports permission. Export a flat CSV report with one row per request. Choose UTF-8 and a comma delimiter; a locale-specific separator or legacy character encoding must be converted first. Keep the original export for reconciliation. The official [export considerations](https://help.salesforce.com/s/articleView?id=rd_reports_limits.htm&language=en_US&type=0) explain locale-dependent separators and report limitations.

Include a stable request record ID, request name, programme code, site code, resource type, unit, quantity, owner, needed date, priority and source status. These labels are a configured report contract, not claimed Salesforce default field names. If programme and site codes are not available in your report, add them through an authorised reporting process or map them in a copy before importing. Do not invent missing values. Export attachments and omitted history separately.

## Prepare and import

1. Create a fresh database with migrate only. Add programme and site records through the CLI.
2. Use existing, agreed codes in the report. Map headings with `--mapping=examples/mapping.json`; the mapping keys and expected labels are listed below.
3. Convert dates to YYYY-MM-DD, quantity to a positive integer, and priority to `routine` or `urgent`. Keep units consistent. The operator decides priority; the importer does not infer it.
4. Run one import with `--dry-run`, then the same command without that flag. Review its counts and retain the source file hash.

```bash
node scripts/coordination.mjs import salesforce requests.csv --source=our-org-requests --mapping=our-mapping.json --dry-run --actor="Migration operator"
node scripts/coordination.mjs import salesforce requests.csv --source=our-org-requests --mapping=our-mapping.json --actor="Migration operator"
```

| Mapping key | Default heading | Destination |
|---|---|---|
| id | Request ID | external_id, unique within source |
| name | Request Name | name |
| program | Program Code | existing programme |
| site | Site Code | existing site |
| item | Resource Type | requested item |
| unit | Unit | requested unit |
| quantity | Quantity | positive whole quantity |
| owner | Owner | named local owner |
| due | Needed By | date |
| priority | Priority | routine or urgent |
| status | Status | source_status, never local approval |

The synthetic example demonstrates the contract. It is not a captured Salesforce export. All original columns are retained in source_record. A repeated identical file is a no-op. Duplicate source IDs, invalid dates, missing codes, missing columns and changed records with an existing source ID stop the batch without partial writes. No existing local decision is overwritten.

## Reconcile before switching

Compare imported rows, source IDs, item/unit quantities, owners and needed dates with the report. Compare source statuses separately: every local status begins `new`. Historical approval and delivery statuses are retained as evidence only. Decide which requests are current, cancel archived items with a reason, and record new local approvals for current work.

Resource counts, inspections, reservations, receipts, attachments, chatter, historic approval events, restricted records, deleted records, maps, automations and access permissions are not reconstructed from this request report. Importing a report is a one-command step after mapping; replacing a whole service is a separately scoped project. Enterprise DNA handles mapping and the operating setup through Omni by Enterprise DNA.

Retain the original service until records reconcile and responsible operators have validated the new process. Never interrupt emergency communications to perform this migration.
