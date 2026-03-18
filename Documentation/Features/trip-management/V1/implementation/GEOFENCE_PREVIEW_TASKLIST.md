<!--
File: GEOFENCE_PREVIEW_TASKLIST.md
Purpose: Implementation task list for geofence detection frontend preview integration.
Dependencies: GEOFENCE_PREVIEW_PRD.md
Last Modified: 2026-03-17
-->

# Task List: Geofence Detection Frontend Preview

## Phase 1 — Backend: Preview Endpoint + DTO ✅

- [x] **1.1** Create `SiteGeofenceDTO.cs` in `FMS.Application/Features/VehicleTrips/DTOs/`
  - Fields: SiteId, Label, Classification, GpsGeofenceId, GeofenceType, GeometryJson, CenterLatitude, CenterLongitude, RadiusMeters

- [x] **1.2** Create `GeofenceDetectionPreviewDTO.cs` in `FMS.Application/Features/VehicleTrips/DTOs/`
  - Fields: VehicleId, VehicleName, FromUtc, ToUtc, TotalTrackPoints, TrackPoints (reuse PreviewTrackPointDTO), SiteGeofences (List<SiteGeofenceDTO>)

- [x] **1.3** Add `PreviewDetectionAsync` method to `IVehicleTripGeofenceDetectionService.cs`
  - Signature: `Task<GeofenceDetectionPreviewDTO> PreviewDetectionAsync(VehicleEntity, DateTime, DateTime, VehicleTripGeofenceDetectionOptions?, int? geofenceGroupId, CancellationToken)`

- [x] **1.4** Implement `PreviewDetectionAsync` in `VehicleTripGeofenceDetectionService.cs`
  - Load sites with geofences, fetch track points via GPS service, project to DTO with geometry and classification

- [x] **1.5** Create `PreviewGeofenceDetectionQuery.cs` in `FMS.Application/Features/VehicleTrips/Queries/`
- [x] **1.6** Create `PreviewGeofenceDetectionQueryHandler.cs` in `FMS.Application/Features/VehicleTrips/Queries/`

- [x] **1.7** Add `POST /vehicletrips/geofence/preview` endpoint to `VehicleTripsController.cs`

## Phase 2 — Frontend: Geofence Detection Algorithm ✅

- [x] **2.1** Create `geofenceDetectionPlayground.js` in `fms.frontend/src/pages/vehicles/trips/utils/`
  - Port `isPointInCircle` (Haversine distance check)
  - Port `isPointInPolygon` (ray-casting algorithm)
  - Port `resolveContainingSite` (iterate geofences, return matching site)
  - Implement `buildFrontendGeofencePreview({ sourcePreview, settings, siteGeofences })`
  - Implement state tracking: AT_SITE / DEPARTING / ARRIVING
  - Build site visits (stops at geofences) with classification field
  - Build trip legs (transitions between different geofences) with origin/destination classification
  - Apply min distance / min duration filters
  - Export `buildGeofenceSourceKey` + `buildFrontendGeofencePreview`

## Phase 3 — Frontend: Service Layer ✅

- [x] **3.1** Add `previewGeofenceDetection()` to `vehicleTripService.js`
  - POST to `/vehicletrips/geofence/preview`
  - Accepts optional `geofenceGroupId` parameter
  - Returns `{ trackPoints, siteGeofences, vehicleId, vehicleName, fromUtc, toUtc }`

- [x] **3.2** Add `fetchGeofenceGroups()` to `vehicleTripService.js`
  - GET `/Geofence/groups` — returns available geofence groups for the group filter dropdown

## Phase 4 — Frontend: Panel Mode Toggle ✅

- [x] **4.1** Add `detectionMode` state to `ClusterDetectionPreviewPanel.js` (default: `"Cluster"`)
- [x] **4.2** Define `GEOFENCE_PLAYGROUND_FIELDS` and `GEOFENCE_DEFAULT_PLAYGROUND` constants
- [x] **4.3** Add mode toggle UI (two buttons: Cluster / Geofence) at top of sidebar
- [x] **4.4** On mode change: reset playground to mode-specific defaults, clear result, keep trackSource
- [x] **4.5** Branch `handleRun`: call `previewClusterDetection` or `previewGeofenceDetection` based on mode
- [x] **4.6** Branch local replay: call `buildFrontendClusterPreview` or `buildFrontendGeofencePreview` based on mode
- [x] **4.7** Store `siteGeofences` state (loaded from geofence preview response)
- [x] **4.8** Pass `detectionMode` and `siteGeofences` to child components

