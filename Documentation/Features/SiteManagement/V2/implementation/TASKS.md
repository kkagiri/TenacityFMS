# Task List: /admin/site M365 Redesign (V2)

> **PRD Reference:** [PRD.md](PRD.md)
> **Date:** 2026-02-25
> **Estimated Tasks:** 16

---

## Legend

| Symbol | Meaning |
|---|---|
| ⬜ | Not started |
| 🔄 | In Progress |
| ✅ | Complete |
| 🔗 | Depends on another task |

---

## Phase 1: Backend — Site Stats Query

> Add the missing Quick Stats endpoint. No Domain changes required.

### Task 1.1 ⬜ — Create SiteStatsDTO

- [ ] Create `FMS.Application/Features/Site/DTOs/SiteStatsDTO.cs`
  ```csharp
  public class SiteStatsDTO
  {
      public int TankCount { get; set; }
      public int VehicleCount { get; set; }
      public int EmployeeCount { get; set; }
      public int PtsDeviceCount { get; set; }
  }
  ```

**Files:**
- `FMS.Application/Features/Site/DTOs/SiteStatsDTO.cs`

---

### Task 1.2 ⬜ — Create GetSiteStatsQuery + Handler

🔗 Depends on: Task 1.1

- [ ] Create `FMS.Application/Features/Site/Queries/GetSiteStatsQuery.cs`
  ```csharp
  public record GetSiteStatsQuery(int SiteId) : IRequest<FMSResponse<SiteStatsDTO>>;
  ```
- [ ] Create `FMS.Application/Features/Site/Queries/GetSiteStatsQueryHandler.cs`
  - Count `Tanks` where `SiteId` matches
  - Count `Vehicles` where `SiteId` matches
  - Count `Employees` where `SiteId` matches
  - Count `Ptsdevices` where `SiteId` matches

**Files:**
- `FMS.Application/Features/Site/Queries/GetSiteStatsQuery.cs`
- `FMS.Application/Features/Site/Queries/GetSiteStatsQueryHandler.cs`

---

### Task 1.3 ⬜ — Add Stats Endpoint to SiteController

🔗 Depends on: Task 1.2

- [ ] Add endpoint to `FMS.WebClient/Controllers/SiteController.cs`:
  ```csharp
  [HttpGet("{id}/stats")]
  public async Task<IActionResult> GetSiteStats(int id)
  ```

**Files:**
- `FMS.WebClient/Controllers/SiteController.cs`

---

### Task 1.4 ⬜ — Add fetchSiteStats Redux Action

🔗 Depends on: Task 1.3

- [ ] Add `fetchSiteStats(siteId)` thunk to `fms.frontend/src/redux/actions/siteActions.js`
  - `GET /site/{siteId}/stats`
- [ ] Add action types: `FETCH_SITE_STATS_REQUEST/SUCCESS/FAILURE`
- [ ] Update `siteReducer` to store `siteStats` in state

**Files:**
- `fms.frontend/src/redux/actions/siteActions.js`
- `fms.frontend/src/redux/reducers/siteReducer.js`

---

## Phase 2: Shared M365 Components

> Extract reusable M365 styled components from inline helpers.

### Task 2.1 ⬜ — Create M365 Shared Components

- [ ] Create `fms.frontend/src/components/m365/M365InfoRow.js`
  - Props: `label`, `value`, `icon`
  - M365 tokens: 13px font, `--m365-text-secondary` label color
- [ ] Create `fms.frontend/src/components/m365/M365SectionCard.js`
  - Props: `title`, `icon`, `actions`, `children`, `collapsible`
  - M365 tokens: flat surface, 4px border-radius, subtle border
- [ ] Create `fms.frontend/src/components/m365/M365StatusBadge.js`
  - Props: `isActive`, `label`
  - M365 green/gray pill
- [ ] Create `fms.frontend/src/components/m365/M365PageHeader.js`
  - Props: `title`, `icon`, `count`, `children` (action buttons)
