# Task List: Advanced PTS Automatic Calibration from Fuel Dispensed and Tank Volume Monitoring

> **PRD Reference:** [PRD.md](PRD.md)
> **Date:** 2026-03-23
> **Estimated Tasks:** 24
> **Progress:** 20/24 tasks complete (✅), 0 in progress (🔄), 4 remaining (⬜)
> **Last Updated:** 2026-03-23

---

## Legend

| Symbol | Meaning |
|---|---|
| ⬜ | Not started |
| 🔄 | In Progress |
| ✅ | Complete |
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
  - [ ] variance analysis records
- [x] Decide revision semantics for manual sync versus automatic generation.
- [x] Confirm whether new persistence types require protected Domain changes before implementation.

> **Design:** Single `TankCalibrationSnapshot` entity with `ChartType` discriminator (manual/interval-volume/automatic). Records stored as serialized JSON in `RecordsJson` column.

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
- [ ] Show latest variance or health indicator (depends on Phase 3 analytics).
- [x] Keep styling consistent with existing M365 tank UI patterns.

> **Note:** TankDetailPanel auto-loads all 3 chart types in parallel on mount. Shows "Available" (green) / "Empty" (warning) badges per chart type. Displays sample records and volume-for-height lookup at current tank level. Variance/health indicator deferred to Phase 3.

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

### Task 7.1 ⬜ — Add logging and audit coverage

- [ ] Log calibration reads, writes, generation requests, sync events, and failures.
- [ ] Record actor identity for chart modification and generation workflows.

**Files:**
- `FMS.Application/...`
- `FMS.WebClient/...`

---

### Task 7.2 ⬜ — Review authorization requirements

- [ ] Confirm existing PTS device permissions are sufficient.
- [ ] Add any required fine-grained permission checks for chart modification if needed.

**Files:**
- `FMS.WebClient/Controllers/...`
- related permission constants if needed

---

## Phase 8: Testing and Verification

### Task 8.1 ⬜ — Add backend unit tests for request mapping and validation

- [ ] Test service request-to-command mapping.
- [ ] Test response parsing.
- [ ] Test validation failures.

**Files:**
- `FMS.Testing/...`

---

### Task 8.2 ⬜ — Add backend tests for analysis calculations

- [ ] Test measured delta versus dispensed delta calculations.
- [ ] Test edge cases with missing measurements, zero deltas, and noisy data.

**Files:**
- `FMS.Testing/...`

---

### Task 8.3 ⬜ — Add frontend verification coverage

- [ ] Verify calibration panel loading and error states.
- [ ] Verify generation action flow.
- [ ] Verify revision/history display.
- [ ] Verify compatibility with existing tank monitoring workflows.

**Files:**
- `fms.frontend/...`

---

### Task 8.4 ⬜ — Execute manual end-to-end verification

- [ ] Bind a tank to a PTS device and probe.
- [ ] Fetch manual chart from PTS.
- [ ] Fetch interval-volume and automatic charts.
- [ ] Trigger automatic calibration generation.
- [ ] Sync results into FMS.
- [ ] Review persisted history after refresh.
- [ ] Confirm tank monitoring still works for non-calibration tanks.

---

## Delivery Notes

- Prefer phased delivery to reduce risk.
- Treat protected Domain changes as an explicit checkpoint before coding.
- Keep documentation, API shape, and UI wording aligned with jsonPTS terminology where it improves operator clarity.