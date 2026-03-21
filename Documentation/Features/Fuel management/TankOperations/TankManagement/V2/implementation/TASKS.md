# Task List: /admin/tank M365 Redesign (V2)

> **PRD Reference:** [PRD.md](PRD.md)
> **Date:** 2026-02-25
> **Estimated Tasks:** 22

---

## Legend

| Symbol | Meaning |
|---|---|
| ⬜ | Not started |
| 🔄 | In Progress |
| ✅ | Complete |
| 🔗 | Depends on another task |

---

## Phase 1: Shared M365 Components

> Build or verify shared M365 components needed by the tank page.
> These may already exist from the Site V2 or User V2 work.

### Task 1.1 ⬜ — Verify / Create Shared M365 Components

- [ ] Verify that the following components exist in `fms.frontend/src/components/m365/`:
  - `M365InfoRow.js`
  - `M365SectionCard.js`
  - `M365StatusBadge.js`
  - `M365PageHeader.js`
  - `m365-shared.scss`
- [ ] If not created by Site V2, create them (see Site V2 Task 2.1 for specs)
- [ ] Add `M365ProgressBar.js` — linear progress bar with status colors:
  - Props: `value` (0-100), `label`, `showPercentage`
  - Colors: Red (<20%), Amber (<50%), Green (<80%), Blue (≥80%)
  - M365 flat styling, 8px height, 4px border-radius

**Files:**
- `fms.frontend/src/components/m365/M365ProgressBar.js`
- `fms.frontend/src/components/m365/` (verify existing)

---

## Phase 2: Tank Page — Foundation

> Build the new page shell, hook, and SCSS.

### Task 2.1 ⬜ — Create useTankData Hook

- [ ] Create `fms.frontend/src/pages/tank/hooks/useTankData.js`
  - Dispatch `fetchTanks()` and `fetchSiteList()` on mount
  - Move tree data transformation logic from `tankPage.js` into hook
  - Manage: `selectedTank`, `selectedSite`, `showDetailsOnMobile`
  - Provide: `treeData`, `selectedTankLiveStatus`, `selectedTankConnection`
  - Expose: `handleTreeSelection`, `handleRefresh`
  - Helper: `getSiteTanksSummary(siteId)` (memoized)
  - Helper: `getInactiveSiteId()` for unassign logic

**Files:**
- `fms.frontend/src/pages/tank/hooks/useTankData.js`

---

### Task 2.2 ⬜ — Create TankPage.scss (M365 Tokens)

- [ ] Replace `tankPage.scss` with M365-themed SCSS
  - CSS custom properties for M365 design tokens
  - No gradients, no shimmer animations, no transform hover effects
  - Flat surfaces, 4px border-radius
  - Control heights: 34px
  - TreeList row styling with M365 selected/hover states
  - M365 BEM naming: `m365-tank-*`

**Files:**
- `fms.frontend/src/pages/tank/TankPage.scss`

---

### Task 2.3 ⬜ — Create TankPage.js (Page Shell)

🔗 Depends on: Task 2.1, Task 2.2

- [ ] Create new `TankPage.js` with M365 layout (~250 lines)
  - Import `useTankData` hook
  - Render `M365PageHeader`, `TankCommandBar`
  - Split-panel layout: `TankTreeList` (left 1/3) + detail area (right 2/3)
  - Detail area conditionally renders: `TankDetailPanel`, `TankSiteSummary`, or `TankEmptyState`
  - Popup orchestration: `TankFormPopup`, `TankHistoryPopup`, `PTSDeviceLinkPopup`
  - Mobile responsive: detail panel hides with back button

**Files:**
- `fms.frontend/src/pages/tank/TankPage.js`

---

## Phase 3: Tree List & Command Bar

### Task 3.1 ⬜ — Create TankCommandBar

🔗 Depends on: Task 1.1

- [ ] Create `fms.frontend/src/pages/tank/components/TankCommandBar.js`
  - M365 command bar with: Add Tank, Edit, History, Link PTS, Unassign, Delete, Refresh
  - Contextual: Edit/History/Link PTS/Unassign/Delete disabled when no tank selected
  - Add Tank always enabled
  - Uses `fa-light` icons

**Files:**
- `fms.frontend/src/pages/tank/components/TankCommandBar.js`

---

### Task 3.2 ⬜ — Create TankTreeList

🔗 Depends on: Task 2.1

- [ ] Create `fms.frontend/src/pages/tank/components/TankTreeList.js`
  - DevExtreme TreeList with site→tank hierarchy
  - Columns: Name (icon + text), Capacity, Current Stock (percentage)
  - Custom cell renders: `nameRender`, `volumeRender`, `stockRender`
  - Site rows: Building icon, name only
  - Tank rows: Tank/truck icon, name, capacity, stock percentage
  - Mobile tanker badge: Orange pill `[Mobile]`
  - M365 selected row styling
  - SearchPanel integration
  - Single selection → calls `handleTreeSelection` from hook

**Files:**
- `fms.frontend/src/pages/tank/components/TankTreeList.js`

---

## Phase 4: Detail Views

### Task 4.1 ⬜ — Create TankEmptyState

