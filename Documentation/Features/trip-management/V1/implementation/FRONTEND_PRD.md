<!--
File: FRONTEND_PRD.md
Purpose: Frontend product requirements for the Vehicle Trip Management module.
         Covers pages, components, API communication, real-time strategy, data model,
         known gaps, and what is still required to complete the frontend picture.
Dependencies: PRD.md, SERVICES_README.md, TASKLIST.md, current frontend codebase.
Last Modified: 2026-03-12
-->

# Frontend PRD: Vehicle Trip Management

> This document describes the frontend requirements, current implementation state, and open work
> for the Vehicle Trip Management feature. It is the companion to the backend PRD and the
> Services README. All three documents together form the complete module specification.

---

## 1. Summary

The frontend surfaces the five-layer backend pipeline through three distinct access points:

| Access Point | Primary User | Purpose |
|---|---|---|
| **Tracking workspace** | Operations / dispatch | Live view — vehicles in transit, quick trip timeline, recompute trigger |
| **Trip management page** | Fleet managers / fuel auditors | Historical grid — filter, drill-down, manual overrides, audit trail |
| **Vehicle detail page** (embedded) | Fleet managers | Per-vehicle trip history and recompute from the vehicle record |

All three access points share the same service layer, data normalization helpers, and badge/status components. They are kept intentionally separate so operators monitoring live traffic are not forced into the audit-heavy trip management page.

---

## 2. Frontend Architecture

### 2.1 Data Flow

```
Backend API (REST)
        │
        │  FMSResponse<T>
        ▼
vehicleTripService.js   ← single API client for all trip endpoints
        │
        │  raw JSON
        ▼
vehicleTripUi.js        ← normalizeTripGroup / normalizeTripDetail / normalizeTripLeg
        │
        │  normalized JS objects
        ▼
React component state   ← via hooks (useVehicleTrackingTrips) or direct service calls
        │
        ▼
VehicleTripBadges       ← status, reconciliation, confidence, anomaly presentation
VehicleTripDetailPanel  ← drill-down side panel
VehicleTripOverridePanel← override action side panel
VehicleTrackingTripPanel← live tracking trip timeline slide-in
VehicleTripsPage        ← historical DataGrid workbench
```

### 2.2 Real-Time Flow

```
Backend SignalR (vehicleTrackingSignalRService)
        │
        │  PositionUpdate / ConnectionStatus events (LIVE)
        ▼
useVehicleTrackingRealtime.js   ← merges location into vehicle list state

Trip-specific events (TripStarted, TripInProgress, TripCompleted) — backend publishes ✅
        │
        │  ⚠️ No frontend listener registered yet — see Gap #1
        ▼
useVehicleTrackingTrips.js polls GET /vehicletrips every 30 s as fallback
```

**Important**: SignalR trip events are emitted by the backend but the frontend currently consumes trips through polling only. The tracking page polls every 30 seconds, meaning a new trip start is visible within ≤ 30 seconds, not instantly.

### 2.3 Permission Gates

| Permission | Controls |
|---|---|
| `_Read_Vehicle` | Required to access any trip endpoint (enforced at API level) |
| `canManageTrips` (resolved from JWT) | Unlocks the "Recompute vehicle" button and the override panel actions |

---

## 3. API Contract: Frontend ↔ Backend

All endpoints sit under `/api/v1/vehicletrips`. All responses are wrapped in `FMSResponse<T>`.
The `unwrapResponse` helper in `vehicleTripService.js` handles both camelCase and PascalCase response envelopes.

### 3.1 Read Endpoints

| Method | Path | Frontend caller | When called |
|---|---|---|---|
| `GET` | `/vehicletrips` | `useVehicleTrackingTrips` | Every 30 s, tracking page |
| `GET` | `/vehicletrips` | `VehicleTripsPage` | On filter submit |
| `GET` | `/vehicletrips/vehicle/{vehicleId}` | `VehicleTripsPage` / vehicle detail | When vehicle is selected |
| `GET` | `/vehicletrips/{vehicleTripGroupId}` | `VehicleTripDetailPanel` | On panel open |
| `GET` | `/vehicletrips/{vehicleTripGroupId}/overrides` | `VehicleTripOverridePanel` | On panel open (audit tab) |

#### Query parameters supported (from controller)
- `vehicleId`, `siteId`
- `fromUtc`, `toUtc`
- `movementProfile` (enum: Geofence=1, Cluster=2)
- `detectionMode` (string: "Geofence", "Cluster")
- `minimumConfidenceScore` (decimal)
- `isLowConfidence` (bool)
- `status` (InProgress=1, Completed=2)
- `groupingType` (SingleLeg=1, RoundTrip=2, LoadCycle=3)
- `reconciliationStatus` (Pending=0, Confirmed=1, Split=2, Merged=3, Adjusted=4, Anomaly=5)

