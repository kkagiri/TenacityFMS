<!--
File: 17-flow-five-layer-pipeline.md
Purpose: Flow diagram showing the five-layer trip detection pipeline architecture.
Dependencies: PRD.md section 8, SERVICES_README.md
Last Modified: 2026-03-12
-->

# Flow: Five-Layer Trip Detection Pipeline

The core orchestration pipeline processes GPS data through five layers in sequence.
Each layer has a specific responsibility and well-defined inputs/outputs.

```mermaid
flowchart TD
    Start([GPS Points Input]) --> L1

    subgraph L1["Layer 1 — Pre-Processing"]
        direction TB
        L1A[Receive raw GPS points] --> L1B{Filter}
        L1B -->|Invalid coords| L1Reject[Reject — lat/lng = 0]
        L1B -->|Zero satellites| L1Reject2[Reject — no GPS fix]
        L1B -->|Duplicate timestamp| L1Reject3[Reject — dedup]
        L1B -->|Valid| L1C[Enrich point]
        L1C --> L1D[Compute Haversine distance from prev point]
        L1C --> L1E[Compute time delta from prev point]
        L1C --> L1F[Test geofence containment]
        L1D --> L1G[Check impossible speed / jump]
        L1G -->|Jump > threshold| L1Reject4[Reject — teleport]
        L1G -->|Normal| L1H[Add to sliding window buffer]
        L1E --> L1H
        L1F --> L1H
    end

    L1H --> L2

    subgraph L2["Layer 2 — Detection"]
        direction TB
        L2A{Vehicle Movement<br/>Profile?}
        L2A -->|SiteToSite| L2B[Geofence State Machine<br/><small>VehicleTripGeofenceStateMachine</small>]
        L2A -->|Shuttle/Tipper| L2C[Cluster State Machine<br/><small>VehicleTripClusterStateMachine</small>]

        L2B --> L2D[Trip legs with<br/>site-based endpoints]
        L2C --> L2E[Trip legs with<br/>cluster-based endpoints]
        L2D --> L2F[Raw VehicleTripDetectionResultDTO array]
        L2E --> L2F
    end

    L2F --> L3

    subgraph L3["Layer 3 — Enrichment & Scoring"]
        direction TB
        L3A[Fuel Context Service<br/><small>VehicleTripFuelContextService</small>]
        L3A --> L3B[Attach FuelAtDeparture,<br/>FuelAtArrival, FuelConsumed]
        L3B --> L3C[Confidence Scoring Service<br/><small>VehicleTripConfidenceScoringService</small>]
        L3C --> L3D[Score: 0.0–1.0]
        L3C --> L3E[Band: High/Medium/Low]
        L3C --> L3F[AnomalyFlags: bitmask]
    end

    L3D --> L4
    L3E --> L4
    L3F --> L4

    subgraph L4["Layer 4 — Grouping"]
        direction TB
        L4A[Grouping Service<br/><small>VehicleTripGroupingService</small>]
        L4A --> L4B{Pattern?}
        L4B -->|A → B → A| L4C[GroupingType: RoundTrip]
        L4B -->|A → B → A → B → ..| L4D[GroupingType: LoadCycle]
        L4B -->|A → B only| L4E[GroupingType: SingleLeg]
        L4B -->|Unclassified| L4F[GroupingType: None]

        L4C --> L4G[Group-level scoring]
        L4D --> L4G
        L4E --> L4G
        L4F --> L4G

        L4G --> L4H[VehicleTripGroupedDetectionDTO array]
    end

    L4H --> L5

    subgraph L5["Layer 5 — Persistence"]
        direction TB
        L5A[Map DTOs → EF entities]
        L5A --> L5B[Upsert VehicleTripGroup records]
        L5A --> L5C[Upsert VehicleTrip records]
        L5B --> L5D[Update VehicleTripState]
        L5C --> L5D
        L5D --> L5E[SaveChangesAsync — single transaction]
    end

    L5E --> Done([Pipeline Complete])

    style L1 fill:#e0f2fe,stroke:#0284c7
    style L2 fill:#fef3c7,stroke:#d97706
    style L3 fill:#f0fdf4,stroke:#16a34a
    style L4 fill:#fdf4ff,stroke:#a855f7
    style L5 fill:#fef2f2,stroke:#dc2626
```

## Layer Responsibilities

| Layer | Service | Input | Output |
|---|---|---|---|
| **1 — Pre-Processing** | `VehicleTripGpsPreProcessor` | Raw GPS track points | Filtered, enriched, buffered points |
| **2 — Detection** | `VehicleTripGeofenceDetectionService` or `VehicleTripClusterDetectionService` | Enriched points | Raw trip legs (`VehicleTripDetectionResultDTO[]`) |
| **3 — Enrichment & Scoring** | `VehicleTripFuelContextService` + `VehicleTripConfidenceScoringService` | Raw trip legs + track points | Fuel-enriched, scored legs with anomaly flags |
| **4 — Grouping** | `VehicleTripGroupingService` + `VehicleTripConfidenceScoringService.ScoreGroups` | Scored trip legs | Grouped trips (`VehicleTripGroupedDetectionDTO[]`) |
| **5 — Persistence** | `GpsdataContext` | Grouped trip DTOs | Database records (EF entities) |

## Filter Statistics (Layer 1)

Points rejected by the pre-processor are silently dropped. Typical rejection rates:

| Filter | Typical Rejection Rate |
|---|---|
| Invalid coordinates (0,0) | < 0.1% |
| Zero satellites | 1–3% |
| Duplicate timestamps | < 0.5% |
| Impossible speed jumps | < 0.2% |

## Detection Engine Selection (Layer 2)

| Vehicle Movement Profile | Detection Engine | Trip Endpoint Source |
|---|---|---|
| `SiteToSite` | `VehicleTripGeofenceStateMachine` | Known site geofences |
| `Shuttle` / `Tipper` | `VehicleTripClusterStateMachine` | Progressively discovered clusters |

## Grouping Patterns (Layer 4)

| Pattern | Example | GroupingType |
|---|---|---|
| A → B → A | Galana → Kimana → Galana | `RoundTrip` |
| A → B → A → B → A | Loading → Dump → Loading → Dump → Loading | `LoadCycle` |
| A → B | Galana → Kimana (no return within day) | `SingleLeg` |
| Unclassifiable | Insufficient data or ambiguous pattern | `None` |

## Execution Modes

| Mode | Trigger | Layers Used |
|---|---|---|
| **Real-time** | Each GPS point as it arrives | L1 → L2 (incremental), L5 |
| **Batch (Recompute)** | User-triggered `RecomputeVehicleTripsCommand` | L1 → L2 → L3 → L4 → L5 (full) |
| **Batch (Reconciliation)** | Nightly `VehicleTripReconciliationBackgroundService` | L1 → L2 → L3 → L4 → L5 (full), then compare |
