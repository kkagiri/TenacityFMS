# PRD: DevExtreme Report Viewer & Designer Integration

## Document Information

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Date** | 2026-01-12 |
| **Status** | Draft |
| **Project** | FMS (Fleet Management System) |

---

## 1. Executive Summary

This PRD outlines the implementation of report viewing and designing capabilities for the FMS system. The document covers the primary option (DevExtreme Reporting 23.2) and alternative solutions that do not rely on scheduled jobs.

### Current State
- **Frontend**: DevExtreme 23.2.8 with `devexpress-reporting` package installed
- **Backend**: DevExpress.AspNetCore.Reporting package commented out (not functional)
- **Existing Services**: Basic report generation via custom `ReportingController`

### Target State
- Fully functional Report Viewer for viewing and exporting reports
- Report Designer for creating and modifying report templates
- Database storage for report definitions
- Real-time report generation (no schedulers)

---

## 2. Options Comparison

### Option A: DevExtreme Reporting 23.2 (Recommended)

| Aspect | Details |
|--------|---------|
| **License** | Commercial (DevExpress Universal) |
| **Frontend Package** | Already installed: `devexpress-reporting@23.2.8` |
| **Backend Package** | `DevExpress.AspNetCore.Reporting` 23.2.x |
| **Viewer** | Web Document Viewer |
| **Designer** | End-User Report Designer |
| **Export Formats** | PDF, XLSX, DOCX, HTML, Image, CSV |
| **Data Sources** | SQL, JSON, Object, Custom |
| **Scheduler Required** | ❌ No |

**Pros:**
- Already partially integrated (frontend packages installed)
- Native DevExtreme look and feel
- Rich design capabilities
- Excellent documentation
- Version compatibility with existing DevExtreme 23.2

**Cons:**
- Requires DevExpress Universal license
- Backend NuGet package needs license key configuration

---

### Option B: Stimulsoft Reports.Web

| Aspect | Details |
|--------|---------|
| **License** | Commercial (perpetual or subscription) |
| **Frontend** | JavaScript viewer/designer |
| **Backend** | Stimulsoft.Reports.Web.NetCore |
| **Viewer** | HTML5 Viewer |
| **Designer** | Web Designer |
| **Export Formats** | PDF, Excel, Word, HTML, Image, Data formats |
| **Scheduler Required** | ❌ No |

**Pros:**
- One-time perpetual license option
- Independent from DevExtreme
- Cross-platform
- Rich charting

**Cons:**
- Additional learning curve
- Different UI style from DevExtreme
- Extra vendor to manage

---

### Option C: FastReport.Core

| Aspect | Details |
|--------|---------|
| **License** | Commercial + Free Community Edition |
| **Frontend** | React/JavaScript components |
| **Backend** | FastReport.Core.Web |
| **Viewer** | Online Designer/Viewer |
| **Designer** | Web-based Designer |
| **Export Formats** | PDF, Excel, Word, HTML, Image |
| **Scheduler Required** | ❌ No |

**Pros:**
- Community edition available (limited features)
- Lower cost than DevExpress
- Good performance

**Cons:**
- Less polished UI
- Fewer advanced features
- Smaller community

---

### Option D: JsReport

| Aspect | Details |
|--------|---------|
| **License** | Open Source (MIT) + Commercial |
| **Frontend** | React components |
| **Backend** | Node.js or .NET integration |
| **Viewer** | HTML5 Viewer |
| **Designer** | Browser-based |
| **Export Formats** | PDF, Excel, HTML, DOCX |
| **Scheduler Required** | ❌ No |

**Pros:**
- Open source core
- Flexible templating (HTML/Handlebars)
- Modern architecture

**Cons:**
- Requires Node.js (or .NET wrapper)
- Different paradigm (template-based)
- Additional infrastructure

---

### Option E: RDLC Reports (Microsoft)

| Aspect | Details |
|--------|---------|
| **License** | Free (Microsoft) |
| **Frontend** | Custom viewer needed |
| **Backend** | Microsoft.ReportingServices.ReportViewerControl |
| **Viewer** | Limited web options |
| **Designer** | Visual Studio only |
| **Export Formats** | PDF, Excel, Word |
| **Scheduler Required** | ❌ No |

**Pros:**
- Free
- Part of .NET ecosystem
- Works with existing SQL Server

**Cons:**
- No web designer
- Limited web viewer
- Dated technology

---

## 3. Recommendation

**Primary Recommendation: Option A (DevExtreme Reporting 23.2)**

