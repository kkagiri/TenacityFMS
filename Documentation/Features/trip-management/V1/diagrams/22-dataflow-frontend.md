<!--
File: 22-dataflow-frontend.md
Purpose: Data flow diagram showing how trip data flows through the frontend
         from API/SignalR to rendered UI components.
Dependencies: FRONTEND_PRD.md, frontend source files
Last Modified: 2026-03-12
-->

# Data Flow: Frontend Trip Data

How trip data flows through the React frontend — from API calls and SignalR events
through Redux state to rendered DevExtremea components.

```mermaid
flowchart TD
    subgraph DataSources["Data Sources"]
        API["/api/v1/vehicletrips<br/><small>REST API</small>"]
        SignalR["vehicleTrackingHub<br/><small>SignalR WebSocket</small>"]
    end

    subgraph ServiceLayer["Service Layer"]
        TripService["vehicleTripService.js<br/><small>Axios HTTP client</small>"]
        SignalRService["vehicleTrackingSignalRService.js<br/><small>SignalR connection manager</small>"]
    end

    subgraph Hooks["Custom Hooks"]
        UseTripData["useVehicleTrackingTrips.js<br/><small>30s polling, trip list state</small>"]
        UseRealtime["useVehicleTrackingRealtime.js<br/><small>SignalR event subscription</small>"]
        UseMap["useVehicleTrackingMap.js<br/><small>Map marker management</small>"]
    end

    subgraph State["Component State"]
        TripList["tripGroups[]<br/><small>Array of trip groups</small>"]
        SelectedTrip["selectedTripGroupId<br/><small>Currently viewed trip</small>"]
        MapMarkers["vehicleMarkers[]<br/><small>Map position data</small>"]
        InProgress["inProgressTrips[]<br/><small>Active trip indicators</small>"]
    end

    subgraph UIComponents["UI Components"]
        direction TB
        TrackingPage["VehicleTrackingPage.js<br/><small>Page container</small>"]
        Workspace["VehicleTrackingWorkspace<br/>Layout.js<br/><small>Three-panel layout</small>"]
        TripPanel["VehicleTrackingTripPanel.js<br/><small>Trip list panel</small>"]
        DetailPopup["VehicleTrackingDetailPopup.js<br/><small>Trip detail modal</small>"]
        MapView["Map Component<br/><small>Google Maps / Leaflet</small>"]
        Badges["VehicleTripBadges.js<br/><small>Status + anomaly badges</small>"]
    end

    subgraph TripsPage["Vehicle Trips Page (Standalone)"]
        direction TB
        TripsPageComp["VehicleTripsPage.js<br/><small>Full page with DataGrid</small>"]
        TripsDetail["VehicleTripDetailPanel.js<br/><small>Slide-out detail</small>"]
        TripsOverride["VehicleTripOverridePanel.js<br/><small>Override actions</small>"]
    end

    %% Data flow: API
    API -->|"HTTP GET"| TripService
    TripService -->|"getVehicleTrips()"| UseTripData
    TripService -->|"getVehicleTripDetail()"| TripsDetail

    %% Data flow: SignalR
    SignalR -->|"VehicleLocationUpdate"| SignalRService
    SignalR -->|"tripStarted"| SignalRService
    SignalR -->|"tripInProgress"| SignalRService
    SignalR -->|"tripCompleted"| SignalRService
    SignalRService -->|"event callbacks"| UseRealtime
    SignalRService -->|"position updates"| UseMap

    %% Hooks to state
    UseTripData -->|"setState"| TripList
    UseTripData -->|"setState"| InProgress
    UseRealtime -->|"update"| InProgress
    UseMap -->|"setState"| MapMarkers

    %% State to UI: Tracking Page
    TripList --> TripPanel
    SelectedTrip --> DetailPopup
    MapMarkers --> MapView
    InProgress --> TripPanel

    %% State to UI: Trips Page
    TripList --> TripsPageComp
    SelectedTrip --> TripsDetail
    TripsDetail --> TripsOverride

    %% Badge rendering
    TripPanel -->|"each trip row"| Badges
    TripsPageComp -->|"each DataGrid row"| Badges
    DetailPopup -->|"header section"| Badges

    %% UI structure
    TrackingPage --> Workspace
    Workspace --> TripPanel
    Workspace --> MapView
    Workspace --> DetailPopup

    style DataSources fill:#fef3c7,stroke:#d97706
    style ServiceLayer fill:#e0f2fe,stroke:#0284c7
    style Hooks fill:#fdf4ff,stroke:#a855f7
    style State fill:#f0fdf4,stroke:#16a34a
    style UIComponents fill:#fef2f2,stroke:#dc2626
    style TripsPage fill:#f3f4f6,stroke:#6b7280
```

