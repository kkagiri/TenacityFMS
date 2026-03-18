<!--
File: 16-state-trip-lifecycle.md
Purpose: State machine showing the lifecycle of a VehicleTripGroup from creation
         through completion, reconciliation, override, and potential anomaly flagging.
Dependencies: PRD.md, database schema
Last Modified: 2026-03-12
-->

# State Machine: Trip Lifecycle

End-to-end lifecycle of a `VehicleTripGroup` record from real-time detection
through reconciliation and optional manual override.

```mermaid
stateDiagram-v2
    [*] --> InProgress : Real-time detection<br/>creates group<br/>(Status=1)

    InProgress --> InProgress : Additional legs appended<br/>/ distance & fuel accumulate

    InProgress --> Completed : Vehicle arrives at destination<br/>/ finalize all metrics<br/>(Status=2)

    Completed --> Confirmed : End-of-day reconciliation<br/>/ real-time matches batch<br/>(ReconciliationStatus=1)

    Completed --> Split : Reconciliation finds<br/>real-time:1 → batch:2<br/>(ReconciliationStatus=2)

    Completed --> Merged : Reconciliation finds<br/>real-time:2 → batch:1<br/>(ReconciliationStatus=3)

    Completed --> Adjusted : Reconciliation finds<br/>time/distance differ<br/>(ReconciliationStatus=4)

    Completed --> Anomaly : Reconciliation flags<br/>unresolvable issues<br/>(ReconciliationStatus=5)

    Confirmed --> Superseded_Split : Manual override: Split<br/>/ original marked superseded<br/>/ two new groups created
    Confirmed --> Superseded_Merge : Manual override: Merge<br/>/ both originals superseded<br/>/ one new group created
    Confirmed --> Superseded_Delete : Manual override: Delete
    Confirmed --> Confirmed : Manual override: AdjustTimes<br/>/ times updated in-place
    Confirmed --> Confirmed : Manual override: ReassignSite<br/>/ site updated in-place

    Anomaly --> Confirmed : Manual override resolves anomaly
    Anomaly --> Superseded_Delete : Manual override: Delete

    Split --> Confirmed : Reconciliation auto-resolves
    Merged --> Confirmed : Reconciliation auto-resolves
    Adjusted --> Confirmed : Reconciliation auto-resolves

    Superseded_Split --> [*] : Archived (original record kept for audit)
    Superseded_Merge --> [*] : Archived
    Superseded_Delete --> [*] : Archived

    note right of InProgress
        Created by:
        • GeofenceStateMachine
        • ClusterStateMachine

        Visible on Tracking page
        as "in progress" trip
    end note

    note right of Completed
        ReconciliationStatus = 0 (Pending)
        Awaiting nightly reconciliation
    end note

    note right of Anomaly
        AnomalyFlags bitmask set
        Requires manual review
    end note

    note left of Superseded_Split
        DetectionMode updated to:
        "Superseded:Split:{newGroupId}"

        Original preserved in DB
        for audit trail
    end note
```

## Status Values

| Entity | Field | Values |
|---|---|---|
| `VehicleTripGroup` / `VehicleTrip` | `Status` | `1 = InProgress`, `2 = Completed` |
| `VehicleTripGroup` / `VehicleTrip` | `ReconciliationStatus` | `0 = Pending`, `1 = Confirmed`, `2 = Split`, `3 = Merged`, `4 = Adjusted`, `5 = Anomaly` |
| Superseded records | `DetectionMode` | `"Superseded:{action}:{newGroupId}"` |

## Lifecycle Events

| Transition | Triggered By | Side Effects |
|---|---|---|
| → InProgress | State machine creates a new trip | `TripStarted` SignalR event |
| InProgress → Completed | Vehicle arrives at destination | `TripCompleted` SignalR event, fuel + distance finalized |
| Completed → Confirmed | Reconciliation (matches batch) | `ReconciliationStatus` stamped |
| Completed → Split/Merged/Adjusted | Reconciliation (differs from batch) | Original records overwritten with batch values |
| Completed → Anomaly | Reconciliation (unresolvable) | `AnomalyFlags` bitmask set, appears in anomaly reports |
| Confirmed → Superseded* | Manual override (Split/Merge/Delete) | Audit trail in `vehicle_trip_override`, original preserved |
| Anomaly → Confirmed | Manual override resolves the issue | Override audit recorded |

## Override Supersession Model

When a manual override creates new records (Split, Merge, Add):

1. **Original record**: `DetectionMode` updated to `"Superseded:{action}:{newGroupId}"`
2. **New record(s)**: `DetectionMode` set to `"ManualOverride:{action}"`
3. **Audit**: `vehicle_trip_override` row captures full before/after JSON
4. **Query filter**: Default queries exclude superseded records (filter on `DetectionMode NOT LIKE 'Superseded%'`)

```mermaid
graph LR
    A[Original Trip<br/>DetectionMode: 'Geofence'] -->|Split Override| B[Superseded Record<br/>DetectionMode: 'Superseded:Split:42']

    B -.->|creates| C[New Trip A<br/>DetectionMode: 'ManualOverride:Split']
    B -.->|creates| D[New Trip B<br/>DetectionMode: 'ManualOverride:Split']

    E[vehicle_trip_override] -.->|audit links| B
    E -.->|audit result| C
    E -.->|audit result| D
```

## Anomaly Resolution Paths

| Anomaly | Possible Resolution |
|---|---|
| `MissingFuelData` | AdjustTimes to align with available fuel window |
| `NegativeFuelConsumption` | AdjustTimes or Reassign (refill happened at different site) |
| `UnrealisticSpeed` | Delete (GPS artifact) or AdjustTimes |
| `GpsGapSuspected` | Split into two trips at the gap boundary |
| `NoReturnToOrigin` | Merge with a later trip or Add a manual return trip |
| `AsymmetricCycle` | Add missing trip leg to balance the cycle |
