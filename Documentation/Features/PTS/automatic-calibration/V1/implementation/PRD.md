# Product Requirements Document

## Feature
Advanced PTS Automatic Calibration and FMS Learned Calibration from Fuel Dispensed and Tank Volume Monitoring

## Version
V1

## Document Type
Implementation PRD

## Date
2026-03-23

## 1. Purpose
Build an advanced PTS calibration and monitoring capability in FMS that combines:
- PTS automatic tank calibration chart generation,
- manual and automatic calibration chart management,
- tank volume monitoring from PTS probe measurements,
- fuel-dispensed versus measured-volume analysis,
- local FMS persistence for calibration snapshots, revisions, and history,
- **FMS-side learned calibration** — an independent height-to-volume chart built from operational data (pump transactions, tank measurements, in-tank deliveries) without requiring the PTS controller to perform chart generation.

The feature must let operations users manage and review tank calibration quality from FMS without relying on the PTS controller UI alone. For tanks where PTS automatic calibration is unavailable or insufficient, FMS can independently learn and build calibration charts from observed fuel movements.

## 2. Background
FMS already contains the main building blocks needed for this feature:
- PTS device communication and configuration APIs.
- live probe measurement handling through UploadStatus.
- tank-to-PTS binding through `PtsId`, `ProbeNumber`, `PtsTankId`, and `UsePtsProbeReadings`.
- persisted tank measurements and in-tank deliveries.
- pump transactions with `TankId` and `Volume` linking every dispensing event to a specific tank.
- in-tank delivery records that already bracket deliveries with start/end height, volume, and `PumpsDispensedVolume`.
- frontend tank pages that already expose probe binding and live probe visibility.

The jsonPTS protocol revision R132 adds the required calibration operations, including:
- manual tank calibration chart total count and record retrieval,
- manual chart create, append, edit, and delete operations,
- tank volume lookup by height,
- automatic calibration generation,
- interval-volume chart retrieval with pass counts,
- automatic calibration chart retrieval,
- daily processing flags for regenerating automatic tank calibration charts.

Despite this protocol support, FMS currently does not expose a complete calibration workflow in backend APIs, persistence, or UI.

Additionally, FMS already accumulates the operational data needed to independently derive calibration charts. Each pump transaction records the dispensed volume and the source tank. Each tank measurement records the probe height and calculated volume at a point in time. In-tank deliveries capture before/after height and volume states around delivery events. By correlating known volume changes (dispensed or delivered) with observed height changes, FMS can build its own height-to-volume mapping — a **learned calibration chart** — without relying on the PTS controller's automatic calibration function.

## 3. Problem Statement
Tank probe monitoring exists, but calibration management is incomplete. Users cannot currently do the following from FMS:
- retrieve and manage calibration charts from the PTS device,
- trigger automatic calibration generation,
- review readiness for automatic calibration generation,
- compare dispensed volume against measured tank volume deltas,
- track calibration history and revisions over time,
- use calibration confidence to drive tank monitoring decisions,
- build a calibration chart independently from operational data when PTS automatic calibration is unavailable or when the tank has no existing calibration chart.

This leaves a gap between raw PTS capability and actual operational usage inside FMS. Furthermore, FMS already collects the data needed to derive calibration independently, but does not use it for that purpose.

## 4. Product Goal
Enable FMS to act as the operational control and audit layer for PTS tank calibration and tank volume monitoring, with both device-side execution, FMS-side historical analysis, and independent FMS-side learned calibration chart generation from operational data.

## 5. Objectives
1. Expose PTS calibration chart operations through FMS backend APIs.
2. Support manual chart retrieval and update workflows from FMS.
3. Support automatic calibration generation from the PTS controller.
4. Persist calibration charts, snapshots, generation runs, and revision history in FMS.
5. Analyze dispensed fuel volume against tank measurement deltas.
6. Surface calibration status, readiness, and confidence in the tank UI.
7. Keep the feature compatible with the existing tank monitoring and probe-binding flows.
8. Avoid introducing unrelated architectural changes outside the tank and PTS domains.
9. Build FMS-side learned calibration charts from accumulated operational data (pump transactions, tank measurements, in-tank deliveries).
10. Support both passive learning (building calibration over time from monitoring) and seeded/bootstrap mode (starting from a known calibration chart and refining it).
11. Allow side-by-side comparison of FMS-learned charts against PTS manual and automatic charts.
12. Make calibration learning parameters system-configurable through the existing SystemConfiguration pattern.

## 6. In Scope

