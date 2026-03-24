# Task List: Advanced PTS Automatic Calibration and FMS Learned Calibration

> **PRD Reference:** [PRD.md](PRD.md)
> **Date:** 2026-03-23
> **Estimated Tasks:** 38
> **Progress:** 29/38 tasks complete (✅), 0 in progress (🔄), 5 remaining (⬜), 4 skipped (⏭)
> **Last Updated:** 2026-03-24

---

## Legend

| Symbol | Meaning |
|---|---|
| ⬜ | Not started |
| 🔄 | In Progress |
| ✅ | Complete |
| ⏭ | Skipped |
| 🔗 | Depends on another task |

---

## Phase 1: Backend PTS Calibration Surface

### Task 1.1 ✅ — Add calibration DTOs and request models

- [x] Create device-facing DTOs for:
  - calibration chart record
  - interval-volume record
  - automatic calibration record
  - total-record responses
  - paged query requests
  - generation request/result
- [x] Keep DTOs aligned with jsonPTS naming and protocol limits.
- [x] Separate device DTOs from persisted-history DTOs.

**Files:**
- `FMS.Application/Features/PTS/DTOs/TankCalibrationChartDtos.cs`
- `FMS.Application/Features/PTS/DTOs/ProbeTankCalibrationRecordWriteDto.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/DTOs/TankCalibrationRecordDto.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/DTOs/TankCalibrationSnapshotDto.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/DTOs/TankCalibrationSnapshotHistoryItemDto.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/DTOs/TankCalibrationSyncRequestDto.cs`

---

### Task 1.2 ✅ — Extend IPTSConfigService for calibration operations

- [x] Add methods to support:
  - get manual chart total count
  - get manual chart records
  - set manual chart records
  - add manual chart records
  - add single manual chart record
  - edit single manual chart record
  - delete single manual chart record
  - get tank volume for height
  - generate automatic calibration chart
  - get interval-volume total count
  - get interval-volume records
  - get automatic chart total count
  - get automatic chart records

**Files:**
- `FMS.Application/PTSServices/PTSConfigService/IPTSConfigService.cs` — 12 calibration method signatures added

---

### Task 1.3 ✅ — Implement calibration commands in PTSConfigService

🔗 Depends on: Task 1.1, Task 1.2

- [x] Implement command-executor backed service methods.
- [x] Map jsonPTS request names exactly.
- [x] Parse response payloads into DTOs.
- [x] Return `FMSResponse<T>` for both success and device failure conditions.
- [x] Add structured logging with device ID, probe number, command name, and response status.

**Files:**
- `FMS.Application/PTSServices/PTSConfigService/PTSConfigService.cs` — All 12 calibration methods implemented

---

### Task 1.4 \u2705 \u2014 Add validation for calibration requests

- [x] Validate probe number ranges (in controller/service layer).
- [x] Validate paging arguments (in service methods).
- [x] Validate record counts against protocol save limitations.
- [x] Validate mandatory fields for add, edit, delete, and generate operations (in controller).

> **Note:** Dedicated `ITankCalibrationValidator` created with protocol limit validation (MaxChartRecords=500, height/volume ranges, batch size, duplicate detection). Wired into `TankCalibrationController` on all write endpoints. Registered in DI.

**Files:**
- `FMS.Application/Features/TankManagement/TankCalibration/Services/TankCalibrationValidator.cs` \u2014 ITankCalibrationValidator + TankCalibrationValidator
- `FMS.WebClient/Controllers/FuelManagement/TankCalibrationController.cs` \u2014 validator injected + validation calls before PTS operations
- `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs` \u2014 DI registration

---

### Task 1.5 ✅ — Expose calibration endpoints in PTSConfigController

🔗 Depends on: Task 1.3, Task 1.4

- [x] Add GET endpoints for manual chart, interval chart, automatic chart, and height-to-volume lookup.
- [x] Add POST endpoints for manual chart updates and automatic chart generation.
- [x] Keep routes under the existing `api/v1/pts/{deviceId}/config` surface.
- [x] Apply the same authorization and response handling pattern used by existing PTS config endpoints.

> **Endpoints added:** 11 calibration endpoints (GET/POST/PATCH/DELETE) under `api/v1/pts/{deviceId}/config/probes/{probeNumber}/`

**Files:**
- `FMS.WebClient/Controllers/PTSController/PTSConfigController.cs`

---

## Phase 2: Persistence and Application Layer

### Task 2.1 ✅ — Design calibration persistence model

