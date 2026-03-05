# PRD: Fuel Report Auto-Import Background Service

> **Version**: 1.0
> **Date**: 2026-03-03
> **Status**: Draft — Awaiting Approval
> **Domain**: FuelImport

---

## 1. Executive Summary

Automate the import of fuel report Excel files from a network share (currently `Z:\`) by introducing a .NET background service that monitors configured directories, parses `.xlsx` files using the **existing** import pipeline, skips duplicates, tracks every file processed, and notifies users of successes and failures via the existing notification system.

---

## 2. Problem Statement

Today, a user must:
1. Navigate to the FuelReportImporter page
2. Manually pick each `.xlsx` file (or batch-select)
3. Choose report type, site, duplicate handling
4. Wait for import + review results

With **~900 files on Z:\** organized across `Heavy Report/`, `Truck Report/`, and `Pickup Report/`, each containing monthly subfolders with ~9-12 site-level files per month, this is extremely labor-intensive. Files arrive on a regular schedule (monthly, per site) and follow a predictable naming convention.

---

## 3. What I Derived from the Existing Import Pipeline

### 3.1 File Organization on Z:\

| Folder | Report Type | File Count | Structure | Naming Pattern |
|--------|-------------|------------|-----------|----------------|
| `Z:\Heavy Report\` | **l/hr** | ~90 files | `Heavy Equipment {YEAR}/` → flat | `Heavy Equipment Fuel Report {MONTH} {YEAR}.xlsx` |
| `Z:\Truck Report\` | **km/l** | ~794 files | `{YEAR} Fuel Report/` → `{MONTH} {YEAR}/` | `{SITENAME} Fuel Report {MONTH} {YEAR}.xlsx` |
| `Z:\Pickup Report\` | **km/l** | ~1 file | Flat | `{SITENAME} Fuel Report {MONTH} {YEAR}.xlsx` |

**Key observations:**
- **Truck Report** files embed the site name in the filename → auto-detectable
- **Heavy Report** files are single consolidated files (all sites in "Location" column) → site per row
- Consistent `.xlsx` format, no `.xls` or `.csv`
- Monthly cadence, ~9-12 sites per month for trucks
- An `import_logs/` subfolder already exists under `Z:\Truck Report\` (a prior Python attempt failed)

### 3.2 Existing Parsing Capabilities

| Capability | Details | Reusable? |
|------------|---------|-----------|
| **Excel parsing** | SheetJS (`xlsx` package) — frontend only, needs .NET equivalent | Backend needs **EPPlus / ClosedXML** |
| **Column mapping** | Flexible 3-tier matching (exact → normalized → partial) | Logic must be **ported to C#** |
| **km/l columns** | Vehicle Name, Driver, Total Distance, Max Speed, Avg Speed, Expected km/l, Efficiency, Total Fuel, Fuel Lost, Comments, Date | ✅ Well-defined |
| **l/hr columns** | Vehicle Name, Driver, Location, Engine Hours, Total Fuel, Efficiency, Expected Efficiency, Fuel Lost, Flow Meter fields (4), Excess Hours Cost, Comments, Date, Night Shift | ✅ Well-defined |
| **Vehicle resolution** | Case-insensitive match on `hyoungNo`, `registrationNo`, `name` | Port to backend query |
| **Site resolution** | km/l: from filename. l/hr: from "Location" column per row | Port filename parser + site lookup |
| **Site name mappings** | `FOOTBRIDGE → BRIDGE`, `IP → Industrial Plot`, `british embassy → BHC` | Must exist as config, not hardcoded |
| **Date handling** | Excel serial numbers, Date objects, date strings | Standard in .NET |
| **Skip rows** | km/l: 8 header rows, l/hr: 6 header rows | Configurable per report type |

### 3.3 Existing Validation Rules

| Rule | Where Applied | Auto-Import Behavior |
|------|---------------|---------------------|
| Empty vehicle name | Frontend + Backend | **Skip row** — log warning |
| Vehicle not in system | Frontend + Backend | **Skip row** — log as unresolved |
| Missing date | Frontend + Backend | **Skip row** — invalid record |
| Site not matched (l/hr) | Frontend | **Skip row** — log unknown location |
| Invalid numeric fields | Frontend | **Auto-coerce** — `0` if unparseable |
| Intra-batch duplicates | Backend `FindIntraBatchDuplicatesAsync` | **Keep first** occurrence |
| DB duplicates | Backend `CheckForExistingDuplicates` | **Skip** (auto-import always skips) |
| MySQL unique constraint | Backend catch on `1062` | **Skip** — already imported |

### 3.4 Existing Backend Processing (Fully Reusable)

The **entire backend command** `ImportFuelReportCommand` is reusable as-is:
- Accepts `List<ConsumptionDTO>` + `SkipDuplicates` + `OverwriteExisting` + `UserId` + `JobId`
- Processes in batches of 100
- Tracks in `fuelreportimportlog` table
- Creates notifications via `INotificationService`
- Sends SignalR progress events

**This means the background service only needs to:**
1. Read & parse the Excel file (new C# code)
2. Map rows to `ConsumptionDTO` objects (new C# code)
3. Send the existing `ImportFuelReportCommand` via MediatR (existing)

### 3.5 Duplicate Detection (3 Layers — All Reusable)

| Layer | What it does | Auto-Import Setting |
|-------|-------------|-------------------|
| Intra-batch | Same `(VehicleId, Date, IsNightShift)` in submission | Keep first |
| DB check | Query `vehicleconsumption` for existing matches | Skip duplicates |
| MySQL constraint | `vehicle_date_shift_unique` index | Catch & skip |

**The service will ALWAYS use `SkipDuplicates = true`** — never overwrite, never fail on duplicates. This is safe for unattended operation.

### 3.6 Existing Notification Infrastructure

| Component | Already Exists? | Usage |
|-----------|----------------|-------|
| `INotificationService` | ✅ | `CreateNotificationAsync(request)` |
| `CreateNotificationRequest` | ✅ | Title, Message, Type, Recipients, SiteId |
| SignalR `FrontEndHub` | ✅ | Real-time broadcast |
| `FuelReportImportHistory` entity | ✅ | Per-import tracking with ReportId, counts, status |
| Notification categories | ✅ | `NotificationCategory` enum |

### 3.7 System Configuration Infrastructure

| Component | Already Exists? | Details |
|-----------|----------------|---------|
| `SystemConfiguration` entity | ✅ | Key-value with Category, DataType, validation |
| `SystemConfigurations` DbSet | ✅ | In GpsdataContext |
| Config management API | ✅ | CRUD endpoints exist |

---

## 4. Proposed Architecture

### 4.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 FuelReportAutoImportService                      │
│                 (BackgroundService)                               │
│                                                                  │
│  Timer Loop (configurable interval, e.g. every 30 min)          │
│       │                                                          │
│       ▼                                                          │
│  1. Read SystemConfiguration                                     │
│     ├── "FuelImport.LHr.SourcePath"  → Z:\Heavy Report          │
│     ├── "FuelImport.KmL.SourcePath"  → Z:\Truck Report          │
│     ├── "FuelImport.KmL.SourcePath2" → Z:\Pickup Report         │
│     ├── "FuelImport.ScanInterval"    → 30 (minutes)             │
│     ├── "FuelImport.AutoImport.Enabled" → true                  │
│     └── "FuelImport.SkipRows.KmL"   → 8                        │
│       │                                                          │
│       ▼                                                          │
│  2. Scan directories recursively for .xlsx files                 │
│       │                                                          │
│       ▼                                                          │
│  3. Check FuelImportFileTracker table                            │
│     ├── Already imported (same path + size + hash)? → SKIP      │
│     ├── Previously failed? → RETRY if modified since             │
│     └── New file? → QUEUE for import                            │
│       │                                                          │
│       ▼                                                          │
│  4. For each new/modified file:                                  │
│     ├── Parse filename → extract site, month, year              │
│     ├── Read .xlsx with ClosedXML/EPPlus                         │
│     ├── Map rows to ConsumptionDTO[]                             │
│     ├── Resolve vehicleId (DB lookup)                            │
│     ├── Resolve siteId (filename or Location column)            │
│     ├── Send ImportFuelReportCommand (SkipDuplicates=true)      │
│     └── Update FuelImportFileTracker with result                 │
│       │                                                          │
│       ▼                                                          │
│  5. Send summary notification                                    │
│     ├── "Auto-Import Complete: 12 files, 340 records imported"  │
│     ├── "3 files failed: [names]"                                │
│     └── Per-file details in notification Data payload            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 New Components Required

| Component | Layer | Purpose |
|-----------|-------|---------|
| `FuelReportAutoImportService` | `FMS.BackgroundServices/` | Background service (timer loop) |
| `IExcelParsingService` | `FMS.Application/Features/FuelImport/Services/` | Parse .xlsx to DTOs (C#) |
| `ExcelParsingService` | `FMS.Application/Features/FuelImport/Services/` | Implementation using ClosedXML |
| `IFileTrackerService` | `FMS.Application/Features/FuelImport/Services/` | Track file import status |
| `FileTrackerService` | `FMS.Application/Features/FuelImport/Services/` | Implementation |
| `FuelImportFileTracker` | `FMS.Domain/Entities/` | New entity — file tracking |
| `FuelImportFileTrackerConfiguration` | `FMS.Persistence/EntityConfigurations/` | EF config |
| `FuelImportSourceConfig` | DTO | Parsed system config for source paths |
| Frontend settings page | `fms.frontend/` | UI to configure source paths |

### 4.3 New Database Table: `fuel_import_file_tracker`

```sql
CREATE TABLE fuel_import_file_tracker (
    Id              INT AUTO_INCREMENT PRIMARY KEY,
    FilePath        VARCHAR(1000) NOT NULL,
    FileName        VARCHAR(500) NOT NULL,
    FileHash        VARCHAR(64) NOT NULL,          -- SHA256 of file content
    FileSizeBytes   BIGINT NOT NULL,
    FileLastModified DATETIME NOT NULL,

    ReportType      VARCHAR(10) NOT NULL,           -- 'km/l' or 'l/hr'
    DetectedSite    VARCHAR(200),                   -- Site name extracted from filename
    DetectedMonth   VARCHAR(20),                    -- Month extracted from filename
    DetectedYear    INT,                            -- Year extracted from filename
    SiteId          INT,                            -- Resolved site FK

    Status          VARCHAR(20) NOT NULL DEFAULT 'Pending',  -- Pending, Processing, Completed, Failed, Skipped
    ImportReportId  VARCHAR(100),                   -- Links to FuelReportImportHistory.ReportId

    TotalRecords    INT DEFAULT 0,
    SuccessCount    INT DEFAULT 0,
    FailedCount     INT DEFAULT 0,
    SkippedCount    INT DEFAULT 0,
    DuplicateCount  INT DEFAULT 0,

    ErrorMessage    TEXT,
    RetryCount      INT DEFAULT 0,
    MaxRetries      INT DEFAULT 3,

    FirstScannedAt  DATETIME NOT NULL,
    LastProcessedAt DATETIME,
    CreatedAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_file_hash (FileHash),
    INDEX idx_status (Status),
    INDEX idx_file_path (FilePath(255)),
    UNIQUE INDEX uq_filepath_hash (FilePath(255), FileHash)
);
```

### 4.4 System Configuration Keys

| Key | Value | DataType | Category |
|-----|-------|----------|----------|
| `FuelImport.AutoImport.Enabled` | `true` | Bool | FuelImport |
| `FuelImport.LHr.SourcePath` | `Z:\Heavy Report` | String | FuelImport |
| `FuelImport.KmL.SourcePath` | `Z:\Truck Report` | String | FuelImport |
| `FuelImport.KmL.SourcePath2` | `Z:\Pickup Report` | String | FuelImport |
| `FuelImport.ScanIntervalMinutes` | `30` | Int | FuelImport |
| `FuelImport.SkipRows.KmL` | `8` | Int | FuelImport |
| `FuelImport.SkipRows.LHr` | `6` | Int | FuelImport |
| `FuelImport.MaxRetries` | `3` | Int | FuelImport |
| `FuelImport.AutoImport.UserId` | `system` | String | FuelImport |
| `FuelImport.SiteNameMappings` | `FOOTBRIDGE:BRIDGE,IP:Industrial Plot,british embassy:BHC` | String | FuelImport |

---

## 5. Processing Rules

### 5.1 File Discovery

```
For each configured source path:
  1. Recursively scan for *.xlsx files
  2. Skip files in "import_logs/" or temp folders (~$*)
  3. Skip files < 5KB (likely empty/corrupt)
  4. Compute SHA-256 hash of file content
  5. Check fuel_import_file_tracker:
     - Same path + same hash → Already processed → SKIP
     - Same path + different hash → File modified → RE-PROCESS
     - New path → New file → PROCESS
```

### 5.2 Report Type Detection

```
Path contains "Heavy Report" or "Heavy Equipment"  → l/hr
Path contains "Truck Report"                        → km/l
Path contains "Pickup Report"                       → km/l
Otherwise → attempt both parsers, use whichever yields valid data
```

### 5.3 Site Detection from Filename

**km/l files** (Truck/Pickup):
```
Filename: "MERU Fuel Report APRIL 2025.xlsx"
  → Site: "MERU"
  → Month: "APRIL"
  → Year: 2025

Regex: ^(.+?)\s+Fuel\s+Report\s+(\w+)\s+(\d{4})\.xlsx$
  → Group 1: Site name
  → Group 2: Month name
  → Group 3: Year
```

**l/hr files** (Heavy Equipment):
```
Filename: "Heavy Equipment Fuel Report APRIL 2025.xlsx"
  → Site: per-row from "Location" column
  → Month: "APRIL"
  → Year: 2025

Regex: Heavy\s+Equipment\s+Fuel\s+Report\s+(\w+)\s+(\d{4})\.xlsx$
  → Group 1: Month name
  → Group 2: Year
```

### 5.4 Column Mapping (C# Port)

Exact port of the frontend logic:

**km/l columns** (skip first 8 rows):
| DTO Field | Excel Column Alternatives |
|-----------|--------------------------|
| `VehicleName` | "Vehicle Name" |
| `DriverName` | "Driver" |
| `TotalDistance` | "Total Distance (GPS)", "Total Distance", "Distance" |
| `MaxSpeed` | "Max Speed", "Maximum Speed" |
| `AvgSpeed` | "Average Speed", "Avg Speed", "Avg. Speed" |
| `ExpectedConsumption` | "Expected Fuel Avg (km/l)", "Expected Average", "Expected Avg", "Expected" |
| `FuelEfficiency` | "Fuel Efficiency", "Efficiency" |
| `TotalFuel` | "Total Fuel", "Fuel Used", "Fuel Consumption" |
| `FuelLost` | "Fuel Lost", "Lost Fuel" |
| `Comments` | "Comments", "Comment" |
| `Date` | "Date" |

**l/hr columns** (skip first 6 rows):
| DTO Field | Excel Column Alternatives |
|-----------|--------------------------|
| `VehicleName` | "Vehice Name" (sic), "Vehicle Name" |
| `DriverName` | "Driver Name", "Driver" |
| `LocationName` | "Location" |
| `EngHours` | "Runtime Eng hrs", "Engine Hours" |
| `TotalFuel` | "Total fuel", "Total Fuel" |
| `FuelEfficiency` | "Fuel Eff (l/hr)", "Fuel Efficiency" |
| `ExpectedConsumption` | "Expected Fuel Eff", "Expected Average" |
| `FuelLost` | "Fuel lost", "Fuel Lost" |
| `FlowMeterEngineHrs` | "Flow meter Eng Hrs", "Flow Meter Engine Hours" |
| `FlowMeterFuelUsed` | "Flow meter Total fuel", "Flow Meter Fuel" |
| `FlowMeterEfficiency` | "Flow meter Fuel eff", "Flow Meter Efficiency" |
| `FlowMeterFuelLost` | "Flow meter Fuel lost", "Flow Meter Fuel Lost" |
| `ExcessWorkingHrsCost` | "Excessive Hours (10)", "Excess Working Hours Cost" |
| `Comments` | "Comments", "Comment" |
| `Date` | "Date" |
| `IsNightShift` | Detected if comment contains "night shift" |

### 5.5 Row Validation (Auto-Import)

```
For each parsed row:
  1. Skip if vehicleName is empty/whitespace
  2. Skip if date is missing or unparseable
  3. Resolve vehicleId via DB lookup → skip if 0 (log warning)
  4. Resolve siteId:
     - km/l: from filename detection → skip entire file if unresolved
     - l/hr: from Location column per row → skip row if unresolved
  5. Coerce numeric fields: TotalFuel, FuelEfficiency, etc. → 0 if unparseable
  6. Set IsKmperLiter based on report type
  7. Set IsNightShift from comment text matching
```

### 5.6 Duplicate Handling

**Always `SkipDuplicates = true`** for auto-import:
- Same `(VehicleId, Date, IsNightShift)` already in DB → silently skip
- Same combination within the batch → keep first occurrence
- Already-imported file (same hash) → skip entire file
- Modified file (same path, new hash) → re-process with skip duplicates

---

## 6. Notification Strategy

### 6.1 Per-Scan Summary Notification

After each scan cycle completes:

```
Title: "Auto-Import Scan Complete"
Type: Info (all success) / Warning (partial) / Error (all failed)
Message: "Processed 12 files: 10 success, 2 failed, 340 records imported, 45 skipped"
```

### 6.2 Per-File Failure Notification

For each file that fails:

```
Title: "Auto-Import Failed: MERU Fuel Report APRIL 2025.xlsx"
Type: Error
Message: "Failed to import: [error description]"
```

### 6.3 Notification Recipients

- Auto-import notifications go to configured admin users
- Uses existing `INotificationService.CreateNotificationAsync()`
- DeliveryMethod: "System" (in-app notification center)

---

## 7. Frontend: Auto-Import Settings Page

A new section within the existing FuelReportImporter page (or System Configuration), allowing admins to:

1. **Enable/Disable** auto-import toggle
2. **Configure source paths** per report type (with folder browser or text input)
3. **Set scan interval** (minutes)
4. **Set skip rows** per report type
5. **Manage site name mappings** (editable key-value grid)
6. **View file tracker** — DataGrid showing all tracked files with status, last processed, retry count
7. **Manual trigger** — button to force an immediate scan
8. **View import history** — filtered to auto-import jobs

---

## 8. Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| Z:\ drive offline | Service can't scan | Catch `IOException`, log warning, retry next cycle |
| File locked (user has it open) | Can't read file | Skip file, retry next cycle |
| Corrupt/empty Excel file | Parse fails | Catch exception, mark as Failed, don't retry indefinitely |
| Wrong report type detection | Data imported with wrong columns | Conservative detection + validation catches bad mapping |
| Vehicle name changes | `vehicleId = 0` for renamed vehicles | Log unresolved vehicles, admin reviews notification |
| Massive file volume on first run | ~900 files processed at once | Process in batches of 10 files per cycle, configurable |
| Hash computation on large files | Performance concern | SHA-256 is fast, ~100 MB/s; largest files are <1 MB |

---

## 9. Implementation Phases

### Phase 1: Core Service (Backend)
1. Create `FuelImportFileTracker` entity + migration
2. Create `IExcelParsingService` / `ExcelParsingService` (ClosedXML)
3. Create `IFileTrackerService` / `FileTrackerService`
4. Create `FuelReportAutoImportService` (BackgroundService)
5. Add SystemConfiguration seed data
6. Register in DI

### Phase 2: Notifications + Monitoring
1. Wire up `INotificationService` for scan summaries
2. Add SignalR events for auto-import progress
3. Create API endpoints for file tracker CRUD + manual trigger

### Phase 3: Frontend Settings
1. Auto-Import settings panel (path config, enable/disable, interval)
2. File tracker DataGrid (status, history, retry)
3. Manual scan trigger button

---

## 10. Open Questions

| # | Question | Impact |
|---|----------|--------|
| 1 | Should the service use **FileSystemWatcher** (real-time) or **polling** (timer)? | Polling is simpler and works over network shares — recommend polling |
| 2 | Should `Z:\Pickup Report` be treated as km/l like Truck Report? | Only 1 file there; confirm with user |
| 3 | Max files per scan cycle? (900 on first run) | Suggest 20 per cycle, configurable |
| 4 | Should overwrite ever be allowed for auto-import? | Recommend NO — skip only for safety |
| 5 | Who receives failure notifications? All admins or specific users? | Configurable via SystemConfig |
| 6 | Should the service also archive processed files (move to a "processed/" subfolder)? | Optional — defer to Phase 2 |
| 7 | NuGet package choice: **ClosedXML** (MIT, free) vs **EPPlus** (commercial license required for v5+)? | Recommend ClosedXML |

---

## 11. Dependencies

| Dependency | Version | Purpose | License |
|------------|---------|---------|---------|
| **ClosedXML** | 0.102+ | Excel parsing in .NET | MIT |
| **MediatR** | 12.5 (existing) | Send ImportFuelReportCommand | MIT |
| **EF Core** | 8.0 (existing) | File tracker persistence | MIT |
| **SignalR** | (existing) | Real-time progress | MIT |

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| Manual import effort reduction | 95% — only failures need manual intervention |
| Files auto-imported per month | ~120 (12 months × 10 sites) |
| False positive rate (wrong data imported) | 0% — validation rules prevent bad data |
| Time from file appearing to imported | < 60 minutes (based on scan interval) |
| Duplicate records created | 0 — triple-layer duplicate detection |
