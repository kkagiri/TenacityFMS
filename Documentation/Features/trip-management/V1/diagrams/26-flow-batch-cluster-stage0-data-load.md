<!--
File: 26-flow-batch-cluster-stage0-data-load.md
Purpose: ASCII flow diagram for Stage 0 (Data Load) of the batch cluster detection pipeline.
Dependencies: VehicleTripClusterDetectionService.cs, VehicleTripGpsPreProcessor.cs
Last Modified: 2026-03-16
-->

# Stage 0 — Data Load
## Batch Cluster Detection Pipeline

### Operational context (this fleet)

In this operation the vehicle day follows one pattern:

```
  PARKING / DEPOT
       │
       │  vehicle departs
       ▼
  LOAD POINT          ←── where material is picked up
       │
       │  vehicle travels
       ▼
  DUMP / CLUSTER      ←── where material is delivered
       │                   (may be a named site or a cluster centroid)
       │  vehicle returns
       ▼
  PARKING / DEPOT
```

The vehicle does not start at a load point.  It **starts at parking**.
Stages 1–5 of the pipeline must produce stops and clusters that map cleanly
onto this shape.  If the algorithm produces trip legs that begin at a load
point instead of at parking, the most likely cause is that the parking stop
was too short to survive Stage 3's minimum-stop-duration filter.

---

Stage 0 is everything that happens before the algorithm sees a single speed
value.  Its job is to hand the rest of the pipeline a clean, time-ordered list
of GPS points that is small enough to process quickly but complete enough to be
accurate.

It has three sequential sub-steps:

```
 CALLER
 (DetectTripsAsync  or  PreviewDetectionAsync)
        │
        │  inputs
        │    vehicleId
        │    fromUtc
        │    toUtc
        │    maxTrackPoints   ◄── VehicleTripClusterDetectionOptions.MaxTrackPoints
        │                         default: 5 000
        ▼
╔══════════════════════════════════════════════════════════════════════╗
║  SUB-STEP A — GPS FETCH                                              ║
║  IGPSService.GetTrackPointsAsync(vehicleId, from, to, maxPoints)    ║
║                                                                      ║
║  Route:                                                              ║
║    VehicleTrackingServiceAdapter                                     ║
║        └─► GPSGateLocationService.GetTrackPointsAsync               ║
║                └─► GPSGate REST API  /tracks?maxPoints=N            ║
║                                                                      ║
║  Each raw point contains:                                            ║
║    Timestamp, Latitude, Longitude, Altitude                          ║
║    Speed (km/h), Heading                                             ║
║    IsValid, SatelliteCount                                           ║
║    FuelLevel, IgnitionStatus                                         ║
║    TrackInfoId                                                       ║
║                                                                      ║
║  The provider honours maxPoints as an upper cap.                     ║
║  It does NOT guarantee the most recent N points specifically;        ║
║  it returns up to N points within the requested time window.         ║
╚══════════════════════════════════════════════════════════════════════╝
        │
        │  if GetTrackPointsAsync returns IsSuccess = false
        │    DetectTripsAsync  → throw InvalidOperationException
        │    PreviewDetectionAsync → return empty preview
        │
        ▼  List<TrackPointDTO>  (raw, unfiltered, up to maxTrackPoints)
╔══════════════════════════════════════════════════════════════════════╗
║  SUB-STEP B — GPS PRE-PROCESSOR                                      ║
║  VehicleTripGpsPreProcessor.ProcessAsync(vehicleId, rawPoints)      ║
║                                                                      ║
║  Walks raw points in timestamp order.                                ║
║  Each point passes three independent gates before it is kept.        ║
║                                                                      ║
║  ┌─ GATE 1: BASE VALIDITY ─────────────────────────────────────┐    ║
║  │  DROP if  IsValid = false                                    │    ║
║  │  DROP if  Latitude = 0  AND  Longitude = 0                  │    ║
║  │  DROP if  SatelliteCount <= 0                               │    ║
║  │  DROP if  SatelliteCount < MinimumSatelliteCount (option)   │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║            │ passes → ENRICH                                         ║
║            │   compute DistanceFromPreviousKm (Haversine)           ║
║            │   compute TimeDeltaSeconds                              ║
║            ▼                                                         ║
║  ┌─ GATE 2: DUPLICATE CHECK ───────────────────────────────────┐    ║
║  │  DROP if  distance <= DuplicateDistanceMeters               │    ║
║  │           AND                                               │    ║
║  │           timeDelta <= DuplicateTimeWindowSeconds           │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║            │ passes                                                   ║
║            ▼                                                         ║
║  ┌─ GATE 3: IMPOSSIBLE JUMP CHECK ────────────────────────────┐    ║
║  │  DROP if  distance > MaxPositionJumpKm                      │    ║
║  │           AND                                               │    ║
║  │           implied speed > MaximumImpliedSpeedKph            │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║            │ passes → SITE LOOKUP                                    ║
║            │   query Sites table (cached in memory for the batch)   ║
║            │   test each active site geofence (circle or polygon)   ║
║            │   if inside a site:                                     ║
║            │     set ContainingSiteId                               ║
║            │     set ContainingGeofenceId                           ║
║            │     set ContainingSiteName                             ║
║            │                                                         ║
║            └─► ACCEPT point into processed list                      ║
╚══════════════════════════════════════════════════════════════════════╝
        │
        ▼  List<TrackPointDTO>  (valid, enriched, with site assignments)
╔══════════════════════════════════════════════════════════════════════╗
║  SUB-STEP C — SORT + GUARD                                           ║
║                                                                      ║
║  points = points.OrderBy(point => point.Timestamp)                  ║
║                                                                      ║
║  if points.Count < 2                                                 ║
║    → abort pipeline                                                  ║
║    DetectTripsAsync     returns []                                   ║
║    PreviewDetectionAsync returns preview (TotalTrackPoints = N)      ║
╚══════════════════════════════════════════════════════════════════════╝
        │
        ▼  IReadOnlyList<TrackPointDTO>
           clean, time-ordered, enriched, site-labelled
           ready for Stage 1 (Point Classification)
```

