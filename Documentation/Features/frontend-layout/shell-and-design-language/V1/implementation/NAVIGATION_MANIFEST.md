# Side Navigation Manifest — fms.frontend Rewrite

> **Status:** Draft for review
> **Date:** 2026-05-20
> **Purpose:** Define the canonical side-nav sections and sub-menu items for the new `apps/fms.frontend` shell, replacing the legacy pages tree.
> **Sources synthesized:**
> - `Documentation/Architecture/ProjectManagemerPrograms/SUPER_PRD.md` §1.2, §2.1
> - `Documentation/Architecture/design/tenancy-roles-model.md`
> - `Documentation/Features/MultiTenancy/tenancy-roles-model/V1/implementation/PRD.md`
> - `Documentation/Features/MultiTenancy/3-AUDIENCE-PRD.md` (superseded — kept for §4.4 operator portal scope)
> - `Documentation/Features/frontend-layout/shell-and-design-language/V1/implementation/PRD.md`
> - `apps/FMS.Landing/src/pages/Onboarding.jsx` (the 5 modules a prospect ticks)

---

## 1. Background

The Onboarding flow in `apps/FMS.Landing/src/pages/Onboarding.jsx` asks a prospect what they want to manage. The five module codes it produces are the entry point for tenant provisioning, and they map 1:1 to which top-level nav sections light up for that tenant:

| Onboarding module code | Label shown to prospect | Lights up nav section(s) |
|---|---|---|
| `track-dispensed` | Track fuel dispensed | Fueling |
| `control-dispensing` | Control fuel dispensing | Fueling (rules + commands) |
| `track-stock` | Track stock | Tank Stock |
| `loyalty` | Loyalty & discounts | Customers & Loyalty |
| `track-fleet` | Track vehicle fleet | Vehicles, Trips & Tasks |

The same nav manifest serves all three shells from the Frontend Layout PRD; visibility is determined by **role permissions** (`resource.action` keys) and **`UserResourceScope`**, not by forking the layout.

> Per `tenancy-roles-model.md`, the legacy `viewMode=customer` branch is being retired. There is no separate "Customer portal" — external viewers see the same Client shell with their menu filtered by their role + resource scope.

---

## 2. Three audiences, one manifest

| Shell | App | Audience (Scope) | Nav source |
|---|---|---|---|
| **Tenant shell** | `apps/fms.frontend` | Client users (Tenant Admin, Fleet Manager, Site Operator, External Viewer, …) | This manifest, filtered by permission + `UserResourceScope` |
| **Operator portal** | `apps/FMS.Admin` | System users (Platform Admin, Support, Sales, Auditor) | Static, see §5 |
| **Marketing site** | `apps/FMS.Landing` | Public | Out of scope — uses its own marketing nav |

---

## 3. Client Tenant Shell — top-level sections

Section order is the recommended sidebar order. The `module` column is the Onboarding code that switches the section on for that tenant. Sections marked `always` are visible to every client tenant.

| # | Section | Icon (fa-light) | Onboarding gate | Min. permission | Domain (SUPER_PRD §1.2) |
|---|---|---|---|---|---|
| 1 | Dashboard | `fa-chart-line` | `always` | `dashboard.read` | Reporting & Dashboards |
| 2 | Vehicles | `fa-truck` | `track-fleet` | `vehicle.read` | Vehicle Tracking |
| 3 | Fueling | `fa-gas-pump` | `track-dispensed` OR `control-dispensing` | `fuel.transaction.read` | Fueling |
| 4 | Tank Stock | `fa-tank-water` | `track-stock` | `tank.read` | Tank Stock |
| 5 | Trips & Tasks | `fa-route` | `track-fleet` | `trip.read` | Task & Trip Management |
| 6 | Customers & Loyalty | `fa-id-card` | `loyalty` | `customer.read` | (sell-side, per tenancy-roles-model) |
| 7 | Sites | `fa-location-dot` | `always` (label per `BrandingConfig.SiteTerminology`) | `site.read` | Administration |
| 8 | Notifications & Alarms | `fa-bell` | `always` | `alarm.read` | Notifications & Alarms |
| 9 | Reports | `fa-file-chart-column` | `always` | `report.read` | Reporting & Dashboards |
| 10 | Fiscal | `fa-receipt` | `always` (KE only initially) | `fiscal.receipt.read` | Fiscal Compliance |
| 11 | Administration | `fa-gears` | `always` (Tenant Admin only) | `tenant.admin` | Administration |

---

## 4. Client Tenant Shell — sub-menus

### 4.1 Dashboard
- Overview — SignalR live KPIs
- My pinned views

