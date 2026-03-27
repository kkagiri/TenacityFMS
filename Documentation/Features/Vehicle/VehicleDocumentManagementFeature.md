# Feature Documentation: Vehicle Document Compliance Management System

> **Version:** V2
> **Last Updated:** 2026-03-27
> **Status:** Active Production
> **Domain Folder:** `FMS.Application/Features/VehicleDocumentManagement/`

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Domain Layer](#3-domain-layer)
4. [Persistence Layer](#4-persistence-layer)
5. [Application Layer (CQRS)](#5-application-layer-cqrs)
6. [API Layer — Controller Endpoints](#6-api-layer--controller-endpoints)
7. [Background Service — Expiry Notifier](#7-background-service--expiry-notifier)
8. [Frontend Implementation](#8-frontend-implementation)
9. [Permissions](#9-permissions)
10. [Database Migrations](#10-database-migrations)
11. [Event & Notification Integration](#11-event--notification-integration)
12. [Data Flow Diagrams](#12-data-flow-diagrams)

---

## 1. Feature Overview

The Vehicle Document Compliance Management System is a full-stack feature for tracking, managing, and alerting on critical vehicle documents across a fleet. It covers insurance certificates, vehicle registrations, NTSA inspections, KENHA road permits, speed governor certificates, driving licenses, and custom document types.

### Key Capabilities

| Capability | Description |
|---|---|
| **CRUD Operations** | Create, read, update, and delete vehicle documents with full audit trail |
| **File Uploads** | Attach document files (PDF, JPG, etc.) stored in `wwwroot/vehicle-documents/{vehicleId}/` |
| **Auto Status Tracking** | Status (`Valid` → `ExpiringSoon` → `Expired`) computed from `ExpiryDate` and `AlertLeadDays` |
| **Compliance Requirements** | Define fleet-wide compliance expectations per Site or Vehicle Type |
| **Compliance Dashboard** | Aggregated stats: completed, due, expiring soon, expired, missing — grouped by Site, Vehicle Type, and Document Type |
| **Automated Daily Alerts** | Background service fires `VehicleDocumentComplianceEvent` through the Event Expression Engine |
| **Per-User Reminder Defaults** | Each user can configure default `ReminderLeadDays` per compliance category |
| **Issuing Authority Management** | Rename or delete issuing authorities across all documents |
| **Reporting** | Flattened report rows with Excel export support |
| **Vehicle Details Integration** | Separate Insurance and Licenses tabs embedded in Vehicle Details page |

---

## 2. Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend (React 18.2.0)                                           │
│  ├── VehicleDocumentsList.jsx (main page)                          │
│  │   ├── VehicleDocumentsSummaryCards.jsx                          │
│  │   ├── VehicleDocumentsFilterBar.jsx                             │
│  │   ├── VehicleDocumentsGrid.jsx (DevExtreme DataGrid)            │
│  │   ├── VehicleDocumentFormPanel.jsx (SlidePanel)                 │
│  │   ├── VehicleComplianceBulkPanel.jsx (SlidePanel)               │
│  │   ├── VehicleDocumentSettingsPanel.jsx (SlidePanel)             │
│  │   └── VehicleComplianceWidgets.jsx (Dashboard)                  │
│  ├── VehicleInsurance.js (Vehicle Details tab)                     │
│  ├── VehicleLicense.js (Vehicle Details tab)                       │
│  └── Redux: vehicleDocumentActions.js (14 thunks)                  │
├─────────────────────────────────────────────────────────────────────┤
│  API Layer                                                         │
│  └── VehicleDocumentsController.cs                                 │
│      Route: api/v1/vehicledocuments (16 endpoints)                 │
├─────────────────────────────────────────────────────────────────────┤
│  Application Layer (CQRS — MediatR)                                │
│  ├── Commands/ (7)   ├── Queries/ (10)   ├── Dtos/ (13)           │
│  └── Mapping: VehicleDocumentMappingProfile.cs                     │
├─────────────────────────────────────────────────────────────────────┤
│  Domain Layer                                                      │
│  ├── VehicleDocument.cs (entity with business logic)               │
│  ├── VehicleDocumentUserPreference.cs                              │
│  └── Enums: VehicleDocumentType, VehicleComplianceCategory,        │
│             DocumentStatus                                         │
├─────────────────────────────────────────────────────────────────────┤
│  Persistence Layer                                                 │
│  ├── VehicleDocumentConfiguration.cs → vehicle_documents           │
│  └── VehicleDocumentUserPreferenceConfiguration.cs                 │
│      → vehicle_document_user_preferences                           │
├─────────────────────────────────────────────────────────────────────┤
│  Background Service                                                │
│  └── VehicleDocumentExpiryNotifierService.cs (daily cycle)         │
│      → fires VehicleDocumentComplianceEvent via IEventExpressionEngine│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Domain Layer

### 3.1 Enumerations

#### `VehicleDocumentType` — `FMS.Domain/Entities/enums/VehicleDocumentType.cs`

```csharp
public enum VehicleDocumentType
{
    Insurance    = 1,
    Registration = 2,
    Inspection   = 3,
    RoadPermit   = 4,
    Other        = 5
}
```

#### `VehicleComplianceCategory` — `FMS.Domain/Entities/enums/VehicleComplianceCategory.cs`

Dedicated compliance categories that sit above the legacy document type enum. Dashboards and requirement assignments use these operational-language labels.

```csharp
public enum VehicleComplianceCategory
{
    InsuranceCertificate       = 1,
    VehicleRegistration        = 2,
    NtsaInspectionCertificate  = 3,
    KenhaRoadPermit            = 4,
    KenhaPermitExemption       = 5,
    SpeedGovernorCertificate   = 6,
    DrivingLicense             = 7,
    Other                      = 99
}
```

#### `DocumentStatus` — `FMS.Domain/Entities/enums/DocumentStatus.cs`

```csharp
public enum DocumentStatus
{
    Valid        = 1,
    ExpiringSoon = 2,
    Expired      = 3
}
```

### 3.2 Entities

#### `VehicleDocument` — `FMS.Domain/Entities/Features/VehicleDocumentManagement/VehicleDocument.cs`

The core entity representing a vehicle document with encapsulated business logic.

| Property | Type | Description |
|---|---|---|
| `Id` | `Guid` | Primary key (auto-generated) |
| `VehicleId` | `int` | FK to Vehicle |
| `DocumentType` | `VehicleDocumentType` | Insurance, Registration, Inspection, RoadPermit, Other |
| `ComplianceCategory` | `VehicleComplianceCategory` | Auto-resolved from DocumentType if not provided |
| `DocumentNumber` | `string` | Policy / license number |
| `IssueDate` | `DateTime` | UTC issue date |
| `ExpiryDate` | `DateTime` | UTC expiry date |
| `AlertLeadDays` | `int` | Days before expiry to trigger alert (0–365, default 30) |
| `IssuingAuthority` | `string?` | Insurance provider or issuing authority |
| `Notes` | `string?` | Free-text notes |
| `DocumentFileName` | `string?` | Original uploaded filename |
| `DocumentFileUrl` | `string?` | Relative URL to stored file |
| `Status` | `DocumentStatus` | Auto-calculated: Valid / ExpiringSoon / Expired |
| `CreatedAt` | `DateTime` | UTC creation timestamp |
| `CreatedBy` | `string` | User ID who created |
| `UpdatedAt` | `DateTime?` | UTC last update timestamp |
| `UpdatedBy` | `string?` | User ID who last updated |
| `Vehicle` | `Vehicle` | Navigation property |

**Computed Properties:**

```csharp
public int DaysUntilExpiry => (ExpiryDate.Date - DateTime.UtcNow.Date).Days;
public bool IsExpired      => DateTime.UtcNow.Date > ExpiryDate.Date;
public bool IsExpiringSoon => DaysUntilExpiry <= AlertLeadDays && !IsExpired;
```

**Key Methods:**

| Method | Description |
|---|---|
| `VehicleDocument(...)` | Constructor — sets all fields, normalizes AlertLeadDays, calls `UpdateStatus()` |
| `Update(...)` | Mutates all fields, re-normalizes, re-calculates status |
| `UpdateStatus()` | Sets `Status` based on current date vs `ExpiryDate` and `AlertLeadDays` |
| `ResolveComplianceCategory(...)` | Static helper — maps `DocumentType` → `ComplianceCategory` when not explicitly provided |
| `NormalizeAlertLeadDays(int)` | Private — clamps to 0–365 range |

**Status Calculation Logic:**

```
IF   UtcNow > ExpiryDate         → Expired
ELIF DaysUntilExpiry ≤ AlertLeadDays → ExpiringSoon
ELSE                                → Valid
```

#### `VehicleDocumentUserPreference` — `FMS.Domain/Entities/Features/VehicleDocumentManagement/VehicleDocumentUserPreference.cs`

Stores per-user default reminder lead days for each compliance category.

| Property | Type | Description |
|---|---|---|
| `Id` | `Guid` | Primary key |
| `UserId` | `string` | FK to User (CASCADE delete) |
| `ComplianceCategory` | `VehicleComplianceCategory` | Which category this reminder applies to |
| `ReminderLeadDays` | `int` | Default lead days (0–365, default 30) |
| Audit fields | — | CreatedAt/By, UpdatedAt/By |

**Constraint:** Unique on `(UserId, ComplianceCategory)` — one preference per user per category.

---

## 4. Persistence Layer

### 4.1 `VehicleDocumentConfiguration.cs`

**Table:** `vehicle_documents`

| Column | Type | Constraint |
|---|---|---|
| `Id` | `CHAR(36)` | PK, Required |
| `VehicleId` | `INT` | Required |
| `DocumentType` | `INT` | Required |
| `ComplianceCategory` | `INT` | Required, Default 99 (Other) |
| `DocumentNumber` | `VARCHAR(100)` | Required |
| `IssueDate` | `DATETIME` | Required |
| `ExpiryDate` | `DATETIME` | Required |
| `AlertLeadDays` | `INT` | Required, Default 30 |
| `IssuingAuthority` | `VARCHAR(200)` | Nullable |
| `Notes` | `VARCHAR(1000)` | Nullable |
| `DocumentFileName` | `VARCHAR(255)` | Nullable |
| `DocumentFileUrl` | `VARCHAR(500)` | Nullable |
| `Status` | `INT` | Required |
| `CreatedAt` | `DATETIME` | Required |
| `CreatedBy` | `VARCHAR(100)` | Required |
| `UpdatedAt` | `DATETIME` | Nullable |
| `UpdatedBy` | `VARCHAR(100)` | Nullable |

**Indexes:**

| Index Name | Column(s) | Type |
|---|---|---|
| `IX_vehicle_documents_VehicleId` | VehicleId | Non-unique |
| `IX_vehicle_documents_ExpiryDate` | ExpiryDate | Non-unique |
| `IX_vehicle_documents_DocumentType` | DocumentType | Non-unique |
| `IX_vehicle_documents_ComplianceCategory` | ComplianceCategory | Non-unique |
| `IX_vehicle_documents_Status` | Status | Non-unique |
| `UK_vehicle_documents_VehicleId_DocumentType_DocumentNumber` | (VehicleId, DocumentType, DocumentNumber) | **Unique** |

### 4.2 `VehicleDocumentUserPreferenceConfiguration.cs`

**Table:** `vehicle_document_user_preferences`

| Column | Type | Constraint |
|---|---|---|
| `Id` | `CHAR(36)` | PK, Required |
| `UserId` | `VARCHAR(100)` | Required |
| `ComplianceCategory` | `INT` | Required |
| `ReminderLeadDays` | `INT` | Required, Default 30 |
| Audit columns | — | Same pattern as above |

**Indexes:** `IX_vehicle_document_user_preferences_UserId` (non-unique)
**Unique:** `UK_vehicle_document_user_preferences_UserId_ComplianceCategory`

**Foreign Keys:**

| Constraint | Target | On Delete |
|---|---|---|
| `FK_..._User` | `user(Id)` | CASCADE |
| `FK_..._CreatedBy` | `user(Id)` | RESTRICT |
| `FK_..._UpdatedBy` | `user(Id)` | SET NULL |

### 4.3 DbContext Registration

```csharp
// GpsdataContext.cs
public virtual DbSet<VehicleDocument> VehicleDocuments { get; set; }
public virtual DbSet<VehicleDocumentUserPreference> VehicleDocumentUserPreferences { get; set; }
```

---

## 5. Application Layer (CQRS)

**Location:** `FMS.Application/Features/VehicleDocumentManagement/`

All commands and queries use MediatR with command/handler co-located in the same file.

### 5.1 Commands (7)

| File | Record | Purpose |
|---|---|---|
| `CreateVehicleDocumentCommand.cs` | `CreateVehicleDocumentCommand(CreateVehicleDocumentDto)` | Creates new document, saves uploaded file via `IFileHandlingService`, resolves ComplianceCategory, normalizes AlertLeadDays |
| `UpdateVehicleDocumentCommand.cs` | `UpdateVehicleDocumentCommand(UpdateVehicleDocumentDto)` | Updates existing document, optionally replaces file. Returns `FMSResponse<bool>` |
| `DeleteVehicleDocumentCommand.cs` | `DeleteVehicleDocumentCommand(Guid)` | Deletes document via `ExecuteDeleteAsync()` |
| `SaveVehicleDocumentUserPreferencesCommand.cs` | `SaveVehicleDocumentUserPreferencesCommand(SaveVehicleDocumentUserPreferencesDto)` | Bulk upsert user reminder defaults; validates unique (UserId, ComplianceCategory) |
| `RenameVehicleDocumentIssuingAuthorityCommand.cs` | `RenameVehicleDocumentIssuingAuthorityCommand(RenameVehicleDocumentIssuingAuthorityDto)` | Batch renames an issuing authority name across all documents |
| `DeleteVehicleDocumentIssuingAuthorityCommand.cs` | `DeleteVehicleDocumentIssuingAuthorityCommand(DeleteVehicleDocumentIssuingAuthorityDto)` | Clears an issuing authority name from all matching documents |
| `BulkCreateVehicleComplianceRequirementsCommand.cs` | `BulkCreateVehicleComplianceRequirementsCommand(VehicleComplianceBulkAssignmentDto)` | Creates compliance requirements by Site or VehicleType, skipping duplicates. Returns success/failed/skipped counts |

### 5.2 Queries (10)

| File | Record | Returns | Purpose |
|---|---|---|---|
| `GetVehicleDocumentsQuery.cs` | `GetVehicleDocumentsQuery` | `List<VehicleDocumentDto>` | Filterable by VehicleId?, DocumentType?, ComplianceCategory?, Status? |
| `GetVehicleDocumentsByVehicleIdQuery.cs` | `GetVehicleDocumentsByVehicleIdQuery(int)` | `List<VehicleDocumentDto>` | Shorthand for single vehicle |
| `GetVehicleDocumentByIdQuery.cs` | `GetVehicleDocumentByIdQuery(Guid)` | `VehicleDocumentDto` | Single document by ID |
| `GetExpiringDocumentsQuery.cs` | `GetExpiringDocumentsQuery` | `List<VehicleDocumentDto>` | Documents within DaysThreshold (default 30) |
| `GetVehicleComplianceRequirementsQuery.cs` | `GetVehicleComplianceRequirementsQuery` | `List<VehicleComplianceRequirementDto>` | All active requirements with site/vehicleType details |
| `GetVehicleComplianceDashboardQuery.cs` | `GetVehicleComplianceDashboardQuery` | `VehicleComplianceDashboardDto` | Complex aggregation: expands requirements by scope, joins latest documents, calculates summary stats |
| `GetVehicleDocumentReportQuery.cs` | `GetVehicleDocumentReportQuery` | `List<VehicleDocumentReportRowDto>` | Flattened report rows for export |
| `GetVehicleDocumentIssuingAuthoritiesQuery.cs` | `GetVehicleDocumentIssuingAuthoritiesQuery` | `List<VehicleDocumentIssuingAuthorityDto>` | Distinct authority names with usage counts |
| `GetVehicleDocumentUserPreferencesQuery.cs` | `GetVehicleDocumentUserPreferencesQuery(string)` | `List<VehicleDocumentUserPreferenceDto>` | Per-user reminder defaults |
| `VehicleDocumentQueryProjection.cs` | Extension method | — | `ProjectToVehicleDocumentRows()` converts EF entity to internal query DTO |

### 5.3 DTOs (13)

| DTO | Location | Purpose |
|---|---|---|
| `VehicleDocumentDto.cs` | `Dtos/` | Output DTO — full document with display names for enums, computed DaysUntilExpiry |
| `CreateVehicleDocumentDto.cs` | `Dtos/` | Input — VehicleId, DocumentType, ComplianceCategory?, DocumentNumber, IssueDate, ExpiryDate, AlertLeadDays (default 30), IssuingAuthority, Notes?, UserId (set by controller), DocumentFile (required `IFormFile`) |
| `UpdateVehicleDocumentDto.cs` | `Dtos/` | Input — Same as Create + Id, DocumentFile optional |
| `VehicleDocumentUserPreferenceDto.cs` | `Dtos/` | Output — user preference with category name |
| `VehicleDocumentUserPreferenceValueDto.cs` | `Dtos/` | Input — (ComplianceCategory, ReminderLeadDays) pair |
| `SaveVehicleDocumentUserPreferencesDto.cs` | `Dtos/` | Input — UserId + list of preference values |
| `VehicleComplianceRequirementDto.cs` | `Dtos/` | Output — requirement with linked site/vehicleType info |
| `VehicleComplianceDashboardDto.cs` | `Dtos/` | Output — TotalApplicableRequirements, CompletedCount, DueCount, ExpiringSoonCount, ExpiredCount, MissingCount + grouped summaries (BySite, ByVehicleType, ByDocumentType) |
| `VehicleComplianceBulkAssignmentDto.cs` | `Dtos/` | Input — target mode, compliance category, target ID list |
| `VehicleComplianceBulkAssignmentResultDto.cs` | `Dtos/` | Output — success/failed/skipped counts |
| `VehicleDocumentReportRowDto.cs` | `Dtos/` | Output — flattened report row for export |
| `VehicleDocumentIssuingAuthorityDto.cs` | `Dtos/` | Output — authority name + usage count |
| `RenameVehicleDocumentIssuingAuthorityDto.cs` | `Dtos/` | Input — old name, new name |
| `DeleteVehicleDocumentIssuingAuthorityDto.cs` | `Dtos/` | Input — authority name to delete |

### 5.4 Mapping Profile

**File:** `FMS.Application/MappingProfile/VehicleDocumentMappingProfile.cs`

- Maps `VehicleDocument` entity ↔ DTOs
- Normalizes file URL (prepends `/api/v1/files/` prefix if missing)
- Maps enum values to display-friendly names

### 5.5 File Handling Service

| File | Purpose |
|---|---|
| `IFileHandlingService.cs` | Interface — `SaveFileAsync()`, `DeleteFileAsync()` |
| `FileHandlingService.cs` | Implementation — saves/deletes files in `wwwroot/vehicle-documents/{vehicleId}/` |

---

## 6. API Layer — Controller Endpoints

**File:** `FMS.WebClient/Controllers/VehicleManagement/VehicleDocumentsController.cs`
**Route Base:** `api/v1/vehicledocuments`
**Auth:** JWT-based, `[Authorize]` + `[RequirePermission(Permissions.Vehicle.Read)]`

### Endpoint Reference

| # | Method | Route | Purpose | Request |
|---|---|---|---|---|
| 1 | `GET` | `/` | List documents (filterable) | `[FromQuery] GetVehicleDocumentsQuery` |
| 2 | `GET` | `/{id}` | Get single document | Path: `Guid id` |
| 3 | `POST` | `/` | Create document | `[FromForm] CreateVehicleDocumentDto` (multipart) |
| 4 | `PUT` | `/{id}` | Update document | `[FromForm] UpdateVehicleDocumentDto` (multipart) |
| 5 | `DELETE` | `/{id}` | Delete document | Path: `Guid id` |
| 6 | `GET` | `/vehicle/{vehicleId}` | Documents for vehicle | Path: `int vehicleId` |
| 7 | `GET` | `/expiring` | Expiring documents | `[FromQuery] GetExpiringDocumentsQuery` |
| 8 | `GET` | `/compliance/requirements` | List compliance requirements | — |
| 9 | `GET` | `/compliance/dashboard` | Compliance dashboard stats | — |
| 10 | `POST` | `/compliance/requirements/bulk` | Bulk create requirements | `[FromBody] VehicleComplianceBulkAssignmentDto` |
| 11 | `GET` | `/report` | Document report rows | `[FromQuery] GetVehicleDocumentReportQuery` |
| 12 | `GET` | `/settings/issuing-authorities` | List issuing authorities | — |
| 13 | `PUT` | `/settings/issuing-authorities` | Rename issuing authority | `[FromBody] RenameVehicleDocumentIssuingAuthorityDto` |
| 14 | `POST` | `/settings/issuing-authorities/delete` | Delete issuing authority | `[FromBody] DeleteVehicleDocumentIssuingAuthorityDto` |
| 15 | `GET` | `/settings/reminder-defaults/current-user` | User's reminder defaults | — |
| 16 | `PUT` | `/settings/reminder-defaults/current-user` | Save reminder defaults | `[FromBody] SaveVehicleDocumentUserPreferencesDto` |

**Notes:**
- Create and Update use `[FromForm]` for `multipart/form-data` (file uploads)
- User ID is extracted from JWT claims (`ClaimTypes.NameIdentifier` or `"sub"`)
- All endpoints return `FMSResponse<T>` with appropriate HTTP status codes

---

## 7. Background Service — Expiry Notifier

**File:** `FMS.BackgroundServices/VehicleDocumentNotifier/VehicleDocumentExpiryNotifierService.cs`
**Type:** `BackgroundService` (hosted service)
**Schedule:** Runs once per 24-hour cycle
**Registration:** `services.AddHostedService<VehicleDocumentExpiryNotifierService>()`

### Processing Logic

```
1. Fetch all documents with ExpiryDate ≤ today + 365 days
   (includes Vehicle → WorkingSite and Vehicle → VehicleType navigation)

2. For each document, calculate DaysUntilExpiry:
   IF daysUntilExpiry == AlertLeadDays → fire "VehicleDocumentExpiringSoon"
   IF daysUntilExpiry == 0            → fire "VehicleDocumentExpired" (expires today)
   IF daysUntilExpiry < 0             → fire "VehicleDocumentExpired" (already expired)

3. Priority determination:
   IF daysUntilExpiry ≤ min(AlertLeadDays, 7) → "High"
   ELSE → "Medium"

4. Fire VehicleDocumentComplianceEvent through IEventExpressionEngine

5. Batch update: set Status = Expired for documents past expiry that still show non-Expired status
```

### Event Payload (`VehicleDocumentComplianceEvent`)

| Field | Source |
|---|---|
| `EventType` | `"VehicleDocumentCompliance"` |
| `SubType` | `"VehicleDocumentExpiringSoon"` or `"VehicleDocumentExpired"` |
| `Severity` | `"High"` or `"Medium"` |
| `SiteId` | `Vehicle.WorkingSiteId` |
| `SourceComponent` | `"VehicleDocumentNotifier"` |
| `Message` | Human-readable message (e.g., "Insurance for KBZ 123A expired 5 days ago.") |
| `DocumentId` | Document GUID |
| `VehicleId`, `VehicleNo` | Vehicle FK and plate number |
| `ComplianceCategoryName` | Category display name |
| `DocumentNumber` | Policy / license number |
| `ExpiryDate` | UTC expiry date |
| `DaysUntilExpiry` | Positive (expiring) or negative (expired) |
| `AlertLeadDays` | Configured threshold for this document |
| `DocumentFileUrl` | Normalized URL (with `/api/v1/files/` prefix) |

---

## 8. Frontend Implementation

### 8.1 API Layer

**File:** `fms.frontend/src/redux/actions/vehicleDocumentActions.js`

14 Redux thunks covering all CRUD, compliance, and settings operations:

| Thunk | HTTP | Endpoint |
|---|---|---|
| `getVehicleDocuments(vehicleId?)` | GET | `/vehicledocuments` or `/vehicledocuments/vehicle/{id}` |
| `createVehicleDocument(formData)` | POST | `/vehicledocuments` (multipart) |
| `updateVehicleDocument(id, formData)` | PUT | `/vehicledocuments/{id}` (multipart) |
| `deleteVehicleDocument(id)` | DELETE | `/vehicledocuments/{id}` |
| `getVehicleComplianceRequirements()` | GET | `/vehicledocuments/compliance/requirements` |
| `getVehicleComplianceDashboard()` | GET | `/vehicledocuments/compliance/dashboard` |
| `bulkCreateVehicleComplianceRequirements(payload)` | POST | `/vehicledocuments/compliance/requirements/bulk` |
| `getVehicleDocumentIssuingAuthorities()` | GET | `/vehicledocuments/settings/issuing-authorities` |
| `getVehicleDocumentUserPreferences()` | GET | `/vehicledocuments/settings/reminder-defaults/current-user` |
| `saveVehicleDocumentUserPreferences(payload)` | PUT | `/vehicledocuments/settings/reminder-defaults/current-user` |
| `renameVehicleDocumentIssuingAuthority(payload)` | PUT | `/vehicledocuments/settings/issuing-authorities` |
| `deleteVehicleDocumentIssuingAuthority(payload)` | POST | `/vehicledocuments/settings/issuing-authorities/delete` |

### 8.2 Component Architecture

**Location:** `fms.frontend/src/pages/vehicles/documents/`

```
VehicleDocumentsList.jsx           ← Main page (container state, orchestration)
├── components/
│   ├── VehicleDocumentsSummaryCards.jsx   ← Status cards (All / Done / Due soon / Expired)
│   ├── VehicleDocumentsFilterBar.jsx      ← M365 flat filter row (Vehicle / Site / VehicleType / Category / Status)
│   ├── VehicleDocumentsGrid.jsx           ← DevExtreme DataGrid (13 columns, search, filter rows, Excel export)
│   ├── VehicleDocumentFormPanel.jsx       ← SlidePanel form (add/edit: scope, details, file upload)
│   ├── VehicleComplianceBulkPanel.jsx     ← SlidePanel for bulk requirement creation
│   ├── VehicleDocumentSettingsPanel.jsx   ← SlidePanel for reminder defaults & authority management
│   └── VehicleComplianceWidgets.jsx       ← Dashboard widgets (hero cards + 3 reporting tables)
VehicleDocuments.shared.js         ← Constants, helpers, normalization
VehicleDocumentsList.scss          ← M365 Fluent Design styling
```

### 8.3 Shared Utilities

**File:** `fms.frontend/src/pages/vehicles/documents/VehicleDocuments.shared.js`

**Constants:**
- `DOCUMENT_TYPE_OPTIONS` — 5 document types
- `COMPLIANCE_CATEGORY_OPTIONS` — 8 compliance categories
- `STATUS_FILTER_OPTIONS` — 4 statuses (All, Valid, Expiring Soon, Expired)
- `REQUIREMENT_TARGET_OPTIONS` — Site / VehicleType
- `DEFAULT_NOTIFICATION_REMINDER_SETTINGS` — all categories default to 30 days
- `FALLBACK_COMPLIANCE_RULES` — hardcoded DocumentType → Category mappings

**Helper Functions:**

| Function | Purpose |
|---|---|
| `parseNotificationReminderSettings(value)` | Normalize settings to object |
| `getDefaultReminderDays(settings, category)` | Return reminder days for a category |
| `normalizeDocument(doc)` | Standardize field names from API |
| `buildDocumentComplianceCatalog(requirements, documents)` | Create lookup table for compliance entries |
| `getComplianceEntry(catalog, category)` | Look up a compliance entry |
| `getStatusDescriptor(document)` | Return `{ label, cssClass }` for status badge |
| `toDateInputValue(date)` | Format date for `<input type="date">` |
| `formatDisplayDate(date)` | Format date for display |

### 8.4 Vehicle Details Integration

Documents are also accessible from the Vehicle Details page through two dedicated tabs:

| Component | Location | DocumentType Filter |
|---|---|---|
| `VehicleInsurance.js` | `fms.frontend/src/pages/vehicles/details/components/` | `DocumentType = 1` (Insurance) |
| `VehicleLicense.js` | `fms.frontend/src/pages/vehicles/details/components/` | `DocumentType = 2` (Registration) |

Both components use the same `vehicleDocumentActions.js` Redux thunks, filtering by `DocumentType` and `VehicleId`.

### 8.5 Styling

**File:** `fms.frontend/src/pages/vehicles/documents/VehicleDocumentsList.scss`

Follows the **M365 Fluent Design** system:

- Segoe UI typography, 13px base font
- Microsoft Blue `#0078d4` primary accent
- Flat surfaces with 1px neutral borders
- 34px compact controls with 4px border-radius
- Status badges with dynamic tones: `--valid` (green), `--expiring` (orange), `--expired` (red)
- Responsive: card grid collapses on mobile, filter bar stacks vertically

---

## 9. Permissions

**File:** `FMS.Application/Common/Constants/PermissionConstants.cs`
**Class:** `Permissions.VehicleDocuments`

| Constant | Value | Controls |
|---|---|---|
| `Read` | `_Read_VehicleDocuments` | View documents and dashboard |
| `Create` | `_Create_VehicleDocuments` | Create new documents |
| `Edit` | `_Edit_VehicleDocuments` | Update existing documents |
| `Delete` | `_Delete_VehicleDocuments` | Delete documents |

**Controller-level:** The controller uses `[RequirePermission(Permissions.Vehicle.Read)]` at the class level. Individual action-level permission checks can be added for write operations.

**Frontend:** Permission checks via `usePermissions()` hook for UX gating (hide/disable buttons). Backend always validates authoritatively.

---

## 10. Database Migrations

### Migration 1: Schema Updates

**File:** `Documentation/Database/Migrations/2026-03-25_employee_and_vehicle_document_compliance.sql`

**Changes:**
1. **ALTER** `vehicle_documents` — add `ComplianceCategory` (INT, DEFAULT 99) and `AlertLeadDays` (INT, DEFAULT 30)
2. **INDEX** `IX_vehicle_documents_ComplianceCategory`
3. **BACKFILL** existing rows: map DocumentType → ComplianceCategory, default AlertLeadDays to 30
4. **CREATE** `vehicle_compliance_requirements` table (Id, Name, ComplianceCategory, DocumentType, TargetType, SiteId?, VehicleTypeId?, AlertLeadDays, DefaultIssuingAuthority, Notes, IsActive, audit)
5. **CREATE** `vehicle_document_user_preferences` table (Id, UserId, ComplianceCategory, ReminderLeadDays, audit, unique constraint, FK cascades)

All SQL uses MySQL 5.5/5.6 compatible syntax (DATETIME NULL, no CURRENT_TIMESTAMP defaults, no JSON type).

### Migration 2: Event Seed Data

**File:** `Documentation/Database/Migrations/2026-03-25_seed_vehicle_document_compliance_event.sql`

**Seeds:**
1. **Notification Policy** — `"Vehicle Document Compliance - Default Policy"` (High priority, system notification enabled, 1440 min cooldown)
2. **Event Expression** — `"Vehicle Document Compliance"` (EventType: `VehicleDocumentCompliance`, system expression, linked to seeded policy)

---

## 11. Event & Notification Integration

The feature integrates with the **Event Expression Engine** (not the legacy Alarm system).

### Event Flow

```
VehicleDocumentExpiryNotifierService (daily)
    │
    ├── Constructs VehicleDocumentComplianceEvent
    │   (EventType = "VehicleDocumentCompliance")
    │
    └── await eventEngine.ProcessAsync(docEvent)
            │
            ├── Matches against event_expressions (seeded: "Vehicle Document Compliance")
            │
            ├── Evaluates cooldown (1440 min / 24h per document)
            │
            ├── Creates ActiveEvent (if CreateActiveEvent = true)
            │
            └── Dispatches via NotificationPolicy:
                ├── System notification (enabled)
                ├── Email (enabled)
                └── SMS (disabled)
```

### Notification Templates (from seed SQL)

| Template | Pattern |
|---|---|
| **Title** | `Vehicle document {{SubType}} - {{VehicleNo}}` |
| **Message** | `{{ComplianceCategoryName}} for {{VehicleNo}} is due on {{ExpiryDate}}.` |

---

## 12. Data Flow Diagrams

### Document Creation Flow

```
User fills form → POST /vehicledocuments (multipart/form-data)
    │
    ├── Controller extracts UserId from JWT
    ├── MediatR → CreateVehicleDocumentCommand
    │   ├── IFileHandlingService.SaveFileAsync() → wwwroot/vehicle-documents/{vehicleId}/
    │   ├── VehicleDocument.ResolveComplianceCategory()
    │   ├── new VehicleDocument(...) → NormalizeAlertLeadDays, UpdateStatus
    │   ├── _context.VehicleDocuments.Add(entity)
    │   └── _context.SaveChangesAsync()
    └── Returns FMSResponse<VehicleDocumentDto>
```

### Compliance Dashboard Flow

```
GET /vehicledocuments/compliance/dashboard
    │
    ├── GetVehicleComplianceDashboardQuery
    │   ├── Load all active compliance requirements
    │   ├── Expand requirements to specific vehicles by scope:
    │   │   ├── TargetType = Site → all vehicles at that site
    │   │   └── TargetType = VehicleType → all vehicles of that type
    │   ├── For each (vehicle, category) pair:
    │   │   └── Find latest document → classify as Completed/Due/ExpiringSoon/Expired/Missing
    │   ├── Aggregate totals
    │   └── Group by: Site, VehicleType, DocumentType
    └── Returns VehicleComplianceDashboardDto
```

### Daily Expiry Check Flow

```
VehicleDocumentExpiryNotifierService (every 24 hours)
    │
    ├── Query: documents WHERE ExpiryDate ≤ today + 365 days
    │   (with Vehicle → WorkingSite, Vehicle → VehicleType includes)
    │
    ├── For each document:
    │   ├── Calculate daysUntilExpiry
    │   ├── IF matches AlertLeadDays threshold OR expired:
    │   │   ├── Build VehicleDocumentComplianceEvent
    │   │   └── await eventEngine.ProcessAsync(event)
    │   └── ELSE skip
    │
    ├── Batch status update:
    │   ├── Query: documents WHERE ExpiryDate < today AND Status ≠ Expired
    │   ├── For each: entity.UpdateStatus()
    │   └── SaveChangesAsync()
    │
    └── Sleep 24 hours → repeat
```

---

*Vehicle Document Compliance Management System · FMS Internal Documentation · Last Updated: 2026-03-27*
