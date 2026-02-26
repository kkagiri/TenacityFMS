# PRD: /admin/site — M365 Redesign (V2)

> **Version:** 2.0
> **Date:** 2026-02-25
> **Status:** Draft
> **Domain:** SiteManagement

---

## 1. Executive Summary

Redesign the `/admin/site` page to align with the **M365 Admin Center Fluent Design** language. The current implementation (779-line monolith `sitePage.js`) will be decomposed into focused, reusable components using M365 design tokens, flat native controls, and a compact information-dense layout.

**Key goals:**
- Full M365 Fluent Design compliance (flat chrome, native controls, compact density)
- Split-panel master–detail layout with M365 surface styling
- Richer detail panel with section cards, stats summary, and GPSGate tag configuration
- Popup for **Create / Edit Site** — replaces the inline edit form
- M365 command bar with contextual actions
- SRP file structure — no file exceeds 600 lines

---

## 2. Current State Analysis

### 2.1 Existing Files

| File | Lines | Purpose |
|---|---|---|
| `sitePage.js` | 779 | Site list (DataGrid) + inline detail/edit panel, create form, GPSGate tag config |
| `sitePage.scss` | 234 | Custom Tailwind-style variables, gradient headers, segmented buttons |

### 2.2 Current Pain Points

1. **`sitePage.js` exceeds 600-line limit** — contains DataGrid list, detail view, edit form, create form, helper components (`InfoRow`, `SectionCard`, `StatusBadge`, `StatusCellRender`, `GpsGateTagCellRender`) all in one file.
2. **Inconsistent design** — mixes DevExtreme controls with Tailwind utilities; uses gradient headers (`tw-bg-gradient-to-r tw-from-slate-800 tw-to-slate-700`) instead of M365 flat surfaces.
3. **Edit is inline** — switching between view/edit in the same detail panel forces full re-render and lacks clear visual transition.
4. **SCSS uses custom variables** — `$primary-color: #3b82f6` instead of M365 tokens (`--m365-primary: #0078d4`).
5. **Quick Stats show dashes** — Tanks, Vehicles, Employees, PTS Devices counts all show "–" (not wired to real data).
6. **No status filter / tab bar** — cannot filter Active vs Inactive sites without using DataGrid headers.
7. **Helper components are inline** — `InfoRow`, `SectionCard`, `StatusBadge` etc. are duplicated across site and tank pages instead of shared.

### 2.3 Backend Entity State

The `Site` entity currently has:
- `Id`, `Name`, `IsActive`, `SiteAdministratorId`, `GpsGateTagId`, `GpsGateTagName`, `AutoUpdateGpsGateTag`

**Navigation properties:** `Tanks`, `Vehicles`, `Employees`, `Ptsdevices`, `Users`, `StockReports`, `FuelingRules`, `UserSites`, etc.

**No Domain changes required** — all needed fields already exist.

---

## 3. Proposed Design

### 3.1 Page Layout (M365 Admin Center Style)

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header                                                 │
│  [icon] Sites (12)               [+ Add Site] [Refresh]      │
├──────────────────────────────────────────────────────────────┤
│  Tab Bar                                                     │
│  [All Sites]  [Active]  [Inactive]                           │
├──────────────────────────────────────────────────────────────┤
│  Filter Bar                                                  │
│  [🔍 Search...]  [Administrator ▾]  [GPSGate Tag ▾]          │
├──────────────┬───────────────────────────────────────────────┤
│  Site List   │  Site Detail Panel                            │
│              │                                               │
│  ● Site A    │  ┌──────────────────────────────────────────┐ │
│    Active    │  │  Site Name         Status Badge           │ │
│              │  │  Administrator: John Doe                  │ │
│  ● Site B    │  │  GPSGate Tag: [●] Tag Name               │ │
│    Active    │  └──────────────────────────────────────────┘ │
│              │                                               │
│  ● Site C    │  ┌── Quick Stats ───────────────────────────┐ │
│    Inactive  │  │  [4] Tanks  [12] Vehicles  [25] Staff    │ │
│              │  │  [2] PTS Devices                          │ │
│              │  └──────────────────────────────────────────┘ │
│              │                                               │
│              │  ┌── GPSGate Configuration ─────────────────┐ │
│              │  │  Tag: [●] Nairobi  Auto-Update: Enabled  │ │
│              │  └──────────────────────────────────────────┘ │
│              │                                               │
│              │           [Edit] [Delete]                     │
├──────────────┴───────────────────────────────────────────────┤
│  Pager: Showing 1-12 of 12                                   │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Site List Row (M365 Style)

Each list row follows M365 compact list density:

```
┌──────────────────────────────────────────────┐
│  [🏢]  Site Name           [Active ●]         │
│        Admin: John Doe     Tag: [●] Nairobi   │
└──────────────────────────────────────────────┘
```

- **Left icon**: `fa-light fa-building` with M365 blue accent
- **Status badge**: M365 pill — green `Active`, gray `Inactive`
- **Tag indicator**: Colored dot with tag name
- **Selected row**: `--m365-selected-bg: #e5f1fb` background

