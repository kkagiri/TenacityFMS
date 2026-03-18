<!--
File: 09-seq-manual-override.md
Purpose: Sequence diagram showing the manual override flow from operator action
         through validation, mutation, audit trail, and frontend refresh.
Dependencies: PRD.md section 11, SERVICES_README.md
Last Modified: 2026-03-12
-->

# Sequence: Manual Override

An operator selects a correction action in the Override Panel. The request flows
through validation, mutation, and audit before returning to the frontend.

```mermaid
sequenceDiagram
    participant Operator as Operator<br/>(Fleet Manager)
    participant UI as VehicleTripOverridePanel.js
    participant Service as vehicleTripService.js
    participant API as VehicleTripsController
    participant Handler as Override Command<br/>Handler (e.g. SplitVehicle<br/>TripCommandHandler)
    participant Validation as VehicleTripManualOverride<br/>ValidationService
    participant Override as VehicleTripManualOverride<br/>Service
    participant Factory as VehicleTripManualOverride<br/>Factory (static)
    participant Audit as VehicleTripOverride<br/>AuditService
    participant ModeHelper as VehicleTripDetection<br/>ModeHelper (static)
    participant DB as MySQL<br/>(GpsdataContext)

    Operator->>UI: Select action (e.g. "Split Trip")
    Operator->>UI: Fill fields (splitTimeUtc, reason)
    Operator->>UI: Click "Apply"

    UI->>UI: Client-side validation (reason min length, required fields)
    UI->>Service: splitVehicleTrip({ vehicleTripGroupId, vehicleTripId, splitTimeUtc, reason })
    Service->>API: POST /vehicletrips/override/split

    API->>Handler: MediatR dispatch SplitVehicleTripCommand

    Note over Handler: Step 1 — Delegate to override service
    Handler->>Override: SplitTripAsync(command)

    Note over Override: Step 2 — Validate
    Override->>Validation: ValidateSplitRequest(request)
    Validation->>DB: Load target VehicleTripGroup (hydrate legs)
    Validation->>Validation: Check: reason present?
    Validation->>Validation: Check: requester ID valid?
    Validation->>DB: Load all trips for vehicle in time range
    Validation->>Validation: Check: split time within trip boundaries?
    Validation->>Validation: Check: resulting trips don't overlap?

    alt Period has finalized fuel audit
        Validation->>Validation: Require supervisor approval
        alt No approval provided
            Validation-->>Override: Validation failed — supervisor required
            Override-->>Handler: FMSResponse.Fail("Supervisor approval required")
            Handler-->>API: BadRequest
            API-->>Service: 400
            Service-->>UI: Show error toast
            UI-->>Operator: "Supervisor approval required"
            Note over Operator: Operator obtains supervisor approval<br/>and resubmits with supervisorApproval flag
        end
    end

    Validation-->>Override: Validation passed

    Note over Override: Step 3 — Execute mutation
    Override->>Factory: Clone mutable state from trip group
    Override->>Factory: Build two new trip groups from split point
    Override->>ModeHelper: Encode "ManualOverride:Split" detection mode
    Override->>ModeHelper: Encode "Superseded:Split:{newGroupId}" on original
    Override->>DB: Mark original group as superseded
    Override->>DB: Insert two new trip groups + legs

    Note over Override: Step 4 — Write audit trail
    Override->>Factory: Build audit payload (original values, new values)
    Override->>Audit: RecordAsync(auditPayload)
    Audit->>DB: INSERT into vehicle_trip_override

    Override->>Factory: Build FMSResponse
    Override-->>Handler: FMSResponse.Success(overrideResult)
    Handler-->>API: Ok(result)
    API-->>Service: 200 + response
    Service-->>UI: Unwrap FMSResponse
    UI->>UI: Show success toast
    UI->>Service: Refresh trip detail (GET /vehicletrips/{groupId})
    UI-->>Operator: Updated trip detail panel
```

## Six Override Actions

| Action | Command | Key Validation |
|---|---|---|
| **Split** | `SplitVehicleTripCommand` | Split time must be within trip boundaries |
| **Merge** | `MergeVehicleTripsCommand` | Trips must be consecutive for the same vehicle |
| **Reassign Site** | `ReassignVehicleTripSiteCommand` | Target site must exist (when siteId provided) |
| **Add Trip** | `AddVehicleTripCommand` | Time range must not overlap existing trips |
| **Delete Trip** | `DeleteVehicleTripCommand` | Trip must exist and not already be superseded |
| **Adjust Times** | `AdjustVehicleTripTimesCommand` | Arrival cannot be before departure; no overlaps |

## Validation Checks (All Actions)

| Check | Description |
|---|---|
| Mandatory reason | `reason` field must be non-empty |
| Valid requester | `requestedByUserId` must reference a valid user |
| Timeline check | Resulting trips must not create overlaps in the vehicle's schedule |
| Physics check | Arrival time cannot precede departure time |
| Fuel audit lock | If the period has a finalized fuel audit, supervisor approval is required |

## Audit Trail Record

Every override writes to `vehicle_trip_override`:

| Field | Source |
|---|---|
| `ActionType` | The action performed (Split, Merge, etc.) |
| `OriginalValuesJson` | Snapshot of the trip group before mutation |
| `NewValuesJson` | Snapshot of the trip group after mutation |
| `RequestedByUserId` / `RequestedByName` | Operator identity from JWT |
| `RequestIpAddress` | Captured from HTTP context |
| `Reason` | Operator-provided justification text |
| `SupervisorApprovalJson` | If supervisor approval was required and provided |
