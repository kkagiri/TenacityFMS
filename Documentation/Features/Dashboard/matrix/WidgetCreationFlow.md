# Widget Creation Flow v2 — Dynamic Data Modes, Validation, and Preview

Deprecated: This document has been consolidated into a single source of truth.



Last updated: 2025-09-26
Owner: Dashboard Team
Status: Draft → Implementing (M1)

## Summary
Enable users to create widgets using backend-driven metadata, with real-time validation and quick preview, supporting consistent data modes (live, historical, cumulative, compare) and correct SignalR v2 envelope semantics.

## Problem
The current creation flow uses hardcoded catalogs with no backend validation, leading to misconfigurations (unsupported modes/units/aggregations) and slow feedback loops with trial-and-error.

## Goals
- Replace hardcoded options with backend metadata-driven choices (DataSourceManager).
- Provide real-time configuration validation with actionable suggestions (WidgetFactoryService).
- Offer instant preview (live/historical) that matches runtime behavior.
- Apply smart defaults per data source to reduce friction and errors.
- Maintain v2 envelope semantics and suppress legacy events for negotiated clients.

## Non-Goals
- Legacy REST/WidgetDataService has been decommissioned. Use WidgetFactoryService + IDataSourceManager.
- New data sources or device protocols.
- Layout system redesign.

## Users & Stories
- Fleet manager: Needs a daily aggregated fuel chart that includes today, with running cumulative.
- Ops analyst: Wants a live BigStat for total fuel dispensed in the last 5 minutes.
- Engineer: Needs a compare periods chart for distance travelled (last 7 days vs previous 7 days).

## Scope

### Functional requirements
- Dynamic catalogs: Categories → data sources discovered via metadata; compatible widget types per source.
- Modes supported:
  - Live
  - Historical snapshot (point-in-time)
  - Daily aggregated (per day)
  - Running cumulative (per-day running total)
  - Rolling window (hourly/minutely)
  - Compare periods (period-over-period)
- Validation:
  - Enforce supported modes/aggregations/granularity/units.
  - Enforce min/max window and required filters (sites/vehicles).
  - Provide suggestions and normalized config (smart defaults) on failures.
- Preview:
  - BigStat and basic charts; cap data size; empty-state hints.
- Smart defaults:
  - Auto set aggregation, granularity, units, and date presets per source metadata.
- Permissions:
  - Hide/disable sources not permitted by JWT.

### Out of scope (this iteration)
- Advanced event-aligned analytics and target/baseline authoring.
- Full table previews.

## API contracts

All controller responses use FMSResponse<T>.

Data sources
- GET /api/v1/dashboard/data-sources
- GET /api/v1/dashboard/data-sources/{id}/metadata
- GET /api/v1/dashboard/data-sources/{id}/aggregations
- GET /api/v1/dashboard/data-sources/{id}/initial | /live | /aggregated

Widget factory
- POST /api/v1/dashboard/widgets/factory/validate
- POST /api/v1/dashboard/widgets/factory/data
- GET  /api/v1/dashboard/widgets/factory/types

## Envelope v2 mapping (runtime alignment)
- schemaVersion: 2
- widgetType: big_stat | line_chart | bar_chart | gauge | table
- dataSource: e.g., fuel_dispensed
- mode: live | historical | historical_snapshot | compare_periods
- timeRange: { fromUtc, toUtc, preset }
- aggregation: sum | avg | count | min | max; granularity: minute | hour | day | week
- metadata: { cumulative, smoothing, groupBy, topK, units, target, compareTo, alignment, recommendations }
- data: single value (BigStat via data.current.value/unit) or series [{ timestampUtc, value, unit }]
- isInitialLoad: true on first batch; batch frames supported

## UX spec

Flow
1) Choose Template or Create Custom
2) Category → Widget type → Data source (loaded dynamically)
3) Mode selector appears with contextual sub-controls
4) Filters (sites, vehicles, aggregation/granularity) based on metadata
5) Validation status updates as the user edits
6) “Test Configuration” preview (BigStat/Chart)

UI rules
- Tailwind tw- prefix; responsive; keyboard accessible
- Show “Sites: all” when siteIds empty
- last_7_days includes today; local timezone alignment for daily buckets

Empty/error states
- No data: suggest broader presets (e.g., last_30_days) or “include today”
- Validation errors: show first error prominently with fix suggestion
- Live unsupported: suggest historical aggregated fallback

## Acceptance criteria
- Dynamic data source list filters by category; modes are metadata-driven.
- Validation returns immediate, actionable guidance; Save disabled when invalid.
- Preview works for BigStat and charts respecting:
  - last_7_days daily buckets including today (local time)
  - running cumulative toggle
  - BigStat historical mapping using data.current.value/unit
- v2-negotiated clients receive only envelope-based updates; legacy suppressed for those clients.
- FMSResponse<T> used on all API responses.
- Tailwind tw- classes; JWT permissions honored.

## Performance/SLAs
- Validation round-trip: < 300ms p95 (local network)
- Preview: < 1.5s p95 for last_7_days daily; cap series size (e.g., ≤ 366 daily points)
- SignalR: initial batch gated; single-frame debounced to reduce dispatch pressure

## Telemetry
Client
- Validation errors (types), preview attempts/success/fail, mode selections, saved widget distribution by mode/source.

Server
- Factory validate outcomes, data requests by mode/source, v2 adoption.

## Risks & mitigations
- Unsupported combinations → enforce metadata + suggestions.
- Performance regressions → debounced handlers; preview caps.
- Timezone/DST issues → local-day bucketing; preserve UTC timestamps.

## Rollout
- Feature flag for new creation flow; keep legacy creation path intact.
- Staged enablement: internal users → beta → all.
- Rollback: disable flag; legacy path still available.

