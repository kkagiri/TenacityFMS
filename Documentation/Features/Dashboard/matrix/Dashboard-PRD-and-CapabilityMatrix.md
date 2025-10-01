# Dashboard — Unified PRD and Capability Matrix

Last updated: 2025-09-26
Owner: Dashboard Team
Status: Draft → Implementing (Frontend-first)

## Summary
Unify the product requirements (creation flow) and the capability matrix (backend/UI contract) into a single, executable plan. Start with frontend form creation using a capability-driven customization matrix so we can test early with correct widget configuration JSON and iterate while backend enriches validation and shaping.

---

## Decision: Where aggregation happens
Yes — the backend aggregates according to the user’s chosen filters and aggregation (e.g., send SUM across selected sites). Rationale:

- Consistency: One source of truth (DataSourceManager) across SignalR and REST.
- Performance: Smaller payloads; heavy grouping done on the server.
- Business rules: Unit conversions, exclusions, data cleaning belong in the backend.

UI can format and slice already-grouped data (hide/show series, render percentages when totals are provided) but should not re-aggregate raw records.

---

## Capability matrix (Power BI–style)

For each widget: supported aggregations, accepted filters, backend granularity/shape, and UI role.

### BigStatCard

- Aggregations: SUM, AVG, COUNT, MIN, MAX
- Filters: site, vehicleType, dateRange, aggregation
- Backend granularity: Single aggregated value
- Data shape (envelope.data):
  - historical: { current: { value, unit }, context?: { trend, delta } }
  - live: { current: { value, unit }, freshnessUtc }
- UI role: Display only; no further aggregation

### BarChart

- Aggregations: SUM, AVG, COUNT
- Filters: site, vehicleType, dateRange, aggregation, groupBy (site|vehicleType|dateBucket)
- Backend granularity: Grouped by dimension(s), optional Total
- Data shape: { series: [{ key, label, value, unit }], total?: { value, unit } }
- UI role: Hide/show categories; render percentages; no re-aggregation

### LineChart

- Aggregations: SUM, AVG, COUNT, MIN, MAX
- Filters: site, vehicleType, dateRange, aggregation, granularity (minute|hour|day|week), cumulative (none|running)
- Backend granularity: Time-bucketed series, optional category split
- Data shape: { series: [{ key?, points: [{ timestampUtc, value, unit }] }], metadata?: { cumulative } }
- UI role: Visualize series; buckets from server; optional cumulative toggle

### Table

- Aggregations: None (server may include footer totals)
- Filters: site, vehicleType, dateRange, pagination/sort
- Backend granularity: Row-level or semi-aggregated
- Data shape: { rows: [...], totals?: { ... }, paging?: { page, pageSize, total } }
- UI role: Display/sort/paginate; show server totals

### PieChart

- Aggregations: SUM, COUNT
- Filters: site, vehicleType, dateRange, aggregation, groupBy
- Backend granularity: Single-category grouping; include Total and optionally percentages
- Data shape: { slices: [{ key, label, value, unit?, percentage? }], total?: number }
- UI role: Render proportions; prefer server percentages/total

### ProgressList

- Aggregations: SUM, AVG
- Filters: site, vehicleType, dateRange, aggregation, topK
- Backend granularity: Grouped and ranked; include max/total for progress bars
- Data shape: { items: [{ key, label, value, unit? }], max?: number, total?: number }
- UI role: Render ranking/thresholds; no metric recomputation

### Gauge

- Aggregations: SUM, AVG
- Filters: site, vehicleType, dateRange (target via settings/metadata)
- Backend granularity: Single value + target/thresholds
- Data shape: { value, unit?, target?, percentage? }
- UI role: Display proportion; UI may compute percentage only if server didn’t

---

## Envelope v2 mapping
- schemaVersion: 2
- widgetType: big_stat | bar_chart | line_chart | table | pie_chart | progress_list | gauge
- dataSource: e.g., fuel_dispensed
- mode: live | historical | historical_snapshot | compare_periods
- timeRange: { fromUtc, toUtc, preset }
- aggregation: sum | avg | count | min | max
- granularity: minute | hour | day | week
- groupBy: site | vehicleType | none
- filters: { siteIds?: number[], vehicleTypeIds?: number[] }
- metadata: { cumulative?: 'running'|'none', topK?: number, includeTotal?: boolean, units?: string }
- data: shaped per widget as above
- isInitialLoad: boolean

---

