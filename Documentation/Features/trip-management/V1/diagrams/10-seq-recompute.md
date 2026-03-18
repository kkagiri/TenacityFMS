<!--
File: 10-seq-recompute.md
Purpose: Sequence diagram showing the user-triggered recompute flow through the
         full orchestration pipeline.
Dependencies: PRD.md, SERVICES_README.md
Last Modified: 2026-03-12
-->

# Sequence: Recompute Vehicle Trips

A user triggers a recompute from the tracking page or vehicle detail panel.
The command handler invokes the orchestration service which runs the full
detection → enrichment → scoring → grouping → persistence pipeline.

```mermaid
sequenceDiagram
    participant User as Fleet Manager
    participant UI as VehicleTrackingTripPanel.js<br/>or VehicleTripDetailPanel.js
    participant Service as vehicleTripService.js
    participant API as VehicleTripsController
    participant Validator as RecomputeVehicleTrips<br/>CommandValidator
    participant Handler as RecomputeVehicleTrips<br/>CommandHandler
    participant Orch as VehicleTripOrchestration<br/>Service
    participant PreProc as VehicleTripGps<br/>PreProcessor
    participant Detection as Detection Engine<br/>(Geofence or Cluster)
    participant Fuel as VehicleTripFuel<br/>ContextService
    participant Scoring as VehicleTripConfidence<br/>ScoringService
    participant Grouping as VehicleTripGrouping<br/>Service
    participant DB as MySQL<br/>(GpsdataContext)

    User->>UI: Click "Recompute vehicle"
    UI->>UI: Permission check: canManageTrips

    UI->>Service: recomputeVehicleTrips({ vehicleId, fromUtc, toUtc })
    Service->>API: POST /vehicletrips/recompute

    API->>Handler: MediatR dispatch RecomputeVehicleTripsCommand

    Note over Handler: Step 1 — Validate
    Handler->>Validator: Validate(command)
    Validator->>Validator: vehicleId > 0?
    Validator->>Validator: fromUtc < toUtc?
    alt Validation fails
        Validator-->>Handler: Validation errors
        Handler-->>API: FMSResponse.ValidationFailed(errors)
        API-->>Service: 400
        Service-->>UI: Show error toast
    end

    Note over Handler: Step 2 — Load vehicle
    Handler->>DB: Load vehicle (confirm exists, get MovementProfile)

    Note over Handler: Step 3 — Invoke orchestration
    Handler->>Orch: RecomputeAsync(vehicleId, fromUtc, toUtc)

    Note over Orch: Step 3a — Delete existing trips in range
    Orch->>DB: Delete VehicleTripGroups + VehicleTrips in [fromUtc, toUtc]

    Note over Orch: Step 3b — Load GPS data
    Orch->>DB: Load GPS track points for vehicle in [fromUtc, toUtc]

    Note over Orch: Step 3c — Choose detection engine
    alt MovementProfile = SiteToSite (Geofence)
        Orch->>Detection: Run geofence detection
    else MovementProfile = Shuttle (Cluster)
        Orch->>Detection: Run cluster detection
    end

    Detection->>PreProc: PreProcess(trackPoints)
    PreProc-->>Detection: Enriched + filtered points
    Detection-->>Orch: Raw trip legs (VehicleTripDetectionResultDTO[])

    Note over Orch: Step 3d — Enrich with fuel
    Orch->>Fuel: EnrichWithFuel(tripLegs, trackPoints)
    Fuel-->>Orch: Fuel-enriched legs

    Note over Orch: Step 3e — Score individual legs
    Orch->>Scoring: ScoreTrips(tripLegs)
    Scoring-->>Orch: Scored legs + anomaly flags

    Note over Orch: Step 3f — Group legs
    Orch->>Grouping: GroupTrips(tripLegs, movementProfile)
    Grouping-->>Orch: Trip groups (VehicleTripGroupedDetectionDTO[])

    Note over Orch: Step 3g — Score groups
    Orch->>Scoring: ScoreGroups(tripGroups)
    Scoring-->>Orch: Scored groups

    Note over Orch: Step 3h — Persist
    Orch->>DB: Upsert VehicleTripGroups + VehicleTrips

    Orch-->>Handler: VehicleTripRecomputeResultDTO<br/>(groupsCreated, legsCreated, deleted)

    Handler-->>API: FMSResponse.Success(result)
    API-->>Service: 200 + response
    Service-->>UI: Show success toast

    Note over UI: ⚠️ Trip panel does NOT auto-refresh<br/>after recompute (Gap #6).<br/>User must wait for next 30s poll.
```

## Pipeline Steps (Orchestration Service)

| Step | Service | Action |
|---|---|---|
| 3a | `GpsdataContext` | Delete existing `VehicleTripGroup` + `VehicleTrip` records in the date range |
| 3b | `GpsdataContext` | Load GPS track points from the existing tracking data store |
| 3c | `GeofenceDetection` or `ClusterDetection` | Run detection using the vehicle's configured movement profile |
| 3d | `FuelContextService` | Attach fuel levels at departure/arrival + compute consumed |
| 3e | `ConfidenceScoringService.ScoreTrips` | Assign 0.0–1.0 confidence per leg + set anomaly flags |
| 3f | `GroupingService` | Assemble legs into `RoundTrip` or `LoadCycle` groups |
| 3g | `ConfidenceScoringService.ScoreGroups` | Score group-level confidence + coherence checks |
| 3h | `GpsdataContext` | Upsert new trip groups and legs to database |

## Result DTO

`VehicleTripRecomputeResultDTO` contains:

| Field | Description |
|---|---|
| `groupsCreated` | Number of new trip groups persisted |
| `tripsCreated` | Number of new trip legs persisted |
| `groupsDeleted` | Number of old groups removed |
| `tripsDeleted` | Number of old legs removed |
| `vehicleId` | The vehicle that was recomputed |
| `fromUtc` / `toUtc` | The time range that was reprocessed |

## Frontend Feedback

| Current | Required (Gap #6) |
|---|---|
| DevExtreme `notify` toast with success/error message | Loading spinner while recompute runs |
| No trip panel refresh | Call `refreshTrips()` from `useVehicleTrackingTrips` after completion |
