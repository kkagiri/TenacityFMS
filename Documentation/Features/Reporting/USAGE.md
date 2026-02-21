# Reporting System — Usage Guide

## Navigating the Reports Module

Access the reports module at `/reports`. The left sidebar provides navigation to all sections.

### Dashboard (`/reports`)

The landing page displays:

- **Quick-action cards** for each report source (click to go directly to the report engine)
- **Source catalog** showing all 9 available report types grouped by category

### Report Engine (`/reports/engine/:sourceId`)

The main report generation interface. Select a source from the dashboard or sidebar.

**Steps to generate a report:**

1. **Select filters** — The parameter form dynamically renders based on the source definition (date ranges, site selector, vehicle selector, etc.)
2. **Choose format** — HTML (preview), PDF (download), Excel (download), or CSV (client-side export)
3. **Click Generate** — The system fetches data, normalizes it, and renders the report
4. **View or download** — HTML reports display in an iframe; PDF/Excel trigger a browser download

### Template Manager (`/reports/templates`)

Manage Handlebars HTML templates used for report rendering.

- **View all templates** in a DataGrid
- **Edit a template** — Opens the Monaco code editor with live preview
- **Create custom templates** — Clone an existing template and modify
- **Delete templates** — Custom templates can be removed (built-in templates always regenerate)

### Template Designer (`/reports/templates/designer/:templateName`)

Monaco-based HTML/Handlebars editor with:

- Syntax highlighting for HTML + Handlebars
- Live preview panel showing rendered output
- Save/discard controls
- Template variable reference

### Schedule Manager (`/reports/scheduling`)

Create and manage scheduled report email deliveries.

- **Create schedule** — Select source, filters, recipients, frequency, and output format
- **View active schedules** — DataGrid with status indicators
- **Pause/resume/cancel** schedules
- **Frequencies**: Once, Daily, Weekly, Monthly

### Monitoring Dashboard (`/reports/monitoring`)

View execution history and statistics:

- **Stats cards** — Total executions, success rate, average duration
- **Execution history** — Detailed log with filters for date, source, and status
- **Error tracking** — Failed executions with error messages

### Report Gallery (`/reports/gallery`)

Browse all available reports including both JsReport sources and legacy DevExtreme reports.

---

## API Usage

### Generate a Report (Programmatic)

#### Fetch data and render PDF

```javascript
import reportingService from '../../services/reportingService';

// 1. Fetch report data from the source endpoint
const dataResponse = await reportingService.fetchReportData(
  '/ReportGenerator/pump-transactions',
  {
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    siteId: 5
  }
);

// 2. Render as PDF
const pdfBlob = await reportingService.renderJsReportPdf(
  'pump-transaction-report',
  {
    reportTitle: 'Pump Transactions - January 2025',
    generatedAt: new Date().toISOString(),
    records: dataResponse.data
  }
);

// 3. Download
reportingService.downloadReportFile(pdfBlob, 'pump-transactions-jan-2025.pdf');
```

#### Preview as HTML

```javascript
const htmlString = await reportingService.previewJsReport(
  'pump-transaction-report',
  reportPayload
);

// Display in an iframe
const iframe = document.getElementById('report-viewer');
iframe.contentDocument.open();
iframe.contentDocument.write(htmlString);
iframe.contentDocument.close();
```

#### Render Excel

```javascript
const excelBlob = await reportingService.renderJsReportExcel(
  'pump-transaction-report',
  reportPayload
);

reportingService.downloadReportFile(excelBlob, 'pump-transactions.xlsx');
```

### Template Management API

```javascript
// List all templates
const templates = await reportingService.getJsReportTemplates();

// Get a specific template's HTML content
const template = await reportingService.getJsReportTemplate('pump-transaction-report');

// Save/update a template
await reportingService.saveJsReportTemplate('my-custom-template', htmlContent);

// Delete a template
await reportingService.deleteJsReportTemplate('my-custom-template');
```

### Schedule a Report Email

```javascript
// Schedule a daily pump transaction report
await reportingService.scheduleReportEmail({
  Type: 2,
  CategoryId: 20,
  schedulerVersion: 3,
  scheduleName: 'Daily Pump Transactions',
  reportSourceId: 'pump-transaction',
  filters: {
    siteId: 5,
    dateRange: 'last24hours'
  },
  recipients: ['user@example.com', 'manager@example.com'],
  outputFormat: 'pdf',
  frequency: 'daily',
  scheduleConfig: {
    hour: 8,
    minute: 0,
    timezone: 'Africa/Nairobi'
  }
});

// List scheduled reports
const schedules = await reportingService.getScheduledReportEmails();

// Cancel a schedule
await reportingService.cancelScheduledReportEmail(scheduleId);
```

