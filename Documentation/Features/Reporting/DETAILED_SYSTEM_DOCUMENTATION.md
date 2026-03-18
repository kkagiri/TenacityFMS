# FMS Reporting System — Detailed System Documentation

> **Version:** 2.0 | **Last Updated:** 2026-03-11
> **Primary Engine:** JsReport (Handlebars + PuppeteerSharp) | **Legacy Engine:** DevExtreme Reporting (REPX)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Backend — Service Layer](#3-backend--service-layer)
4. [Backend — CQRS Layer](#4-backend--cqrs-layer)
5. [Backend — Controllers (API Surface)](#5-backend--controllers-api-surface)
6. [Backend — Domain Entities & Database](#6-backend--domain-entities--database)
7. [Templates — Engine, Storage & Branding](#7-templates--engine-storage--branding)
8. [Frontend — Module Structure](#8-frontend--module-structure)
9. [Frontend — Report Engine (Generation Flow)](#9-frontend--report-engine-generation-flow)
10. [Frontend — Template Management](#10-frontend--template-management)
11. [Frontend — Scheduling](#11-frontend--scheduling)
12. [Frontend — Monitoring & Execution History](#12-frontend--monitoring--execution-history)
13. [Sequence Flows](#13-sequence-flows)
14. [Report Source Registry](#14-report-source-registry)
15. [Report Creation & Modification](#15-report-creation--modification)
16. [Template Creation & Modification](#16-template-creation--modification)
17. [Schedule Creation, Execution & Modification](#17-schedule-creation-execution--modification)
18. [Monitoring & Execution Tracking](#18-monitoring--execution-tracking)
19. [Async Job System (Background Reports)](#19-async-job-system-background-reports)
20. [Security & Permissions](#20-security--permissions)
21. [Performance & Error Handling](#21-performance--error-handling)
22. [Extensibility Guide](#22-extensibility-guide)

---

## 1. System Overview

The FMS Reporting System provides **server-side report generation** with multi-format output (HTML, PDF, Excel, CSV), **scheduled email delivery**, **execution monitoring**, and **customisable Handlebars templates** — all accessible through a React-based frontend.

### Capabilities at a Glance

| Capability | Description |
|-----------|-------------|
| **10 Built-in Report Sources** | Fuel, fleet, device, and operations reports |
| **Multi-Format Output** | HTML preview, PDF download, Excel download, CSV export |
| **Server-Side Rendering** | Handlebars → HTML (jsreport), HTML → PDF (PuppeteerSharp/Chrome), Data → XLSX (ClosedXML) |
| **Template Management** | File-based Handlebars templates with Monaco editor UI |
| **Letterhead Branding** | Auto-injected company logo into every rendered report |
| **Scheduled Delivery** | Email delivery via integration with the Notification system |
| **Execution Monitoring** | Audit trail with performance stats and error tracking |
| **Async Job System** | Background report generation with SignalR real-time progress |
| **Report Job Manager** | In-memory job orchestration with auto-cleanup and concurrency limits |

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Template Engine | jsreport.Local + jsreport.Binary | Handlebars → HTML rendering |
| PDF Conversion | PuppeteerSharp + System Chrome/Edge | HTML → PDF (high-fidelity CSS3 support) |
| Excel Generation | ClosedXML | Structured data → XLSX (no Chrome needed) |
| Template Storage | File system at `C:\FMSData\reports\templates\` | `.html` Handlebars files |
| Template Editor | Monaco Editor (in-browser) | Syntax-highlighted editing with live preview |
| Branding | `C:\FMSData\reports\branding\letterhead-logo.png` | Auto-injected into all renders |
| Scheduling | Notification system (Type:2, CategoryId:20) | Reuses existing notification infrastructure |
| Real-time Progress | SignalR via `FrontEndHub` | Job status broadcasts to connected clients |
| Frontend | React 18 + DevExtreme + Redux Toolkit | UI components |
| API Client | `reportingService.js` (singleton class, 780+ lines) | Axios-based HTTP client |

---

## 2. Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React 18)                               │
│                                                                             │
│  ReportsMain (Router)                                                       │
│  ├── ReportsDashboard        ← Landing page, quick-action cards             │
│  ├── ReportEngine            ← Central generation orchestrator              │
│  │   ├── ReportParameterForm ← Dynamic filters from source config           │
│  │   ├── ReportFormatSelector← HTML/PDF/Excel/CSV picker                    │
│  │   └── ReportOutputViewer  ← iframe-based HTML viewer                     │
│  ├── TemplateManager         ← DataGrid CRUD for templates                  │
│  │   └── TemplateDesigner    ← Monaco editor + live preview                 │
│  ├── ReportScheduleManager   ← Schedule CRUD with slide panels              │
│  └── ReportMonitorDashboard  ← Execution history + stats                    │
│                                                                             │
│  reportingService.js         ← Singleton API client (30 methods)            │
│  reportSourceRegistry.js     ← Map<sourceId, config> (10 sources)           │
│  reportDataBuilder.js        ← API response → template payload normaliser   │
├─────────────────────────────────────────────────────────────────────────────┤
│                           API LAYER (ASP.NET Core)                           │
│                                                                             │
│  ReportGeneratorController   ← Template CRUD + PDF/Excel/HTML render        │
│  ReportingController         ← Definitions, templates, categories, history  │
│  StockReportController       ← Tank stock domain reports                    │
│  (Legacy: ReportDesigner, WebDocumentViewer, QueryBuilder controllers)       │
├─────────────────────────────────────────────────────────────────────────────┤
│                        SERVICE LAYER (WebClient/Services)                    │
│                                                                             │
│  JsReportService             ← Core render engine (Handlebars→HTML→PDF)     │
│  JsReportTemplateManager     ← File-based template CRUD + seeding           │
│  JsReportLetterheadBranding  ← Logo injection into HTML templates           │
│  NotificationReportRenderer  ← Bridge: Notification system → JsReport       │
│  ReportJobManager            ← In-memory async job orchestration            │
├─────────────────────────────────────────────────────────────────────────────┤
│                     APPLICATION LAYER (CQRS via MediatR)                     │
│                                                                             │
│  Commands: GenerateReport, CreateSchedule, CancelSchedule,                  │
│            SaveTemplate, DeleteTemplate, LogExecution                        │
│  Queries:  GetDefinition(s), GetTemplates, GetSchedules, GetHistory         │
│  Services: ReportDefinitionService, ReportGenerationService,                │
│            ReportJobProgressService (SignalR)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                          DOMAIN LAYER (Entities)                             │
│                                                                             │
│  ReportDefinition, ReportTemplate, ReportSchedule,                          │
│  ReportExecutionHistory, ReportCategory                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                      PERSISTENCE (EF Core + MySQL)                           │
│                                                                             │
│  Tables: report_definitions, report_templates, report_schedules,            │
│          report_execution_history, report_categories                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Rendering Pipeline

```
                    ┌─────────────┐
                    │  Handlebars │
                    │  Template   │
                    │  (.html)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  jsreport   │  ← Handlebars engine ONLY (no Chrome)
                    │  (Local)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Raw HTML   │  ← With letterhead branding injected
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐  ┌─▼──┐  ┌─────▼─────┐
       │ PuppeteerSharp│  │HTML│  │ ClosedXML │
       │ + Chrome/Edge│  │   │  │  (direct)  │
       └──────┬──────┘  └─┬──┘  └─────┬─────┘
              │            │            │
       ┌──────▼──────┐  ┌─▼──┐  ┌─────▼─────┐
       │   PDF File   │  │View│  │ XLSX File  │
       └─────────────┘  └────┘  └───────────┘
```

> **Why not jsreport's built-in ChromePdf recipe?**
> jsreport's pkg-bundled binary cannot spawn Chrome from IIS (`spawn UNKNOWN` error). The system uses jsreport **only** as a Handlebars → HTML engine, then PuppeteerSharp converts the rendered HTML to PDF using the system-installed Chrome or Edge browser.

---

## 3. Backend — Service Layer

Located in `FMS.WebClient/Services/Reporting/`

### 3.1 JsReportService

**File:** `JsReportService.cs` (1,391 lines)
**Interface:** `IJsReportService`
**Lifetime:** Singleton (shared instance)

The core rendering engine. Handles Handlebars template rendering (via jsreport) and PDF conversion (via PuppeteerSharp).

#### Key Methods

| Method | Input | Output | Description |
|--------|-------|--------|-------------|
| `RenderPdfAsync(templateName, data, landscape)` | Template name + data object | `byte[]` (PDF) | Template → HTML (jsreport) → PDF (PuppeteerSharp) |
| `RenderExcelAsync(templateName, data)` | Template name + data object | `byte[]` (XLSX) | Structured data → Excel via ClosedXML |
| `RenderHtmlAsync(templateName, data)` | Template name + data object | `string` (HTML) | Template → HTML for preview |
| `RenderInlinePdfAsync(htmlTemplate, data, landscape)` | Raw HTML string + data | `byte[]` (PDF) | Arbitrary HTML → PDF |
| `GetTemplateListAsync()` | — | `IEnumerable<string>` | List all template names |
| `GetTemplateAsync(name)` | Template name | `string?` | Read template content |
| `SaveTemplateAsync(name, content)` | Name + HTML | — | Write/overwrite template file |
| `DeleteTemplateAsync(name)` | Template name | `bool` | Delete template file |

#### Internal Architecture

```
RenderPdfAsync()
  ├── RenderTemplateToHtml()
  │   ├── Load template from JsReportTemplateManager
  │   ├── Apply letterhead branding (JsReportLetterheadBranding)
  │   ├── Serialize data to JSON
  │   └── Call jsreport.RenderAsync() with Recipe.Html
  │       (on WORKER_TIMEOUT → RecreateJsReportServiceAsync + retry once)
  └── ConvertHtmlToPdfAsync()
      ├── EnsureBrowserAsync() — lazy-create shared Puppeteer browser
      ├── Open new page, set HTML content
      ├── page.PdfDataAsync() with margins & format options
      └── Close page, return PDF bytes
```

#### Configuration Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `DefaultRenderTimeoutMs` | 120,000 (2 min) | Standard rendering timeout |
| `LargePayloadRenderTimeoutMs` | 300,000 (5 min) | Timeout for payloads >750KB |
| `LargePayloadThresholdBytes` | 750,000 | Threshold to switch to extended timeout |

#### Chrome Detection

On startup, the service scans these paths (in priority order) for a browser executable:

1. `C:\Program Files\Google\Chrome\Application\chrome.exe`
2. `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
3. `%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`
4. `C:\Program Files\Microsoft\Edge\Application\msedge.exe`
5. `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`

If no browser is found, PDF rendering will fail (HTML preview still works).

#### jsreport Environment Variables

Set during constructor to configure the jsreport child process:

| Variable | Value | Purpose |
|----------|-------|---------|
| `extensions_fs-store_dataDirectory` | `C:\FMSData\JsReport_Temp\data` | Writable data directory |
| `tempDirectory` | `C:\FMSData\JsReport_Temp` | Temp directory |
| `extensions_chrome-pdf_enabled` | `false` | Disable Chrome-PDF recipe |
| `extensions_phantom-pdf_enabled` | `false` | Disable Phantom-PDF recipe |
| `extensions_scripts_enabled` | `false` | Disable script extension |
| `httpPort` | `0` | Random port (avoids EADDRINUSE) |
| `workers_timeout` | `60000` | Worker init timeout (60s) |

#### Stale Process Management

On startup and on WORKER_TIMEOUT recovery:
- Cleans stale `wSock` daemon socket files
- Removes orphaned jsreport binary copies (random-prefix `.exe` files)
- Deletes unprocessed `autocleanup` request JSON files

### 3.2 JsReportTemplateManager

**File:** `JsReportTemplateManager.cs` (242 lines)

File-based template storage with writable path resolution and default seeding.

#### Path Resolution Priority

| Priority | Path | Description |
|----------|------|-------------|
| 1 | `C:\FMSData\reports\templates\` | Shared FMS data root (preferred) |
| 2 | `C:\Logs\FMS.Webclient\ReportTemplates\` | Legacy location |
| 3 | `%TEMP%\FMS_ReportTemplates\` | User temp folder (always writable) |
| 4 | `%ProgramData%\Hyoung\FMS\ReportTemplates\` | System-wide |
| 5 | `{ContentRoot}\App_Data\ReportTemplates\` | App data fallback |

#### Default Template Seeding

On startup, `EnsureSampleTemplatesAsync()` seeds/overwrites 9 built-in templates:

| Template Name | Source Constant |
|--------------|----------------|
| `pump-transaction-report` | `JsReportHtmlTemplates.PumpTransaction()` |
| `vehicle-consumption-report` | `JsReportHtmlTemplates.VehicleConsumption()` |
| `fuel-refill-report` | `JsReportHtmlTemplates.FuelRefill()` |
| `fuel-delivery-report` | `JsReportHtmlTemplates.FuelDelivery()` |
| `device-offline-report` | `JsReportHtmlTemplates.DeviceOffline()` |
| `pts-device-status-report` | `JsReportHtmlTemplates.PtsDeviceStatus()` |
| `tank-volume-history-report` | `JsReportHtmlTemplates.TankVolumeHistory()` |
| `issue-tracker-report` | `JsReportHtmlTemplates.IssueTracker()` |
| `consumption-by-refills-report` | `JsReportHtmlTemplates.ConsumptionByRefills()` |

> Built-in templates are **always overwritten** with the latest embedded version on startup to prevent stale templates.

### 3.3 JsReportLetterheadBranding

**File:** `JsReportLetterheadBranding.cs` (130 lines)

Automatically injects company branding into every rendered report.

#### Logo Resolution

| Priority | Path |
|----------|------|
| 1 | `C:\FMSData\reports\branding\letterhead-logo.png` |
| 2 | `%ProgramData%\Hyoung\FMS\reports\branding\letterhead-logo.png` |
| 3 | `%TEMP%\FMS_Reports\branding\letterhead-logo.png` |

Supported formats: PNG, JPG, SVG, GIF, WebP.

#### Injection Process

```
Apply(templateContent)
  ├── Skip if template already contains "fms-report-letterhead" marker
  ├── InjectCss() → Insert letterhead CSS before </style> or </head>
  └── InjectHtmlBlock() → Insert logo <img> after <body> tag
```

The logo is converted to a **base64 data URI** at startup and embedded directly in the HTML — no external file reference needed at render time.

### 3.4 NotificationReportRenderer

**File:** `NotificationReportRenderer.cs` (45 lines)

A thin bridge between the Notification system and JsReport. Implements `INotificationReportRenderer`.

| Method | Delegates To |
|--------|-------------|
| `RenderPdfAsync(template, data)` | `IJsReportService.RenderPdfAsync()` |
| `RenderExcelAsync(template, data)` | `IJsReportService.RenderExcelAsync()` |
| `RenderHtmlAsync(template, data)` | `IJsReportService.RenderHtmlAsync()` |

Called by the notification scheduler when a **scheduled report email** fires.

### 3.5 ReportJobManager

**File:** `ReportJobManager.cs` (934 lines)

In-memory async job orchestrator for background report generation.

#### Features

| Feature | Implementation |
|---------|---------------|
| Job Store | `ConcurrentDictionary<string, ReportJobDTO>` |
| Result Cache | `ConcurrentDictionary<string, (byte[], DateTime)>` with 30-min TTL |
| Cancellation | `ConcurrentDictionary<string, CancellationTokenSource>` |
| Concurrency | Max 3 concurrent jobs per user |
| Progress | SignalR broadcasts via `IReportJobProgressService` |
| Email Delivery | Optional email of finished PDF/Excel via `IEmailService` |

#### Job Lifecycle

```
SubmitJobAsync()
  ├── Validate concurrency limit (max 3 per user)
  ├── Create JobId: "RPT-{yyyyMMdd-HHmmss}-{8-char-guid}"
  ├── Store in _jobs dictionary
  └── Fire-and-forget Task.Run():
      ├── Status: Queued → FetchingData (10%)
      ├── Fetch data via MediatR / domain service
      ├── Status: FetchingData → Rendering (50%)
      ├── Render via IJsReportService (PDF/Excel/HTML)
      ├── Status: Rendering → Completed (100%)
      ├── Store result bytes in _results (30-min TTL)
      ├── Broadcast completion via SignalR
      └── Optional: Email PDF/Excel attachment
```

#### SignalR Events (via IReportJobProgressService)

| Event | Payload | When |
|-------|---------|------|
| `ReportJobStarted` | `{ jobId, userId, status }` | Job created |
| `ReportJobProgress` | `{ jobId, status, progressPercent, statusMessage }` | Each phase change |
| `ReportJobCompleted` | `{ jobId, status, progressPercent }` | Successful completion |
| `ReportJobError` | `{ jobId, status, errorMessage }` | Failure |

---

## 4. Backend — CQRS Layer

Located in `FMS.Application/Features/Reporting/`

### 4.1 Commands (Write Operations)

| Command | Handler | Response Type | Purpose |
|---------|---------|--------------|---------|
| `GenerateReportCommand` | `GenerateReportCommandHandler` | `GenerateReportResponseDTO` | Generate a report (resolves definition → fetches data → renders → logs execution) |
| `SaveReportTemplateCommand` | `SaveReportTemplateCommandHandler` | `ReportTemplateDTO` | Save user's custom report template configuration |
| `DeleteReportTemplateCommand` | — (inline) | `bool` | Delete a user's template |
| `CreateReportScheduleCommand` | `CreateReportScheduleCommandHandler` | `FMSResponse<ReportScheduleDTO>` | Create a scheduled report email delivery |
| `CancelReportScheduleCommand` | `CancelReportScheduleCommandHandler` | `FMSResponse<bool>` | Cancel (soft-delete) an active schedule |
| `LogReportExecutionCommand` | `LogReportExecutionCommandHandler` | `FMSResponse<ReportExecutionHistoryDTO>` | Explicitly log a report execution with metadata |

#### GenerateReportCommand Flow

```
GenerateReportCommandHandler.Handle()
  ├── Resolve report definition via IReportDefinitionService
  ├── If definition not found → return failure
  ├── Delegate to IReportGenerationService
  │   ├── Fetch data from source endpoint
  │   ├── Apply filters
  │   └── Render in requested format (JSON/PDF/Excel/CSV)
  ├── Build GenerateReportResponseDTO
  └── Auto-log execution to report_execution_history table
```

### 4.2 Queries (Read Operations)

| Query | Handler | Response Type | Purpose |
|-------|---------|--------------|---------|
| `GetReportDefinitionQuery` | `GetReportDefinitionQueryHandler` | `ReportDefinitionDTO?` | Get single definition by string ID |
| `GetAllReportDefinitionsQuery` | `GetAllReportDefinitionsQueryHandler` | `List<ReportDefinitionDTO>` | List all definitions (optional category/active filter) |
| `GetReportTemplatesQuery` | `GetReportTemplatesQueryHandler` | `List<ReportTemplateDTO>` | User's templates + shared ones |
| `GetReportSchedulesQuery` | `GetReportSchedulesQueryHandler` | `FMSResponse<List<ReportScheduleDTO>>` | All schedules (optional status filter) |
| `GetExecutionHistoryQuery` | `GetExecutionHistoryQueryHandler` | `FMSResponse<List<ReportExecutionHistoryDTO>>` | Execution log (optional date range, capped at 500) |

### 4.3 Services

| Interface | Implementation | Purpose |
|-----------|---------------|---------|
| `IReportDefinitionService` | `ReportDefinitionService` | In-memory catalog of built-in report definitions |
| `IReportGenerationService` | `ReportGenerationService` | Data fetching + rendering orchestration |
| `IReportJobManager` | `ReportJobManager` (in WebClient) | Async job lifecycle |
| `IReportJobProgressService` | `ReportJobProgressService` | SignalR event broadcasting |

---

## 5. Backend — Controllers (API Surface)

### 5.1 ReportGeneratorController

**Route:** `api/v1/ReportGenerator`
**Auth:** JWT + `_Read_VehicleConsumption` permission

#### Template Management Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/templates` | `GET` | List all template names |
| `/templates/{name}` | `GET` | Get template HTML content |
| `/templates` | `POST` | Save/update template (body: `{ name, content }`) |
| `/templates/{name}` | `DELETE` | Delete template |

#### Rendering Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/render/pdf/{templateName}` | `POST` | Render PDF (body: data JSON → returns PDF stream) |
| `/render/excel/{templateName}` | `POST` | Render Excel (body: data JSON → returns XLSX stream) |
| `/preview/{templateName}` | `POST` | HTML preview (body: data JSON → returns HTML string) |
| `/render/inline` | `POST` | Inline HTML → PDF (body: `{ template, data }`) |

#### Data Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/pump-transactions` | `GET` | Pump transaction data for reports |
| `/issue-tracker/data` | `GET` | Issue tracker data for reports |

#### Async Job Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/jobs/submit` | `POST` | Submit async background job |
| `/jobs/{jobId}/status` | `GET` | Check job status + progress |
| `/jobs/{jobId}/result` | `GET` | Download completed result |
| `/jobs/{jobId}/result/html` | `GET` | Get HTML result content |
| `/jobs/{jobId}/cancel` | `POST` | Cancel running job |
| `/jobs/{jobId}/email` | `POST` | Email completed result |

### 5.2 ReportingController

**Route:** `api/v1/Reporting`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/definitions` | `GET` | List report definitions (optional category filter) |
| `/definitions/{reportId}` | `GET` | Get specific definition |
| `/generate` | `POST` | Generate report with filters |
| `/templates` | `GET` | User's saved templates |
| `/templates` | `POST` | Save template config |
| `/categories` | `GET` | Report categories |
| `/execution-history` | `GET` | Execution log (date range filter) |
| `/execution-log` | `POST` | Log execution manually |

### 5.3 StockReportController

**Route:** `api/StockReport`

Dedicated tank stock reports: summary, variance analysis, utilisation, and movements.

---

## 6. Backend — Domain Entities & Database

### Entity Relationship Diagram

```
┌─────────────────────┐        ┌──────────────────────┐
│  ReportCategory      │        │  ReportDefinition     │
│  (report_categories) │        │  (report_definitions) │
│                      │───1:N──│                       │
│  ReportCategoryId PK │        │  ReportDefinitionId PK│
│  CategoryName        │        │  ReportId (slug)      │
│  Icon                │        │  ReportName           │
│  DisplayOrder        │        │  Category             │
│  IsActive            │        │  ReportType (enum)    │
└──────────────────────┘        │  DataSourceEndpoint   │
                                │  RequiredPermission   │
                                │  Configuration (JSON) │
                                │  IsActive, IsBuiltIn  │
                                └───────┬───────────────┘
                                        │
                           ┌────────────┼──────────────┐
                           │            │              │
                    ┌──────▼──────┐  ┌──▼────────────┐  │
                    │ReportTemplate│  │ReportExecution│  │
                    │(report_     │  │History         │  │
                    │ templates)  │  │(report_        │  │
                    │             │  │ execution_     │  │
                    │TemplateId   │  │ history)       │  │
                    │TemplateName │  │                │  │
                    │Configuration│  │ExecutedBy      │  │
                    │IsDefault    │  │Filters (JSON)  │  │
                    │IsShared     │  │ExportFormat    │  │
                    │CreatedBy    │  │ExecutionTimeMs │  │
                    └─────────────┘  │Success         │  │
                                     │ErrorMessage    │  │
                                     └────────────────┘  │
                                                         │
                                     ┌───────────────────▼┐
                                     │  ReportSchedule     │
                                     │  (report_schedules) │
                                     │                     │
                                     │  ScheduleName       │
                                     │  ReportSourceId     │
                                     │  Filters (JSON)     │
                                     │  OutputFormat        │
                                     │  Frequency           │
                                     │  Recipients (JSON)   │
                                     │  ScheduleConfig(JSON)│
                                     │  Status              │
                                     │  NextExecutionAt     │
                                     └─────────────────────┘
```

### Entity Details

#### ReportDefinition (`report_definitions`)

| Column | Type | Description |
|--------|------|-------------|
| `ReportDefinitionId` | INT PK | Auto-increment ID |
| `ReportId` | VARCHAR(100) | Unique slug (e.g., `pump-transaction`) |
| `ReportName` | VARCHAR(200) | Display name |
| `Description` | TEXT | Detailed description |
| `Category` | VARCHAR(100) | Category grouping |
| `ReportType` | INT | 0=DataGrid, 1=PivotGrid, 2=Chart, 3=Dashboard |
| `Icon` | VARCHAR | FontAwesome icon class |
| `DataSourceEndpoint` | VARCHAR(500) | API endpoint for data |
| `RequiredPermission` | VARCHAR | Permission key |
| `Configuration` | JSON TEXT | Columns, groupings, summaries, pivot config |
| `IsActive` | BOOL | Active flag |
| `IsPublic` | BOOL | Public access flag |
| `IsBuiltIn` | BOOL | System built-in flag |
| Audit | — | CreatedAt/By, ModifiedAt/By, DeletedAt/By, IsDeleted |

#### ReportSchedule (`report_schedules`)

| Column | Type | Description |
|--------|------|-------------|
| `ReportScheduleId` | BIGINT PK | Auto-increment ID |
| `ScheduleName` | VARCHAR(200) | Schedule display name |
| `Description` | TEXT | Description |
| `ReportSourceId` | VARCHAR(100) | Source ID from registry |
| `Filters` | JSON TEXT | Filter parameters as JSON |
| `OutputFormat` | VARCHAR | `pdf`, `html`, `excel`, `csv` |
| `Frequency` | VARCHAR | `once`, `daily`, `weekly`, `monthly` |
| `RepeatCount` | INT | 0 = unlimited |
| `ExecutedCount` | INT | Times executed so far |
| `Recipients` | JSON TEXT | Array of email addresses |
| `ScheduleConfig` | JSON TEXT | `{ periodType, days, weeks, time, timeZone }` |
| `ScheduledAt` | DATETIME | When to first execute |
| `LastExecutedAt` | DATETIME | Last execution timestamp |
| `NextExecutionAt` | DATETIME | Calculated next execution |
| `Status` | VARCHAR | `active`, `paused`, `completed`, `cancelled`, `failed` |
| `ErrorMessage` | TEXT | Last error message |
| Audit | — | CreatedBy/At, ModifiedBy/At, CancelledBy/At |

#### ReportExecutionHistory (`report_execution_history`)

| Column | Type | Description |
|--------|------|-------------|
| `ReportExecutionId` | BIGINT PK | Auto-increment ID |
| `ReportDefinitionId` | INT FK | Links to definition |
| `ExecutedBy` | VARCHAR | User ID |
| `ExecutedAt` | DATETIME | Execution timestamp |
| `Filters` | JSON TEXT | Applied filter parameters |
| `ExportFormat` | VARCHAR | `json`, `pdf`, `excel`, `csv`, `html` |
| `RecordCount` | INT | Number of records in result |
| `ExecutionTimeMs` | LONG | Duration in milliseconds |
| `Success` | BOOL | Success flag |
| `ErrorMessage` | TEXT | Error details (if failed) |
| `IpAddress` | VARCHAR | Client IP |
| `UserAgent` | VARCHAR | Client user agent |

---

## 7. Templates — Engine, Storage & Branding

### 7.1 Template Engine (Handlebars)

Templates use the **Handlebars** syntax. jsreport compiles the template and merges it with data to produce HTML.

#### Standard Template Data Shape

Every report template receives this standardised payload:

```json
{
  "reportTitle": "Pump Transactions — January 2026",
  "generatedAt": "2026-01-31 18:30:00",
  "generatedBy": "John Doe",
  "dateFrom": "2026-01-01",
  "dateTo": "2026-01-31",
  "reportId": "RPT-20260131-abc12345",
  "records": [
    { "date": "2026-01-15", "vehicle": "KBY 123A", "litres": 45.5, ... },
    ...
  ],
  "summary": {
    "totalRecords": 150,
    "totalVolume": "4,567.50",
    "totalAmount": "6,851.25",
    ...
  }
}
```

#### Key Handlebars Helpers

```handlebars
{{reportTitle}}              <!-- Simple value -->
{{#each records}}            <!-- Loop over array -->
  {{this.date}}              <!-- Access current item -->
  {{@index}}                 <!-- Loop index (0-based) -->
{{/each}}
{{#if summary}}              <!-- Conditional block -->
  {{summary.totalVolume}}
{{/if}}
```

### 7.2 Template Storage

Templates are stored as `.html` files on disk:

```
C:\FMSData\reports\templates\
├── pump-transaction-report.html
├── vehicle-consumption-report.html
├── fuel-refill-report.html
├── fuel-delivery-report.html
├── device-offline-report.html
├── pts-device-status-report.html
├── tank-volume-history-report.html
├── issue-tracker-report.html
├── consumption-by-refills-report.html
└── [custom-templates].html
```

#### Template Lifecycle

```
Startup:
  EnsureSampleTemplatesAsync()
  ├── For each of 9 built-in templates:
  │   ├── Read embedded template from JsReportHtmlTemplates.cs
  │   ├── Compare with on-disk version
  │   └── If different → overwrite (keeps templates up-to-date)
  └── Custom templates are never touched

Runtime:
  GetTemplateAsync(name)
  ├── Read from disk: {templatesPath}/{name}.html
  └── If not found → return null (caller handles fallback)

  SaveTemplateAsync(name, content)
  └── Write to disk: {templatesPath}/{name}.html

  DeleteTemplateAsync(name)
  └── Delete file from disk (built-in templates regenerate on restart)
```

### 7.3 Letterhead Branding

Every rendered report automatically receives company branding:

```
Logo Location: C:\FMSData\reports\branding\letterhead-logo.png

Apply(templateContent):
1. Convert logo → base64 data URI (done once at startup)
2. Inject CSS:
   .fms-report-letterhead { margin: 0 0 18px 0; padding-bottom: 10px; border-bottom: 2px solid #d1d5db; }
   .fms-report-letterhead img { width: 100%; max-height: 140px; object-fit: contain; }
3. Inject HTML after <body>:
   <div class="fms-report-letterhead">
     <img src="data:image/png;base64,..." alt="Company Letterhead" />
   </div>
```

If no logo file exists, the letterhead block is silently skipped.

---

## 8. Frontend — Module Structure

### Route Map

**Entry Point:** `ReportsMain.js` — defines all routes under `/reports/*`

| Route | Component | Description |
|-------|-----------|-------------|
| `/reports` | `ReportsDashboard` | Landing page with quick-action cards |
| `/reports/dashboard` | `ReportsDashboard` | Same as above |
| `/reports/list` | `ReportListPage` | DataGrid listing of all reports |
| `/reports/engine` | `ReportEngine` | Source picker + generation |
| `/reports/engine/:sourceId` | `ReportEngine` | Generate report for specific source |
| `/reports/templates` | `TemplateManager` | Template CRUD grid |
| `/reports/templates/designer/:templateName` | `TemplateDesigner` | Monaco editor + preview |
| `/reports/scheduling` | `ReportScheduleManager` | Schedule management |
| `/reports/monitoring` | `ReportMonitorDashboard` | Execution history |
| `/reports/fuel-importer` | `FuelReportImporter` | Data import |
| `/reports/import-management` | `ImportManagementPage` | Import management |

**Legacy Routes (backward compatibility):**

| Route | Component |
|-------|-----------|
| `/reports/tank-volume-history` | `TankVolumeHistoryReport` |
| `/reports/consumption-refills` | `ConsumptionBasedOnRefills` |
| `/reports/vehicle-consumption` | `VehicleConsumptionReport` |
| `/reports/pts-offline` | `PTSOfflineReport` |

### Component Hierarchy

```
ReportsMain (Router)
└── ReportsLayout (Sidebar + Content Area)
    ├── ReportsDashboard
    │   └── Quick-action cards per source
    │
    ├── ReportEngine
    │   ├── Source SelectBox (top bar)
    │   ├── ReportParameterForm (dynamic filters)
    │   ├── ReportFormatSelector (HTML/PDF/Excel/CSV)
    │   ├── ReportOutputViewer (iframe for HTML)
    │   ├── RequestReportEmailPanel (send via email)
    │   └── ScheduleReportPanel (create schedule)
    │
    ├── TemplateManager
    │   ├── DataGrid (template list)
    │   ├── Create popup
    │   └── Delete confirmation popup
    │
    ├── TemplateDesigner
    │   ├── Monaco Editor (left pane)
    │   └── Preview iframe (right pane)
    │
    ├── ReportScheduleManager
    │   ├── DataGrid (schedule list)
    │   ├── ScheduleReportPanel (create)
    │   ├── SlidePanel (edit)
    │   └── ReportScheduleDetailPanel (view)
    │
    └── ReportMonitorDashboard
        ├── DateRangeBox (filter)
        ├── Stat tiles (M365 style)
        ├── DataGrid (execution history)
        └── SlidePanel (execution detail)
```

### Frontend Service Layer

**File:** `reportingService.js` (780+ lines) — singleton `ReportingService` class

**30 methods** covering:
- Report definitions CRUD
- JsReport template CRUD (list, get, save, delete)
- JsReport rendering (preview HTML, render PDF, render Excel)
- Schedule management (create, list, update, cancel, delete)
- Execution logging
- DevExtreme legacy reports (backward compat)
- Utility: `downloadReportFile()`, `extractReportErrorMessage()`

---

## 9. Frontend — Report Engine (Generation Flow)

The `ReportEngine` component (`engine/ReportEngine.js`, 786 lines) is the central orchestrator.

### State Management

| State | Type | Purpose |
|-------|------|---------|
| `activeSourceId` | string | Currently selected source |
| `filters` | object | Dynamic filter values |
| `selectedFormat` | string | `html`, `pdf`, `excel`, `csv` |
| `templateOverride` | string | Custom template (overrides source default) |
| `generating` | boolean | Sync generation in progress |
| `htmlContent` | string | Rendered HTML for viewer |
| `lastGenerated` | Date | Timestamp of last generation |

### Generation Flow

```
User clicks "Generate"
  │
  ├── Validate required parameters
  ├── Validate date range (start ≤ end)
  ├── Resolve template name (override or source default)
  │
  ├── [pump-transaction source] → Sync path:
  │   ├── Call reportingService.generatePumpTransactionReport()
  │   ├── Display HTML or download PDF/Excel
  │   └── Log execution
  │
  ├── [Other sources — HTML format] → Sync-first path:
  │   ├── Fetch data via reportingService.fetchReportData()
  │   ├── Normalise via buildJsReportPayload()
  │   ├── Estimate payload size
  │   ├── If large (>200 records or >300KB):
  │   │   └── Fall through to async path ↓
  │   ├── If small → Sync preview:
  │   │   ├── Call reportingService.previewJsReport()
  │   │   ├── Display in ReportOutputViewer (iframe)
  │   │   └── Log execution
  │   └── On timeout → Fall through to async path ↓
  │
  └── [All other cases] → Async background job:
      ├── Submit via reportingService (POST /jobs/submit)
      ├── useReportJobTracking hook monitors via SignalR
      ├── Show progress bar with status updates
      ├── After 10s, show "Email When Done" button
      └── On completion:
          ├── HTML → fetchHtmlContent() + display
          └── PDF/Excel → auto-download
```

### Data Normalisation (reportDataBuilder.js)

The `buildJsReportPayload()` function transforms diverse API responses into a standardised template payload:

```
API Response (varies per source)
       │
findRecordCollection()  → Unwrap: data, data.data, data.records, data.items
       │
Source-specific mapper  → Field name normalisation + summary calculation
       │
Standardised payload:
{
  reportTitle, generatedAt, generatedBy,
  dateFrom, dateTo, reportId,
  records: [...],
  summary: { totalRecords, ... }
}
```

**Per-source mappers exist for all 10 sources**, handling field name variations (e.g., `VehicleRegNo` vs `vehicleRegistration`) and computing summaries (totals, averages, formatted values).

---

## 10. Frontend — Template Management

### TemplateManager Component

**File:** `templates/TemplateManager.js` (287 lines)

A DataGrid-based CRUD interface for Handlebars templates.

#### Features

| Feature | Implementation |
|---------|---------------|
| List Templates | `GET /api/v1/ReportGenerator/templates` |
| Create Template | Save with `DEFAULT_TEMPLATE` boilerplate, navigate to designer |
| Edit Template | Navigate to `/reports/templates/designer/{name}` |
| Delete Template | Confirmation popup → `DELETE /api/v1/ReportGenerator/templates/{name}` |
| Preview | Navigate to designer with preview trigger |

### TemplateDesigner Component

**File:** `templates/TemplateDesigner.js` (232 lines)

Split-pane editor: Monaco Editor (left) + Live Preview iframe (right).

#### Features

| Feature | Implementation |
|---------|---------------|
| Code Editing | Monaco Editor with HTML + Handlebars syntax highlighting |
| Live Preview | Save template → render with sample data → display in iframe |
| Dirty Tracking | Compare current content vs. original; show save prompt |
| Sample Data | Hardcoded `SAMPLE_DATA` object for preview rendering |
| Save | `POST /api/v1/ReportGenerator/templates` |
| Back Navigation | Return to TemplateManager |

#### Template Designer Flow

```
1. Load template content → Display in Monaco Editor
2. User edits HTML/Handlebars code
3. Click "Preview":
   a. If dirty → auto-save first
   b. POST to /preview/{templateName} with SAMPLE_DATA
   c. Write HTML response to preview iframe
4. Click "Save" → POST template content to backend
5. Click "Back" → Navigate to /reports/templates
```

---

## 11. Frontend — Scheduling

### ReportScheduleManager Component

**File:** `scheduling/ReportScheduleManager.js` (541 lines)

Full schedule management with M365 Admin Center design.

#### Features

| Feature | Implementation |
|---------|---------------|
| List Schedules | DataGrid with status badges, frequency, recipients, delivery stats |
| Create Schedule | Open `ScheduleReportPanel` (slide-in). Pre-populate if `?source=` param present |
| Edit Schedule | Parse existing schedule → open edit panel → `PUT /scheduled-emails/{id}` |
| View Details | Open `ReportScheduleDetailPanel` (slide-in) |
| Cancel Schedule | `POST /scheduled-emails/{id}/cancel` |
| Delete Schedule | `DELETE /scheduled-emails/{id}` |

#### Schedule Data Structure

```json
{
  "Type": 2,
  "CategoryId": 20,
  "schedulerVersion": 3,
  "scheduleName": "Daily Pump Transactions",
  "reportSourceId": "pump-transaction",
  "filters": {
    "siteId": 5,
    "dateRange": "last24hours"
  },
  "recipients": ["user@example.com", "manager@example.com"],
  "outputFormat": "pdf",
  "frequency": "daily",
  "scheduleConfig": {
    "hour": 8,
    "minute": 0,
    "timezone": "Africa/Nairobi"
  }
}
```

#### Integration with Notification System

Schedules piggyback on the existing notification infrastructure:
- Stored as notifications with `Type: 2` (Scheduled Report) and `CategoryId: 20`
- The notification scheduler handles timing, retries, and delivery tracking
- `NotificationReportRenderer` bridges to JsReport for rendering
- Per-recipient delivery status reuses notification tracking

---

## 12. Frontend — Monitoring & Execution History

### ReportMonitorDashboard Component

**File:** `monitoring/ReportMonitorDashboard.js` (402 lines)

M365 Admin Center-styled execution history dashboard.

#### Features

| Feature | Implementation |
|---------|---------------|
| Date Range Filter | `DateRangeBox` — defaults to last 7 days |
| Stat Tiles | Total executions, success rate, average duration, format breakdown |
| Execution Grid | DataGrid with columns: timestamp, user, source, format, duration, status |
| Detail Panel | `ReportExecutionLog` in a SlidePanel — full execution details + filters |
| User Resolution | Maps user GUIDs to display names using JWT claims |
| Source Resolution | Extracts source name from JSON filters field |

#### Data Flow

```
Component Mount:
  GET /Reporting/execution-history?dateFrom=...&dateTo=...
  │
  ├── Map executions → add executedByDisplay, reportSourceDisplay
  ├── Calculate stats: totalExecutions, successRate, avgDuration
  └── Render grid + stat tiles

Row Click:
  Open SlidePanel with ReportExecutionLog
  └── Show all execution metadata, filters, error messages
```

---

## 13. Sequence Flows

### 13.1 Report Generation — HTML Preview (Sync Path)

```
┌──────────┐     ┌───────────────────┐     ┌──────────────────────┐     ┌───────────────┐
│  Browser  │     │  ReportEngine.js  │     │  reportingService.js │     │  Backend API  │
└─────┬────┘     └────────┬──────────┘     └──────────┬───────────┘     └───────┬───────┘
      │                   │                           │                         │
      │  Click "Generate" │                           │                         │
      │──────────────────>│                           │                         │
      │                   │                           │                         │
      │                   │  Validate params          │                         │
      │                   │  buildQueryParams()       │                         │
      │                   │                           │                         │
      │                   │  fetchReportData()        │                         │
      │                   │──────────────────────────>│                         │
      │                   │                           │  GET /api/v1/{endpoint} │
      │                   │                           │────────────────────────>│
      │                   │                           │                         │
      │                   │                           │  JSON response          │
      │                   │                           │<────────────────────────│
      │                   │  Raw API data             │                         │
      │                   │<──────────────────────────│                         │
      │                   │                           │                         │
      │                   │  buildJsReportPayload()   │                         │
      │                   │  (normalize data)         │                         │
      │                   │                           │                         │
      │                   │  previewJsReport()        │                         │
      │                   │──────────────────────────>│                         │
      │                   │                           │  POST /preview/{tpl}    │
      │                   │                           │────────────────────────>│
      │                   │                           │                         │
      │                   │                           │  ┌─ JsReportService ──┐ │
      │                   │                           │  │ Load template      │ │
      │                   │                           │  │ Apply branding     │ │
      │                   │                           │  │ Render Handlebars  │ │
      │                   │                           │  └────────────────────┘ │
      │                   │                           │                         │
      │                   │                           │  HTML string            │
      │                   │                           │<────────────────────────│
      │                   │  HTML content             │                         │
      │                   │<──────────────────────────│                         │
      │                   │                           │                         │
      │                   │  Display in iframe        │                         │
      │  Show report      │                           │                         │
      │<──────────────────│                           │                         │
      │                   │                           │                         │
      │                   │  logExecution() (async)   │                         │
      │                   │──────────────────────────>│  POST /execution-log   │
      │                   │                           │────────────────────────>│
```

### 13.2 Report Generation — PDF Download (Async Job Path)

```
┌──────────┐     ┌───────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐
│  Browser  │     │  ReportEngine.js  │    │ reportingService │    │ ReportGenerator  │    │ ReportJobMgr   │
│           │     │  + jobTracking    │    │                  │    │ Controller       │    │                │
└─────┬────┘     └────────┬──────────┘    └────────┬─────────┘    └────────┬─────────┘    └───────┬────────┘
      │                   │                        │                       │                      │
      │  Click "Generate" │                        │                       │                      │
      │  (format: pdf)    │                        │                       │                      │
      │──────────────────>│                        │                       │                      │
      │                   │                        │                       │                      │
      │                   │  submitReportJob()     │                       │                      │
      │                   │───────────────────────>│                       │                      │
      │                   │                        │  POST /jobs/submit    │                      │
      │                   │                        │──────────────────────>│                      │
      │                   │                        │                       │  SubmitJobAsync()    │
      │                   │                        │                       │─────────────────────>│
      │                   │                        │                       │                      │
      │                   │                        │                       │  { jobId: RPT-... }  │
      │                   │                        │                       │<─────────────────────│
      │                   │                        │  { jobId, status }    │                      │
      │                   │                        │<──────────────────────│                      │
      │                   │  Start tracking        │                       │                      │
      │                   │<───────────────────────│                       │                      │
      │                   │                        │                       │                      │
      │  Show progress    │                        │                       │     ┌──── Background Task ────┐
      │  bar (0%)         │                        │                       │     │ Fetch data via MediatR  │
      │<──────────────────│                        │                       │     │ SignalR: 10% → 50%      │
      │                   │                        │                       │     │ Render PDF (Puppeteer)  │
      │                   │       ← SignalR "ReportJobProgress" events ──────── │ SignalR: 50% → 100%     │
      │                   │                        │                       │     │ Store bytes (30m TTL)   │
      │  Progress: 50%    │                        │                       │     └─────────────────────────┘
      │<──────────────────│                        │                       │                      │
      │                   │                        │                       │                      │
      │                   │       ← SignalR "ReportJobCompleted" ──────────────────────────────── │
      │                   │                        │                       │                      │
      │                   │  downloadResult()      │                       │                      │
      │                   │───────────────────────>│                       │                      │
      │                   │                        │  GET /jobs/{id}/result│                      │
      │                   │                        │──────────────────────>│  Get from _results   │
      │                   │                        │                       │─────────────────────>│
      │                   │                        │                       │                      │
      │                   │                        │  PDF binary stream    │                      │
      │                   │                        │<──────────────────────│                      │
      │                   │  Trigger download      │                       │                      │
      │  Save file dialog │                        │                       │                      │
      │<──────────────────│                        │                       │                      │
```

### 13.3 Template Creation & Editing

```
┌──────────┐     ┌─────────────────┐    ┌──────────────────┐    ┌──────────────────────┐    ┌────────────────┐
│  Browser  │     │ TemplateManager │    │ TemplateDesigner │    │  reportingService    │    │ ReportGenerator │
│           │     │                 │    │                  │    │                      │    │ Controller      │
└─────┬────┘     └────────┬────────┘    └────────┬─────────┘    └──────────┬───────────┘    └───────┬────────┘
      │                   │                      │                         │                        │
      │  Click "New"      │                      │                         │                        │
      │──────────────────>│                      │                         │                        │
      │                   │                      │                         │                        │
      │  Enter name       │                      │                         │                        │
      │  in popup         │                      │                         │                        │
      │──────────────────>│                      │                         │                        │
      │                   │  saveJsReportTemplate(name, DEFAULT_TEMPLATE)  │                        │
      │                   │───────────────────────────────────────────────>│                        │
      │                   │                      │                         │  POST /templates       │
      │                   │                      │                         │───────────────────────>│
      │                   │                      │                         │                        │
      │                   │                      │                         │  ┌─ TemplateManager ─┐ │
      │                   │                      │                         │  │ Write .html file  │ │
      │                   │                      │                         │  └───────────────────┘ │
      │                   │                      │                         │                        │
      │                   │                      │                         │  "Saved"               │
      │                   │                      │                         │<───────────────────────│
      │                   │  Navigate to designer│                         │                        │
      │                   │─────────────────────>│                         │                        │
      │                   │                      │                         │                        │
      │  Monaco Editor    │                      │  Load template          │                        │
      │  with code        │                      │─────────────────────────│  GET /templates/{name} │
      │<─────────────────────────────────────────│                         │───────────────────────>│
      │                   │                      │                         │                        │
      │  User edits code  │                      │                         │                        │
      │──────────────────────────────────────────│                         │                        │
      │                   │                      │                         │                        │
      │  Click "Preview"  │                      │                         │                        │
      │──────────────────────────────────────────│                         │                        │
      │                   │                      │  Auto-save if dirty     │                        │
      │                   │                      │─────────────────────────│  POST /templates       │
      │                   │                      │                         │───────────────────────>│
      │                   │                      │                         │                        │
      │                   │                      │  previewJsReport()      │                        │
      │                   │                      │─────────────────────────│  POST /preview/{name}  │
      │                   │                      │                         │───────────────────────>│
      │                   │                      │                         │                        │
      │  Preview iframe   │                      │  HTML response          │                        │
      │  updated          │                      │<────────────────────────│                        │
      │<─────────────────────────────────────────│                         │                        │
      │                   │                      │                         │                        │
      │  Click "Save"     │                      │  saveJsReportTemplate() │                        │
      │──────────────────────────────────────────│─────────────────────────│  POST /templates       │
      │                   │                      │                         │───────────────────────>│
      │                   │                      │                         │                        │
      │  ✓ "Saved"        │                      │                         │                        │
      │<─────────────────────────────────────────│                         │                        │
```

### 13.4 Schedule Creation & Execution

```
┌──────────┐     ┌──────────────────┐    ┌──────────────────┐    ┌────────────────────┐    ┌──────────────────┐
│  Browser  │     │ ScheduleManager  │    │ reportingService │    │  Backend API       │    │ Notification     │
│           │     │                  │    │                  │    │                    │    │ Scheduler        │
└─────┬────┘     └────────┬─────────┘    └────────┬─────────┘    └────────┬───────────┘    └────────┬─────────┘
      │                   │                       │                       │                         │
      │  Click "New       │                       │                       │                         │
      │  Schedule"        │                       │                       │                         │
      │──────────────────>│                       │                       │                         │
      │                   │                       │                       │                         │
      │  Open Schedule    │                       │                       │                         │
      │  Panel            │                       │                       │                         │
      │<──────────────────│                       │                       │                         │
      │                   │                       │                       │                         │
      │  Fill form:       │                       │                       │                         │
      │  - Source          │                       │                       │                         │
      │  - Filters         │                       │                       │                         │
      │  - Recipients      │                       │                       │                         │
      │  - Frequency       │                       │                       │                         │
      │  - Format          │                       │                       │                         │
      │──────────────────>│                       │                       │                         │
      │                   │                       │                       │                         │
      │  Click "Create"   │                       │                       │                         │
      │──────────────────>│                       │                       │                         │
      │                   │  scheduleReportEmail() │                       │                         │
      │                   │──────────────────────>│                       │                         │
      │                   │                       │  POST /schedule-email │                         │
      │                   │                       │──────────────────────>│                         │
      │                   │                       │                       │                         │
      │                   │                       │                       │  Store as Notification  │
      │                   │                       │                       │  Type:2, CategoryId:20  │
      │                   │                       │                       │──────────────────────── │
      │                   │                       │                       │                         │
      │                   │                       │  { success, data }    │                         │
      │                   │                       │<──────────────────────│                         │
      │  ✓ "Created"      │                       │                       │                         │
      │<──────────────────│                       │                       │                         │
      │                   │                       │                       │                         │
      │                   │                       │                       │                         │
      │  ─ ─ ─ ─ ─ ─ ─ ─ AT SCHEDULED TIME ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                         │
      │                   │                       │                       │                         │
      │                   │                       │                       │  Notification fires     │
      │                   │                       │                       │<────────────────────────│
      │                   │                       │                       │                         │
      │                   │                       │                       │  ┌── NotificationReport-│
      │                   │                       │                       │  │   Renderer           │
      │                   │                       │                       │  │                      │
      │                   │                       │                       │  │  Fetch report data   │
      │                   │                       │                       │  │  Render via JsReport │
      │                   │                       │                       │  │  Get PDF/Excel bytes │
      │                   │                       │                       │  └──────────────────────│
      │                   │                       │                       │                         │
      │                   │                       │                       │  Send email with        │
      │                   │                       │                       │  PDF/Excel attachment   │
      │                   │                       │                       │──────────────────────── │
      │                   │                       │                       │                         │
      │                   │                       │                       │  Update schedule:       │
      │                   │                       │                       │  lastExecutedAt,        │
      │                   │                       │                       │  executedCount++,       │
      │                   │                       │                       │  nextExecutionAt        │
      │                   │                       │                       │──────────────────────── │
```

---

## 14. Report Source Registry

The frontend uses a **`Map`-based registry** (`reportSourceRegistry.js`) to define all available report sources as pure configuration objects.

### Registered Sources

| Source ID | Name | Category | Default Template | API Endpoint |
|-----------|------|----------|-----------------|--------------|
| `pump-transaction` | Pump Transaction Report | Fuel Management | `pump-transaction-report` | `/ReportGenerator/pump-transactions` |
| `vehicle-consumption` | Vehicle Consumption Report | Fuel Management | `vehicle-consumption-report` | `/VehicleConsumption/filtered` |
| `fuel-refill` | Fuel Refill Report | Fuel Management | `fuel-refill-report` | `/FuelRefill/filtered` |
| `delivery` | Fuel Delivery Report | Fuel Management | `fuel-delivery-report` | `/FuelDelivery/filtered` |
| `tank-volume-history` | Tank Volume History | Fuel Management | `tank-volume-history-report` | `/TankVolumeHistory/data` |
| `consumption-by-refills` | Consumption by Refills | Fuel Management | `consumption-by-refills-report` | `/Consumption/by-refills` |
| `device-offline` | Device Offline Report | Device Management | `device-offline-report` | `/DeviceOffline/filtered` |
| `pts-device` | PTS Device Status | Device Management | `pts-device-status-report` | `/PTSDevice/status` |
| `issue-tracker` | Issue Tracker Report | Operations | `issue-tracker-report` | `/ReportGenerator/issue-tracker/data` |
| `transaction-history-summary` | Transaction History Summary | Fuel Management | `transaction-history-summary-report` | `/ReportGenerator/transaction-history-summary` |

### Source Definition Shape

```javascript
{
  id: 'pump-transaction',           // Unique identifier
  name: 'Pump Transaction Report',  // Display name
  category: 'Fuel Management',      // Grouping category
  categoryIcon: 'fa-light fa-gas-pump',
  icon: 'fa-light fa-receipt',      // Source icon
  description: '...',               // Description text
  apiEndpoint: '/ReportGenerator/pump-transactions',
  defaultTemplate: 'pump-transaction-report',
  supportedFormats: ['html', 'pdf', 'excel', 'csv'],
  permission: '_Read_PumpTransaction',
  parameters: [                     // Dynamic filter definitions
    {
      key: 'startDate',
      type: 'date',
      required: true,
      label: 'Start Date',
      defaultValue: () => startOfMonth()
    },
    {
      key: 'siteId',
      type: 'lookup',
      lookupSource: 'sites',
      label: 'Site',
      required: false
    },
    ...
  ],
  defaultFilters: { ... }
}
```

### Parameter Types

| Type | UI Control | Description |
|------|-----------|-------------|
| `date` | DateBox | Date picker |
| `lookup` | SelectBox | Dropdown loaded from Redux store |
| `text` | TextBox | Free text input |
| `number` | NumberBox | Numeric input |
| `select` | SelectBox | Static option list |
| `multiselect` | TagBox | Multi-select dropdown |

---

## 15. Report Creation & Modification

### Creating a New Report Source

**Detailed step-by-step to add a new report to the system:**

#### Step 1: Create Source Definition (Frontend)

```
fms.frontend/src/pages/reports/sources/newSource.js
```

Define the configuration object with id, name, category, apiEndpoint, parameters, etc.

#### Step 2: Register in Source Registry

```
fms.frontend/src/pages/reports/sources/reportSourceRegistry.js
```

Import and add to the `builtInSources` array.

#### Step 3: Add Data Mapper

```
fms.frontend/src/pages/reports/engine/reportDataBuilder.js
```

Add a case in the source-specific mapper switch and create a mapping function.

#### Step 4: Create Handlebars Template

Either:
- **File-based:** Create `.html` at `C:\FMSData\reports\templates\{name}.html`
- **Embedded:** Add constant in `JsReportHtmlTemplates.cs` and register in `JsReportTemplateManager.EnsureSampleTemplatesAsync()`

#### Step 5 (Optional): Add Custom Lookup

If the report needs a new lookup type, add to `LOOKUP_CONFIG` in `ReportParameterForm.js`.

#### Step 6 (Optional): Add Backend Data Endpoint

If no existing endpoint provides the data, create one in the relevant controller.

### Modifying an Existing Report

| What to Modify | Where | Impact |
|---------------|-------|--------|
| Filter parameters | Source definition file (frontend) | Changes the parameter form |
| Data fields / mapping | `reportDataBuilder.js` | Changes how API data maps to template fields |
| Template HTML/CSS | Template file on disk or via Template Designer UI | Changes rendered output appearance |
| API endpoint | Source definition `apiEndpoint` field | Changes where data comes from |
| Permissions | Source definition `permission` field | Changes who can access the report |
| Supported formats | Source definition `supportedFormats` array | Changes format picker options |

---

## 16. Template Creation & Modification

### Creating a Custom Template

#### Via UI (Template Manager)

1. Navigate to `/reports/templates`
2. Click "New Template"
3. Enter template name in popup
4. System creates file with boilerplate HTML
5. Redirects to Template Designer (Monaco Editor)
6. Edit Handlebars HTML code
7. Click "Preview" to see rendered output with sample data
8. Click "Save" to persist

#### Via File System

1. Create `{template-name}.html` in `C:\FMSData\reports\templates\`
2. Write Handlebars HTML content
3. Template is immediately available via API

#### Via Embedded Default (Built-in)

1. Add template string constant to `JsReportHtmlTemplates.cs`
2. Register in `JsReportTemplateManager.EnsureSampleTemplatesAsync()`
3. Template auto-seeds on next application startup

### Modifying a Template

#### Via UI (Template Designer)

1. Navigate to `/reports/templates`
2. Click "Edit" on the target template row
3. Monaco Editor opens with current content
4. Make edits
5. Click "Preview" to verify (auto-saves if dirty)
6. Click "Save" when satisfied

#### Via File System

1. Edit the `.html` file directly at `C:\FMSData\reports\templates\{name}.html`
2. Changes take effect on next render (no restart needed)

> **Note:** Built-in templates are overwritten on application startup. To customise a built-in template, either update the embedded source in `JsReportHtmlTemplates.cs` or create a new custom template with a different name.

### Template Variables Reference

| Variable | Available In | Source |
|----------|-------------|--------|
| `{{reportTitle}}` | All templates | Set by `buildJsReportPayload()` |
| `{{generatedAt}}` | All templates | Current timestamp |
| `{{generatedBy}}` | All templates | Current user name |
| `{{dateFrom}}` / `{{dateTo}}` | All templates | Filter date range |
| `{{reportId}}` | All templates | Generated report ID |
| `{{records}}` | All templates | Array of normalised data rows |
| `{{summary}}` | All templates | Calculated summary object |
| `{{summary.totalRecords}}` | All templates | Record count |
| Source-specific fields | Per-source | Defined by data mapper |

---

## 17. Schedule Creation, Execution & Modification

### Creating a Schedule

1. Navigate to `/reports/scheduling`
2. Click "New Schedule" → Opens `ScheduleReportPanel`
3. Fill the form:
   - **Report Source:** Select from dropdown (all 10 sources available)
   - **Filters:** Dynamic parameter form (same as report engine)
   - **Recipients:** Email addresses (comma-separated or multi-input)
   - **Frequency:** Once, Daily, Weekly, Monthly
   - **Schedule Config:** Time of day, timezone, specific days
   - **Output Format:** PDF, Excel, HTML
4. Click "Create Schedule"
5. Backend stores as notification (Type: 2, CategoryId: 20)
6. Schedule appears in the grid as "Active"

### Schedule Execution

When the notification scheduler fires:

1. Notification system triggers the scheduled report
2. `NotificationReportRenderer` is invoked
3. Report data is fetched from the source endpoint
4. Data is rendered via `IJsReportService` in the requested format
5. Output is attached to an email
6. Email is sent to all recipients
7. Schedule is updated:
   - `lastExecutedAt` = now
   - `executedCount++`
   - `nextExecutionAt` = calculated based on frequency
   - If `repeatCount > 0 && executedCount >= repeatCount` → status = `completed`
8. Delivery status per recipient is tracked

### Modifying a Schedule

1. Navigate to `/reports/scheduling`
2. Click "Edit" on the target schedule row
3. System parses existing schedule data:
   - Recipients (filter to email-type only)
   - Filters (handle .NET JsonElement serialisation artifacts)
   - Schedule config (period, time, timezone)
4. Edit form opens in a slide panel
5. Make changes
6. Click "Save" → `PUT /scheduled-emails/{id}`
7. Grid refreshes with updated data

### Cancelling a Schedule

1. Click "Cancel" on the schedule row
2. Confirmation dialog appears
3. On confirm → `POST /scheduled-emails/{id}/cancel`
4. Schedule status changes to "Cancelled"
5. No further executions will occur

### Deleting a Schedule

1. Click "Delete" on the schedule row (only for cancelled/completed)
2. Confirmation dialog
3. `DELETE /scheduled-emails/{id}`
4. Schedule removed from grid

---

## 18. Monitoring & Execution Tracking

### Automatic Execution Logging

Every report generation automatically logs to `report_execution_history`:

| Source | Logging Mechanism |
|--------|------------------|
| Report Engine (frontend sync) | `reportingService.logExecution()` → `POST /Reporting/execution-log` |
| Report Engine (frontend async) | Backend `ReportJobManager` logs on completion |
| `GenerateReportCommand` (backend) | Handler auto-persists to `ReportExecutionHistories` |
| Scheduled reports | Logged by notification system execution pipeline |

### Monitoring Dashboard Features

| Feature | Data Source |
|---------|-----------|
| **Total Executions** | Count of history records in date range |
| **Success Rate** | `succeeded / total * 100` |
| **Average Duration** | Mean of `ExecutionTimeMs` for successful runs |
| **Format Breakdown** | Count by `ExportFormat` (PDF, Excel, HTML, CSV) |
| **Error Log** | Failed executions with `ErrorMessage` details |
| **User Activity** | Execution count per user |

### Execution History Record

```json
{
  "reportExecutionId": 1234,
  "reportDefinitionId": 5,
  "executedBy": "user-guid",
  "executedAt": "2026-03-10T14:30:00Z",
  "filters": "{\"sourceId\":\"pump-transaction\",\"siteId\":5,\"startDate\":\"2026-01-01\"}",
  "exportFormat": "pdf",
  "recordCount": 150,
  "executionTimeMs": 4567,
  "success": true,
  "errorMessage": null,
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

---

## 19. Async Job System (Background Reports)

### When Async Jobs Are Used

| Condition | Job Type |
|-----------|---------|
| Format is PDF or Excel (non-pump-transaction) | Async |
| Large dataset (>200 records or >300KB payload) | Async (fallback from sync) |
| HTML sync preview times out (12s) | Async (automatic fallback) |
| Tank volume history & transaction summary reports | Always async |
| Pump transaction reports | Always sync |

### Job Status Lifecycle

```
Queued (0%) → FetchingData (10%) → Rendering (50%) → Completed (100%)
                                                   → Failed (error)
                                  → Cancelled (user action)
```

### Frontend Job Tracking

The `useReportJobTracking` hook:

1. Submits job via `POST /jobs/submit`
2. Listens for SignalR events matching the job ID
3. Updates local state with progress percent and status message
4. On completion:
   - HTML → auto-fetch content via `GET /jobs/{id}/result/html`
   - PDF/Excel → auto-download via `GET /jobs/{id}/result`
5. After 10 seconds of tracking, shows "Email When Done" button
6. Supports cancellation via `POST /jobs/{id}/cancel`

### Job Memory Management

| Setting | Value | Description |
|---------|-------|-------------|
| Result TTL | 30 minutes | Completed results are cached for download |
| Max concurrent per user | 3 | Prevents resource exhaustion |
| Auto-cleanup | Periodic | Expired results and old job records are purged |

---

## 20. Security & Permissions

### Authentication

All report API endpoints require JWT Bearer authentication (inherited from controller-level `[Authorize]` attribute).

### Authorisation

| Level | Mechanism |
|-------|----------|
| Controller | `[RequirePermission(Permissions.Report.VehicleConsumption)]` |
| Source definitions | `RequiredPermission` field (e.g., `_Read_PumpTransaction`) |
| Data endpoints | Enforce their own permissions independently |
| Frontend | `usePermissions()` hook hides inaccessible report sources |

### Data Isolation

- All queries are scoped by `SiteId` from JWT claims
- Multi-tenant data isolation enforced at the data endpoint level
- Execution history is associated with the executing user's ID

---

## 21. Performance & Error Handling

### Rendering Timeouts

| Scenario | Timeout |
|----------|---------|
| Standard payload (<750KB) | 120 seconds |
| Large payload (≥750KB) | 300 seconds |
| Sync HTML preview | 12 seconds (then falls back to async) |

### Retry Logic

| Component | Retry Behaviour |
|-----------|----------------|
| jsreport WORKER_TIMEOUT | Kill & recreate service, retry once |
| PuppeteerSharp browser crash | Close & relaunch browser, retry once |
| Chrome process stale | Kill stale processes on startup |

### Error Handling

| Layer | Error Strategy |
|-------|---------------|
| Backend Services | Log error + return `FMSResponse` with details |
| Backend Controllers | Try/catch → status 500 with message |
| Frontend `reportingService` | Try/catch → `{ success: false, error: message }` |
| Frontend UI | Toast notifications via `notify()` + inline error messages |
| Template not found | Fallback to embedded default (silent recovery) |
| Logo not found | Skip letterhead silently |
| Chrome not found | Log warning, PDF rendering unavailable |

### Caching Strategy

| What | Where | Duration |
|------|-------|----------|
| Source definitions | Frontend `reportSourceRegistry` (static Map) | App lifetime |
| Template content | Disk read per render | No cache (disk I/O is fast) |
| Async job results | In-memory `ConcurrentDictionary` | 30 minutes |
| API data responses | Not cached | Always fresh data |

---

## 22. Extensibility Guide

### Adding a New Report Source

See [ADDING_REPORTS.md](./ADDING_REPORTS.md) for a step-by-step walkthrough.

**Summary:**
1. Create source definition file in `sources/`
2. Register in `reportSourceRegistry.js`
3. Add data mapper in `reportDataBuilder.js`
4. Create Handlebars template (file or embedded)
5. (Optional) Add lookup support
6. (Optional) Add backend data endpoint

### Adding a New Output Format

1. Add render method to `IJsReportService` (e.g., `RenderWordAsync`)
2. Implement in `JsReportService` using appropriate library
3. Add endpoint to `ReportGeneratorController`
4. Add format option to source definitions (`supportedFormats`)
5. Update `ReportFormatSelector` if needed
6. Update `ReportEngine` generation logic

### Custom Branding

Replace the logo file at `C:\FMSData\reports\branding\letterhead-logo.png`. Supported formats: PNG, JPG, SVG, GIF, WebP. The logo is loaded once at application startup (restart required for changes).

### Adding New Schedule Frequencies

1. Extend the frequency options in the schedule form
2. Update the backend notification scheduler to handle the new frequency
3. Update `ReportSchedule.Frequency` validation

---

## Appendix: File Reference

### Backend Files

| File | Lines | Purpose |
|------|-------|---------|
| `FMS.WebClient/Services/Reporting/JsReportService.cs` | 1,391 | Core render engine |
| `FMS.WebClient/Services/Reporting/JsReportTemplateManager.cs` | 242 | Template file CRUD + seeding |
| `FMS.WebClient/Services/Reporting/JsReportHtmlTemplates.cs` | — | 9 embedded Handlebars templates |
| `FMS.WebClient/Services/Reporting/JsReportLetterheadBranding.cs` | 130 | Logo injection |
| `FMS.WebClient/Services/Reporting/NotificationReportRenderer.cs` | 45 | Notification → JsReport bridge |
| `FMS.WebClient/Services/Reporting/IJsReportService.cs` | 50 | Rendering interface |
| `FMS.WebClient/Services/ReportJobManager.cs` | 934 | Async job orchestrator |
| `FMS.WebClient/Controllers/Reporting/ReportGeneratorController.cs` | 673 | JsReport API surface |
| `FMS.WebClient/Controllers/Reporting/ReportingController.cs` | 395 | Definitions + history API |
| `FMS.WebClient/Controllers/Reporting/StockReportController.cs` | — | Tank stock reports |
| `FMS.Application/Features/Reporting/Commands/` | 8 files | CQRS write operations |
| `FMS.Application/Features/Reporting/Queries/` | 6 files | CQRS read operations |
| `FMS.Application/Features/Reporting/DTOs/` | 5 files | Data transfer objects |
| `FMS.Application/Features/Reporting/Services/` | 7 files | Business logic services |
| `FMS.Domain/Entities/Features/Reporting/` | 5 files | Domain entities |

### Frontend Files

| File | Lines | Purpose |
|------|-------|---------|
| `fms.frontend/src/pages/reports/ReportsMain.js` | 100 | Route definitions |
| `fms.frontend/src/pages/reports/ReportsDashboard.js` | — | Landing page |
| `fms.frontend/src/pages/reports/engine/ReportEngine.js` | 786 | Central orchestrator |
| `fms.frontend/src/pages/reports/engine/ReportParameterForm.js` | — | Dynamic filter form |
| `fms.frontend/src/pages/reports/engine/ReportFormatSelector.js` | — | Format picker |
| `fms.frontend/src/pages/reports/engine/ReportOutputViewer.js` | — | HTML iframe viewer |
| `fms.frontend/src/pages/reports/engine/reportDataBuilder.js` | 1,508 | Data normalisation |
| `fms.frontend/src/pages/reports/sources/reportSourceRegistry.js` | 121 | Source registry |
| `fms.frontend/src/pages/reports/sources/` | 10 files | Individual source configs |
| `fms.frontend/src/pages/reports/templates/TemplateManager.js` | 287 | Template CRUD grid |
| `fms.frontend/src/pages/reports/templates/TemplateDesigner.js` | 232 | Monaco editor + preview |
| `fms.frontend/src/pages/reports/scheduling/ReportScheduleManager.js` | 541 | Schedule management |
| `fms.frontend/src/pages/reports/monitoring/ReportMonitorDashboard.js` | 402 | Execution dashboard |
| `fms.frontend/src/services/reportingService.js` | 780 | API client (30 methods) |

---

*This documentation reflects the state of the FMS reporting system as of 2026-03-11.*