## Phase 5 — Frontend: Map Geofence Overlays ✅

- [x] **5.1** Add geofence overlay rendering to `ClusterDetectionPreviewMap.js`
  - Accept `siteGeofences` prop and `detectionMode` prop
  - When mode = Geofence: render `google.maps.Polygon` for polygon geofences
  - When mode = Geofence: render `google.maps.Circle` for circle geofences
  - Classification-based color scheme (see Phase 8)
  - Add to clear/cleanup cycle

- [x] **5.2** Add state-colored track line for geofence mode
  - Color segments based on state annotation: blue=AT_SITE, orange=DEPARTING, green=ARRIVING

## Phase 6 — Frontend: Results Integration ✅

- [x] **6.1** Updated Results component to handle geofence result shape
  - Site visits tab: startTime, endTime, siteName, classification (with `ClassificationBadge`), dwellMinutes
  - Trip legs tab: shared format with cluster mode, plus origin/destination classification columns

## Phase 7 — Testing & Verification ✅

- [x] **7.1** Verify backend endpoint with sample vehicle + date range
- [x] **7.2** Verify geofence containment accuracy (polygon + circle)
- [x] **7.3** Verify mode toggle preserves track data between switches
- [x] **7.4** Verify geofence overlays render correctly on map
- [x] **7.5** Verify playback controls work in geofence mode
- [x] **7.6** Verify threshold adjustment triggers local replay

## Phase 8 — Site Classification + Geofence Group Filtering ✅

- [x] **8.1** Create `SiteClassification` enum in `FMS.Domain/Entities/enums/SiteClassification.cs`
  - Values: Unknown=0, Parking=1, Load=2, Dump=3, Fuel=4, Workshop=5

- [x] **8.2** Add `Classification` property to `Site.cs` entity
  - Type: `SiteClassification`, default: `Unknown`

- [x] **8.3** Add `classification` column mapping in `SiteConfiguration.cs`
  - MySQL TINYINT column with descriptive comment

- [x] **8.4** Add `Classification` string field to `SiteGeofenceDTO.cs`
  - Populated from `Site.Classification.ToString()` during projection

- [x] **8.5** Add `int? geofenceGroupId` parameter to `IVehicleTripGeofenceDetectionService.PreviewDetectionAsync`

- [x] **8.6** Implement group filtering in `VehicleTripGeofenceDetectionService.PreviewDetectionAsync`
  - When `geofenceGroupId` is provided, filter sites via `GpsGeofenceGroupMember` join
  - Map `Site.Classification` enum to DTO string in projection

- [x] **8.7** Add `GeofenceGroupId` property to `PreviewGeofenceDetectionQuery`

- [x] **8.8** Pass `GeofenceGroupId` from query handler to service in `PreviewGeofenceDetectionQueryHandler`

- [x] **8.9** Add `fetchGeofenceGroups()` to `vehicleTripService.js` (frontend)
  - GET `/Geofence/groups` for the dropdown data source

- [x] **8.10** Add geofence group selector dropdown to `ClusterDetectionPreviewPanel.js`
  - Visible only in Geofence mode
  - Passes `geofenceGroupId` to API call and includes in cache key via `buildGeofenceSourceKey`

- [x] **8.11** Add `SITE_CLASSIFICATION_COLORS` map to `ClusterDetectionPreviewMap.js`
  - Parking→blue, Load→green, Dump→red, Fuel→amber, Workshop→purple, Unknown→gray
  - Geofence overlays and site visit markers use classification-based colors

- [x] **8.12** Add `ClassificationBadge` component to `ClusterDetectionPreviewResults.js`
  - Color-coded badge with classification label
  - Added "Type" column to site visits grid
  - Added "From type" and "To type" columns to geofence trip legs grid

- [x] **8.13** Add `classification` to `geofenceDetectionPlayground.js` data flow
  - Normalized in siteGeofence lookup, propagated through annotatedPoints, siteVisits, and tripLegs
