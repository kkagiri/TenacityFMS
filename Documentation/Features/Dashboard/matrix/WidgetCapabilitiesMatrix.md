# Widget Capabilities Matrix — Aggregation Policy and Contracts




Last updated: 2025-09-26
Owner: Dashboard Team
Status: Draft → Implementing (M1)


## Decision: Where should aggregation happen?

Yes — the backend should aggregate according to the user’s chosen filters and aggregation (e.g., send SUM across selected sites A+B). Rationale:
- Consistency: A single source of truth (DataSourceManager) ensures identical results across SignalR and REST and avoids client-side math drift.
- Performance: Smaller payloads and less client CPU when windows are large or grouping is complex.
- Business rules: Sensitive rules (unit conversions, exclusions, data cleaning) belong in the server.


UI may format, slice the already-grouped data (e.g., hide/show series), and compute trivial display-only values (e.g., percentages when totals are provided). It should not re-aggregate raw records.

Exceptions (acceptable on UI if needed, but preferred from server):
- Collapsing categories into an "All" synthetic category when the backend has returned per-category series and total isn’t provided. Prefer the server to include an explicit Total series to avoid rounding errors.
- Table sub-totals that are purely visual (no business logic).

---

## Capability matrix (Power BI-style)


For each widget type: supported aggregations, accepted filters, backend data granularity/shape, and UI role.

### BigStatCard
- Primary use: Single KPI (total fuel dispensed, avg consumption)
- Aggregations: SUM, AVG, COUNT, MIN, MAX
- Filters: site, vehicleType, dateRange, aggregation
- Backend data granularity: Single aggregated value (respecting filters/aggregation)
- Data shape (envelope.data):
  - historical: { current: { value: number, unit: string }, context?: { trend?: number, delta?: number } }

  - live: { current: { value: number, unit: string }, freshnessUtc: string }
- UI role: Display only; no further aggregation

### BarChart
- Primary use: Compare categories (fuel by site, trips per vehicleType)
- Aggregations: SUM, AVG, COUNT
- Filters: site, vehicleType, dateRange, aggregation, groupBy (site|vehicleType|dateBucket)
- Backend data granularity: Grouped by dimension(s). Optionally include an overall Total
- Data shape:

  - { series: [{ key: string, label: string, value: number, unit: string }], total?: { value: number, unit: string } }
- UI role: May hide/show categories or compute percentage-of-total; should not re-aggregate base records

### LineChart
- Primary use: Time trends (e.g., daily fuel dispensed)
- Aggregations: SUM, AVG, COUNT, MIN, MAX
- Filters: site, vehicleType, dateRange, aggregation, granularity (minute|hour|day|week), cumulative (none|running)
- Backend data granularity: Time-bucketed series, optionally split by category
- Data shape:

  - { series: [{ key?: string, points: [{ timestampUtc: string, value: number, unit: string }] }], metadata?: { cumulative?: 'running'|'none' } }
- UI role: Visualizes series; does not compute buckets; may toggle cumulative if server provided both daily and running

### Table
- Primary use: Detailed listing (transactions, breakdowns)
- Aggregations: None (optionally footer totals provided by server)
- Filters: site, vehicleType, dateRange, pagination/sort
- Backend data granularity: Row-level or semi-aggregated
- Data shape:

  - { rows: Array<Record<string, any>>, totals?: Record<string, number>, paging?: { page: number, pageSize: number, total: number } }
- UI role: Displays records; applies sort/pagination; may show provided totals

### PieChart
- Primary use: Proportions (fuel share per vehicleType)
- Aggregations: SUM, COUNT
- Filters: site, vehicleType, dateRange, aggregation, groupBy
- Backend data granularity: Grouped by a single category; include total and pre-computed percentage if possible
- Data shape:

  - { slices: [{ key: string, label: string, value: number, unit?: string, percentage?: number }], total?: number }
- UI role: Renders percentages; avoid recalculating totals where possible

### ProgressList
- Primary use: Ranked list with progress bars (e.g., top 10 vehicles by fuel dispensed)
- Aggregations: SUM, AVG
- Filters: site, vehicleType, dateRange, aggregation, topK
- Backend data granularity: Grouped and ranked; include overall max and/or total for progress computation
- Data shape:

  - { items: [{ key: string, label: string, value: number, unit?: string }], max?: number, total?: number }
- UI role: Renders ranking/thresholds; no metric recomputation

### Gauge
- Primary use: Percentage progress toward a target
- Aggregations: SUM, AVG
- Filters: site, vehicleType, dateRange; target provided in settings or metadata
- Backend data granularity: Single aggregated value plus target/thresholds when provided
- Data shape:
  - { value: number, unit?: string, target?: number, percentage?: number }
- UI role: Displays proportion; if server did not compute percentage, UI may compute value/target


---

## Backend contracts (envelope mapping)
- schemaVersion: 2
- widgetType: big_stat | bar_chart | line_chart | table | pie_chart | progress_list | gauge
- dataSource: e.g., fuel_dispensed
- mode: live | historical | historical_snapshot | compare_periods
- timeRange: { fromUtc, toUtc, preset }
- aggregation: sum | avg | count | min | max
- granularity (for time series): minute | hour | day | week
- groupBy (for categorical): site | vehicleType | none
- filters: { siteIds?: number[], vehicleTypeIds?: number[] }
- metadata: { cumulative?: 'running'|'none', topK?: number, includeTotal?: boolean, units?: string }
- data: shaped per widget as specified above
- isInitialLoad: boolean



---

## Example payloads


BigStat (historical):
- mode: historical, aggregation: sum
- data: { current: { value: 25706, unit: 'liters' }, context: { delta: 120, trend: 0.0046 } }