### 6.1 Backend device integration
- Extend the existing PTS configuration service and controller to support:
  - `ProbeGetTankCalibrationChartTotalRecordsNumber`
  - `ProbeGetTankCalibrationChartRecordsList`
  - `ProbeSetTankCalibrationChartRecordsList`
  - `ProbeAddTankCalibrationChartRecordsList`
  - `ProbeAddTankCalibrationChartRecordToList`
  - `ProbeEditTankCalibrationChartRecordInList`
  - `ProbeDeleteTankCalibrationChartRecordFromList`
  - `ProbeGetTankVolumeForHeight`
  - `ProbeGenerateTankAutomaticCalibrationChart`
  - `ProbeGetTankIntervalVolumeChartTotalRecordsNumber`
  - `ProbeGetTankIntervalVolumeChartRecordsList`
  - `ProbeGetTankAutomaticCalibrationChartTotalRecordsNumber`
  - `ProbeGetTankAutomaticCalibrationChartRecordsList`

### 6.2 FMS persistence
- Persist manual chart snapshots.
- Persist interval-volume chart snapshots.
- Persist automatic chart snapshots.
- Persist calibration runs and generation attempts.
- Persist chart revisions and sync timestamps.
- Persist dispensed-versus-measured analysis results.

### 6.3 Monitoring and analytics
- Use existing tank measurements and in-tank deliveries as the basis for analysis.
- Calculate measured volume delta versus dispensed volume delta.
- Record variance and confidence metrics.
- Expose recalibration-needed indicators.

### 6.4 FMS learned calibration
- Extract calibration data points from operational data:
  - **Dispensing events**: correlate `PumpTransaction.Volume` with height changes in `Tankmeasurement` records before and after dispensing for the same `TankId`.
  - **Delivery events**: use `Intankdelivery` start/end height and volume states, combined with `PumpsDispensedVolume`, to derive height-to-volume observations.
- Define stability criteria for valid observation windows:
  - Configurable minimum time gap between readings for "stable" state (default based on UploadStatus template rate, minimum 5 minutes).
  - Single-event windows only — reject windows where dispensing and delivery overlap.
  - Probe readings must not be fluctuating beyond a configurable variance threshold.
- Accumulate calibration data points in fixed configurable height intervals (default 50mm, system-configurable).
- Track observation count, mean volume-per-mm, and standard deviation per height interval.
- Support two modes:
  - **Passive learning**: start from zero and build the chart over time from operational data. Suitable for tanks without any existing calibration.
  - **Seeded/bootstrap**: import a known calibration chart (from PTS manual chart or manual entry) as the baseline, then refine it over time as operational data confirms or corrects each height interval.
- Generate FMS learned calibration chart on demand (user-triggered).
- Support background event trigger when sufficient new data points have accumulated (configurable threshold per height interval).
- Persist FMS learned charts as `TankCalibrationSnapshot` with `ChartType = "fms-learned"`.
- Compare FMS learned chart against PTS manual and automatic charts, highlighting deviation per height interval.

### 6.5 System configuration for calibration learning
- Add `SystemConfiguration` keys for FMS learned calibration parameters:
  - `Calibration.HeightIntervalMm` — height bucket size (default 50mm).
  - `Calibration.MinObservationsPerInterval` — minimum data points before an interval is considered usable (default configurable from UI).
  - `Calibration.StabilityWindowMinutes` — minimum quiet time before/after an event to consider readings stable (default 5 min).
  - `Calibration.MaxHeightVarianceMm` — maximum probe reading fluctuation within a stability window (default 2mm).
  - `Calibration.MinVolumeChangeLitres` — minimum volume change to consider a dispensing/delivery event usable for calibration (filters noise).
  - `Calibration.BackgroundTriggerThreshold` — number of new unprocessed data points before a background event fires to notify that recalculation is available.
  - `Calibration.LearningEnabled` — global toggle for FMS calibration learning (default false).

### 6.6 Frontend
- Add calibration API methods to the frontend PTS config service.
- Add tank-level calibration status visibility.
- Add a calibration management panel or modal reachable from existing tank pages.
- Support viewing manual chart, interval chart, automatic chart, FMS learned chart, history, and variance metrics.
- Support triggering automatic calibration generation from the UI.
- Support triggering FMS learned calibration generation from the UI.
- Show FMS calibration learning coverage (which height intervals have sufficient data).
- Show comparison overlay between FMS learned chart and PTS charts.
- Support seeding/importing a known chart as baseline for FMS learning.

