# Fleet Executive Reports Task List

## Completed In This Iteration

- Added PRD for monthly and weekly fleet executive reports.
- Added frontend source scaffolding for monthly and weekly report IDs.
- Added backend payload-builder scaffolding for both sources.
- Added embedded template registration points.
- Added landscape PDF routing for both sources.

## Remaining Tasks

1. Replace scaffold values with real monthly aggregation across stock, LV, HE, and site-usage domains.
2. Replace weekly scaffold values with real week-bucket aggregation inside the selected month.
3. Validate the exact business formulas for fuel lost, expected km/l, expected L/hr, and Q2 projection logic.
4. Decide whether optional site filtering should be part of the first production release.
5. Finalize monthly narrative generation rules.
6. Finalize weekly narrative generation rules.
7. Add schedule display labels if these sources should appear in the scheduled email UX immediately.
8. Verify PDF readability and page-break behaviour with realistic data volume.
9. Add automated verification or fixture-based snapshot testing for payload shape where practical.

## Technical Breakdown

### Frontend

1. Register `monthly-fleet-report` in the report source registry.
2. Register `weekly-fleet-report` in the report source registry.
3. Keep both sources PDF-only until backend data integration is complete.

### Backend Reporting

1. Seed `monthly-fleet-report.html` from an embedded template class.
2. Seed `weekly-fleet-report.html` from an embedded template class.
3. Route both source IDs through the shared scheduled-report payload builder.
4. Force landscape orientation for both source IDs in the async PDF path.

### Data Integration

1. Map monthly executive KPIs to real fuel, distance, engine-hour, issued, delivered, and loss totals.
2. Map monthly site matrices and chart series for all 8 sites.
3. Map monthly LV site x vehicle-type matrices.
4. Map monthly HE site x equipment-type matrices.
5. Map monthly site usage cross-tab and quarter comparison values.
6. Map weekly week-bucket series and matrices for the same domains.

## Release Readiness Checklist

1. Monthly report generates successfully as PDF.
2. Weekly report generates successfully as PDF.
3. Both reports render in A4 landscape.
4. Templates seed correctly into `C:\FMSData\reports\templates`.
5. Payloads remain stable when a month has 4 weeks and when a month spans 5 weekly buckets.
6. Business reviewers sign off on totals and narrative text.