## Two Entry Points

| Page | URL | Purpose |
|---|---|---|
| **Vehicle Tracking Page** | `/vehicletracking` | Real-time map + trip panel, operational monitoring |
| **Vehicle Trips Page** | `/vehicles/trips` | Historical trip management with DataGrid, overrides |

Both pages use the same `vehicleTripService.js` and `VehicleTripBadges.js`.

## Preview Playground Data Flow

The detection preview playground is a third data flow path with a distinct pattern:
server provides raw data, then all detection runs locally in the browser.

```mermaid
flowchart TD
    subgraph PreviewAPI["Preview API"]
        ClusterAPI["POST /vehicletrips/cluster/preview<br/><small>Returns track points + detected stops/clusters</small>"]
        GeofenceAPI["POST /vehicletrips/geofence/preview<br/><small>Returns track points + site geofences with geometry + classification</small>"]
        GroupsAPI["GET /Geofence/groups<br/><small>Returns geofence groups for dropdown</small>"]
    end

    subgraph PreviewService["Service Layer"]
        TripSvc["vehicleTripService.js<br/><small>previewClusterDetection()<br/>previewGeofenceDetection()<br/>fetchGeofenceGroups()</small>"]
    end

    subgraph PreviewPanel["ClusterDetectionPreviewPanel.js"]
        ModeToggle["Mode Toggle<br/><small>Cluster / Geofence</small>"]
        TrackSource["trackSource (cached)<br/><small>Raw track data from server</small>"]
        Playground["playground state<br/><small>Threshold sliders + settings</small>"]
        Result["result state<br/><small>Processed detection output</small>"]
        GroupFilter["Geofence Group Dropdown<br/><small>Visible in Geofence mode only</small>"]
    end

    subgraph LocalReplay["Local Detection (browser-side)"]
        ClusterAlgo["clusterDetectionPlayground.js<br/><small>DBSCAN, stop detection,<br/>trip leg builder</small>"]
        GeofenceAlgo["geofenceDetectionPlayground.js<br/><small>Ray-casting, Haversine containment,<br/>state machine, classification propagation</small>"]
    end

    subgraph PreviewUI["Preview UI Components"]
        PMap["ClusterDetectionPreviewMap.js<br/><small>Track + overlays + classification colors</small>"]
        PResults["ClusterDetectionPreviewResults.js<br/><small>Grids: stops/site visits + trip legs<br/>+ ClassificationBadge</small>"]
        PCharts["ClusterDetectionPreviewCharts.js<br/><small>Speed profile + state band chart<br/>+ classifyGeofencePoints()</small>"]
        PInsights["VehicleTripClusterPreviewInsights.js<br/><small>Analytics explorer strips</small>"]
    end

    %% API → Service
    ClusterAPI -->|"HTTP POST"| TripSvc
    GeofenceAPI -->|"HTTP POST"| TripSvc
    GroupsAPI -->|"HTTP GET"| TripSvc

    %% Service → Panel
    TripSvc -->|"server response"| TrackSource
    TripSvc -->|"groups list"| GroupFilter

    %% Panel → Local replay
    TrackSource -->|"mode=Cluster"| ClusterAlgo
    TrackSource -->|"mode=Geofence"| GeofenceAlgo
    Playground -->|"threshold change"| ClusterAlgo
    Playground -->|"threshold change"| GeofenceAlgo
    GroupFilter -->|"group change → re-fetch"| TripSvc

    %% Local replay → Result
    ClusterAlgo -->|"stops, clusters, tripLegs"| Result
    GeofenceAlgo -->|"siteVisits, tripLegs, stateTransitions"| Result

    %% Result → UI
    Result --> PMap
    Result --> PResults
    Result --> PCharts
    Result --> PInsights

    style PreviewAPI fill:#fef3c7,stroke:#d97706
    style PreviewService fill:#e0f2fe,stroke:#0284c7
    style PreviewPanel fill:#fdf4ff,stroke:#a855f7
    style LocalReplay fill:#f0fdf4,stroke:#16a34a
    style PreviewUI fill:#fef2f2,stroke:#dc2626
```

