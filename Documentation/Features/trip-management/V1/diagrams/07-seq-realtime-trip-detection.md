<!--
File: 07-seq-realtime-trip-detection.md
Purpose: Sequence diagram showing the real-time trip detection flow from GPS point
         arrival through to frontend update.
Dependencies: PRD.md, SERVICES_README.md, FRONTEND_PRD.md
Last Modified: 2026-03-12
-->

# Sequence: Real-Time Trip Detection

A GPS point arrives from GPSGate, flows through the five-layer pipeline, and reaches
the frontend. This diagram shows the happy path for a geofence-based detection
(cluster detection follows the same flow with a different state machine).

```mermaid
sequenceDiagram
    participant GPSGate as GPSGate Server
    participant RabbitMQ as RabbitMQ
    participant Consumer as GPSGateRabbitMQ<br/>ConsumerService
    participant Dispatcher as VehicleTripRealtime<br/>Dispatcher
    participant PreProc as VehicleTripGps<br/>PreProcessor
    participant StateMachine as GeofenceStateMachine<br/>(per vehicle)
    participant Detection as VehicleTripGeofence<br/>DetectionService
    participant DB as MySQL<br/>(GpsdataContext)
    participant SignalR as dashboardHub<br/>(SignalR)
    participant Frontend as React Frontend

    GPSGate->>RabbitMQ: Publish GPS position (AMQP)
    RabbitMQ->>Consumer: Deliver message

    Consumer->>Consumer: Deserialise position payload
    Consumer->>SignalR: Broadcast VehicleLocationUpdate
    Consumer->>Dispatcher: Forward point for trip processing

    Dispatcher->>DB: Load VehicleTripState for vehicle + today
    Dispatcher->>Dispatcher: Read vehicle.MovementProfile

    alt MovementProfile = SiteToSite
        Dispatcher->>StateMachine: Process point (Geofence SM)
    else MovementProfile = Shuttle
        Dispatcher->>StateMachine: Process point (Cluster SM)
    end

    StateMachine->>PreProc: PreProcess([recentPoints + newPoint])
    PreProc->>PreProc: Filter (invalid, duplicate, zero sat, impossible jump)
    PreProc->>PreProc: Enrich (Haversine distance, time delta, geofence containment)
    PreProc->>PreProc: Buffer (sliding window)
    PreProc-->>StateMachine: Return enriched + filtered points

    StateMachine->>Detection: Evaluate state transition
    Detection->>DB: Load active sites with geofences

    alt Vehicle exited geofence (N consecutive points outside)
        Detection-->>StateMachine: Transition AT_SITE → DEPARTING
        StateMachine->>DB: Create trip group + trip leg (Status = InProgress)
        StateMachine->>SignalR: Emit TripStarted event
    else Vehicle entered geofence
        Detection-->>StateMachine: Transition DEPARTING → ARRIVING
        StateMachine->>DB: Complete trip leg (distance, duration, fuel, Status = Completed)
        StateMachine->>SignalR: Emit TripCompleted event
    else Still in transit
        Detection-->>StateMachine: Stay DEPARTING (accumulate distance)
        StateMachine->>SignalR: Emit TripInProgress event (periodic)
    end

    StateMachine->>DB: Persist updated VehicleTripState

    SignalR->>Frontend: Push trip event via WebSocket

    Note over Frontend: ⚠️ Frontend does not yet listen<br/>for trip events (Gap #1).<br/>Falls back to 30s polling.

    Frontend->>Frontend: useVehicleTrackingTrips polls<br/>GET /vehicletrips every 30s
```

## Participants

| Participant | Actual Component |
|---|---|
| GPSGate Server | External GPS tracking platform |
| RabbitMQ | Message broker (AMQP) |
| GPSGateRabbitMQConsumerService | `FMS.BackgroundServices/VehicleTracking/GPSGateRabbitMQConsumerService.cs` |
| VehicleTripRealtimeDispatcher | `FMS.Application/Features/VehicleTrips/StateMachines/VehicleTripRealtimeDispatcher.cs` |
| VehicleTripGpsPreProcessor | `FMS.Application/Features/VehicleTrips/Services/VehicleTripGpsPreProcessor.cs` |
| GeofenceStateMachine | `FMS.Application/Features/VehicleTrips/StateMachines/VehicleTripGeofenceStateMachine.cs` |
| VehicleTripGeofenceDetectionService | `FMS.Application/Features/VehicleTrips/Services/VehicleTripGeofenceDetectionService.cs` |
| MySQL (GpsdataContext) | `FMS.Persistence/DataAccess/GpsdataContext.cs` |
| dashboardHub (SignalR) | SignalR hub — publishes `TripStarted`, `TripInProgress`, `TripCompleted` |
| React Frontend | `useVehicleTrackingTrips.js` + `vehicleTrackingSignalRService.js` |

## Key Behaviors

1. **Position and trip processing are decoupled**: The consumer broadcasts the position update via SignalR immediately (so the map updates), then forwards the point to the trip dispatcher asynchronously.
2. **State recovery**: The dispatcher loads `VehicleTripState` from the database on each point, ensuring recovery after service restart.
3. **Noise filtering**: The PreProcessor's sliding window and the N-consecutive-points guard prevent single noisy points from triggering false state transitions.
4. **In-progress persistence**: Trips in DEPARTING/IN_TRANSIT state are persisted with `Status = InProgress` so the API can return them for the tracking page.
