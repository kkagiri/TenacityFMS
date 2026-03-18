<!--
File: IMPLEMENTATION_STATUS.md
Purpose: Summarizes the current delivered state of Vehicle Trips, Geofence Management, and the vehicle trips API.
Dependencies: Vehicle trip CQRS handlers, frontend vehicle/geofence pages, mysql-phase1-trip-management.sql.
Last Modified: 2026-03-17
-->

# Vehicle Trips and Geofence Management Implementation Status

## 1. Audit Scope

This document summarizes what is already implemented for:

- `/vehicles/trips`
- Geofence Management
- `GET /api/v1/vehicletrips`

The summary is based on the current codebase state as of 2026-03-11.

## 2. What Is Already Done

### 2.1 Vehicle Trips backend foundation

The backend now contains a dedicated `VehicleTrips` feature domain with:

- query contracts and handlers for trip list and vehicle trip history
- a recompute command and handler for rebuilding persisted trips
- DTOs for trip list rows, trip groups, recompute results, stop detection, and cluster detection
- detection services for both `Geofence` and `Cluster` movement profiles

The persistence layer also exists for phase 1:

- `vehicle.MovementProfile`
- `vehicle_trip_group`
- `vehicle_trip`

Entity Framework configuration and `GpsdataContext` registration are in place.

### 2.2 Vehicle movement profile support

Vehicle configuration already supports movement profile selection.

Implemented areas:

- backend DTO includes `MovementProfile`
- AutoMapper profile maps `MovementProfile`
- vehicle create/update validation checks the enum value
- vehicle create form exposes `Movement Profile`
- vehicle edit form exposes `Movement Profile`

Supported enum values:

- `Undefined = 0`
- `Geofence = 1`
- `Cluster = 2`

Default behavior is `Geofence`.

### 2.3 `/vehicles/trips` page

The page is implemented as a dedicated vehicle-module route and workbench.

Current behavior:

- route registered at `/vehicles/trips`
- auto-loads vehicles from `/vehicle/simple`
- loads trip groups from `/vehicletrips`
- supports filtering by:
  - vehicle
  - from date/time
  - to date/time
  - movement profile
  - detection mode
- shows top summary cards for:
  - trip groups
  - unique vehicles
  - total distance
  - total duration
- displays persisted trip groups in a DevExtreme grid
- provides `Open Vehicle` action for quick navigation into vehicle details

Current page output is group-oriented, not per-leg drill-down.

### 2.4 Vehicle details trip history

Vehicle details already contain a trip history panel.

Current behavior:

- loads persisted trip groups for a selected vehicle
- filters by date range
- shows group count, trip count, and total distance summary
- supports manual recompute through `/vehicletrips/recompute`
- limits recompute action to callers with admin capability in the frontend

This is the currently delivered per-vehicle trip review surface.

### 2.5 Geofence Management

Geofence Management is already a working admin feature and is also embedded into vehicle tracking.

Current structure:

- `Geofences` tab
- `Allowed Groups` tab
- `Sync Groups` tab

Delivered capabilities:

#### Geofences tab
- list cached geofences
- refresh current data
- create a new geofence with a map-first drawing workflow
- delete a synced geofence
- preview the selected geofence on the map
- classify a geofence as a worksite by linking it to a site

#### Allowed Groups tab
- list synced geofence groups
- create a group
- edit a group
- delete a group
- maintain group membership
- toggle `Allowed for Fueling` as a global policy flag

#### Sync Groups tab
- load available groups directly from GPSGate
- select specific groups for sync
- start async sync jobs
- poll sync job progress
- support full sync and selective sync

#### Related UI entry points
- `LocationGeofencePage` hosts Geofence Management under the admin fueling-rules flow
- `VehicleTrackingPage` opens Geofence Management in a slide panel

### 2.6 Why Geofence Management matters to trip detection

The current trip system already depends on site-linked geofences.

