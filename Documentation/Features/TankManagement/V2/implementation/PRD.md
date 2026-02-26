# PRD: /admin/tank — M365 Redesign (V2)

> **Version:** 2.0
> **Date:** 2026-02-25
> **Status:** Draft
> **Domain:** TankManagement

---

## 1. Executive Summary

Redesign the `/admin/tank` page to align with the **M365 Admin Center Fluent Design** language. The current implementation spans a 888-line `tankPage.js` plus 4 sub-components (`TankDetails.js` 518 lines, `TankForm.js` 559 lines, `TankHistory.js` 565 lines, `PTSDeviceLinkPopup.js` 746 lines). The page will be restructured with M365 design tokens, flat native controls, and a cleaner component hierarchy.

**Key goals:**
- Full M365 Fluent Design compliance (flat chrome, native controls, compact density)
- TreeList master–detail layout with M365 styling (site→tank hierarchy)
- Redesigned detail panel with M365 section cards and live PTS data
- Popup forms for Create/Edit Tank, Tank History, PTS Device Link
- Richer site summary view when a site node is selected
- M365 command bar with contextual actions
- SRP file structure — no file exceeds 600 lines

---

## 2. Current State Analysis

### 2.1 Existing Files

| File | Lines | Purpose |
|---|---|---|
| `tankPage.js` | 888 | TreeList + detail panel + popup orchestration |
| `components/TankDetails.js` | 518 | Tank detail view — gauge, config, dimensions, PTS live data, location |
| `components/TankForm.js` | 559 | Create/edit form — all tank fields + location validation |
| `components/TankHistory.js` | 565 | Volume history — DataGrid + Chart with date filters & Excel export |
| `components/PTSDeviceLinkPopup.js` | 746 | PTS device selection, probe mapping, SignalR live data |
| `tankPage.scss` | 514 | Custom Tailwind-style variables, gradients, transforms |
| `components/TankHistory.scss` | — | History-specific styling |

### 2.2 Current Pain Points

1. **`tankPage.js` exceeds 600-line limit** — contains tree data transformation, site summary rendering, selection handling, and popup orchestration.
2. **`PTSDeviceLinkPopup.js` exceeds 600-line limit (746 lines)** — complex PTS device/probe selection with SignalR integration.
3. **Inconsistent design** — gradient headers (`tw-bg-gradient-to-r tw-from-slate-800 tw-to-slate-700`), transform hover effects, circular SVG gauge — none of these are M365 patterns.
4. **SCSS uses custom variables** — `$primary-color: #3b82f6`, gradient fills, shimmer animations — all conflict with M365 flat chrome.
5. **`InfoRow` and `SectionCard` duplicated** — `TankDetails.js` re-declares `InfoRow` and `SectionCard` locally instead of importing shared components.
6. **Site summary is inline** — the "Site → Tank Summary" view (~100 lines of JSX) is rendered inline in `tankPage.js`.
7. **Circular gauge is custom SVG** — not an M365 pattern; should be replaced with a flat progress bar or M365-style metric card.
8. **Tree columns render as custom functions** — `nameRender`, `volumeRender`, `stockRender` are all inline in the main file.

### 2.3 Backend Entity State

The `Tank` entity currently has:
- `Id`, `Name`, `TankVolume`, `TankHeight`, `TankLength`
- `PtsId`, `ProbeNumber`, `PtsTankId`, `UsePtsProbeReadings`
- `UseBookKeeping`, `HasAutomaticBookKeeping`, `Priority`
- `SiteId`, `DiscrepancyThreshold`, `CurrentStock`
- `LastStockUpdate`, `PhysicalStockValue`, `LastPhysicalStockUpdate`, `PhysicalStockSource`
- `FuelGradeId`, `FuelGradeName`
- `TankType` (Stationary/MobileTanker), `Latitude`, `Longitude`, `LinkedVehicleId`, `LocationValidationRadius`

**No Domain changes required** — all needed fields already exist.

---

## 3. Proposed Design

