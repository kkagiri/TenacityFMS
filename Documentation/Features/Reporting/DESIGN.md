# Reporting System — Design Document

## Design Decisions

### Why JsReport over DevExtreme Reporting?

| Factor | JsReport | DevExtreme Reporting |
|--------|----------|---------------------|
| Template control | Full HTML/CSS via Handlebars — easy to customize | REPX binary format — requires visual designer |
| PDF rendering | ChromePdf — high-fidelity, CSS3/flexbox support | DevExpress PDF engine — limited CSS support |
| Excel output | HtmlToXlsx — same template for both formats | Separate export pipeline |
| Template storage | Simple `.html` files on disk | Binary blobs in database |
| Licensing | Open-source engine + free binary | DevExpress commercial license required |
| Branding | Easy letterhead injection via HTML | Complex REPX manipulation |
| Scheduled emails | Direct integration with notification system | No built-in scheduling |

**Decision**: JsReport was adopted as the primary engine for its flexibility, ease of template customization, and seamless integration with the notification system for scheduled email delivery.

### Source Registry Pattern

Reports are defined as **pure configuration objects** in a `Map`-based registry (`reportSourceRegistry`). This pattern was chosen because:

1. **No boilerplate** — Adding a new report requires zero React component code, just a config object
2. **Consistency** — All reports share the same generation pipeline (`ReportEngine` → `reportDataBuilder` → JsReport)
3. **Dynamic UI** — The `ReportParameterForm` auto-generates filter controls from the source's `parameters` array
4. **Decoupled data fetching** — Each source points to an existing API endpoint; no dedicated report endpoints needed
5. **Easy scheduling** — Schedule configuration works identically for all sources

### Data Normalization Layer

The `reportDataBuilder.js` acts as a normalization layer between diverse API response shapes and a consistent JsReport payload format:

```
API Response (varies per source)
       │
       ▼
unwrapApiRecords()     → Extract records array from nested response
       │
       ▼
Source-specific mapper → Transform field names, calculate summaries
       │
       ▼
Standardized payload   → {reportTitle, generatedAt, records, summary}
       │
       ▼
JsReport template      → Renders using consistent data shape
```

**Why?** API endpoints return data in different structures (some wrap in `data.data`, others in `data.records`). Property names vary (some use `VehicleRegNo`, others use `vehicleRegistration`). The normalization layer isolates the templates from these inconsistencies.

### Notification Integration for Scheduling

Rather than building a separate scheduling engine, report scheduling piggybacks on the existing notification system:

- Schedule requests are stored as notifications with `Type: 2` (Scheduled Report) and `CategoryId: 20`
- The notification scheduler handles timing, retries, and delivery tracking
- `NotificationReportRenderer` bridges the notification system to JsReport for rendering
- Delivery status tracking (per-recipient) reuses the notification infrastructure

**Benefit**: No duplicate scheduling infrastructure. Scheduled reports appear alongside other notifications in the admin interface.

### Template Storage Strategy

Templates are stored as **files on disk** (`C:\FMSData\reports\templates\`) rather than in the database:

- **Easy editing** — Templates can be edited with any text editor or the built-in Monaco designer
- **Version control friendly** — Files can optionally be tracked in version control
- **No migration needed** — Adding/updating templates doesn't require database migration
- **Fallback safety** — If a template file is missing, the embedded default from `JsReportHtmlTemplates.cs` is used

---

## Architecture Patterns

### Clean Architecture Layers

```
Presentation          → Controllers (ReportGeneratorController, etc.)
Application Services  → JsReportService, NotificationReportRenderer
Application (CQRS)    → Commands, Queries, Handlers
Domain                → Entities (ReportDefinition, ReportSchedule, etc.)
Persistence           → EF Core configurations, DbContext
```

### CQRS Separation

- **Commands** (write): `GenerateReportCommand`, `CreateReportScheduleCommand`, `CancelReportScheduleCommand`, `LogReportExecutionCommand`
- **Queries** (read): `GetReportDefinitionQuery`, `GetAllReportDefinitionsQuery`, `GetReportTemplatesQuery`, `GetReportSchedulesQuery`, `GetExecutionHistoryQuery`

Each command/query has its own file. Each handler has its own file. No mixing of read/write logic.

### Frontend Component Hierarchy

```
ReportsMain (Router)
├── ReportsLayout (Sidebar + Content)
│   ├── ReportsDashboard
│   ├── ReportEngine
│   │   ├── ReportParameterForm
│   │   ├── ReportFormatSelector
│   │   └── ReportOutputViewer
│   ├── TemplateManager
│   │   └── TemplateDesigner
│   ├── ReportScheduleManager
│   │   └── ReportScheduleForm
│   ├── ReportMonitorDashboard
│   │   └── ReportExecutionLog
│   └── ReportGallery
└── (Legacy standalone pages)
    ├── TankVolumeHistoryReport
    ├── ConsumptionBasedonRefills
    └── PTSOfflineReport
```

### Service Layer (Frontend)

`reportingService.js` is a singleton class, not a Redux slice. This was chosen because:

1. **Stateless operations** — Report generation is fire-and-forget, not state that needs to persist in Redux
2. **Binary responses** — PDF/Excel blobs don't fit naturally in Redux store
3. **Simpler API** — Direct async/await calls without action creators, reducers, and selectors
4. **The `ReportParameterForm` still uses Redux** for lookup data (sites, vehicles, tanks) via existing slices

---

## Security Model

### Authentication

All report API endpoints require JWT authentication (inherited from the base `ControllerBase` with `[Authorize]`).

### Authorization

- Report source definitions can specify `RequiredPermission` (e.g., `_Read_PumpTransaction`)
- Data endpoints enforce their own permissions independently
- Frontend hides report sources the user lacks permissions for

### Data Isolation

- All queries are scoped by `SiteId` from the JWT claims
- Multi-tenant data isolation is enforced at the data endpoint level, not in the reporting layer

---

## Performance Considerations

### Rendering Timeouts

| Scenario | Timeout |
|----------|---------|
| Standard payload (<750KB) | 120 seconds |
| Large payload (>750KB) | 300 seconds |

### Chrome Process Management

`JsReportService` kills stale Chrome daemon processes before each render to prevent memory leaks and port conflicts.

### Large Dataset Handling

- Data endpoints should implement pagination/date-range limits
- The `reportDataBuilder` processes records in a single pass (linear time)
- Excel rendering via HtmlToXlsx handles large tables efficiently

### Caching

- Report source definitions are cached in the frontend's `reportSourceRegistry` (static `Map`)
- Template content is read from disk per-render (no in-memory cache; disk I/O is fast enough)
- API responses are not cached — reports always show fresh data

---

## Error Handling

### Backend

- JsReport rendering errors return `FMSResponse` with error details
- Template-not-found falls back to embedded defaults (never fails silently)
- Chrome process errors are logged and retried once

### Frontend

- `extractReportErrorMessage()` in `reportingService.js` parses error responses
- Failed renders show error toast notifications
- The `ReportEngine` component shows inline error messages with retry option

---

## Extensibility Points

1. **New report sources** — Add a source definition file + data mapper (see [ADDING_REPORTS.md](./ADDING_REPORTS.md))
2. **Custom templates** — Create/edit via the Template Manager UI or file system
3. **New rendering recipes** — Extend `IJsReportService` (e.g., add `RenderWordAsync` using a docx recipe)
4. **New schedule frequencies** — Extend `ReportSchedule.Frequency` enum and notification scheduler
5. **Custom branding** — Replace logo at `C:\FMSData\reports\branding\letterhead-logo.png`