- [ ] Create `fms.frontend/src/components/m365/m365-shared.scss`
  - M365 design tokens as CSS custom properties
  - Common component styles

**Files:**
- `fms.frontend/src/components/m365/M365InfoRow.js`
- `fms.frontend/src/components/m365/M365SectionCard.js`
- `fms.frontend/src/components/m365/M365StatusBadge.js`
- `fms.frontend/src/components/m365/M365PageHeader.js`
- `fms.frontend/src/components/m365/m365-shared.scss`

> **Note:** These components will be shared across Site, Tank, and User V2 pages.

---

## Phase 3: Site Page — Foundation

> Build the new page shell, hook, and SCSS.

### Task 3.1 ⬜ — Create useSiteData Hook

- [ ] Create `fms.frontend/src/pages/site/hooks/useSiteData.js`
  - Dispatch `fetchSiteList()` on mount
  - Manage `selectedSite`, `activeTab`, `searchText`, `administratorFilter`, `tagFilter`
  - Provide `filteredSites` via `useMemo` (filter by tab, search, admin, tag)
  - Expose `handleSelectSite`, `handleRefresh`, `handleDelete`

**Files:**
- `fms.frontend/src/pages/site/hooks/useSiteData.js`

---

### Task 3.2 ⬜ — Create SitePage.scss (M365 Tokens)

- [ ] Replace `sitePage.scss` with M365-themed SCSS
  - CSS custom properties for M365 design tokens
  - No gradients, no transform hover effects
  - Flat surfaces with `4px` border-radius
  - Control heights: `34px`
  - M365 BEM naming: `m365-site-*`

**Files:**
- `fms.frontend/src/pages/site/SitePage.scss`

---

### Task 3.3 ⬜ — Create SitePage.js (Page Shell)

🔗 Depends on: Task 3.1, Task 3.2

- [ ] Create new `SitePage.js` with M365 layout (~250 lines)
  - Import `useSiteData` hook
  - Render `M365PageHeader`, `SiteTabBar`, `SiteFilterBar`
  - Split-panel layout: `SiteList` (left 1/3) + `SiteDetailPanel` (right 2/3)
  - Mobile responsive: detail panel collapses below list

**Files:**
- `fms.frontend/src/pages/site/SitePage.js`

---

## Phase 4: Site Page — Components

### Task 4.1 ⬜ — Create SiteCommandBar

🔗 Depends on: Task 2.1

- [ ] Create `fms.frontend/src/pages/site/components/SiteCommandBar.js`
  - M365 command bar with: Add Site, Edit, Delete, Refresh
  - Permission-gated: `_Manage_Site` for create/edit/delete
  - Contextual: Edit/Delete disabled when no site selected

**Files:**
- `fms.frontend/src/pages/site/components/SiteCommandBar.js`

---

### Task 4.2 ⬜ — Create SiteTabBar

- [ ] Create `fms.frontend/src/pages/site/components/SiteTabBar.js`
  - Tabs: All Sites, Active, Inactive
  - Shows count per tab
  - M365 underline indicator on active tab

**Files:**
- `fms.frontend/src/pages/site/components/SiteTabBar.js`

---

### Task 4.3 ⬜ — Create SiteFilterBar

- [ ] Create `fms.frontend/src/pages/site/components/SiteFilterBar.js`
  - Search input (M365 34px height, border-bottom style)
  - Administrator dropdown filter
  - GPSGate Tag dropdown filter

**Files:**
- `fms.frontend/src/pages/site/components/SiteFilterBar.js`

---

### Task 4.4 ⬜ — Create SiteList

🔗 Depends on: Task 3.1

- [ ] Create `fms.frontend/src/pages/site/components/SiteList.js`
  - DevExtreme DataGrid with M365 row styling
  - Columns: Name (with icon), GPSGate Tag (color dot + name), Status (M365 badge)
  - Single selection → calls `handleSelectSite`
  - Selected row highlight: `--m365-selected-bg: #e5f1fb`
  - SearchPanel built into DataGrid