### Backend API Endpoints

#### JsReport Rendering (`ReportGeneratorController`)

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/v1/ReportGenerator/templates` | GET | — | JSON array of template names |
| `/api/v1/ReportGenerator/templates/{name}` | GET | — | Template HTML content |
| `/api/v1/ReportGenerator/templates/{name}` | PUT | `{ content: "..." }` | Success/failure |
| `/api/v1/ReportGenerator/templates/{name}` | DELETE | — | Success/failure |
| `/api/v1/ReportGenerator/preview/{templateName}` | POST | Report data JSON | HTML string |
| `/api/v1/ReportGenerator/render/pdf/{templateName}` | POST | Report data JSON | PDF binary stream |
| `/api/v1/ReportGenerator/render/excel/{templateName}` | POST | Report data JSON | Excel binary stream |
| `/api/v1/ReportGenerator/pump-transactions` | GET | Query params | JSON data for pump reports |
| `/api/v1/ReportGenerator/issue-tracker/data` | GET | Query params | JSON data for issue reports |

#### Report Definitions (`ReportingController`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/Reporting/definitions` | GET | List all report definitions |
| `/api/v1/Reporting/definitions/{id}` | GET | Get report definition by ID |
| `/api/v1/Reporting/templates` | GET | List saved templates |
| `/api/v1/Reporting/templates` | POST | Save a template |
| `/api/v1/Reporting/categories` | GET | Get report categories |
| `/api/v1/Reporting/execution-history` | GET | Get execution history |

#### Stock Reports (`StockReportController`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/StockReport/summary` | GET | Tank stock summary |
| `/api/StockReport/variance` | GET | Tank stock variance |
| `/api/StockReport/utilization` | GET | Tank utilization report |
| `/api/StockReport/movements` | GET | Tank movement history |

---

## Report Data Payload Format

When sending data to the JsReport backend for rendering, use this structure:

```json
{
  "reportTitle": "Pump Transaction Report",
  "subtitle": "January 2025",
  "generatedAt": "2025-01-31T12:00:00Z",
  "generatedBy": "admin@example.com",
  "filters": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "site": "Main Depot"
  },
  "records": [
    {
      "date": "2025-01-15",
      "vehicle": "KBX 123A",
      "quantity": 45.5,
      "amount": 7280.00,
      "pump": "Pump 1"
    }
  ],
  "summary": {
    "totalRecords": 150,
    "totalQuantity": 5420.5,
    "totalAmount": 867280.00
  }
}
```

The Handlebars template iterates over `records` and uses `summary` for footer totals.

---

## Handlebars Template Syntax

Templates use standard Handlebars syntax:

```handlebars
<h1>{{reportTitle}}</h1>
<p>Generated: {{generatedAt}}</p>

<table>
  <thead>
    <tr>
      <th>Date</th>
      <th>Vehicle</th>
      <th>Quantity (L)</th>
    </tr>
  </thead>
  <tbody>
    {{#each records}}
    <tr>
      <td>{{this.date}}</td>
      <td>{{this.vehicle}}</td>
      <td>{{this.quantity}}</td>
    </tr>
    {{/each}}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="2">Total</td>
      <td>{{summary.totalQuantity}}</td>
    </tr>
  </tfoot>
</table>
```

### Available Helpers

- `{{#each array}}...{{/each}}` — Loop over records
- `{{#if condition}}...{{else}}...{{/if}}` — Conditional
- `{{this.propertyName}}` — Access current item property
- `{{@index}}` — Current loop index
- `{{formatDate date "YYYY-MM-DD"}}` — Date formatting (if registered)

---

## Permissions

Reports integrate with the FMS JWT-based permission system:

- Each report source can specify a `RequiredPermission` in its definition
- The backend checks permissions on the data endpoint (e.g., `_Read_PumpTransaction`)
- Frontend uses `usePermissions()` hook to conditionally render report entries

---

## File Storage Paths

| Path | Contents |
|------|----------|
| `C:\FMSData\reports\templates\` | Handlebars HTML template files |
| `C:\FMSData\reports\branding\letterhead-logo.png` | Company logo for report headers |
