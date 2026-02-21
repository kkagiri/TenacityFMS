# FMS Reporting System

Comprehensive reporting system for the FMS application using **JsReport** as the primary report engine with Handlebars HTML templates, server-side PDF/Excel rendering, and scheduled email delivery.

> **Note**: DevExtreme Reporting (REPX-based) exists as a secondary/legacy engine. JsReport is the active, primary system for all new reports.

## Overview

The reporting system provides:

- **9 built-in report sources** covering fuel management, device management, and operations
- **Server-side rendering** via JsReport (ChromePdf for PDF, HtmlToXlsx for Excel)
- **Customizable Handlebars templates** with letterhead branding
- **Scheduled report delivery** via email (integrated with the notification system)
- **Execution monitoring** with history tracking and statistics
- **Template management** with a Monaco-based in-browser editor
- **Multi-format output**: HTML preview, PDF download, Excel download, CSV export

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

| Source ID | Category | Description |
|-----------|----------|-------------|
| `pump-transaction` | Fuel Management | Pump transaction records |
| `vehicle-consumption` | Fuel Management | Vehicle fuel consumption |
| `fuel-refill` | Fuel Management | Fuel refill records |
| `delivery` | Fuel Management | Fuel delivery records |
| `tank-volume-history` | Fuel Management | Tank volume history |
| `consumption-by-refills` | Fuel Management | Consumption calculated from refills |
| `device-offline` | Device Management | Device offline events |
| `pts-device` | Device Management | PTS device status |
| `issue-tracker` | Operations | Issue tracker records |

### Key URLs

| Route | Purpose |
|-------|---------|
| `/reports` | Dashboard with quick-actions and source catalog |
| `/reports/engine/:sourceId` | Generate a report for a specific source |
| `/reports/templates` | Manage Handlebars HTML templates |
| `/reports/scheduling` | Create and manage scheduled report emails |
| `/reports/monitoring` | View execution history and statistics |

### Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/ReportGenerator/templates` | GET | List all JsReport templates |
| `/api/v1/ReportGenerator/templates/{name}` | GET/PUT/DELETE | Template CRUD |
| `/api/v1/ReportGenerator/preview/{templateName}` | POST | Render HTML preview |
| `/api/v1/ReportGenerator/render/pdf/{templateName}` | POST | Render PDF |
| `/api/v1/ReportGenerator/render/excel/{templateName}` | POST | Render Excel |

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
| v2.0.0 | 2025 | JsReport engine, 9 source types, template management, scheduling, monitoring |
