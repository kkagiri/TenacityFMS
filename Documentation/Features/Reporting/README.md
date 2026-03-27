# FMS Reporting System

Comprehensive reporting system for the FMS application using **JsReport** as the primary report engine with Handlebars HTML templates, server-side PDF/Excel rendering, scheduled delivery, and async background generation.

> **Note**: DevExtreme Reporting (REPX-based) exists as a secondary/legacy engine. JsReport is the active, primary system for all new reports.

## Overview

The reporting system provides:

- **16 built-in report sources** covering fuel, storage, fleet, device, route, compliance, and operational reporting
- **Server-side rendering** via JsReport for HTML preview, PDF generation, and Excel generation
- **Scheduled report delivery** via email through the notification scheduler
- **Report monitoring** with execution history, success and failure tracking, duration metrics, and error visibility
- **Background production** using async report jobs with SignalR progress updates and job orchestration
- **Customization** through editable Handlebars templates, Monaco-based template editing, and letterhead branding
- **Report importation and ingestion workflows** for reporting-adjacent fuel import processes and custom template onboarding
- **Multi-format output**: HTML preview, PDF download, Excel download, CSV export

## Reporting Feature Update

The current reporting system is built around the following operational capabilities:

| Feature | What it does |
|----------|-------------|
| **Scheduling** | Lets users create recurring or one-time report deliveries with source, filters, recipients, frequency, timezone, and output format. Schedules are executed through the existing notification infrastructure rather than a separate scheduler. |
| **Report Monitoring** | Tracks report executions through history views, statistics cards, status indicators, and error messages so administrators can see which reports succeeded, failed, or are taking too long. |
| **Background Production** | Supports asynchronous report generation for heavier jobs. A job is submitted, processed in the background, and progress is broadcast through SignalR events such as `ReportJobStarted`, `ReportJobProgress`, `ReportJobCompleted`, and `ReportJobError`. |
| **Customization** | Allows built-in templates to be edited and custom templates to be added. Templates are Handlebars HTML files stored on disk, can be managed through the Template Manager UI, and support company letterhead branding. |
| **Report Importation** | Covers two reporting-adjacent import scenarios: custom or user-supplied templates can be onboarded into the template store, and fuel-import reporting endpoints support auto-import, single-file import, import summaries, retry flows, and settings management for external fuel report ingestion. |

## Report Types And What They Do

The reporting module currently exposes the following built-in source types through the source registry:

| Report Type | Category | What it does |
|-------------|----------|--------------|
| `pump-transaction` | Fuel Management | Lists pump dispensing transactions with volume, nozzle, vehicle, operator, and tank context. |
| `vehicle-consumption` | Fuel Management | Analyses fuel consumption by vehicle across a date range, with grouping by site and vehicle type. |
| `fuel-refill` | Fuel Management | Shows refill records with quantity, site, vehicle, and fuel-average related details. |
| `delivery` | Fuel Management | Summarises fuel deliveries, including supplier, delivered quantity, and receiving tank details. |
| `consumption-by-refills` | Fuel Management | Calculates consumption using refill-to-refill intervals for vehicles or equipment. |
| `tank-volume-history` | Storage And Tank Management | Provides detailed tank transaction history including opening, closing, deliveries, dispensing, and transfers. |
| `transaction-history-summary` | Storage And Tank Management | Produces a summarized view of tank transaction activity over time for operational review. |
| `tank-level-detail` | Storage And Tank Management | Shows detailed tank-level balance movements, references, operators, and quantity changes. |
| `storage-received-vs-dispensed` | Storage And Tank Management | Compares tank receipts, dispensing, transfers, and closing variance to highlight stock movement differences. |
| `device-offline` | Device Management | Tracks device offline events with duration and threshold-based filtering for uptime monitoring. |
| `pts-device` | Device Management | Reports on current and historical PTS device status, uptime, and connectivity. |
| `alarm-report` | Device Management | Lists alarms raised by devices and probes, including severity, state, code, and source details. |
| `issue-tracker` | Operations | Reports operational issues using site, vehicle, status, category, and template filters. |
| `route-analysis` | Operations | Analyses route execution, confidence, anomalies, geofence or cluster behavior, and route quality outcomes. |
| `live-trip-operations` | Operations | Shows currently active trip operations, trip counts, live cycle counts, and vehicles that are idle outside work zones. |
| `vehicle-document-compliance` | Fleet Compliance | Reports vehicle document validity, upcoming expiries, expired items, issuing authority, and vehicle compliance status. |

## Documentation

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | This file — overall overview |
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Architecture, code structure, and data flow |
| [USAGE.md](./USAGE.md) | How to use the reporting UI and API |
| [DESIGN.md](./DESIGN.md) | System design decisions and patterns |
| [ADDING_REPORTS.md](./ADDING_REPORTS.md) | Step-by-step guide to add a new report |

## Quick Reference

### Report Sources

