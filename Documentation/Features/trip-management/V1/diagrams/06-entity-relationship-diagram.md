<!--
File: 06-entity-relationship-diagram.md
Purpose: Database ERD showing all trip-related tables, their columns, relationships,
         and foreign keys to existing FMS tables.
Dependencies: mysql-phase1 through phase4 SQL files, domain entities
Last Modified: 2026-03-17
-->

# Entity Relationship Diagram

Database tables for Vehicle Trip Management. Built across four SQL migration phases.
Foreign keys reference existing FMS tables (`vehicle`, `site`, `gps_geofence`, `gps_geofence_group_member`).

```mermaid
erDiagram
    vehicle_trip_group {
        int VehicleTripGroupId PK
        int VehicleId FK
        date TripDate
        datetime StartTimeUtc
        datetime EndTimeUtc
        int OriginSiteId FK "nullable"
        int DestinationSiteId FK "nullable"
        int TripCount
        decimal TotalDistanceKm
        decimal TotalDurationMinutes
        tinyint Status "1=InProgress 2=Completed"
        varchar MovementProfile "Geofence|Cluster"
        varchar DetectionMode
        decimal TotalFuelConsumed "nullable"
        tinyint GroupingType "0=None 1=SingleLeg 2=RoundTrip 3=LoadCycle"
        decimal ConfidenceScore "0.0–1.0"
        varchar ConfidenceBand "High|Medium|Low"
        int AnomalyFlags "bitmask"
        tinyint ReconciliationStatus "0=Pending..5=Anomaly"
        int ProjectPlanId FK "nullable — V2"
        int WorkShiftId FK "nullable — V2"
        tinyint IsOutOfBounds "nullable — V2"
        tinyint IsProductiveMovement "nullable — V2"
        datetime CreatedAtUtc
        datetime UpdatedAtUtc
    }

    vehicle_trip {
        int VehicleTripId PK
        int VehicleTripGroupId FK
        int VehicleId FK
        int SequenceNo
        datetime StartTimeUtc
        datetime EndTimeUtc
        int OriginSiteId FK "nullable"
        int DestinationSiteId FK "nullable"
        int OriginGeofenceId FK "nullable"
        int DestinationGeofenceId FK "nullable"
        decimal StartLatitude
        decimal StartLongitude
        decimal EndLatitude
        decimal EndLongitude
        decimal DistanceKm
        decimal DurationMinutes
        decimal MaxSpeedKph
        tinyint Status "1=InProgress 2=Completed"
        varchar MovementProfile
        varchar DetectionMode
        decimal FuelAtDeparture "nullable"
        decimal FuelAtArrival "nullable"
        decimal FuelConsumed "nullable"
        decimal ConfidenceScore "0.0–1.0"
        varchar ConfidenceBand
        int AnomalyFlags "bitmask"
        tinyint ReconciliationStatus
        bigint StartTrackInfoId "nullable"
        bigint EndTrackInfoId "nullable"
        int ProjectPlanId FK "nullable — V2"
        int WorkShiftId FK "nullable — V2"
        int PlannedHaulRouteId FK "nullable — V2"
        tinyint IsOutOfBounds "nullable — V2"
        tinyint IsProductiveMovement "nullable — V2"
        datetime CreatedAtUtc
        datetime UpdatedAtUtc
    }

    vehicle_trip_state {
        int VehicleTripStateId PK
        int VehicleId FK
        date StateDate
        varchar CurrentState "AT_SITE|DEPARTING|ARRIVING|AT_CLUSTER|IN_TRANSIT"
        int CurrentSiteId FK "nullable"
        int CurrentGeofenceId FK "nullable"
        varchar CurrentSiteName "nullable"
        int OriginSiteId FK "nullable"
        datetime TripStartTimeUtc "nullable"
        bigint TripStartTrackInfoId "nullable"
        decimal FuelAtDeparture "nullable"
        int ConsecutiveOutOfSitePoints
        int ConsecutiveAtSitePoints
        decimal AccumulatedDistanceKm
        decimal MaxSpeedKph
        datetime LastProcessedPointTimeUtc "nullable"
        datetime LastGpsTimestampUtc "nullable"
        decimal LastLatitude "nullable"
        decimal LastLongitude "nullable"
        int InProgressTripGroupId FK "nullable"
        int InProgressTripId FK "nullable"
        text RecentPointsJson "sliding window buffer"
        text KnownClustersJson "cluster state for Shuttle vehicles"
        datetime CreatedAtUtc
        datetime UpdatedAtUtc
    }

    vehicle_trip_override {
        int VehicleTripOverrideId PK
        int VehicleId FK
        int VehicleTripGroupId FK "nullable"
        int VehicleTripId FK "nullable"
        int SecondaryVehicleTripId FK "nullable — merge"
        int ResultVehicleTripGroupId FK "nullable"
        varchar ActionType "Split|Merge|Reassign|Add|Delete|Adjust"
        text Reason
        int RequestedByUserId FK
        varchar RequestedByName
        varchar RequestIpAddress
        datetime RequestedAtUtc
        tinyint RequiredSupervisorApproval
        text SupervisorApprovalJson "nullable"
        text OriginalValuesJson
        text NewValuesJson
    }

    vehicle_trip_cluster_snapshot {
        int VehicleTripClusterSnapshotId PK
        int VehicleId FK
        date TripDate
        int ClusterIndex
        varchar Label
        varchar Classification "Loading|Dump|Unknown"
        int MatchedSiteId FK "nullable"
        decimal CentroidLatitude
        decimal CentroidLongitude
        int VisitCount
        decimal AverageDwellMinutes
        varchar SnapshotSource
        text MetadataJson "nullable"
        datetime CapturedAtUtc
    }

    vehicle_trip_out_of_bounds_event {
        int VehicleTripOutOfBoundsEventId PK
        int VehicleTripId FK "nullable"
        int VehicleTripGroupId FK "nullable"
        int VehicleId FK
        datetime EventTimeUtc
        decimal Latitude
        decimal Longitude
        varchar Description
        datetime CreatedAtUtc
    }

    site {
        int SiteId PK
        varchar SiteName
        tinyint Classification "0=Unknown 1=Parking 2=Load 3=Dump 4=Fuel 5=Workshop"
        int GpsGeofenceId FK "nullable"
        tinyint IsActive
    }

    gps_geofence_group_member {
        int GpsGeofenceGroupMemberId PK
        int GpsGeofenceGroupId FK
        int GpsGeofenceId FK
    }

    vehicle ||--o{ vehicle_trip_group : "has many"
    vehicle ||--o{ vehicle_trip : "has many"
    vehicle ||--o{ vehicle_trip_state : "has one per day"
    vehicle ||--o{ vehicle_trip_override : "has many"
    vehicle ||--o{ vehicle_trip_cluster_snapshot : "has many per day"

    vehicle_trip_group ||--o{ vehicle_trip : "contains legs"
    vehicle_trip_group ||--o{ vehicle_trip_override : "subject of override"
    vehicle_trip_group ||--o{ vehicle_trip_out_of_bounds_event : "has events"

    vehicle_trip ||--o{ vehicle_trip_override : "subject of override"
    vehicle_trip ||--o{ vehicle_trip_out_of_bounds_event : "has events"

    site ||--o{ vehicle_trip_group : "origin / destination"
    site ||--o{ vehicle_trip : "origin / destination"
    site ||--o{ vehicle_trip_state : "current / origin"
    site ||--o{ vehicle_trip_cluster_snapshot : "matched site"

    gps_geofence ||--o{ vehicle_trip : "origin / destination geofence"
    gps_geofence ||--o{ vehicle_trip_state : "current geofence"
    gps_geofence ||--o{ gps_geofence_group_member : "belongs to groups"

    site }o--o| gps_geofence : "linked geofence"
```

