<!--
File: 18-flow-movement-profile-decision.md
Purpose: Flow diagram showing how the system decides which detection engine to use
         based on vehicle movement profile.
Dependencies: PRD.md, VehicleTripDetectionModeHelper.cs
Last Modified: 2026-03-12
-->

# Flow: Movement Profile Decision

How the system selects the correct detection engine based on the vehicle's configured
movement profile. This decision is made by `VehicleTripDetectionModeHelper` and the
`VehicleTripOrchestrationService`.

```mermaid
flowchart TD
    Start([GPS Point or Batch<br/>Detection Request]) --> LoadVehicle

    LoadVehicle[Load Vehicle from DB<br/><small>GpsdataContext.Vehicles</small>] --> CheckProfile

    CheckProfile{Read vehicle<br/>MovementProfile}

    CheckProfile -->|"SiteToSite"| GeofenceCheck
    CheckProfile -->|"Shuttle"| ClusterCheck
    CheckProfile -->|"Tipper"| ClusterCheck
    CheckProfile -->|null / not set| DefaultProfile

    DefaultProfile[Default: use MovementProfile<br/>from vehicle.VehicleType<br/>or fall back to SiteToSite] --> GeofenceCheck2{Resolved<br/>profile?}
    GeofenceCheck2 -->|SiteToSite| GeofenceCheck
    GeofenceCheck2 -->|Shuttle/Tipper| ClusterCheck

    subgraph Geofence["Geofence Detection Path"]
        GeofenceCheck[Load assigned sites<br/>with active geofences<br/>for this vehicle]
        GeofenceCheck --> HasGeofences{Vehicle has<br/>assigned sites<br/>with geofences?}
        HasGeofences -->|Yes| RunGeofence[Run VehicleTripGeofence<br/>DetectionService]
        HasGeofences -->|No — zero sites| NoSites[⚠️ Cannot detect trips<br/>Log warning<br/>Skip vehicle]
    end

    subgraph Cluster["Cluster Detection Path"]
        ClusterCheck[Load KnownClustersJson<br/>from VehicleTripState]
        ClusterCheck --> HasState{State exists<br/>for today?}
        HasState -->|Yes| LoadClusters[Resume from<br/>persisted cluster state]
        HasState -->|No| NewState[Initialize new state<br/>KnownClusters = empty array]
        LoadClusters --> RunCluster[Run VehicleTripCluster<br/>DetectionService]
        NewState --> RunCluster
    end

    RunGeofence --> DetectionMode1["DetectionMode = 'Geofence'"]
    RunCluster --> DetectionMode2["DetectionMode = 'Cluster'"]

    DetectionMode1 --> Pipeline[Continue to Layer 3+<br/><small>Enrichment → Scoring → Grouping</small>]
    DetectionMode2 --> Pipeline

    subgraph Override["Manual Override Encoding"]
        OverrideCheck{Was this trip<br/>created by<br/>manual override?}
        OverrideCheck -->|Yes| EncodeOverride["DetectionMode = 'ManualOverride:{action}'"]
        OverrideCheck -->|No| KeepDetection["Keep original DetectionMode"]
    end

    Pipeline --> OverrideCheck
    EncodeOverride --> Persist[Persist to database]
    KeepDetection --> Persist

    NoSites --> End([End — vehicle skipped])
    Persist --> End2([Pipeline continues])

    style Geofence fill:#e0f2fe,stroke:#0284c7
    style Cluster fill:#fef3c7,stroke:#d97706
    style Override fill:#fdf4ff,stroke:#a855f7
```

## Movement Profile Configuration

| Profile | Typical Vehicle Type | Detection Engine | Trip Endpoints |
|---|---|---|---|
| `SiteToSite` | Fuel tankers, delivery trucks, passenger buses | `VehicleTripGeofenceDetectionService` | Known site geofences |
| `Shuttle` | Tipper trucks, shuttle buses, haul trucks | `VehicleTripClusterDetectionService` | Discovered clusters |
| `Tipper` | Same as Shuttle — alias for backward compat | `VehicleTripClusterDetectionService` | Discovered clusters |

## DetectionMode Field Values

The `DetectionMode` column on `vehicle_trip` and `vehicle_trip_group` records the
provenance of each trip record:

| Value Pattern | Meaning |
|---|---|
| `Geofence` | Detected by geofence state machine |
| `Cluster` | Detected by cluster state machine |
| `ManualOverride:Split` | Created by a manual split override |
| `ManualOverride:Merge` | Created by a manual merge override |
| `ManualOverride:Add` | Manually added trip |
| `ManualOverride:AdjustTimes` | Times adjusted by operator |
| `ManualOverride:ReassignSite` | Site reassigned by operator |
| `Superseded:Split:{newGroupId}` | Original record before split |
| `Superseded:Merge:{newGroupId}` | Original record before merge |
| `Superseded:Delete` | Soft-deleted by operator |

## Decision Priority

1. **Vehicle-level `MovementProfile`** — highest priority (explicit assignment)
2. **VehicleType-level `MovementProfile`** — fallback for vehicles without explicit assignment
3. **System default** — `SiteToSite` if neither vehicle nor type specifies a profile

## Site Assignment Requirements

For geofence detection to work, the vehicle must have:
1. At least one assigned site (via vehicle-site assignment)
2. Each site must have at least one active geofence polygon
3. If these conditions are not met, the system logs a warning and skips trip detection for that vehicle