Reasons:
1. Frontend packages already installed and compatible
2. Consistent UI/UX with existing DevExtreme components
3. Native React integration
4. Single vendor for all UI components
5. Strong documentation and support

**Alternative Recommendation: Option B (Stimulsoft)**

Use if:
- DevExpress license not available
- Need perpetual licensing
- Want vendor diversification

---

## 4. DevExtreme Reporting 23.2 Implementation

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FMS Frontend                             │
│  ┌────────────────────┐    ┌────────────────────────────────┐   │
│  │  Report Viewer     │    │      Report Designer           │   │
│  │  (dx-report-viewer)│    │  (dx-report-designer)          │   │
│  └─────────┬──────────┘    └──────────────┬─────────────────┘   │
│            │                              │                      │
│            └──────────────┬───────────────┘                      │
│                           │                                      │
│                           ▼                                      │
│              ┌────────────────────────┐                         │
│              │    axiosInstance       │                         │
│              │  /api/v1/dxreporting   │                         │
│              └────────────┬───────────┘                         │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                       FMS Backend (.NET 8)                        │
│                                                                   │
│  ┌──────────────────────┐  ┌────────────────────────────────┐    │
│  │ WebDocumentViewer    │  │    ReportDesigner              │    │
│  │ Controller           │  │    Controller                  │    │
│  └──────────┬───────────┘  └───────────────┬────────────────┘    │
│             │                              │                      │
│             └──────────────┬───────────────┘                      │
│                            │                                      │
│             ┌──────────────▼───────────────┐                      │
│             │   CustomReportStorage        │                      │
│             │   WebExtension               │                      │
│             └──────────────┬───────────────┘                      │
│                            │                                      │
│             ┌──────────────▼───────────────┐                      │
│             │     Report Definitions       │                      │
│             │     (MySQL Database)         │                      │
│             └──────────────────────────────┘                      │
└───────────────────────────────────────────────────────────────────┘
```

### 4.2 Database Schema

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

-- Report parameters storage
CREATE TABLE IF NOT EXISTS reportparameters (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ReportItemId INT NOT NULL,
    ParameterName VARCHAR(100) NOT NULL,
    ParameterType VARCHAR(50) NOT NULL,
    DefaultValue TEXT,
    IsRequired TINYINT(1) NOT NULL DEFAULT 0,
    DisplayOrder INT DEFAULT 0,
    FOREIGN KEY (ReportItemId) REFERENCES reportitems(Id) ON DELETE CASCADE,
    INDEX idx_reportparameters_report (ReportItemId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Report execution history (optional)
CREATE TABLE IF NOT EXISTS reportexecutionlog (
    Id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ReportItemId INT,
    ExecutedBy VARCHAR(100),
    ExecutedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ExportFormat VARCHAR(20),
    ExecutionTimeMs INT,
    Parameters JSON,
    Status VARCHAR(20) DEFAULT 'Success',
    ErrorMessage TEXT,
    INDEX idx_reportlog_report (ReportItemId),
    INDEX idx_reportlog_date (ExecutedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4.3 Backend Implementation

#### 4.3.1 NuGet Package (add to FMS.WebClient.csproj)

```xml
<PackageReference Include="DevExpress.AspNetCore.Reporting" Version="23.2.8" />
```

#### 4.3.2 Configuration (Program.cs)

```csharp
// Add DevExpress Reporting services
services.AddDevExpressControls();
services.AddScoped<ReportStorageWebExtension, CustomReportStorageWebExtension>();
services.ConfigureReportingServices(configurator => {
    configurator.ConfigureWebDocumentViewer(viewerConfigurator => {
        viewerConfigurator.UseCachedReportSourceBuilder();
    });
    configurator.ConfigureReportDesigner(designerConfigurator => {
        designerConfigurator.RegisterDataSourceWizardConfigFileDataConnectionStringsProvider();
    });
});
```

#### 4.3.3 Controllers Required

1. **WebDocumentViewerController** - Handles report viewing
2. **ReportDesignerController** - Handles report designing
3. **QueryBuilderController** - Handles data source queries

### 4.4 Frontend Implementation

#### 4.4.1 Components Required

1. **ReportViewer Component**
```jsx
import { DxReportViewer } from 'devexpress-reporting/dx-report-viewer';