## 7. Out of Scope for V1
- Autonomous push of FMS-learned charts to PTS devices without user review and explicit confirmation.
- Firmware management or PTS operating system changes.
- Redesign of unrelated tank stock dashboards.
- New mobile workflows.
- New vendor-neutral calibration abstractions outside PTS.
- Full predictive modeling beyond variance and readiness indicators.
- Adaptive (non-fixed) height interval sizing — V1 uses fixed configurable intervals only.
- Temperature compensation within FMS — PTS already compensates probe readings; FMS reads compensated values.

## 8. Users and Stakeholders
- Fuel operations administrators
- Site managers
- Tank monitoring users
- PTS device support teams
- Implementation engineers
- Reporting and audit stakeholders

## 9. Current State Summary

### 9.1 Existing system capabilities
- Tanks can already be linked to PTS devices and probes.
- UploadStatus already brings live probe measurements into FMS.
- Tank measurements and in-tank deliveries are already persisted.
- Existing frontend tank pages already show live probe measurements and probe binding controls.

### 9.2 Current gaps
- No end-to-end calibration API in FMS.
- No calibration chart persistence in FMS.
- No calibration history or revision tracking.
- No dispensed-versus-measured analysis workflow.
- No calibration management UI in tank pages.
- No FMS-side independent calibration chart generation from operational data.
- No calibration learning data point accumulation from pump transactions and tank measurements.
- No mechanism to seed or bootstrap calibration from a known chart.

## 10. Functional Requirements

### FR-1: Device calibration chart retrieval
The system shall retrieve manual calibration chart totals and paged chart rows from a bound PTS device by device identifier and probe number.

### FR-2: Device calibration chart updates
The system shall support replacing, appending, inserting, editing, and deleting manual calibration chart records on a PTS device within protocol limits.

### FR-3: Automatic calibration generation
The system shall allow a user to trigger automatic calibration generation for a selected tank probe through FMS.

### FR-4: Interval-volume chart access
The system shall retrieve interval-volume chart data and pass counts from the PTS controller to evaluate readiness and confidence.

### FR-5: Automatic chart retrieval
The system shall retrieve the generated automatic calibration chart and display it separately from the manual chart.

### FR-6: Volume lookup by height
The system shall support height-to-volume lookup for a selected probe using the current chart on the PTS device.

### FR-7: Local persistence
The system shall persist chart snapshots and generation history in FMS so users can review previous revisions without requiring a live device connection.

### FR-8: Revision tracking
The system shall version calibration snapshots so users can distinguish current, previous, and generated chart revisions.

### FR-9: Dispensed-versus-measured analysis
The system shall calculate differences between dispensed fuel and measured tank volume deltas using existing in-tank delivery and tank measurement data.

### FR-10: Tank calibration status
The system shall expose calibration-related tank status, including:
- whether automatic calibration is enabled,
- whether automatic calibration is ready for generation,
- last sync time,
- last generation result,
- latest variance indicator,
- whether recalibration is recommended.

### FR-11: UI workflow integration
The system shall integrate calibration management into the existing tank management and PTS binding experience rather than creating an unrelated workflow.

### FR-12: Validation
The system shall validate:
- device binding exists,
- probe number is valid,
- record ranges are valid,
- update payloads stay within protocol save limits,
- users cannot issue calibration actions against missing or offline devices without a clear error.

### FR-13: Auditability
The system shall capture who triggered chart sync, generation, and updates, when the action happened, and what result was returned.

### FR-14: Graceful degraded mode
The system shall allow users to view persisted calibration history even when the PTS device is unavailable.

### FR-15: FMS calibration data point extraction
The system shall extract calibration data points from operational data by correlating:
- pump transaction volumes (`PumpTransaction.Volume` for a given `TankId`) with tank measurement height changes (`Tankmeasurement.ProductHeight`) before and after the dispensing event,
- in-tank delivery records (`Intankdelivery` start/end height and volume) with `PumpsDispensedVolume`,
using configurable stability criteria to ensure readings are settled before and after each event.

### FR-16: Stability window validation
The system shall only accept calibration data points where:
- probe readings before the event are stable (no fluctuation beyond `Calibration.MaxHeightVarianceMm`) for at least `Calibration.StabilityWindowMinutes`,
- probe readings after the event are stable by the same criteria,
- no overlapping dispensing or delivery events occurred during the observation window,
- the volume change exceeds `Calibration.MinVolumeChangeLitres` to filter noise.

### FR-17: Height interval accumulation
The system shall group extracted calibration data points into fixed height intervals of `Calibration.HeightIntervalMm` millimetres. For each interval, the system shall track:
- observation count,
- mean volume-per-millimetre,
- standard deviation,
- last updated timestamp,
- source event references (pump transaction IDs or delivery IDs).

