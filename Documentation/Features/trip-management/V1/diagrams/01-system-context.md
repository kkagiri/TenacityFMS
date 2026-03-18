<!--
File: 01-system-context.md
Purpose: C4 Level 1 System Context diagram for Vehicle Trip Management.
         Shows the system as a single box with all external actors and systems.
Dependencies: PRD.md
Last Modified: 2026-03-12
-->

# System Context — Vehicle Trip Management (C4 Level 1)

The Vehicle Trip Management system is shown as a single boundary. External actors and
systems are placed outside, with labeled relationships showing the primary data
or interaction that flows between them.

```mermaid
C4Context
    title Vehicle Trip Management — System Context

    Person(fleetMgr, "Fleet Manager", "Reviews trip history, triggers recompute, manages overrides")
    Person(dispatcher, "Operations / Dispatch", "Monitors live vehicle positions and in-progress trips")
    Person(auditor, "Fuel Auditor", "Verifies fuel consumption per trip, reviews anomalies")
    Person(siteMgr, "Site Manager", "Monitors tipper cycles and site-level trip counts")
    Person(supervisor, "Supervisor", "Approves overrides on completed / fuel-audited periods")

    System(tripMgmt, "Vehicle Trip Management", "Detects, persists, reconciles, and exposes vehicle trips using a five-layer pipeline")

    System_Ext(gpsgate, "GPSGate", "External GPS tracking platform — pushes live positions via RabbitMQ")
    System_Ext(mysql, "MySQL Database", "Persists trip groups, trip legs, state machines,Q overrides, and cluster snapshots")
    System_Ext(redis, "Redis", "SignalR backplane for real-time event distribution and optional caching")
    System_Ext(reporting, "Reporting Engine", "jsReport / DevExpress — generates trip and fuel audit reports")
    System_Ext(firebase, "Firebase Cloud Messaging", "Push notifications for mobile alerts")
    System_Ext(fmsCore, "FMS Core Modules", "Vehicle, Site, Geofence, Fuel Audit, Dashboard, Rule Engine")

    Rel(gpsgate, tripMgmt, "Pushes GPS positions", "RabbitMQ / SOAP")
    Rel(tripMgmt, mysql, "Reads/writes trip data", "EF Core / Pomelo MySQL")
    Rel(tripMgmt, redis, "Publishes SignalR events, caches state", "StackExchange.Redis")
    Rel(tripMgmt, reporting, "Provides trip data for reports", "REST API")
    Rel(tripMgmt, firebase, "Sends trip anomaly alerts", "FCM HTTP v1")

    Rel(fleetMgr, tripMgmt, "Views trips, triggers recompute, performs overrides", "HTTPS / Browser")
    Rel(dispatcher, tripMgmt, "Monitors live tracking + trip timeline", "HTTPS / SignalR WebSocket")
    Rel(auditor, tripMgmt, "Reviews fuel per trip, triages anomalies", "HTTPS / Browser")
    Rel(siteMgr, tripMgmt, "Monitors tipper cycles and trip counts", "HTTPS / Browser")
    Rel(supervisor, tripMgmt, "Approves override actions on completed periods", "HTTPS / Browser")

    Rel(tripMgmt, fmsCore, "Reads vehicles, sites, geofences, fuel data; writes to dashboard and rule engine", "Internal .NET services")
```

## Actors

| Actor | Role in Trip Management |
|---|---|
| **Fleet Manager** | Primary consumer: reviews trip history, triggers recompute, performs manual overrides |
| **Operations / Dispatch** | Real-time consumer: monitors in-progress trips on the tracking workspace |
| **Fuel Auditor** | Reviews fuel consumption per trip leg, triages anomalies, verifies reconciliation |
| **Site Manager** | Monitors tipper load cycles and per-site trip counts |
| **Supervisor** | Approves override actions that affect already-reconciled or fuel-audited periods |

## External Systems

| System | Interaction |
|---|---|
| **GPSGate** | Source of all GPS position data — pushes via RabbitMQ (consumed by `GPSGateRabbitMQConsumerService`) |
| **MySQL** | Persistence for all trip entities — accessed via EF Core with Pomelo MySQL provider |
| **Redis** | SignalR backplane for distributing real-time trip events across multiple server instances |
| **Reporting Engine** | Consumes trip data via REST API to generate route analysis and fuel audit reports |
| **Firebase** | Delivers push notifications for trip anomaly alerts to mobile users |
| **FMS Core Modules** | Vehicle registry, site/geofence catalog, fuel audit data, dashboard, rule engine — all read by the trip pipeline |
