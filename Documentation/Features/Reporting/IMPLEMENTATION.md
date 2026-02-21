# Reporting System — Implementation Guide

## Architecture Overview

The reporting system uses a **dual-engine** architecture:

1. **JsReport (Primary)** — Server-side rendering with Handlebars templates, ChromePdf/HtmlToXlsx recipes
2. **DevExtreme Reporting (Legacy)** — REPX-based reports via DevExpress designer/viewer controllers

All new reports use JsReport. DevExtreme Reporting is retained for backward compatibility.

---

## Backend Architecture

### Layer Diagram

```
┌──────────────────────────────────────────────────────┐
│  FMS.WebClient (Controllers)                         │
│  ├── ReportGeneratorController  (JsReport CRUD/render)│
│  ├── ReportingController        (Definitions/schedules)│
│  ├── StockReportController      (Tank stock reports)  │
│  └── DevExtreme Controllers     (Legacy REPX)         │
├──────────────────────────────────────────────────────┤
│  FMS.WebClient/Services/Reporting                     │
│  ├── IJsReportService / JsReportService               │
│  ├── JsReportTemplateManager                          │
│  ├── JsReportHtmlTemplates      (Embedded defaults)   │
│  ├── JsReportLetterheadBranding (Logo injection)      │
│  └── NotificationReportRenderer (Email bridge)        │
├──────────────────────────────────────────────────────┤
│  FMS.Application/Features/Reporting (CQRS)           │
│  ├── Commands/  (GenerateReport, CreateSchedule, etc.)│
│  ├── Queries/   (GetDefinitions, GetTemplates, etc.)  │
│  ├── DTOs/      (ReportDefinitionDTO, etc.)           │
│  └── Services/  (ReportDefinitionService, etc.)       │
├──────────────────────────────────────────────────────┤
│  FMS.Domain/Entities                                  │
│  ├── ReportDefinition, ReportTemplate                 │
│  ├── ReportSchedule, ReportExecutionHistory           │
│  └── ReportCategory, ReportItem                       │
├──────────────────────────────────────────────────────┤
│  FMS.Persistence (EF Core + MySQL)                    │
└──────────────────────────────────────────────────────┘
```

### JsReport Engine (`FMS.WebClient/Services/Reporting/`)

#### `IJsReportService` / `JsReportService`

The core rendering service. Uses `jsreport.Local` with `jsreport.Binary` and system Chrome.

**Key methods:**

| Method | Description |
|--------|-------------|
| `RenderPdfAsync(templateName, data)` | Render a PDF using ChromePdf recipe |
| `RenderExcelAsync(templateName, data)` | Render Excel using HtmlToXlsx recipe |
| `RenderHtmlAsync(templateName, data)` | Render raw HTML for preview |
| `RenderInlinePdfAsync(templateName, data)` | Render PDF as base64 for inline display |
| `GetTemplateListAsync()` | List all available templates |
| `GetTemplateAsync(name)` | Get a template's content by name |
| `SaveTemplateAsync(name, content)` | Save/update a template |
| `DeleteTemplateAsync(name)` | Delete a template |

**Configuration:**

- Default render timeout: **120 seconds**
- Large payload timeout (>750KB): **300 seconds**
- Stale Chrome daemon processes are killed before each render
- Templates loaded from disk with fallback to embedded defaults

#### `JsReportTemplateManager`

