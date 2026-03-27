# Calibration Implementation Details

## Feature
Advanced PTS Automatic Calibration and FMS Learned Calibration

## Version
V1

## Document Type
Implementation Detail

## Date
2026-03-27

## 1. Purpose
This document explains the current calibration implementation in FMS at an operational and technical level. It complements the existing PRD and task list by describing how calibration data is retrieved, stored, selected, and used during live UploadStatus processing.

It also documents the recent tank-level controls that determine:
- which local calibration source should be preferred,
- whether UploadStatus or tank measurements own physical stock updates,
- whether stored UploadStatus `ProductVolume` should come from the probe or from FMS local calibration.

## 2. Scope of the Current Implementation
The current implementation covers five related areas:

1. PTS controller calibration access from FMS.
2. Local persistence of calibration snapshots and history.
3. FMS learned calibration generation from operational data.
4. UploadStatus runtime enrichment from height to volume.
5. Tank-level configuration that controls source selection and ownership.

This is not only a device-configuration feature. Calibration is now part of the live stock-processing path.

## 3. Core Concepts

### 3.1 Chart types
FMS currently works with four calibration chart types:

- `manual`
- `automatic`
- `interval-volume`
- `fms-learned`

These chart types are used consistently across API retrieval, persistence, UI preview, and runtime lookup.

### 3.2 Local snapshot model
Calibration data is persisted in FMS as `TankCalibrationSnapshot` records. Each snapshot stores:

- `TankId`
- `ProbeNumber` when available
- `ChartType`
- serialized chart rows in `RecordsJson`
- `RecordedAtUtc`
- sync and history metadata

This means FMS can continue to use and inspect calibration data even when the PTS controller is unavailable.

### 3.3 Runtime distinction between chart source and volume source
Two decisions must not be mixed up:

1. `CalibrationChartSource`
   This selects which local chart FMS should prefer when it performs height-to-volume conversion.

2. `ProductVolumeSource`
   This selects which value should be persisted as UploadStatus `ProductVolume` for the tank.

In practice:

- `CalibrationChartSource` answers: "Which local chart should FMS use if it needs a calibration lookup?"
- `ProductVolumeSource` answers: "Should the stored UploadStatus volume come from the probe or from FMS local calibration?"

### 3.4 Physical stock ownership is separate
`ProbePhysicalStockUpdateSource` controls who is allowed to write physical stock automatically.

It does not decide which `ProductVolume` value is stored in UploadStatus probe readings.

## 4. Main Backend Components

### 4.1 Device-facing PTS calibration surface
The PTS configuration API surface exposes operations to:

- read manual chart totals and records,
- write manual chart records,
- generate automatic charts,
- read interval-volume charts,
- read automatic charts,
- resolve volume by height from the controller.

Controller base route:
- `api/v1/pts/{deviceId}/config`

This layer is responsible for speaking jsonPTS protocol semantics and returning `FMSResponse<T>` results to the application and UI layers.

### 4.2 Local snapshot storage services
Snapshot persistence is handled through the tank calibration application layer. This layer:

- stores snapshot headers and row JSON,
- retrieves the latest snapshot by chart type,
- returns paged history,
- supports current-snapshot and history queries for the frontend.

### 4.3 Calibration learning services
FMS learned calibration uses operational data already present in the system:

- pump transactions,
- tank measurements,
- in-tank deliveries,
- quiet-window and stability rules.

The learning pipeline accumulates evidence by height interval and generates local `fms-learned` snapshots.

### 4.4 Runtime enrichment service
`ProbeReadingEnrichmentService` is the runtime component that affects live UploadStatus processing.

Its main responsibilities are:

- cadence filtering for probe reading persistence,
- retrieving the best local chart from Redis cache or database,
- rejecting unusable zero-only or malformed charts,
- converting probe height in millimetres to chart height in centimetres when appropriate,
- interpolating volume from the selected chart,
- resolving the final stored UploadStatus `ProductVolume` according to tank preference.

## 5. Tank-Level Configuration Fields

Three tank properties now control calibration and probe-processing behavior.

### 5.1 `ProbePhysicalStockUpdateSource`
Supported values:

- `upload-status`
- `tank-measurement`
- `null` for legacy/default behavior

Meaning:

- `upload-status` allows UploadStatus probe readings to participate in automatic physical stock updates.
- `tank-measurement` prevents UploadStatus from being the physical stock writer and leaves that responsibility to the tank measurement pipeline.

### 5.2 `CalibrationChartSource`
Supported values:

- `manual`
- `automatic`
- `interval-volume`
- `fms-learned`
- `null` or `auto`

Meaning:

- When a runtime height-to-volume lookup is needed, this property tells FMS which local chart to prefer first.
- If the preferred chart is unusable or missing, the runtime can fall back according to chart-priority rules.

### 5.3 `ProductVolumeSource`
Supported values:

- `pts`
- `fms-calibrated`
- `null` for legacy/default behavior

Meaning:

- `pts` means a usable probe-sent `ProductVolume` is the source of truth for stored UploadStatus volume.
- `fms-calibrated` means FMS local calibration is the source of truth whenever a usable local chart exists.
- `null` preserves the older behavior: use positive probe volume first, otherwise fall back to local calibration.

## 6. UploadStatus Runtime Flow

### 6.1 Processing sequence
The active deferred UploadStatus processing flow performs calibration-related logic in this order:

1. Read probe measurements from UploadStatus.
2. Accept rows that have either usable `ProductVolume` or usable `ProductHeight`.
3. Resolve the tank and probe mapping.
4. Resolve the final stored `ProductVolume` using tank preferences.
5. Optionally update physical stock if the tank allows UploadStatus ownership.
6. Persist `UploadStatusProbeReading` when cadence rules allow it.
7. Run server-side in-tank delivery detection in the background.

### 6.2 Why height-only admission matters
Previously, the pipeline was biased toward packets that already contained volume. That caused height-only readings to be dropped before enrichment.

The current flow admits readings when either of these is true:

- `ProductVolume >= 0`
- `ProductHeight > 0`

This ensures height-only packets can still be calibrated locally and persisted meaningfully.

### 6.3 Stored volume resolution rules
The runtime decision logic is:

#### Mode: `ProductVolumeSource = pts`
- If incoming PTS `ProductVolume` is usable and positive, store it.
- If it is missing or unusable, try FMS local calibration from height.

#### Mode: `ProductVolumeSource = fms-calibrated`
- Try FMS local calibration first.
- If a usable local chart exists, store the calibrated volume.
- If no usable local chart exists, fall back to incoming PTS `ProductVolume` when available.

#### Mode: `ProductVolumeSource = null`
- Preserve legacy behavior.
- Positive PTS volume wins first.
- Local calibration is used only when probe volume is missing or unusable.

### 6.4 Height-unit handling during interpolation
PTS probe readings arrive in millimetres. Local calibration charts may be stored in centimetre-style heights.

The enrichment service therefore:

1. Converts probe height from mm to rounded cm and tries interpolation.
2. Falls back to raw rounded mm if cm lookup does not match the chart range.

This dual attempt is necessary because some persisted charts follow controller-style centimetre heights while others may already reflect millimetre-based data.

### 6.5 Chart usability rules
FMS deliberately ignores unusable local charts. A chart is rejected when:

- it has fewer than 2 rows,
- height values do not increase,
- all stored volumes are zero,
- the chart cannot support interpolation.

This avoids the earlier failure mode where a zero-only interval-volume snapshot was preferred over a valid manual chart.

## 7. Chart Selection Rules

### 7.1 Preferred-source behavior
If a tank explicitly chooses a chart source, FMS tries that source first.

### 7.2 Automatic priority behavior
If the tank uses automatic priority, FMS currently prefers local charts in this order:

1. `manual`
2. `automatic`
3. `fms-learned`
4. `interval-volume`

This ordering intentionally places `interval-volume` last because interval-volume data can contain readiness placeholders or incomplete zero-value rows that are not safe as a primary runtime chart.

### 7.3 Probe-aware lookup
When a `ProbeNumber` is known, FMS first tries an exact `(TankId, ProbeNumber, ChartType)` snapshot match.

If that fails, it falls back to the latest chart for the tank regardless of probe number.

This prevents unrelated tank-level snapshots from overriding an exact probe-specific chart when one exists.

## 8. Persistence Model

### 8.1 Snapshot storage
Snapshots are stored as immutable records of what FMS knew at a given time. This supports:

- auditing,
- chart history inspection,
- offline review,
- preview and test tooling,
- comparison against learned charts,
- runtime caching.

### 8.2 Tank schema additions
Tank configuration now includes:

- `ProbePhysicalStockUpdateSource`
- `CalibrationChartSource`
- `ProductVolumeSource`

These values are normalized and validated in tank create/update commands before being saved.

### 8.3 Migration requirement
The migration script adds the above columns to the `tank` table.

Current script:

```sql
ALTER TABLE `tank`
    ADD COLUMN `ProbePhysicalStockUpdateSource` VARCHAR(32) NULL AFTER `UsePtsProbeReadings`,
    ADD COLUMN `CalibrationChartSource` VARCHAR(32) NULL AFTER `ProbePhysicalStockUpdateSource`,
    ADD COLUMN `ProductVolumeSource` VARCHAR(32) NULL AFTER `CalibrationChartSource`;
```

## 9. Frontend Workflow

### 9.1 Tank admin binding panel
The tank admin UI now exposes calibration-related controls directly in the PTS binding experience.

Users can configure:

- physical stock owner,
- stored product volume source,
- local calibration source.

These settings are saved with the tank binding and are preserved by the general tank edit forms as well.

### 9.2 Calibration preview
The calibration preview panel is a local tester for stored snapshots. It currently allows the user to:

1. enter a product height in mm,
2. choose the stored-volume source,
3. choose the calibration source,
4. see the converted litres result,
5. review the selected calibration rows in a compact table.