### 4.2 Vehicles  *(gate: `track-fleet`)*
- Fleet list — `Features/Vehicle/`
- Live map / tracking — `Features/VehicleTracking/`
- Trips history
- Geofences
- Consumption analysis — `Features/ConsumptionAnalysis/`
- Expected fuel average — `Features/ExpectedFuelAverageManagement/`
- Vehicle transfers — `Features/VehicleTransfer/`

### 4.3 Fueling  *(gate: `track-dispensed` OR `control-dispensing`)*
- Live transactions — `track-dispensed`
- Pumps & dispensers (PTS) — `Features/PTS/`
- Fueling rules — `Features/FuelingRule/`, gate `control-dispensing`
- Mobile fueling validation — `Features/MobileFuelingValidation/`
- Location validation — `Features/LocationValidation/`
- Automated reconciliation — `Features/AutomatedReconciliation/`
- Warning letters — `Features/WarningLetterGenerator/`

### 4.4 Tank Stock  *(gate: `track-stock`)*
- Tanks (ATG live) — `Features/ATG/`, `Features/AutomaticTankConfig/`
- Opening / closing stock
- Refills & deliveries — `Features/DeliveryManagement/`
- Adjustments
- Tank transfers — `Features/TankTransfer/`
- Reconciliation

### 4.5 Trips & Tasks  *(gate: `track-fleet`)*
- Active trips
- Driver assignments
- Trip lifecycle / KPIs
- Drivers (employees) — `Features/Employee/`

### 4.6 Customers & Loyalty  *(gate: `loyalty`)*
- Customers
- Loyalty cards & discounts
- Pricing
- Invoices

> Per `tenancy-roles-model.md` — these are sell-side rows inside the client tenant, not sub-tenants.

### 4.7 Sites  *(always; label resolves from `BrandingConfig.SiteTerminology`)*
- Site list  *(displayed as "Branches" / "Stations" / "Depots" / "Yards" per branding)*
- Devices per site
- Site terminology — Admin only (`branding.update`)

### 4.8 Notifications & Alarms  *(always)*
- Active alarms
- Alert configuration — `Features/NotificationAndAlarm/AlertConfiguration/` (released)
- Event expression engine — `Features/NotificationAndAlarm/EventExpressionEngine/` (PRD, not started)
- Notification log

### 4.9 Reports  *(always)*
- Operational reports (RDL / jsreport) — `Features/JsReport/`, `Features/Reporting/`
- Consumption analysis
- Real-time dashboards
- Exports

### 4.10 Fiscal  *(always; KE-only initially via provider plugin)*
- OSCU receipts — `Features/Fiscal/`
- VSCU receipts
- Receipt signing log
- Outbox

### 4.11 Administration  *(always; gated by Tenant Admin / `tenant.admin`)*
- Users — `Features/UserManagement/V2/`
- Roles & permissions — `Features/Security/PermissionStandardization/`
- Resource scopes (per-user) — `UserResourceScope` on Site / Customer / Vehicle
- Devices & providers — `Features/devices/`, `Features/ProviderManagement/`
- Branding — logo, colors, Site terminology, display name
- System configuration — `Features/SystemConfiguration/`
- Audit log — append-only (`audit.read`)
- Tenant settings

---

## 5. Platform Operator Shell — `apps/FMS.Admin`

Source: `3-AUDIENCE-PRD.md §4.4` + `tenancy-roles-model.md` (Scope = System). Static nav, not derived from this manifest.

| Section | Sub-items | Permission prefix |
|---|---|---|
| Tenants | List · Detail · Hierarchy · Activate / Suspend · Provision | `platform.tenant.*` |
| Subscriptions & Billing | Subscriptions list · Plan changes · Invoices | `platform.billing.*` |
| Plans & Pricing | Plan catalog · Features · Quotas · Pricing tiers | `platform.billing.*` |
| Stations Provisioning | Assign sites / devices to tenants · Health view | `platform.tenant.*` |
| Cross-Tenant Reports | Fuel volume by tenant · Device activity · Revenue | `platform.report.*`, `report.crosscustomer.read` |
| Sales Pipeline | Deals · Onboarding workflow (`FMS.Sales`) | `platform.sales.*` |
| Operator Users | Internal FMS staff accounts · Role assignment | `platform.user.*` |
| Audit Log | Platform-wide, append-only | `platform.audit.read` |
| Instance Branding | Self-hosted / white-label `BrandingConfig` | `platform.branding.update` |

---

## 6. External Viewer (scoped user inside a client tenant)

Same shell as the Client tenant. No separate "Customer portal" — the menu is filtered by role + `UserResourceScope`.

Typical effective nav for an `External Customer Viewer` paired with `UserResourceScope = Customer:Acme`:

```
Dashboard           (Acme data only)
Vehicles            → "My Vehicles"          (filtered to Customer=Acme)
Fueling             → "My Transactions"      (filtered)
Reports             → "My Reports"           (filtered)
Profile             (own user only)
```

Same for `External Site Viewer` with `UserResourceScope = Site:Galana` — same shell, different filter.

> **Rule:** menu items are stripped by permission + scope, not by a separate `viewMode`. UI hiding is UX only; backend permission checks are authoritative (`tenancy-roles-model.md` §"Non-Negotiable Architecture Rules" #5).

---

## 7. Suggested JS manifest shape

```js
// apps/fms.frontend/src/nav/manifest.js
export const NAV_MANIFEST = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "fa-light fa-chart-line",
    path: "/dashboard",
    permission: "dashboard.read",
    gate: "always",
    scopeAware: true,
    children: [
      { id: "dashboard.overview", label: "Overview", path: "/dashboard" },
      { id: "dashboard.pinned",   label: "My pinned views", path: "/dashboard/pinned" },
    ],
  },
  {
    id: "vehicles",
    label: "Vehicles",
    icon: "fa-light fa-truck",
    path: "/vehicles",
    permission: "vehicle.read",
    gate: { module: "track-fleet" },
    scopeAware: true,
    children: [
      { id: "vehicles.list",          label: "Fleet list",          path: "/vehicles" },
      { id: "vehicles.tracking",      label: "Live map",            path: "/vehicles/tracking",    permission: "vehicle.tracking.read" },
      { id: "vehicles.trips",         label: "Trips history",       path: "/vehicles/trips" },
      { id: "vehicles.geofences",     label: "Geofences",           path: "/vehicles/geofences" },
      { id: "vehicles.consumption",   label: "Consumption analysis",path: "/vehicles/consumption" },
      { id: "vehicles.expected",      label: "Expected fuel avg.",  path: "/vehicles/expected-average" },
      { id: "vehicles.transfers",     label: "Vehicle transfers",   path: "/vehicles/transfers" },
    ],
  },
  // … fueling, tank-stock, trips, customers-loyalty, sites,
  //    notifications, reports, fiscal, administration
];
```

### Field meanings

| Field | Meaning |
|---|---|
| `permission` | Canonical `resource.action` key. Backend is authoritative; frontend uses it to hide the menu item. |
| `gate` | `"always"` or `{ module: "<onboarding-code>" }`. Drives whether the section is enabled for the tenant at provisioning. |
| `scopeAware` | If `true`, the items inside this section honor the user's `UserResourceScope` rows (Site, Customer, Vehicle). |
| `children[].permission` | Optional per-item override when the section permission is broader than the page-level permission. |

---

## 8. Rules for the rewrite

Pulled from the underlying PRDs so they don't get lost in the rebuild:

1. **One layout, three audiences.** The Tenant shell renders for both client users and external viewers; differences live in nav data, not in chrome.  *(frontend-layout PRD §4, §8)*
2. **No `viewMode=customer` branch.** External viewers are `Client`-scope users with `UserResourceScope`.  *(tenancy-roles-model PRD §3)*
3. **Permission keys are `resource.action`.** Lowercase, dot-separated, identical across backend / frontend / DB / audit.  *(tenancy-roles-model.md §"Permission Naming Convention")*
4. **No hardcoded "Sites" string.** Resolve from `BrandingConfig.SiteTerminology` at render time.  *(tenancy-roles-model.md §"Sites Are Branches Are Depots")*
5. **No hardcoded brand strings.** All display names, colors, logos, support contact come from `BrandingConfig`.  *(tenancy-roles-model.md §"Non-Negotiable Architecture Rule #12")*
6. **Backend permission checks are authoritative.** Hiding a menu item never replaces an API-level permission check.  *(Rule #5)*
7. **One canonical Layout Shell.** Header 65 px, sidebar 235 / 75 px, M365 tokens, FontAwesome `fa-light`, Tailwind `tw-` prefix, SCSS only.  *(frontend-layout PRD §4.3, §5)*

---

## 9. Open questions for review

1. Should **Fiscal** be a top-level section or live under Administration until non-KE providers exist?
2. Should **Devices & providers** live under Administration (current proposal) or surface as its own top-level section for tenants with many IoT integrations?
3. Should **Customers & Loyalty** split into two sections when both `loyalty` and a future `b2b-billing` module exist?
4. Do we want **Drivers** as a top-level peer of Vehicles, or keep it under Trips & Tasks?
5. Should the **Sites** section be renamed in nav too, or only its sub-items?  (E.g. a Shell tenant with `SiteTerminology = "Station"` — does the section header read "Stations" or stay "Sites"?)

---

*Tenacity FMS — Side Navigation Manifest · Draft · Awaiting review*