### FR-18: FMS learned chart generation
The system shall generate a complete height-to-volume calibration chart from accumulated interval data when triggered by a user. The chart shall:
- include only height intervals that have at least `Calibration.MinObservationsPerInterval` observations,
- build a cumulative volume curve from interval-level volume-per-mm averages,
- be persisted as a `TankCalibrationSnapshot` with `ChartType = "fms-learned"`,
- clearly indicate coverage gaps where insufficient data exists.

### FR-19: Seeded and passive learning modes
The system shall support two learning modes:
- **Passive (bootstrap)**: start from zero observations and build the chart entirely from operational data over time. Suitable for tanks with no existing calibration.
- **Seeded**: import an existing calibration chart (from PTS manual chart sync or manual entry) as the baseline. Operational data then confirms, refines, or flags deviations from the seed chart per interval.

### FR-20: Chart comparison
The system shall compare the FMS learned chart against PTS manual and automatic charts, reporting deviation per height interval in both absolute volume and percentage terms.

### FR-21: Background readiness event
The system shall support a background trigger (configurable via `Calibration.BackgroundTriggerThreshold`) that fires an event when enough new unprocessed calibration data points have accumulated to justify recalculation. This event is informational — chart generation still requires explicit user or scheduled trigger.

### FR-22: Calibration learning configuration
The system shall expose all calibration learning parameters through `SystemConfiguration` so they can be adjusted per deployment without code changes. Parameters shall be editable from the admin UI.

## 11. Non-Functional Requirements

### NFR-1: Reuse existing architecture
The implementation shall reuse existing PTS service, controller, and tank-management patterns wherever possible.

### NFR-2: Response consistency
All backend APIs shall return `FMSResponse<T>`.

### NFR-3: Separation of concerns
Device transport logic shall remain in PTS services, while persisted history and analytics shall live in application features aligned with tank management.

### NFR-4: Performance
Calibration chart retrieval and history views shall support pagination and avoid loading excessively large datasets into a single request when protocol pagination already exists.

### NFR-5: Reliability
Device errors, protocol validation failures, and busy-controller responses shall be logged with actionable context.

### NFR-6: Maintainability
The feature shall avoid expanding large existing files with unrelated logic, especially the UploadStatus handler.

### NFR-7: Security
Only authorized users with device and tank-management permissions shall be able to read or modify calibration data.

## 12. Data Requirements
The solution shall persist at minimum:
- calibration snapshot header
- calibration snapshot rows
- interval-volume snapshot header
- interval-volume snapshot rows
- automatic calibration snapshot header
- automatic calibration snapshot rows
- FMS learned calibration snapshot header and rows (via `ChartType = "fms-learned"`)
- calibration run history
- sync history
- variance analysis records
- user/action audit metadata
- **calibration data points** — individual height-change/volume-change observations extracted from pump transactions and deliveries, linked to source event IDs
- **height interval accumulation records** — per-tank, per-interval aggregates (observation count, mean volume-per-mm, standard deviation, last updated)
- **seed chart reference** — if a tank was seeded from an existing chart, reference to the source snapshot
- **SystemConfiguration entries** for calibration learning parameters

## 13. Proposed User Experience

### 13.1 Entry points
- Tank detail panel
- PTS device link panel
- dedicated calibration panel or modal launched from tank management

### 13.2 Main user actions
1. Open a tank with a valid PTS binding.
2. Review live probe status and calibration status.
3. Fetch current manual calibration chart from PTS.
4. Fetch interval-volume chart and automatic chart.
5. Trigger automatic calibration generation.
6. Sync the resulting chart into FMS history.
7. Review variance trends between dispensed volume and measured tank change.
8. Decide whether recalibration or manual chart maintenance is needed.
9. Review FMS calibration learning coverage — see which height intervals have enough data.
10. Trigger FMS learned chart generation when coverage is sufficient.
11. Compare FMS learned chart side-by-side with PTS manual/automatic charts.
12. Seed FMS learning from an existing PTS chart or import a known chart.
13. Review deviation highlights between FMS learned chart and PTS charts.

## 14. High-Level Architecture

### 14.1 Backend
- Extend the existing PTS configuration service interface and implementation.
- Add calibration DTOs and request models.
- Add calibration endpoints in the existing PTS config controller.
- Add persistence and CQRS workflows for chart sync, history, and analytics.

### 14.2 Frontend
- Extend the existing `ptsConfigService.js`.
- Extend tank pages with calibration status and actions.
- Add a focused calibration management panel or modal.

### 14.3 Analytics
- Use persisted tank measurements and in-tank deliveries.
- Calculate delta and variance.
- Store outputs as historical records for later review.