#### What the tracking page currently sends
```js
{ fromUtc: now - 24h, toUtc: now + 2h }   // no vehicle filter, no status filter
```
All filtering for the live panel is done client-side after fetch.

### 3.2 Write Endpoints

| Method | Path | Frontend caller | Payload |
|---|---|---|---|
| `POST` | `/vehicletrips/recompute` | Tracking page / vehicle detail | `{ vehicleId, fromUtc?, toUtc? }` |
| `POST` | `/vehicletrips/override/split` | `VehicleTripOverridePanel` | `{ vehicleTripGroupId, vehicleTripId, splitTimeUtc, reason }` |
| `POST` | `/vehicletrips/override/merge` | `VehicleTripOverridePanel` | `{ vehicleTripGroupId, primaryVehicleTripId, secondaryVehicleTripId, reason }` |
| `POST` | `/vehicletrips/override/reassign-site` | `VehicleTripOverridePanel` | `{ vehicleTripGroupId, originDisplayNameOverride, destinationDisplayNameOverride, reason }` |
| `POST` | `/vehicletrips/override/add` | `VehicleTripOverridePanel` | `{ vehicleId, startTimeUtc, endTimeUtc, reason, ... }` |
| `POST` | `/vehicletrips/override/delete` | `VehicleTripOverridePanel` | `{ vehicleTripGroupId, reason }` |
| `POST` | `/vehicletrips/override/adjust-times` | `VehicleTripOverridePanel` | `{ vehicleTripGroupId, vehicleTripId, overrideStartTimeUtc, overrideEndTimeUtc, reason }` |

All override payloads optionally accept `supervisorApproval: { approved: bool }` for overrides on completed periods.

---

## 4. Data Model: Frontend Normalized Objects

### 4.1 Trip Group (list item)

`normalizeTripGroup()` in `vehicleTripUi.js` produces:

| Field | Type | Source |
|---|---|---|
| `vehicleTripGroupId` | number | API |
| `vehicleId` | number | API |
| `vehicleLabel` | string | API |
| `tripDate` | string (ISO) | API |
| `startTimeUtc` | string (ISO) | API |
| `endTimeUtc` | string (ISO) \| null | API |
| `originDisplayName` | string | API |
| `destinationDisplayName` | string \| null | API |
| `tripCount` | number | API |
| `totalDistanceKm` | number | API |
| `totalDurationMinutes` | number | API |
| `totalFuelConsumed` | number \| null | API |
| `movementProfile` | enum (1=Geofence, 2=Cluster) | API |
| `movementProfileLabel` | string | derived |
| `detectionMode` | string ("Geofence" \| "Cluster" \| "ManualOverride:...") | API |
| `status` | enum (1=InProgress, 2=Completed) | API |
| `statusLabel` | string | derived |
| `groupingType` | enum (0=None, 1=SingleLeg, 2=RoundTrip, 3=LoadCycle) | API |
| `groupingTypeLabel` | string | derived |
| `reconciliationStatus` | enum (0–5) | API |
| `confidenceScore` | number (0.0–1.0) | API |
| `confidenceBand` | string ("High" \| "Medium" \| "Low") | API |
| `anomalyFlags` | number (bitmask) \| string (comma-separated) | API |
| `anomalyItems` | `[{ key, label, tone }]` | derived |

### 4.2 Trip Detail (drill-down)

`normalizeTripDetail()` extends the group with:

| Field | Type |
|---|---|
| `trips` | `VehicleTripLeg[]` (see 4.3) |
| `planMatchStatus` | reserved / null |
| `outOfBoundsFlag` | reserved / null |
| `productiveTrip` | reserved / null |

### 4.3 Trip Leg

`normalizeTripLeg()` produces per-leg fields including `vehicleTripId`, `sequenceNo`,
`startTimeUtc`, `endTimeUtc`, `originDisplayName`, `destinationDisplayName`,
`distanceKm`, `durationMinutes`, `maxSpeedKph`,
`fuelAtDeparture`, `fuelAtArrival`, `fuelConsumed`,
plus the same badge fields (`status`, `reconciliationStatus`, `confidenceScore`,
`confidenceBand`, `anomalyFlags`, `anomalyItems`) as the group.

### 4.4 Anomaly Flag Bitmask