- [ ] Create `fms.frontend/src/pages/tank/components/TankEmptyState.js`
  - Icon + "Select a site or tank to view details"
  - Sub-text: "Choose a site to see all tanks summary or a specific tank for detailed information"
  - M365 centered empty state pattern

**Files:**
- `fms.frontend/src/pages/tank/components/TankEmptyState.js`

---

### Task 4.2 ⬜ — Create TankDetailPanel

🔗 Depends on: Task 1.1

- [ ] Create `fms.frontend/src/pages/tank/components/TankDetailPanel.js` (~350 lines)
  - **Header**: Tank name, site, PTS info, fuel grade — flat M365 surface (no gradient)
  - **Fill bar**: `M365ProgressBar` with status colors — replaces SVG circular gauge
  - **Volume metrics**: Current / Capacity / Available in compact row
  - **Section: Configuration** — Book Keeping, Auto Book, Priority, Fuel Grade, Threshold
  - **Section: Dimensions** — Height, Length, Volume
  - **Section: Status** — Last Book Update, Physical Stock, Physical Updated, Source
  - **Section: PTS Live Data** — Connection, Probe, Volume, Temp, Heights, Last Update
  - **Section: Location** — Tank Type, Radius, Lat/Lng or Linked Vehicle
  - Uses `M365InfoRow`, `M365SectionCard`, `M365StatusBadge`

**Files:**
- `fms.frontend/src/pages/tank/components/TankDetailPanel.js`

---

### Task 4.3 ⬜ — Create TankSiteSummary

🔗 Depends on: Task 2.1, Task 1.1

- [ ] Create `fms.frontend/src/pages/tank/components/TankSiteSummary.js` (~200 lines)
  - Site header with name
  - Stats cards: Total Capacity, Current Stock, Available Space — M365 flat cards
  - Overall fill bar using `M365ProgressBar`
  - Individual tank cards grid: icon, name, capacity, fill percentage
  - Each tank card uses M365 flat styling (no hover transforms)
  - Uses `getSiteTanksSummary()` from `useTankData` hook

**Files:**
- `fms.frontend/src/pages/tank/components/TankSiteSummary.js`

---

## Phase 5: Popups — Tank Form

### Task 5.1 ⬜ — Create TankFormPopup

- [ ] Create `fms.frontend/src/pages/tank/components/TankFormPopup.js` (~350 lines)
  - DevExtreme Popup shell
  - Mode: Create / Edit (prop-driven, receives `tank` or `null`)
  - **Section: Basic Info** — Name*, Site, Capacity*, Current Stock
  - **Section: Dimensions** — Height, Length
  - **Section: Configuration** — Threshold, Book Keeping, Auto Book, Priority, Fuel Grade
  - **Section: Location Validation** — Tank Type*, Radius, Lat/Lng (stationary only), Linked Vehicle (mobile only)
  - Validation: Name required, Capacity > 0, one tank per active site
  - M365 form styling: 34px control heights, native controls where possible
  - Submits via `createTank()` or `updateTank()` Redux actions
  - PTS fields (`ptsId`, `probeNumber`) are NOT editable here — handled by Link PTS popup
  - Closes on success → parent refreshes

**Files:**
- `fms.frontend/src/pages/tank/components/TankFormPopup.js`

---

## Phase 6: Popups — Tank History

### Task 6.1 ⬜ — Create TankHistoryPopup

- [ ] Create `fms.frontend/src/pages/tank/components/TankHistoryPopup.js` (~400 lines)
  - Full-screen DevExtreme Popup
  - **Date range filter**: Start date, End date, Refresh button
  - **View toggle**: Table / Chart (M365 segmented control)
  - **Table view**: DataGrid with columns:
    - Date/Time, Volume, Change (colored +/-), Type, Vehicle, Site, Recorded By
  - **Chart view**: renders `TankHistoryChart` component
  - **Export**: Excel export via `exceljs`
  - VolumeChangeReasonEnum mapping for display
  - M365 DataGrid styling (flat headers, compact rows)

**Files:**
- `fms.frontend/src/pages/tank/components/TankHistoryPopup.js`

---

### Task 6.2 ⬜ — Create TankHistoryChart

🔗 Depends on: Task 6.1

- [ ] Create `fms.frontend/src/pages/tank/components/TankHistoryChart.js` (~150 lines)
  - DevExtreme Chart with line series showing volume over time
  - Custom tooltip with volume, change, type, date/time, vehicle
  - M365 chart styling (minimal gridlines, flat colors)

**Files:**
- `fms.frontend/src/pages/tank/components/TankHistoryChart.js`

---

## Phase 7: Popups — PTS Device Link

### Task 7.1 ⬜ — Create PTSDeviceList

- [ ] Create `fms.frontend/src/pages/tank/components/PTSDeviceList.js` (~200 lines)
  - Lists all PTS devices from `ptsDeviceList` Redux state
  - Shows live connection status from SignalR (`connectionStatuses`)
  - Sort: online devices first, then by name
  - Selection: single device → notifies parent
  - M365 list styling with status indicators (green dot for online)

