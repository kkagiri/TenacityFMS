# Calibration Review Validation

## Feature
Advanced PTS Automatic Calibration and FMS Learned Calibration

## Version
V1

## Document Type
Implementation Review Validation

## Date
2026-04-07

## 1. Purpose
This document tightens the April 2026 calibration system review by separating:

- findings confirmed against the current code,
- findings that are now outdated or overstated,
- newly discovered defects found during validation.

It complements:

- `IMPLEMENTATION_DETAILS.md`
- `PRD.md`
- `TASKS.md`

## 2. Validation Scope
The validation was performed against the current implementation in these areas:

- pump transaction ingestion,
- UploadStatus probe processing,
- runtime probe volume enrichment,
- learned calibration extraction and chart generation,
- calibration controller endpoints,
- health and readiness analysis.

Primary code paths reviewed:

- `FMS.Application/Command/DatabaseCommand/PTSCommands/PumpTransactionCommand/CreatePumpTransactionCommand.cs`
- `FMS.Application/Features/TankManagement/TankMeasurements/Services/UploadStatusProbeProcessingService.cs`
- `FMS.Application/Features/TankManagement/TankMeasurements/Services/ProbeReadingEnrichmentService.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/Services/CalibrationLearningService.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/Services/CalibrationAnalysisService.cs`
- `FMS.Application/Features/TankManagement/TankCalibration/Events/CalibrationExtractionTriggerHandler.cs`
- `FMS.WebClient/Controllers/FuelManagement/TankCalibrationController.cs`

## 3. Confirmed Findings

### 3.1 Calibration learning is still feature-gated and default-off
Confirmed.

- `Calibration.LearningEnabled` is still used to gate extraction triggers and learning operations.
- The default value remains `false` in configuration constants.

Operational effect:

- automatic extraction from pump transactions and deliveries does not run unless the system configuration is enabled.

### 3.2 Stability-window dependency is real
Confirmed.

The learned-calibration extraction still depends on dense `UploadStatusProbeReading` coverage.

The stability rules still require:

- at least 2 readings in the window,
- at least 75% coverage of the configured window,
- height variance within the configured threshold.

Operational effect:

- probe reading persistence gaps still directly reduce learned-calibration extraction success.

### 3.3 Interval accumulation rebuild is still a full rebuild
Confirmed.

The current implementation still reloads all calibration data points for the tank and rebuilds interval accumulations from the full set after new extraction.

Operational effect:

- performance cost grows with historical point volume.

### 3.4 Delivery extraction still uses delivery entity heights
Confirmed.

The delivery path still uses `Intankdelivery.StartProductHeight` and `EndProductHeight` as the height source while using probe readings only to validate quiet windows.

Operational effect:

- the delivery path remains behaviorally different from the dispensing path, which derives heights from stable probe readings.

### 3.5 Product-volume source and chart-source decisions are separated correctly
Confirmed.

The runtime still models three separate concerns independently:

- physical stock ownership,
- stored UploadStatus product volume source,
- preferred calibration chart source.

This separation remains architecturally correct and should be preserved.

## 4. Outdated or Overstated Findings

### 4.1 FMS learned chart is now part of runtime enrichment
The earlier review item that said the FMS learned chart has no operational effect is no longer correct.

Current behavior:

- `fms-learned` is a supported chart type,
- learned snapshots are persisted with `ChartType = fms-learned`,
- runtime enrichment includes `fms-learned` in chart priority resolution,
- the resolved calibrated volume is written back onto the UploadStatus probe measurement before persistence and physical-stock averaging.

Practical consequence:

- when tank configuration prefers `fms-calibrated`, or when chart-priority fallback reaches `fms-learned`, the learned chart can affect stored probe volume and physical stock behavior.

### 4.2 Missing TankId on UploadStatusProbeReading is not the current failure mode
The earlier review stated that probe readings arrive without `TankId` and therefore calibration learning can silently fail because the learning query reads by `TankId`.

That is not accurate for the current implementation.

Current behavior:

- `UploadStatusProbeProcessingService` resolves the tank binding before save,
- saved `UploadStatusProbeReading` rows do include `TankId`.

The real risk is narrower:

- if tank-to-probe mapping cannot be resolved, the reading is skipped and never saved for that tank,
- this is especially relevant when multiple tanks are linked to one device and a tank has no probe binding.

### 4.3 PtsTankId fallback mainly affects readiness and health checks
The earlier review suggested that falling back from `PtsTankId` to `ProbeNumber` could cause wrong chart sync behavior broadly.

That claim is too broad.

Current behavior:

- health summary and automatic-calibration readiness checks do use `PtsTankId ?? ProbeNumber`,
- actual chart generation, sync, and record-read calls are probe-number-based in the PTS config service contract.

Practical consequence:

- the fallback is still a valid concern for configuration/readiness interpretation,
- it is not, based on current code alone, sufficient evidence that chart sync reads the wrong chart data.

### 4.4 Height-unit ambiguity exists, but the runtime now explicitly compensates for mixed data
The earlier review described a likely mm/cm mismatch as though it directly implied broken lookup behavior.

Current behavior is more defensive:

- runtime enrichment first converts incoming probe height from mm to rounded cm,
- if that lookup fails, it retries using the raw rounded height.

Practical consequence:

- unit ambiguity is still real and should be documented clearly,
- the current runtime intentionally tries to survive mixed snapshot unit conventions rather than assuming a single unit model.

## 5. Newly Discovered Defects

### 5.1 Critical: pump transactions were being created but not added to DbContext before save
This validation found a more severe defect than the original review listed.

In `CreatePumpTransactionCommand.cs`, the handler constructed a new `Pumptransaction` entity and then called `SaveChangesAsync()` without adding the entity to `_context.Pumptransactions` first.

Why this matters:

- the database row may not exist,
- the generated database `Id` would not be reliable,
- `TransactionCompletedEvent` could be published with a non-persisted transaction id,
- calibration extraction trigger logic that resolves the transaction by database id could skip entirely.

Impact:

- this undermines the dispensing-based learned calibration entry point,
- it also affects any downstream logic depending on the persisted transaction row.

Status:

- this defect has been fixed by adding `_context.Pumptransactions.Add(pumpTransactionData);` before `SaveChangesAsync()`.

### 5.2 Validation message is stale for supported chart types
The calibration validator error message still lists only:

- `manual`
- `interval-volume`
- `automatic`

But `fms-learned` is now also supported.

Impact:

- user-facing or API validation errors can misstate supported chart options.

This is a low-risk correctness issue, but it should be aligned with current functionality.

## 6. Corrected Assessment of the System

### 6.1 What remains structurally sound
The overall architecture remains sound in these areas:

- separation between PTS automatic calibration and FMS learned calibration,
- use of UploadStatus probe data as the dense time-series source for stability checks,
- use of pump transaction volume as the authoritative dispensing volume for learned calibration,
- persistence of all chart types into common local snapshot storage,
- explicit per-tank controls for product-volume source and chart source.

### 6.2 What currently deserves the most attention
The most important active concerns are now:

1. the corrected pump transaction persistence path,
2. the continued operational dependency on dense UploadStatus probe persistence,
3. the full rebuild cost of interval accumulation updates,
4. stale or misleading validation and readiness messaging around chart support and `PtsTankId` fallback.

## 7. Recommended Updates to the Original Review
The earlier review should be updated as follows:

1. Remove or rewrite the claim that `fms-learned` is not used for runtime enrichment.
2. Rewrite the `UploadStatusProbeReading` tank-id issue to focus on probe-binding resolution rather than missing persisted `TankId`.
3. Narrow the `PtsTankId` concern to readiness and health interpretation unless a separate device-side mapping defect is proven.
4. Keep the stability-window, feature-gating, and rebuild-performance findings.
5. Add the newly discovered pump transaction persistence defect as a top-priority issue.

## 8. Summary
The April 2026 review was directionally strong, but the current codebase now requires a tighter distinction between:

- still-valid architectural risks,
- concerns that have already been addressed in runtime code,
- newly surfaced defects earlier in the ingestion pipeline.

The most important corrected conclusion is this:

- `fms-learned` calibration now does participate in runtime enrichment,
- the bigger active defect was the pump transaction persistence bug in the dispensing entry path,
- the remaining high-value review items are mostly operational dependencies and validation clarity issues rather than missing core architecture.