| Scope | Current State |
|-------|---------------|
| Built-in source registry | 16 sources |
| Output formats | HTML, PDF, Excel, CSV |
| Delivery modes | Interactive generation, scheduled delivery, background generation |
| Template model | Built-in embedded templates plus custom/user-supplied templates |

### Key URLs

| Route | Purpose |
|-------|---------|
| `/reports` | Dashboard with quick-actions and source catalog |
| `/reports/engine/:sourceId` | Generate a report for a specific source |
| `/reports/templates` | Manage Handlebars HTML templates |
| `/reports/scheduling` | Create and manage scheduled report emails |
| `/reports/monitoring` | View execution history and statistics |
| `/reports/gallery` | Browse the full report catalog |

### Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/ReportGenerator/templates` | GET | List all JsReport templates |
| `/api/v1/ReportGenerator/templates/{name}` | GET/PUT/DELETE | Template CRUD |
| `/api/v1/ReportGenerator/preview/{templateName}` | POST | Render HTML preview |
| `/api/v1/ReportGenerator/render/pdf/{templateName}` | POST | Render PDF |
| `/api/v1/ReportGenerator/render/excel/{templateName}` | POST | Render Excel |
| `/api/v1/ReportGenerator/generate-async` | POST | Submit a background report job |

## Project Structure

```
Backend:
├── FMS.Application/Features/Reporting/
│   ├── Commands/           # GenerateReport, CreateReportSchedule, CancelSchedule, LogExecution
│   ├── Queries/            # GetReportDefinition(s), GetTemplates, GetSchedules, GetHistory
│   ├── DTOs/               # ReportDefinitionDTO, GenerateReportRequestDTO
│   └── Services/           # ReportDefinitionService, ReportGenerationService
│
├── FMS.WebClient/Services/Reporting/
│   ├── IJsReportService.cs           # JsReport rendering interface
│   ├── JsReportService.cs            # JsReport Local engine implementation
│   ├── JsReportHtmlTemplates.cs      # 9 embedded Handlebars templates
│   ├── JsReportTemplateManager.cs    # File-based template storage
│   ├── JsReportLetterheadBranding.cs # Auto-inject logo & branding CSS
│   └── NotificationReportRenderer.cs # Bridge to notification email system
│
├── FMS.WebClient/Controllers/Reporting/
│   ├── ReportGeneratorController.cs  # JsReport template CRUD + rendering
│   ├── ReportingController.cs        # Report definitions + schedules
│   ├── StockReportController.cs      # Tank stock reports
│   └── (DevExtreme controllers)      # Legacy REPX designer/viewer
│
├── FMS.Domain/Entities/
│   ├── ReportDefinition.cs           # Report metadata
│   ├── ReportTemplate.cs             # Template config
│   ├── ReportSchedule.cs             # Scheduled email delivery
│   ├── ReportExecutionHistory.cs     # Execution log
│   └── ReportCategory.cs             # Report categories

Frontend:
├── fms.frontend/src/pages/reports/
│   ├── ReportsMain.js                # Route definitions
│   ├── ReportsDashboard.js           # Landing page
│   ├── ReportGallery.js              # Browse all reports
│   ├── engine/                       # Report generation orchestrator
│   │   ├── ReportEngine.js           # Central generation UI
│   │   ├── ReportParameterForm.js    # Dynamic filter form
│   │   ├── ReportFormatSelector.js   # Format picker
│   │   ├── ReportOutputViewer.js     # HTML viewer (iframe)
│   │   └── reportDataBuilder.js      # Data normalization for 9 sources
│   ├── sources/                      # Report source definitions (config objects)
│   ├── templates/                    # Template CRUD + Monaco editor
│   ├── scheduling/                   # Schedule management
│   ├── monitoring/                   # Execution history dashboard
│   └── layout/                       # Sidebar navigation layout
│
├── fms.frontend/src/services/
│   └── reportingService.js           # API client (750+ lines)
│
├── fms.frontend/src/components/Reporting/
│   ├── ReportBuilder.js              # DataGrid/PivotGrid renderer (legacy)
│   └── ReportScheduler/              # Reusable schedule email dialog
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Report Engine | jsreport.Local + jsreport.Binary (system Chrome) |
| PDF Rendering | ChromePdf recipe (120s default, 300s for large payloads) |
| Excel Rendering | HtmlToXlsx recipe |
| Templates | Handlebars HTML (file-based at `C:\FMSData\reports\templates\`) |
| Template Editor | Monaco Editor (in-browser) |
| Branding | Auto-injected letterhead logo from `C:\FMSData\reports\branding\` |
| Scheduling | Notification system integration (Type:2, CategoryId:20) |
| Frontend Framework | React 18, Redux Toolkit, DevExtreme |
| API Client | Axios via reportingService.js |

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0.0 | 2024-01-24 | Initial DevExtreme reporting (DataGrid, PivotGrid, Gallery) |
| v2.0.0 | 2025 | JsReport engine, template management, scheduling, and monitoring introduced |
| v2.1.0 | 2026 | Expanded source registry, async background production, stronger execution monitoring, and reporting-adjacent import workflows |
