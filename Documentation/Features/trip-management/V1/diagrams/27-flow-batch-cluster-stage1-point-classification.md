<!--
File: 27-flow-batch-cluster-stage1-point-classification.md
Purpose: ASCII flow diagram for Stage 1 (Point Classification) of the batch cluster detection pipeline.
Dependencies: VehicleTripClusterDetectionService.cs ExtractStops(), VehicleTripClusterDetectionOptions.cs
Last Modified: 2026-03-16
-->

# Stage 1 — Point Classification + Stop Grouping
## Batch Cluster Detection Pipeline

### Position in the pipeline

```
 Stage 0 — Data Load          ✓ done
 Stage 1 — Point Classification + Stop Grouping   ◄── YOU ARE HERE
 Stage 2 — Stop Duration Filter
 Stage 3 — Cluster Formation
 Stage 4 — Trip Leg Validation
```

---

### Operational context reminder

The fleet day looks like this:

```
  PARKING / DEPOT             ← vehicle sits overnight or between shifts
       │
       │  departs (start of shift)
       ▼
  ┌─► LOAD POINT              ← picks up material, pauses briefly
  │    │
  │    │  haul leg (loaded)
  │    │    ↳ brief road stop (< MinimumStopDurationMinutes)
  │    │        → DISCARDED by duration gate — trip leg stays intact ✓
  │    │    ↳ long road stop (weighbridge / boom gate / traffic queue)
  │    │        → KEPT as stop → becomes Transit cluster
  │    │        → splits the Load→Dump leg into two legs ✗
  │    ▼
  │  DUMP / CLUSTER SITE      ← offloads, may queue or park briefly
  │    │
  │    │  return leg (empty)
  │    │    ↳ same road-stop rules apply on the return
  │    │
  └────┘  ← repeats N times per shift (Load→Dump→Load→Dump→…)
       │
       │  end of shift
       ▼
  PARKING / DEPOT             ← vehicle returns for the night
```

A typical day produces this stop sequence:

```
  Parking  Load  Dump  Load  Dump  Load  Dump  …  Parking
  ─┬────── ─┬─── ─┬─── ─┬─── ─┬─── ─┬─── ─┬───  ──┬─────
   │long    │brief│brief│brief│brief│brief│brief   │long
   dwell    dwell dwell dwell dwell dwell dwell    dwell
```

Stage 1 must "see" all three stop types — parking, load, dump.
If any of them is too fast or too brief to pass the speed test,
it will not become a stop candidate and the cluster/trip picture
will be wrong about where legs start and end.

The Load and Dump stops repeat many times — they should cluster
together in Stage 3. Parking appears only at the bookends.

---

### What Stage 1 does

Stage 1 is implemented entirely inside `ExtractStops()`.
It walks the cleaned point list from Stage 0 left to right
and groups consecutive slow points into candidate stops.

The two-step logic inside the loop:

```
FOR each point in cleaned list (index 0 → N-1):
    │
    ├─ read Speed  (defaults to 0 if GPS did not report a value)
    │
    ├─ IS SLOW?  speed <= StopSpeedThresholdKph
    │   │
    │   YES ──► NEW STOP or EXTEND CURRENT STOP
    │   │        if currentStop == null:
    │   │            open a new candidate stop
    │   │              SequenceNo     = next available
    │   │              StartTrackIndex = this index
    │   │              EndTrackIndex   = this index
    │   │              StartTimeUtc    = this point timestamp
    │   │              reset latitudeSum, longitudeSum, pointCount
    │   │        regardless:
    │   │            extend currentStop
    │   │              EndTrackIndex = this index
    │   │              EndTimeUtc    = this point timestamp
    │   │              latitudeSum  += point.Latitude
    │   │              longitudeSum += point.Longitude
    │   │              pointCount++
    │   │        continue to next point
    │   │
    │   NO ───► SPEED ROSE — VEHICLE MOVED
    │            finalize currentStop (see FinalizeStopIfEligible below)
    │            currentStop = null
    │            continue to next point
    │
END OF LOOP
    finalize any currentStop that was still open at end of data
    (vehicle was still stopped when the time window closed)
```

---

### FinalizeStopIfEligible — the duration gate

This is where Stage 2's minimum-duration filter actually lives in code.
It runs inside Stage 1's loop so the two stages share one pass.

```
FinalizeStopIfEligible(stops, currentStop, latSum, lonSum, count, opts)
    │
    ├─ currentStop == null  → nothing to do, return
    ├─ pointCount <= 0      → nothing to do, return
    │
    ├─ compute DurationMinutes
    │       = (EndTimeUtc - StartTimeUtc).TotalMinutes
    │
    ├─ DurationMinutes < MinimumStopDurationMinutes ?
    │       YES → DISCARD  (too brief, traffic light / slow crawl)
    │       NO  → KEEP
    │
    └─ if KEEP:
           Latitude  = Round(latitudeSum / pointCount, 8)   ← centroid
           Longitude = Round(longitudeSum / pointCount, 8)
           add to stops list
```

Setting used:

```
  MinimumStopDurationMinutes
  ◄──────────────────────────────────────────────────────────────────►
  default: 1.5 minutes
  source:  VehicleTripClusterDetectionOptions.cs  (MinimumStopDurationMinutes)
  section: VehicleTrips:Cluster:Batch
```

---

### Speed gate in this fleet's context