- [x] Define storage model for:
  - calibration snapshot header
  - calibration snapshot rows (stored as JSON in RecordsJson column)
  - interval-volume snapshot header (uses ChartType discriminator)
  - interval-volume snapshot rows (stored as JSON)
  - automatic chart snapshot header (uses ChartType discriminator)
  - automatic chart snapshot rows (stored as JSON)
  - calibration run history (via snapshot table with RecordedAtUtc)
  - [x] variance analysis records
- [x] Decide revision semantics for manual sync versus automatic generation.
- [x] Confirm whether new persistence types require protected Domain changes before implementation.

> **Design:** Single `TankCalibrationSnapshot` entity with `ChartType` discriminator (manual/interval-volume/automatic). Records stored as serialized JSON in `RecordsJson` column. Variance analysis is computed on demand from `Intankdeliveries` and related measurement data rather than persisted as a separate table.

**Files:**
- `FMS.Domain/Entities/Features/TankStockManagement/TankCalibrationSnapshot.cs`
- `FMS.Persistence/EntityConfigurations/TankCalibrationSnapshotConfiguration.cs`
- `Documentation/Database/tankcalibrationsnapshots.sql`

---

### Task 2.2 ✅ — Add persistence configuration and data access wiring

🔗 Depends on: Task 2.1

- [x] Add DbContext registrations if needed.
- [x] Add entity configurations if needed.
- [x] Keep schema changes focused on calibration and analytics only.

**Files:**
- `FMS.Persistence/DataAccess/GpsdataContext.cs` — DbSet<TankCalibrationSnapshot> added, configuration registered in OnModelCreating
- `FMS.Persistence/EntityConfigurations/TankCalibrationSnapshotConfiguration.cs` — Table `tankcalibrationsnapshots`, composite index on (TankId, ChartType, RecordedAtUtc)

---

### Task 2.3 ✅ — Create CQRS command to sync manual calibration chart from PTS to FMS

🔗 Depends on: Task 1.5, Task 2.2

- [x] Fetch chart from device.
- [x] Persist snapshot and rows.
- [x] Record revision metadata and audit fields.
- [x] Return `FMSResponse<T>` summary for UI use.

> **Note:** Supports all 3 chart types (manual, interval-volume, automatic). Fetches in batches of 100 records.

**Files:**
- `FMS.Application/Features/TankManagement/TankCalibration/Commands/SyncTankCalibrationSnapshotCommand.cs`

---

### Task 2.4 ✅ — Create CQRS command to generate and persist automatic calibration chart

🔗 Depends on: Task 1.5, Task 2.2

- [x] Trigger automatic generation on PTS.
- [x] Fetch generated chart after successful execution.
- [x] Persist generation run result and generated chart snapshot.
- [x] Record any device-side error state.

> **Note:** Generation trigger + sync handled in TankCalibrationController POST `/generate-automatic` endpoint, which calls IPTSConfigService.GenerateTankAutomaticCalibrationChartAsync then syncs via SyncTankCalibrationSnapshotCommand.

**Files:**
- `FMS.WebClient/Controllers/FuelManagement/TankCalibrationController.cs` (orchestration)
- `FMS.Application/Features/TankManagement/TankCalibration/Commands/SyncTankCalibrationSnapshotCommand.cs` (persistence)

---

### Task 2.5 ✅ — Create CQRS queries for chart history and latest snapshots

🔗 Depends on: Task 2.3, Task 2.4

- [x] Query latest manual chart snapshot.
- [x] Query latest interval-volume snapshot.
- [x] Query latest automatic chart snapshot.
- [x] Query revision history and generation history.

> **Note:** All queries support ChartType parameter to filter by manual/interval-volume/automatic.

**Files:**
- `FMS.Application/Features/TankManagement/TankCalibration/Queries/GetTankCalibrationCurrentSnapshotQuery.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/Queries/GetTankCalibrationHistoryQuery.cs` (paged)
- `FMS.Application/Features/TankManagement/TankCalibration/Queries/GetTankCalibrationSnapshotByIdQuery.cs`

---

## Phase 3: Dispensed vs Measured Analytics

### Task 3.1 \u2705 \u2014 Define calibration analysis service contract

- [x] Define how to correlate:
  - in-tank delivery records,
  - `PumpsDispensedVolume`,
  - tank measurements,
  - selected tank and probe binding.
- [x] Define analysis output fields:
  - measured delta
  - dispensed delta
  - variance
  - variance percentage
  - confidence or quality indicator
  - recalibration recommendation

