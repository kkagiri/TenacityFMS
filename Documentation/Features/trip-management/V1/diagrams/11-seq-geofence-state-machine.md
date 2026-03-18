<!--
File: 11-seq-geofence-state-machine.md
Purpose: Point-by-point sequence showing the geofence detector state machine transitions
         including noise filter and edge cases.
Dependencies: PRD.md section 9.1
Last Modified: 2026-03-12
-->

# Sequence: Geofence State Machine — Point-by-Point

Detailed walkthrough of the geofence detector's three-state machine processing
individual GPS points. Includes the N-consecutive-points noise filter and
edge case handling.

```mermaid
sequenceDiagram
    participant GPS as Pre-Processed<br/>GPS Point
    participant SM as GeofenceStateMachine<br/>(per vehicle)
    participant Sites as Site + Geofence<br/>Catalog
    participant State as VehicleTripState<br/>(persisted)
    participant DB as MySQL

    Note over SM: === SCENARIO 1: Normal trip ===
    Note over SM: Vehicle is at Site A (Galana)

    GPS->>SM: Point P1 — inside Galana geofence
    SM->>Sites: Containment test: which geofence?
    Sites-->>SM: Galana
    SM->>State: Update lastSeenTimestamp<br/>State remains AT_SITE

    GPS->>SM: Point P2 — inside Galana geofence
    SM->>State: Still AT_SITE (no action)

    Note over SM: === Single noisy point (drift) ===
    GPS->>SM: Point P3 — outside ALL geofences (GPS drift)
    SM->>State: ConsecutiveOutOfSitePoints = 1
    SM->>SM: N-point guard: 1 < threshold (e.g. 3)<br/>→ stay AT_SITE

    GPS->>SM: Point P4 — back inside Galana geofence
    SM->>State: Reset ConsecutiveOutOfSitePoints = 0<br/>State remains AT_SITE
    Note over SM: ✅ Noise rejected — no false departure

    Note over SM: === Actual departure ===
    GPS->>SM: Point P5 — outside ALL geofences
    SM->>State: ConsecutiveOutOfSitePoints = 1

    GPS->>SM: Point P6 — outside ALL geofences
    SM->>State: ConsecutiveOutOfSitePoints = 2

    GPS->>SM: Point P7 — outside ALL geofences
    SM->>State: ConsecutiveOutOfSitePoints = 3 ≥ threshold
    SM->>SM: Transition: AT_SITE → DEPARTING
    SM->>DB: Create VehicleTripGroup (Status=InProgress)
    SM->>DB: Create VehicleTrip leg (origin=Galana, departure=P5.time)
    SM->>State: Save: OriginSiteId=Galana, TripStartTimeUtc, FuelAtDeparture

    Note over SM: === In transit — accumulating ===
    GPS->>SM: Point P8 — outside ALL geofences
    SM->>SM: State remains DEPARTING
    SM->>State: AccumulatedDistanceKm += haversine(P7, P8)
    SM->>State: Update MaxSpeedKph if P8.speed > current max

    GPS->>SM: Point P9 — outside ALL geofences
    SM->>State: Continue accumulating distance + speed

    Note over SM: === Arrival at Site B ===
    GPS->>SM: Point P10 — inside Kimana geofence
    SM->>Sites: Containment test: which geofence?
    Sites-->>SM: Kimana

    SM->>SM: Transition: DEPARTING → ARRIVING → AT_SITE
    SM->>DB: Complete trip leg:<br/>destination=Kimana, arrival=P10.time,<br/>distance=accumulated, duration=P10.time-P5.time,<br/>fuelAtArrival, fuelConsumed, Status=Completed
    SM->>State: Reset to AT_SITE at Kimana<br/>Clear accumulators

    Note over SM: === EDGE CASE: Geofence overlap ===
    GPS->>SM: Point P11 — inside BOTH Geofence X and Geofence Y
    SM->>Sites: Containment test returns 2 matches
    SM->>SM: Resolve: nearest centroid to point P11<br/>→ choose closer site
    SM->>State: AT_SITE at resolved site

    Note over SM: === EDGE CASE: GPS gap ===
    Note over SM: No points received for 10 minutes while DEPARTING

    GPS->>SM: Point P12 — inside Site C geofence (after gap)
    SM->>SM: Transition DEPARTING → ARRIVING
    SM->>SM: Flag: GpsGapSuspected (bit 4)
    SM->>SM: Reduce confidence score (gap duration-based)
    SM->>DB: Complete trip leg with reduced confidence + anomaly flag

    Note over SM: === EDGE CASE: Extended idle outside geofences ===
    Note over SM: Vehicle has been DEPARTING for 4+ hours, no movement

    SM->>SM: Check idle duration + speed
    SM->>SM: Flag: OffSiteIdleSuspected (bit 8)
    SM->>State: Keep DEPARTING but add anomaly flag
```

