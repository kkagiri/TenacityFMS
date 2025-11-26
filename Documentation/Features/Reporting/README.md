# DevExtreme Reporting Module

A comprehensive, flexible reporting system for the FMS application built with DevExtreme React components and .NET Core backend.

## 🚀 Features

- **📊 Multiple Report Types**: DataGrid, PivotGrid, Charts (future), Dashboards (future)
- **🎨 Report Gallery**: Visual browsing interface for all reports
- **🔧 Flexible Configuration**: Define reports in code or database
- **📤 Export Support**: Excel, PDF, CSV exports
- **🎯 Smart Filtering**: Date ranges, dropdowns, multi-select
- **👥 Templates**: Save and share report configurations
- **📱 Responsive**: Works on desktop, tablet, and mobile
- **🔒 Permission-Based**: Integrated with existing security

## 📁 Project Structure

```
Backend:
├── FMS.Application/Features/Reporting/
│   ├── DTOs/
│   │   ├── ReportDefinitionDTO.cs
│   │   └── GenerateReportRequestDTO.cs
│   ├── Commands/
│   │   ├── GenerateReportCommand.cs
│   │   └── GenerateReportCommandHandler.cs
│   ├── Queries/
│   │   ├── GetReportDefinitionQuery.cs
│   │   └── GetReportDefinitionQueryHandler.cs
│   └── Services/
│       ├── IReportDefinitionService.cs
│       ├── IReportGenerationService.cs
│       └── ReportDefinitionService.cs
├── FMS.WebClient/Controllers/
│   └── ReportingController.cs

Frontend:
├── fms.frontend/src/
│   ├── components/Reporting/
│   │   ├── ReportBuilder.js
│   │   ├── ReportBuilder.scss
│   │   └── index.js
│   ├── pages/reports/
│   │   ├── ReportGallery.js
│   │   ├── TankVolumeHistoryReport.js
│   │   └── ReportsIndex.js
│   └── services/
│       └── reportingService.js
```

## 🎯 Quick Start

### View Available Reports
```
Navigate to: /reports
```

### Example Report
```
Navigate to: /reports/tank-volume-history
```

### Create a New Report (5 minutes)

1. **Backend**: Add definition in `ReportDefinitionService.cs`
```csharp
_reportDefinitions.Add(new ReportDefinitionDTO
{
    ReportId = "my-report",
    ReportName = "My Report",
    DataSourceEndpoint = "/api/v1/MyData",
    Columns = new List<ReportColumnDTO> { ... }
});
```

2. **Frontend**: Create component
```javascript
import { ReportBuilder } from '../../components/Reporting';

const MyReport = () => {
  const [def, setDef] = useState(null);

  useEffect(() => {
    reportingService.getReportDefinition('my-report')
      .then(r => setDef(r.data));
  }, []);

  return <ReportBuilder reportDefinition={def} autoLoad={true} />;
};
```

3. **Route**: Add to router
```javascript
<Route path="/reports/my-report" element={<MyReport />} />
```