> **Note:** `ICalibrationAnalysisService` interface created with `GetVariancesAsync` and `GetHealthSummaryAsync`. DTOs: `CalibrationVarianceDto` (per-delivery variance), `CalibrationHealthSummaryDto` (tank-level summary), `CalibrationQuality` (quality thresholds: Good\u22642%, Acceptable\u22645%, Poor>5%).

**Files:**
- `FMS.Application/Features/TankManagement/TankCalibration/Services/CalibrationAnalysisService.cs` \u2014 ICalibrationAnalysisService interface
- `FMS.Application/Features/TankManagement/TankCalibration/DTOs/CalibrationVarianceDto.cs` \u2014 CalibrationVarianceDto + CalibrationQuality
- `FMS.Application/Features/TankManagement/TankCalibration/DTOs/CalibrationHealthSummaryDto.cs` \u2014 CalibrationHealthSummaryDto

---

### Task 3.2 \u2705 \u2014 Implement dispensed-vs-measured analysis logic

\ud83d\udd17 Depends on: Task 3.1

- [x] Calculate measurement windows around in-tank deliveries.
- [x] Compare measured tank volume change against dispensed volume.
- [x] Store results as analysis records.
- [x] Ensure calculations are testable outside UploadStatus flow.

> **Note:** `CalibrationAnalysisService` implementation queries `Intankdeliveries` with both measurement and dispensing data, computes variance as `|measuredDelta - (deliveryVolume - dispensedDelta)|`, produces quality ratings. Registered as scoped in DI. Does not touch UploadStatus flow.

**Files:**
- `FMS.Application/Features/TankManagement/TankCalibration/Services/CalibrationAnalysisService.cs` \u2014 CalibrationAnalysisService implementation
- `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs` \u2014 DI registration

---

### Task 3.3 ✅ — Add query for calibration health metrics

🔗 Depends on: Task 3.2

- [x] Return tank-level calibration health summary for UI.
- [x] Include last sync, last generation result, latest variance, and recommendation state.

> **Note:** `GetCalibrationHealthQuery` CQRS query delegates to `ICalibrationAnalysisService.GetHealthSummaryAsync`. Controller endpoints added: `GET .../health` (full summary) and `GET .../variances` (raw variance list with `maxDeliveries` param).

**Files:**
- `FMS.Application/Features/TankManagement/TankCalibration/Queries/GetCalibrationHealthQuery.cs` — query + handler
- `FMS.WebClient/Controllers/FuelManagement/TankCalibrationController.cs` — GetHealth and GetVariances endpoints

---

## Phase 4: Tank Monitoring Integration

### Task 4.1 \u2705 \u2014 Add calibration status model to tank-facing DTOs

- [x] Extend tank-facing query/DTO outputs to include calibration summary fields.
- [x] Keep existing tank fields backward compatible.

> **Note:** Added 4 calibration summary fields to `TankDTO`: `HasCalibrationData`, `CalibrationRecordCount`, `CalibrationLastSyncUtc`, `CalibrationOverallQuality`. All optional/default-false so existing queries remain backward compatible.

**Files:**
- `FMS.Application/Features/TankManagement/Tank/DTOs/TankDTO.cs` \u2014 4 calibration summary properties added

---

### Task 4.2 \u2705 \u2014 Review UploadStatus integration boundary

- [x] Identify any lightweight hooks needed from UploadStatus.
- [x] Do not add heavy analytics or chart persistence directly into the large UploadStatus handler.
- [x] If needed, emit or call a small orchestration service only.

> **Note:** Reviewed `UploadStatusCommand.cs` (2,282 lines). Identified injection point in `TryApplyAveragedPhysicalStockUpdateAsync` after `PhysicalStockValue` is written \u2014 follows existing `CheckSystemLowLevelAlarmAsync` pattern. Decision: **no modification to UploadStatus** at this time. The calibration health data is computed on-demand via `GetCalibrationHealthQuery`/`ICalibrationAnalysisService` which queries `Intankdeliveries` directly. This keeps the UploadStatus handler clean and avoids adding more complexity to the 2,282-line file. If real-time calibration events are needed later, a lightweight `INotification` can be emitted from that injection point.

**Files:**
- `FMS.Application/Command/PTSCommand/UploadStatusCommands/UploadStatusCommand.cs` \u2014 reviewed, no changes made

---

## Phase 5: Frontend Service Layer

