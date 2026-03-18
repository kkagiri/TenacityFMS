# Vehicle Trip Services — Overview

This document describes the responsibility of each service in `FMS.Application/Features/VehicleTrips/Services/`.
The services collectively implement the five-layer trip pipeline defined in the PRD.

---

## Pipeline at a Glance

```
GPS Data In
    │
    ▼
[GPS Pre-Processor]
    │  filters bad points, enriches with distance/geofence, buffers window
    ▼
[Detection — Geofence or Cluster]
    │  runs state machine per vehicle, produces raw trip legs
    ▼
[Fuel Context Enrichment]
    │  attaches departure/arrival fuel levels and consumed fuel
    ▼
[Confidence Scoring]
    │  assigns 0–1 confidence score and anomaly flags per leg and group
    ▼
[Grouping]
    │  assembles legs into round-trip or load-cycle groups
    ▼
[Orchestration]   ←── top-level coordinator: calls all of the above
    │
    ▼
[Reconciliation]
    │  batch re-play, compare, and finalize real-time records
    ▼
[Manual Override]  ←── operator corrections after reconciliation
    │  validated by ManualOverrideValidationService
    │  every change written by OverrideAuditService
    ▼
Final Trip Records (APIs, SignalR, Dashboards, Fuel Audit)
```

---

## Services

### Layer 1 — GPS Pre-Processing

#### `IVehicleTripGpsPreProcessor` / `VehicleTripGpsPreProcessor`
**PRD Layer 1 — GPS Data Ingestion**

Sits between the raw GPSGate track-point stream and every detection engine.
Before any trip logic runs, this service cleans up the raw GPS feed:

- **Filters** out invalid points (zero satellites, duplicate positions within the configured time/distance window, positions that imply impossible speeds).
- **Enriches** each surviving point with Haversine distance from the previous point and time delta.
- **Buffers** points in a configurable sliding window so the detection engines always have enough context for reliable state transitions.

Configuration is injected via `VehicleTripPreProcessorOptions` (section `VehicleTrips:PreProcessor`).
Key tunable thresholds: sliding window size, minimum satellite count, max position jump (km), duplicate distance/time window, maximum implied speed.

---

### Settings

#### `IVehicleTripSettingsService` / `VehicleTripSettingsService`

Manages the persisted feature settings for the Vehicle Trips module.
Provides read/write operations for detection thresholds, reconciliation schedule, and UI preferences that are surfaced in the Vehicle Trips Settings page.

Methods:
- `GetSettingsAsync`: returns the current `VehicleTripSettingsDTO`.
- `UpdateSettingsAsync`: validates and persists updated settings.

---

### Layer 2 — Real-Time Detection

#### `IVehicleTripGeofenceDetectionService` / `VehicleTripGeofenceDetectionService`
**PRD Layer 2 — Geofence Detector (fleet / site-to-site vehicles)**

For vehicles with the `SiteToSite` movement profile.
Walks the pre-processed GPS points in chronological order and tracks a simple per-vehicle state machine (`AT_SITE → DEPARTING → ARRIVING`).

- Loads all active sites that have an attached geofence (circle, polygon, or route geometry).
- When `geofenceGroupId` is provided, filters sites via `GpsGeofenceGroupMember` to only include sites in that group.
- Determines which site (if any) each point falls inside using exact geometric containment tests.
- Emits a completed `VehicleTripDetectionResultDTO` whenever the vehicle transitions from one site's geofence to a different site's geofence.
- Handles in-progress trips (vehicle departed but has not yet reached a destination site by the end of the time window).
- Applies minimum trip distance (0.5 km) and duration (2 min) thresholds to suppress noise.
- `PreviewDetectionAsync` returns `GeofenceDetectionPreviewDTO` including site geometry, classification, and annotated track points for frontend replay.

#### `IVehicleTripClusterDetectionService` / `VehicleTripClusterDetectionService`
**PRD Layer 2 — Cluster Detector (shuttle / tipper vehicles)**

For vehicles with the `Shuttle` movement profile where trip endpoints are **not** known in advance.

- Extracts significant stops from the GPS timeline (speed below threshold for a minimum dwell time).
- Groups stops into spatial clusters using a configurable radius (default 150 m).
- If a cluster centroid falls inside a known site geofence, the site name replaces the auto-generated cluster label.
- Classifies clusters as loading or dump sites based on average dwell time across all stops in the cluster.
- Converts each consecutive stop-pair into a `VehicleTripDetectionResultDTO` trip leg.
- Also handles in-progress trips where the vehicle has departed the last known stop but not yet arrived anywhere.
- `PreviewDetectionAsync` returns `ClusterDetectionPreviewDTO` including detected stops, clusters, annotated track points, and cluster labels for frontend replay.