const ReportViewer = ({ reportUrl }) => {
  return (
    <DxReportViewer
      reportUrl={reportUrl}
      serviceUrl="/api/v1/DXXRDV"
      width="100%"
      height="100%"
    />
  );
};
```

2. **ReportDesigner Component**
```jsx
import { DxReportDesigner } from 'devexpress-reporting/dx-report-designer';

const ReportDesigner = ({ reportUrl }) => {
  return (
    <DxReportDesigner
      reportUrl={reportUrl}
      serviceUrl="/api/v1/DXXRD"
      width="100%"
      height="100%"
    />
  );
};
```

---

## 5. User Stories

### US-001: View Reports
**As a** user with report access
**I want to** view pre-built reports with filters
**So that** I can analyze fleet data

**Acceptance Criteria:**
- Can select from list of available reports
- Can apply date range and entity filters
- Can zoom in/out of report
- Can navigate multi-page reports
- Can search within report content

### US-002: Export Reports
**As a** user viewing a report
**I want to** export to various formats
**So that** I can share or archive the data

**Acceptance Criteria:**
- Export to PDF with formatting preserved
- Export to Excel with data in cells
- Export to Word document
- Export to HTML
- Export to Image (PNG/JPEG)

### US-003: Design Reports (Admin)
**As an** administrator
**I want to** create custom report templates
**So that** users can generate specific reports

**Acceptance Criteria:**
- Drag-and-drop field placement
- Add calculated fields
- Configure data sources
- Add charts and visualizations
- Save report templates
- Set report permissions

### US-004: Schedule-Free Generation
**As a** user
**I want to** generate reports on-demand
**So that** I don't wait for scheduled jobs

**Acceptance Criteria:**
- Real-time report generation
- Progress indicator for large reports
- Timeout handling for very large datasets
- Caching for repeated requests

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Report generation < 10 seconds for standard reports
- Large reports (10,000+ rows) < 30 seconds
- Viewer loads < 2 seconds

### 6.2 Security
- JWT authentication for all report endpoints
- Role-based access to reports
- Audit logging of report access

### 6.3 Scalability
- Support concurrent report generation
- Cache report templates in memory
- Optimize database queries with indexes

---

## 7. Implementation Phases

### Phase 1: Core Viewer (Week 1-2)
- [ ] Install and configure DevExpress backend
- [ ] Create WebDocumentViewer controller
- [ ] Create Report Viewer React component
- [ ] Implement report storage
- [ ] Add basic authentication

### Phase 2: Designer (Week 3-4)
- [ ] Create ReportDesigner controller
- [ ] Create Report Designer React component
- [ ] Configure data sources
- [ ] Implement save/load functionality
- [ ] Add query builder

### Phase 3: Integration (Week 5)
- [ ] Create navigation items
- [ ] Add permission controls
- [ ] Create sample reports
- [ ] Integrate with existing data

### Phase 4: Polish (Week 6)
- [ ] Performance optimization
- [ ] Error handling
- [ ] User documentation
- [ ] Testing and bug fixes

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Report Generation Time | < 10 seconds (95th percentile) |
| User Adoption | 80% of target users within 1 month |
| Report Creation | 10+ custom reports within 2 months |
| Export Success Rate | > 99% |
| User Satisfaction | > 4.0/5.0 |

---

## 9. Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| License issues | High | Low | Verify license before starting |
| Performance issues | Medium | Medium | Implement caching, optimize queries |
| Complex data sources | Medium | Medium | Start with simple reports, iterate |
| User adoption | Medium | Low | Training and documentation |

---

## 10. Dependencies

### External Dependencies
- DevExpress Universal License (for DevExpress option)
- MySQL database access
- Existing FMS authentication system

### Internal Dependencies
- FMS.Application layer for data access
- FMS.Persistence for database context
- Frontend build system (Craco)

---

## Appendix A: License Key Configuration

For DevExpress, add to `appsettings.json`:
```json
{
  "DevExpress": {
    "ReportingSettings": {
      "LicenseKey": "YOUR_LICENSE_KEY_HERE"
    }
  }
}
```

## Appendix B: Useful Links

- [DevExtreme Reporting Docs](https://docs.devexpress.com/XtraReports/400042/web-reporting)
- [ASP.NET Core Integration](https://docs.devexpress.com/XtraReports/400208/web-reporting/asp-net-core-reporting)
- [React Integration](https://docs.devexpress.com/XtraReports/119338/web-reporting/javascript-reporting/react)
- [Stimulsoft Docs](https://www.stimulsoft.com/en/documentation)
- [FastReport Docs](https://www.fast-report.com/en/documentation/)
