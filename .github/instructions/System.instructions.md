# FMS — AI Agent Development Instructions
**Fleet Management System · Microsoft Fluent Design Edition**

> **Scope:** Active production system. All new features and edits must follow the Fluent Design language conventions defined in this document.

---

## Quick Reference

| Layer | Technology |
|---|---|
| Backend | .NET Core — CQRS, Clean Architecture |
| Frontend | React 18.2.0 — DevExtreme 23.2.8, Redux Toolkit, Tailwind (`tw-` prefix) |
| Database | MySQL 5.5 / 5.6 — Entity Framework, GPSDataContext |
| Real-time | SignalR — live dashboards, hub events |
| Icons | FontAwesome — `fa-light fa-icon` prefix always |
| Styling | SCSS (not CSS) · Tailwind `tw-` prefix · Light mode only |

---

## Table of Contents

1. [Critical Rules](#1-critical-rules)
2. [Project Overview & Architecture](#2-project-overview--architecture)
3. [Backend Development Standards](#3-backend-development-standards)
4. [Frontend Development Standards](#4-frontend-development-standards)
5. [File Organisation](#5-file-organisation)
6. [Logging Architecture](#6-logging-architecture)
7. [Module Navigation & Permission System](#7-module-navigation--permission-system)
8. [Event Expression Engine](#8-event-expression-engine)
9. [System Configuration](#9-system-configuration)
10. [Styling Guide — Fluent Design](#10-styling-guide--fluent-design)
11. [AI Agent Response Protocol](#11-ai-agent-response-protocol)
12. [Quality Checklist](#12-quality-checklist)
13. [Devices Architecture (Multi-Provider Platform)](#13-devices-architecture-multi-provider-platform)

---

## 1. Critical Rules

### 1.1 Never Repeat Existing Code

> 🚨 **Hard Stop** — Check existing files FIRST before writing any code.

- Look in `feature/pages/service` folders for similar functionality
- If functionality exists — **reference or extend it**. DO NOT rewrite it
- Search the codebase before creating new files, functions, or features
- **If the code exists, USE IT — do not duplicate it**
- Dates: backend stores UTC; frontend always displays in local timezone

---

### 1.2 Documentation Protocol

> ⚠️ **Strictly Enforced**

- **ONLY write documentation when the user explicitly requests it **
- DO NOT auto-generate documentation at any time
- DO NOT suggest documentation unless the user asks
- Write documentation ONCE ONLY per request
9Wrapped all explicit transaction blocks with _context.Database.CreateExecutionStrategy().ExecuteAsync(...)
**Folder structure for all documentation:**

```
documentation/features/{domain}/{feature}/{version}/{type}/

Examples:
  documentation/features/vehicle/fleet-management/V1/bug-fix/
  documentation/features/taskmanagement/assignment/V2/implementation/
  documentation/features/tankstock/reconciliation/V1/enhancement/
```

**Document Types:** `bug-fix/` · `implementation/` · `enhancement/` · `migration/` · `api/`

---

### 1.3 Build & Run Policy

- **DO NOT build or run the application automatically**
- After completing code changes:
  1. Summarise what was changed
  2. Recommend: *"Please build and test the application."*
  3. Wait for user feedback before proceeding
- **Exception:** User explicitly asks to build/run

---

### 1.4 Architecture Planning Protocol

Before suggesting architecture changes, follow this domain folder discovery protocol:

| Step | Action |
|---|---|
| 1 | Check the domain/feature folder: `FMS.Application/Features/{Domain}/` |
| 2 | If domain folder is **MISSING** → STOP. Ask user for approval with proposed structure. |
| 3 | If domain exists but structure is unclear → document findings, present plan, wait for agreement. |
| 4 | Check for anti-patterns (see below) before creating files. |

**Anti-Patterns — Never Do This:**

```
❌  Files in FMS.Application/DTO/         (wrong location)
❌  Files in FMS.Application/Services/    (wrong location)
✅  Files should be in FMS.Application/Features/{Domain}/DTOs/
✅  Files should be in FMS.Application/Features/{Domain}/Services/
```

**Example response when domain is missing:**

```
⚠️ DOMAIN FOLDER NOT FOUND

I need to create files in Features/TaskManagement/ but this domain folder doesn't exist.

 - in create command and queries . place them in Commands/ and Queries/ subfolders

 do not put command and command handler in a seperate file. put them in the same file. same for query and query handler.

Proposed structure:
FMS.Application/Features/TaskManagement/
├── Commands/
├── Queries/
├── DTOs/
├── Services/
└── Validators/

Should I proceed with creating this domain structure?
```

---

### 1.5 Environment Awareness

- **Assume development PC environment** unless stated otherwise
- Use localhost, local database, local file system by default
- Only suggest environment-specific changes when the user specifies: *"for production"*, *"for staging"*, or *"for testing environment"*

---

### 1.6 Domain Layer is Sacred

> 🚨 **STRICTLY DO NOT modify the Domain layer (`FMS.Domain/`)**

Domain entities are the source of truth. If domain changes are needed:
1. Stop immediately
2. Inform the user: *"This requires Domain layer changes"*
3. Explain the impact
4. Wait for explicit approval

---

### 1.7 Single Responsibility & File Size

> ⚠️ **600-Line Limit**

If a file reaches 600+ lines: **STOP and refactor**.

```
Before:  VehicleService.js  (800 lines)

After:
  VehicleService.js            — core operations  (300 lines)
  VehicleValidationService.js  — validation logic (200 lines)
  VehicleReportService.js      — reporting        (250 lines)
```

---

### 1.8 File Documentation Header

Every file **MUST** have a documentation header at the top:

```javascript
/**
 * File:          [FileName].js
 * Purpose:       [Brief description]
 * Dependencies:  [Key dependencies]
 * Last Modified: [Date]
 *
 * Key Functions:
 * - functionName(): what it does
 */
```

---

### 1.9 Clean Architecture — CQRS With Pragmatic File Grouping

> ⚠️ **CRITICAL: DO NOT SPLIT SMALL, TIGHTLY COUPLED TYPES INTO EXTRA FILES WITHOUT A CLEAR BENEFIT**

**CQRS rules:**
- Commands = Write operations (Create, Update, Delete)
- Queries = Read operations (Get, List, Search)
- Keep command with command handler in the same file when they are tightly coupled
- Keep query with query handler in the same file when they are tightly coupled
- Keep small validator interfaces with their validator implementation in the same file
- No mixing of read/write logic

**Required folder structure for every domain:**

```
FMS.Application/Features/Vehicle/
├── Commands/
│   ├── CreateVehicleCommand.cs
│   └── UpdateVehicleCommand.cs
├── Queries/
│   └── GetVehicleQuery.cs
├── DTOs/
│   ├── VehicleDto.cs
│   └── CreateVehicleDto.cs
├── Services/
│   ├── IVehicleService.cs
│   └── VehicleService.cs
└── Validators/
    └── CreateVehicleValidator.cs
```

**File grouping rules:**

```
❌  NEVER combine unrelated responsibilities in one file
❌  NEVER put DTOs in service files
❌  NEVER put classes in controller files
✅  Put each command and its handler in one file unless the file becomes large or hard to navigate
✅  Put each query and its handler in one file unless the file becomes large or hard to navigate
✅  Each DTO in its own file in DTOs folder
✅  Keep small validator interfaces with their implementation in one file
✅  Split interfaces and implementations only when reuse, size, or readability justifies it
```

---

## 2. Project Overview & Architecture

**FMS** is a full-stack Fleet Management System currently in **active production**.

```
FMS.Application/         — Business logic, DTOs, commands, queries
FMS.WebClient/           — Web API controllers
FMS.Frontend/            — React frontend (src/)
FMS.Persistence/         — Data access layer, entity configs
FMS.Domain/              — Entities & domain models  ← DO NOT MODIFY
FMS.BackgroundServices/  — Background jobs
documentation/           — All feature documentation
```

**Key Files to Reference:**

| File | Purpose |
|---|---|
| `FMSResponse.cs` | Response handling patterns |
| `package.json` | Frontend dependencies |
| `tailwind.config.js` | Styling configuration |
| `axiosInstance.js` | API communication setup |
| `FmsLoggingConfiguration.cs` | WebClient Serilog logging |
| `PTSLoggingConfiguration.cs` | PTS Windows Service Serilog logging |

---

## 3. Backend Development Standards

### Response Handling

- Always use `FMSResponse.cs` for all API endpoints
- `FMSResponse<T>` for returning data
- `FMSResponse` for errors / validation responses
- Always include validation checks

### User ID Extraction

```csharp
var userIdClaim = User.Claims.FirstOrDefault(c =>
    c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    && Guid.TryParse(c.Value, out _));

var userId = userIdClaim?.Value;
```

### Permission Check Pattern

```csharp
var hasPermission = User.HasClaim("permissions", "_createFuelRefill");
if (!hasPermission) return Forbid();
if (!ModelState.IsValid) return BadRequest(ModelState);
```

### Database Operations — MySQL 5.5/5.6 Compatibility

> 🚨 **MySQL Compatibility Rules**

```
❌  DO NOT use CURRENT_TIMESTAMP for default values
❌  DO NOT use multiple TIMESTAMP columns with defaults
❌  DO NOT use JSON data type (not supported in MySQL 5.6)
❌  DO NOT use generated columns
✅  Use DATETIME NULL or explicit values for timestamps
✅  Use TEXT for JSON-like data with application-level parsing
```

**Correct MySQL 5.6 table definition:**

```sql
-- ✅ CORRECT
CREATE TABLE vehicles (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    created_at  DATETIME NULL,
    updated_at  DATETIME NULL
);

-- ❌ INCORRECT (MySQL 5.7+ only)
-- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- config     JSON
```

- Always use `GPSDataContext` for all database operations
- Create entity configuration files in `FMS.Persistence`
- Add new entities to `GPSDataContext`
- Do NOT create new PTS models unless explicitly requested

### CQRS Code Examples

```csharp
// File: CreateVehicleCommand.cs  (command + handler)
public record CreateVehicleCommand : IRequest<FMSResponse<VehicleDto>>
{
    public string Name         { get; init; }
    public string LicensePlate { get; init; }
}

public class CreateVehicleCommandHandler
    : IRequestHandler<CreateVehicleCommand, FMSResponse<VehicleDto>>
{
    // Implementation here
}

// File: VehicleDto.cs  (in Features/Vehicle/DTOs/)
public class VehicleDto
{
    public Guid Id   { get; set; }
    public string Name { get; set; }
}

// File: IVehicleService.cs  (interface only when separation is justified)
public interface IVehicleService
{
    Task<FMSResponse<VehicleDto>> GetVehicleAsync(Guid id);
}

// File: VehicleService.cs  (implementation only)
public class VehicleService : IVehicleService
{
    // Implementation here
}
```

---

## 4. Frontend Development Standards

### Technology Stack

| Package / Tool | Version / Rule |
|---|---|
| React | 18.2.0 with hooks |
| DevExtreme | 23.2.8 |
| Redux | Toolkit — state management |
| Tailwind CSS | `tw-` prefix required on **all** classes |
| Icons | FontAwesome — `fa-light fa-icon` prefix |
| Styling | SCSS only (not plain CSS) |
| Theme | Light mode only — no dark mode |
| API URLs | `/vehicles` not `/api/vehicles` (axiosInstance adds base URL) |

### Mobile Responsiveness

- Always make applications mobile **and** web responsive
- Use height-based collapsing for mobile sidebars (not width-based)
- Reference: TankStock Layout for working mobile implementation
- All frontend elements must be compatible with small mobile devices

### Key Rules

- All Tailwind classes must use `tw-` prefix → `tw-font-semibold`, `tw-flex`, etc.
- Boolean values: use **standard HTML checkbox inputs** — NOT DevExtreme checkbox
- Popup config: `showCloseButton={true}` · `width="auto"` · `height="auto"`
- If more than 3 buttons appear on one line → use a button group
- Frontend dynamic navigation is **deprecated** — do not implement or rely on it

### Component Example

```jsx
<div className="tw-flex tw-flex-col tw-gap-4">
  <i className="fa-light fa-car"></i>
  <span className="tw-font-semibold">Vehicle List</span>
</div>
```

### API Service Example

```javascript
const getVehicles = async () => {
  const response = await axiosInstance.get('/vehicles');
  return response.data;
};
```

### Permission Hook (Preferred)

```javascript
// Preferred approach — JWT token-based
import { usePermissions } from '../hooks/usePermissions';

const { hasPermission } = usePermissions();
const canEdit = hasPermission('_EditVehicle');

// Legacy (less efficient — avoid in new code)
import { fetchpermissionbyUserId } from '../../redux/actions/permissionActions';
```

> **Security Note:** Frontend permission checks are for UX only. Always validate permissions on the backend as well.

---

## 5. File Organisation

### Backend — Domain-Driven Structure

```
FMS.Application/Features/
├── Vehicle/
│   ├── Commands/          CreateVehicleCommand.cs / Handler.cs
│   ├── Queries/           GetVehicleQuery.cs / Handler.cs
│   ├── DTOs/              VehicleDto.cs  (one DTO per file)
│   ├── Services/          IVehicleService.cs  /  VehicleService.cs
│   └── Validators/        CreateVehicleValidator.cs
├── TaskManagement/
│   ├── Commands/ Queries/ DTOs/ Services/ Validators/
└── ...
```

### Frontend Structure

```
src/
├── api/          HTTP clients (axiosInstance)
├── components/   Reusable components
├── pages/        Page components
├── redux/        State management
├── services/     Business logic
├── utils/        Utility functions
├── contexts/     React contexts
└── hooks/        Custom hooks (usePermissions, etc.)
```

---

## 6. Logging Architecture

> **Overview:** Logging is managed via **code-based Serilog configuration classes** — NOT via `appsettings.json` `WriteTo` sections. The `appsettings.json` only contains `MinimumLevel` and `Enrich` settings.

### Configuration Files

| Project | Configuration Class |
|---|---|
| FMS.WebClient | `FMS.WebClient/Extensions/FmsLoggingConfiguration.cs` |
| FMS.PTS.WindowsService | `FMS.PTS.WindowsService/Infrastructure/Logging/PTSLoggingConfiguration.cs` |

### Log Output Template

```
{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] ({SourceContext}) {Message:lj}{NewLine}{Exception}
```

> All log entries **MUST** include `({SourceContext})` to show the originating class.

### WebClient Log Folders — `C:\Logs\FMS.Webclient\`

| Folder | Contents | Retention |
|---|---|---|
| `app/` | ALL logs — unified for correlation | 7 days |
| `errors/` | Errors & Fatals only | 14 days |
| `gps/` | GPS / vehicle tracking | 7 days |
| `fuel/` | Fuel & tank operations | 7 days |
| `signalr/` | SignalR & Hub events | 7 days |
| `issues/` | Issue tracker, OnlineChecker | 7 days |
| `efcore/` | EF Core SQL commands | 3 days |
| `audit/` | HTTP request audit trail | 7 days |
| `startup/` | Application startup logs | 7 days |

### PTS Log Folders — `C:\Logs\FMS.PTS\`

| Folder | Contents | Retention |
|---|---|---|
| `app/` | ALL logs — unified text format for correlation | 31 days |
| `errors/` | Errors & Fatals only | 14 days |
| `device-raw/` | Raw WebSocket messages from PTS devices | 7 days |
| `commands/` | Redis commands, pump commands, command execution | 7 days |
| `transactions/` | Pump transactions, tank measurements, volume changes | 14 days |
| `connections/` | Device connections, disconnections, health checks | 7 days |
| `startup/` | Application startup logs | 7 days |

### Adding a New Log Category

**For WebClient** — edit `FmsLoggingConfiguration.cs`:

```csharp
// 1. Add sub-directory to EnsureDirectories() subDirs array
// 2. Add category logger:
AddCategoryLogger(lc, "new-category", "new-category-.log",
    sourceContextContains: new[] { "ClassNameKeyword1", "ClassNameKeyword2" },
    messageContains: new[] { "messageKeyword1", "messageKeyword2" },
    retainDays: 7);
```

### Logging Rules

- **DO NOT** add log sinks to `appsettings.json` — all sinks are code-based
- **DO NOT** modify output templates without ensuring `({SourceContext})` is present
- Always use `ILogger<T>` in classes (never raw `Log.Information()`)
- Check existing categories before creating new ones
- Retention: EF Core = 3 days · Errors = 14 days · Others = 7 days
- Max file size: 50 MB (both WebClient and PTS) — rolls on size limit
- Both PTS and WebClient use human-readable text format with SourceContext

**Log level guide:**

| Level | Use For |
|---|---|
| `Verbose` / `Debug` | Development diagnostics |
| `Information` | Business events (transactions, connections, operations) |
| `Warning` | Recoverable issues (retries, degraded performance) |
| `Error` | Failures requiring attention |
| `Fatal` | Application crash scenarios |

---

## 7. Module Navigation & Permission System

### Navigation Setup

> **Current Approach:** Use the Navigation Management page (`/admin/navigations`) to create navigation items. The system automatically handles database operations.

> ~~**Deprecated:** Direct SQL INSERT into `navigationitems`. Use the Navigation Management UI instead.~~

### Router Configuration in `Content.js`

Every module needs **two routes** — one for the base path and one wildcard for sub-routes:

```javascript
{/* Module Routes */}
<Route
  path="/[route-path]"
  element={React.createElement(resolvedComponents('[page-name]'))}
/>
<Route
  path="/[route-path]/*"
  element={React.createElement(resolvedComponents('[page-name]'))}
/>
```

### Component Mapping in `app-routes.js`

```javascript
case '[page-name]':
    return [ModuleMainComponent];
```

### Role Assignment

After creating the navigation item, assign it to appropriate roles via the Navigation Management page.

---

## 8. Event Expression Engine

> 🚨 **The old `AlarmHandler` / `ActiveAlarm` / `Alarm` system is DELETED. Do NOT reference or recreate any of those entities, services, or files.**

### Architecture

| | Pipeline |
|---|---|
| **Old (deleted)** | `AlarmHandler` → `AlarmHandlerExecution` → `ActiveAlarm` → `ActiveAlarmEscalationHistory` |
| **New** | `EventExpression` → `EventExpressionExecution` → `ActiveEvent` |

### Backend Structure

```
FMS.Application/Features/EventExpressionEngine/
├── Commands/     CreateEventExpression, Update, Delete, ProcessEvent,
│                 AcknowledgeActiveEvent, ResolveActiveEvent
├── Queries/      GetEventExpressions, GetById, GetExecutions,
│                 GetActiveEvents, GetEventTypes
├── DTOs/         EventExpressionDto, ActiveEventDto, CreateEventExpressionDto, ...
├── Services/     IEventExpressionEngine + EventExpressionEngine (core processing)
└── Validators/   CreateEventExpressionValidator, UpdateEventExpressionValidator
```

### Usage — `IEventExpressionEngine.ProcessAsync()`

```csharp
await _eventExpressionEngine.ProcessAsync(new FMSEvent {
    EventType = "TankStockDiscrepancy",
    SiteId    = siteId,
    TankId    = tankId,
    Severity  = "High",
    Data = new Dictionary<string, object> { ["variance"] = 50.5 }
});
```

### Database Tables (MySQL 5.5)

| New Table | Replaces |
|---|---|
| `event_expressions` | `alarm_handler` |
| `event_expression_executions` | `alarm_handler_execution` |
| `active_events` | `activealarms` |

Migration SQL: `Documentation/Features/NotificationAndAlarm/EventExpressionEngine/database/migration.sql`

### Frontend

```
fms.frontend/src/
├── pages/eventExpressions/
│   ├── EventExpressionsMain.js
│   └── components/
│       ├── EventExpressionList.js
│       ├── EventExpressionForm.js
│       └── ExecutionHistory.js
├── dataservice/
│   ├── eventExpressionApi.js     (/api/v1/event-expressions)
│   └── activeEventApi.js         (/api/v1/active-events)
└── redux/slices/
    └── eventExpressionSlice.js
```

| Property | Value |
|---|---|
| URL | `/event-expressions` (Content.js + app-routes.js) |
| AppDrawer | "Events" module at `/event-expressions` |
| Permission | `_Read_EventExpression` |

### Controller Endpoints

- `EventExpressionsController` — CRUD + `/types` + `/{id}/executions`
- `ActiveEventsController` — List, Acknowledge, Resolve, Dashboard stats

---

## 9. System Configuration

> Every new or edited configuration key **MUST** have a corresponding database entry in the `systemconfigurations` table.

**Key columns:**

| Column | Type | Notes |
|---|---|---|
| `ConfigurationKey` | `VARCHAR(191)` | Unique, required |
| `ConfigurationValue` | `VARCHAR(1000)` | Required |
| `Description` | `VARCHAR(500)` | Optional but recommended |
| `DataType` | `VARCHAR(50)` | e.g. `string`, `int`, `bool` |
| `Category` | `VARCHAR(100)` | Group related keys |
| `IsActive` / `IsEditable` | `TINYINT(1)` | Default `1` |
| `DefaultValue` | `VARCHAR(1000)` | Store the safe default |

---

## 10. Styling Guide — Fluent Design (M365 Admin Center)

> All new UI and edits must use **Microsoft 365 Admin Center flat design language**: Segoe UI typography, Microsoft Blue (`#0078D4`) as the primary accent, flat surfaces with 1px neutral borders, compact 34px controls, and the full M365 neutral chrome palette.
> **Full design specification:** See `.agents/skills/design/SKILL.md` for the complete M365 design system reference (colors, controls, cards, panels, forms, badges, mobile rules).

### M365 Color Tokens

| Token | Hex | Usage |
|---|---|---|
| Primary | `#0078d4` | Active tabs, focus rings, primary buttons |
| Success | `#107c10` | Acknowledge, green actions |
| Error | `#d13438` | Delete, critical badges |
| Warning | `#ca5010` | Warning badges |
| Text | `#201f1e` | Primary text |
| Secondary text | `#605e5c` | Descriptions, metadata |
| Tertiary text | `#a19f9d` | Placeholders, disabled |
| Border | `#c8c6c4` | Input borders (resting) |
| Border light | `#edebe9` | Dividers, card borders |
| Hover bg | `#f3f2f1` | Row hover, ghost buttons |
| Surface bg | `#faf9f8` | Page backgrounds |

### Flat Form Controls (M365 Admin)

> **Rule:** Use native `<select>`, `<input type="text">`, `<input type="date">`, and `<input type="checkbox">` for simple controls. Only use DevExtreme `SelectBox` / `DateBox` when you need searchable dropdown (100+ items) or advanced calendar features.

All flat controls share: **34px height · 13px font · 4px border-radius · `#c8c6c4` border · `#0078d4` focus ring**.

```scss
// Flat select — native <select> with custom chevron
.m365-select {
  height: 34px;
  padding: 0 28px 0 10px;
  font-size: 13px;
  color: #201f1e;
  background: #fff;
  border: 1px solid #c8c6c4;
  border-radius: 4px;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23605e5c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  &:hover { border-color: #605e5c; }
  &:focus { border-color: #0078d4; box-shadow: 0 0 0 1px #0078d4; }
}

// Flat text input
.m365-input {
  height: 34px;
  padding: 0 10px;
  font-size: 13px;
  color: #201f1e;
  background: #fff;
  border: 1px solid #c8c6c4;
  border-radius: 4px;
  outline: none;
  &::placeholder { color: #a19f9d; }
  &:hover { border-color: #605e5c; }
  &:focus { border-color: #0078d4; box-shadow: 0 0 0 1px #0078d4; }
}

// Flat date input
.m365-date { @extend .m365-input; min-width: 130px; }
```

### Button Variants

| Variant | Background | Text | Use For |
|---|---|---|---|
| `.m365-btn--primary` | `#0078d4` | white | Save, Create, Submit |
| `.m365-btn--ghost` | white + `#c8c6c4` border | `#323130` | Cancel, Refresh |
| `.m365-btn--text` | transparent | `#605e5c` | Clear, Reset |
| `.m365-btn--danger` | `#d13438` | white | Delete, Remove |
| `.m365-btn--success` | `#107c10` | white | Acknowledge, Approve |

### Info / Help Sections

```jsx
{/* Info banner (blue) — also supports --warning, --error, --success variants */}
<div className="m365-info-banner">
    <i className="fa-light fa-circle-info m365-info-banner__icon" />
    <span className="m365-info-banner__text">Message here</span>
</div>

{/* Inline help tooltip */}
<span className="m365-help-tip" title="Explanation…">
    <i className="fa-light fa-circle-question" />
</span>
```

### Section Groups with Icons

```jsx
<div className="m365-section-group">
    <div className="m365-section-group__header">
        <i className="fa-light fa-shield-halved m365-section-group__icon" />
        <h3 className="m365-section-group__title">Security Settings</h3>
    </div>
    <div className="m365-section-group__body">{/* content */}</div>
</div>
```

### Page Headers (compact)

```jsx
<div className="m365-page-header">
    <div className="m365-page-header__left">
        <i className="fa-light fa-bell m365-page-header__icon" />
        <h2 className="m365-page-header__title">My Notifications</h2>
    </div>
    <div className="m365-page-header__actions">
        <button className="m365-btn m365-btn--primary"><i className="fa-light fa-plus" />Add</button>
    </div>
</div>
```

**Header rules:** Use `h2` (16px, 600 weight) · inline icon · 8px vertical padding · no subtitle · no large icon boxes.

### Segmented Button Groups

Use button groups whenever more than 3 action buttons appear on one line.

```scss
.user-details__action-buttons {
  display: inline-flex;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.user-details__action-buttons .dx-button {
  border-radius: 0; border: none; background: #fff; color: #374151;
  position: relative; min-height: 32px; padding: 0 12px;
  font-weight: 500; transition: all .2s ease; white-space: nowrap;
}
.user-details__action-buttons .dx-button::after {
  content: ''; position: absolute; right: 0; top: 50%;
  transform: translateY(-50%); width: 1px; height: 16px; background: #e5e7eb;
}
.user-details__action-buttons .dx-button:hover:not(.dx-state-disabled) {
  background: #f8fafc; color: #2563eb; z-index: 1;
}
.user-details__action-btn--first { border-top-left-radius: 5px; border-bottom-left-radius: 5px; }
.user-details__action-btn--last  { border-top-right-radius: 5px; border-bottom-right-radius: 5px; }
.user-details__action-btn--last::after { display: none; }

@media (max-width: 768px) {
  .user-details__action-buttons .dx-button { min-height: 28px; padding: 0 8px; }
}
@media (max-width: 480px) {
  .user-details__action-buttons { flex-direction: column; border-radius: 6px; }
  .user-details__action-buttons .dx-button { width: 100%; }
  .user-details__action-buttons .dx-button:not(:last-child) { border-bottom: 1px solid #e5e7eb; }
}
```

**Button colour semantics:** Delete → Red · Edit → Blue · Refresh / Add → Green

Use `stylingMode="outlined"` and `type="default"` on DevExtreme `Button`.

### DevExtreme Tabs — Fluent Style

```jsx
<div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-overflow-hidden">
  <Tabs
    dataSource={tabs}
    itemRender={(item) => (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={item.icon}></i>
        <span>{item.text}</span>
      </div>
    )}
  />
  <div className="tw-p-4">{/* content */}</div>
</div>
```

```scss
.stock-management-tabs {
  .dx-tabs {
    background-color: #ffffff;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }
  .dx-tab { padding: 10px 20px; }
}
```

---

## 11. AI Agent Response Protocol

### Without `[doc]` Prefix — No Documentation

```
Changes Summary:
- Created: VehicleService.js (280 lines)
- Modified: VehicleDataGrid.js (added delete functionality)

Architecture Decisions:
- Split VehicleService into three services (SRP compliance)
- Used existing axiosInstance instead of creating new HTTP client

Next Steps:
Please build and test the application to verify these changes.
```

**Rules:**
- ✅ Summarise what was changed/created
- ✅ List files modified/created
- ✅ Highlight architectural decisions
- ✅ Warn on deprecated code (see format below)
- ❌ DO NOT mention documentation
- ❌ DO NOT create documentation files
- ✅ End with: *"Please build and test the application to verify these changes."*

### With `[doc]` Prefix — Documentation Requested

```
Documentation Created:
✅ documentation/features/vehicle/fleet-management/V1/bug-fix/README.md
✅ documentation/features/vehicle/fleet-management/V1/bug-fix/requirements.md
✅ documentation/features/vehicle/fleet-management/V1/bug-fix/design.md

Files placed in correct folder structure.
```

**Documentation path — CRITICAL:**

```
✅  documentation/features/vehicle/fleet-management/V1/bug-fix/README.md

❌  documentation/vehicle/fleet-management/...       (missing "features" folder)
❌  documentation/bug-fix/vehicle/...                (wrong structure)
❌  src/documentation/...                            (wrong location entirely)
```

### Deprecated Code Warning Format

```
⚠️ DEPRECATED CODE DETECTED:
The following files contain deprecated code that should be reviewed:
- VehicleDataGrid.js: legacyFilterMethod() {deprecated} → Use modernFilterService instead
- AuthService.js: oldAuthMethod() {deprecated} → Migrate to JWT-based auth

Recommendation: Consider refactoring or migrating away from deprecated code.
```

### Domain Missing Warning Format

```
⚠️ DOMAIN FOLDER NOT FOUND

I need to create files in Features/TaskManagement/ but this domain folder doesn't exist.

Proposed structure:
FMS.Application/Features/TaskManagement/
├── Commands/
├── Queries/
├── DTOs/
├── Services/
└── Validators/

Should I proceed with creating this domain structure?
```

---

## 12. Quality Checklist

Complete this checklist before submitting any code change.

### Architecture & Files

- [ ] Checked existing files/features for similar functionality
- [ ] Verified domain folder exists in `Features/{Domain}/` — asked user if missing
- [ ] Kept tightly coupled commands, queries, handlers, and small validator interfaces in the same file unless splitting was clearly justified
- [ ] DTOs are in `Features/{Domain}/DTOs/` only
- [ ] Services are in `Features/{Domain}/Services/` only
- [ ] Avoided unnecessary file splitting; only separated interfaces and implementations where reuse, size, or readability required it
- [ ] File is under 600 lines (or properly split)
- [ ] File has documentation header

### Backend

- [ ] Used proper response types (`FMSResponse`)
- [ ] Included validation
- [ ] Followed CQRS pattern without unnecessary command/query handler file splitting
- [ ] Did **NOT** modify Domain layer
- [ ] MySQL syntax is MySQL 5.5/5.6 compatible (no `CURRENT_TIMESTAMP`, no `JSON` type)
- [ ] System config key has a database entry in `systemconfigurations` table

### Frontend

- [ ] Followed naming conventions (PascalCase for domains and files)
- [ ] Added proper error handling
- [ ] Tested mobile responsiveness
- [ ] Used `tw-` prefix for all Tailwind classes
- [ ] Used SCSS (not CSS)
- [ ] Used `fa-light fa-icon` prefix for FontAwesome icons
- [ ] Applied Fluent Design styling for any new or edited UI elements
- [ ] Used button groups for 4+ adjacent buttons
- [ ] Used standard HTML checkbox inputs (NOT DevExtreme checkbox) for boolean values

### Process

- [ ] Checked for `{deprecated}` code and notified user if found
- [ ] Recommended build/test instead of auto-building
- [ ] Did **NOT** auto-generate documentation (no `[doc]` prefix in request)

---

## 13. Devices Architecture (Multi-Provider Platform)

> 🚨 **Replaces the old "PTS code lives anywhere in FMS.Application" pattern.**
> All device transport, protocol parsing, and channel code MUST live in a provider plugin under `FMS.Devices.*`. Business logic that consumes device data lives in `FMS.Application/Features/Devices/...`.
>
> **Authoritative references:** [PRD](../../documentation/features/devices/multi-device-platform/V1/implementation/PRD.md) · [Tasks](../../documentation/features/devices/multi-device-platform/V1/implementation/TASKS.md) · `.agents/skills/devices/SKILL.md`

### 13.1 Project layout — what goes where

| Project | Contains | Does NOT contain |
|---|---|---|
| `FMS.Devices.Abstractions` | Provider interfaces (`IVehicleTrackingProvider`, `IFuelingDeviceProvider`, `IFuelingPersistenceSink`), `[Provider]` attribute, capability interfaces, canonical envelopes (`DeviceMessage<T>`, `DeviceCommand<T>`). | Implementations, DB code, transport. |
| `FMS.Devices.Core` | `ProviderRegistry`, `ProviderFactory`, `DeviceMessageRouter`, `ProviderHealthMonitor`, `IProviderConfigRepository`, `IDeviceMappingRepository`, tenant-scoped resolver. | Provider-specific code, transport, parsers. |
| `FMS.Devices.Tracking` | `Providers/<Vendor>/` per tracking vendor with `Provider.cs`, `Api/`, `Configuration/`, `Services/`, `Channels/`, `Mapping/`. | Fueling code, business logic. |
| `FMS.Devices.Fueling` | `Providers/<Vendor>/` per fueling vendor with `Transport/`, `Protocol/`, `Mapping/`, `Commands/`, `Channels/`. | Tracking code, business logic. |
| `FMS.Devices.Tracking.Host` | Worker process. `AddDeviceCore().AddTrackingProviders()`. | Provider implementations. |
| `FMS.Devices.Fueling.Host` | Windows Service. `AddDeviceCore().AddFuelingProviders()`. Replaces `FMS.PTS.WindowsService`. | Provider implementations. |
| `FMS.Application/Features/Devices/` | Business logic consuming canonical MediatR notifications. Provisioning CRUD. | Transport, protocol parsing, vendor APIs. |

### 13.2 Hard rules

| ✅ DO | ❌ DON'T |
|---|---|
| Add new tracking vendor under `FMS.Devices.Tracking/Providers/<Vendor>/`. | Add tracking code in `FMS.Application/Communication`, `FMS.Infrastructure/ExternalServices`, or `FMS.BackgroundServices`. |
| Add new fueling vendor under `FMS.Devices.Fueling/Providers/<Vendor>/`. | Add fueling/PTS code in `FMS.Application/{Handlers,Communication,Command/PTSCommand}` or `FMS.PTS.WindowsService`. |
| Decorate provider with `[Provider("Name", DeviceCategory.X, Version="1.0")]`. | Manually wire providers in `Program.cs` — DI scan handles registration. |
| Branch on `provider.Capabilities.HasFlag(...)`. | Compare `provider.Name == "GPSGate"`. |
| Inject `IVehicleTrackingProvider` (resolved per-vehicle via `IProviderFactory`). | Inject `IGPSGateLocationService` etc. directly. |
| New PTS packet type → 1 `IPtsPacketMapper<TPacket,TCanonical>` + 1 keyed DI registration. | Use `[PacketType]` attribute or `MessageHandlerRegistry` — both deleted. |
| Read provider config via `IProviderConfigRepository` (tenant filter automatic). | Query `provider_configurations` directly. |
| Persist tenant-scoped data using `ITenantContext.TenantId`. | Cross-tenant access without `IBypassTenancy`. |

### 13.3 Anti-patterns — STOP if you see these

```
❌  FMS.Application/Communication/{WebSocket,Redis,Connection,HttpPolling,Tracker}/*           → fueling provider
❌  FMS.Application/Handlers/{PacketHandlers,UploadTransactions,PumpResponse,Common/PTSMessageProcessor}/*  → DELETED, replaced by mappers
❌  FMS.Application/Command/PTSCommand/*                                                       → split: serializers → fueling provider; orchestration → Features/Devices/Fueling
❌  FMS.Application/PTSServices/*                                                              → DELETED
❌  FMS.Application/Features/PTS/, /PTSDevice/, /PTSService/                                   → CONSOLIDATED into Features/Devices/Fueling
❌  FMS.Infrastructure/ExternalServices/GPS/GPSGate/*                                          → tracking provider
❌  FMS.Infrastructure/VehicleTracking/Providers/*                                             → tracking provider
❌  FMS.IoT.Contracts / FMS.IoT.Gateway / FMS.IoT.ProcessingEngine                             → DELETED entirely
❌  [PacketType("X")] reflection registry                                                     → DI-keyed mappers
❌  provider.Name == "GPSGate"                                                                → capability flag
❌  Direct _context.ProviderConfigurations.Where(...)                                          → IProviderConfigRepository
```

### 13.4 Adding a new device provider — 10-step cookbook

1. Pick the right project: `FMS.Devices.Tracking` or `FMS.Devices.Fueling`.
2. Create folder `Providers/<VendorName>/`.
3. Add `<VendorName>Provider.cs` implementing `IVehicleTrackingProvider` or `IFuelingDeviceProvider`.
4. Decorate: `[Provider("<VendorName>", DeviceCategory.<X>, Version="1.0")]`.
5. Implement only the capabilities you support; declare them via `ProviderCapabilities` flags.
6. Add subfolders as needed (tracking: `Api`, `Configuration`, `Services`, `Channels`, `Mapping`; fueling: `Transport`, `Protocol`, `Mapping`, `Commands`, `Channels`).
7. For fueling, implement `IPtsPacketMapper<TPacket,TCanonical>` per packet type if your protocol uses packets.
8. Register vendor-specific DI in a single `<VendorName>ServiceCollectionExtensions.cs` and call from `AddTrackingProviders()` / `AddFuelingProviders()`.
9. Add a row in `provider_configurations` per tenant with encrypted Settings JSON.
10. Add provider conformance tests under `FMS.Testing/Devices/<VendorName>/`.

### 13.5 Tenancy

- `provider_configurations.TenantId NOT NULL`, `device_provider_mappings.TenantId NOT NULL`.
- Repositories apply `WHERE TenantId = ITenantContext.TenantId` automatically.
- Cross-tenant reads require `IBypassTenancy` (admin-only, audited).

### 13.6 Logging categories

Add per-provider categories in `FmsLoggingConfiguration.cs` (WebClient & each host):
- Tracking: `tracking-<vendor>/` under `C:\Logs\FMS.Devices.Tracking\`.
- Fueling: `fueling-<vendor>/` under `C:\Logs\FMS.Devices.Fueling\`.

Routing by `SourceContext` namespace match (e.g. `FMS.Devices.Tracking.Providers.GpsGate.*`). Always use `ILogger<T>`. Always include `({SourceContext})` in the output template.

### 13.7 Hosts

| Host | Purpose | Replaces |
|---|---|---|
| `FMS.Devices.Fueling.Host` | WebSocket listener + Redis command channel + fueling providers. | `FMS.PTS.WindowsService` |
| `FMS.Devices.Tracking.Host` | RabbitMQ consumer + provider health + tracking providers. | Tracking jobs in `FMS.WebClient` / `FMS.BackgroundServices`. |

### 13.8 References

- PRD: `documentation/features/devices/multi-device-platform/V1/implementation/PRD.md`
- Tasks: `documentation/features/devices/multi-device-platform/V1/implementation/TASKS.md`
- Skill: `.agents/skills/devices/SKILL.md` (Copilot/Cursor) · `.claude/skills/devices/SKILL.md` (Claude Code)
- Provider cookbook: `FMS.Devices.Abstractions/README.md` (created in T6.4)

---

*FMS — Fleet Management System · Internal Developer Reference · Confidential*