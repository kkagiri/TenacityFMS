# Alternative Report Viewers & Designers (No Scheduler Required)

This document provides detailed alternatives to DevExtreme Reporting for the FMS system.

---

## Quick Comparison Matrix

| Feature | DevExtreme | Stimulsoft | FastReport | JsReport | Telerik | BIRT |
|---------|------------|------------|------------|----------|---------|------|
| **License** | Commercial | Commercial | Commercial + Free | Open Source | Commercial | Open Source |
| **Price Range** | $$$ | $$ | $ - $$ | Free - $$ | $$$ | Free |
| **React Support** | ✅ Native | ✅ | ✅ | ✅ | ✅ Native | ❌ |
| **Web Designer** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Web Viewer** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **.NET Core** | ✅ | ✅ | ✅ | Via Node | ✅ | Java |
| **No Scheduler** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **PDF Export** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Excel Export** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Charting** | ✅ Rich | ✅ Rich | ✅ | ✅ | ✅ Rich | ✅ |
| **Subreports** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Parameters** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **MySQL Support** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Option 1: Stimulsoft Reports.Web

### Overview
Stimulsoft is a mature reporting solution with excellent web-based viewer and designer components.

### Pricing
- **Reports.Web** (Viewer + Designer): ~$599 perpetual / $299 annual
- **Ultimate** (All platforms): ~$1,699 perpetual

### Architecture
```
┌─────────────────────────────────────────┐
│         React Frontend                   │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ StiViewer   │  │ StiDesigner     │   │
│  └──────┬──────┘  └────────┬────────┘   │
└─────────┼──────────────────┼────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────┐
│      Stimulsoft.Report.Web.NetCore      │
│  ┌─────────────────────────────────┐    │
│  │     StimulsoftController        │    │
│  │     - Viewer endpoints          │    │
│  │     - Designer endpoints        │    │
│  │     - Export endpoints          │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Backend Setup (ASP.NET Core)

```csharp
// NuGet Package
// Install-Package Stimulsoft.Reports.Web.NetCore

// Program.cs
builder.Services.AddStiController();

// Controller
[ApiController]
[Route("api/stimulsoft")]
public class StimulsoftController : StiController
{
    [HttpPost("viewer")]
    public IActionResult ViewerEvent()
    {
        return StiNetCoreViewer.ViewerEventResult(this);
    }

    [HttpPost("designer")]
    public IActionResult DesignerEvent()
    {
        return StiNetCoreDesigner.DesignerEventResult(this);
    }
}
```

### Frontend Setup (React)

```jsx
// Install via npm
// npm install stimulsoft-reports-js

import { StiViewer, StiDesigner, StiOptions, Stimulsoft } from 'stimulsoft-reports-js/Scripts/stimulsoft.viewer.js';

const StimulsoftViewer = ({ reportUrl }) => {
  useEffect(() => {
    const options = new StiOptions();
    options.appearance.scrollbarsMode = true;

    const viewer = new StiViewer(options, 'StiViewer', false);
    const report = new Stimulsoft.Report.StiReport();
    report.loadFile(reportUrl);
    viewer.report = report;
    viewer.renderHtml('viewerContainer');
  }, [reportUrl]);

  return <div id="viewerContainer" style={{ height: '100%' }} />;
};
```

### Pros & Cons

**Pros:**
- One-time perpetual license available
- Very rich designer
- Good documentation
- Independent from other UI frameworks
- Excellent chart support

**Cons:**
- Different UI style (may not match DevExtreme)
- Additional learning curve
- Separate vendor relationship

---

## Option 2: FastReport.Core

### Overview
FastReport offers a cost-effective solution with a free Community edition for basic needs.

### Pricing
- **Community Edition**: Free (limited features)
- **Professional**: ~$399
- **Enterprise**: ~$599

### Backend Setup

```csharp
// NuGet Packages
// Install-Package FastReport.Core
// Install-Package FastReport.Web

// Program.cs
builder.Services.AddFastReport();

// Controller
[Route("api/fastreport")]
public class FastReportController : Controller
{
    [HttpGet("view/{reportName}")]
    public IActionResult ViewReport(string reportName)
    {
        var webReport = new WebReport();
        var report = new Report();
        report.Load($"Reports/{reportName}.frx");

        // Bind data
        report.RegisterData(dataSource, "Data");
        webReport.Report = report;

        return View(webReport);
    }

    [HttpGet("export/{reportName}/{format}")]
    public IActionResult ExportReport(string reportName, string format)
    {
        var report = new Report();
        report.Load($"Reports/{reportName}.frx");
        report.Prepare();

        using var stream = new MemoryStream();
        switch (format.ToLower())
        {
            case "pdf":
                report.Export(new PDFExport(), stream);
                return File(stream.ToArray(), "application/pdf");
            case "xlsx":
                report.Export(new Excel2007Export(), stream);
                return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        }
        return BadRequest();
    }
}
```

### Frontend (React)

```jsx
// Using iframe approach
const FastReportViewer = ({ reportUrl }) => {
  return (
    <iframe
      src={`/api/fastreport/view/${reportUrl}`}
      style={{ width: '100%', height: '100%', border: 'none' }}
      title="FastReport Viewer"
    />
  );
};
```

### Pros & Cons

**Pros:**
- Free community edition
- Lower cost than DevExpress
- Good performance
- Simple API

**Cons:**
- Less polished web designer
- Community edition is limited
- Smaller ecosystem

---

## Option 3: JsReport

### Overview
JsReport is a modern, JavaScript-based reporting platform that uses HTML templates.

### Pricing
- **Open Source**: Free (MIT license)
- **JsReport Online**: From $29/month
- **Enterprise**: From $199/month

### Architecture

```
┌─────────────────────────────────────────┐
│         React Frontend                   │
│  ┌─────────────────────────────────┐    │
│  │     JsReport React Components    │    │
│  └──────────────┬──────────────────┘    │
└─────────────────┼───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         .NET API Proxy                   │
│  ┌─────────────────────────────────┐    │
│  │     JsReportController          │    │
│  │     - Render requests           │    │
│  │     - Template management       │    │
│  └──────────────┬──────────────────┘    │
└─────────────────┼───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         JsReport Server (Node.js)        │
│  ┌─────────────────────────────────┐    │
│  │     Rendering Engine            │    │
│  │     - HTML to PDF               │    │
│  │     - Excel generation          │    │
│  │     - Template storage          │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Backend Setup (.NET proxy to Node)