The backend serialises anomaly flags as either a bitmask integer or a comma-separated
string. `getAnomalyItems()` handles both formats.

| Bit | Key | Label | Tone |
|---|---|---|---|
| 1 | LowConfidence | Low confidence | warning |
| 2 | UnknownOriginOrDestination | Unknown endpoint | warning |
| 4 | GpsGapSuspected | GPS gap | warning |
| 8 | OffSiteIdleSuspected | Off-site idle | warning |
| 16 | UnmatchedReturn | Unmatched return | warning |
| 32 | MissingFuelData | Missing fuel | warning |
| 64 | NegativeFuelConsumption | Negative fuel | danger |
| 128 | UnrealisticSpeed | Speed spike | danger |
| 256 | AsymmetricCycle | Asymmetric cycle | warning |
| 512 | NoReturnToOrigin | No return | warning |
| 1024 | WeakFuelData | Weak fuel data | warning |
| 2048 | SuspiciousFuelRate | Suspicious fuel rate | danger |

---

## 5. Pages and Components

### 5.1 Tracking Workspace (`VehicleTrackingPage.js`)
**Route**: `/tracking`

The main real-time operations page. Trip data is an embedded feature alongside the map and vehicle list.

**Trip-specific responsibilities:**
- Renders `VehicleTrackingTripPanel` (slide-in) showing:
  - In-progress trips for the selected vehicle (or all vehicles if none selected)
  - Recent trips (last 12, sorted by end time descending)
  - "Recompute vehicle" button (permission-gated: `canManageTrips`)
  - "Open Trip Management page" shortcut
- Opens `VehicleTripDetailPanel` (slide-in) on "View detail" click
- Opens `VehicleTripOverridePanel` (slide-in) on "Override" click from detail panel
- Calls `recomputeVehicleTrips({ vehicleId, last 24h })` and shows success/error toast

**Trip data source**: `useVehicleTrackingTrips` hook — polls every 30 s,
lookback 24 h, no per-vehicle filter (client-side filtering after fetch).