---

## What each sub-step contributes

```
Sub-step   What it removes / adds                 Why it matters
─────────────────────────────────────────────────────────────────────
A  Fetch   Imposes the maxTrackPoints ceiling.     Keeps processing time
                                                   bounded regardless of
                                                   how long the time window
                                                   is.

B  Filter  Removes bad-fix points, zero-island     Prevents phantom stops
           points, duplicates, and GPS jumps.      and phantom trips that
           Adds delta-distance, delta-time, and    would otherwise appear
           containing-site to every kept point.    from noise.

C  Sort    Forces strict chronological order.      The stop-grouping loop
           Aborts if fewer than 2 points remain.   in Stage 1 depends on
                                                   consecutive-index order.
```

---

## Failure modes at Stage 0

```
Symptom in preview                  Likely cause in Stage 0
────────────────────────────────────────────────────────────────────
TotalTrackPoints = 0                GPS provider returned no data
                                    for the selected vehicle / window.

TotalTrackPoints very low for       maxTrackPoints cap was hit.
a long date range                   Raise maxTrackPoints or narrow
                                    the date range.

TotalTrackPoints = N in preview     All points within the window were
but Stops = 0                       accepted by pre-processor but none
                                    were slow enough to trigger a stop
                                    in Stage 1. (This is a Stage 1
                                    issue, not Stage 0.)

Preview aborts immediately          points.Count < 2 guard fired.
with no stops/clusters/legs         Either the GPS window had only
                                    one valid point or the
                                    pre-processor dropped all but one.
```

---

## Key source locations

| Code                                           | File                                          | Line  |
|------------------------------------------------|-----------------------------------------------|-------|
| `GetTrackPointsAsync` call (detect)            | `VehicleTripClusterDetectionService.cs`       | ~54   |
| `GetTrackPointsAsync` call (preview)           | `VehicleTripClusterDetectionService.cs`       | ~232  |
| `ProcessAsync` — full pre-processor            | `VehicleTripGpsPreProcessor.cs`               | ~38   |
| `IsBasePointValid`                             | `VehicleTripGpsPreProcessor.cs`               | ~105  |
| `IsDuplicate`                                  | `VehicleTripGpsPreProcessor.cs`               | ~131  |
| `IsImpossibleJump`                             | `VehicleTripGpsPreProcessor.cs`               | ~140  |
| Site lookup inside pre-processor               | `VehicleTripGpsPreProcessor.cs`               | ~83   |
| Sort + guard (detect path)                     | `VehicleTripClusterDetectionService.cs`       | ~62   |
| Sort + guard (preview path)                    | `VehicleTripClusterDetectionService.cs`       | ~243  |

---

**Next:** [Stage 1 — Point Classification](27-flow-batch-cluster-stage1-point-classification.md)