```csharp
// NuGet Package
// Install-Package jsreport.Client

public class JsReportService
{
    private readonly IJsReportClient _client;

    public JsReportService(IConfiguration config)
    {
        _client = new JsReportClient(config["JsReport:Url"]);
    }

    public async Task<byte[]> RenderReportAsync(string templateName, object data)
    {
        var report = await _client.RenderAsync(new RenderRequest
        {
            Template = new Template
            {
                Name = templateName
            },
            Data = data
        });

        return await report.Content.ReadAsByteArrayAsync();
    }
}

// Controller
[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly JsReportService _jsReport;

    [HttpPost("render/{templateName}")]
    public async Task<IActionResult> RenderReport(string templateName, [FromBody] object data)
    {
        var pdf = await _jsReport.RenderReportAsync(templateName, data);
        return File(pdf, "application/pdf");
    }
}
```

### Pros & Cons

**Pros:**
- Open source core
- Modern HTML/CSS templates
- Flexible and customizable
- Good for developers who know HTML

**Cons:**
- Requires Node.js infrastructure
- Different paradigm (templates vs. banded reports)
- Less visual for end-users

---

## Option 4: Telerik Reporting

### Overview
Telerik Reporting is a commercial solution from Progress Software, with excellent .NET integration.

### Pricing
- **Telerik Reporting**: ~$999/developer
- **DevCraft UI Bundle**: ~$1,499 (includes UI components)

### Backend Setup

```csharp
// NuGet Packages
// Install-Package Telerik.Reporting.Services.AspNetCore

// Program.cs
builder.Services.AddTelerikReporting();

// Controller
[Route("api/telerik")]
public class TelerikReportController : ReportsControllerBase
{
    public TelerikReportController(IReportServiceConfiguration configuration)
        : base(configuration) { }
}
```

### Frontend (React)

```jsx
// npm install @progress/telerik-react-report-viewer

import { TelerikReportViewer } from '@progress/telerik-react-report-viewer';

const ReportViewer = ({ reportSource }) => {
  return (
    <TelerikReportViewer
      serviceUrl="/api/telerik"
      reportSource={reportSource}
      viewerContainerStyle={{ height: '100%' }}
    />
  );
};
```

### Pros & Cons

**Pros:**
- Excellent .NET integration
- Good React components
- Strong charting
- Good designer

**Cons:**
- High cost
- Another vendor to manage
- Learning curve for designer

---

## Option 5: BIRT (Open Source)

### Overview
BIRT (Business Intelligence and Reporting Tools) is an open-source reporting system from Eclipse.

### Pricing
- **Free** (Eclipse Public License)

### Architecture
BIRT requires Java runtime, so you would need:
1. A separate BIRT server (Java)
2. API proxy from .NET to BIRT

### Pros & Cons

**Pros:**
- Completely free
- Mature and feature-rich
- Enterprise proven

**Cons:**
- Requires Java infrastructure
- Dated UI
- Complex setup
- Not ideal for .NET-only shops

---

## Recommendation Summary

### For FMS Project: **DevExtreme Reporting** (Primary)

**Reason:** You already have the frontend packages installed and use DevExtreme throughout the application. Adding the backend package completes the solution with minimal additional complexity.

### If License Not Available: **Stimulsoft Reports.Web**

**Reason:** Best balance of features, price (perpetual option), and web-based designer quality.

### For Budget Constraint: **FastReport Community**

**Reason:** Free option with upgrade path if needed.

---

## Migration Considerations

### From DevExtreme to Alternatives

If you need to switch from DevExtreme to an alternative:

1. **Report Definitions**: Most tools use XML-based formats that can be converted
2. **Data Sources**: All tools support MySQL/SQL connections
3. **UI Integration**: Will require updating components
4. **Training**: End-users will need training on new designer

### Coexistence Strategy

You can also run multiple reporting solutions:

```javascript
// Route different report types to different engines
const getReportEngine = (reportType) => {
  switch (reportType) {
    case 'operational':
      return 'devextreme';
    case 'financial':
      return 'stimulsoft';
    default:
      return 'devextreme';
  }
};
```

---

## Next Steps

1. **Evaluate License Availability**
   - Check if DevExpress Universal license is available
   - If not, request pricing from Stimulsoft

2. **Proof of Concept**
   - Start with DevExtreme backend installation
   - If blocked, try Stimulsoft evaluation

3. **Implementation**
   - Follow the Implementation Guide for chosen solution
   - Create sample reports for testing
