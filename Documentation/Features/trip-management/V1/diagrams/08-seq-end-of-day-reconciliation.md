<!--
File: 08-seq-end-of-day-reconciliation.md
Purpose: Sequence diagram showing the nightly end-of-day reconciliation flow.
Dependencies: PRD.md section 10, SERVICES_README.md
Last Modified: 2026-03-12
-->

# Sequence: End-of-Day Reconciliation

The reconciliation service runs after midnight (or on demand) to clean up real-time
detection artifacts by replaying the full day's GPS data in batch and comparing
against the real-time trip records.

```mermaid
sequenceDiagram
    participant Scheduler as VehicleTripReconciliation<br/>BackgroundService
    participant ReconService as VehicleTripReconciliation<br/>Service
    participant Orch as VehicleTripOrchestration<br/>Service
    participant Detection as Detection Engine<br/>(Geofence or Cluster)
    participant Fuel as VehicleTripFuel<br/>ContextService
    participant Scoring as VehicleTripConfidence<br/>ScoringService
    participant Grouping as VehicleTripGrouping<br/>Service
    participant DB as MySQL<br/>(GpsdataContext)

    Scheduler->>Scheduler: Trigger: midnight schedule or on-demand command
    Scheduler->>DB: Load vehicles with trips from yesterday

    loop For each vehicle
        Scheduler->>ReconService: ReconcileAsync(vehicleId, yesterday, previewOnly=false)

        Note over ReconService: Step 1 — REPLAY
        ReconService->>Orch: Run full detection pipeline for entire day
        Orch->>Detection: Detect trips from full day GPS data
        Detection-->>Orch: Raw trip legs (batch)
        Orch->>Fuel: Enrich legs with fuel data
        Fuel-->>Orch: Fuel-enriched legs
        Orch->>Scoring: Score individual legs
        Scoring-->>Orch: Scored legs with anomaly flags
        Orch->>Grouping: Group legs (RoundTrip / LoadCycle)
        Grouping-->>Orch: Grouped trip results
        Orch->>Scoring: Score groups
        Scoring-->>Orch: Scored groups
        Orch-->>ReconService: Batch detection results

        Note over ReconService: Step 2 — COMPARE
        ReconService->>DB: Load existing real-time trip groups for vehicle/day
        ReconService->>ReconService: Align batch trips with real-time trips<br/>(match by overlapping time windows)

        Note over ReconService: Step 3 — CLASSIFY
        loop For each aligned pair
            ReconService->>ReconService: Compare site, time tolerance, distance
            alt Same trips within tolerance
                ReconService->>ReconService: Mark as CONFIRMED
            else Real-time has 1, batch has 2
                ReconService->>ReconService: Mark as SPLIT (batch wins)
            else Real-time has 2, batch has 1
                ReconService->>ReconService: Mark as MERGED (batch wins)
            else Times or distance differ beyond tolerance
                ReconService->>ReconService: Mark as ADJUSTED (batch wins)
            else Unmatched (only in real-time or only in batch)
                ReconService->>ReconService: Mark as ANOMALY
            end
        end

        Note over ReconService: Step 4 — APPLY
        ReconService->>DB: Overwrite real-time records with batch versions
        ReconService->>DB: Stamp ReconciliationStatus on each group

        Note over ReconService: Step 5 — ANOMALY FLAGGING
        ReconService->>ReconService: Check: missing fuel data?
        ReconService->>ReconService: Check: negative consumption?
        ReconService->>ReconService: Check: impossible speeds?
        ReconService->>ReconService: Check: tipper cycle asymmetry?
        ReconService->>ReconService: Check: vehicle never returned?
        ReconService->>DB: Update AnomalyFlags bitmask

        ReconService-->>Scheduler: VehicleTripReconciliationResultDTO<br/>(counts per outcome category)
    end

    Scheduler->>Scheduler: Log summary (confirmed/split/merged/adjusted/anomaly counts)
```

## Reconciliation Outcome Categories

| Category | Condition | Resolution |
|---|---|---|
| **Confirmed** | Same trips, same sites, times within tolerance | Keep real-time records as-is, stamp `ReconciliationStatus = 1` |
| **Split** | Real-time: 1 trip → Batch: 2 trips | Batch version wins — single record split into two |
| **Merged** | Real-time: 2 trips → Batch: 1 trip | Batch version wins — two records merged into one |
| **Adjusted** | Same trip count, but times/distance differ | Batch version wins — values updated |
| **Anomaly** | Unmatched trips, or anomaly conditions flagged | Flagged for manual review |

## Anomaly Checks Performed

| Check | Anomaly Flag Bit | Description |
|---|---|---|
| Missing fuel data | `32` (MissingFuelData) | No fuel telemetry during trip window |
| Negative consumption | `64` (NegativeFuelConsumption) | Fuel at arrival > fuel at departure |
| Impossible speed | `128` (UnrealisticSpeed) | Speed exceeds physically plausible threshold |
| Tipper cycle asymmetry | `256` (AsymmetricCycle) | Loading/dump visits don't pair evenly |
| No return to origin | `512` (NoReturnToOrigin) | Vehicle departed but never returned to any known site |

## Trigger Modes

| Mode | Source | How |
|---|---|---|
| **Scheduled** | `VehicleTripReconciliationBackgroundService` | Fires after midnight, processes previous day |
| **On-demand** | `ReconcileVehicleTripsCommand` via API | `POST /vehicletrips/reconcile` (permission-gated) |
| **Preview** | Same command with `previewOnly = true` | Returns diff without writing to database |