The geofence detection service reads active sites where:

- the site is active
- the site has a linked `GpsGeofenceId`
- the geofence entity is loaded

That means Geofence Management contributes to trip quality in two ways:

1. syncing and maintaining the available geofence catalog
2. classifying synced geofences as worksites by linking them to sites

Once a geofence is linked to a site, geofence-based trip detection can resolve origin/destination names from the site instead of falling back to raw coordinates.

### 2.7 Cluster / Geofence Detection Preview Playground

A dedicated preview page allows operators to test both cluster and geofence detection algorithms interactively without persisting any data.

#### Backend

- `PreviewGeofenceDetectionQuery` / `PreviewGeofenceDetectionQueryHandler` — dry-run geofence detection
- `PreviewClusterDetectionQuery` / `PreviewClusterDetectionQueryHandler` — dry-run cluster detection
- `GeofenceDetectionPreviewDTO` and `ClusterDetectionPreviewDTO` — preview result shapes
- `SiteGeofenceDTO` — includes site identity, geofence geometry, and classification
- `IVehicleTripGeofenceDetectionService.PreviewDetectionAsync` — accepts optional `geofenceGroupId` for group filtering
- API: `POST /api/v1/vehicletrips/geofence/preview`, `POST /api/v1/vehicletrips/cluster/preview`

#### Frontend

- `ClusterDetectionPreviewPanel.js` — main panel with mode toggle (Cluster / Geofence), vehicle selector, date range, threshold sliders, geofence group dropdown
- `ClusterDetectionPreviewMap.js` — Google Maps with track rendering, geofence polygon/circle overlays, classification-colored markers
- `ClusterDetectionPreviewResults.js` — result grids for stops/clusters/site visits and trip legs with ClassificationBadge
- `ClusterDetectionPreviewCharts.js` — speed profile and state band charts, `classifyGeofencePoints()` for geofence mode
- `ClusterDetectionPreviewHelpSlide.js` — help/usage overlay
- `VehicleTripClusterPreviewInsights.js` — analytics explorer with summary strips, comparison metrics, and mini distribution charts

#### Page wrappers

- `VehicleTripClusterPreviewPage.js` — standalone permission-gated page at `/vehicles/trips/preview`
- `VehicleTripSettingsPage.js` — settings admin page at `/vehicles/trips/settings`, embeds `ClusterDetectionPreviewPanel`

#### Service functions (vehicleTripService.js)

- `previewClusterDetection()` — POST to `/vehicletrips/cluster/preview`
- `previewGeofenceDetection()` — POST to `/vehicletrips/geofence/preview` with optional `geofenceGroupId`
- `fetchGeofenceGroups()` — GET `/Geofence/groups` for group filter dropdown
- `fetchVehicleTripSettings()` / `updateVehicleTripSettings()` — GET/PUT settings endpoints

#### Utility modules

- `geofenceDetectionPlayground.js` — JavaScript port of containment algorithms (ray-casting, Haversine), state machine, site visit / trip leg builder
- `clusterDetectionPlayground.js` — DBSCAN-based cluster detection, stop detection, trip leg builder

#### Key behaviors

- Mode toggle switches between Cluster and Geofence detection
- Both modes share the same track data — switching does not re-fetch
- Threshold sliders trigger local replay (< 200ms) without server calls
- Playback controls (1x/2x/4x/8x) animate the track across both modes

### 2.8 Site Classification

Sites now carry a `Classification` enum for categorizing their operational purpose.

#### Domain

- `SiteClassification` enum in `FMS.Domain/Entities/enums/SiteClassification.cs`
- Values: `Unknown = 0`, `Parking = 1`, `Load = 2`, `Dump = 3`, `Fuel = 4`, `Workshop = 5`
- `Site.Classification` property added — default: `Unknown`

#### Persistence

- `SiteConfiguration.cs` maps `Classification` to a MySQL `TINYINT` column (`classification`)

