# Standardize Module Dashboards Plan

## Goal
Give every module dashboard (Vehicle, IssueTracker, Admin, TankStock, Employee, Events, Reports) the same widget-based experience as the main RealtimeDashboard at `/home`, while preserving module-specific features.

## Architecture

### Shared Component: `ModuleDashboard`
A reusable shell component that wraps `CategoryGroupedWidgetRenderer` + `EnhancedWidgetRenderer` with module-scoping. Each module page renders `<ModuleDashboard moduleId="vehicle" />` instead of custom layouts.

### Data Flow
```
ModuleDashboard (moduleId="vehicle")
  → useModuleDashboard(moduleId) hook
    → loads module-specific widget instances (scoped by moduleId)
    → fetches data from registered data sources
    → optional SignalR real-time updates
  → CategoryGroupedWidgetRenderer (same as main dashboard)
    → EnhancedWidgetRenderer per widget
```

---

## Implementation Steps

### Step 1: Register Module Data Sources (Backend)
**File:** `DataSourceManager.Metadata.cs`

Add data sources for each module that don't already exist:

**Vehicle Module:**
- `vehicle_fleet_status` → Total/Active/Online/Maintenance counts (BigStat)
- `vehicle_fleet_health` → Fleet health score (BigStat)
- `vehicle_status_distribution` → Status breakdown (PieChart)
- `vehicle_utilization_trend` → Daily utilization (LineChart)
- `vehicle_performance_table` → Per-vehicle metrics (DataTable)
- `vehicle_recent_activities` → Activity log (DataTable)
- `vehicle_trip_operations` → Trip KPIs (BigStat)

**IssueTracker Module:**
- `issue_overview_stats` → Total/Open/InProgress/Resolved (BigStat)
- `issue_priority_alerts` → Critical/High/Overdue/Unassigned (BigStat)
- `issue_user_stats` → Assigned/Opened by me stats (BigStat)
- `issue_by_week` → Weekly opened/closed (BarChart)
- `issue_by_category` → Category distribution (PieChart)
- `issue_by_vehicle` → Top vehicles (BarChart)
- `issue_by_site` → Top sites (BarChart)
- `issue_assigned_list` → Assigned issues grid (DataTable)
- `issue_activity_heatmap` → Activity heatmap data (custom/ProgressList)

**TankStock Module:**
- `tank_overview_stats` → Total/Stock/Fill Level/Critical (BigStat)
- `tank_levels_by_site` → Grouped tank levels (ProgressList)
- `tank_critical_alerts` → Low-level alerts (Alert)
- `tank_volume_trend` → Volume over time (LineChart)

**Employee Module:**
- `employee_overview_stats` → Total/Active/Terminated (BigStat)
- `employee_assignment_stats` → Assigned/Unassigned/Vehicles (BigStat)
- `employee_site_distribution` → Distribution by site (BarChart)
- `employee_top_assignments` → Top vehicle assignments (DataTable)
- `employee_recent_updates` → Recently updated (DataTable)

**Admin Module:**
- `admin_system_health` → System status indicators (BigStat)
- `admin_user_activity` → Recent user activity (DataTable)
- `admin_module_summary` → Module feature cards (ProgressList)

**Reports Module:**
- `report_execution_stats` → Total/Success/Failed/AvgDuration (BigStat)
- `report_execution_history` → Execution log (DataTable)
- `report_format_usage` → Format distribution (PieChart)

### Step 2: Add Data Handlers (Backend)
**File:** `DataSourceManager.cs`

For each new data source, implement the handler method that queries the database and returns data in the standard widget format:
```csharp
{ current: { value, unit, trend }, timeSeries: [...], metadata: {...} }
```

Reuse existing query handlers from each module (e.g., `GetVehicleDashboardMetricsQuery`, `GetUserIssuesDashboardQuery`).

### Step 3: Create Widget Templates (Backend)
**File:** `WidgetTemplateSeeder.cs`

Add pre-configured widget templates for each module with:
- Module-scoped category (e.g., `vehicle_operations`, `issue_tracking`)
- Pre-linked data source
- Default visualization type
- Default settings (colors, labels, sizes)

### Step 4: Create `ModuleDashboard` Component (Frontend)
**File:** `src/components/dashboard/ModuleDashboard.js`

Reusable component that:
- Accepts `moduleId` prop to scope widget instances
- Accepts `title` and `headerActions` props for module-specific header content
- Uses `CategoryGroupedWidgetRenderer` for layout
- Supports edit mode (add/remove/resize widgets)
- Supports grouping (by category, widget type, none)
- Saves layout per module to localStorage/Redux

### Step 5: Create `useModuleDashboard` Hook (Frontend)
**File:** `src/hooks/useModuleDashboard.js`