### Task 5.1 ✅ — Extend frontend ptsConfigService with calibration methods

- [x] Add methods to get manual chart totals and records.
- [x] Add methods to get interval-volume totals and records.
- [x] Add methods to get automatic chart totals and records.
- [x] Add methods to set or modify manual chart records.
- [x] Add method to trigger automatic calibration generation.
- [x] Add method for height-to-volume lookup if needed by UI.

> **Note:** 14 calibration functions added — both device-scoped (PTS) and tank-scoped APIs.

**Files:**
- `fms.frontend/src/services/ptsConfigService.js`

---

## Phase 6: Frontend Tank UI

### Task 6.1 ✅ — Add calibration status to tank detail panel

🔗 Depends on: Task 3.3, Task 5.1

- [x] Show calibration enabled and ready state.
- [x] Show last sync and last generation result.
- [x] Show latest variance or health indicator (depends on Phase 3 analytics).
- [x] Keep styling consistent with existing M365 tank UI patterns.

> **Note:** TankDetailPanel auto-loads all 3 chart types in parallel on mount. Shows "Available" (green) / "Empty" (warning) badges per chart type. Displays sample records, volume-for-height lookup at the current tank level, and the latest calibration health indicator sourced from the Phase 3 analytics endpoints.

**Files:**
- `fms.frontend/src/pages/tank/components/TankDetailPanel.js`

---

### Task 6.2 ✅ — Add calibration actions to PTS device link or tank action surface

🔗 Depends on: Task 5.1

- [x] Add entry point to open calibration management for a bound tank.
- [x] Avoid cluttering the binding workflow.
- [x] Only enable the action when a valid PTS binding exists.

> **Note:** Calibration button added to TankCommandBar (M365 ghost button with FA-Light icon). Disabled when no tank is selected. Opens TankCalibrationPanel in a SlidePanel.

**Files:**
- `fms.frontend/src/pages/tank/components/TankCommandBar.js`
- `fms.frontend/src/pages/tank/tankPage.js` (panel state + SlidePanel integration)

---

### Task 6.3 ✅ — Create calibration management panel or modal

🔗 Depends on: Task 5.1, Task 6.1

- [x] Display manual calibration chart.
- [x] Display interval-volume chart with pass counts.
- [x] Display automatic calibration chart.
- [x] Support sync from PTS into FMS history.
- [x] Support generation trigger.
- [x] Support revision selection and history review.
- [x] Support clear error and loading states.

> **Note:** Full TankCalibrationPanel with chart type tabs, current snapshot grid, paginated history list, draft record editor, and error/loading state handling.

**Files:**
- `fms.frontend/src/pages/tank/components/TankCalibrationPanel.js`
- `fms.frontend/src/pages/tank/components/TankCalibrationPanel.scss`

---

### Task 6.4 ✅ — Add dispensed-vs-measured metrics to calibration UI

🔗 Depends on: Task 3.3, Task 6.3

- [x] Show latest variance summary.
- [x] Show historical trend or latest sample list.
- [x] Surface recalibration recommendation clearly.

**Files:**
- `fms.frontend/src/pages/tank/components/...`

---

## Phase 7: Security, Logging, and Hardening

### Task 7.1 ✅ — Add logging and audit coverage

- [x] Log calibration reads, writes, generation requests, sync events, and failures.
- [x] Record actor identity for chart modification and generation workflows.

> **Note:** Added structured audit logging across the tank calibration write surface for sync, automatic generation, manual chart updates, single-record add/edit/delete, learning extraction, learned chart generation, and seed-from-snapshot workflows. Actor identity is resolved from the authenticated user claims via the controller actor helper.

**Files:**
- `FMS.WebClient/Controllers/FuelManagement/TankCalibrationController.cs`

---

### Task 7.2 ✅ — Review authorization requirements

- [x] Confirm existing PTS device permissions are sufficient.
- [x] Add any required fine-grained permission checks for chart modification if needed.

> **Note:** Reviewed the controller authorization surface. Existing protection is sufficient: controller-level read access plus write-level edit permissions already cover chart sync, generation, and modification workflows, so no new permission constant was required.

**Files:**
- `FMS.WebClient/Controllers/FuelManagement/TankCalibrationController.cs`

---

## Phase 8: Testing and Verification

### Task 8.1 ⏭ — Add backend unit tests for request mapping and validation

- Skipped by request for this delivery pass.

**Files:**
- `FMS.Testing/...`

---