### 3.1 Page Layout (M365 Admin Center Style)

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header                                                 │
│  [icon] Tanks (18)         [+ Add Tank] [Refresh] [⋯ More]  │
├──────────────────────────────────────────────────────────────┤
│  Command Bar (contextual)                                    │
│  [Edit] [History] [Link PTS] [Unassign] [Delete]             │
│  (enabled/disabled based on selection)                       │
├──────────────┬───────────────────────────────────────────────┤
│  Tree List   │  Detail Panel                                 │
│              │                                               │
│  ▼ Site A    │  ┌── Tank Header ─────────────────────────┐   │
│    ├ Tank 1  │  │  [🛢] Tank 1          [Active ●]        │   │
│    └ Tank 2  │  │  Site: Site A  PTS: PTS001  Probe: 1   │   │
│              │  │  Fill: ████████░░ 75% (7,500 / 10,000L)│   │
│  ▼ Site B    │  └────────────────────────────────────────┘   │
│    └ Tank 3  │                                               │
│              │  ┌── Configuration ────────────────────────┐   │
│  ▼ Unassigned│  │  Book Keeping: Enabled                  │   │
│    └ Tank 4  │  │  Auto Book:    Enabled                  │   │
│              │  │  Priority:     High                     │   │
│              │  │  Fuel Grade:   Diesel                   │   │
│              │  │  Threshold:    500 L                    │   │
│              │  └────────────────────────────────────────┘   │
│              │                                               │
│              │  ┌── Dimensions ──────────────────────────┐   │
│              │  │  Height: 2.5m  Length: 4.0m             │   │
│              │  │  Volume: 10,000 L                       │   │
│              │  └────────────────────────────────────────┘   │
│              │                                               │
│              │  ┌── PTS Live Data ───────────────────────┐   │
│              │  │  Connection: Connected  Probe: 1       │   │
│              │  │  Volume: 7,523 L  Temp: 24.5°C         │   │
│              │  │  Product Height: 1,250 mm               │   │
│              │  │  Water Height: 5 mm                     │   │
│              │  └────────────────────────────────────────┘   │
│              │                                               │
│              │  ┌── Location ────────────────────────────┐   │
│              │  │  Type: Stationary   Radius: 100m       │   │
│              │  │  Lat: -1.283   Lng: 36.817             │   │
│              │  └────────────────────────────────────────┘   │
└──────────────┴───────────────────────────────────────────────┘
```

### 3.2 Tree List (M365 Style)

The TreeList keeps the site→tank hierarchy but with M365 styling:

```
┌──────────────────────────────────────────────┐
│ ▼ [🏢] Nairobi Depot                         │
│   ├ [🛢] Main Tank          10,000 L   75%   │
│   └ [🚛] Mobile Unit 1      2,000 L   45%   │
│ ▼ [🏢] Mombasa Site                          │
│   └ [🛢] Storage Tank       15,000 L   90%   │
│ ▶ [🏢] Unassigned                            │
│   └ [🛢] Spare Tank          5,000 L    0%   │
└──────────────────────────────────────────────┘
```

- **Site rows**: Building icon, site name, no volume data
- **Tank rows**: Tank/truck icon, name, capacity, current stock percentage
- **Mobile tanker badge**: Orange pill `[Mobile]`
- **Selected row**: `--m365-selected-bg: #e5f1fb`
- **Expand/collapse**: M365 chevron indicators

### 3.3 Tank Detail Panel (M365 Style)

Replaces the gradient header + SVG gauge with M365 flat design:

**Header:**
```
┌──────────────────────────────────────────────────────┐
│  [🛢]  Tank Name                                      │
│        Site: Nairobi Depot  •  PTS: PTS001            │
│        Probe: 1  •  Diesel                            │
│                                                       │
│  Fill Level:                                          │
│  ████████████████████░░░░░░░  75.0%                   │
│  Current: 7,500 L  |  Capacity: 10,000 L  |  Avail: 2,500 L │
└──────────────────────────────────────────────────────┘
```

- **No gradient background** — flat `--m365-surface` white
- **No SVG circular gauge** — replaced with M365 linear progress bar
- **Status color**: Red (<20%), Amber (<50%), Green (<80%), Blue (≥80%)
- **Metric row**: Current / Capacity / Available in a compact line

**Sections:**
Each section uses `M365SectionCard`:
1. **Configuration** — Book Keeping, Auto Book, Priority, Fuel Grade, Threshold
2. **Dimensions** — Height, Length, Volume
3. **Status** — Last Book Update, Physical Stock, Physical Updated, Stock Source
4. **PTS Live Data** — Connection, Probe, Volume, Temperature, Product/Water Height
5. **Location Validation** — Tank Type, Radius, Lat/Lng or Linked Vehicle

### 3.4 Site Summary View (when site node selected)