Custom hook that:
- Loads widget instances filtered by `moduleId`
- Fetches data for each widget's data source
- Manages loading/error/stale states
- Optionally subscribes to SignalR for real-time updates
- Provides CRUD methods for widget instances

### Step 6: Update Module Dashboard Pages (Frontend)

Replace custom dashboard layouts with `<ModuleDashboard>`:

**Vehicle:** `src/pages/vehicles/dashboard/VehicleDashboard.js`
```jsx
<ModuleDashboard
  moduleId="vehicle"
  title="Vehicle Fleet Dashboard"
  headerActions={[/* Manage Fleet, Live Tracking buttons */]}
  defaultWidgets={vehicleDefaultWidgets}
/>
```

**IssueTracker:** `src/pages/issueTracker/components/CombinedIssueDashboard.js`
```jsx
<>
  <FollowedIssuesTicker />
  <DashboardFilterSection />
  <ModuleDashboard
    moduleId="issue_tracker"
    title="Issue Dashboard"
    defaultWidgets={issueDefaultWidgets}
  />
</>
```

**TankStock:** `src/pages/tankStock/dashboard/EnhancedTankStockDashboard.js`
```jsx
<ModuleDashboard
  moduleId="tank_stock"
  title="Tank Stock Dashboard"
  headerActions={[/* Map View toggle */]}
  defaultWidgets={tankStockDefaultWidgets}
  customSections={[<TankLevelVisuals />, <MapView />]}
/>
```

**Employee:** `src/pages/employees/dashboard/EmployeeDashboard.js`
```jsx
<ModuleDashboard
  moduleId="employee"
  title="Employee Operations"
  headerActions={[/* Employee List, Consumption History */]}
  defaultWidgets={employeeDefaultWidgets}
/>
```

**Admin:** `src/pages/admin/AdminDashboard.js`
```jsx
<ModuleDashboard
  moduleId="admin"
  title="Administration"
  defaultWidgets={adminDefaultWidgets}
  customSections={[<AdminFeatureGrid />]}
/>
```

**Reports:** `src/pages/reports/ReportsDashboard.js`
```jsx
<ModuleDashboard
  moduleId="reports"
  title="Reports Overview"
  defaultWidgets={reportsDefaultWidgets}
  customSections={[<ReportSourceCatalog />]}
/>
```

### Step 7: Default Widget Configurations (Frontend)
**File:** `src/config/moduleDefaultWidgets.js`

Define default widget sets per module (used when no saved layout exists):
```js
export const vehicleDefaultWidgets = [
  { widgetType: 'BigStat', dataSource: 'vehicle_fleet_status', category: 'vehicle_operations', size: 'small', name: 'Total Vehicles' },
  { widgetType: 'PieChart', dataSource: 'vehicle_status_distribution', category: 'vehicle_operations', size: 'medium', name: 'Status Distribution' },
  { widgetType: 'LineChart', dataSource: 'vehicle_utilization_trend', category: 'vehicle_operations', size: 'large', name: 'Fleet Utilization' },
  { widgetType: 'DataTable', dataSource: 'vehicle_performance_table', category: 'vehicle_operations', size: 'full', name: 'Vehicle Performance' },
  // ...
];
```

### Step 8: Module-Specific Custom Sections
Some modules have unique features that don't map to standard widgets:
- **TankStock**: SVG tank level visuals, Google Maps view → Keep as `customSections`
- **IssueTracker**: Followed issues ticker, heatmap, filter bar → Keep as header/custom sections
- **Admin**: Feature navigation grid → Keep as `customSections`
- **Reports**: Source catalog with format badges → Keep as `customSections`

These render above/below the widget grid via the `customSections` prop.

---

## File Changes Summary

### New Files
1. `src/components/dashboard/ModuleDashboard.js` - Reusable module dashboard shell
2. `src/components/dashboard/ModuleDashboard.scss` - Styles
3. `src/hooks/useModuleDashboard.js` - Module dashboard hook
4. `src/config/moduleDefaultWidgets.js` - Default widget configs per module

### Modified Files (Backend)
5. `DataSourceManager.Metadata.cs` - Register ~30 new data sources
6. `DataSourceManager.cs` - Add handler methods for new data sources
7. `WidgetTemplateSeeder.cs` - Add module widget templates

### Modified Files (Frontend)
8. `VehicleDashboard.js` - Use ModuleDashboard
9. `CombinedIssueDashboard.js` - Use ModuleDashboard (keep ticker/filters)
10. `EnhancedTankStockDashboard.js` - Use ModuleDashboard (keep tank visuals/map)
11. `EmployeeDashboard.js` - Use ModuleDashboard
12. `AdminDashboard.js` - Use ModuleDashboard (keep feature grid)
13. `ReportsDashboard.js` - Use ModuleDashboard (keep catalog)