#### Impact on preview

- `SiteGeofenceDTO.Classification` string field populated from `Site.Classification.ToString()`
- `geofenceDetectionPlayground.js` propagates classification through normalized site lookup, annotated points, site visits, and trip legs
- Map overlays use classification-based colors: Parking→blue, Load→green, Dump→red, Fuel→amber, Workshop→purple, Unknown→gray
- Results grids display `ClassificationBadge` components with color-coded labels

### 2.9 Geofence Group Filtering

The preview endpoint supports filtering sites by geofence group.

#### Backend

- `PreviewGeofenceDetectionQuery.GeofenceGroupId` (nullable int)
- When provided, `VehicleTripGeofenceDetectionService.PreviewDetectionAsync` joins through `GpsGeofenceGroupMember` to include only sites whose geofence belongs to the specified group

#### Frontend

- `ClusterDetectionPreviewPanel.js` loads groups via `fetchGeofenceGroups()` (GET `/Geofence/groups`)
- Geofence group dropdown visible only in Geofence mode; "All Groups" option sends `null`
- Selecting a group triggers a fresh preview API call and invalidates the cache (geofenceGroupId is part of `buildGeofenceSourceKey`)

## 3. `GET /api/v1/vehicletrips` Documentation

### 3.1 Purpose

Returns persisted vehicle trip groups for the trip management workbench.

This endpoint is used by the `/vehicles/trips` page.

### 3.2 Route

`GET /api/v1/vehicletrips`

### 3.3 Authentication and permission

- JWT authentication required
- controller permission requirement: `Permissions.Vehicle.Read`

### 3.4 Query parameters

| Parameter | Type | Required | Notes |
|---|---|---:|---|
| `vehicleId` | `int?` | No | Filters to a single vehicle. Must be greater than `0` when supplied. |
| `fromUtc` | `DateTime?` | No | Defaults to `UtcNow - 7 days`. |
| `toUtc` | `DateTime?` | No | Defaults to `UtcNow`. |
| `movementProfile` | `VehicleMovementProfile?` | No | `0 = Undefined`, `1 = Geofence`, `2 = Cluster`. |
| `detectionMode` | `string?` | No | Current implemented values are `Geofence` and `Cluster`. |

### 3.5 Validation rules

The handler currently validates:

- `vehicleId > 0` when provided
- `fromUtc < toUtc`

If validation fails, the endpoint returns an `FMSResponse<T>` validation failure.

### 3.6 Current query behavior

The query currently:

- reads from persisted `VehicleTripGroups`
- includes related vehicle, origin site, destination site, and grouped trip legs
- filters by overlapping date range
- optionally filters by vehicle, movement profile, and detection mode
- orders by latest `StartTimeUtc`
- returns up to `500` groups

### 3.7 Response shape

The endpoint returns `FMSResponse<List<VehicleTripListItemDTO>>`.

Current row fields:

- `vehicleTripGroupId`
- `vehicleId`
- `vehicleLabel`
- `numberPlate`
- `tripDate`
- `startTimeUtc`
- `endTimeUtc`
- `originDisplayName`
- `destinationDisplayName`
- `tripCount`
- `totalDistanceKm`
- `totalDurationMinutes`
- `movementProfile`
- `detectionMode`

### 3.8 Example request

`GET /api/v1/vehicletrips?vehicleId=597&fromUtc=2026-03-04T12:26:58.632Z&toUtc=2026-03-04T12:26:58.632Z&movementProfile=1&detectionMode=Geofence`

### 3.9 Important note about the example

The provided sample uses the same timestamp for `fromUtc` and `toUtc`.

That currently fails validation because the handler requires:

`fromUtc < toUtc`

Use a wider time window, for example a full day or shift range.

## 4. Gaps and Not Yet Done (Five-Layer Architecture)

The current implementation covers Phase 1 foundation (batch detection + recompute). The PRD now defines a five-layer pipeline architecture that requires significant additional work.