---

### Enrichment & Scoring

#### `IVehicleTripFuelContextService` / `VehicleTripFuelContextService`
**PRD Layer 5 — Fuel Enrichment (Integration with Fuel Audit)**

After raw trip legs are detected, this service enriches them with fuel data from the GPS telemetry:

- Attaches fuel level at departure and fuel level at arrival to each leg.
- Computes fuel consumed per leg (departure level − arrival level, floored at 0).
- Provides the per-trip fuel attribution that feeds the Fuel Audit module's variance analysis and the tipper loaded-vs-unloaded fuel rate anomaly signal.

#### `IVehicleTripConfidenceScoringService` / `VehicleTripConfidenceScoringService`
**PRD sections 9 and 10 — confidence and anomaly scaffolding**

Assigns quality metadata to detected trips and grouped trips before they are persisted:

- Scores individual trip legs (`ScoreTrips`): evaluates GPS coverage, completeness of origin/destination data, fuel data availability, and distance/duration plausibility to produce a 0.0–1.0 confidence value.
- Scores trip groups (`ScoreGroups`): rolls up leg confidence and checks group-level coherence (e.g., leg count, cycle symmetry for tippers).
- Marks anomaly flags for downstream reconciliation and reporting, such as negative fuel, unrealistic speed, or incomplete site resolution.

---

### Grouping

#### `IVehicleTripGroupingService` / `VehicleTripGroupingService`
**PRD section 13.2 — Trip Groups**

Takes the flat list of detected trip legs and assembles them into higher-level trip groups:

- `RoundTrip` groups for fleet vehicles: a leg out and a leg back form one round trip.
- `LoadCycle` groups for tippers: a loading-site visit followed by a dump-site visit (and optional return) forms one production cycle.
- Produces `VehicleTripGroupedDetectionDTO` objects, which carry the leg list plus aggregate totals (total distance, total duration, total fuel consumed, leg count).

---

### Orchestration

#### `IVehicleTripOrchestrationService` / `VehicleTripOrchestrationService`
**Top-level coordinator — used by commands and background jobs**

The single entry point for computing or recomputing trips for a vehicle over a time range.
Internally it sequences:

1. Choose detection engine based on vehicle movement profile (geofence or cluster).
2. Run detection → raw trip legs.
3. Enrich with fuel context.
4. Score confidence on legs.
5. Group legs into trip groups.
6. Score confidence on groups.
7. Persist (upsert) trip groups and associated legs to the database.
8. Return a `VehicleTripRecomputeResultDTO` summarising what was created, updated, or deleted.

All CQRS command handlers and background reconciliation services call this service rather than invoking the detection or grouping services directly.

---

### Layer 3 — Reconciliation

#### `IVehicleTripReconciliationService` / `VehicleTripReconciliationService`
**PRD Layer 3 — End-of-Day Reconciliation**

Designed to run after midnight (or on demand) to clean up real-time detection artifacts.
Accepts a `previewOnly` flag — when true it returns a diff without writing to the database.

Steps:

1. **Replay**: re-runs the full detection pipeline over the complete day's GPS data for the vehicle.
2. **Compare**: aligns batch results against the existing real-time trip records to detect differences.
3. **Classify**: applies reconciliation outcome codes — `Confirmed`, `Split`, `Merged`, `Adjusted`, or `Anomaly` — to each trip group.
4. **Apply** (if not preview): overwrites real-time records with the more accurate batch versions and stamps each record with its reconciliation status.
5. **Anomaly flagging**: checks for missing fuel data, negative consumption, impossible speeds, tipper cycle asymmetry, and vehicles that never returned to a known site.

Returns a `VehicleTripReconciliationResultDTO` with counts per outcome category and the full list of affected groups.

---

### Layer 4 — Manual Override

#### `IVehicleTripManualOverrideService` / `VehicleTripManualOverrideService`
**PRD Layer 4 — Manual Override Actions**

Provides the six operator-facing correction operations that can be applied to reconciled trip records:

| Method | What It Does |
|---|---|
| `SplitTripAsync` | Splits one trip group at a given point in time, creating two groups. |
| `MergeTripsAsync` | Merges two consecutive trip groups into one. |
| `ReassignSiteAsync` | Changes the origin or destination site of a trip leg/group. |
| `AddTripAsync` | Inserts a manually created trip record (e.g., GPS was offline but a trip is known from dispatch logs). |
| `DeleteTripAsync` | Soft-deletes a false trip (e.g., vehicle was towed, GPS was garbage). |
| `AdjustTripTimesAsync` | Overrides departure and/or arrival times on a trip. |