File-based template storage at `C:\FMSData\reports\templates\`.

- On first run, seeds 9 default templates from `JsReportHtmlTemplates.cs`
- Templates are Handlebars `.html` files
- Supports CRUD operations on template files

#### `JsReportHtmlTemplates`

Contains 9 embedded Handlebars HTML templates as string constants:

1. `PumpTransactionReportTemplate`
2. `VehicleConsumptionReportTemplate`
3. `FuelRefillReportTemplate`
4. `FuelDeliveryReportTemplate`
5. `DeviceOfflineReportTemplate`
6. `PtsDeviceStatusReportTemplate`
7. `TankVolumeHistoryReportTemplate`
8. `IssueTrackerReportTemplate`
9. `ConsumptionByRefillsReportTemplate`

#### `JsReportLetterheadBranding`

Auto-injects company branding into every rendered report:

- Reads logo from `C:\FMSData\reports\branding\letterhead-logo.png`
- Converts to base64 and injects as `<img>` in the template header
- Adds standard CSS for letterhead layout

#### `NotificationReportRenderer`

Bridge between the notification system and JsReport:

- Implements `INotificationReportRenderer`
- Called by the notification scheduler when a scheduled report email fires
- Delegates rendering to `IJsReportService`
- Returns the rendered output (PDF/Excel bytes) for email attachment

### CQRS Layer (`FMS.Application/Features/Reporting/`)

#### Commands

| Command | Purpose |
|---------|---------|
| `GenerateReportCommand` | Trigger report generation |
| `CreateReportScheduleCommand` | Create a new scheduled report email |
| `CancelReportScheduleCommand` | Cancel an active schedule |
| `LogReportExecutionCommand` | Record execution in history |

#### Queries

| Query | Purpose |
|-------|---------|
| `GetReportDefinitionQuery` | Get a specific report definition by ID |
| `GetAllReportDefinitionsQuery` | List all available report definitions |
| `GetReportTemplatesQuery` | List saved templates for a report |
| `GetReportSchedulesQuery` | List scheduled report deliveries |
| `GetExecutionHistoryQuery` | Get execution history with filters |

#### Services

| Service | Purpose |
|---------|---------|
| `IReportDefinitionService` / `ReportDefinitionService` | Manages in-memory report definitions (hardcoded catalog) |
| `IReportGenerationService` / `ReportGenerationService` | Stub for JSON/CSV generation; PDF/Excel defers to JsReport |

### Controllers (`FMS.WebClient/Controllers/Reporting/`)

| Controller | Route Prefix | Purpose |
|------------|-------------|---------|
| `ReportGeneratorController` | `api/v1/ReportGenerator` | JsReport template CRUD, render PDF/Excel/HTML, dedicated pump-transaction + issue-tracker endpoints |
| `ReportingController` | `api/v1/Reporting` | Report definitions, categories, templates, execution history, schedules |
| `StockReportController` | `api/StockReport` | Tank stock reports (summary, variance, utilization, movements) |
| `ReportsController` | `api/v1/Reports` | DevExtreme ReportItem entity CRUD (legacy) |
| `ReportDesignerController` | DevExpress base | REPX report designer (legacy) |
| `QueryBuilderController` | DevExpress base | SQL query builder for REPX (legacy) |
| `WebDocumentViewerController` | DevExpress base | REPX document viewer (legacy) |

### Domain Entities (`FMS.Domain/Entities/`)

| Entity | Table | Purpose |
|--------|-------|---------|
| `ReportDefinition` | `report_definitions` | Report metadata (slug, name, category, type, endpoint, required permission) |
| `ReportTemplate` | `report_templates` | Template config (FK to ReportDefinition, name, JSON config, shared flag) |
| `ReportExecutionHistory` | `report_execution_history` | Audit trail (who, when, filters, format, duration, success/error) |
| `ReportCategory` | `report_categories` | Category with icon and display order |
| `ReportSchedule` | `report_schedules` | Scheduled email delivery (source, filters, recipients, frequency, status) |
| `ReportItem` | (Reports table) | DevExtreme REPX binary layout data (legacy) |
| `ReportPumpTransaction` | (DTO only) | Flat DTO for pump transaction report data |
| `ReportTankMeasurement` | (DTO only) | Flat DTO for tank measurement report data |

---

## Frontend Architecture

### Module Structure

```
fms.frontend/src/pages/reports/
├── ReportsMain.js              # React Router route definitions
├── ReportsDashboard.js         # Landing page with quick-actions
├── ReportGallery.js            # Gallery view of all reports
├── ReportListPage.js           # DataGrid listing of report sources
├── ReportScheduleSettings.js   # Admin schedule editor
├── index.js                    # Module export
│
├── layout/
│   └── ReportsLayout.js        # Collapsible sidebar navigation
│
├── engine/                      # Core report generation
│   ├── ReportEngine.js          # Orchestrator for generating reports
│   ├── ReportParameterForm.js   # Dynamic filter form (Redux lookups)
│   ├── ReportFormatSelector.js  # Format picker (HTML/PDF/Excel/CSV)
│   ├── ReportOutputViewer.js    # HTML viewer (iframe-based)
│   └── reportDataBuilder.js     # Data normalizer for all 9 sources
│
├── sources/                     # Report source registry
│   └── reportSourceRegistry.js  # Map of source configs
│   └── [9 source definition files]
│
├── templates/                   # Template management
│   ├── TemplateManager.js       # DataGrid CRUD
│   └── TemplateDesigner.js      # Monaco editor + live preview
│
├── scheduling/                  # Schedule management
│   ├── ReportScheduleManager.js # DataGrid + popup form
│   ├── ReportScheduleForm.js    # Schedule creation form
│   └── reportScheduleFormUtils.js
│
├── monitoring/                  # Execution monitoring
│   ├── ReportMonitorDashboard.js# Stats cards + history
│   └── ReportExecutionLog.js    # Detailed execution view
│
├── hooks/                       # Custom React hooks
├── utils/                       # Utility functions
├── components/                  # Local shared components
├── consumption/                 # Consumption-specific reports
├── pts/                         # PTS-specific reports
└── _deprecated/                 # Old DevExtreme report wrappers
```

### Key Frontend Components

#### `ReportEngine` (engine/ReportEngine.js)

The central orchestrator. Steps:

1. Loads source definition from `reportSourceRegistry`
2. Renders `ReportParameterForm` for dynamic filters
3. User selects format via `ReportFormatSelector`
4. On "Generate": fetches data from the source's API endpoint
5. Normalizes data via `reportDataBuilder.buildJsReportPayload()`
6. Sends normalized payload to JsReport backend for rendering
7. Displays HTML in `ReportOutputViewer` or triggers PDF/Excel download

#### `reportDataBuilder` (engine/reportDataBuilder.js)

Central data normalization layer (692 lines). Key functions:

- `buildJsReportPayload({sourceId, sourceName, apiResponse, queryParams})` — dispatches to source-specific mapper
- `unwrapApiRecords(apiResponse)` — handles nested `data.data`, `data.Data`, `data.records` response shapes
- `getValue(obj, keys)` — case-insensitive property lookup across multiple key variants

Source-specific mappers:
- `mapFuelRefill`, `mapVehicleConsumption`, `mapDelivery`
- `mapDeviceOffline`, `mapPtsDevice`, `mapTankVolumeHistory`
- `mapIssueTracker`, `mapConsumptionByRefills`

#### `reportSourceRegistry` (sources/reportSourceRegistry.js)

A `Map`-based registry where each source is a pure configuration object defining:

```javascript
{
  id: 'pump-transaction',
  name: 'Pump Transaction Report',
  category: 'Fuel Management',
  icon: 'fa-light fa-gas-pump',
  description: '...',
  apiEndpoint: '/ReportGenerator/pump-transactions',
  templateName: 'pump-transaction-report',
  supportedFormats: ['html', 'pdf', 'excel'],
  parameters: [
    { name: 'startDate', type: 'date', required: true, label: 'Start Date' },
    { name: 'endDate', type: 'date', required: true, label: 'End Date' },
    { name: 'siteId', type: 'lookup', lookupSource: 'sites', label: 'Site' },
    // ...
  ]
}
```

### API Client (`fms.frontend/src/services/reportingService.js`)

Singleton class (753 lines) with methods organized in groups:

| Group | Key Methods |
|-------|-------------|
| JsReport Templates | `getJsReportTemplates()`, `getJsReportTemplate(name)`, `saveJsReportTemplate(name, content)`, `deleteJsReportTemplate(name)`, `previewJsReport(templateName, data)`, `renderJsReportPdf(templateName, data)`, `renderJsReportExcel(templateName, data)` |
| Scheduling | `scheduleReportEmail(payload)`, `getScheduledReportEmails()`, `updateScheduledReportEmail(id, payload)`, `cancelScheduledReportEmail(id)`, `deleteScheduledReportEmail(id)` |
| Data Fetch | `fetchReportData(endpoint, params)` — handles array params with repeated keys for ASP.NET Core binding |
| Utilities | `downloadReportFile(blob, fileName)`, `formatReportFilters()`, `extractReportErrorMessage()` |

### Redux Integration

No dedicated reporting slice. The `ReportParameterForm` uses existing Redux slices for lookup data:

- `fetchSiteList` — Sites
- `fetchVehicleList` — Vehicles
- `fetchTanks` — Tanks
- `fetchVehicleTypes` — Vehicle types
- `fetchPTSDeviceList` — PTS devices
- `fetchSuppliers` — Suppliers
- `fetchIssueCategories` — Issue categories
- `fetchIssueStatuses` — Issue statuses

---

## Data Flow

### Interactive Report Generation

```
User → /reports/engine/:sourceId
  │
  ├── 1. Load source config from reportSourceRegistry
  ├── 2. Render ReportParameterForm (dynamic filters, Redux lookups)
  ├── 3. User fills filters, selects format (HTML/PDF/Excel/CSV)
  ├── 4. Click "Generate"
  │     ├── Validate required parameters
  │     ├── Build query params (respecting queryParam aliases)
  │     └── GET /api/v1/{source.apiEndpoint}?{params}
  │
  ├── 5. Normalize response
  │     ├── unwrapApiRecords() → extract records array
  │     ├── Source-specific mapper → transform fields
  │     └── Build payload: {reportTitle, generatedAt, records, summary}
  │
  ├── 6. Render via JsReport backend
  │     ├── HTML:  POST /api/v1/ReportGenerator/preview/{templateName}  → HTML string
  │     ├── PDF:   POST /api/v1/ReportGenerator/render/pdf/{templateName} → Blob
  │     └── Excel: POST /api/v1/ReportGenerator/render/excel/{templateName} → Blob
  │
  └── 7. Display output
        ├── HTML:  ReportOutputViewer writes to iframe via contentDocument.write()
        ├── PDF:   downloadReportFile() triggers browser download
        ├── Excel: downloadReportFile() triggers browser download
        └── CSV:   Generated client-side from records array