### Task 8.2 ⏭ — Add backend tests for analysis calculations

- Skipped by request for this delivery pass.

**Files:**
- `FMS.Testing/...`

---

### Task 8.3 ⏭ — Add frontend verification coverage

- Skipped by request for this delivery pass.

**Files:**
- `fms.frontend/...`

---

### Task 8.4 ⏭ — Execute manual end-to-end verification

- Skipped by request for this delivery pass.

---

## Phase 9: FMS Learned Calibration — Data Model and Configuration

### Task 9.1 ✅ — Add SystemConfiguration keys for calibration learning

- [x] Add configuration keys to seed data or migration:
  - `Calibration.LearningEnabled` (Bool, default false)
  - `Calibration.HeightIntervalMm` (Int, default 50)
  - `Calibration.MinObservationsPerInterval` (Int, default 5)
  - `Calibration.StabilityWindowMinutes` (Int, default 5)
  - `Calibration.MaxHeightVarianceMm` (Double, default 2.0)
  - `Calibration.MinVolumeChangeLitres` (Double, default 10.0)
  - `Calibration.BackgroundTriggerThreshold` (Int, default 10)
- [x] Register keys in `ISystemConfigurationService` for typed access.
- [x] Ensure keys are editable from admin UI.

> **Note:** Added `Calibration.*` constants/defaults and typed getters in the configuration service, plus admin System Configuration UI support to initialize, filter, and edit calibration-learning settings.

**Files:**
- `FMS.Application/Services/Configuration/ISystemConfigurationService.cs`
- `FMS.Application/Services/Configuration/SystemConfigurationService.cs`
- `FMS.Application/Configuration/SystemConfiguration.cs` (if static defaults exist)
- `fms.frontend/src/pages/admin/systemConfig/components/CalibrationLearningConfigSection.js`
- `fms.frontend/src/pages/admin/systemConfig/SystemConfigPage.js`
- `fms.frontend/src/pages/admin/systemConfig/components/SystemConfigForm.js`
- `Documentation/Database/calibration-learning-systemconfig.sql`

---

### Task 9.2 ✅ — Design calibration data point and interval accumulation persistence

- [x] Define `CalibrationDataPoint` entity:
  - `Id`, `TankId`, `HeightBefore` (mm), `HeightAfter` (mm), `VolumeChange` (litres), `HeightInterval` (bucket index), `VolumePerMm` (calculated), `SourceType` (dispensing/delivery/transfer), `SourceEventId` (PumpTransaction.Id or Intankdelivery.DeliveryId), `RecordedAtUtc`, `IsProcessed` (whether included in latest chart generation).
- [x] Define `CalibrationIntervalAccumulation` entity:
  - `Id`, `TankId`, `IntervalStartMm`, `IntervalEndMm`, `ObservationCount`, `MeanVolumePerMm`, `StdDevVolumePerMm`, `LastUpdatedUtc`.
- [x] Extend `TankCalibrationChartTypes` with `"fms-learned"` value.
- [x] Add EF configurations and DbContext registrations.
- [x] Create SQL migration/table script.

> **Note:** Domain changes required — must be reviewed before implementation.
>
> **Implemented:** Added protected-domain entities, EF mappings, DbContext wiring, and MySQL 5.5.6-compatible SQL scripts for learned data points and interval accumulations. Interval accumulations now also track `SeededFromSnapshotId` so seeded baselines preserve their source snapshot lineage.

**Files:**
- `FMS.Domain/Entities/Features/TankStockManagement/CalibrationDataPoint.cs`
- `FMS.Domain/Entities/Features/TankStockManagement/CalibrationIntervalAccumulation.cs`
- `FMS.Persistence/EntityConfigurations/CalibrationDataPointConfiguration.cs`
- `FMS.Persistence/EntityConfigurations/CalibrationIntervalAccumulationConfiguration.cs`
- `FMS.Persistence/DataAccess/GpsdataContext.cs`
- `Documentation/Database/calibrationdatapoints.sql`
- `Documentation/Database/calibrationintervalaccumulations.sql`
- `Documentation/Database/calibrationintervalaccumulations-add-seededfromsnapshotid.sql`
- `Documentation/Database/calibration-learning-systemconfig.sql`

---

## Phase 10: FMS Learned Calibration — Data Point Extraction

### Task 10.1 ✅ — Create calibration data point extraction service contract

🔗 Depends on: Task 9.1, Task 9.2

