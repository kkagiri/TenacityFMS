# Adding a New Report — Step-by-Step Guide

This guide walks through adding a new report source to the FMS reporting system.

**Example**: Adding a "Driver Activity" report.

---

## Prerequisites

- An existing API endpoint that returns the data you want to report on
- A clear understanding of the data fields and required filters

---

## Step 1: Create the Frontend Source Definition

Create a new file in `fms.frontend/src/pages/reports/sources/`:

**File**: `driverActivitySource.js`

```javascript
/**
 * File: driverActivitySource.js
 * Purpose: Report source definition for Driver Activity reports
 * Dependencies: reportSourceRegistry
 * Last Modified: 2026-02-19
 */

const driverActivitySource = {
  id: 'driver-activity',
  name: 'Driver Activity Report',
  category: 'Fleet Management',
  icon: 'fa-light fa-user-helmet-safety',
  description: 'Track driver activity including trips, fuel usage, and idle time.',
  apiEndpoint: '/DriverActivity/filtered',        // Your existing API endpoint
  templateName: 'driver-activity-report',          // Template name (will create later)
  supportedFormats: ['html', 'pdf', 'excel'],
  parameters: [
    {
      name: 'startDate',
      type: 'date',
      required: true,
      label: 'Start Date',
      defaultValue: 'startOfMonth'
    },
    {
      name: 'endDate',
      type: 'date',
      required: true,
      label: 'End Date',
      defaultValue: 'today'
    },
    {
      name: 'siteId',
      type: 'lookup',
      lookupSource: 'sites',
      label: 'Site',
      required: false
    },
    {
      name: 'driverId',
      type: 'lookup',
      lookupSource: 'drivers',    // Must exist in LOOKUP_CONFIG in ReportParameterForm
      label: 'Driver',
      required: false
    }
  ]
};

export default driverActivitySource;
```

## Step 2: Register the Source

Add the source to `reportSourceRegistry.js`:

```javascript
import driverActivitySource from './driverActivitySource';

// In the registry initialization:
reportSourceRegistry.set('driver-activity', driverActivitySource);
```

## Step 3: Add the Data Mapper

Add a mapper function in `fms.frontend/src/pages/reports/engine/reportDataBuilder.js`:

```javascript
// Add to the source-specific mapper switch/dispatch:
case 'driver-activity':
  return mapDriverActivity(records, queryParams);

// Add the mapper function:
function mapDriverActivity(records, queryParams) {
  return records.map(record => ({
    date: getValue(record, ['date', 'activityDate', 'Date']),
    driverName: getValue(record, ['driverName', 'DriverName', 'driver']),
    vehicleRegNo: getValue(record, ['vehicleRegNo', 'VehicleRegNo', 'registrationNumber']),
    trips: getValue(record, ['trips', 'tripCount', 'TripCount']),
    distanceKm: getValue(record, ['distanceKm', 'DistanceKm', 'distance']),
    fuelUsedLiters: getValue(record, ['fuelUsedLiters', 'FuelUsedLiters', 'fuelUsed']),
    idleTimeMinutes: getValue(record, ['idleTimeMinutes', 'IdleTimeMinutes', 'idleTime']),
  }));
}
```

The `getValue()` function performs case-insensitive lookup across multiple property name variants, handling API response inconsistencies.

## Step 4: Create the Handlebars Template

Create the template file at `C:\FMSData\reports\templates\driver-activity-report.html`:

```handlebars
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background-color: #2c3e50; color: white; padding: 8px; text-align: left; }
    td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .report-header { text-align: center; margin-bottom: 20px; }
    .report-title { font-size: 18px; font-weight: bold; }
    .report-subtitle { font-size: 12px; color: #666; }
    .summary-row { font-weight: bold; background-color: #ecf0f1; }
  </style>
</head>
<body>
  <!-- Letterhead branding is auto-injected above this -->

  <div class="report-header">
    <div class="report-title">{{reportTitle}}</div>
    <div class="report-subtitle">Generated: {{generatedAt}}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Driver</th>
        <th>Vehicle</th>
        <th>Trips</th>
        <th>Distance (km)</th>
        <th>Fuel Used (L)</th>
        <th>Idle Time (min)</th>
      </tr>
    </thead>
    <tbody>
      {{#each records}}
      <tr>
        <td>{{this.date}}</td>
        <td>{{this.driverName}}</td>
        <td>{{this.vehicleRegNo}}</td>
        <td>{{this.trips}}</td>
        <td>{{this.distanceKm}}</td>
        <td>{{this.fuelUsedLiters}}</td>
        <td>{{this.idleTimeMinutes}}</td>
      </tr>
      {{/each}}
    </tbody>
    {{#if summary}}
    <tfoot>
      <tr class="summary-row">
        <td colspan="3">Totals</td>
        <td>{{summary.totalTrips}}</td>
        <td>{{summary.totalDistance}}</td>
        <td>{{summary.totalFuel}}</td>
        <td>{{summary.totalIdleTime}}</td>
      </tr>
    </tfoot>
    {{/if}}
  </table>
</body>
</html>
```

**Alternative**: Add the template as an embedded default in `JsReportHtmlTemplates.cs`:

```csharp
public static readonly string DriverActivityReportTemplate = @"
<html>
  <!-- Same HTML as above -->
</html>";
```

And register it in `JsReportTemplateManager` so it auto-seeds on startup.

## Step 5: (Optional) Add an Embedded Default Template

If you want the template to auto-seed (recommended for built-in reports), add to `JsReportHtmlTemplates.cs` and register in `JsReportTemplateManager.SeedDefaultTemplates()`:

```csharp
// In JsReportTemplateManager.cs, SeedDefaultTemplates():
await SeedTemplate("driver-activity-report", JsReportHtmlTemplates.DriverActivityReportTemplate);
```

## Step 6: (Optional) Add Lookup Support

If your report needs a new lookup type (e.g., `drivers`), add it to the `LOOKUP_CONFIG` in `ReportParameterForm.js`:

```javascript
const LOOKUP_CONFIG = {
  // ... existing lookups ...
  drivers: {
    action: fetchDriverList,      // Redux thunk action
    selector: selectDriverList,   // Redux selector
    valueField: 'driverId',
    displayField: 'driverName',
    placeholder: 'Select Driver'
  }
};
```

---

## Verification Checklist

After completing the steps above:

- [ ] Source definition created in `sources/` folder
- [ ] Source registered in `reportSourceRegistry`
- [ ] Data mapper added to `reportDataBuilder.js`
- [ ] Handlebars template created (file or embedded)
- [ ] Template auto-seeds on startup (if embedded)
- [ ] New lookup types added to `LOOKUP_CONFIG` (if needed)
- [ ] Report appears on the dashboard at `/reports`
- [ ] Report generates correctly in HTML, PDF, and Excel formats
- [ ] Filters work correctly
- [ ] Scheduling works for the new source

---

## Common Patterns

### Adding summary calculations in the mapper

```javascript
function mapDriverActivity(records, queryParams) {
  const mapped = records.map(record => ({ /* ... */ }));

  return {
    records: mapped,
    summary: {
      totalTrips: mapped.reduce((sum, r) => sum + (r.trips || 0), 0),
      totalDistance: mapped.reduce((sum, r) => sum + (r.distanceKm || 0), 0).toFixed(2),
      totalFuel: mapped.reduce((sum, r) => sum + (r.fuelUsedLiters || 0), 0).toFixed(2),
      totalIdleTime: mapped.reduce((sum, r) => sum + (r.idleTimeMinutes || 0), 0),
    }
  };
}
```

### Supporting conditional columns

In the template, conditionally show columns based on data presence:

```handlebars
{{#if records.0.distanceKm}}
  <th>Distance (km)</th>
{{/if}}
```

### Multi-value filter parameters

For parameters that accept multiple values (e.g., multiple vehicle IDs):

```javascript
{
  name: 'vehicleIds',
  type: 'multiLookup',
  lookupSource: 'vehicles',
  label: 'Vehicles',
  required: false,
  queryParam: 'vehicleIds'   // Sent as repeated keys: ?vehicleIds=1&vehicleIds=2
}
```

The `reportingService.fetchReportData()` automatically handles array parameters with repeated keys for ASP.NET Core model binding.