## Tables by Migration Phase

| Phase | SQL File | Tables / Columns Added |
|---|---|---|
| **Phase 1** | `mysql-phase1-trip-management.sql` | `vehicle_trip_group` (core), `vehicle_trip` (core) |
| **Phase 2** | `mysql-phase2-trip-management-persistence.sql` | + `GroupingType`, `ConfidenceScore`, `ConfidenceBand`, `AnomalyFlags`, `ReconciliationStatus` |
| **Phase 3** | `mysql-phase3-trip-management-status-and-fuel.sql` | + `Status`, `TotalFuelConsumed`, `FuelAtDeparture`, `FuelAtArrival`, `FuelConsumed`, `StartTrackInfoId`, `EndTrackInfoId` |
| **Phase 4** | `mysql-phase4-trip-management-state-planning-audit.sql` | + `vehicle_trip_state`, `vehicle_trip_override`, `vehicle_trip_cluster_snapshot`, planning fields (`ProjectPlanId`, `WorkShiftId`, etc.) |
| **Phase 5** | — (schema only: `SiteConfiguration`) | + `site.classification` TINYINT column (0=Unknown, 1=Parking, 2=Load, 3=Dump, 4=Fuel, 5=Workshop) |

## Enum Reference

| Column | Values |
|---|---|
| `Status` | `1 = InProgress`, `2 = Completed` |
| `GroupingType` | `0 = None`, `1 = SingleLeg`, `2 = RoundTrip`, `3 = LoadCycle` |
| `ReconciliationStatus` | `0 = Pending`, `1 = Confirmed`, `2 = Split`, `3 = Merged`, `4 = Adjusted`, `5 = Anomaly` |
| `AnomalyFlags` (bitmask) | `1 = LowConfidence`, `2 = UnknownEndpoint`, `4 = GpsGap`, `8 = OffSiteIdle`, `16 = UnmatchedReturn`, `32 = MissingFuel`, `64 = NegativeFuel`, `128 = UnrealisticSpeed`, `256 = AsymmetricCycle`, `512 = NoReturn`, `1024 = WeakFuel`, `2048 = SuspiciousFuelRate` |
| `ActionType` (override) | `Split`, `Merge`, `Reassign`, `Add`, `Delete`, `Adjust` |
| `Classification` (cluster) | `Loading`, `Dump`, `Unknown` |
| `SiteClassification` (site) | `0 = Unknown`, `1 = Parking`, `2 = Load`, `3 = Dump`, `4 = Fuel`, `5 = Workshop` |
| `CurrentState` (state machine) | `AT_SITE`, `DEPARTING`, `ARRIVING`, `AT_CLUSTER`, `IN_TRANSIT` |