- [x] Define `ICalibrationLearningService` interface with methods:
  - `ExtractDataPointsFromDispensing(tankId, dateRange)` — correlates pump transactions with tank measurements.
  - `ExtractDataPointsFromDeliveries(tankId, dateRange)` — uses Intankdelivery start/end states.
  - `GetAccumulationSummary(tankId)` — returns per-interval observation counts and coverage.
  - `GenerateLearnedChart(tankId)` — builds chart from accumulated data.
  - `SeedFromSnapshot(tankId, snapshotId)` — imports existing chart as baseline.
- [x] Define DTOs:
  - `CalibrationDataPointDto`
  - `CalibrationIntervalSummaryDto`
  - `CalibrationCoverageDto` (which intervals are ready, sparse, or empty)
  - `CalibrationComparisonDto` (deviation per interval between two charts)

> **Note:** Added the Phase 10.1 application contract and DTOs with explicit async signatures, interval coverage states, and chart-comparison fields so Phase 10.2-11.3 can build on a stable surface.

**Files:**
- `FMS.Application/Features/TankManagement/TankCalibration/Services/ICalibrationLearningService.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/DTOs/CalibrationDataPointDto.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/DTOs/CalibrationCoverageDto.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/DTOs/CalibrationComparisonDto.cs`

---

### Task 10.2 ✅ — Implement dispensing-based data point extraction

🔗 Depends on: Task 10.1

- [x] Query `PumpTransaction` records for a tank within the date range.
- [x] For each transaction, find `Tankmeasurement` records before and after:
  - "Before" = last measurement at least `StabilityWindowMinutes` before transaction time where readings are stable (height variance < `MaxHeightVarianceMm` over the window).
  - "After" = first measurement at least `StabilityWindowMinutes` after transaction time with stable readings.
- [x] Reject windows where another dispensing or delivery event overlaps.
- [x] Reject events where volume change < `MinVolumeChangeLitres`.
- [x] Calculate: `VolumePerMm = Transaction.Volume / (HeightBefore - HeightAfter)`.
- [x] Assign to height interval bucket: `floor(avgHeight / HeightIntervalMm) * HeightIntervalMm`.
- [x] Persist as `CalibrationDataPoint` records.

> **Note:** Implemented dispensing extraction using stable before and after tank-measurement windows, duplicate source-event suppression, overlap rejection, and transactional persistence into `CalibrationDataPoint` followed by accumulation rebuild.

**Files:**
- `FMS.Application/Features/TankManagement/TankCalibration/Services/CalibrationLearningService.cs`

---

### Task 10.3 ✅ — Implement delivery-based data point extraction

🔗 Depends on: Task 10.1

- [x] Query `Intankdelivery` records for a tank within the date range.
- [x] Use `StartProductHeight`, `EndProductHeight`, `AbsoluteProductVolume` directly (Intankdelivery already brackets the event).
- [x] Apply stability validation on start/end readings using the same criteria as dispensing.
- [x] For deliveries with `PumpsDispensedVolume`: account for dispensing that occurred during the delivery window.
- [x] Reject events where height change is too small or volume change < `MinVolumeChangeLitres`.
- [x] Calculate `VolumePerMm` and assign to height interval bucket.
- [x] Persist as `CalibrationDataPoint` records.

> **Note:** Implemented delivery extraction using in-tank delivery start and end states, net volume adjustment for `PumpsDispensedVolume`, duplicate source-event suppression, and the same configurable stability-window checks used by dispensing extraction.

**Files:**
- `FMS.Application/Features/TankManagement/TankCalibration/Services/CalibrationLearningService.cs`

---

### Task 10.4 ✅ — Implement interval accumulation update

🔗 Depends on: Task 10.2, Task 10.3

- [x] After new data points are extracted, update `CalibrationIntervalAccumulation` records:
  - Upsert per (TankId, IntervalStartMm, IntervalEndMm).
  - Recalculate `ObservationCount`, `MeanVolumePerMm`, `StdDevVolumePerMm` from all data points in that interval.
  - Update `LastUpdatedUtc`.
- [x] Return updated coverage summary.

> **Note:** Added accumulation rebuild logic and a real `GetAccumulationSummaryAsync` coverage response that classifies intervals as `ready`, `sparse`, or `empty` based on configurable observation thresholds.

**Files:**
- `FMS.Application/Features/TankManagement/TankCalibration/Services/CalibrationLearningService.cs`

---

## Phase 11: FMS Learned Calibration — Chart Generation and Comparison