## Example payloads
- BigStat historical: data.current.value/unit + context
- Bar by site: series [{ key, label, value, unit }], total
- Line daily running: series points per day, metadata.cumulative='running'
- Pie by vehicleType: slices with percentage and total

---

## Validation rules
- Enforce widget/source → supported aggregations, groupBy, granularity, units.
- Bar/Pie require groupBy; BigStat/Gauge disallow groupBy.
- Line granularity defaults: last_7_days → day; last_24_hours → hour.
- Live unsupported → validation error + suggested historical fallback.

---

## Execution plan (Frontend-first)

We will start with the frontend customization form so we can produce correct configuration JSON early and test iteratively, while backend validation and shaping matures in parallel.

### F1 — WidgetForm customization matrix (start here)

- Dynamic data sources
  - Replace hardcoded metricOptions with metadata-driven list filtered by category and compatible widget types.
  - On data source change, auto-apply metadata defaults (aggregation, granularity, datePreset, units).
- Capability controls
  - Add: aggregation, groupBy (site|vehicleType|none), granularity (minute|hour|day|week), topK, includeTotal.
  - Constrain options via metadata (supportedAggregations, supportedGroupBy, recommendedGranularity, liveSupported).
- Validation (stub initially)
  - Call widgetFactoryService.validate debounced (300ms). In F1 it can stub to always valid; surface inline status placeholder.
- Preview harness
  - Wire the “Test Configuration” button to widgetFactoryService.getData. Render minimal BigStat value and compact chart preview.
- Output config JSON
  - Ensure we save: widgetType, dataSource, settings: { mode, datePreset, aggregation, groupBy, granularity, topK, includeTotal, unit }, filters: { siteIds, vehicleTypeIds }.

Deliverables
- Updated WidgetForm.js / CustomWidgetDialog.js
- Updated widgetFactoryService/dataSourceService calls
- Feature flag on creation flow

### F2 — EnhancedWidgetRenderer minimal alignment

- Remove client re-aggregation; render server-shaped data only.
- Read envelope.metadata (aggregation, groupBy, granularity, topK, includeTotal, units) to drive legends/labels and toggles.
- Support: BigStat, Line (day/hour), Bar (with Total/percentages), Pie (percentages) for previews and runtime.

### B1 — Backend metadata and validation (parallel)

- DataSourceManager metadata completeness
  - supportedAggregations, supportedGroupBy, recommendedGranularity/Units, liveSupported, min/max window, compareSupport, defaults.
- WidgetFactoryService.validate
  - Enforce supported combos; return suggestions/normalized config; maintain FMSResponse<T>.
- WidgetFactoryService.getData
  - Return minimal preview payloads per widget; cap series length.

### B2 — SignalR Hub capability propagation

- DashboardHub.MetricsAndRequests.cs
  - Extract capability fields from frontend configuration (aggregation, groupBy, granularity, topK, includeTotal).
  - Normalize defaults (e.g., last_7_days→day granularity).
  - Validate early and return BuildError envelopes with validation details on unsupported combos.
  - Pass capability fields to WidgetFactoryService (temporary via Settings; later as typed request fields).
  - Include capability fields in envelope.metadata on success.
- RequestDataSourceData parity as needed for ad-hoc requests.

### QA/Telemetry/Docs

- Golden datasets for SUM/AVG/COUNT/MIN/MAX and bucketing (last_7_days includes today).
- Envelope conformance (schemaVersion=2; isInitialLoad; timeRange alignment; batch/single frames).
- Telemetry: validation failure types; widget saves by type/aggregation/groupBy/granularity.
- Finalize docs; screenshots/workflows.

---

## Acceptance criteria
- Frontend form generates valid configuration JSON with capability fields and smart defaults.
- Renderer consumes server-shaped data; no client re-aggregation; uses envelope metadata for presentation.
- Backend validates and returns suggestions; preview works with capped payloads.
- SignalR envelopes include capability metadata for applicable widgets.
- All APIs return FMSResponse<T>; v2-negotiated clients receive envelope-only updates.

---

## Testing while building
- Start with F1: enable feature flag; point the form to existing endpoints.
- If validation isn’t ready, stub validate() to pass-through but still send capability fields in requests.
- Use development presets (e.g., last_7_days) to exercise daily granularity and cumulative modes.
- Verify config JSON aligns with this doc; save and reload widgets to confirm round-trip.

---

## Notes
- For percentages, prefer server computation; when UI computes, derive from server-provided totals in the same payload.
- Table previews remain minimal in this iteration.