### 4.1 Layer 1 — GPS Data Pre-Processor (not started)

Not yet delivered:

- GPS point filter (drop invalid, duplicates, zero satellites, impossible position jumps)
- GPS point enrichment (distance from previous, time delta, geofence containment tagging)
- per-vehicle sliding window buffer (5–10 points)
- integration into existing GPS data ingestion pipeline
- configurable filter thresholds

### 4.2 Layer 2 — Real-Time State Machine Detection (not started)

Not yet delivered:

- per-vehicle geofence state machine (`AT_SITE` → `DEPARTING` → `ARRIVING`)
- N-consecutive-points noise filter for departure transitions
- in-progress trip persistence with `InProgress` status
- per-vehicle cluster state machine (`AT_CLUSTER` → `IN_TRANSIT`)
- progressive cluster discovery (clusters built incrementally during the day)
- cluster classification refinement over multiple cycles
- SignalR event publishing (`TripStarted`, `TripInProgress`, `TripCompleted`)
- state machine persistence and recovery after service restart

### 4.3 Layer 3 — End-of-Day Reconciliation (not started)

Not yet delivered:

- batch replay service (re-run full day from scratch)
- compare logic (match batch vs real-time: confirmed, split, merged, adjusted)
- cluster finalization for tippers during batch pass
- anomaly flagging (no fuel data, negative consumption, unrealistic speeds, asymmetric cycles, no return)
- reconciliation status field on trip records
- scheduled background job (after midnight)
- on-demand reconciliation trigger

### 4.4 Layer 4 — Manual Override (not started)

Not yet delivered:

- split trip command and UI
- merge trips command and UI
- reassign site command and UI
- add trip command and UI
- delete trip command and UI
- adjust times command and UI
- audit trail persistence (original values, operator, reason)
- physics validation (arrival not before departure)
- supervisor approval gate for completed-period overrides

### 4.5 Trip model gaps (carried from Phase 1)

Not yet delivered:

- trip status field (`InProgress` / `Completed`)
- confidence score field (decimal 0.0–1.0)
- anomaly flags field
- reconciliation status field
- fuel fields on trip legs (fuel at departure, fuel at arrival, fuel consumed)
- group type field (`RoundTrip` / `LoadCycle`)
- vehicle trip state entity (real-time state machine state)
- trip override entity (audit trail)
- explicit round-trip grouping logic
- explicit load-cycle grouping logic
- trip-leg detail endpoint
- geofence overlap resolution using closest centroid
- off-site idle and unauthorized stop handling
- GPS-gap confidence reduction
- out-of-bounds event capture
- planning/project linkage fields

### 4.6 Layer 5 — Integration gaps

Not yet delivered:

- fuel enrichment per trip leg (departure/arrival/delta)
- fuel rate calculation (km/L per trip)
- loaded vs unloaded fuel rate comparison for tippers
- SignalR trip event types for dashboardHub
- dashboard live trip count, cycle counter, in-transit display
- rule engine trip-based rules (max trips, expected duration, min cycles)
- vehicle reconciliation integration (trip logs replacing position snapshots)
- reporting with reconciliation status and anomaly breakdown

### 4.7 Frontend gaps

Not yet delivered:

- trip timeline panel with real-time in-progress indicators on tracking page
- recompute action directly from tracking page
- trip detail popup with full leg metadata
- confidence/anomaly/reconciliation status badges
- manual override panel and actions
- override audit trail viewer
- supervisor approval workflow UI
- dashboard trip metrics (in-transit, cycle counter, anomaly count)
- report-ready route analysis with reconciliation breakdown

### 4.8 V2 Planning Frontend (implemented)

Frontend scaffolding for V2 planning features has been delivered. Backend APIs are stubbed — components gracefully handle 404s until endpoints ship.