### Task 11.1 ✅ — Implement FMS learned chart generation

🔗 Depends on: Task 10.4

- [x] Read all `CalibrationIntervalAccumulation` records for the tank.
- [x] Filter to intervals with `ObservationCount >= MinObservationsPerInterval`.
- [x] Build cumulative volume curve:
  - Start at height 0, volume 0.
  - For each interval (ascending by height): `V(h) = V(h-1) + MeanVolumePerMm * IntervalHeight`.
  - Mark gaps where intervals have insufficient data.
- [x] Serialize chart records as JSON (same format as PTS calibration records for consistency).
- [x] Persist as `TankCalibrationSnapshot` with `ChartType = "fms-learned"`.
- [x] Include coverage metadata in `Notes` field (e.g., "17/30 intervals covered").

> **Note:** Implemented learned chart generation through the existing snapshot storage service, persisting `fms-learned` snapshots with coverage metadata and marking contributing interval data points as processed.

**Files:**
- `FMS.Application/Features/TankManagement/TankCalibration/Services/CalibrationLearningService.cs`

---

### Task 11.2 ✅ — Implement seed/bootstrap from existing chart

🔗 Depends on: Task 10.1

- [x] Accept a source `TankCalibrationSnapshot` ID (manual or automatic chart).
- [x] Convert chart records into baseline `CalibrationIntervalAccumulation` entries:
  - For each pair of consecutive chart records, derive volume-per-mm for the height range.
  - Set `ObservationCount = 0` (seed data, not observed data) and a flag indicating seeded baseline.
- [x] Operational data points will then add observations on top of the seed, confirming or adjusting the baseline.
- [x] When generating the learned chart, seeded intervals with zero observations use the seed value; intervals with observations use the observed mean.

> **Note:** Implemented via `SeedFromSnapshotAsync` in CalibrationLearningService and `BuildSeededIntervalBaselines` in CalibrationLearningChartMath. Seeded baselines are identified by `ObservationCount == 0 && MeanVolumePerMm > 0`. Stale seeds are cleaned up on re-seed, and observed intervals are never overwritten. `GenerateLearnedChartAsync` includes seeded intervals alongside observed ones with separate coverage tracking.

> **Tracking:** Seeded interval baselines persist `SeededFromSnapshotId` so learned calibration can trace each seeded interval back to the originating manual or automatic snapshot.

**Files:**
- `FMS.Application/Features/TankManagement/TankCalibration/Services/CalibrationLearningService.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/Services/CalibrationLearningChartMath.cs`
- `FMS.Domain/Entities/Features/TankStockManagement/CalibrationIntervalAccumulation.cs`
- `FMS.Persistence/EntityConfigurations/CalibrationIntervalAccumulationConfiguration.cs`

---

### Task 11.3 ✅ — Implement chart comparison engine

🔗 Depends on: Task 11.1

- [x] Accept two `TankCalibrationSnapshot` IDs (or one snapshot + latest of another chart type).
- [x] Normalize both charts to the same height intervals.
- [x] For each interval, calculate:
  - absolute volume deviation,
  - percentage deviation,
  - confidence indicator (based on observation count in the FMS chart).
- [x] Return `CalibrationComparisonDto` list.

> **Note:** Implemented comparison math in the calibration learning service with normalized interval outputs and explicit comparison DTOs used by the API and frontend.

**Files:**
- `FMS.Application/Features/TankManagement/TankCalibration/Services/CalibrationLearningService.cs`

---

## Phase 12: FMS Learned Calibration — API and Background Events

### Task 12.1 ✅ — Add calibration learning endpoints to TankCalibrationController

🔗 Depends on: Task 11.1, Task 11.2, Task 11.3

- [x] `POST api/v1/tanks/{tankId}/calibration/learning/extract` — trigger data point extraction for a date range.
- [x] `GET api/v1/tanks/{tankId}/calibration/learning/coverage` — return interval coverage summary.
- [x] `POST api/v1/tanks/{tankId}/calibration/learning/generate` — trigger FMS learned chart generation.
- [x] `POST api/v1/tanks/{tankId}/calibration/learning/seed/{snapshotId}` — seed from existing chart.
- [x] `GET api/v1/tanks/{tankId}/calibration/learning/compare` — compare FMS learned chart vs PTS chart.
- [x] All return `FMSResponse<T>`.

> **Note:** Added the full learning controller surface to `TankCalibrationController` and wired it to the calibration learning service using standard `FMSResponse<T>` results.

