<!--
File: GEOFENCE_PREVIEW_PRD.md
Purpose: PRD for integrating geofence-based trip detection into the frontend preview playground.
Dependencies: PRD.md section 9.1, VehicleTripGeofenceDetectionService.cs, ClusterDetectionPreviewPanel.js
Last Modified: 2026-03-17
-->

# PRD: Geofence Detection — Frontend Preview Integration

## 1. Executive Summary

The cluster detection preview playground lets operators adjust thresholds and instantly
see which stops, clusters, and trip legs the algorithm produces — all without a server
round-trip after the initial data load.

Geofence detection (used by **SiteToSite** vehicles) has full backend support but
**no equivalent frontend preview**. This PRD extends the existing preview page to
support both detection modes behind a single **mode toggle**, reusing the existing
Map, Charts, Results, and Playback components.

## 2. Goals

| # | Goal |
|---|------|
| G1 | Allow operators to preview geofence-based trip detection with the same interactive experience as cluster detection |
| G2 | Reuse existing preview infrastructure (Map, Charts, Results, Playback) — no duplicate pages |
| G3 | Render geofence polygon/circle overlays on the map so operators see where containment boundaries are |
| G4 | Provide geofence-specific tunable thresholds (consecutive outside points, min trip distance/duration) |
| G5 | Port the backend ray-casting + Haversine containment algorithm to JavaScript for instant local replay |
| G6 | Color-code geofence overlays and site visit markers by site classification (Parking, Load, Dump, Fuel, Workshop) |
| G7 | Allow filtering geofences by geofence group so operators can preview detection scoped to a specific site set |

## 3. Scope

### 3.1 In Scope
- Mode toggle (Cluster / Geofence) in the existing preview panel
- New backend endpoint to return site geofence geometry data
- Frontend geofence detection playground utility (`geofenceDetectionPlayground.js`)
- Geofence polygon/circle overlays on the preview map
- State transition markers (AT_SITE / DEPARTING / ARRIVING) on map track
- Geofence-specific playground threshold fields
- Site classification enum (`SiteClassification`: Unknown, Parking, Load, Dump, Fuel, Workshop)
- Classification-based color coding for geofence overlays and site visit markers
- Geofence group filtering — optional dropdown to scope detection to a specific group
- Classification badge columns in site visits and trip legs result grids

### 3.2 Out of Scope
- Changes to the real-time state machine (backend-only, already complete)
- Changes to the reconciliation pipeline
- Mobile app preview
- Geofence editing or creation (managed in GPSGate)

## 4. Architecture

### 4.1 Data Flow

```
┌──────────────┐     POST /vehicletrips/geofence/preview
│   Frontend   │ ──────────────────────────────────────────► Backend
│   Panel      │ ◄────────────────────────────────────────── returns track points
│              │     { trackPoints, vehicleId, sites[] with geometry + classification }
│              │
│  Group ──────│     Optional: geofenceGroupId filters sites on the server
│  Filter      │
│              │
│  mode=Geo ──►│     buildFrontendGeofencePreview()
│              │ ──► For each point → containment test vs all site geofences
│              │     ──► Ray casting (polygon) or Haversine (circle)
│              │     ──► State machine: AT_SITE → DEPARTING → ARRIVING
│              │     ──► Build trip legs from state transitions
│              │     ──► Propagate site classification through visits + legs
│              │
│              │ ──► { stops (site visits), tripLegs, trackPoints, siteGeofences }
│              │
│  Map ◄───────│     Renders: track + classification-colored geofence polygons/circles
│  Charts ◄────│     Renders: speed profile + state band chart
│  Results ◄───│     Renders: site visits (with ClassificationBadge) + trip legs grids
└──────────────┘
```

### 4.2 Site Geofence Data Shape

The new endpoint returns enriched site data including geofence geometry:

```json
{
  "siteId": 5,
  "label": "Quarry A",
  "classification": "Load",
  "gpsGeofenceId": 12,
  "geofenceType": "Polygon",
  "geometryJson": [[36.98, -1.45], [36.99, -1.45], [36.99, -1.46], [36.98, -1.46]],
  "centerLatitude": -1.455,
  "centerLongitude": 36.985,
  "radiusMeters": null
}
```

For Circle geofences:
```json
{
  "siteId": 8,
  "label": "Depot B",
  "classification": "Parking",
  "gpsGeofenceId": 15,
  "geofenceType": "Circle",
  "geometryJson": null,
  "centerLatitude": -1.460,
  "centerLongitude": 37.001,
  "radiusMeters": 250
}
```