Files created:
- `VehicleTripPlanningSection.js` — extracted planning cascade (Project → Work day → Work zone → Haul route), linked/unlinked modes, plan match summary, geo-zone hits display
- `VehicleTripPlanningSection.scss` — styles for planning section
- `GeoZoneManagementPanel.js` — slide panel with DataGrid CRUD for geo-zones per type
- `GeoZoneManagementPanel.scss` — styles for geo-zone panel

Files modified:
- `vehicleTripUi.js` — added `PLAN_MATCH_STATUS_MAP`, `getPlanMatchConfig()`, 18 planning fields in `normalizeTripGroup`
- `vehicleTripService.js` — added 9 V2 API stubs (planning link, project lookup, geo-zone CRUD)
- `VehicleTripDetailPanel.js` — replaced inline planning section with `<VehicleTripPlanningSection>` component
- `VehicleTrackingTripPanel.js` — replaced static reserved labels with dynamic plan match badge and OOB indicator
- `VehicleTrackingTripPanel.scss` — added tone-variant styles for timeline tags
- `VehicleTripsPage.js` — added plan match, productive, and out-of-bounds filters + grid columns
- `VehicleTripSettingsPage.js` — wired zone cards to open `GeoZoneManagementPanel`

Still pending:
- Backend V2 API endpoints (projects, geo-zones, planning link)
- Polygon map picker for zone creation (18b)
- Project/section cascaded filters on VehicleTripsPage (18d)
- GEO_ZONE_TYPE_MAP with full icon/color metadata (18f)
- Out-of-bounds governance and matching settings controls (18c)

## 5. Checklist Update Summary

`TASKLIST.md` was restructured to align with the five-layer pipeline architecture defined in the updated PRD.

Verified as complete now:

- persistence schema and EF mapping for phase 1
- movement profile support in backend and vehicle forms
- `VehicleTrips` feature folders for commands, queries, DTOs, and services
- geofence trip detection basics (batch mode)
- cluster trip detection basics (batch mode)
- manual recompute for a date range
- trip list, trip group, and recompute API surfaces
- `/vehicles/trips` route and vehicle details trip history

New task groups added:

- Layer 1: GPS Data Pre-Processor (section 5)
- Layer 2: Real-Time Geofence Detector state machine (section 6, expanded)
- Layer 2: Real-Time Cluster Detector state machine (section 7, expanded)
- Layer 3: End-of-Day Reconciliation (section 8)
- Layer 4: Manual Override (section 9)
- Layer 5: Fuel Enrichment (section 10)
- Layer 5: SignalR and Dashboard Integration (section 11)
- Layer 5: Rule Engine Integration (section 12)
- Layer 5: Vehicle Reconciliation Integration (section 13)
- Frontend: Trip Management / Override UI (section 20)
- Frontend: Dashboard (section 21)

## 6. Recommended implementation sequence

Based on the five-layer architecture and current codebase state:

### Next slice (Phase 2 preparation)
1. Extend domain entities with new fields (status, confidence, anomaly, reconciliation, fuel, group type)
2. Add trip-leg detail endpoint and UI drill-down
3. Add round-trip and load-cycle grouping logic to existing batch detection services
4. Add fuel enrichment fields and basic fuel resolution

### Following slice (Layer 1 + Layer 2)
5. Implement GPS pre-processor service (filter, enrich, buffer)
6. Implement real-time geofence state machine
7. Implement real-time cluster state machine with progressive discovery
8. Add SignalR trip event publishing
9. Add in-progress trip display on tracking page

### Then (Layer 3 + Layer 4)
10. Implement end-of-day reconciliation service
11. Implement manual override commands with audit trail
12. Add override UI and supervisor approval workflow
13. Add reconciliation status badges and anomaly reporting

### Finally (Layer 5 integrations)
14. Dashboard trip metrics and live displays
15. Rule engine trip-based rules
16. Vehicle reconciliation integration
17. Full reporting with reconciliation and anomaly breakdown