BarChart by site:
- aggregation: sum, groupBy: site
- data: { series: [{ key: 'site-1', label: 'Depot A', value: 12000, unit: 'L' }, { key: 'site-2', label: 'Depot B', value: 13706, unit: 'L' }], total: { value: 25706, unit: 'L' } }


LineChart daily running cumulative:
- granularity: day, metadata.cumulative: 'running'
- data: { series: [{ points: [{ timestampUtc: '2025-09-20T00:00:00Z', value: 2000, unit: 'L' }, ...] }] }

PieChart share by vehicleType:
- groupBy: vehicleType
- data: { slices: [{ key: 'truck', label: 'Truck', value: 10000, percentage: 38.9 }, ...], total: 25706 }

---

## Validation rules
- Enforce aggregation compatibility per data source and widget.
- Require groupBy for Bar/Pie when a categorical comparison is requested.
- Enforce granularity for Line (day by default for last_7_days, hour for last_24h).
- Disallow live mode for sources without liveSupported.
- Units must be within recommendedUnits; convert on server.

---

## Tasklist (execution)

### Backend (DataSourceManager / WidgetFactoryService)
- [ ] Add/ensure per-widget shaping methods:
  - [ ] TransformForBigStatCard (single aggregated value)
  - [ ] TransformForBarChart (grouped categories + optional total)
  - [ ] TransformForLineChart (time-bucketed series with optional running cumulative)
  - [ ] TransformForPieChart (grouped with total and optional percentages)
  - [ ] TransformForProgressList (topK ranking with max/total)
  - [ ] TransformForGauge (value + target/percentage)
- [ ] Implement server-side aggregation honoring: filters (siteIds, vehicleTypeIds), aggregation, groupBy, granularity, timeRange.
- [ ] Extend DataSource metadata: supportedAggregations, supportedGroupBy, recommendedGranularity, recommendedUnits, liveSupported, includeTotalDefault, topKDefault.
- [ ] Validate requests in WidgetFactoryService and return suggestions/normalized config.
- [ ] Unit tests for aggregation correctness and shape per widget.

### SignalR Hub (DashboardHub.*)
- [ ] RequestWidgetData: extract capability fields from configuration/frontendConfiguration and Settings
  - [ ] aggregation (default "SUM"), groupBy (default "none"), granularity (infer from timeRange: last_7_days→day, last_24_hours→hour), topK, includeTotal (default true)
  - [ ] Normalize unsupported combinations early and return BuildError with validation errors
  - [ ] Pass capability fields to WidgetFactoryService via strongly-typed properties or Settings passthrough (temporary)
- [ ] RequestDataSourceData: mirror capability parsing/validation for ad-hoc requests (if used by UI)
- [ ] Envelope metadata: include aggregation, groupBy, granularity, topK, includeTotal in WidgetDataEnvelope.Metadata
- [ ] Keep legacy suppression: send envelopes to all; legacy updates only to LegacyGroup
- [ ] Telemetry: log requested capability combinations and validation failures
- [ ] Tests: verify envelopes carry capability metadata and that parsing falls back to defaults safely

### Controllers (FMS.WebClient)
- [ ] Ensure factory endpoints return FMSResponse<T> with validation errors populated.
- [ ] Add compare periods route support (optional, if not present).

### Frontend (services + UI)
- [ ] EnhancedWidgetRenderer.js
  - [ ] Map widget type → expected server shape; remove client-side re-aggregation/math
  - [ ] Use envelope.metadata (aggregation, groupBy, granularity, topK, includeTotal, units) to drive presentation
  - [ ] Handle optional Total in categorical visuals (Bar/Pie) and prefer server-provided percentages
- [ ] WidgetForm.js / CustomWidgetDialog.js
  - [ ] Add capability fields: groupBy (site|vehicleType|none), granularity (minute|hour|day|week), topK, includeTotal (bool)
  - [ ] Constrain items based on data source metadata (supportedAggregations, supportedGroupBy, recommendedGranularity, liveSupported)
  - [ ] On change, call widgetFactoryService.validate (debounced) and reflect status; apply normalized suggestions
  - [ ] Auto-apply metadata defaults on metric change (aggregation, granularity, datePreset, units)
- [ ] Services: ensure validate/getData requests pass capability fields exactly as PRD specifies
- [ ] Preview: render minimal BigStat/Chart previews using server-shaped data (no re-aggregation)

### QA
- [ ] Golden datasets to verify SUM/AVG/COUNT/MIN/MAX per widget and filters.
- [ ] Timezone/day-bucketing tests (last_7_days includes today).
- [ ] Live unsupported → validation error and suggested fallback.

### Telemetry
- [ ] Log validation failure types and most-suggested corrections.
- [ ] Track widget saves by type/aggregation/groupBy/granularity.

---

## Acceptance criteria
- Backend returns pre-aggregated data per filters/aggregation for BigStat/Bar/Pie/Gauge/ProgressList and bucketed series for Line.
- UI performs no re-aggregation beyond display-only operations (percentages when total provided, ranking rendering).
- Validation blocks unsupported combinations and suggests alternatives.
- Contracts match envelope v2 and widget renderers consume the declared shapes without additional mapping.
 - SignalR envelopes include capability metadata (aggregation, groupBy, granularity, topK, includeTotal) for applicable widgets.
 - WidgetForm collects and submits capability fields; EnhancedWidgetRenderer reads them and renders accordingly.

---

## Notes
- For Table widgets, the backend can return raw/semi-aggregated rows with optional totals in the response; UI should not compute business totals.
- For percentages, prefer server computation to ensure consistency; when computed client-side, derive from provided totals from the same payload.
