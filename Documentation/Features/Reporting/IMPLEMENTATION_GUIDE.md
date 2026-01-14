# DevExtreme Reporting 23.2 - Implementation Guide

## Quick Start

This guide provides step-by-step implementation for DevExtreme Report Viewer and Designer in FMS.

---

## 1. Backend Setup

### 1.1 Install NuGet Package

Add to `FMS.WebClient.csproj`:

```xml
<PackageReference Include="DevExpress.AspNetCore.Reporting" Version="23.2.8" />
```

### 1.2 Database Migration

Run this SQL script to create report storage tables:

```sql
-- Report storage table
CREATE TABLE IF NOT EXISTS reportitems (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL UNIQUE,
    DisplayName VARCHAR(255) NOT NULL,
    Category VARCHAR(100) DEFAULT 'General',
    Description TEXT,
    LayoutData LONGBLOB,
    IsActive TINYINT(1) NOT NULL DEFAULT 1,
    IsShared TINYINT(1) NOT NULL DEFAULT 1,
    CreatedBy VARCHAR(100),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedBy VARCHAR(100),
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reportitems_category (Category),
    INDEX idx_reportitems_name (Name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 1.3 Entity Configuration

Create `FMS.Domain/Entities/Reports/ReportItem.cs`:

```csharp
namespace FMS.Domain.Entities.Reports;