### 3.3 Site Detail Panel (M365 Style)

Replaces gradient header with M365 flat surface:

```
┌──────────────────────────────────────────────────────┐
│  m365-detail-header                                   │
│  [🏢]  Site Name                                      │
│        [Active ●]  ID: 5                              │
│                                 [Edit ✏️] [Delete 🗑] │
├──────────────────────────────────────────────────────┤
│  m365-section: Site Information                       │
│    Name:           Nairobi Depot                      │
│    Status:         Active                             │
│    Administrator:  John Doe (john@email.com)          │
├──────────────────────────────────────────────────────┤
│  m365-section: GPSGate Tag Configuration              │
│    Tag:            [●] Nairobi                        │
│    Auto-Update:    Enabled                            │
├──────────────────────────────────────────────────────┤
│  m365-section: Quick Stats                            │
│    ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│    │  4   │ │  12  │ │  25  │ │  2   │               │
│    │Tanks │ │Vehicl│ │Staff │ │ PTS  │               │
│    └──────┘ └──────┘ └──────┘ └──────┘               │
└──────────────────────────────────────────────────────┘
```

### 3.4 Create / Edit Site Popup

A popup dialog instead of inline editing:

```
┌──────────────────────────────────────────────────────┐
│  Create Site  /  Edit Site                     [✕]   │
├──────────────────────────────────────────────────────┤
│  m365-section: Site Information                       │
│    Site Name *       [________________________]       │
│    Administrator     [Select administrator ▾  ]       │
│    Active Status     [✓] Active                       │
├──────────────────────────────────────────────────────┤
│  m365-section: GPSGate Tag Configuration              │
│    GPSGate Tag       [Select tag ▾            ]       │
│    Auto-Update       [✓] Auto-update vehicle tags     │
├──────────────────────────────────────────────────────┤
│                        [Cancel]  [Save / Create]      │
└──────────────────────────────────────────────────────┘
```

---

## 4. Component Architecture

### 4.1 File Decomposition

```
fms.frontend/src/pages/site/
├── SitePage.js                  # Page shell — header, tabs, split layout (~250 lines)
├── SitePage.scss                # M365-themed SCSS with design tokens (~120 lines)
├── components/
│   ├── SiteCommandBar.js        # M365 command bar — Add, Edit, Delete, Refresh (~80 lines)
│   ├── SiteTabBar.js            # All / Active / Inactive tabs (~50 lines)
│   ├── SiteFilterBar.js         # Search, Administrator filter, Tag filter (~80 lines)
│   ├── SiteList.js              # DataGrid list with M365 row styling (~180 lines)
│   ├── SiteDetailPanel.js       # Read-only detail panel with sections (~200 lines)
│   ├── SiteFormPopup.js         # Create/Edit site popup form (~200 lines)
│   └── SiteQuickStats.js        # Stats cards — Tanks, Vehicles, Staff, PTS (~80 lines)
├── hooks/
│   └── useSiteData.js           # Data fetching, filtering, selection logic (~120 lines)
```

### 4.2 Shared Components (from `src/components/m365/`)

| Component | Purpose |
|---|---|
| `M365InfoRow` | Label + value row with icon (replace inline `InfoRow`) |
| `M365SectionCard` | Collapsible section with M365 header bar |
| `M365StatusBadge` | Active/Inactive pill badge |
| `M365PageHeader` | Page title with count and action buttons |
| `M365TabBar` | Horizontal tab strip |
| `M365FilterBar` | Search + dropdown filters row |

---

## 5. Design Token Mapping

### 5.1 SCSS Variables → M365 Tokens

| Current (sitePage.scss) | M365 Token |
|---|---|
| `$primary-color: #3b82f6` | `--m365-primary: #0078d4` |
| `$secondary-color: #10b981` | `--m365-success: #107c10` |
| `$danger-color: #ef4444` | `--m365-error: #d13438` |
| `$warning-color: #f59e0b` | `--m365-warning: #797775` |
| Gradient headers | Flat `--m365-surface: #ffffff` |
| `border-radius: 12px` | `border-radius: 4px` |
| Hover transforms/shadows | Flat hover with `--m365-hover-bg: #f5f5f5` |

### 5.2 Typography

| Element | Current | M365 |
|---|---|---|
| Page title | `tw-text-xl tw-font-semibold` | `font-size: 20px; font-weight: 600` |
| Section title | `tw-font-semibold tw-text-slate-700` | `font-size: 14px; font-weight: 600; text-transform: uppercase` |
| Body text | `tw-text-sm` | `font-size: 13px; line-height: 18px` |
| Control height | varies | `34px` |

### 5.3 Surfaces & Depth

| Current | M365 |
|---|---|
| `tw-shadow-lg`, `tw-shadow-md` | `box-shadow: 0 1px 2px rgba(0,0,0,0.1)` (Level 1 only) |
| Gradient header backgrounds | Flat white `--m365-surface` |
| `tw-rounded-xl` | `border-radius: 4px` |
| `tw-bg-blue-50`, `tw-bg-green-50` stat cards | `--m365-blue-bg: #eff6fc`, flat M365 accent backgrounds |

