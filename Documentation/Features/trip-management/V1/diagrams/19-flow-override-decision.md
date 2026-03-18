<!--
File: 19-flow-override-decision.md
Purpose: Flow diagram showing the decision tree for manual override validation.
Dependencies: PRD.md section 11, VehicleTripManualOverrideValidationService.cs
Last Modified: 2026-03-12
-->

# Flow: Manual Override Decision Tree

Validation and execution flow when an operator submits any of the six override actions.
Implemented in `VehicleTripManualOverrideValidationService` and `VehicleTripManualOverrideService`.

```mermaid
flowchart TD
    Start([Operator submits<br/>override request]) --> ParseAction

    ParseAction{Action Type?}

    ParseAction -->|Split| SplitFlow
    ParseAction -->|Merge| MergeFlow
    ParseAction -->|ReassignSite| ReassignFlow
    ParseAction -->|Add| AddFlow
    ParseAction -->|Delete| DeleteFlow
    ParseAction -->|AdjustTimes| AdjustFlow

    subgraph Common["Common Validation (all actions)"]
        direction TB
        V1{Reason<br/>provided?}
        V1 -->|No| Fail1[❌ "Reason is required"]
        V1 -->|Yes| V2{Requester ID<br/>valid?}
        V2 -->|No| Fail2[❌ "Invalid requester"]
        V2 -->|Yes| V3{Trip group<br/>exists?}
        V3 -->|No| Fail3[❌ "Trip group not found"]
        V3 -->|Yes| V4{Trip group<br/>already superseded?}
        V4 -->|Yes| Fail4[❌ "Cannot modify superseded trip"]
        V4 -->|No| V5{Fuel audit<br/>period finalized?}
        V5 -->|Yes| V6{Supervisor<br/>approval provided?}
        V6 -->|No| Fail5[❌ "Supervisor approval required"]
        V6 -->|Yes| ActionSpecific
        V5 -->|No| ActionSpecific[Continue to<br/>action-specific validation]
    end

    SplitFlow --> V1
    MergeFlow --> V1
    ReassignFlow --> V1
    AddFlow --> V1
    DeleteFlow --> V1
    AdjustFlow --> V1

    ActionSpecific --> SplitVal & MergeVal & ReassignVal & AddVal & DeleteVal & AdjustVal

    subgraph SplitVal["Split Validation"]
        S1{Split time within<br/>trip boundaries?}
        S1 -->|No| SFail[❌ "Split time out of range"]
        S1 -->|Yes| S2{Resulting trips<br/>have valid duration?}
        S2 -->|No| SFail2[❌ "Split would create<br/>zero-duration trip"]
        S2 -->|Yes| SPass[✅ Proceed with split]
    end

    subgraph MergeVal["Merge Validation"]
        M1{Two trip groups<br/>provided?}
        M1 -->|No| MFail[❌ "Two trips required"]
        M1 -->|Yes| M2{Same vehicle?}
        M2 -->|No| MFail2[❌ "Trips must be<br/>same vehicle"]
        M2 -->|Yes| M3{Trips consecutive<br/>in time?}
        M3 -->|No| MFail3[❌ "Trips must be<br/>consecutive"]
        M3 -->|Yes| MPass[✅ Proceed with merge]
    end

    subgraph ReassignVal["Reassign Validation"]
        R1{Target site<br/>provided?}
        R1 -->|Yes| R2{Site exists<br/>in system?}
        R1 -->|No| R1null{Clearing site<br/>(set to null)?}
        R1null -->|Yes| RPass
        R1null -->|No| RFail[❌ "Site required"]
        R2 -->|No| RFail2[❌ "Site not found"]
        R2 -->|Yes| RPass[✅ Proceed with reassign]
    end

    subgraph AddVal["Add Trip Validation"]
        A1{From/To times<br/>provided?}
        A1 -->|No| AFail[❌ "Times required"]
        A1 -->|Yes| A2{From < To?}
        A2 -->|No| AFail2[❌ "Invalid time range"]
        A2 -->|Yes| A3{Overlaps existing<br/>trip for this vehicle?}
        A3 -->|Yes| AFail3[❌ "Time range overlaps<br/>existing trip"]
        A3 -->|No| APass[✅ Proceed with add]
    end

    subgraph DeleteVal["Delete Validation"]
        D1{Trip exists and<br/>not superseded?}
        D1 -->|No| DFail[❌ "Cannot delete"]
        D1 -->|Yes| DPass[✅ Proceed with delete]
    end

    subgraph AdjustVal["Adjust Times Validation"]
        T1{New times<br/>provided?}
        T1 -->|No| TFail[❌ "Times required"]
        T1 -->|Yes| T2{Arrival after<br/>departure?}
        T2 -->|No| TFail2[❌ "Invalid sequence"]
        T2 -->|Yes| T3{Would create<br/>overlap with adjacent?}
        T3 -->|Yes| TFail3[❌ "Overlap detected"]
        T3 -->|No| TPass[✅ Proceed with adjust]
    end

    SPass --> Execute
    MPass --> Execute
    RPass --> Execute
    APass --> Execute
    DPass --> Execute
    TPass --> Execute

    Execute[Execute Mutation<br/><small>VehicleTripManualOverrideService</small>]
    Execute --> Audit[Write Audit Trail<br/><small>VehicleTripOverrideAuditService</small>]
    Audit --> Response([FMSResponse.Success])

    Fail1 & Fail2 & Fail3 & Fail4 & Fail5 --> ErrorResponse([FMSResponse.Fail])
    SFail & SFail2 & MFail & MFail2 & MFail3 --> ErrorResponse
    RFail & RFail2 & AFail & AFail2 & AFail3 --> ErrorResponse
    DFail & TFail & TFail2 & TFail3 --> ErrorResponse

    style Common fill:#fef3c7,stroke:#d97706
    style SplitVal fill:#e0f2fe,stroke:#0284c7
    style MergeVal fill:#e0f2fe,stroke:#0284c7
    style ReassignVal fill:#e0f2fe,stroke:#0284c7
    style AddVal fill:#e0f2fe,stroke:#0284c7
    style DeleteVal fill:#e0f2fe,stroke:#0284c7
    style AdjustVal fill:#e0f2fe,stroke:#0284c7
```

## Validation Summary

| Check | Applies To | Error Message |
|---|---|---|
| Reason required | All actions | "Reason is required for all manual overrides" |
| Valid requester | All actions | "Invalid requester user ID" |
| Trip group exists | All actions | "Trip group not found" |
| Not superseded | All actions | "Cannot modify a superseded trip — it has already been overridden" |
| Supervisor approval (if locked period) | All actions | "This period has a finalized fuel audit. Supervisor approval required." |
| Split time in bounds | Split | "Split time must be within the trip's departure and arrival window" |
| Non-zero duration result | Split | "Split would create a trip with zero or negative duration" |
| Two trips, same vehicle | Merge | "Merge requires two trip groups for the same vehicle" |
| Consecutive in time | Merge | "Trips must be consecutive with no gap or overlap" |
| Target site exists | Reassign | "Target site does not exist" |
| Time range valid | Add, AdjustTimes | "Departure must be before arrival" |
| No overlaps | Add, AdjustTimes | "New time range overlaps with an existing trip for this vehicle" |

## Supervisor Approval

When a fuel audit period is finalized:
1. Override request is rejected with HTTP 400 and message
2. Operator must obtain supervisor approval (out-of-band)
3. Resubmit with `supervisorApproval` field populated
4. `vehicle_trip_override.SupervisorApprovalJson` stores the approval details