```
┌──────────────────────────────────────────────────────┐
│  [🏢]  Site Name — Tank Summary                       │
├──────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐                        │
│  │ 15K L│  │ 12K L│  │  3K L│                        │
│  │Capac.│  │Stock │  │Avail │                        │
│  └──────┘  └──────┘  └──────┘                        │
│                                                       │
│  Overall Fill: ████████████████░░░  80.0%              │
│                                                       │
│  ┌── Individual Tanks (3) ───────────────────────┐    │
│  │  [🛢] Tank 1    10,000 L    ████████░░  75%   │    │
│  │  [🛢] Tank 2     3,000 L    ██████████  95%   │    │
│  │  [🚛] Mobile 1   2,000 L    ████░░░░░░  45%   │    │
│  └───────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

### 3.5 Create / Edit Tank Popup

Existing `TankForm.js` (559 lines) restructured with M365 styling:

```
┌──────────────────────────────────────────────────────┐
│  Create Tank  /  Edit Tank                     [✕]   │
├──────────────────────────────────────────────────────┤
│  m365-section: Basic Information                      │
│    Tank Name *       [________________________]       │
│    Site              [Select site ▾           ]       │
│    Tank Capacity *   [____________] L                 │
│    Current Stock     [____________] L                 │
├──────────────────────────────────────────────────────┤
│  m365-section: Dimensions                             │
│    Height            [____________] m                 │
│    Length            [____________] m                  │
├──────────────────────────────────────────────────────┤
│  m365-section: Configuration                          │
│    Threshold         [____________] L                 │
│    Book Keeping      [✓]                              │
│    Auto Book Keep.   [✓]                              │
│    Priority          [Select ▾    ]                   │
│    Fuel Grade        [Select ▾    ]                   │
├──────────────────────────────────────────────────────┤
│  m365-section: Location Validation                    │
│    Tank Type *       [Stationary ▾]                   │
│    Validation Radius [____100____] m                  │
│    Latitude          [-1.283     ]  (stationary)      │
│    Longitude         [36.817     ]  (stationary)      │
│    Linked Vehicle    [Select ▾   ]  (mobile only)     │
├──────────────────────────────────────────────────────┤
│                          [Cancel]  [Save / Create]    │
└──────────────────────────────────────────────────────┘
```

---

## 4. Component Architecture

### 4.1 File Decomposition

```
fms.frontend/src/pages/tank/
├── TankPage.js                      # Page shell — header, command bar, split layout (~250 lines)
├── TankPage.scss                    # M365-themed SCSS with design tokens (~150 lines)
├── components/
│   ├── TankCommandBar.js            # M365 command bar — Add, Edit, History, Link PTS, etc. (~100 lines)
│   ├── TankTreeList.js              # TreeList with site→tank hierarchy, custom renders (~200 lines)
│   ├── TankDetailPanel.js           # Tank detail — header, fill bar, sections (~350 lines)
│   ├── TankSiteSummary.js           # Site summary view — stats + tank cards (~200 lines)
│   ├── TankEmptyState.js            # Empty selection state (~30 lines)
│   ├── TankFormPopup.js             # Create/Edit form popup (~350 lines)
│   ├── TankHistoryPopup.js          # History popup — DataGrid + Chart (~400 lines)
│   ├── TankHistoryChart.js          # Chart view extracted from TankHistory (~150 lines)
│   ├── PTSDeviceLinkPopup.js        # PTS device link — device list + probe select (~350 lines)
│   ├── PTSProbeSelector.js          # Probe channel selection UI (~200 lines)
│   └── PTSDeviceList.js             # PTS device list with live status (~200 lines)
├── hooks/
│   └── useTankData.js               # Data fetching, tree transform, selection (~150 lines)
```

### 4.2 Key Decomposition Decisions

| Current | Problem | V2 Solution |
|---|---|---|
| `tankPage.js` (888 lines) | Over limit, mixes tree logic + site summary + popup state | Split into `TankPage.js` (shell) + `TankTreeList.js` + `TankSiteSummary.js` + `useTankData.js` |
| `TankDetails.js` (518 lines) | Declares own `InfoRow`/`SectionCard`, SVG gauge | → `TankDetailPanel.js` using shared M365 components, linear progress bar |
| `TankForm.js` (559 lines) | Acceptable but near limit | → `TankFormPopup.js` with M365 form styling |
| `TankHistory.js` (565 lines) | Near limit, chart + grid + export in one file | → `TankHistoryPopup.js` (grid) + `TankHistoryChart.js` (chart) |
| `PTSDeviceLinkPopup.js` (746 lines) | Over limit, device list + probe selector + SignalR logic | → `PTSDeviceLinkPopup.js` (orchestrator) + `PTSDeviceList.js` + `PTSProbeSelector.js` |

### 4.3 Shared Components (from `src/components/m365/`)

| Component | Purpose |
|---|---|
| `M365InfoRow` | Label + value row with icon |
| `M365SectionCard` | Section with M365 header bar |
| `M365StatusBadge` | Status pill (Active/Inactive, Connected/Disconnected) |
| `M365PageHeader` | Page title with count and action slots |
| `M365ProgressBar` | Linear fill-level bar with status colors |

---

## 5. Design Token Mapping

### 5.1 SCSS Variables → M365 Tokens

| Current (tankPage.scss) | M365 Token |
|---|---|
| `$primary-color: #3b82f6` | `--m365-primary: #0078d4` |
| `$secondary-color: #10b981` | `--m365-success: #107c10` |
| `$danger-color: #ef4444` | `--m365-error: #d13438` |
| `$warning-color: #f59e0b` | `--m365-warning: #797775` |
| Gradient headers, shimmer animations | Flat `--m365-surface: #ffffff` |
| `border-radius: 12px` | `border-radius: 4px` |
| Hover `transform: translateY(-5px)` | Flat hover `--m365-hover-bg: #f5f5f5` |
| Box shadows (`$shadow-lg`, `$shadow-md`) | `box-shadow: 0 1px 2px rgba(0,0,0,0.1)` |