**Recompute feedback**: DevExtreme `notify` toast only. No progress indicator, no reload
of the trip list after recompute completes. *(See Gap #6.)*

---

### 5.2 Trip Management Page (`VehicleTripsPage.js`)
**Route**: `/trips` (accessible from app drawer / vehicle navigation)

Historical grid workbench for fleet managers and fuel auditors.

**Current state:**
- DevExtreme `DataGrid` with columns for vehicle, date, origin, destination, distance,
  duration, movement profile, detection mode
- Filter bar: vehicle selectbox, movement profile selectbox, detection mode selectbox,
  date range (from/to)
- "Open vehicle" button navigates to vehicle details
- Uses `axiosInstance.get('/vehicletrips', {...params})` directly (does **not** use
  `vehicleTripService.js`) — *(inconsistency to fix, see Gap #5)*

**Missing from this page:**
- Detail drill-down (clicking a row does not open `VehicleTripDetailPanel`)
- Status filter, confidence filter, reconciliation status filter
- Anomaly/confidence badge columns
- Total fuel consumed column
- Override action entry point
- Reconciliation summary section

---

### 5.3 `VehicleTripDetailPanel.js`
M365-style slide panel. Loaded from tracking page and (partially) from vehicle details.

**Shows per trip group:**
- Header badges: status + reconciliation + confidence + anomaly cluster
- Stat cards: distance, duration, fuel consumed, fuel rate, leg count, detection mode
- Leg list: per `VehicleTripLeg` with its own badges and a 2×3 metric grid
- Planning readiness section: five placeholder rows (Project, Work day, Work zone,
  Haul route, Vehicle assignment) all showing "Not linked" — reserved for V2
- Geo-zone type labels (Section, Borrow pit, Dump point, Corridor) — reserved
- Planning rule warnings (Out-of-bounds threshold, Non-productive toggle) — reserved
- Override audit trail section (loads `fetchVehicleTripOverrideHistory`)
- "Override" button (permission-gated) → opens `VehicleTripOverridePanel`
- "Recompute" button → calls `recomputeVehicleTrips`

---

### 5.4 `VehicleTripOverridePanel.js`
M365-style slide panel for the six operator correction actions.

**Actions available:**
| Action key | API endpoint | Key fields |
|---|---|---|
| `split` | `/override/split` | `splitTimeUtc` (datetime-local picker) |
| `merge` | `/override/merge` | `primaryVehicleTripId`, `secondaryVehicleTripId` (selectboxes from leg list) |
| `reassign` | `/override/reassign-site` | `originDisplayName`, `destinationDisplayName` (free text — no site picker yet, see Gap #7) |
| `add` | `/override/add` | start/end datetime, origin/destination name; lat/lng hardcoded to 0,0 (see Gap #8) |
| `delete` | `/override/delete` | reason only |
| `adjust` | `/override/adjust-times` | `overrideStartTimeUtc`, `overrideEndTimeUtc` |

**Governance fields present:**
- Mandatory `reason` text area (required, min length enforced in UI)
- Supervisor approval section (rendered when `tripDetail.status === Completed`)

**Audit trail tab:** renders the `fetchVehicleTripOverrideHistory` list showing action
type, original values, new values, operator, reason, and timestamp.

---

### 5.5 `VehicleTripBadges.js`
Shared badge components used throughout all three access points.

| Component | What it renders |
|---|---|
| `VehicleTripStatusBadge` | In progress (info) / Completed (success) |
| `VehicleTripReconciliationBadge` | Pending / Confirmed / Split / Merged / Adjusted / Anomaly |
| `VehicleTripConfidenceBadge` | High ≥ 0.8 (success) / Medium 0.55–0.8 (warning) / Low < 0.55 (danger) |
| `VehicleTripAnomalyBadges` | Up to 3 visible flags + "+N more" overflow |
| `VehicleTripBadgeCluster` | Composite: status + reconciliation + confidence + anomaly |

---

### 5.6 `vehicleTripUi.js`
Shared utility with no React dependencies, importable anywhere:

- Enum maps for movement profile, status, grouping type, reconciliation status
- `normalizeTripGroup`, `normalizeTripDetail`, `normalizeTripLeg` — defensive camelCase/PascalCase handling
- `getTripStatusConfig`, `getReconciliationConfig`, `getConfidenceConfig`, `getAnomalyItems`
- Format helpers: `formatDateTime`, `formatShortDateTime`, `formatDistance`, `formatDuration`, `formatFuel`
- Date time helpers: `buildDateTimeLocalValue`, `parseDateTimeLocalValue`
- Planning-layer placeholder constants: `PLANNING_ENTITY_PLACEHOLDERS`, `PLANNING_GEO_ZONE_TYPES`, `PLANNING_RULE_PLACEHOLDERS`

---

## 6. Real-Time Strategy

### Currently implemented
The tracking page uses a **dual-channel** approach:

1. **SignalR** (`vehicleTrackingSignalRService`): pushes real-time vehicle position and
   online/offline status. Connection lifecycle is managed by `SignalRConnectionManager`
   (route-based). The hook `useVehicleTrackingRealtime` subscribes and batches updates
   with a debounced flush.

2. **Polling** (`useVehicleTrackingTrips`): polls `GET /vehicletrips` every 30 seconds
   with a 24-hour lookback window to retrieve all recent trip groups and derive
   `inProgressTrips` / `recentTrips`.

### What the backend emits but the frontend does not yet consume
The backend publishes three trip-specific SignalR events to `dashboardHub`:
- `TripStarted` — vehicle ID, origin, departure time, detection mode
- `TripInProgress` — periodic: current distance, current position
- `TripCompleted` — full trip record with all fields

**No handler is registered in `vehicleTrackingSignalRService` or any frontend hook for
these events.** The frontend therefore relies entirely on the 30-second poll.

---

## 7. Known Gaps and Required Work

The following gaps are known as of 2026-03-12. They represent the difference between
the current implementation and the complete frontend picture described in the PRD.

### Gap #1 — No SignalR trip event listener
**Impact**: Trip state changes (start, progress, completion) are visible within ≤ 30 s,
not immediately. Operations staff monitoring dispatch will see a delay.

**Required**: Register `TripStarted`, `TripInProgress`, `TripCompleted` handlers in
`vehicleTrackingSignalRService`. In `useVehicleTrackingTrips`, merge SignalR push events
into the trip groups state so in-progress trips update in real time without waiting for
the next poll.

---

### Gap #2 — Dashboard section not wired (TASKLIST section 22)
**Impact**: The operations dashboard still shows trip placeholders.

**Required**:
- Trip count per vehicle today vs expected metric card
- Vehicles currently in transit list (feeds from `inProgressTrips` already computed)
- Tipper cycle counter (live)
- Anomaly count with review link to the trip management page

---

### Gap #3 — `VehicleTripsPage` is basic
**Impact**: Fleet managers and auditors cannot effectively filter, triage anomalies,
or do drill-downs from the historical workbench.

**Required**:
- Add status, confidence, reconciliation status, and anomaly filter controls
- Add `VehicleTripBadgeCluster` columns (status, reconciliation, confidence, anomaly)
- Add total fuel consumed column
- Wire row-click to open `VehicleTripDetailPanel` (currently opens vehicle page instead)
- Move from direct `axiosInstance` call to `fetchVehicleTripList` / `fetchVehicleTripHistory`
  from `vehicleTripService.js`
- Add reconciliation summary section (count by status category)

---

### Gap #4 — No dedicated navigation menu entry for Trip Management
**Impact**: The trip management page is only accessible from the vehicle details page.
Fleet managers and auditors have no direct route.

**Required**: Add a navigation item in the app navigation for `Trip Management` under
the Vehicles module group. Add route entry in `Content.js` and `app-routes.js` following
the module routing pattern.

---

### Gap #5 — `VehicleTripsPage` bypasses `vehicleTripService.js`
**Impact**: API response normalization differs between the trips page and the tracking
panel, causing inconsistent field names across the same data.

**Required**: Replace the inline `axiosInstance.get('/vehicletrips', ...)` call in
`VehicleTripsPage.js` with `fetchVehicleTripList` from `vehicleTripService.js` and use
`normalizeTripGroup` for all rows.

---

### Gap #6 — Recompute has no loading state or post-recompute refresh
**Impact**: After submitting a recompute, the user sees only a toast notification.
The trip panel does not reload, so the user cannot immediately see the updated trips.

**Required**: Show a loading state in the tracking page while recompute is running.
After completion, call `refreshTrips()` from `useVehicleTrackingTrips` to reload the
trip panel with the new data.

---

### Gap #7 — Override "Reassign site" uses free-text instead of a site picker
**Impact**: Operators can enter any text for origin/destination. There is no validation
against known site names and no `siteId` values are sent for proper database linkage.

**Required**: Replace the free-text inputs with a `SelectBox` bound to the site lookup
(`/sites/simple` or equivalent). Send `overrideOriginSiteId` and `overrideDestinationSiteId`
in the payload alongside the display name overrides.

---

### Gap #8 — Override "Add trip" sends zero coordinates
**Impact**: Manually added trips have `(0, 0)` as start/end coordinates, which will
show incorrectly on any map visualization and may affect distance calculations.

**Required**: Add a map picker or at minimum a lat/lng input pair to the "Add trip"
form. Consider allowing a site-only selection (which resolves to site centroid) as a
simpler first step.

---

### Gap #9 — No on-demand reconciliation trigger in UI
**Impact**: The backend has a `POST /vehicletrips/reconcile` endpoint but there is no
button in the UI to trigger it. Managers must wait for the nightly batch or ask a
developer to call the API manually.

**Required**: Add a "Run reconciliation" button (permission-gated) in the trip management
page toolbar or in the detail panel for a specific vehicle/date.

---

### Gap #10 — Redux state not used for trip data
**Impact**: Trip groups are held in hook-local `useState`. If the user navigates away
and returns, data is re-fetched from scratch. There is no global cache, no optimistic
update on override actions, and no way to share trip state between components without
prop-drilling.

**Required** (medium priority): Create a `vehicleTripsSlice` with Redux Toolkit.
Critical actions: `fetchTripList`, `invalidateTripGroup` (called after override),
`setTripGroupDetail`. Transition `useVehicleTrackingTrips` to dispatch rather than
holding local state.

---

### Gap #11 — No anomaly review / triage view
**Impact**: The anomaly badges show what is wrong but there is no place to review all
anomalies across the fleet for a given day.

**Required**: Add an "Anomaly review" tab or section in the trip management page.
Filter to `anomalyFlags > 0` and `reconciliationStatus = Anomaly`. Show anomaly type
breakdowns and allow bulk re-run or override entry.

---

### Gap #12 — Vehicle configuration `MovementProfile` Redux and form validation
**Impact**: The vehicle edit form has the `MovementProfile` field added but its Redux
slice and save-path validation have not been confirmed (TASKLIST items 19.3, 19.4 open).

**Required**: Confirm the vehicle Redux actions include `movementProfile` in the
create/update payload, and verify the field saves and reloads correctly end-to-end.

---

## 8. Reserved Placeholders (V2 readiness)

The following items are visible in the current UI as reserved labels or empty states.
They are intentionally present to reserve layout space and introduce users to the
concept. No action is required in V1.

| Placeholder | Location | V2 feature |
|---|---|---|
| "Plan match reserved" | `VehicleTrackingTripPanel` timeline card footer | Project planning link |
| "Out-of-bounds reserved" | `VehicleTrackingTripPanel` timeline card footer | Out-of-bounds event |
| Planning entity rows (Project, Work day, Work zone, …) | `VehicleTripDetailPanel` | Project planning integration |
| Geo-zone type labels (Section, Borrow pit, …) | `VehicleTripDetailPanel` | Geo-zone classification |
| Non-productive toggle, out-of-bounds threshold | `VehicleTripDetailPanel` | Productivity reporting rules |
| `PLANNING_ENTITY_PLACEHOLDERS` constant | `vehicleTripUi.js` | Drives the detail panel rows above |

---

## 8.1 V2 Planning & Bounds — Frontend Specification

This section defines the concrete frontend UX for when the planning infrastructure (backend
entities, API endpoints, and database fields) becomes available. It covers how planning
entities are linked, how geo-zones are managed, and where governance rules are configured.

### 8.1.1 Planning Entity Linking (VehicleTripDetailPanel)

The five placeholder cards in the "Planning & bounds readiness" section will become
**interactive read/write controls** that link a trip group to planning entities.

| Entity | V1 state | V2 UX |
|---|---|---|
| **Project** | "Not linked" static text | `SelectBox` populated from `GET /projects?siteId={tripOriginSiteId}` — search-enabled, shows project name + code. When selected, `PATCH /vehicletrips/{groupId}/planning` sends `{ projectId }`. |
| **Work day** | "Not linked" static text | `SelectBox` populated from `GET /projects/{projectId}/workdays?date={tripDate}` — shows shift label + date. Depends on project selection. Disabled until project is chosen. |
| **Work zone** | "Not linked" static text | `SelectBox` populated from `GET /projects/{projectId}/zones?type=WorkZone` — shows zone name + type badge. Depends on project selection. |
| **Haul route** | "Not linked" static text | `SelectBox` populated from `GET /projects/{projectId}/haulroutes` — shows route label + origin→destination. Depends on project selection. |
| **Vehicle assignment** | "Reserved" static text | Read-only display. If the vehicle is assigned to the linked project for the trip date, shows assignment label + status badge. If not assigned, shows "Not assigned" with a warning icon. |

**Cascade behavior:**
1. User selects **Project** → Work day, Work zone, and Haul route selectors become enabled and load their options filtered to that project.
2. User selects **Work day** → if only one shift exists for date, auto-selects.
3. Clearing **Project** clears all dependent selections.

**Permission gate:** Only users with `canManageTrips` may change planning links. Read-only
users see the linked values as text labels (no dropdowns).

**API contract (V2):**
```
PATCH /api/v1/vehicletrips/{vehicleTripGroupId}/planning
Body: {
  projectId: number | null,
  workDayId: number | null,
  workZoneId: number | null,
  haulRouteId: number | null
}
Response: FMSResponse<PlanningLinkDto>
```

**Service layer addition (`vehicleTripService.js`):**
```javascript
export const updateTripPlanningLink = async (vehicleTripGroupId, payload) => { ... };
export const fetchProjectLookup = async (siteId) => { ... };
export const fetchProjectWorkDays = async (projectId, date) => { ... };
export const fetchProjectZones = async (projectId, type) => { ... };
export const fetchProjectHaulRoutes = async (projectId) => { ... };
```

### 8.1.2 Geo-Zone Administration (VehicleTripSettingsPage — new section)

The settings page will gain a new **"Planning zones & boundaries"** section below the
existing confidence scoring section. This is where administrators define the geo-zone
polygons that the trip engine uses for plan matching and out-of-bounds detection.

**Section layout:**

```
┌─────────────────────────────────────────────────┐
│  Planning zones & boundaries                     │
│  ───────────────────────────────────────────     │
│                                                  │
│  Geo-zone types                                  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│  │  Section   │ │Borrow pit │ │Dump point │     │
│  │  12 zones  │ │  8 zones  │ │  6 zones  │     │
│  │  [Manage]  │ │  [Manage] │ │  [Manage] │     │
│  └───────────┘ └───────────┘ └───────────┘     │
│  ┌───────────┐                                   │
│  │ Corridor   │                                  │
│  │  4 zones   │                                  │
│  │  [Manage]  │                                  │
│  └───────────┘                                   │
│                                                  │
│  Out-of-bounds governance                        │
│  ┌──────────────────────────────────────────┐   │
│  │ Time threshold (minutes)     [ 5     ]   │   │
│  │ Distance threshold (km)      [ 0.50  ]   │   │
│  │ Enable out-of-bounds events  [✓]         │   │
│  │ Exclude non-productive trips [✓]         │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Trip-to-plan matching                           │
│  ┌──────────────────────────────────────────┐   │
│  │ Auto-match trips to nearest zone  [✓]    │   │
│  │ Match radius (m)              [ 150   ]  │   │
│  │ Require project assignment    [ ]        │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**"Manage" action** for each zone type opens a **slide panel** (`GeoZoneManagementPanel`)
with a DataGrid showing all zones of that type. Each row shows: zone name, polygon point
count, associated project/site, created date, status. A "Create zone" action opens a form
with a polygon draw tool (map-based) or manual coordinate entry.

**API endpoints (V2):**
```
GET    /api/v1/geozones?type={Section|BorrowPit|DumpPoint|Corridor}
POST   /api/v1/geozones
PUT    /api/v1/geozones/{geoZoneId}
DELETE /api/v1/geozones/{geoZoneId}
```

**Settings API extension (V2):**
The existing `/vehicletrips/settings` payload will be extended with:
```json
{
  "outOfBoundsTimeThresholdMinutes": 5,
  "outOfBoundsDistanceThresholdKm": 0.50,
  "enableOutOfBoundsEvents": true,
  "excludeNonProductiveTrips": true,
  "autoMatchTripsToNearestZone": true,
  "planMatchRadiusMeters": 150,
  "requireProjectAssignment": false
}
```

### 8.1.3 Geo-Zone Type Details

Each geo-zone type has a specific purpose in the trip classification pipeline:

| Type | Purpose | Shape | Typical count per project |
|---|---|---|---|
| **Section** | Named subdivision of a site where work is directed | Polygon | 2–10 |
| **Borrow pit** | Material extraction origin (loading area) | Polygon | 1–4 |
| **Dump point** | Material deposit destination (offloading area) | Polygon | 1–6 |
| **Corridor** | Approved haul road between origin and destination | Polyline with buffer width | 1–3 |

When a trip leg's origin/destination coordinates fall inside a geo-zone polygon, the
trip is classified with that zone type and linked to the associated project zone.

### 8.1.4 Trip-to-Plan Matching Display (VehicleTripDetailPanel)

When a trip group has planning links, the detail panel evolves:

**Linked state:**
```
┌─────────────────────────────────────────────────┐
│  Planning & bounds                               │
│  ───────────────────────────────────────────     │
│                                                  │
│  Project         Galana Phase 2      [✓ Linked] │
│  Work day        2026-03-13 Day      [✓ Linked] │
│  Work zone       Section B — Cut 3   [✓ Linked] │
│  Haul route      Pit A → Dump 2      [✓ Linked] │
│  Vehicle assigned P-05 Tipper        [✓ Active] │
│                                                  │
│  Plan match      Matched ✓           score: 0.92│
│  Out-of-bounds   None                            │
│  Productive      Yes ✓                           │
│                                                  │
│  Geo-zones hit                                   │
│  [Borrow pit] Pit A  →  [Dump point] Dump 2     │
│  [Corridor] Main haul road (98% within)          │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Unlinked state (current V1 — with improved labels):**
```
┌─────────────────────────────────────────────────┐
│  Planning & bounds readiness                     │
│  ───────────────────────────────────────────     │
│                                                  │
│  ℹ️ Classification uses Site geofences. Project- │
│     level zones require the planning module.     │
│                                                  │
│  Project         Not linked  [V2 — select box]  │
│  Work day        Not linked  [V2 — cascaded]    │
│  Work zone       Not linked  [V2 — cascaded]    │
│  Haul route      Not linked  [V2 — cascaded]    │
│  Vehicle assign  Reserved    [V2 — auto-read]   │
│                                                  │
│  Geo-zone types  Section · Borrow pit ·          │
│                  Dump point · Corridor            │
│                  [V2 — manage in Settings]        │
│                                                  │
│  Rules                                           │
│  · Trip-to-plan matching   [V2 — Settings]       │
│  · Out-of-bounds threshold [V2 — Settings]       │
│  · Non-productive toggle   [V2 — Settings]       │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 8.1.5 VehicleTripsPage — Planning Filters (V2)

The trip management workbench grid will gain additional filter controls:

| Filter | Type | Source |
|---|---|---|
| Project | `SelectBox` with search | `GET /projects` |
| Section | `SelectBox` | `GET /geozones?type=Section&projectId={selected}` |
| Borrow pit | `SelectBox` | `GET /geozones?type=BorrowPit&projectId={selected}` |
| Dump point | `SelectBox` | `GET /geozones?type=DumpPoint&projectId={selected}` |
| Plan match status | `select` (native) | Options: All / Matched / Unmatched / Partial |
| Out-of-bounds | `select` (native) | Options: All / In bounds / Out of bounds |
| Productive | `select` (native) | Options: All / Productive / Non-productive |

**Grid columns added:**
| Column | Data field | Badge style |
|---|---|---|
| Plan match | `planMatchStatus` | Green "Matched" / Orange "Partial" / Red "Unmatched" |
| Origin zone | `originGeoZoneName` | Zone type pill + name |
| Destination zone | `destinationGeoZoneName` | Zone type pill + name |
| Out-of-bounds | `isOutOfBounds` | Red flag icon if true |

### 8.1.6 VehicleTrackingTripPanel — Planning Indicators (V2)

The tracking page timeline cards currently show reserved footer labels. In V2:

| Label | V2 behavior |
|---|---|
| "Plan match reserved" | Replaced with plan match badge: "Matched" (green) / "Unmatched" (gray) / "Out of bounds" (red) |
| "Out-of-bounds reserved" | Replaced with out-of-bounds indicator: duration + distance beyond boundary, or "In bounds" (hidden) |

### 8.1.7 Component File Map (V2 additions)

```
fms.frontend/src/pages/vehicles/trips/
├── components/
│   ├── VehicleTripPlanningSection.js     ← extracted from VehicleTripDetailPanel planning region
│   ├── VehicleTripPlanningSection.scss
│   ├── GeoZoneManagementPanel.js         ← slide panel for CRUD on geo-zones per type
│   └── GeoZoneManagementPanel.scss
├── services/
│   └── vehicleTripService.js             ← add planning link, geo-zone, and project lookup APIs
└── utils/
    └── vehicleTripUi.js                  ← add geo-zone type config, plan match status map
```

---

## 9. Frontend Task Summary

### Complete ✅
- Tracking page trip panel (slide-in, in-progress + recent, recompute action)
- Trip detail panel (group + legs + badges + fuel fields + override entry)
- Override panel (all six actions + audit trail + supervisor approval)
- Badge components (status, reconciliation, confidence, anomaly)
- Shared UI utilities (`vehicleTripUi.js`)
- Trip service layer (`vehicleTripService.js`) covering all API endpoints
- Movement profile field in vehicle create/edit forms
- Planning-readiness placeholder sections

### Incomplete / Required ❌
| # | Gap | Priority |
|---|---|---|
| 1 | SignalR trip event listener | High |
| 2 | Dashboard trip widgets | High |
| 3 | `VehicleTripsPage` filters, badges, drill-down, reconciliation summary | High |
| 4 | Navigation menu entry for Trip Management | Medium |
| 5 | `VehicleTripsPage` → use `vehicleTripService.js` | Medium |
| 6 | Recompute loading state + post-recompute refresh | Medium |
| 7 | Override reassign-site: site picker + siteId | Medium |
| 8 | Override add-trip: coordinates input | Low |
| 9 | On-demand reconciliation trigger in UI | Medium |
| 10 | Redux slice for trip state | Medium |
| 11 | Anomaly review / triage view | Low |
| 12 | Vehicle `movementProfile` Redux + form validation confirm | Medium |

---

## 10. Component & File Map

```
fms.frontend/src/
├── pages/vehicles/
│   ├── tracking/
│   │   ├── VehicleTrackingPage.js           ← main tracking workspace
│   │   ├── components/
│   │   │   ├── VehicleTrackingTripPanel.js  ← slide-in trip timeline
│   │   │   └── VehicleTrackingDetailPopup.js
│   │   └── hooks/
│   │       ├── useVehicleTrackingTrips.js   ← 30-second poll + in-progress/recent derivation
│   │       └── useVehicleTrackingRealtime.js← SignalR position updates
│   │
│   └── trips/
│       ├── VehicleTripsPage.js             ← historical grid workbench (incomplete)
│       ├── components/
│       │   ├── VehicleTripDetailPanel.js   ← drill-down side panel
│       │   ├── VehicleTripDetailPanel.scss
│       │   ├── VehicleTripOverridePanel.js ← override action panel
│       │   ├── VehicleTripOverridePanel.scss
│       │   ├── VehicleTripBadges.js        ← status/confidence/anomaly badge components
│       │   └── VehicleTripBadges.scss
│       ├── services/
│       │   └── vehicleTripService.js       ← ALL trip API calls
│       └── utils/
│           └── vehicleTripUi.js            ← normalizers, formatters, badge config
│
└── signalR/
    └── vehicleTrackingSignalRService.js    ← SignalR singleton (trip events not yet wired)
```
