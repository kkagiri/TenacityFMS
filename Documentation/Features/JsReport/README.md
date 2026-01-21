# JsReport Implementation Guide

## Overview

JsReport is the modern reporting engine integrated into the FMS system, replacing DevExpress for new report development. It provides a flexible, template-based approach to generating reports in PDF, Excel, and HTML formats using Handlebars templating.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend (React)                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ JsReportDesigner │  │  JsReportViewer  │  │ JsReportTemplateManager│  │
│  │ (Monaco Editor)  │  │ (Filter + View)  │  │   (CRUD Operations)   │  │
│  └────────┬─────────┘  └────────┬─────────┘  └───────────┬──────────┘   │
│           │                     │                        │              │
│           └─────────────────────┼────────────────────────┘              │
│                                 │                                       │
│                    ┌────────────▼────────────┐                          │
│                    │   reportingService.js   │                          │
│                    └────────────┬────────────┘                          │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │ HTTP API
┌─────────────────────────────────┼───────────────────────────────────────┐
│                           Backend (.NET)                                 │
├─────────────────────────────────┼───────────────────────────────────────┤
│                    ┌────────────▼────────────┐                          │
│                    │ ReportGeneratorController│                          │
│                    └────────────┬────────────┘                          │
│                                 │                                       │
│                    ┌────────────▼────────────┐                          │
│                    │    JsReportService      │                          │
│                    │  (Embedded JsReport)    │                          │
│                    └────────────┬────────────┘                          │
│                                 │                                       │
│              ┌──────────────────┼──────────────────┐                    │
│              │                  │                  │                    │
│    ┌─────────▼─────┐  ┌─────────▼─────┐  ┌────────▼────────┐           │
│    │  chrome-pdf   │  │ html-to-xlsx  │  │ HTML Templates  │           │
│    │  (PDF Render) │  │ (Excel Render)│  │ (App_Data)      │           │
│    └───────────────┘  └───────────────┘  └─────────────────┘           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Report Engine | jsreport.Local | 3.8.2 |
| PDF Renderer | jsreport.Binary (chrome-pdf) | 4.4.0 |
| Excel Renderer | html-to-xlsx | Built-in |
| Template Engine | Handlebars | Built-in |
| Code Editor | Monaco Editor (@monaco-editor/react) | Latest |
| Frontend Framework | React 18 | 18.2.0 |

## Backend Implementation

### Package Dependencies

Located in `FMS.WebClient/FMS.WebClient.csproj`:

```xml
<PackageReference Include="jsreport.Local" Version="3.8.2" />
<PackageReference Include="jsreport.Binary" Version="4.4.0" />
<PackageReference Include="jsreport.Types" Version="3.9.4" />
```

### Service Interface

**File:** `FMS.WebClient/Services/Reporting/IJsReportService.cs`

```csharp
public interface IJsReportService
{
    Task<byte[]> RenderPdfAsync(string templateName, object data);
    Task<byte[]> RenderExcelAsync(string templateName, object data);
    Task<string> RenderHtmlAsync(string templateName, object data);
    Task<byte[]> RenderInlinePdfAsync(string templateContent, object data);
    Task<List<string>> GetTemplateListAsync();
    Task<string> GetTemplateAsync(string templateName);
    Task SaveTemplateAsync(string templateName, string content);
    Task DeleteTemplateAsync(string templateName);
}
```

### Service Implementation

**File:** `FMS.WebClient/Services/Reporting/JsReportService.cs`

Key features:
- **Singleton Pattern**: JsReport engine is initialized once and reused
- **Embedded Binary**: Uses jsreport.Binary for self-contained deployment
- **Template Storage**: HTML templates stored in `App_Data/ReportTemplates/`
- **Multiple Renderers**: Supports PDF (chrome-pdf), Excel (html-to-xlsx), and HTML

### Controller API

**File:** `FMS.WebClient/Controllers/Reporting/ReportGeneratorController.cs`

**Base URL:** `/api/v1/reportgenerator`

## API Endpoints

### Template Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/templates` | List all template names |
| GET | `/templates/{name}` | Get template content |
| POST | `/templates/{name}` | Save/update template |
| DELETE | `/templates/{name}` | Delete template |

### Report Rendering

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/render/pdf/{name}` | Render template to PDF |
| POST | `/render/excel/{name}` | Render template to Excel |
| POST | `/preview/{name}` | Render template to HTML |
| POST | `/render/inline` | Render inline template to PDF |

### Specialized Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pump-transactions` | Generate pump transaction report |

## Frontend Implementation

### Components

#### 1. JsReportDesigner
**Location:** `fms.frontend/src/pages/reports/jsreport/JsReportDesigner.js`