**Files:**
- `fms.frontend/src/pages/site/components/SiteList.js`

---

### Task 4.5 ⬜ — Create SiteDetailPanel

🔗 Depends on: Task 2.1, Task 1.4

- [ ] Create `fms.frontend/src/pages/site/components/SiteDetailPanel.js`
  - Empty state: icon + "Select a site" message
  - Selected state: M365 header, Site Information section, GPSGate Configuration section
  - Uses `M365InfoRow`, `M365SectionCard`, `M365StatusBadge`
  - Includes `SiteQuickStats` component

**Files:**
- `fms.frontend/src/pages/site/components/SiteDetailPanel.js`

---

### Task 4.6 ⬜ — Create SiteQuickStats

🔗 Depends on: Task 1.4

- [ ] Create `fms.frontend/src/pages/site/components/SiteQuickStats.js`
  - Fetches `fetchSiteStats(siteId)` when site selected
  - Displays 4 stat cards: Tanks, Vehicles, Staff, PTS Devices
  - M365 stat cards with flat backgrounds, icon, count, label

**Files:**
- `fms.frontend/src/pages/site/components/SiteQuickStats.js`

---

### Task 4.7 ⬜ — Create SiteFormPopup

- [ ] Create `fms.frontend/src/pages/site/components/SiteFormPopup.js`
  - DevExtreme Popup shell
  - Mode: Create / Edit (prop-driven)
  - Form fields: Name*, Administrator, Active Status, GPSGate Tag, Auto-Update
  - Uses native `<select>`, `<input>` where appropriate per M365
  - Validation: Name required
  - Submits via `createSite()` or `updateSite()` Redux actions
  - Closes on success, refreshes site list

**Files:**
- `fms.frontend/src/pages/site/components/SiteFormPopup.js`

---

## Phase 5: Integration & Cleanup

### Task 5.1 ⬜ — Wire All Components Together

🔗 Depends on: All Phase 3 + Phase 4 tasks

- [ ] Verify `SitePage.js` renders all sub-components
- [ ] Test create, edit, delete flows end-to-end
- [ ] Verify Quick Stats API integration
- [ ] Verify GPSGate tag loading (`getGpsGateTags`)
- [ ] Verify permission checks for create/edit/delete
- [ ] Verify mobile responsiveness (detail panel collapse)

**Files:**
- `fms.frontend/src/pages/site/SitePage.js`

---

### Task 5.2 ⬜ — Remove Old Files & Cleanup

🔗 Depends on: Task 5.1

- [ ] Remove old `sitePage.js` (779-line monolith) after V2 is stable
- [ ] Remove old `sitePage.scss` with custom variables
- [ ] Verify no other pages import old inline helpers from sitePage
- [ ] Update any route references if file name casing changed

**Files:**
- `fms.frontend/src/pages/site/sitePage.js` (remove)
- `fms.frontend/src/pages/site/sitePage.scss` (remove)

---

## Summary

| Phase | Tasks | Scope |
|---|---|---|
| Phase 1: Backend | 4 | SiteStatsDTO, Query, Controller endpoint, Redux action |
| Phase 2: Shared M365 | 1 | 5 shared M365 components + SCSS |
| Phase 3: Foundation | 3 | Hook, SCSS, Page shell |
| Phase 4: Components | 7 | CommandBar, TabBar, FilterBar, List, Detail, Stats, Form |
| Phase 5: Integration | 2 | Wire-up, cleanup |
| **Total** | **17** | |

**Estimated effort:** 3–5 days

**Dependencies:**
- Phase 2 (shared M365 components) may already exist from User V2 — reuse them
- Phase 1 can run in parallel with Phase 2
- Phase 3 depends on Phase 2
- Phase 4 depends on Phase 3
- Phase 5 depends on all prior phases