public class ReportItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Description { get; set; }
    public byte[]? LayoutData { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsShared { get; set; } = true;
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? UpdatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

### 1.4 Add to GpsdataContext

```csharp
public virtual DbSet<ReportItem> ReportItems { get; set; }
```

---

## 2. Controllers Implementation

### 2.1 WebDocumentViewerController

Create `FMS.WebClient/Controllers/Reporting/DxWebDocumentViewerController.cs`:

```csharp
using DevExpress.AspNetCore.Reporting.WebDocumentViewer;
using DevExpress.AspNetCore.Reporting.WebDocumentViewer.Native.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Reporting;

[Authorize]
[Route("api/v1/DXXRDV")]
public class DxWebDocumentViewerController : WebDocumentViewerController
{
    public DxWebDocumentViewerController(IWebDocumentViewerMvcControllerService controllerService)
        : base(controllerService) { }
}
```

### 2.2 ReportDesignerController

Create `FMS.WebClient/Controllers/Reporting/DxReportDesignerController.cs`:

```csharp
using DevExpress.AspNetCore.Reporting.ReportDesigner;
using DevExpress.AspNetCore.Reporting.ReportDesigner.Native.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Reporting;

[Authorize]
[Route("api/v1/DXXRD")]
public class DxReportDesignerController : ReportDesignerController
{
    public DxReportDesignerController(IReportDesignerMvcControllerService controllerService)
        : base(controllerService) { }
}
```

### 2.3 QueryBuilderController

Create `FMS.WebClient/Controllers/Reporting/DxQueryBuilderController.cs`:

```csharp
using DevExpress.AspNetCore.Reporting.QueryBuilder;
using DevExpress.AspNetCore.Reporting.QueryBuilder.Native.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Reporting;

[Authorize]
[Route("api/v1/DXXQB")]
public class DxQueryBuilderController : QueryBuilderController
{
    public DxQueryBuilderController(IQueryBuilderMvcControllerService controllerService)
        : base(controllerService) { }
}
```

### 2.4 Report Management Controller

Create `FMS.WebClient/Controllers/Reporting/ReportManagementController.cs`:

```csharp
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FMS.WebClient.Controllers.Reporting;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ReportManagementController : ControllerBase
{
    private readonly GpsdataContext _context;
    private readonly ILogger<ReportManagementController> _logger;

    public ReportManagementController(GpsdataContext context, ILogger<ReportManagementController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetReportList([FromQuery] string? category = null)
    {
        try
        {
            var query = _context.ReportItems.Where(r => r.IsActive);

            if (!string.IsNullOrEmpty(category))
                query = query.Where(r => r.Category == category);

            var reports = await query
                .Select(r => new {
                    r.Id,
                    r.Name,
                    r.DisplayName,
                    r.Category,
                    r.Description,
                    r.CreatedAt,
                    r.IsShared
                })
                .ToListAsync();

            return Ok(new { Success = true, Data = reports });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting report list");
            return StatusCode(500, new { Success = false, Message = "Error retrieving reports" });
        }
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.ReportItems
            .Where(r => r.IsActive && r.Category != null)
            .Select(r => r.Category)
            .Distinct()
            .ToListAsync();

        return Ok(new { Success = true, Data = categories });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReport(int id)
    {
        var report = await _context.ReportItems.FindAsync(id);
        if (report == null)
            return NotFound(new { Success = false, Message = "Report not found" });

        report.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok(new { Success = true, Message = "Report deleted" });
    }
}
```

---

## 3. Custom Report Storage

Update `FMS.WebClient/ReportViewer/CustomReportStorageWebExtension.cs`:

```csharp
using System.ServiceModel;
using DevExpress.XtraReports.UI;
using DevExpress.XtraReports.Web.Extensions;
using FMS.Domain.Entities.Reports;
using FMS.Persistence.DataAccess;

namespace FMS.WebClient.ReportViewer;

public class CustomReportStorageWebExtension : ReportStorageWebExtension
{
    private readonly IServiceProvider _serviceProvider;

    public CustomReportStorageWebExtension(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    private GpsdataContext CreateContext()
    {
        var scope = _serviceProvider.CreateScope();
        return scope.ServiceProvider.GetRequiredService<GpsdataContext>();
    }

    public override bool CanSetData(string url)
    {
        return true;
    }

    public override bool IsValidUrl(string url)
    {
        return !string.IsNullOrEmpty(url) && Path.GetFileName(url) == url;
    }

    public override byte[] GetData(string url)
    {
        using var context = CreateContext();
        var report = context.ReportItems.FirstOrDefault(r => r.Name == url && r.IsActive);

        if (report?.LayoutData != null)
        {
            return report.LayoutData;
        }

        // Check for predefined reports
        var predefinedReport = ReportsFactory.CreateReport(url);
        if (predefinedReport != null)
        {
            using var ms = new MemoryStream();
            predefinedReport.SaveLayoutToXml(ms);
            return ms.ToArray();
        }

        throw new FaultException(
            new FaultReason($"Could not find report '{url}'."),
            new FaultCode("Server"),
            "GetData");
    }

    public override Dictionary<string, string> GetUrls()
    {
        using var context = CreateContext();

        var dbReports = context.ReportItems
            .Where(r => r.IsActive)
            .ToDictionary(r => r.Name, r => r.DisplayName);

        // Add predefined reports
        foreach (var predefined in ReportsFactory.GetPredefinedReports())
        {
            if (!dbReports.ContainsKey(predefined.Key))
            {
                dbReports[predefined.Key] = predefined.Value;
            }
        }

        return dbReports;
    }

    public override void SetData(XtraReport report, string url)
    {
        using var context = CreateContext();
        var reportItem = context.ReportItems.FirstOrDefault(r => r.Name == url);

        if (reportItem == null)
        {
            reportItem = new ReportItem
            {
                Name = url,
                DisplayName = url,
                Category = "Custom"
            };
            context.ReportItems.Add(reportItem);
        }

        using var ms = new MemoryStream();
        report.SaveLayoutToXml(ms);
        reportItem.LayoutData = ms.ToArray();
        reportItem.UpdatedAt = DateTime.UtcNow;

        context.SaveChanges();
    }

    public override string SetNewData(XtraReport report, string defaultUrl)
    {
        using var context = CreateContext();

        var name = defaultUrl;
        var counter = 0;

        while (context.ReportItems.Any(r => r.Name == name))
        {
            counter++;
            name = $"{defaultUrl}_{counter}";
        }

        var reportItem = new ReportItem
        {
            Name = name,
            DisplayName = name,
            Category = "Custom",
            CreatedAt = DateTime.UtcNow
        };

        using var ms = new MemoryStream();
        report.SaveLayoutToXml(ms);
        reportItem.LayoutData = ms.ToArray();

        context.ReportItems.Add(reportItem);
        context.SaveChanges();

        return name;
    }
}
```

---

## 4. Reports Factory

Update `FMS.WebClient/ReportViewer/ReportsFactory.cs`:

```csharp
using DevExpress.XtraReports.UI;

namespace FMS.WebClient.ReportViewer;

public static class ReportsFactory
{
    private static readonly Dictionary<string, Func<XtraReport>> _reports = new()
    {
        { "VehicleConsumptionReport", () => new Reports.VehicleConsumptionReport() },
        { "FuelTransactionReport", () => new Reports.FuelTransactionReport() },
        { "TankInventoryReport", () => new Reports.TankInventoryReport() }
    };

    public static XtraReport? CreateReport(string reportName)
    {
        if (_reports.TryGetValue(reportName, out var factory))
        {
            return factory();
        }
        return null;
    }

    public static Dictionary<string, string> GetPredefinedReports()
    {
        return new Dictionary<string, string>
        {
            { "VehicleConsumptionReport", "Vehicle Consumption Report" },
            { "FuelTransactionReport", "Fuel Transaction Report" },
            { "TankInventoryReport", "Tank Inventory Report" }
        };
    }
}
```

---

## 5. Program.cs Configuration

Add to `Program.cs`:

```csharp
using DevExpress.AspNetCore;
using DevExpress.AspNetCore.Reporting;
using DevExpress.XtraReports.Web.Extensions;
using FMS.WebClient.ReportViewer;

// Add DevExpress services
builder.Services.AddDevExpressControls();
builder.Services.AddScoped<ReportStorageWebExtension, CustomReportStorageWebExtension>();

// Configure reporting
builder.Services.ConfigureReportingServices(configurator => {
    configurator.ConfigureWebDocumentViewer(viewerConfigurator => {
        viewerConfigurator.UseCachedReportSourceBuilder();
    });
    configurator.ConfigureReportDesigner(designerConfigurator => {
        // Enable SQL data source wizard
        designerConfigurator.RegisterDataSourceWizardConfigFileDataConnectionStringsProvider();
    });
});

// In the middleware section
app.UseDevExpressControls();
```

---

## 6. Frontend Implementation

### 6.1 Report Viewer Component

Create `fms.frontend/src/pages/reporting/components/ReportViewer.js`:

```jsx
import React, { useEffect, useRef } from 'react';
import 'devexpress-reporting/dx-webdocumentviewer';
import { DxReportViewer } from 'devexpress-reporting/dx-report-viewer';
import '../../../reportDesignerStyles.css';

const ReportViewer = ({ reportUrl, onClose }) => {
  const viewerRef = useRef(null);

  useEffect(() => {
    // Initialize viewer
    return () => {
      // Cleanup
    };
  }, [reportUrl]);

  return (
    <div className="tw-flex tw-flex-col tw-h-full">
      <div className="tw-flex tw-justify-between tw-items-center tw-p-3 tw-bg-gray-100 tw-border-b">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
          <i className="fa-light fa-file-chart-column tw-mr-2"></i>
          Report Viewer
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="tw-px-3 tw-py-1 tw-bg-gray-200 hover:tw-bg-gray-300 tw-rounded"
          >
            <i className="fa-light fa-times"></i>
          </button>
        )}
      </div>
      <div className="tw-flex-1 report-viewer-container" ref={viewerRef}>
        <DxReportViewer
          reportUrl={reportUrl}
          requestOptions={{
            host: '/api/v1/DXXRDV',
            invokeAction: 'DXXRDV'
          }}
        />
      </div>
    </div>
  );
};

export default ReportViewer;
```

### 6.2 Report Designer Component

Create `fms.frontend/src/pages/reporting/components/ReportDesigner.js`:

```jsx
import React, { useEffect, useRef } from 'react';
import 'devexpress-reporting/dx-reportdesigner';
import { DxReportDesigner } from 'devexpress-reporting/dx-report-designer';
import '../../../reportDesignerStyles.css';

const ReportDesigner = ({ reportUrl, onSave, onClose }) => {
  const designerRef = useRef(null);

  const handleBeforeSave = (args) => {
    // Custom save logic
    if (onSave) {
      onSave(args.reportName);
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-h-full">
      <div className="tw-flex tw-justify-between tw-items-center tw-p-3 tw-bg-gray-100 tw-border-b">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
          <i className="fa-light fa-pencil-ruler tw-mr-2"></i>
          Report Designer
        </h3>
        <div className="tw-flex tw-gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="tw-px-3 tw-py-1 tw-bg-gray-200 hover:tw-bg-gray-300 tw-rounded"
            >
              <i className="fa-light fa-times"></i> Close
            </button>
          )}
        </div>
      </div>
      <div className="tw-flex-1 report-designer-container" ref={designerRef}>
        <DxReportDesigner
          reportUrl={reportUrl}
          requestOptions={{
            host: '/api/v1/DXXRD',
            getDesignerModelAction: 'GetDesignerModel'
          }}
          callbacks={{
            BeforeSave: handleBeforeSave
          }}
        />
      </div>
    </div>
  );
};

export default ReportDesigner;
```

### 6.3 Report List Component

Create `fms.frontend/src/pages/reporting/components/ReportList.js`:

```jsx
import React, { useEffect, useState } from 'react';
import { DataGrid, Column, Paging, FilterRow, SearchPanel } from 'devextreme-react/data-grid';
import axiosInstance from '../../../api/axiosInstance';

const ReportList = ({ onSelectReport, onDesignReport }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    loadReports();
    loadCategories();
  }, [selectedCategory]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = selectedCategory ? { category: selectedCategory } : {};
      const response = await axiosInstance.get('/ReportManagement/list', { params });
      if (response.data.Success) {
        setReports(response.data.Data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axiosInstance.get('/ReportManagement/categories');
      if (response.data.Success) {
        setCategories(response.data.Data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const renderActions = (data) => {
    return (
      <div className="tw-flex tw-gap-2">
        <button
          onClick={() => onSelectReport(data.data.Name)}
          className="tw-px-2 tw-py-1 tw-bg-blue-500 tw-text-white tw-rounded tw-text-sm"
          title="View Report"
        >
          <i className="fa-light fa-eye"></i>
        </button>
        <button
          onClick={() => onDesignReport(data.data.Name)}
          className="tw-px-2 tw-py-1 tw-bg-green-500 tw-text-white tw-rounded tw-text-sm"
          title="Edit Report"
        >
          <i className="fa-light fa-edit"></i>
        </button>
      </div>
    );
  };

  return (
    <div className="tw-p-4">
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <h2 className="tw-text-xl tw-font-semibold">
          <i className="fa-light fa-file-chart-column tw-mr-2"></i>
          Reports
        </h2>
        <button
          onClick={() => onDesignReport(null)}
          className="tw-px-4 tw-py-2 tw-bg-blue-500 tw-text-white tw-rounded hover:tw-bg-blue-600"
        >
          <i className="fa-light fa-plus tw-mr-2"></i>
          New Report
        </button>
      </div>

      {/* Category Filter */}
      <div className="tw-mb-4">
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="tw-px-3 tw-py-2 tw-border tw-rounded"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <DataGrid
        dataSource={reports}
        showBorders={true}
        columnAutoWidth={true}
        rowAlternationEnabled={true}
      >
        <FilterRow visible={true} />
        <SearchPanel visible={true} />
        <Paging defaultPageSize={10} />

        <Column dataField="DisplayName" caption="Report Name" />
        <Column dataField="Category" caption="Category" width={150} />
        <Column dataField="Description" caption="Description" />
        <Column dataField="CreatedAt" caption="Created" dataType="datetime" width={150} />
        <Column
          caption="Actions"
          width={120}
          cellRender={renderActions}
          allowFiltering={false}
        />
      </DataGrid>
    </div>
  );
};

export default ReportList;
```

### 6.4 Main Reporting Page

Create `fms.frontend/src/pages/reporting/ReportingMain.js`:

```jsx
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReportList from './components/ReportList';
import ReportViewer from './components/ReportViewer';
import ReportDesigner from './components/ReportDesigner';

const ReportingMain = () => {
  const [view, setView] = useState('list'); // list, viewer, designer
  const [selectedReport, setSelectedReport] = useState(null);

  const handleSelectReport = (reportName) => {
    setSelectedReport(reportName);
    setView('viewer');
  };

  const handleDesignReport = (reportName) => {
    setSelectedReport(reportName || 'NewReport');
    setView('designer');
  };

  const handleClose = () => {
    setView('list');
    setSelectedReport(null);
  };

  return (
    <div className="tw-h-full tw-flex tw-flex-col">
      {view === 'list' && (
        <ReportList
          onSelectReport={handleSelectReport}
          onDesignReport={handleDesignReport}
        />
      )}

      {view === 'viewer' && selectedReport && (
        <ReportViewer
          reportUrl={selectedReport}
          onClose={handleClose}
        />
      )}

      {view === 'designer' && (
        <ReportDesigner
          reportUrl={selectedReport}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default ReportingMain;
```

---

## 7. Navigation Setup

### 7.1 Add Navigation Items (SQL)

```sql
INSERT INTO navigationitems (ParentId, Title, Icon, Path, SortOrder, IsActive, CreatedAt)
VALUES (
    NULL, -- or parent ID for nested menu
    'Reports',
    'fa-light fa-file-chart-column',
    '/reports',
    100,
    1,
    NOW()
);

-- Get the ID of the inserted item
SET @reportsMenuId = LAST_INSERT_ID();

-- Add sub-items
INSERT INTO navigationitems (ParentId, Title, Icon, Path, SortOrder, IsActive, CreatedAt)
VALUES
    (@reportsMenuId, 'View Reports', 'fa-light fa-eye', '/reports/view', 1, 1, NOW()),
    (@reportsMenuId, 'Design Reports', 'fa-light fa-pencil-ruler', '/reports/design', 2, 1, NOW());
```

### 7.2 Add Routes (Content.js)

```jsx
{/* Reporting Routes */}
<Route
  path="/reports"
  element={React.createElement(resolvedComponents("reports"))}
/>
<Route
  path="/reports/*"
  element={React.createElement(resolvedComponents("reports"))}
/>
```

### 7.3 Add to app-routes.js

```javascript
import ReportingMain from './pages/reporting/ReportingMain';

// In the switch/case or mapping
case "reports":
    return ReportingMain;
```

---

## 8. Permissions

Add permissions for reporting:

```sql
-- Add permissions
INSERT INTO permissions (Name, Description, Category, CreatedAt) VALUES
('_Read_Reports', 'View reports', 'Reporting', NOW()),
('_Create_Reports', 'Create new reports', 'Reporting', NOW()),
('_Edit_Reports', 'Edit existing reports', 'Reporting', NOW()),
('_Delete_Reports', 'Delete reports', 'Reporting', NOW()),
('_Export_Reports', 'Export reports to files', 'Reporting', NOW());
```

---

## 9. Testing Checklist

- [ ] Report Viewer loads without errors
- [ ] Can view existing reports
- [ ] Export to PDF works
- [ ] Export to Excel works
- [ ] Report Designer loads
- [ ] Can create new report
- [ ] Can save report to database
- [ ] Can edit existing report
- [ ] Data sources are available in designer
- [ ] Navigation menu works
- [ ] Permissions are enforced

---

## 10. Troubleshooting

### Common Issues

1. **"DevExpress license not found"**
   - Add license key to appsettings.json
   - Register license in Program.cs

2. **"Report not loading"**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Check authentication token

3. **"Cannot save report"**
   - Verify database connection
   - Check ReportItems table exists
   - Verify user has write permissions

4. **"Data sources not showing"**
   - Configure connection strings in appsettings.json
   - Enable data source wizard in configurator