### 14.4 FMS learned calibration engine
- Calibration data point extractor: correlates pump transactions and deliveries with tank measurement height changes.
- Stability validator: applies configurable window and variance criteria to filter valid data points.
- Height interval accumulator: groups data points into fixed intervals, maintains running statistics.
- Chart builder: generates cumulative height-to-volume chart from interval data.
- Seed manager: imports existing charts as learning baselines.
- Comparison engine: computes deviation between FMS learned chart and PTS charts per height interval.
- All components live in `FMS.Application/Features/TankManagement/TankCalibration/` — not in UploadStatus.

## 15. Dependencies
- Existing PTS command execution pipeline
- Existing tank-to-probe binding data
- Existing tank measurements and in-tank delivery persistence
- Existing pump transaction persistence with TankId mapping
- Existing tank UI pages and PTS frontend service
- Existing SystemConfiguration infrastructure and admin UI
- PTS device availability for live operations (not required for FMS learned calibration)

## 16. Constraints and Assumptions
- The PTS protocol is the source of truth for live calibration chart operations.
- FMS will store snapshots and history, not become the source of truth for controller internals.
- Full persistence may require new persistence models and possibly new entities. If the implementation requires direct `FMS.Domain` changes, that should be explicitly reviewed before coding because the repository rules mark Domain changes as protected.
- Existing tank monitoring flows must remain functional for tanks that do not use calibration features.

## 17. Success Metrics
1. Users can retrieve manual, interval, and automatic charts from FMS.
2. Users can trigger automatic calibration generation successfully.
3. Users can review persisted chart history without a live device connection.
4. Users can see variance between dispensed and measured volumes at tank level.
5. Existing tank probe monitoring and auto-stock workflows continue to work without regression.
6. FMS accumulates calibration data points passively from normal operations without operator intervention.
7. Users can generate an FMS learned calibration chart and compare it against PTS charts.
8. Tanks without PTS automatic calibration can still build a calibration chart from operational data over time.
9. Seeded charts are refined as operational data confirms or flags deviations per height interval.

## 18. Acceptance Criteria
1. Calibration endpoints exist and are callable through FMS APIs with `FMSResponse<T>` responses.
2. A bound tank can fetch and display manual calibration chart rows from the linked PTS probe.
3. A bound tank can fetch and display interval-volume chart rows including pass counts.
4. A bound tank can trigger automatic calibration generation and fetch the resulting automatic chart.
5. Chart snapshots and revisions are persisted in FMS and can be reopened later.
6. The UI shows calibration readiness, last sync, last generation result, and variance indicators.
7. Dispensed-versus-measured analysis produces persisted records tied to tanks and time periods.
8. Errors from offline devices or invalid operations are surfaced clearly to the user and logged.
9. Calibration data points are extracted from pump transactions and in-tank deliveries when stability criteria are met.
10. Height interval accumulation records track observation counts and volume-per-mm statistics per tank.
11. A user can trigger FMS learned chart generation and the resulting chart is persisted with `ChartType = "fms-learned"`.
12. The UI shows a coverage map indicating which height intervals have sufficient data and which are sparse.
13. A user can seed FMS learning from an existing PTS chart and the system refines it with operational data.
14. The comparison view shows deviation between FMS learned chart and PTS charts per height interval.
15. Calibration learning parameters are configurable through SystemConfiguration and the admin UI.

## 19. Risks
- PTS device busy states may make generation and chart updates slow or intermittent.
- Protocol pagination and record limits may complicate bulk chart sync if not handled carefully.
- UploadStatus processing is already large; adding heavy analysis there would increase maintenance risk.
- If persisted history requires domain-model expansion, implementation may need an approval checkpoint.
- FMS learned calibration accuracy depends on data quality — noisy probe readings, inaccurate pump meters, or unrecorded dispensing events will degrade chart quality.
- Tanks with low throughput may take a long time to accumulate enough data points across all height intervals.
- Height intervals near tank empty or tank full may have sparse coverage because normal operations rarely reach those extremes.
- New persistence entities for calibration data points and interval accumulation require Domain model expansion — requires explicit review.

## 20. Recommendation for Delivery
Deliver in phases:
1. device command and API surface,
2. persistence and analytics,
3. tank UI integration,
4. operational hardening and test coverage,
5. **FMS learned calibration engine** — data point extraction, interval accumulation, chart generation, seeding, and comparison,
6. **FMS learned calibration UI** — coverage map, chart generation trigger, comparison overlay, seed import,
7. **configuration and hardening** — SystemConfiguration keys, admin UI integration, background event triggers.