```
  StopSpeedThresholdKph  (default 3 km/h)
  ◄──────────────────────────────────────────────────────────────────►

  PARKING / DEPOT
    Vehicle is stationary.  Speed = 0 km/h.
    EVERY point passes the speed gate.
    → long run of slow points
    → large candidate stop
    → easily passes duration gate
    → becomes a PARKING STOP ✓

  LOAD POINT
    Vehicle pulls in, stops engine or idles.
    Speed approaches 0.  May still read 1–2 km/h from GPS noise.
    With default 3 km/h threshold: most load points PASS.
    Risk: if loading is quick (< 1.5 min), duration gate removes it.
    This is the most common missed stop for this fleet.

  DUMP / CLUSTER SITE
    Vehicle pulls up, tips, pulls away.
    Similar to load point.
    Queue wait time can be long → duration gate easily passed.
    But if the vehicle barely stops (quick tip), it may be missed.

  SLOW TRAFFIC / ROAD HAZARD
    Vehicle slows to < 3 km/h momentarily.
    Duration usually < 1.5 min → DISCARDED by duration gate. ✓
    If congestion is sustained, it may create a false stop.
    Lower threshold or raise duration to suppress.

  HAUL LEG ROAD STOP  (between Load Point and Dump Site)
    Examples: weighbridge, boom gate, level crossing, traffic queue.
    Speed drops to 0 km/h — EVERY point passes the speed gate.
    Duration decides the outcome:

      < MinimumStopDurationMinutes (1.5 min)
          → DISCARDED ✓  no stop created, haul leg stays intact

      ≥ MinimumStopDurationMinutes
          → KEPT as a candidate stop
          → will cluster into a Transit cluster (not Parking/Load/Dump)
          → Load→Dump haul leg is split into two shorter legs
          → both legs must individually pass the trip gates in Stage 4
          → fix: raise MinimumStopDurationMinutes (e.g. 1.5 → 4–6 min)
            so brief weighbridge queues are filtered out
```

---

### Full data flow for Stage 1

```
 IReadOnlyList<TrackPointDTO>
 (from Stage 0, N points, time-ordered)
        │
        ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │  ExtractStops(points, opts)                                      │
 │                                                                  │
 │  For each point:                                                 │
 │                                                                  │
 │  speed <= StopSpeedThresholdKph (3 km/h) ?                      │
 │       YES                        NO                             │
 │        │                          │                             │
 │  accumulate into              FinalizeStopIfEligible             │
 │  currentStop                  ├─ duration >= 1.5 min → KEEP     │
 │  (centroid sum)               └─ duration  < 1.5 min → DISCARD  │
 │        │                          │                             │
 │        └──────────────────────────┘                             │
 │                                                                  │
 │  End of points: finalize any remaining currentStop              │
 │                                                                  │
 │  Output: List<VehicleTripDetectedStopDTO>                        │
 │    each stop has:                                                │
 │      SequenceNo                                                  │
 │      StartTrackIndex / EndTrackIndex                             │
 │      StartTimeUtc / EndTimeUtc                                   │
 │      DurationMinutes                                             │
 │      Latitude / Longitude  (centroid of all slow points)        │
 │      Address (first non-null from slow points)                   │
 └──────────────────────────────────────────────────────────────────┘
        │
        ▼
 List<VehicleTripDetectedStopDTO>
 (filtered, centroided candidate stops)
 ready for Stage 2 — Cluster Formation
```

---

### Most important interactions for this fleet

```
 PROBLEM                          ROOT CAUSE IN STAGE 1
 ─────────────────────────────────────────────────────────────────────
 Load point stop never appears     Load pause < 1.5 min
                                   → lower MinimumStopDurationMinutes
                                   OR confirm vehicle actually stops
                                   long enough (> 1.5 min) on site

 Parking stop appears as           Vehicle moves off slowly,
 two separate stops                GPS speed fluctuates around
                                   threshold during departure
                                   → raise StopSpeedThresholdKph
                                   slightly (e.g. 3 → 4)

 Too many false stops in queues    Slow queue traffic < 3 km/h
 or road humps                     but > 1.5 min
                                   → raise MinimumStopDurationMinutes
                                   (e.g. 1.5 → 3 min)

 Dump stop never appears           Quick tip, vehicle barely stops
                                   → lower MinimumStopDurationMinutes
                                   OR raise StopSpeedThresholdKph

 Haul leg split into two legs      Road stop (weighbridge / gate)
 by a Transit cluster               was ≥ 1.5 min
                                   → raise MinimumStopDurationMinutes
                                   (e.g. 1.5 → 4–6 min) to filter these
                                   out while keeping load/dump stops

 All three place types have stops  Stage 1 is correctly tuned.
 but clusters are wrong            → move to Stage 2 tuning
```

---

### Key source locations

| Code                          | File                                       | Line  |
|-------------------------------|--------------------------------------------|-------|
| `ExtractStops` entry point    | `VehicleTripClusterDetectionService.cs`    | ~337  |
| Speed test `speed <= threshold` | `VehicleTripClusterDetectionService.cs`  | ~347  |
| Open new candidate stop       | `VehicleTripClusterDetectionService.cs`    | ~350  |
| Extend current stop           | `VehicleTripClusterDetectionService.cs`    | ~362  |
| `FinalizeStopIfEligible`      | `VehicleTripClusterDetectionService.cs`    | ~383  |
| Duration gate                 | `VehicleTripClusterDetectionService.cs`    | ~396  |
| Centroid calculation          | `VehicleTripClusterDetectionService.cs`    | ~401  |
| `StopSpeedThresholdKph` default    | `VehicleTripClusterDetectionOptions.cs` | ~13   |
| `MinimumStopDurationMinutes` default | `VehicleTripClusterDetectionOptions.cs` | ~14 |

---

**Previous:** [Stage 0 — Data Load](26-flow-batch-cluster-stage0-data-load.md)
**Next:** [Stage 2 — Cluster Formation](28-flow-batch-cluster-stage2-cluster-formation.md)
