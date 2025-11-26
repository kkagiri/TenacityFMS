# DevExtreme Reporting Module - Complete Guide

## Overview

This guide provides comprehensive documentation for the DevExtreme Reporting Module, a flexible and powerful reporting system built on top of DevExtreme components for React and .NET Core.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Creating Reports](#creating-reports)
5. [Report Types](#report-types)
6. [API Reference](#api-reference)
7. [Examples](#examples)

---

## Architecture Overview

The reporting module follows a clean architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ ReportGallery│  │ ReportBuilder │  │ Custom Reports  │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
│           │                │                    │             │
│           └────────────────┴────────────────────┘             │
│                            │                                  │
│                    reportingService.js                       │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────┴────────────────────────────────┐
│                     Backend (.NET Core)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              ReportingController                      │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                         │
│  ┌─────────────────┴──────────────────┐                     │
│  │         MediatR Handlers           │                     │
│  │  - GenerateReportCommandHandler    │                     │
│  │  - GetReportDefinitionHandler      │                     │
│  └─────────────────┬──────────────────┘                     │
│                     │                                         │
│  ┌─────────────────┴──────────────────┐                     │
│  │          Services Layer            │                     │
│  │  - ReportDefinitionService         │                     │
│  │  - ReportGenerationService         │                     │
│  └────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### Backend
- **DTOs**: Define report structure and configuration
- **Commands/Queries**: CQRS pattern for report operations
- **Services**: Business logic for report generation
- **Controller**: REST API endpoints

#### Frontend
- **ReportBuilder**: Reusable component for rendering any report
- **ReportGallery**: Browse and access available reports
- **reportingService**: API communication layer

---

## Backend Setup

### 1. Register Services

In `FmsServiceCollectionExtensions.cs` or `Program.cs`:

```csharp
// Register reporting services
services.AddSingleton<IReportDefinitionService, ReportDefinitionService>();
services.AddScoped<IReportGenerationService, ReportGenerationService>();

// Register MediatR handlers (if not auto-registered)
services.AddMediatR(typeof(GenerateReportCommand).Assembly);
```

### 2. Configure Report Definitions

Report definitions can be configured in two ways:

#### A. In-Memory Configuration (Built-in Reports)

The `ReportDefinitionService` includes built-in reports. You can add more in the `InitializeBuiltInReports()` method:

```csharp
_reportDefinitions.Add(new ReportDefinitionDTO
{
    ReportId = "my-custom-report",
    ReportName = "My Custom Report",
    Description = "Description of the report",
    Category = "Custom Reports",
    Type = ReportType.DataGrid,
    Icon = "fa-light fa-chart-bar",
    DataSourceEndpoint = "/api/v1/MyData/endpoint",
    RequiredPermission = "_Read_myData",
    Columns = new List<ReportColumnDTO>
    {
        new() { DataField = "id", Caption = "ID", DataType = "number" },
        new() { DataField = "name", Caption = "Name", DataType = "string" },
        // ... more columns
    }
});
```

#### B. Database Configuration (Advanced)

For production, you can extend `ReportDefinitionService` to load report definitions from a database.

### 3. API Endpoints

The `ReportingController` provides these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/Reporting/definitions` | GET | Get all report definitions |
| `/api/v1/Reporting/definitions/{id}` | GET | Get specific report definition |
| `/api/v1/Reporting/generate` | POST | Generate a report |
| `/api/v1/Reporting/templates` | GET | Get user templates |
| `/api/v1/Reporting/templates` | POST | Save template |
| `/api/v1/Reporting/templates/{id}` | DELETE | Delete template |
| `/api/v1/Reporting/categories` | GET | Get report categories |

---

## Frontend Setup

### 1. Import Components

```javascript
// In your page or component
import { ReportBuilder } from '../../components/Reporting';
import reportingService from '../../services/reportingService';
```

### 2. Add Routing

In your React Router configuration:

```javascript
// Example routes
<Route path="/reports" element={<ReportGallery />} />
<Route path="/reports/tank-volume-history" element={<TankVolumeHistoryReport />} />
```

### 3. Navigation

You can add navigation to reports in your menu:

```javascript
{
  path: '/reports',
  icon: 'fa-light fa-chart-mixed',
  label: 'Reports',
  children: [
    { path: '/reports', label: 'Report Gallery' },
    { path: '/reports/tank-volume-history', label: 'Tank Volume History' }
  ]
}
```

---

## Creating Reports

### Method 1: Using Report Definition (Recommended)

1. **Define the report in backend** (`ReportDefinitionService.cs`)
2. **Create a React page** that loads the definition
3. **Use ReportBuilder component** to render it

Example:

```javascript
const MyCustomReport = () => {
  const [reportDefinition, setReportDefinition] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const loadReport = async () => {
      const result = await reportingService.getReportDefinition('my-report-id');
      if (result.success) {
        setReportDefinition(result.data);
      }
    };
    loadReport();
  }, []);

  return (
    <div>
      {/* Your custom filter UI */}
      <ReportBuilder
        reportDefinition={reportDefinition}
        filters={filters}
        autoLoad={true}
      />
    </div>
  );
};
```

### Method 2: Direct DevExtreme Components

For custom layouts, use DevExtreme components directly:

```javascript
import { DataGrid } from 'devextreme-react/data-grid';
import { Column, FilterRow, HeaderFilter } from 'devextreme-react/data-grid';

const MyReport = () => {
  const [data, setData] = useState([]);

  return (
    <DataGrid dataSource={data} showBorders={true}>
      <Column dataField="id" caption="ID" />
      <Column dataField="name" caption="Name" />
      <FilterRow visible={true} />
      <HeaderFilter visible={true} />
    </DataGrid>
  );
};
```

---

## Report Types

### 1. DataGrid Reports

Best for: Tabular data with sorting, filtering, grouping

Features:
- Column customization
- Grouping and aggregations
- Export to Excel/PDF
- Custom cell rendering
- Master-detail views

Example configuration:

```csharp
Type = ReportType.DataGrid,
Columns = new List<ReportColumnDTO>
{
    new() { DataField = "siteName", Caption = "Site", AllowGrouping = true },
    new() { DataField = "volume", Caption = "Volume", DataType = "number", Format = "0.00" }
},
Summaries = new List<ReportSummaryDTO>
{
    new() { DataField = "volume", SummaryType = "sum", DisplayFormat = "Total: {0:N2}" }
}
```

### 2. PivotGrid Reports

Best for: Multi-dimensional analysis, cross-tabulation

Features:
- Drag-and-drop field organization
- Dynamic grouping by any field
- Drill-down capabilities
- Field chooser
- Export to Excel

Example configuration:

```csharp
Type = ReportType.PivotGrid,
PivotConfiguration = new PivotGridConfiguration
{
    Fields = new List<PivotFieldDTO>
    {
        new() { DataField = "siteName", Caption = "Site", Area = "row" },
        new() { DataField = "month", Caption = "Month", Area = "column" },
        new() { DataField = "volume", Caption = "Volume", Area = "data", SummaryType = "sum" }
    }
}
```

### 3. Chart Reports (Future Enhancement)

```csharp
Type = ReportType.Chart
// Chart configuration would go here
```

### 4. Custom Dashboard (Future Enhancement)

```csharp
Type = ReportType.CustomDashboard
// Dashboard configuration with multiple widgets
```

---

## API Reference

### Backend Services

#### IReportDefinitionService

```csharp
Task<ReportDefinitionDTO?> GetReportDefinitionAsync(string reportId);
Task<List<ReportDefinitionDTO>> GetAllReportDefinitionsAsync();
Task<ReportTemplateDTO> SaveReportTemplateAsync(SaveReportTemplateDTO template, string userId);
Task<List<ReportTemplateDTO>> GetReportTemplatesAsync(string? userId, string? reportId, bool includeShared);
Task<bool> DeleteReportTemplateAsync(string templateId, string userId);
```

#### IReportGenerationService

```csharp
Task<GenerateReportResponseDTO> GenerateJsonReportAsync(ReportDefinitionDTO reportDefinition, Dictionary<string, object>? filters);
Task<GenerateReportResponseDTO> GenerateExcelReportAsync(ReportDefinitionDTO reportDefinition, Dictionary<string, object>? filters);
Task<GenerateReportResponseDTO> GeneratePdfReportAsync(ReportDefinitionDTO reportDefinition, Dictionary<string, object>? filters);
Task<GenerateReportResponseDTO> GenerateCsvReportAsync(ReportDefinitionDTO reportDefinition, Dictionary<string, object>? filters);
```

### Frontend Service

#### reportingService

```javascript
// Get report definitions
await reportingService.getReportDefinitions(category)
await reportingService.getReportDefinition(reportId)

// Generate reports
await reportingService.generateReport({
  reportId: 'my-report',
  filters: { startDate: '2024-01-01', endDate: '2024-12-31' },
  exportFormat: 'excel' // 'json', 'excel', 'pdf', 'csv'
})

// Templates
await reportingService.getReportTemplates(reportId, includeShared)
await reportingService.saveReportTemplate(template)
await reportingService.deleteReportTemplate(templateId)

// Categories
await reportingService.getReportCategories()

// Direct data fetch
await reportingService.fetchReportData(endpoint, params)
```

---

## Examples

### Example 1: Tank Volume History Report

See [TankVolumeHistoryReport.js](../../fms.frontend/src/pages/reports/TankVolumeHistoryReport.js) for a complete example.

Key features:
- Custom filter panel
- Date range selection
- Site and tank filtering
- Export to Excel

### Example 2: Pivot Grid Report

See existing implementation in [VolumeHistoryReports.js](../../fms.frontend/src/pages/tankStock/analytics/components/reporting/VolumeHistoryReports.js)

### Example 3: Creating a New Report

#### Step 1: Define Backend Report

```csharp
// In ReportDefinitionService.cs
_reportDefinitions.Add(new ReportDefinitionDTO
{
    ReportId = "vehicle-maintenance-report",
    ReportName = "Vehicle Maintenance Report",
    Description = "Comprehensive vehicle maintenance history",
    Category = "Vehicle Management",
    Type = ReportType.DataGrid,
    DataSourceEndpoint = "/api/v1/VehicleMaintenance/history",
    Columns = new List<ReportColumnDTO>
    {
        new() { DataField = "vehicleName", Caption = "Vehicle", AllowGrouping = true },
        new() { DataField = "maintenanceDate", Caption = "Date", DataType = "date", Format = "MM/dd/yyyy" },
        new() { DataField = "maintenanceType", Caption = "Type", AllowGrouping = true },
        new() { DataField = "cost", Caption = "Cost", DataType = "number", Format = "currency" }
    }
});
```

#### Step 2: Create Frontend Component

```javascript
// VehicleMaintenanceReport.js
import React, { useState, useEffect } from 'react';
import { ReportBuilder } from '../../components/Reporting';
import { DateBox } from 'devextreme-react/date-box';
import reportingService from '../../services/reportingService';

const VehicleMaintenanceReport = () => {
  const [reportDefinition, setReportDefinition] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [filters, setFilters] = useState(null);

  useEffect(() => {
    const loadReport = async () => {
      const result = await reportingService.getReportDefinition('vehicle-maintenance-report');
      if (result.success) {
        setReportDefinition(result.data);
      }
    };
    loadReport();
  }, []);

  const handleApplyFilters = () => {
    setFilters({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  };

  return (
    <div className="tw-flex tw-flex-col tw-h-full tw-p-4 tw-gap-4">
      {/* Filter Panel */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-4">
        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
          <DateBox value={startDate} onValueChanged={(e) => setStartDate(e.value)} />
          <DateBox value={endDate} onValueChanged={(e) => setEndDate(e.value)} />
        </div>
        <button onClick={handleApplyFilters} className="tw-mt-4">Apply Filters</button>
      </div>

      {/* Report */}
      <div className="tw-flex-1">
        <ReportBuilder
          reportDefinition={reportDefinition}
          filters={filters}
          autoLoad={false}
        />
      </div>
    </div>
  );
};

export default VehicleMaintenanceReport;
```

#### Step 3: Add Route

```javascript
<Route path="/reports/vehicle-maintenance" element={<VehicleMaintenanceReport />} />
```

---

## Best Practices

1. **Report Definitions**: Always define reports in the backend for consistency
2. **Permissions**: Use `RequiredPermission` field to control access
3. **Performance**: Use pagination and limit records for large datasets
4. **Caching**: Consider caching report definitions on the frontend
5. **Export**: Always test exports with real data
6. **Filters**: Validate filter values before sending to API
7. **Error Handling**: Always handle loading and error states

---

## Troubleshooting

### Common Issues

1. **Report not loading**: Check browser console for API errors
2. **Export not working**: Ensure ExcelJS and FileSaver are installed
3. **Pivot grid not rendering**: Check that data format matches field definitions
4. **Filters not applying**: Verify filter keys match backend parameter names

### Debug Tips

```javascript
// Enable debug logging
console.log('Report Definition:', reportDefinition);
console.log('Filters:', filters);
console.log('Data:', reportData);
```

---

## Future Enhancements

- [ ] Chart report type implementation
- [ ] Custom dashboard support
- [ ] Scheduled reports (email delivery)
- [ ] Report templates persistence in database
- [ ] Report sharing and collaboration
- [ ] Advanced analytics (predictive, comparative)
- [ ] Mobile-optimized report views
- [ ] Report scheduling and automation

---

## Support

For questions or issues:
1. Check this documentation
2. Review example implementations
3. Check DevExtreme documentation: https://js.devexpress.com/
4. Contact the development team

---

## Version History

- **v1.0.0** (2024-01-24): Initial release
  - DataGrid reports
  - PivotGrid reports
  - Report Gallery
  - Template management
  - Export functionality