Features:
- Monaco Editor for HTML/Handlebars editing
- Template selector dropdown
- Live preview panel
- Sample data editor (JSON)
- Handlebars helpers reference

#### 2. JsReportViewer
**Location:** `fms.frontend/src/pages/reports/jsreport/JsReportViewer.js`

Features:
- Filter form (Date Range, Site, Vehicle, Tank, Fuel Grade)
- Template selector
- Output format (HTML/PDF/Excel)
- Preview in iframe
- Download buttons

#### 3. JsReportTemplateManager
**Location:** `fms.frontend/src/pages/reports/jsreport/JsReportTemplateManager.js`

Features:
- DataGrid with all templates
- Create, Edit, Preview, Duplicate, Delete actions
- Search functionality
- Type categorization

### Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/reports/dashboard` | ReportsDashboard | Overview with quick links |
| `/reports/templates` | JsReportTemplateManager | Manage templates |
| `/reports/viewer` | JsReportViewer | Generate/preview reports |
| `/reports/designer` | JsReportDesigner | Create new template |
| `/reports/designer/:templateName` | JsReportDesigner | Edit existing template |

### Service Methods

**File:** `fms.frontend/src/services/reportingService.js`

```javascript
// Template Management
getJsReportTemplates()
getJsReportTemplate(name)
saveJsReportTemplate(name, content)
deleteJsReportTemplate(name)

// Rendering
previewJsReport(templateName, data)
renderJsReportPdf(templateName, data)
renderJsReportExcel(templateName, data)

// Specialized Reports
generatePumpTransactionReport(filters)

// Utility
downloadReportFile(blob, fileName)
```

## Template Syntax (Handlebars)

### Basic Variables

```handlebars
{{variableName}}
{{object.property}}
```

### Conditionals

```handlebars
{{#if condition}}
  Content when true
{{else}}
  Content when false
{{/if}}

{{#unless condition}}
  Content when false
{{/unless}}
```

### Loops

```handlebars
{{#each arrayName}}
  <tr>
    <td>{{@index}}</td>
    <td>{{this.property}}</td>
    <td>{{propertyName}}</td>
  </tr>
{{/each}}
```

### Loop Context Variables

| Variable | Description |
|----------|-------------|
| `{{@index}}` | Current loop index (0-based) |
| `{{@first}}` | True if first iteration |
| `{{@last}}` | True if last iteration |
| `{{this}}` | Current item in loop |

### Nested Objects

```handlebars
{{#with objectName}}
  {{property1}}
  {{property2}}
{{/with}}
```

## Creating a New Report Template

### Step 1: Create the Template

Navigate to `/reports/designer` or click "New Template" in Template Manager.

### Step 2: Template Structure

```html
<!DOCTYPE html>
<html>
<head>
    <title>{{reportTitle}}</title>
    <style>
        /* Inline CSS for PDF compatibility */
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; }
        .header { border-bottom: 2px solid #007bff; padding-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #343a40; color: white; padding: 10px; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{reportTitle}}</h1>
        <p>Generated: {{generatedAt}}</p>
    </div>

    {{#if data}}
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Description</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            {{#each data}}
            <tr>
                <td>{{@index}}</td>
                <td>{{description}}</td>
                <td>{{amount}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}

    <div class="footer">
        <p>Report ID: {{reportId}}</p>
    </div>
</body>
</html>
```

### Step 3: Test with Sample Data

Use the JSON editor in the Designer to test:

```json
{
  "reportTitle": "Test Report",
  "generatedAt": "2026-01-21 10:30:00",
  "reportId": "RPT-001",
  "data": [
    { "description": "Item 1", "amount": "100.00" },
    { "description": "Item 2", "amount": "250.50" }
  ]
}
```

### Step 4: Save and Test

1. Click "Save" to store the template
2. Click "Preview" to see HTML output
3. Click "PDF" to download as PDF

## Adding a Specialized Report Endpoint

### Step 1: Create Backend Endpoint

Add to `ReportGeneratorController.cs`:

```csharp
[HttpPost("my-custom-report")]
public async Task<IActionResult> GenerateMyCustomReport([FromBody] MyReportFilterDto filters)
{
    try
    {
        // Query data using MediatR
        var query = new GetMyDataQuery(filters);
        var result = await _mediator.Send(query);

        if (!result.IsSuccess)
            return BadRequest(FMSResponse.Failed(result.Error));

        // Prepare report data
        var reportData = new
        {
            reportTitle = "My Custom Report",
            generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
            data = result.Data
        };

        // Render based on format
        var format = filters.Format?.ToLower() ?? "pdf";
        byte[] content = format switch
        {
            "excel" => await _jsReportService.RenderExcelAsync("my-custom-report", reportData),
            "html" => Encoding.UTF8.GetBytes(await _jsReportService.RenderHtmlAsync("my-custom-report", reportData)),
            _ => await _jsReportService.RenderPdfAsync("my-custom-report", reportData)
        };

        var contentType = format switch
        {
            "excel" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "html" => "text/html",
            _ => "application/pdf"
        };

        return File(content, contentType, $"MyReport.{(format == "excel" ? "xlsx" : format)}");
    }
    catch (Exception ex)
    {
        return BadRequest(FMSResponse.Failed(ex.Message));
    }
}
```

### Step 2: Add Frontend Service Method

Add to `reportingService.js`:

```javascript
async generateMyCustomReport(filters) {
  try {
    const response = await axiosInstance.post('/ReportGenerator/my-custom-report', filters, {
      responseType: 'blob'
    });

    const format = filters.format || 'pdf';
    const extension = format === 'excel' ? 'xlsx' : format;

    return {
      success: true,
      blob: response.data,
      fileName: `MyReport_${new Date().toISOString().split('T')[0]}.${extension}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}
```

### Step 3: Create Template File

Create `App_Data/ReportTemplates/my-custom-report.html` with your template content.

## Template Storage

Templates are stored as HTML files in:

```
FMS.WebClient/
└── App_Data/
    └── ReportTemplates/
        ├── pump-transaction-report.html
        ├── my-custom-report.html
        └── ...
```

## Best Practices

### Template Design

1. **Use inline CSS** - External stylesheets may not work in PDF rendering
2. **Test in all formats** - PDF and Excel rendering may differ from HTML
3. **Use print-friendly styles** - Avoid background colors that waste ink
4. **Include page breaks** - Use `page-break-before: always` for multi-page reports

### Performance

1. **Limit data size** - Large datasets slow rendering
2. **Use pagination** - For reports with many rows
3. **Cache templates** - Templates are loaded from disk on each render

### Security

1. **Sanitize user input** - Handlebars auto-escapes HTML, but be careful with {{{triple braces}}}
2. **Validate template names** - Prevent path traversal attacks
3. **Restrict template access** - Use proper authorization

## Troubleshooting

### PDF Rendering Issues

| Issue | Solution |
|-------|----------|
| Blank PDF | Check template syntax, verify data is passed correctly |
| Missing fonts | Use web-safe fonts or embed font files |
| Layout broken | Use table-based layouts for better PDF support |
| Images not showing | Use base64-encoded images or absolute URLs |

### Excel Rendering Issues

| Issue | Solution |
|-------|----------|
| Merged cells wrong | Use proper `colspan`/`rowspan` attributes |
| Styling lost | Excel has limited CSS support, use simple styles |
| Numbers as text | Ensure numeric data is not quoted in JSON |

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Template not found | Template file doesn't exist | Save template first or check name |
| Handlebars error | Invalid template syntax | Check for unclosed tags |
| JsReport not initialized | Service not registered | Check DI registration |

## Migration from DevExpress

For new reports, use JsReport instead of DevExpress:

| Feature | DevExpress | JsReport |
|---------|------------|----------|
| Designer | Visual drag-drop | Code-based (HTML/CSS) |
| Templates | .repx files | .html files |
| Rendering | Server-side | Server-side |
| Learning Curve | Moderate | Low (HTML/CSS knowledge) |
| Flexibility | Limited | High |
| License | Commercial | MIT |

## File Structure

```
FMS.WebClient/
├── Controllers/
│   └── Reporting/
│       └── ReportGeneratorController.cs
├── Services/
│   └── Reporting/
│       ├── IJsReportService.cs
│       └── JsReportService.cs
└── App_Data/
    └── ReportTemplates/
        └── *.html

fms.frontend/
└── src/
    ├── pages/
    │   └── reports/
    │       ├── jsreport/
    │       │   ├── index.js
    │       │   ├── JsReportDesigner.js
    │       │   ├── JsReportDesigner.scss
    │       │   ├── JsReportViewer.js
    │       │   ├── JsReportViewer.scss
    │       │   ├── JsReportTemplateManager.js
    │       │   └── JsReportTemplateManager.scss
    │       ├── ReportsMain.js
    │       └── ReportsDashboard.js
    └── services/
        └── reportingService.js
```

## Related Documentation

- [Handlebars Documentation](https://handlebarsjs.com/guide/)
- [JsReport Documentation](https://jsreport.net/learn)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

---

*Last Updated: January 21, 2026*