### 5.2 Tank Gauge: Current → M365

| Current | M365 |
|---|---|
| Custom SVG circular gauge (28×28 viewBox) | Linear progress bar with status color |
| Gradient fill animations | Flat fill with transition |
| Status text inside circle | Percentage + status text beside bar |

### 5.3 Tree List Styling

| Current | M365 |
|---|---|
| Gradient header row | Flat `--m365-surface` with subtle border |
| Row hover with transform | Row hover with `--m365-hover-bg` |
| Custom `border-left: 4px` on selection | M365 selected row: `--m365-selected-bg: #e5f1fb` |
| Shimmer progress bars | Static progress fill with status colors |

---

## 6. Data & API Changes

### 6.1 Backend Changes

**No Domain changes required.** All tank fields are present.

**No new endpoints required.** Existing Tank CRUD and volume history endpoints suffice.

### 6.2 Frontend Data Flow

| Action | Current API | V2 Notes |
|---|---|---|
| `fetchTanks()` | `GET /tank` | No change — fetches all tanks |
| `fetchSiteList()` | `GET /site` | No change — needed for tree hierarchy |
| `createTank()` | `POST /tank` | No change |
| `updateTank(id)` | `PUT /tank/{id}` | No change |
| `deleteTank(id)` | `DELETE /tank/{id}` | No change |
| `fetchTankVolumeHistory()` | `GET /tank/volume-history` | No change |
| PTS device list | `fetchPTSDevices()` | No change |
| PTS SignalR | `ptsSignalRService` | No change — live data for probe readings |

### 6.3 Tree Data Transformation

The current tree transformation logic (`transformedTreeData` in `tankPage.js`) maps sites and tanks into a parent-child structure:

```javascript
// Site node: { id: "site_1", name: "Nairobi", type: "site", parentId: null, siteId: 1 }
// Tank node: { id: "tank_5", name: "Main Tank", type: "tank", parentId: "site_1", tankData: {...} }
// Unassigned: { id: "site_unassigned", name: "Unassigned Tanks", type: "site", parentId: null }
```

This logic moves to `useTankData.js` hook.

---

## 7. Interaction Flows

### 7.1 View Tank Details

1. User loads `/admin/tank` → TreeList renders site→tank hierarchy
2. All site nodes expanded by default
3. User clicks a tank node → `TankDetailPanel` renders with M365 sections
4. PTS live data updates via SignalR (if tank has `ptsId`)

### 7.2 View Site Summary

1. User clicks a site node in the tree
2. `TankSiteSummary` renders: capacity/stock/available stats → overall fill bar → individual tank cards
3. Each tank card shows name, capacity, fill percentage with status color

### 7.3 Create Tank

1. User clicks **[+ Add Tank]** in command bar
2. `TankFormPopup` opens — empty form with default values (`tankType: "Stationary"`, `locationValidationRadius: 100`)
3. User fills required fields (Name, Capacity) and optional fields
4. Validation: Name required, Capacity > 0, only one tank per active site
5. `POST /tank` → success → popup closes → tree refreshes

### 7.4 Edit Tank

1. User selects a tank → clicks **[Edit]** in command bar
2. `TankFormPopup` opens — pre-filled with tank data
3. User modifies fields → clicks **Save**
4. `PUT /tank/{id}` → success → popup closes → detail panel refreshes with updated data

### 7.5 View Tank History

1. User selects a tank → clicks **[History]** in command bar
2. `TankHistoryPopup` opens — full-screen popup
3. Date range filter (default: today) → table or chart view toggle
4. Table: DataGrid with timestamp, volume, change, type, vehicle columns
5. Chart: Line chart of volume over time with tooltips
6. Export: Excel export via `exceljs`

