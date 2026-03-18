<!--
File: 21-dataflow-gps-point.md
Purpose: Data flow diagram showing the journey of a single GPS point through
         all systems from device to database.
Dependencies: AGENTS.md, PRD.md
Last Modified: 2026-03-12
-->

# Data Flow: GPS Point Journey

Tracks a single GPS position from the vehicle's tracking device through every
system layer to final persistence and display.

```mermaid
flowchart LR
    subgraph Device["Vehicle"]
        Tracker[GPS Tracking<br/>Device]
    end

    subgraph External["External System"]
        GPSGate[GPSGate Server<br/><small>GPS tracking platform</small>]
    end

    subgraph Messaging["Message Broker"]
        RabbitMQ[(RabbitMQ<br/>Queue)]
    end

    subgraph Backend["FMS Backend (.NET)"]
        direction TB
        Consumer[GPSGateRabbitMQ<br/>ConsumerService<br/><small>BackgroundService</small>]
        subgraph Realtime["Real-Time Path"]
            Dispatcher[VehicleTripRealtime<br/>Dispatcher]
            PreProc[GpsPreProcessor<br/><small>Filter + Enrich</small>]
            SM[State Machine<br/><small>Geofence or Cluster</small>]
        end
        subgraph Hub["SignalR"]
            VTHub[vehicleTrackingHub<br/><small>VehicleLocationUpdate</small>]
            TripHub[vehicleTrackingHub<br/><small>TripStarted/Completed</small>]
        end
    end

    subgraph Database["MySQL"]
        TrackInfo[(track_info<br/>table)]
        TripGroup[(vehicle_trip_group)]
        TripLeg[(vehicle_trip)]
        TripState[(vehicle_trip_state)]
    end

    subgraph Frontend["React Frontend"]
        direction TB
        MapHook[useVehicleTracking<br/>Map.js<br/><small>Vehicle marker update</small>]
        TripHook[useVehicleTracking<br/>Trips.js<br/><small>Trip panel update</small>]
        Map[Map View<br/><small>Vehicle position</small>]
        Panel[Trip Panel<br/><small>Trip list</small>]
    end

    Tracker -->|"cellular/satellite"| GPSGate
    GPSGate -->|"AMQP publish"| RabbitMQ
    RabbitMQ -->|"consume"| Consumer

    Consumer -->|"1. Position broadcast"| VTHub
    Consumer -->|"2. Trip processing"| Dispatcher

    Dispatcher --> PreProc
    PreProc --> SM
    SM -->|"trip events"| TripHub
    SM -->|"persist state"| TripState
    SM -->|"persist trips"| TripGroup
    SM -->|"persist legs"| TripLeg

    Consumer -->|"3. Track storage"| TrackInfo

    VTHub -->|"WebSocket push"| MapHook
    TripHub -->|"WebSocket push"| TripHook

    MapHook --> Map
    TripHook --> Panel

    style Device fill:#f3f4f6,stroke:#6b7280
    style External fill:#fef3c7,stroke:#d97706
    style Messaging fill:#fce7f3,stroke:#db2777
    style Backend fill:#e0f2fe,stroke:#0284c7
    style Database fill:#fef2f2,stroke:#dc2626
    style Frontend fill:#f0fdf4,stroke:#16a34a
```

## Data Transformations

| Stage | Input | Transformation | Output |
|---|---|---|---|
| **Device → GPSGate** | Raw NMEA/proprietary protocol | Device protocol decoding | Normalized position record |
| **GPSGate → RabbitMQ** | HTTP callback / internal | AMQP message serialization | JSON message on queue |
| **RabbitMQ → Consumer** | AMQP message | Deserialization, validation | .NET object (vehicle position) |
| **Consumer → SignalR** | Position object | Broadcast packaging | `VehicleLocationUpdate` event |
| **Consumer → PreProcessor** | Position object | Filter (invalid, duplicate, jumps), Enrich (distance, time delta, geofence containment) | Enriched GPS point |
| **PreProcessor → State Machine** | Enriched point | State transition evaluation | Trip state change + trip events |
| **State Machine → DB** | Trip leg/group DTOs | EF Core entity mapping | MySQL rows in trip tables |
| **State Machine → SignalR** | Trip events | Event packaging | `TripStarted` / `TripCompleted` events |
| **SignalR → Frontend** | WebSocket events | Redux state update | UI re-render (map markers + trip list) |

## Dual-Write Pattern

The consumer performs three parallel writes from a single GPS point:

1. **Position broadcast** (SignalR) — immediate map update
2. **Trip processing** (state machine pipeline) — trip detection and persistence
3. **Track storage** (track_info table) — raw GPS track for historical replay

These are independent operations — a failure in trip processing does not block
position broadcasting or track storage.

## Latency Budget

| Segment | Typical Latency |
|---|---|
| Device → GPSGate | 1–5 seconds (cellular) |
| GPSGate → RabbitMQ | < 100ms |
| RabbitMQ → Consumer | < 50ms |
| Consumer → SignalR broadcast | < 10ms |
| Consumer → Trip processing | 50–200ms |
| SignalR → Frontend render | < 100ms |
| **End-to-end (device → map)** | **2–6 seconds** |
| **End-to-end (device → trip update)** | **2–7 seconds** |