## Dependencies
- DataSourceManager metadata completeness: supportedModes, supportedAggregations, defaults, recommendedGranularity/Units, liveSupported, window limits, compareSupport.
- WidgetFactoryService: validation and transforms consistent with SignalR runtime.

## Test plan (high-level)
- Unit: validation rules; default recommendation logic.
- Integration: preview responses vs live runtime parity (BigStat + charts).
- E2E: create widgets across 4 sources × 4 modes × 2 presets.

---

# Implementation Tasklist

Use this as a living checklist. Grouped by milestone for incremental delivery.

## M1: Dynamic data sources + Mode selector (Validation stub)
- [ ] DataSourceManager metadata
  - [ ] Ensure each data source exposes: supportedModes, supportedAggregations, defaultAggregation, recommendedGranularity, recommendedUnits, liveSupported, min/max window, compareSupport.
  - [ ] Add metadata.recommendations: { datePreset, granularity, cumulativeDefault, smoothingDefault }.
- [ ] Frontend services
  - [ ] dataSourceService: add caching for getAvailableDataSources(); add getMetadata(sourceId); helper to map category → sources → modes.
  - [ ] widgetFactoryService: add validateOnChange(config, debounce=300ms) returning { isValid, errors, suggestions, normalizedConfig } (can stub to always valid in M1).
- [ ] UI: WidgetForm.js / CustomWidgetDialog.js
  - [ ] Replace hardcoded metricOptions with dynamic sources filtered by category and compatible widget types.
  - [ ] Add Mode selector UI with options: Live, Snapshot, Daily Aggregated, Running Cumulative, Rolling Window, Compare Periods.
  - [ ] On source change, auto-apply metadata defaults for aggregation/granularity/datePreset/units.

## M2: Real-time validation + Smart defaults
- [x] widgetFactoryService.validateOnChange (client-side):
  - Enforce supported modes/aggregations/granularity/units using DataSource metadata.
  - Return { isValid, errors[], suggestions[], normalizedConfig }.
  - Debounced (default 300ms), with optional server fallback disabled by default.
- [ ] widgetFactoryService.validate (server round-trip):
  - POST /dashboard/widgets/factory/validate; merge server validationErrors into client result when useServerFallback=true.
- [ ] UI wiring (WidgetForm.js / CustomWidgetDialog.js):
  - Call validateOnChange on config edits (debounced) and display inline status (✓ Valid / ⚠ Issues).
  - Disable Save when invalid; show first error with suggested fix action.
- [ ] Smart units behavior:
  - When metric changes and user hasn’t explicitly chosen a unit, set settings.unit to metadata.recommendedUnits[0] (or Unit).
- [ ] Filter visibility driven by metadata:
  - Show Site filter if requiresSiteFilter=true; Vehicle filter if requiresVehicleFilter=true.
  - Show aggregation/granularity controls only when supported lists contain > 1 option.

Acceptance criteria (M2):
- Editing mode/aggregation/granularity/unit triggers validation and auto-normalizes unsupported selections to defaults.
- Save button remains disabled while validation has errors; a clear message and suggestion are visible.
- Changing data source automatically applies recommended datePreset, granularity, and unit when not explicitly set by user.

## M3: Preview end-to-end + UX polish
- [ ] widgetFactoryService.getData: return minimal preview payloads.
- [ ] UI: “Test Configuration” renders:
  - [ ] BigStat: value + unit + timestamp freshness.
  - [ ] Chart: compact line/bar; daily/hourly buckets, cumulative toggle.
  - [ ] No-data → friendly hints (e.g., switch preset to last_30_days).
- [ ] Performance caps (series length); debounce state updates.
- [ ] Accessibility and keyboard navigation pass.

## M4: QA, telemetry, docs
- [ ] Functional matrix: live vs historical vs cumulative vs compare across key sources (fuel_dispensed, distance_travelled, engine_hours_gps, tank_level).
- [ ] Envelope conformance: schemaVersion=2; timeRange alignment; isInitialLoad; batch vs single frames.
- [ ] Regression: legacy clients unaffected; negotiated clients get v2-only.
- [ ] Telemetry events: client + server.
- [ ] Documentation: finalize this PRD; add screenshots/workflows.

---

## Requirements coverage
- Dynamic metadata-driven options → Addressed via DataSourceManager metadata + UI wiring.
- Real-time validation with suggestions → WidgetFactoryService.validate + UI debounced hooks.
- Live/historical/cumulative/compare modes → Mode selector + backend mapping.
- Preview → WidgetFactoryService.getData; chart/BigStat minimal previews.
- v2 envelope + legacy suppression → Protocol already implemented; maintained.
- Tailwind and permissions → UI conventions honored; JWT-based permissions applied.

## Next steps
- Implement M1 tasks; open PR with feature flag and partial UI (validation stubbed).
- Schedule 30–45 min review to lock in validation error messages and preview caps.

---

## Additional implementation deltas (Hub + Renderer)

SignalR Hub (DashboardHub.MetricsAndRequests.cs)
- Extract capability fields in RequestWidgetData (and RequestDataSourceData if used): aggregation, groupBy, granularity, topK, includeTotal
- Normalize defaults and infer granularity from datePreset when omitted (e.g., last_7_days → day, last_24_hours → hour)
- Validate combinations and return BuildError with validation details when unsupported
- Pass capability fields to the factory/manager (temporary via Settings; later as typed properties)
- Include capability fields in envelope.metadata on success

EnhancedWidgetRenderer.js
- Treat server as source of truth for aggregation/bucketing; remove any client re-aggregation
- Read envelope.metadata (aggregation, groupBy, granularity, topK, includeTotal, units) to drive labels/legends/toggles
- Prefer server-provided totals/percentages for categorical visuals