### 7.6 Link PTS Device

1. User selects a tank → clicks **[Link PTS]** in command bar
2. `PTSDeviceLinkPopup` opens
3. `PTSDeviceList` shows all PTS devices with live connection status (SignalR)
4. User selects a device → `PTSProbeSelector` shows available probe channels
5. User selects probe number and toggles "Use PTS probe readings"
6. **Save** → `PUT /tank/{id}` with `ptsId`, `probeNumber`, `usePtsProbeReadings`

### 7.7 Unassign Tank

1. User selects a tank → clicks **[Unassign]** in command bar
2. M365 confirmation dialog: "Unassign tank 'Tank Name' from its current site?"
3. Confirm → moves tank to the inactive/unassigned site → tree refreshes

### 7.8 Delete Tank

1. User selects a tank → clicks **[Delete]** in command bar
2. M365 confirmation dialog: "Delete tank 'Tank Name'? This action cannot be undone."
3. Confirm → `DELETE /tank/{id}` → success → selection cleared → tree refreshes

---

## 8. Permissions

| Permission | Actions |
|---|---|
| `_Manage_Tank` (or general admin) | Create, Edit, Delete, Unassign, Link PTS |
| Implied read | View tank list, details, history |

Permission check via JWT-based `usePermissions` hook:

```javascript
const { hasPermission } = usePermissions();
const canManageTank = hasPermission('_Manage_Tank');
```

> **Note:** Current implementation does not gate tank actions behind a specific permission — all actions appear available. V2 should add proper permission checks.

---

## 9. Migration Strategy

### 9.1 Component Migration Map

| Current Element | V2 Component |
|---|---|
| Tree data transformation (`transformedTreeData`) | `useTankData.js` hook |
| Inline `nameRender`, `volumeRender`, `stockRender` | `TankTreeList.js` internal renders |
| Header + segmented button group | `TankCommandBar.js` |
| `TankDetails.js` (518 lines) | `TankDetailPanel.js` with shared M365 components |
| Inline `InfoRow`, `SectionCard` in TankDetails | `M365InfoRow`, `M365SectionCard` shared |
| SVG circular gauge | `M365ProgressBar` (linear) |
| Inline site summary JSX | `TankSiteSummary.js` |
| `TankForm.js` (559 lines) | `TankFormPopup.js` with M365 form styling |
| `TankHistory.js` (565 lines) | `TankHistoryPopup.js` + `TankHistoryChart.js` |
| `PTSDeviceLinkPopup.js` (746 lines) | `PTSDeviceLinkPopup.js` + `PTSDeviceList.js` + `PTSProbeSelector.js` |
| `tankPage.scss` (514 lines) | `TankPage.scss` with M365 tokens (~150 lines) |

### 9.2 State Management

Move tank-page-specific state to `useTankData` hook:

```javascript
// hooks/useTankData.js
export const useTankData = () => {
  const dispatch = useDispatch();
  const { tanks, loading: tanksLoading } = useSelector(state => state.tank);
  const { sites } = useSelector(state => state.site);
  const connectionStatuses = useSelector(state => state.deviceConnections?.connectionStatuses || {});
  const uploadStatusByDevice = useSelector(state => state.realtimeStatus?.uploadStatusByDevice || {});

  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);

  // Tree data transformation (memoized)
  const treeData = useMemo(() => { /* site→tank hierarchy logic */ }, [sites, tanks]);

  // Selected tank's live PTS status
  const liveStatus = selectedTank?.ptsId ? uploadStatusByDevice[selectedTank.ptsId] : null;
  const connectionStatus = selectedTank?.ptsId ? connectionStatuses[selectedTank.ptsId] : null;

  return { tanks, sites, treeData, selectedTank, selectedSite, liveStatus, connectionStatus, ... };
};
```

---

## 10. Quality Checklist

- [ ] M365 design tokens used throughout (no custom color variables)
- [ ] All components under 600 lines
- [ ] Shared M365 components imported from `src/components/m365/`
- [ ] `tw-` prefix on all Tailwind classes
- [ ] `fa-light` icon prefix only
- [ ] SCSS files, not CSS
- [ ] No SVG circular gauge — replaced with M365 linear progress bar
- [ ] No gradient headers or shimmer animations
- [ ] No hover transforms or heavy shadows
- [ ] PTS SignalR integration preserved (live connection status, probe readings)
- [ ] Tank history chart + grid + export all functional
- [ ] Mobile responsive with detail panel collapse (back button on mobile)
- [ ] Permission checks added for tank management actions
- [ ] Inline `InfoRow`/`SectionCard` replaced with shared M365 components