## State Transition Summary

| From | To | Trigger | Guard |
|---|---|---|---|
| `AT_SITE` | `DEPARTING` | Point outside all geofences | N consecutive points outside (noise filter) |
| `AT_SITE` | `AT_SITE` | Point still inside current geofence | — |
| `DEPARTING` | `ARRIVING` → `AT_SITE` | Point inside any geofence | — |
| `DEPARTING` | `DEPARTING` | Point outside all geofences | Accumulate distance, update max speed |
| `ARRIVING` | `DEPARTING` | Vehicle exits the new site's geofence | N consecutive points outside |

## Noise Filter Mechanism

The N-consecutive-points guard prevents single GPS drift points from triggering false departures:

```
ConsecutiveOutOfSitePoints < N → stay AT_SITE (increment counter)
ConsecutiveOutOfSitePoints ≥ N → transition to DEPARTING
Point returns inside geofence → reset counter to 0
```

Default threshold `N = 3` (configurable).

## Edge Cases

| Case | Handling |
|---|---|
| **Geofence overlap** | Use nearest centroid distance to resolve which site |
| **GPS gap** | Complete the trip but set `GpsGapSuspected` anomaly flag and reduce confidence |
| **Extended idle outside** | Keep DEPARTING but flag `OffSiteIdleSuspected` for review |
| **Round trip** | `Origin → Destination → same Origin` pattern detected by grouping service post-detection |

## Group-Filtered Detection (Preview Mode)

When `geofenceGroupId` is provided (e.g., from the preview playground), the site catalog
is filtered before detection begins:

```mermaid
sequenceDiagram
    participant Panel as Preview Panel
    participant API as POST /geofence/preview
    participant Handler as PreviewGeofenceDetection<br/>QueryHandler
    participant Service as VehicleTripGeofence<br/>DetectionService
    participant DB as MySQL

    Panel->>API: { vehicleId, fromUtc, toUtc, geofenceGroupId: 42 }
    API->>Handler: GeofenceGroupId = 42
    Handler->>Service: PreviewDetectionAsync(vehicle, from, to, opts, geofenceGroupId: 42)
    Service->>DB: SELECT sites JOIN gps_geofence_group_member<br/>WHERE group_id = 42
    DB-->>Service: Filtered site catalog (only group 42 sites)
    Service->>Service: Run containment tests against filtered sites
    Service-->>Handler: GeofenceDetectionPreviewDTO
    Handler-->>API: FMSResponse<GeofenceDetectionPreviewDTO>
    API-->>Panel: Track points + filtered site geofences
```

## Classification in Containment Test

When a containment test resolves a site, the site’s `Classification` is propagated:

```mermaid
sequenceDiagram
    participant SM as GeofenceStateMachine
    participant Sites as Site Catalog
    participant State as Trip State

    SM->>Sites: Containment test: which site?
    Sites-->>SM: Site "Quarry A", Classification = Load
    SM->>State: CurrentSiteId = Quarry A<br/>CurrentSiteClassification = Load
    Note over SM: On DEPARTING transition:
    SM->>State: OriginSiteClassification = Load
    Note over SM: On ARRIVING at different site:
    SM->>Sites: Containment test: which site?
    Sites-->>SM: Site "Dump B", Classification = Dump
    SM->>State: DestinationSiteClassification = Dump
    Note over SM: Trip leg: Load → Dump
```