This preview does not push anything to the PTS device. It works against the local FMS calibration snapshots.

### 9.3 Learned calibration UI
The frontend also contains dedicated tank calibration panels and learned-calibration tabs for:

- current snapshot review,
- history review,
- learned-chart generation,
- comparison workflows.

## 10. Server-Side In-Tank Delivery Detection Interaction

Server-side delivery detection consumes the `ProbeMeasurement` object after UploadStatus runtime resolution has already run in the deferred processing path.

That means delivery detection currently sees the resolved `ProductVolume`, not necessarily the raw PTS volume.

Operational implication:

- if a tank is configured for `fms-calibrated`, server-side delivery detection will generally operate on the calibrated UploadStatus volume whenever a usable local chart exists,
- if a tank is configured for `pts`, delivery detection will generally operate on the raw PTS volume when it is usable.

This is important because calibration is no longer only a reporting feature. It can influence downstream event detection and delivery-processing behavior.

## 11. FMS Learned Calibration

### 11.1 Purpose
FMS learned calibration exists to build or refine a tank chart from real operational evidence rather than depending solely on the controller.

### 11.2 Evidence sources
The learning pipeline uses:

- pump transactions,
- pre/post tank measurement windows,
- in-tank deliveries,
- configured stability windows,
- configured variance thresholds.

### 11.3 Output
The generated chart is stored as a local snapshot with `ChartType = fms-learned`.

It can then participate in:

- preview,
- comparison,
- runtime fallback,
- explicit tank preference via `CalibrationChartSource`.

## 12. Validation and Safety Rules

The calibration system includes multiple validation layers.

### 12.1 Device-operation validation
PTS controller operations validate:

- probe number,
- chart type,
- row counts,
- batch sizes,
- duplicate heights,
- protocol limit compliance.

### 12.2 Tank configuration validation
Tank create and update commands validate accepted values for:

- `ProbePhysicalStockUpdateSource`
- `CalibrationChartSource`
- `ProductVolumeSource`

### 12.3 Runtime safety
Runtime calibration lookup protects against:

- missing charts,
- malformed charts,
- zero-only charts,
- non-increasing heights,
- out-of-range interpolation attempts,
- Redis cache failures.

When Redis fails, the system falls back safely instead of blocking packet processing.

## 13. Operational Notes

### 13.1 Recommended tank configuration guidance
Use `ProductVolumeSource = fms-calibrated` when:

- probe height is trusted,
- local charts are maintained and verified,
- PTS volume values are known to be inconsistent or unavailable.

Use `ProductVolumeSource = pts` when:

- the controller is the primary source of truth,
- local calibration is only a fallback safety mechanism.

Use `CalibrationChartSource = auto` when:

- you want FMS to pick the first usable local chart automatically.

Use an explicit chart source when:

- operations want deterministic behavior for a specific tank,
- troubleshooting or comparison work requires a fixed chart.

### 13.2 Known process consideration
Server-side ITD detection only works when a usable `ProductVolume` exists after resolution. If neither PTS volume nor local calibration can provide a usable volume, delivery detection will skip that reading.

### 13.3 Preview behavior note
The preview uses local FMS snapshot data, not live controller reads. It is intended for operational verification of local conversion behavior.

## 14. Key Files

### Backend
- `FMS.WebClient/Controllers/PTSController/PTSConfigController.cs`
- `FMS.WebClient/Controllers/FuelManagement/TankCalibrationController.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/Services/TankCalibrationStorageService.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/Services/CalibrationLearningService.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/Services/CalibrationAnalysisService.cs`
- `FMS.Application/Features/TankManagement/TankMeasurements/Services/ProbeReadingEnrichmentService.cs`
- `FMS.Application/Features/TankManagement/TankMeasurements/Services/UploadStatusProbeProcessingService.cs`
- `FMS.Application/Features/TankManagement/Tank/TankProbeConfigurationOptions.cs`

### Frontend
- `fms.frontend/src/services/ptsConfigService.js`
- `fms.frontend/src/pages/tank/components/PTSDeviceLinkPanel.js`
- `fms.frontend/src/pages/tank/components/PTSProbeSelector.js`
- `fms.frontend/src/pages/tank/components/TankCalibrationPanel.js`
- `fms.frontend/src/pages/tank/components/TankCalibrationLearnedTab.js`

### Database and scripts
- `Documentation/Database/tankcalibrationsnapshots.sql`
- `scripts/20260326_add_tank_probe_configuration_columns.sql`

## 15. Summary
Calibration in FMS is now a live operational subsystem, not just a static device-management feature.

The current implementation supports:

- device chart access,
- local snapshot persistence,
- learned chart generation,
- runtime UploadStatus enrichment,
- explicit tank-level control over chart preference,
- explicit tank-level control over stored UploadStatus volume source,
- explicit separation between stored volume choice and physical stock ownership.

That separation is the main architectural point to preserve going forward:

- chart selection,
- stored volume source,
- physical stock ownership,
- delivery detection,

all interact, but they are not the same decision and should continue to be modeled independently.