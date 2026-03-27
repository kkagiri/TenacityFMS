# Reporting System — Usage Guide

## Reporting Feature Update

The reporting module is currently used in five main ways:

| Feature | How it is used |
|---------|----------------|
| **Scheduling** | Users create recurring or one-time report deliveries by choosing a report source, filters, recipients, timezone, frequency, and output format. |
| **Report Monitoring** | Users review execution history, success and failure status, average durations, and error details from the monitoring dashboard. |
| **Background Production** | Heavy reports can be submitted as async jobs, tracked by job ID, monitored through SignalR progress events, and downloaded when complete. |
| **Customization** | Users edit built-in templates, add custom templates, and adjust branded output through the template manager and designer. |
| **Report Importation** | Reporting-adjacent import workflows support external fuel report ingestion, import summaries, single-file import, retries, and template onboarding. |

## Navigating the Reports Module

Access the reports module at `/reports`. The left sidebar provides navigation to all sections.

### Dashboard (`/reports`)

The landing page displays:

- **Quick-action cards** for each report source (click to go directly to the report engine)
- **Source catalog** showing all built-in report types grouped by category

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
- **Create custom templates** — Clone an existing template, upload a user-supplied variation, or modify an existing one
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

### Background Report Jobs

For larger reports, the system can run generation in the background instead of blocking the user session.

- **Submit a job** — The UI posts to the async generation endpoint with source, template, parameters, and output format
- **Track progress** — Progress is broadcast with `ReportJobStarted`, `ReportJobProgress`, `ReportJobCompleted`, and `ReportJobError`
- **Download when ready** — Completed jobs can be downloaded later through the job result endpoint
- **Cancel running work** — Long-running jobs can be cancelled without waiting for browser timeouts
- **Request email delivery** — A completed or in-flight job can be marked for email delivery to the current user

### Report Importation

The reporting area also supports reporting-adjacent import workflows:

- **Fuel import reporting** — Import summaries, auto-import triggers, retry flows, and import file visibility for external fuel report ingestion
- **Template onboarding** — Custom or user-supplied templates can be saved into the template store and used by the report engine

### Report Gallery (`/reports/gallery`)

Browse all available reports including both JsReport sources and legacy DevExtreme reports.

## Report Types And What They Do

| Report Type | What users use it for |
|-------------|------------------------|
| `pump-transaction` | Reviewing pump dispensing transactions by volume, nozzle, vehicle, operator, and tank context. |
| `vehicle-consumption` | Analysing fuel efficiency and consumption patterns by vehicle, site, and vehicle type. |
| `fuel-refill` | Reviewing detailed refill activity for vehicles and equipment. |
| `delivery` | Checking supplier deliveries and quantities received into tanks. |
| `consumption-by-refills` | Measuring consumption from refill-to-refill intervals. |
| `tank-volume-history` | Inspecting detailed tank movement history including deliveries, dispensing, and transfers. |
| `transaction-history-summary` | Reviewing summarized monthly and yearly tank transaction activity. |
| `tank-level-detail` | Examining detailed tank-level balances and reference-linked changes. |
| `storage-received-vs-dispensed` | Comparing receipts against dispensed quantities and closing variance. |
| `device-offline` | Monitoring historical offline periods for field devices. |
| `pts-device` | Reviewing PTS device health, uptime, and connectivity state. |
| `alarm-report` | Investigating alarms raised by probes, pumps, PTS devices, and related hardware. |
| `issue-tracker` | Reviewing issue records by site, vehicle, status, category, and template. |
| `route-analysis` | Analysing route summaries, anomalies, reconciliation, and trip quality. |
| `live-trip-operations` | Monitoring active trips, live cycle counts, and vehicle movement status. |
| `vehicle-document-compliance` | Checking document validity, due-soon items, expired items, and compliance posture. |

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

### Submit a Background Report Job

```javascript
const jobResponse = await axiosInstance.post('/ReportGenerator/generate-async', {
  sourceId: 'transaction-history-summary',
  templateName: 'transaction-history-summary-report',
  reportTitle: 'Transaction History Summary',
  outputFormat: 'pdf',
  parameters: {
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    siteId: 5,
    timeZone: 'Africa/Nairobi'
  }
});

const jobId = jobResponse.data.data.jobId;

const statusResponse = await axiosInstance.get(`/ReportGenerator/jobs/${jobId}`);

const downloadUrl = `/ReportGenerator/jobs/${jobId}/download`;
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
| `/api/v1/ReportGenerator/generate-async` | POST | Async job payload | Submitted job metadata |
| `/api/v1/ReportGenerator/jobs` | GET | — | Active jobs for current user |
| `/api/v1/ReportGenerator/jobs/{jobId}` | GET | — | Async job status |
| `/api/v1/ReportGenerator/jobs/{jobId}/download` | GET | — | Completed file download |
| `/api/v1/ReportGenerator/jobs/{jobId}/cancel` | POST | — | Cancel running job |
| `/api/v1/ReportGenerator/jobs/{jobId}/email` | POST | — | Enable email delivery for a job |
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

#### Reporting-Adjacent Import Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/fuel-import/auto-import` | POST | Trigger on-demand auto-import of external fuel reports |
| `/api/v1/fuel-import/auto-import/single` | POST | Import a single file for testing or recovery |
| `/api/v1/fuel-import/auto-import/summary` | GET | Get aggregate import summary metrics |
| `/api/v1/fuel-import/auto-import/files` | GET | List tracked import files and status |
| `/api/v1/fuel-import/auto-import/files/{id}/retry` | POST | Retry a failed import file |
| `/api/v1/fuel-import/auto-import/settings` | GET/PUT | Read or update auto-import configuration |

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
