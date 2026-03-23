# Product Requirements Document

## Feature
Advanced PTS Automatic Calibration from Fuel Dispensed and Tank Volume Monitoring

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
- local FMS persistence for calibration snapshots, revisions, and history.

The feature must let operations users manage and review tank calibration quality from FMS without relying on the PTS controller UI alone.

## 2. Background
FMS already contains the main building blocks needed for this feature:
- PTS device communication and configuration APIs.
- live probe measurement handling through UploadStatus.
- tank-to-PTS binding through `PtsId`, `ProbeNumber`, `PtsTankId`, and `UsePtsProbeReadings`.
- persisted tank measurements and in-tank deliveries.
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

## 3. Problem Statement
Tank probe monitoring exists, but calibration management is incomplete. Users cannot currently do the following from FMS:
- retrieve and manage calibration charts from the PTS device,
- trigger automatic calibration generation,
- review readiness for automatic calibration generation,
- compare dispensed volume against measured tank volume deltas,
- track calibration history and revisions over time,
- use calibration confidence to drive tank monitoring decisions.

This leaves a gap between raw PTS capability and actual operational usage inside FMS.

## 4. Product Goal
Enable FMS to act as the operational control and audit layer for PTS tank calibration and tank volume monitoring, with both device-side execution and FMS-side historical analysis.

## 5. Objectives
1. Expose PTS calibration chart operations through FMS backend APIs.
2. Support manual chart retrieval and update workflows from FMS.
3. Support automatic calibration generation from the PTS controller.
4. Persist calibration charts, snapshots, generation runs, and revision history in FMS.
5. Analyze dispensed fuel volume against tank measurement deltas.
6. Surface calibration status, readiness, and confidence in the tank UI.
7. Keep the feature compatible with the existing tank monitoring and probe-binding flows.
8. Avoid introducing unrelated architectural changes outside the tank and PTS domains.

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

### 6.4 Frontend
- Add calibration API methods to the frontend PTS config service.
- Add tank-level calibration status visibility.
- Add a calibration management panel or modal reachable from existing tank pages.
- Support viewing manual chart, interval chart, automatic chart, history, and variance metrics.
- Support triggering automatic calibration generation from the UI.

## 7. Out of Scope for V1
- Autonomous correction of calibration charts without user review.
- Firmware management or PTS operating system changes.
- Redesign of unrelated tank stock dashboards.
- New mobile workflows.
- New vendor-neutral calibration abstractions outside PTS.
- Full predictive modeling beyond variance and readiness indicators.

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
- calibration run history
- sync history
- variance analysis records
- user/action audit metadata

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

## 15. Dependencies
- Existing PTS command execution pipeline
- Existing tank-to-probe binding data
- Existing tank measurements and in-tank delivery persistence
- Existing tank UI pages and PTS frontend service
- PTS device availability for live operations

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

## 18. Acceptance Criteria
1. Calibration endpoints exist and are callable through FMS APIs with `FMSResponse<T>` responses.
2. A bound tank can fetch and display manual calibration chart rows from the linked PTS probe.
3. A bound tank can fetch and display interval-volume chart rows including pass counts.
4. A bound tank can trigger automatic calibration generation and fetch the resulting automatic chart.
5. Chart snapshots and revisions are persisted in FMS and can be reopened later.
6. The UI shows calibration readiness, last sync, last generation result, and variance indicators.
7. Dispensed-versus-measured analysis produces persisted records tied to tanks and time periods.
8. Errors from offline devices or invalid operations are surfaced clearly to the user and logged.

## 19. Risks
- PTS device busy states may make generation and chart updates slow or intermittent.
- Protocol pagination and record limits may complicate bulk chart sync if not handled carefully.
- UploadStatus processing is already large; adding heavy analysis there would increase maintenance risk.
- If persisted history requires domain-model expansion, implementation may need an approval checkpoint.

## 20. Recommendation for Delivery
Deliver in phases:
1. device command and API surface,
2. persistence and analytics,
3. tank UI integration,
4. operational hardening and test coverage.