---

## 6. Data & API Changes

### 6.1 New Backend Requirements

**No Domain changes required.**

The existing Site entity and DTOs contain all needed fields.

### 6.2 Quick Stats — New Query

To populate Quick Stats with real data, a new backend query is needed:

**`GetSiteStatsQuery(int siteId)`** → returns:
```json
{
  "tankCount": 4,
  "vehicleCount": 12,
  "employeeCount": 25,
  "ptsDeviceCount": 2
}
```

This can be implemented as a lightweight query joining `Tanks`, `Vehicles`, `Employees`, `Ptsdevices` tables filtered by `SiteId`.

**Files:**
- `FMS.Application/Features/Site/Queries/GetSiteStatsQuery.cs`
- `FMS.Application/Features/Site/Queries/GetSiteStatsQueryHandler.cs`
- `FMS.Application/Features/Site/DTOs/SiteStatsDTO.cs`

### 6.3 Frontend API Changes

| Action | Current | V2 |
|---|---|---|
| `fetchSiteList()` | `GET /site` | No change |
| `createSite()` | `POST /site` | No change |
| `updateSite()` | `PUT /site/{id}` | No change |
| `deleteSite()` | `DELETE /site/{id}` | No change |
| `fetchSiteStats()` | N/A | **NEW** `GET /site/{id}/stats` |
| `getGpsGateTags()` | `GET /gpsgate/tags` | No change |

---

## 7. Interaction Flows

### 7.1 View Site Details

1. User loads `/admin/site` → Tab bar defaults to **All Sites**
2. Site list loads in left panel with M365 compact rows
3. User clicks a row → detail panel shows site info with M365 section cards
4. Quick Stats section fetches `GET /site/{id}/stats` on selection

### 7.2 Create Site

1. User clicks **[+ Add Site]** in command bar
2. `SiteFormPopup` opens in **create** mode — empty form
3. User fills fields → clicks **Create**
4. `POST /site` → success notification → popup closes → list refreshes → new site selected

### 7.3 Edit Site

1. User selects a site → clicks **[Edit]** in command bar (or detail panel)
2. `SiteFormPopup` opens in **edit** mode — pre-filled with selected site data
3. User modifies fields → clicks **Save**
4. `PUT /site/{id}` → success notification → popup closes → detail panel refreshes

### 7.4 Delete Site

1. User selects a site → clicks **[Delete]** in command bar
2. M365 confirmation dialog: "Delete site 'Site Name'? This cannot be undone."
3. User confirms → `DELETE /site/{id}` → success notification → selection cleared

### 7.5 Filter Sites

1. **Tab bar**: All / Active / Inactive — filters `isActive` field client-side
2. **Search**: Filters by site name (client-side on loaded data)
3. **Administrator filter**: Dropdown with administrator names
4. **GPSGate Tag filter**: Dropdown with tag names

---

## 8. Permissions

| Permission | Actions |
|---|---|
| `_Manage_Site` | Create, Edit, Delete sites |
| `_Read_Site` (implied) | View site list and details |

Permission check uses JWT-based `usePermissions` hook:

```javascript
const { hasPermission } = usePermissions();
const canManageSite = hasPermission('_Manage_Site');
```

---

## 9. Migration Strategy

### 9.1 Component Migration Map

| Current Element | V2 Component |
|---|---|
| Inline `InfoRow` function | `M365InfoRow` shared component |
| Inline `SectionCard` function | `M365SectionCard` shared component |
| Inline `StatusBadge` function | `M365StatusBadge` shared component |
| Inline `StatusCellRender` | `SiteList.js` internal render |
| Inline `GpsGateTagCellRender` | `SiteList.js` internal render |
| DataGrid in main file | `SiteList.js` |
| `renderSiteDetails()` | `SiteDetailPanel.js` |
| `renderEditForm()` | `SiteFormPopup.js` |
| Header + buttons | `SiteCommandBar.js` |
| Quick Stats section | `SiteQuickStats.js` |

### 9.2 State Management

Move site-page-specific state to `useSiteData` hook:

```javascript
// hooks/useSiteData.js
export const useSiteData = () => {
  const dispatch = useDispatch();
  const { sites, loading, creating, updating, deleting } = useSelector(state => state.site);
  const [selectedSite, setSelectedSite] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');

  const filteredSites = useMemo(() => { /* filter logic */ }, [sites, activeTab, searchText]);

  return { sites, filteredSites, selectedSite, setSelectedSite, activeTab, setActiveTab, ... };
};
```

---

## 10. Quality Checklist

- [ ] M365 design tokens used throughout (no custom color variables)
- [ ] All components under 600 lines
- [ ] Shared M365 components extracted to `src/components/m365/`
- [ ] `tw-` prefix on all Tailwind classes
- [ ] `fa-light` icon prefix only
- [ ] SCSS files, not CSS
- [ ] JWT-based permissions via `usePermissions`
- [ ] No DevExtreme gradient/shadow overrides — flat M365 surfaces
- [ ] Quick Stats show real data from API
- [ ] Mobile responsive with detail panel collapse
