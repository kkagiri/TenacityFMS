# DevExtreme Reporting - Quick Start Guide

## 5-Minute Setup

### 1. Access Report Gallery

Navigate to:
```
/reports
```

This shows all available reports in a visual gallery.

### 2. Example: Tank Volume History Report

Visit:
```
/reports/tank-volume-history
```

### 3. Using the Report Builder Component

```javascript
import { ReportBuilder } from '../../components/Reporting';
import reportingService from '../../services/reportingService';

const MyReport = () => {
  const [reportDef, setReportDef] = useState(null);

  useEffect(() => {
    reportingService.getReportDefinition('my-report-id')
      .then(result => setReportDef(result.data));
  }, []);

  return (
    <ReportBuilder
      reportDefinition={reportDef}
      filters={{ startDate: '2024-01-01' }}
      autoLoad={true}
    />
  );
};
```

## Creating Your First Report

### Backend (5 steps)

1. **Define the report** in `ReportDefinitionService.cs`:

```csharp
_reportDefinitions.Add(new ReportDefinitionDTO
{
    ReportId = "my-first-report",
    ReportName = "My First Report",
    Category = "Custom",
    Type = ReportType.DataGrid,
    DataSourceEndpoint = "/api/v1/MyData",
    Columns = new List<ReportColumnDTO>
    {
        new() { DataField = "id", Caption = "ID" },
        new() { DataField = "name", Caption = "Name" }
    }
});
```

2. **Ensure your data endpoint exists** (`/api/v1/MyData`)

3. **Build the project**

### Frontend (3 steps)

1. **Create report page** `MyFirstReport.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { ReportBuilder } from '../../components/Reporting';
import reportingService from '../../services/reportingService';

const MyFirstReport = () => {
  const [reportDef, setReportDef] = useState(null);

  useEffect(() => {
    reportingService.getReportDefinition('my-first-report')
      .then(res => res.success && setReportDef(res.data));
  }, []);

  return <ReportBuilder reportDefinition={reportDef} autoLoad={true} />;
};

export default MyFirstReport;
```

2. **Add route**:

```javascript
<Route path="/reports/my-first" element={<MyFirstReport />} />
```

3. **Done!** Navigate to `/reports/my-first`

## Report Types

### DataGrid (Tabular)
```csharp
Type = ReportType.DataGrid
```
Use for: Lists, tables, detailed records

### PivotGrid (Analysis)
```csharp
Type = ReportType.PivotGrid
```
Use for: Cross-tabulation, aggregations, drill-down

## Key Features

✅ **Auto-Export** - Excel export built-in
✅ **Filtering** - Header filters, search
✅ **Grouping** - Group by any column
✅ **Sorting** - Multi-column sorting
✅ **Templates** - Save custom configurations
✅ **Responsive** - Mobile-friendly

## Common Patterns

### Pattern 1: Report with Date Filter

```javascript
const [filters, setFilters] = useState({
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString()
});

<ReportBuilder reportDefinition={def} filters={filters} />
```

### Pattern 2: Report with Search

```javascript
const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  if (searchTerm) {
    setFilters({ search: searchTerm });
  }
}, [searchTerm]);
```

### Pattern 3: Multi-Filter Report

```javascript
const buildFilters = () => ({
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString(),
  siteId: selectedSite,
  status: selectedStatus
});

<Button onClick={() => setFilters(buildFilters())} text="Apply" />
```

## Exports

Reports automatically support Excel export. Click the **Export** button in the report header.

Custom export:
```javascript
const handleExport = async () => {
  const result = await reportingService.generateReport({
    reportId: 'my-report',
    filters: myFilters,
    exportFormat: 'excel'
  });

  if (result.success) {
    reportingService.downloadReportFile(result.fileContent, result.fileName);
  }
};
```

## Next Steps

1. ✅ Explore existing reports in Report Gallery
2. ✅ Create your first custom report
3. ✅ Add filters to enhance usability
4. ✅ Implement templates for power users
5. ✅ Review the [Complete Guide](./DEVEXTREME_REPORTING_GUIDE.md)

## Examples in Codebase

- **Tank Volume History Report**: `fms.frontend/src/pages/reports/TankVolumeHistoryReport.js`
- **Pivot Grid Report**: `fms.frontend/src/pages/tankStock/analytics/components/reporting/VolumeHistoryReports.js`
- **Report Gallery**: `fms.frontend/src/pages/reports/ReportGallery.js`

## Troubleshooting

### Report shows "No data"
- Check that the data endpoint returns data
- Verify filters are correct
- Check browser console for API errors

### Export not working
- Ensure ExcelJS is installed: `npm install exceljs file-saver`
- Check browser console for errors

### Report definition not found
- Verify `reportId` matches backend definition
- Check that backend service is registered

## Need Help?

- 📚 [Complete Guide](./DEVEXTREME_REPORTING_GUIDE.md)
- 🔍 [API Reference](./DEVEXTREME_REPORTING_GUIDE.md#api-reference)
- 💡 [Examples](./DEVEXTREME_REPORTING_GUIDE.md#examples)
