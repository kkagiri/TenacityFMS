<!--
File: 20-flow-reconciliation-comparison.md
Purpose: Flow diagram showing the comparison algorithm used during end-of-day
         reconciliation to align real-time and batch trip records.
Dependencies: PRD.md section 10, VehicleTripReconciliationService.cs
Last Modified: 2026-03-12
-->

# Flow: Reconciliation Comparison Algorithm

The comparison step within reconciliation that aligns real-time trip groups with
batch-detected trip groups and classifies each into an outcome category.

```mermaid
flowchart TD
    Start([Input: Real-time trips<br/>+ Batch trips<br/>for one vehicle/day]) --> Sort

    Sort[Sort both lists by<br/>StartTimeUtc ascending] --> Align

    Align[Create alignment pairs<br/>by overlapping time windows] --> Loop

    Loop{More unaligned<br/>trips?}
    Loop -->|No| Summary
    Loop -->|Yes| GetNext

    GetNext[Take next real-time trip R<br/>and overlap candidates from batch B] --> MatchCount

    MatchCount{How many<br/>batch trips<br/>overlap R?}

    MatchCount -->|0 overlapping| Orphan
    MatchCount -->|1 overlapping| OnePair
    MatchCount -->|2+ overlapping| MultiMatch

    %% Orphan path
    Orphan[R has no batch counterpart<br/>→ real-time only trip] --> OrphanCheck
    OrphanCheck{B has trips<br/>without R counterpart?}
    OrphanCheck -->|Yes, batch-only trips| AnomalyBoth[Mark R and unmatched B<br/>as ANOMALY<br/><small>ReconciliationStatus=5</small>]
    OrphanCheck -->|No| AnomalyR[Mark R as ANOMALY<br/>Possible false positive<br/>from real-time detection]

    %% 1:1 pair
    OnePair[R paired with single B] --> CompareSites

    CompareSites{Origin & Destination<br/>sites match?}
    CompareSites -->|No| SiteDiffer[Sites differ → ADJUSTED<br/><small>ReconciliationStatus=4</small>]
    CompareSites -->|Yes| CompareTimes

    CompareTimes{|StartTimeUtc - B.StartTimeUtc|<br/>< tolerance (5 min)?<br/>AND<br/>|EndTimeUtc - B.EndTimeUtc|<br/>< tolerance (5 min)?}
    CompareTimes -->|No| TimeDiffer

    TimeDiffer{Distance within<br/>10% tolerance?}
    TimeDiffer -->|Yes| AdjustedTime[Times differ → ADJUSTED<br/>Update times from batch]
    TimeDiffer -->|No| AdjustedBoth[Times + distance differ<br/>→ ADJUSTED]

    CompareTimes -->|Yes| CompareDistance

    CompareDistance{|DistanceKm - B.DistanceKm|<br/>< 10% tolerance?}
    CompareDistance -->|No| AdjustedDist[Distance differs → ADJUSTED<br/>Update distance from batch]
    CompareDistance -->|Yes| CompareFuel

    CompareFuel{|FuelConsumed - B.FuelConsumed|<br/>< tolerance?}
    CompareFuel -->|No| AdjustedFuel[Fuel differs → ADJUSTED<br/>Update fuel from batch]
    CompareFuel -->|Yes| Confirmed[✅ CONFIRMED<br/><small>ReconciliationStatus=1</small>]

    %% Multi-match: batch found more trips than real-time
    MultiMatch[R maps to 2+ batch trips] --> SplitDecision
    SplitDecision[Real-time missed a trip boundary<br/>→ SPLIT<br/><small>ReconciliationStatus=2</small>] --> SplitAction
    SplitAction[Delete original R<br/>Insert 2+ batch trips<br/>Link via ReconciliationStatus]

    %% Check reverse: multiple real-time → single batch
    Loop -->|Multiple R overlap<br/>single B| MergeDecision
    MergeDecision[Real-time created extra trip<br/>→ MERGED<br/><small>ReconciliationStatus=3</small>] --> MergeAction
    MergeAction[Delete extra R records<br/>Insert single batch trip<br/>Link via ReconciliationStatus]

    %% Apply outcomes
    Confirmed --> Apply
    SiteDiffer --> Apply
    AdjustedTime --> Apply
    AdjustedBoth --> Apply
    AdjustedDist --> Apply
    AdjustedFuel --> Apply
    SplitAction --> Apply
    MergeAction --> Apply
    AnomalyBoth --> Apply
    AnomalyR --> Apply

    Apply[Apply batch values<br/>to database records<br/><small>Overwrite real-time with batch</small>] --> Loop

    Summary([Output:<br/>VehicleTripReconciliation<br/>ResultDTO])

    style Confirmed fill:#f0fdf4,stroke:#16a34a
    style AnomalyBoth fill:#fef2f2,stroke:#dc2626
    style AnomalyR fill:#fef2f2,stroke:#dc2626
    style SplitDecision fill:#fef3c7,stroke:#d97706
    style MergeDecision fill:#fef3c7,stroke:#d97706
    style SiteDiffer fill:#e0f2fe,stroke:#0284c7
    style AdjustedTime fill:#e0f2fe,stroke:#0284c7
    style AdjustedBoth fill:#e0f2fe,stroke:#0284c7
    style AdjustedDist fill:#e0f2fe,stroke:#0284c7
    style AdjustedFuel fill:#e0f2fe,stroke:#0284c7
```

## Comparison Tolerances

| Dimension | Tolerance | Rule |
|---|---|---|
| **Time** (start/end) | ± 5 minutes | Absolute difference between real-time and batch timestamps |
| **Distance** | ± 10% | Relative difference `|R-B| / max(R,B)` |
| **Fuel** | ± 5% or ± 2 litres (whichever is larger) | Compensates for interpolation differences |
| **Site match** | Exact | Origin and destination site IDs must match exactly |

## Alignment Algorithm

1. **Sort** both real-time and batch lists by `StartTimeUtc` ascending
2. **Sliding window**: For each real-time trip R, find all batch trips B where time windows overlap:
   - `B.StartTimeUtc < R.EndTimeUtc + tolerance` AND `B.EndTimeUtc > R.StartTimeUtc - tolerance`
3. **Classify** based on overlap cardinality and value comparison

## Outcome Distribution (Typical)

| Outcome | Typical Frequency | Description |
|---|---|---|
| **Confirmed** | 70–85% | Most real-time trips match batch exactly |
| **Adjusted** | 10–20% | Minor time/distance differences from different processing context |
| **Split** | 2–5% | Real-time missed an intermediate stop that batch found |
| **Merged** | 1–3% | Real-time created a false boundary (noise) that batch smoothed out |
| **Anomaly** | 1–5% | Genuine issues requiring human review |

## Result DTO

```
VehicleTripReconciliationResultDTO
├── VehicleId
├── TripDate
├── Confirmed        (count)
├── Split            (count)
├── Merged           (count)
├── Adjusted         (count)
├── Anomaly          (count)
├── TotalRealtime    (count — before reconciliation)
├── TotalBatch       (count — batch pipeline produced)
└── TotalFinal       (count — after reconciliation applied)
```