## 📚 Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Get up and running in 5 minutes
- **[Complete Guide](./DEVEXTREME_REPORTING_GUIDE.md)** - Comprehensive documentation
- **[API Reference](./DEVEXTREME_REPORTING_GUIDE.md#api-reference)** - Detailed API docs

## 🎨 Built-In Reports

### Tank Volume History Report
- **ID**: `tank-volume-history-report`
- **Type**: DataGrid
- **Features**: Filtering, grouping, export
- **Endpoint**: `/api/v1/TankVolumeHistory/filtered`

### Tank Volume Pivot Report
- **ID**: `tank-volume-pivot-report`
- **Type**: PivotGrid
- **Features**: Multi-dimensional analysis, drill-down
- **Endpoint**: `/api/v1/TankStockReports/pivot-data`

## 🔧 Configuration

### Report Definition Structure

```csharp
new ReportDefinitionDTO
{
    ReportId = "unique-id",
    ReportName = "Display Name",
    Description = "Report description",
    Category = "Category Name",
    Type = ReportType.DataGrid, // or PivotGrid
    Icon = "fa-light fa-icon-name",
    DataSourceEndpoint = "/api/v1/endpoint",
    RequiredPermission = "_Read_permission",
    Columns = [ ... ],
    Summaries = [ ... ],
    ExportOptions = { ... }
}
```

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/Reporting/definitions` | GET | List all reports |
| `/api/v1/Reporting/definitions/{id}` | GET | Get report by ID |
| `/api/v1/Reporting/generate` | POST | Generate report |
| `/api/v1/Reporting/templates` | GET/POST | Manage templates |
| `/api/v1/Reporting/categories` | GET | Get categories |

## 💡 Usage Examples

### Basic DataGrid Report
```javascript
<ReportBuilder
  reportDefinition={reportDef}
  filters={{ startDate: '2024-01-01' }}
  autoLoad={true}
/>
```

### With Custom Filters
```javascript
const MyReport = () => {
  const [filters, setFilters] = useState({});

  return (
    <div>
      <FilterPanel onApply={setFilters} />
      <ReportBuilder
        reportDefinition={reportDef}
        filters={filters}
        autoLoad={false}
      />
    </div>
  );
};
```

### Export Report
```javascript
const handleExport = async () => {
  const result = await reportingService.generateReport({
    reportId: 'my-report',
    filters: myFilters,
    exportFormat: 'excel'
  });

  if (result.success) {
    reportingService.downloadReportFile(
      result.fileContent,
      result.fileName
    );
  }
};
```

## 🎯 Report Types

### 1. DataGrid Reports
**Best for:** Tabular data, detailed records
**Features:** Sorting, filtering, grouping, summaries, export

### 2. PivotGrid Reports
**Best for:** Multi-dimensional analysis, aggregations
**Features:** Drag-drop fields, drill-down, cross-tabulation

### 3. Chart Reports (Coming Soon)
**Best for:** Visual trends and patterns

### 4. Dashboard Reports (Coming Soon)
**Best for:** Multiple metrics on one screen

## 🔐 Security

Reports integrate with existing permission system:
```csharp
RequiredPermission = "_Read_tankVolumeHistory"
```

Permission is checked automatically on the backend.

## 📊 Performance

- **Pagination**: Built-in for large datasets
- **Lazy Loading**: Data loaded on demand
- **Caching**: Report definitions cached on frontend
- **Efficient Exports**: Streamed for large files

## 🛠️ Dependencies

### Backend
- MediatR (CQRS pattern)
- AutoMapper (optional)
- LINQ for data queries

### Frontend
- React 18+
- DevExtreme React 23.2.8+
- DevExtreme Analytics Core
- ExcelJS (exports)
- Axios (API calls)

## 🚧 Roadmap

- [x] DataGrid reports
- [x] PivotGrid reports
- [x] Report Gallery
- [x] Template management
- [x] Excel export
- [ ] PDF export (enhanced)
- [ ] Chart reports
- [ ] Dashboard reports
- [ ] Scheduled reports
- [ ] Email delivery
- [ ] Report sharing
- [ ] Advanced analytics

## 🤝 Contributing

When adding new reports:
1. Define in `ReportDefinitionService.cs`
2. Create React component
3. Add route
4. Update documentation
5. Test exports

## 📝 Version History

**v1.0.0** (2024-01-24)
- Initial release
- DataGrid and PivotGrid support
- Report Gallery
- Template management
- Export functionality

## 📧 Support

- Documentation: See `DEVEXTREME_REPORTING_GUIDE.md`
- Examples: Check `fms.frontend/src/pages/reports/`
- Issues: Contact development team

## 📄 License

Internal use only - Hyoung FMS Application

---

**Ready to create your first report?** Check out the [Quick Start Guide](./QUICK_START.md)!