Every operation goes through `IVehicleTripManualOverrideValidationService` before any mutation is committed, and every committed change is written to the audit trail via `IVehicleTripOverrideAuditService`.

#### `IVehicleTripManualOverrideValidationService` / `VehicleTripManualOverrideValidationService`

Guard layer that protects the override pipeline from invalid or unsafe edits:

- Validates that the override request carries a mandatory reason and a valid requester ID.
- Loads the target trip group for validation (hydrates all legs).
- Checks the resulting trip timeline against the full vehicle trip schedule to prevent overlapping or physically impossible trips.
- Checks whether the period being modified has already had a finalised fuel audit run against it; if so, supervisor approval is required before the edit can proceed.

#### `IVehicleTripOverrideAuditService` / `VehicleTripOverrideAuditService`

Immutable audit log for every manual override:

- `RecordAsync`: persists an audit record that captures the action type, original field values, new field values, operator user ID, timestamp, and reason text (as required by the PRD).
- `GetHistoryAsync`: retrieves the full override history for a trip group (and optionally a specific trip leg), used by the UI's audit trail panel.

---

### Support / Helpers

#### `VehicleTripDetectionModeHelper` (static)

Centralises the string conventions used in the `DetectionMode` column of persisted trip records:

- Encodes manual override actions as `ManualOverride:{Action}` (e.g., `ManualOverride:Split`).
- Encodes superseded records as `Superseded:{Action}:{ReplacementGroupId}`.
- Provides `IsSuperseded` and `IsManualOverride` guard methods used throughout the override pipeline to avoid hard-coded string comparisons.

#### `VehicleTripManualOverrideFactory` (static)

Provides builder functions used by `VehicleTripManualOverrideService` to keep construction logic out of the service itself:

- Clones a mutable trip state object for transformation.
- Builds persisted `VehicleTripGroup` and `VehicleTrip` entities from mutable state.
- Builds audit payload, detail snapshots, and standard `FMSResponse` responses.

#### `VehicleTripPreProcessorOptions`

Configuration POCO bound from `appsettings.json` under `VehicleTrips:PreProcessor`.
Holds the numeric thresholds used by `VehicleTripGpsPreProcessor`:
sliding window size, minimum satellite count, max position jump, duplicate distance/time windows, and maximum implied speed.

#### `VehicleTripGeofenceDetectionOptions`

Configuration POCO bound from `appsettings.json` under `VehicleTrips:GeofenceDetection`.
Holds thresholds for the geofence detector:
minimum trip distance (km), minimum trip duration (minutes), consecutive outside-geofence points required for departure, and maximum track points for preview.

#### `VehicleTripClusterDetectionOptions`

Configuration POCO bound from `appsettings.json` under `VehicleTrips:ClusterDetection`.
Holds thresholds for the cluster detector:
stop speed threshold, minimum stop duration, cluster radius, minimum cluster visits, DBSCAN parameters, and maximum track points for preview.

#### `VehicleTripGeofenceStateMachineOptions`

Configuration POCO for the real-time geofence state machine:
N-consecutive-points threshold, periodic update interval, max gap before anomaly, idle outside geofence timeout.

#### `VehicleTripClusterStateMachineOptions`

Configuration POCO for the real-time cluster state machine:
stop detection thresholds, cluster merge radius, progressive refinement parameters.

---

## Dependency Map (simplified)

```
VehicleTripOrchestrationService
 ├── IVehicleTripGeofenceDetectionService ──► IVehicleTripGpsPreProcessor
 ├── IVehicleTripClusterDetectionService  ──► IVehicleTripGpsPreProcessor
 ├── IVehicleTripFuelContextService
 ├── IVehicleTripConfidenceScoringService
 └── IVehicleTripGroupingService

VehicleTripReconciliationService
 └── IVehicleTripOrchestrationService

VehicleTripManualOverrideService
 ├── IVehicleTripManualOverrideValidationService
 ├── IVehicleTripOverrideAuditService
 └── VehicleTripManualOverrideFactory   (static)

PreviewClusterDetectionQueryHandler
 └── IVehicleTripClusterDetectionService

PreviewGeofenceDetectionQueryHandler
 ├── IVehicleTripGeofenceDetectionService
 └── GpsdataContext  (GpsGeofenceGroupMember for group filtering)

VehicleTripSettingsService
 └── GpsdataContext
```