**Files:**
- `fms.frontend/src/pages/tank/components/PTSDeviceList.js`

---

### Task 7.2 ⬜ — Create PTSProbeSelector

🔗 Depends on: Task 7.1

- [ ] Create `fms.frontend/src/pages/tank/components/PTSProbeSelector.js` (~200 lines)
  - Displays available probe channels for selected device
  - Data sources: Live (SignalR `uploadStatusByDevice`) or Config (`ptsConfigService`)
  - Toggle: "Live Data" / "Device Config" (M365 toggle)
  - Shows probe number, product volume, temperature (if available)
  - Auto-selects single probe
  - M365 card styling for each probe channel

**Files:**
- `fms.frontend/src/pages/tank/components/PTSProbeSelector.js`

---

### Task 7.3 ⬜ — Create PTSDeviceLinkPopup (Orchestrator)

🔗 Depends on: Task 7.1, Task 7.2

- [ ] Create `fms.frontend/src/pages/tank/components/PTSDeviceLinkPopup.js` (~350 lines)
  - DevExtreme Popup shell
  - Orchestrates: SignalR connection, `PTSDeviceList`, `PTSProbeSelector`
  - State: `selectedDeviceId`, `selectedPtsTankNumber`, `usePtsProbeReadings`
  - Initializes from current tank's PTS binding
  - **Save**: Updates tank with `ptsId`, `probeNumber`, `usePtsProbeReadings` via `updateTank()`
  - **Unlink**: Clears PTS binding
  - Shows current binding status
  - M365 action buttons at bottom

**Files:**
- `fms.frontend/src/pages/tank/components/PTSDeviceLinkPopup.js`

---

## Phase 8: Integration & Cleanup

### Task 8.1 ⬜ — Wire All Components Together

🔗 Depends on: All prior phases

- [ ] Verify `TankPage.js` renders all sub-components
- [ ] Test tank CRUD flows: create, edit, delete
- [ ] Test tree selection: tank → detail panel, site → site summary
- [ ] Test PTS device linking: select device, select probe, save
- [ ] Test tank history: date filter, table/chart toggle, Excel export
- [ ] Test unassign tank flow
- [ ] Verify SignalR integration: live connection status, probe readings
- [ ] Verify mobile responsiveness: tree collapses, back button works
- [ ] Verify all permission checks

**Files:**
- `fms.frontend/src/pages/tank/TankPage.js`

---

### Task 8.2 ⬜ — Remove Old Files & Cleanup

🔗 Depends on: Task 8.1

- [ ] Remove old `tankPage.js` (888-line monolith)
- [ ] Remove old `tankPage.scss` (514 lines with custom variables)
- [ ] Remove old `components/TankDetails.js` (518 lines)
- [ ] Remove old `components/TankForm.js` (559 lines)
- [ ] Remove old `components/TankHistory.js` (565 lines)
- [ ] Remove old `components/TankHistory.scss`
- [ ] Remove old `components/PTSDeviceLinkPopup.js` (746 lines)
- [ ] Verify no other pages import removed components
- [ ] Update any route references if file name casing changed

**Files:**
- `fms.frontend/src/pages/tank/tankPage.js` (remove)
- `fms.frontend/src/pages/tank/tankPage.scss` (remove)
- `fms.frontend/src/pages/tank/components/TankDetails.js` (remove)
- `fms.frontend/src/pages/tank/components/TankForm.js` (remove)
- `fms.frontend/src/pages/tank/components/TankHistory.js` (remove)
- `fms.frontend/src/pages/tank/components/TankHistory.scss` (remove)
- `fms.frontend/src/pages/tank/components/PTSDeviceLinkPopup.js` (remove)

---

## Summary

| Phase | Tasks | Scope |
|---|---|---|
| Phase 1: Shared M365 | 1 | Verify/create M365 shared components + ProgressBar |
| Phase 2: Foundation | 3 | Hook, SCSS, Page shell |
| Phase 3: Tree & Command | 2 | TankCommandBar, TankTreeList |
| Phase 4: Detail Views | 3 | EmptyState, TankDetailPanel, TankSiteSummary |
| Phase 5: Tank Form | 1 | TankFormPopup |
| Phase 6: Tank History | 2 | TankHistoryPopup, TankHistoryChart |
| Phase 7: PTS Link | 3 | PTSDeviceList, PTSProbeSelector, PTSDeviceLinkPopup |
| Phase 8: Integration | 2 | Wire-up, cleanup old files |
| **Total** | **17** | |

**Estimated effort:** 5–8 days

**Dependencies:**
- Phase 1 may already be done if Site V2 or User V2 ran first — just verify and add `M365ProgressBar`
- Phase 2 depends on Phase 1
- Phase 3–7 depend on Phase 2 but can partially run in parallel
- Phase 8 depends on all prior phases

**Risk areas:**
- **PTSDeviceLinkPopup decomposition** — the most complex component (746 lines) with SignalR, config API, and live data. Splitting into 3 files requires careful state management
- **SignalR integration** — must preserve existing PTS connection lifecycle and data flow
- **Tank History chart** — custom tooltip with multi-field data must be preserved