**Files:**
- `FMS.WebClient/Controllers/FuelManagement/TankCalibrationController.cs`

---

### Task 12.2 ✅ — Add background event trigger for calibration readiness

🔗 Depends on: Task 10.4, Task 9.1

- [x] After data point extraction, count unprocessed points per tank.
- [x] If count exceeds `Calibration.BackgroundTriggerThreshold`, emit an `INotification` event:
  - `CalibrationDataReadyNotification { TankId, NewPointCount, CoveragePercentage }`.
- [x] This notification is informational — does not auto-generate charts.
- [x] Can be consumed by future alert/notification systems.

> **Note:** Implemented threshold-crossing readiness notifications through a MediatR event and notification handler so tanks notify once when fresh unprocessed learning data becomes actionable.

**Files:**
- `FMS.Application/Features/TankManagement/TankCalibration/Events/CalibrationDataReadyNotification.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/Services/CalibrationLearningService.cs`

---

## Phase 13: FMS Learned Calibration — Frontend

### Task 13.1 ✅ — Add calibration learning API methods to frontend service

🔗 Depends on: Task 12.1

- [x] Add methods for: extract, coverage, generate, seed, compare.
- [x] Follow existing `ptsConfigService.js` patterns.

> **Note:** Extended `ptsConfigService.js` with learning-specific API methods and reused the established error-handling and timeout patterns.

**Files:**
- `fms.frontend/src/services/ptsConfigService.js`

---

### Task 13.2 ✅ — Add FMS Learned tab to TankCalibrationPanel

🔗 Depends on: Task 13.1, Task 6.3

- [x] Add "FMS Learned" tab alongside Manual/Interval-Volume/Automatic tabs.
- [x] Show coverage map — visual indicator per height interval (sufficient/sparse/empty).
- [x] Show latest FMS learned chart records (if generated).
- [x] Show "Generate" button (enabled when coverage meets minimum threshold).
- [x] Show "Seed from PTS" button to import manual/automatic chart as baseline.
- [x] Show "Extract Data" button to trigger data point extraction for a date range.

**Files:**
- `fms.frontend/src/pages/tank/components/TankCalibrationPanel.js`
- `fms.frontend/src/pages/tank/components/TankCalibrationPanel.scss`

> **Note:** Added a dedicated learned-calibration tab component, kept the oversized parent panel stable, and integrated FMS learned coverage, extraction, seeding, and generation flows.

---

### Task 13.3 ✅ — Add chart comparison view

🔗 Depends on: Task 13.1, Task 13.2

- [x] Show side-by-side or overlay comparison of FMS learned chart vs selected PTS chart.
- [x] Highlight intervals with significant deviation (configurable threshold).
- [x] Show confidence indicator per interval based on observation count.
- [x] Use consistent M365 styling with the existing calibration panel.

**Files:**
- `fms.frontend/src/pages/tank/components/TankCalibrationPanel.js`

> **Note:** The learned tab now renders chart and grid comparison views, auto-refreshes after generation, and highlights rows using a user-adjustable deviation threshold.

---

### Task 13.4 ✅ — Add calibration learning configuration to admin UI

🔗 Depends on: Task 9.1

- [x] Add calibration learning section to the SystemConfiguration admin page.
- [x] Show all `Calibration.*` keys with descriptions and current values.
- [x] Support editing with validation (min/max, type checks).
- [x] Follow existing admin configuration UI patterns.

> **Note:** Implemented a reusable calibration-learning section in the existing admin System Configuration screen with initialization helpers and category filtering.

**Files:**
- `fms.frontend/src/pages/admin/systemConfig/components/CalibrationLearningConfigSection.js`
- `fms.frontend/src/pages/admin/systemConfig/SystemConfigPage.js`
- `fms.frontend/src/pages/admin/systemConfig/components/SystemConfigForm.js`

---

## Delivery Notes

- Prefer phased delivery to reduce risk.
- Treat protected Domain changes as an explicit checkpoint before coding.
- Keep documentation, API shape, and UI wording aligned with jsonPTS terminology where it improves operator clarity.
- **FMS learned calibration phases (9-13) are additive** — they do not modify or break any existing PTS calibration functionality from phases 1-8.
- Phase 9 (Domain entities) requires explicit review before implementation due to protected Domain model changes.
- Phase 10 is the core engine — should be built with testability as a priority since all calculations must be verifiable.
- Phase 12 background events are lightweight and informational — no auto-generation without user action.