### Preview Key Behaviors

| Behavior | Details |
|---|---|
| **Shared track data** | Switching Cluster ↔ Geofence does not re-fetch; same `trackSource` drives both algorithms |
| **Local replay** | Threshold slider changes trigger `< 200ms` browser-side re-computation, no server call |
| **Group filter** | Changing geofence group triggers a new API call (group filters on server) and invalidates cache |
| **Cache key** | `buildClusterSourceKey` / `buildGeofenceSourceKey` include vehicleId + dates + geofenceGroupId |
| **Classification** | Geofence mode propagates `SiteClassification` through site visits, trip legs, map overlays, and badge components |

## API Calls

| Function | Endpoint | Usage |
|---|---|---|
| `getVehicleTrips(params)` | `GET /vehicletrips` | Trip list with pagination, filtering, date range |
| `getVehicleTripsByVehicle(vehicleId)` | `GET /vehicletrips/vehicle/{vehicleId}` | Trips for a specific vehicle |
| `getVehicleTripDetail(groupId)` | `GET /vehicletrips/{groupId}` | Full trip detail with legs |
| `getInProgressTrips()` | `GET /vehicletrips/in-progress` | Currently active trips |

## SignalR Events

| Event | Payload | UI Effect |
|---|---|---|
| `VehicleLocationUpdate` | `{ vehicleId, lat, lng, speed, heading, timestamp }` | Move vehicle marker on map |
| `VehicleEventReceived` | `{ vehicleId, eventType, data }` | General event handler |
| `VehicleConnectionStatusChanged` | `{ vehicleId, isConnected }` | Online/offline indicator |
| `tripStarted` | `{ vehicleTripGroupId, vehicleId, originSite }` | Add "in progress" badge to trip panel |
| `tripInProgress` | `{ vehicleTripGroupId, distanceSoFar, currentSpeed }` | Update in-progress trip metrics |
| `tripCompleted` | `{ vehicleTripGroupId, tripSummary }` | Move trip from "in progress" to completed list |

## Badge Component (VehicleTripBadges.js)

Renders contextual badges per trip group:

| Badge | Condition | Color |
|---|---|---|
| Status badge | `InProgress` or `Completed` | Blue / Green |
| Confidence band | `High` / `Medium` / `Low` | Green / Amber / Red |
| Grouping type | `RoundTrip` / `LoadCycle` / `SingleLeg` | Purple / Teal / Gray |
| Anomaly count | `AnomalyFlags > 0` | Red with count |
| Reconciliation | `ReconciliationStatus` value | Various |
| Override indicator | `DetectionMode LIKE 'ManualOverride%'` | Orange |

## Utility Functions (vehicleTripUi.js)

| Function | Purpose |
|---|---|
| `formatTripDuration()` | Human-readable duration (e.g., "2h 15m") |
| `formatDistance()` | Distance with units (e.g., "45.3 km") |
| `getConfidenceBadgeColor()` | Map confidence band to CSS class |
| `getAnomalyFlagLabels()` | Decode bitmask to human-readable flag names |
| `getGroupingTypeLabel()` | Display name for grouping type enum |