### 4.3 Frontend Geofence Algorithm

Ported from `VehicleTripGeofenceDetectionService.cs`:

```
buildFrontendGeofencePreview({ sourcePreview, settings, siteGeofences })
│
├── normalizeTrackPoints()                      // Reuse from cluster playground
├── For each track point:
│   ├── resolveContainingSite(point, siteGeofences)
│   │   ├── isPointInCircle(lat, lng, center, radius)
│   │   └── isPointInPolygon(lat, lng, polygon)   // Ray-casting algorithm
│   └── Track state: currentSite → null → nextSite = trip leg
├── Apply filters (minimumTripDistanceKm, minimumTripDurationMinutes)
└── Return { siteVisits, tripLegs, trackPoints, stateTransitions }
```

### 4.4 State Transitions Array

Each track point gets a `state` annotation:

| State | Meaning |
|-------|---------|
| `AT_SITE` | Point is inside a geofence |
| `DEPARTING` | Point is outside all geofences (was previously AT_SITE) |
| `ARRIVING` | Point entered a new/different geofence |

This enables the map to color the track by state and the charts to show state bands.

## 5. Geofence-Specific Thresholds

| Field | Key | Default | Min | Max | Step | Unit |
|-------|-----|---------|-----|-----|------|------|
| Min trip distance | `minimumTripDistanceKm` | 0.5 | 0.1 | 10 | 0.1 | km |
| Min trip duration | `minimumTripDurationMinutes` | 2 | 0.5 | 30 | 0.5 | min |
| Max track points | `maxTrackPoints` | 5000 | 500 | 20000 | 500 | pts |

Note: Geofence detection has fewer tunable parameters than cluster detection because
the geofence boundaries are predefined — there's no speed threshold, stop duration,
or cluster radius to tune.

## 6. UI Changes

### 6.1 Mode Toggle

At the top of the left sidebar, above the Vehicle selector:

```
┌─────────────────────────────────────┐
│  [■ Cluster]  [□ Geofence]         │  ← toggle buttons
│  Geofence Group: ____________  ▼   │  ← visible in Geofence mode only
│  Vehicle: ___________________  ▼    │
│  Date: ___________  From: ___ To: __│
│  ...                                │
└─────────────────────────────────────┘
```

- Switching mode clears `result`, resets `playground` to mode-specific defaults
- `trackSource` is shared — same track data works for both algorithms
- Switching mode triggers a local replay with the new algorithm
- Geofence Group dropdown loads groups via `fetchGeofenceGroups()` on mode switch
- Selecting a group re-fetches preview data (group filters on the server side)
- "All Groups" option (null) returns all sites

### 6.2 Map Overlays (Geofence Mode)

When `detectionMode === "Geofence"`:
- Draw `google.maps.Polygon` for polygon/route geofences (semi-transparent fill)
- Draw `google.maps.Circle` for circle geofences
- **Classification-based color coding** — each overlay uses the site's classification color:

| Classification | Fill Color | Use Case |
|---|---|---|
| Parking | Blue (#3B82F6) | Depot, yard, parking area |
| Load | Green (#22C55E) | Quarry, loading zone |
| Dump | Red (#EF4444) | Dump site |
| Fuel | Amber (#F59E0B) | Fuel station |
| Workshop | Purple (#A855F7) | Maintenance workshop |
| Unknown | Gray (#6B7280) | Unclassified site |

- Track line colored by state: blue (AT_SITE), orange (DEPARTING), green (ARRIVING)
- Site visit markers also use classification colors

### 6.3 Results Grid (Geofence Mode)

Two tabs:
- **Site Visits**: startTime, endTime, siteName, **classification** (with `ClassificationBadge`), dwellMinutes
- **Trip Legs**: origin → destination, **originClassification**, **destinationClassification**, distance, duration, maxSpeed, confidence

### 6.4 Charts (Geofence Mode)

The `ClusterDetectionPreviewCharts.js` component supports both detection modes:

- **Speed profile chart**: identical in both modes — line chart of speed over time with track points.
- **State band chart**: In geofence mode, calls `classifyGeofencePoints(result)` to map each point to an AT_SITE/DEPARTING/ARRIVING state band. The band chart renders colored horizontal bars:
  - Blue band = AT_SITE (inside a geofence)
  - Orange band = DEPARTING (outside all geofences)
  - Green band = ARRIVING (entering a new geofence)

The `classifyGeofencePoints()` function lives inside `ClusterDetectionPreviewCharts.js` and reads `result.trackPoints[].state` annotations produced by `geofenceDetectionPlayground.js`.

### 6.5 Analytics Explorer (Insights)

`VehicleTripClusterPreviewInsights.js` provides summary analytics strips below the main preview:

- **Detection summary**: total stops/site visits, trip legs count, total distance, total duration
- **Comparison metrics**: when both Cluster and Geofence results exist, shows side-by-side leg counts and total distance
- **Strip charts**: mini bar charts for dwell time distribution, leg distance distribution
- Reacts to both detection modes and updates when results change

## 7. Backend Changes

### 7.1 New Query: `PreviewGeofenceDetectionQuery`

```csharp
POST /api/v1/vehicletrips/geofence/preview
{
    "vehicleId": 123,
    "fromUtc": "2026-03-16T00:00:00Z",
    "toUtc": "2026-03-16T23:59:59Z",
    "maxTrackPoints": 5000,
    "geofenceGroupId": 42        // optional — filter to sites in this group
}
```

Response: `FMSResponse<GeofenceDetectionPreviewDTO>`

```csharp
public class GeofenceDetectionPreviewDTO
{
    public int VehicleId { get; set; }
    public string VehicleName { get; set; }
    public DateTime FromUtc { get; set; }
    public DateTime ToUtc { get; set; }
    public int TotalTrackPoints { get; set; }
    public List<PreviewTrackPointDTO> TrackPoints { get; set; }
    public List<SiteGeofenceDTO> SiteGeofences { get; set; }
}
```

### 7.2 New DTO: `SiteGeofenceDTO`

```csharp
public class SiteGeofenceDTO
{
    public int SiteId { get; set; }
    public string Label { get; set; }
    public string Classification { get; set; } = "Unknown";  // Parking, Load, Dump, Fuel, Workshop, Unknown
    public int? GpsGeofenceId { get; set; }
    public string GeofenceType { get; set; }       // "Polygon", "Circle", "Route"
    public string? GeometryJson { get; set; }       // Raw GeoJSON for polygon/route
    public decimal? CenterLatitude { get; set; }
    public decimal? CenterLongitude { get; set; }
    public double? RadiusMeters { get; set; }
}
```

### 7.3 Add `PreviewDetectionAsync` to `IVehicleTripGeofenceDetectionService`

```csharp
Task<GeofenceDetectionPreviewDTO> PreviewDetectionAsync(
    VehicleEntity vehicle,
    DateTime fromUtc,
    DateTime toUtc,
    VehicleTripGeofenceDetectionOptions? overrideOptions = null,
    int? geofenceGroupId = null,
    CancellationToken cancellationToken = default);
```

When `geofenceGroupId` is provided, the service joins through `GpsGeofenceGroupMember`
to filter sites down to only those whose geofence belongs to the specified group.

## 8. Performance Considerations

| Concern | Mitigation |
|---------|------------|
| Polygon containment is O(edges) per point per geofence | Most sites have < 20 edges; 5000 points × 30 sites = 3M edge checks — runs < 100ms in JS |
| Geofence geometry loaded once | Cached alongside `siteLookup` — only re-fetched on initial load or group change |
| Track data shared between modes | Switching mode does not re-fetch from server |
| Group filter changes require server round-trip | Group filter changes the site set, requiring a new preview API call; cache key includes `geofenceGroupId` |

## 9. Acceptance Criteria

- [x] Mode toggle (Cluster/Geofence) visible at top of sidebar when result is loaded
- [x] Geofence mode shows polygon/circle overlays on map
- [x] Geofence mode produces site visits and trip legs from containment testing
- [x] Threshold sliders adjust and local replay runs within 200ms
- [x] Playback (1x/2x/4x/8x) works identically in geofence mode
- [x] Track line is colored by state in geofence mode
- [x] API endpoint `POST /vehicletrips/geofence/preview` returns track points + site geofence geometry
- [x] Geofence overlays are color-coded by site classification
- [x] Geofence group dropdown filters preview results to sites in the selected group
- [x] Site visits grid shows classification badge column
- [x] Trip legs grid shows origin and destination classification badge columns
- [x] `SiteGeofenceDTO` includes `Classification` field populated from `Site.Classification`