```

### Server-Side Rendering (JsReport)

```
POST body → ReportGeneratorController
  │
  ├── Load Handlebars template from disk (JsReportTemplateManager)
  │   └── Fallback to embedded template (JsReportHtmlTemplates)
  │
  ├── Inject letterhead branding (JsReportLetterheadBranding)
  │   ├── Read logo PNG → base64
  │   └── Insert CSS + logo <img> into template header
  │
  ├── Compile Handlebars template with data payload
  │
  ├── Send to jsreport.Local engine
  │   ├── PDF:   ChromePdf recipe (120s/300s timeout)
  │   └── Excel: HtmlToXlsx recipe
  │
  └── Return rendered bytes/stream
```

### Scheduled Report Email Delivery

```
User → /reports/scheduling or /reports/scheduled-emails
  │
  ├── 1. Create schedule via ReportScheduleForm
  │     ├── Select source, filters, format, recipients
  │     ├── Set frequency (once/daily/weekly/monthly)
  │     └── buildNotificationRequestFromForm()
  │           → POST /api/v1/notifications
  │           → {Type: 2, CategoryId: 20, schedulerVersion: 3}
  │
  ├── 2. Backend notification scheduler triggers at scheduled time
  │
  ├── 3. NotificationReportRenderer.RenderAsync()
  │     └── IJsReportService.RenderPdfAsync() or RenderExcelAsync()
  │
  ├── 4. Report attached to email, sent to recipients
  │
  ├── 5. Execution logged to report_execution_history
  │
  └── 6. Delivery status tracked per-recipient
```
