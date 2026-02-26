# Warning Letter Generator — Product Requirements Document

**Version:** 1.0
**Date:** 2025-07-24
**Status:** Draft
**Domain:** Employee Discipline / Fleet Compliance
**Module Location (Backend):** `FMS.Application/Features/WarningLetter/`
**Module Location (Frontend):** `fms.frontend/src/pages/vehicles/warning-letters/`

---

## 1. Feature Overview

The Warning Letter Generator automates the creation, preview, PDF generation, and email delivery of formal warning letters to employees for fleet-related violations. Letters follow the official H. Young & Co. letterhead format and replace the current manual paper-based process.

### 1.1 Letter Types

| ID | Type | Trigger Data Source |
|----|------|---------------------|
| 1 | **Excess Fuel Consumption** | `Vehicleconsumption.FuelLost > 0` over configurable period |
| 2 | **Excessive Speed** | `Vehicleconsumption.MaxSpeed > threshold` |
| 3 | **Excessive Idling** | `Vehicleconsumption.EngHours` exceeding norms for distance |

### 1.2 Letter Workflow

```
Select Violation Record(s) → Generate Letter → Preview PDF → (Optional Edit) → Save → Email to Employee → View in History
```

---

## 2. Visual Reference

The letter template replicates the physical H. Young & Co. warning letter format:

- **Letterhead**: H. Young & Co. (EA) Ltd logo + company details
- **Title**: "WARNING LETTER" (bold, centered, red underline)
- **Body**: Formal address, violation details, remedial instruction, consequence warning
- **Signature Block**: Issuing officer name, title, date
- **Acknowledgement Block**: Employee signature line

---

## 3. Data Model

### 3.1 New Entity: `WarningLetter`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `Id` | `int` | PK | Auto-increment |
| `LetterType` | `int` | No | 1=ExcessFuel, 2=ExcessiveSpeed, 3=ExcessiveIdling |
| `EmployeeId` | `int` | No | FK → `employees.Id` |
| `VehicleId` | `int` | No | FK → `vehicles.VehicleId` |
| `SiteId` | `int` | No | FK → `sites.Id` |
| `LetterDate` | `DateTime` | No | Date printed on letter |
| `PeriodStart` | `DateTime` | No | Violation period start |
| `PeriodEnd` | `DateTime` | No | Violation period end |
| `ViolationSummary` | `string(2000)` | No | Generated text describing the violation |
| `ExpectedValue` | `decimal` | Yes | Expected consumption/speed/hours |
| `ActualValue` | `decimal` | Yes | Measured consumption/speed/hours |
| `ExcessValue` | `decimal` | Yes | Difference (actual - expected) |
| `FuelPrice` | `decimal` | Yes | Fuel price at time of letter (for cost calc) |
| `ExcessCost` | `decimal` | Yes | Monetary value of excess (fuel type only) |
| `IssuedByUserId` | `string` | No | FK → `users.Id` — the manager |
| `IssuedByName` | `string(200)` | No | Denormalized name for PDF |
| `IssuedByTitle` | `string(200)` | Yes | "Fleet Manager", "Site Supervisor", etc. |
| `PdfFilePath` | `string(500)` | Yes | Path to generated PDF |
| `EmailSentAt` | `DateTime` | Yes | When email was delivered |
| `EmailRecipient` | `string(255)` | Yes | Email address used |
| `Status` | `int` | No | 0=Draft, 1=Finalized, 2=Sent, 3=Acknowledged |
| `EmployeeAcknowledgedAt` | `DateTime` | Yes | When employee signed/acknowledged |
| `Notes` | `string(1000)` | Yes | Internal notes |
| `DateCreated` | `DateTime` | No | |
| `DateModified` | `DateTime` | Yes | |
| `CreatedBy` | `string` | No | |
| `ModifiedBy` | `string` | Yes | |

**Indexes:**
- `IX_WarningLetter_EmployeeId` on `EmployeeId`
- `IX_WarningLetter_VehicleId` on `VehicleId`
- `IX_WarningLetter_SiteId_LetterDate` on `(SiteId, LetterDate)`

### 3.2 Employee Entity Additions

| New Column | Type | Nullable | Description |
|------------|------|----------|-------------|
| `Trade` | `string(100)` | Yes | Job title / trade designation (e.g., "Driver", "Operator") |
| `Email` | `string(255)` | Yes | Employee email address |

### 3.3 Enum: `WarningLetterType`

```csharp
public enum WarningLetterType
{
    ExcessFuelConsumption = 1,
    ExcessiveSpeed = 2,
    ExcessiveIdling = 3
}
```

### 3.4 Enum: `WarningLetterStatus`

```csharp
public enum WarningLetterStatus
{
    Draft = 0,
    Finalized = 1,
    Sent = 2,
    Acknowledged = 3
}
```

---

## 4. Template Placeholders

The HTML template uses Handlebars syntax consistent with existing report templates.

| Placeholder | Source | Example |
|-------------|--------|---------|
| `{{letterDate}}` | `WarningLetter.LetterDate` | "24th July 2025" |
| `{{employeeName}}` | `Employee.FullName` | "John Mwangi" |
| `{{employeeWorkNo}}` | `Employee.EmployeeWorkNo` | "EMP-0142" |
| `{{trade}}` | `Employee.Trade` | "Driver" |
| `{{hyoungNo}}` | `Vehicle.HyoungNo` | "HY-1234" |
| `{{numberPlate}}` | `Vehicle.NumberPlate` | "KBZ 456X" |
| `{{vehicleType}}` | `VehicleType.Name` | "Truck" |
| `{{siteName}}` | `Site.Name` | "Nairobi Depot" |
| `{{periodStart}}` | `WarningLetter.PeriodStart` | "1st June 2025" |
| `{{periodEnd}}` | `WarningLetter.PeriodEnd` | "30th June 2025" |
| `{{expectedAverage}}` | `WarningLetter.ExpectedValue` | "4.5 km/l" |
| `{{actualAverage}}` | `WarningLetter.ActualValue` | "3.2 km/l" |
| `{{fuelLost}}` | `WarningLetter.ExcessValue` | "180.5 litres" |
| `{{fuelPrice}}` | `WarningLetter.FuelPrice` | "KES 150.00" |
| `{{excessCost}}` | `WarningLetter.ExcessCost` | "KES 27,075.00" |
| `{{maxSpeed}}` | `Vehicleconsumption.MaxSpeed` | "120 km/h" |
| `{{speedLimit}}` | Configurable threshold | "80 km/h" |
| `{{issuedByName}}` | `WarningLetter.IssuedByName` | "James Ochieng" |
| `{{issuedByTitle}}` | `WarningLetter.IssuedByTitle` | "Fleet Manager" |
| `{{companyName}}` | Site/System config | "H. Young & Co. (EA) Ltd" |

---

## 5. API Design

### 5.1 Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/v1/warning-letters` | List all letters (filtered by site, employee, vehicle, type, status, date range) |
| `GET` | `/api/v1/warning-letters/{id}` | Get single letter by ID |
| `GET` | `/api/v1/warning-letters/employee/{employeeId}` | Letters for specific employee |
| `GET` | `/api/v1/warning-letters/vehicle/{vehicleId}` | Letters for specific vehicle |
| `POST` | `/api/v1/warning-letters` | Create draft warning letter |
| `POST` | `/api/v1/warning-letters/{id}/generate-pdf` | Generate PDF from template |
| `POST` | `/api/v1/warning-letters/{id}/send-email` | Email PDF to employee |
| `PUT` | `/api/v1/warning-letters/{id}` | Update draft letter |
| `PUT` | `/api/v1/warning-letters/{id}/finalize` | Lock letter (Draft → Finalized) |
| `PUT` | `/api/v1/warning-letters/{id}/acknowledge` | Mark as acknowledged |
| `DELETE` | `/api/v1/warning-letters/{id}` | Delete draft letter only |
| `GET` | `/api/v1/warning-letters/{id}/pdf` | Download generated PDF |
| `POST` | `/api/v1/warning-letters/preview` | Preview PDF without saving |
| `GET` | `/api/v1/warning-letters/consumption-candidates` | Get consumption records eligible for warning (excess fuel) |

### 5.2 CQRS Structure

```
FMS.Application/Features/WarningLetter/
├── Commands/
│   ├── CreateWarningLetterCommand.cs
│   ├── CreateWarningLetterCommandHandler.cs
│   ├── UpdateWarningLetterCommand.cs
│   ├── UpdateWarningLetterCommandHandler.cs
│   ├── DeleteWarningLetterCommand.cs
│   ├── DeleteWarningLetterCommandHandler.cs
│   ├── FinalizeWarningLetterCommand.cs
│   ├── FinalizeWarningLetterCommandHandler.cs
│   ├── GenerateWarningLetterPdfCommand.cs
│   ├── GenerateWarningLetterPdfCommandHandler.cs
│   ├── SendWarningLetterEmailCommand.cs
│   ├── SendWarningLetterEmailCommandHandler.cs
│   └── AcknowledgeWarningLetterCommand.cs
│   └── AcknowledgeWarningLetterCommandHandler.cs
├── Queries/
│   ├── GetWarningLettersQuery.cs
│   ├── GetWarningLettersQueryHandler.cs
│   ├── GetWarningLetterByIdQuery.cs
│   ├── GetWarningLetterByIdQueryHandler.cs
│   ├── GetWarningLettersByEmployeeQuery.cs
│   ├── GetWarningLettersByEmployeeQueryHandler.cs
│   ├── GetWarningLettersByVehicleQuery.cs
│   ├── GetWarningLettersByVehicleQueryHandler.cs
│   ├── GetConsumptionCandidatesQuery.cs
│   └── GetConsumptionCandidatesQueryHandler.cs
├── DTOs/
│   ├── WarningLetterDto.cs
│   ├── CreateWarningLetterDto.cs
│   ├── UpdateWarningLetterDto.cs
│   ├── WarningLetterListDto.cs
│   ├── ConsumptionCandidateDto.cs
│   └── WarningLetterPreviewDto.cs
├── Services/
│   ├── IWarningLetterService.cs
│   └── WarningLetterService.cs        # Template rendering + PDF generation
├── Templates/
│   └── WarningLetterHtmlTemplates.cs   # HTML templates per letter type
└── Validators/
    ├── CreateWarningLetterValidator.cs
    └── UpdateWarningLetterValidator.cs
```

---

## 6. Frontend Design (M365 Admin Center Fluent)

### 6.1 Entry Points

**Vehicle Module** — New route `/vehicles/warning-letters`:
- Accessible from vehicle sidebar nav
- Shows letters filtered to the selected vehicle context

**Employee Module (future)** — Tab on employee detail page showing letter history

### 6.2 Page: Warning Letter List

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠ Warning Letters                                    [142]     │
│                                       [+ New Letter] [Refresh] │
├─────────────────────────────────────────────────────────────────┤
│ [All Types ▾] [All Sites ▾] [All Status ▾] [Date Range] [🔍]  │
├─────────────────────────────────────────────────────────────────┤
│ ┌─ Tabs ──────────────────────────────────────────────────────┐ │
│ │ All (142)  │  Draft (23)  │  Finalized (45)  │  Sent (74)  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Employee       │ Vehicle  │ Type          │ Date     │ Status  │
│  ─────────────────────────────────────────────────────────────  │
│  John Mwangi    │ HY-1234  │ Excess Fuel   │ 24 Jul   │ ● Sent │
│  Jane Wanjiku   │ HY-5678  │ Excess Speed  │ 23 Jul   │ ○ Draft│
│  ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

- **Design**: M365 flat data grid with status badges
- **Row actions**: View PDF, Send Email, Delete (draft only)
- **Status badges**: Draft (neutral tint), Finalized (blue tint), Sent (green tint), Acknowledged (purple tint)

### 6.3 Page: Create/Edit Warning Letter

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back    New Warning Letter                     [Save Draft]  │
│                                                  [Preview PDF] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Letter Type    [Excess Fuel Consumption ▾]                     │
│                                                                 │
│  ── Employee & Vehicle ──────────────────────────────────────── │
│  Site           [Nairobi Depot ▾]                               │
│  Employee       [🔍 Search employee...          ]               │
│  Vehicle        [🔍 Search vehicle...           ]               │
│                                                                 │
│  ── Violation Period ────────────────────────────────────────── │
│  From           [01/06/2025]    To    [30/06/2025]              │
│                                                                 │
│  ── Violation Details (auto-populated from consumption) ─────── │
│  Expected Avg   [4.5 km/l    ]                                  │
│  Actual Avg     [3.2 km/l    ] (read-only, from data)           │
│  Fuel Lost      [180.5 litres] (read-only, calculated)          │
│  Fuel Price     [KES 150.00  ]                                  │
│  Excess Cost    [KES 27,075  ] (read-only, calculated)          │
│                                                                 │
│  ── Issuing Officer ─────────────────────────────────────────── │
│  Name           [James Ochieng    ]  (from logged-in user)      │
│  Title          [Fleet Manager    ]                              │
│                                                                 │
│  ── Additional Notes ────────────────────────────────────────── │
│  [                                                             ]│
│  [                                                             ]│
│                                                                 │
│                            [Cancel]  [Save Draft]  [Preview]    │
└─────────────────────────────────────────────────────────────────┘
```

- **Auto-populate**: When employee + vehicle + period are selected, query consumption data and fill violation details
- **Fuel Price**: Defaults to latest `PumpTransaction.Price` or site default; editable
- **Excess Cost**: `FuelLost × FuelPrice` — calculated, read-only
- **Issuing Officer**: Pre-filled from JWT claims, editable

### 6.4 Page: PDF Preview

Full-page PDF preview using browser's built-in PDF viewer (`<iframe>` or `<embed>`). Actions:
- **Finalize** — locks the letter
- **Send Email** — sends to employee email (if available) with PDF attachment
- **Download** — direct PDF download
- **Print** — browser print dialog

### 6.5 Frontend File Structure

```
fms.frontend/src/pages/vehicles/warning-letters/
├── WarningLetterListPage.js          # List with filters and tabs
├── WarningLetterFormPage.js          # Create/Edit form
├── WarningLetterPreviewPage.js       # PDF preview + actions
├── components/
│   ├── WarningLetterStatusBadge.js   # Status indicator
│   ├── ConsumptionCandidateSelector.js # Pick violation records
│   └── ViolationDetailsSummary.js    # Auto-populated violation card
├── hooks/
│   └── useWarningLetterData.js       # Data fetching hook
└── warningLetterRoutes.js            # Route definitions
```

---

## 7. PDF Generation

### 7.1 Pipeline

Reuse existing HTML → PDF infrastructure:

1. **Template**: `WarningLetterHtmlTemplates.cs` → Handlebars HTML per letter type
2. **Data Binding**: `WarningLetterService.cs` builds `ExpandoObject` from entity data
3. **Rendering**: jsreport Handlebars → HTML string
4. **PDF Conversion**: `JsReportService.ConvertHtmlToPdfAsync()` → PuppeteerSharp
5. **Storage**: Save to `C:\FMSData\reports\warning-letters\{year}\{letterId}.pdf`

### 7.2 Page Setup

| Property | Value |
|----------|-------|
| Format | A4 |
| Margins | Top: 20mm, Bottom: 25mm, Left: 20mm, Right: 20mm |
| Header | Company letterhead (logo + address) |
| Footer | "This is a computer-generated letter" + page number |

### 7.3 Template Sections (Excess Fuel type)

1. **Letterhead** — Company logo, address, contact details
2. **Date & Reference** — Letter date, reference number (WL-{SiteCode}-{Year}-{Sequence})
3. **Recipient Block** — Employee name, work no, trade, site
4. **Subject Line** — "RE: WARNING – EXCESS FUEL CONSUMPTION"
5. **Body Paragraph 1** — States the violation period and vehicle
6. **Data Table** — Expected vs. Actual consumption, fuel lost, cost
7. **Body Paragraph 2** — Remedial instruction (improve driving habits, report mechanical issues)
8. **Consequence Warning** — States escalation path (verbal → written → final → termination)
9. **Signature Block** — Issuer name, title, signature line
10. **Acknowledgement** — Employee name, signature line, date line

---

## 8. Email Integration

### 8.1 Send Flow

```csharp
// Uses existing IEmailService
await _emailService.SendEmailAsync(
    to: employee.Email,
    subject: $"Warning Letter - {letterType} - {vehicle.HyoungNo}",
    body: emailBodyHtml,  // Summary email with letter attached
    isHtml: true,
    cancellationToken: ct,
    attachments: new List<EmailAttachmentDto>
    {
        new EmailAttachmentDto
        {
            FileName = $"Warning-Letter-{letter.Id}.pdf",
            ContentType = "application/pdf",
            Content = pdfBytes
        }
    }
);
```

### 8.2 Email Body

A brief HTML email (not the full letter) stating:
- "Please find attached a warning letter regarding [violation type]"
- Vehicle reference
- Period covered
- Instructions to acknowledge receipt

---

## 9. Permissions

| Permission Constant | Description |
|---------------------|-------------|
| `_Read_WarningLetter` | View warning letters list and details |
| `_Create_WarningLetter` | Create new draft letters |
| `_Update_WarningLetter` | Edit draft letters |
| `_Delete_WarningLetter` | Delete draft letters |
| `_Finalize_WarningLetter` | Lock and finalize letters |
| `_Send_WarningLetter` | Send letters via email |
| `_Generate_WarningLetter_PDF` | Generate/download PDFs |

---

## 10. Fuel Price Resolution

Since no dedicated fuel price entity exists, use this fallback chain:

1. **User-provided** — Editable field on the form (highest priority)
2. **Latest PumpTransaction.Price** — Most recent transaction for the vehicle's site
3. **AlertConfigurationConstants default** — Hardcoded 150 KES (last resort)

Future enhancement: Add a `FuelPriceConfiguration` settings table per site.

---

## 11. Configuration

### System Settings (future `SystemConfiguration` or `appsettings.json`)

| Key | Default | Description |
|-----|---------|-------------|
| `WarningLetter:PdfStoragePath` | `C:\FMSData\reports\warning-letters` | PDF file storage |
| `WarningLetter:SpeedThresholdKmh` | `80` | Max speed before triggering speed warning |
| `WarningLetter:IdlingThresholdHours` | `2.0` | Max idle hours per shift |
| `WarningLetter:DefaultFuelPriceKES` | `150.00` | Fallback fuel price |
| `WarningLetter:ExcessFuelThresholdPercent` | `15` | % over expected before eligible for warning |

---

## 12. Task List

### Phase 1 — Domain & Infrastructure

| # | Task | Files | Estimate |
|---|------|-------|----------|
| 1.1 | Create `WarningLetterType` enum | `FMS.Domain/Entities/Features/WarningLetter/WarningLetterType.cs` | 0.5h |
| 1.2 | Create `WarningLetterStatus` enum | `FMS.Domain/Entities/Features/WarningLetter/WarningLetterStatus.cs` | 0.5h |
| 1.3 | Create `WarningLetter` entity | `FMS.Domain/Entities/Features/WarningLetter/WarningLetter.cs` | 1h |
| 1.4 | Add `Trade` and `Email` columns to `Employee` entity | `FMS.Domain/Entities/Features/Employee/Employee.cs` | 0.5h |
| 1.5 | Create `WarningLetterConfiguration` (EF config) | `FMS.Persistence/EntityConfigurations/WarningLetterConfiguration.cs` | 1h |
| 1.6 | Update `EmployeeConfiguration` for new columns | `FMS.Persistence/EntityConfigurations/EmployeeConfiguration.cs` | 0.5h |
| 1.7 | Register `DbSet<WarningLetter>` in `GpsdataContext` | `FMS.Persistence/DataAccess/GpsdataContext.cs` | 0.5h |
| 1.8 | Generate MySQL migration script | `Documentation/Features/WarningLetterGenerator/V1/implementation/database/` | 1h |
| 1.9 | Add navigation property `WarningLetters` to `Employee` and `Vehicle` | Employee.cs, Vehicle.cs | 0.5h |

### Phase 2 — Application Layer (CQRS)

| # | Task | Files | Estimate |
|---|------|-------|----------|
| 2.1 | Create `WarningLetterDto` | `FMS.Application/Features/WarningLetter/DTOs/WarningLetterDto.cs` | 0.5h |
| 2.2 | Create `CreateWarningLetterDto` | `FMS.Application/Features/WarningLetter/DTOs/CreateWarningLetterDto.cs` | 0.5h |
| 2.3 | Create `UpdateWarningLetterDto` | `FMS.Application/Features/WarningLetter/DTOs/UpdateWarningLetterDto.cs` | 0.5h |
| 2.4 | Create `WarningLetterListDto` | `FMS.Application/Features/WarningLetter/DTOs/WarningLetterListDto.cs` | 0.5h |
| 2.5 | Create `ConsumptionCandidateDto` | `FMS.Application/Features/WarningLetter/DTOs/ConsumptionCandidateDto.cs` | 0.5h |
| 2.6 | Create `CreateWarningLetterCommand` + Handler | `FMS.Application/Features/WarningLetter/Commands/` | 2h |
| 2.7 | Create `UpdateWarningLetterCommand` + Handler | `FMS.Application/Features/WarningLetter/Commands/` | 1.5h |
| 2.8 | Create `DeleteWarningLetterCommand` + Handler | `FMS.Application/Features/WarningLetter/Commands/` | 1h |
| 2.9 | Create `FinalizeWarningLetterCommand` + Handler | `FMS.Application/Features/WarningLetter/Commands/` | 1h |
| 2.10 | Create `GenerateWarningLetterPdfCommand` + Handler | `FMS.Application/Features/WarningLetter/Commands/` | 3h |
| 2.11 | Create `SendWarningLetterEmailCommand` + Handler | `FMS.Application/Features/WarningLetter/Commands/` | 2h |
| 2.12 | Create `AcknowledgeWarningLetterCommand` + Handler | `FMS.Application/Features/WarningLetter/Commands/` | 1h |
| 2.13 | Create `GetWarningLettersQuery` + Handler | `FMS.Application/Features/WarningLetter/Queries/` | 1.5h |
| 2.14 | Create `GetWarningLetterByIdQuery` + Handler | `FMS.Application/Features/WarningLetter/Queries/` | 1h |
| 2.15 | Create `GetWarningLettersByEmployeeQuery` + Handler | `FMS.Application/Features/WarningLetter/Queries/` | 1h |
| 2.16 | Create `GetWarningLettersByVehicleQuery` + Handler | `FMS.Application/Features/WarningLetter/Queries/` | 1h |
| 2.17 | Create `GetConsumptionCandidatesQuery` + Handler | `FMS.Application/Features/WarningLetter/Queries/` | 2h |
| 2.18 | Create `CreateWarningLetterValidator` | `FMS.Application/Features/WarningLetter/Validators/` | 1h |
| 2.19 | Create AutoMapper profile for WarningLetter | `FMS.Application/MappingProfile/` | 0.5h |

### Phase 3 — Template & PDF Service

| # | Task | Files | Estimate |
|---|------|-------|----------|
| 3.1 | Create `WarningLetterHtmlTemplates.cs` — Excess Fuel template | `FMS.Application/Features/WarningLetter/Templates/` | 3h |
| 3.2 | Create Excessive Speed template | Same file or separate | 2h |
| 3.3 | Create Excessive Idling template | Same file or separate | 2h |
| 3.4 | Create `IWarningLetterService` interface | `FMS.Application/Features/WarningLetter/Services/` | 0.5h |
| 3.5 | Create `WarningLetterService` — template rendering + data binding | `FMS.Application/Features/WarningLetter/Services/` | 4h |
| 3.6 | Integrate with `JsReportService.ConvertHtmlToPdfAsync` for PDF output | WarningLetterService.cs | 2h |
| 3.7 | Add PDF storage path configuration to `appsettings.json` | `FMS.WebClient/appsettings.json` | 0.5h |

### Phase 4 — API Controller

| # | Task | Files | Estimate |
|---|------|-------|----------|
| 4.1 | Create `WarningLettersController` with all endpoints | `FMS.WebClient/Controllers/WarningLettersController.cs` | 3h |
| 4.2 | Add permission constants | `Permissions.cs` | 0.5h |
| 4.3 | Register `IWarningLetterService` in DI | `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs` | 0.5h |

### Phase 5 — Frontend

| # | Task | Files | Estimate |
|---|------|-------|----------|
| 5.1 | Create `warningLetterService.js` — API client | `fms.frontend/src/api/` | 1h |
| 5.2 | Create `warningLetterSlice.js` — Redux state | `fms.frontend/src/redux/` | 2h |
| 5.3 | Create `WarningLetterListPage.js` — list + filters + tabs | `fms.frontend/src/pages/vehicles/warning-letters/` | 4h |
| 5.4 | Create `WarningLetterFormPage.js` — create/edit form | Same folder | 5h |
| 5.5 | Create `WarningLetterPreviewPage.js` — PDF preview | Same folder | 2h |
| 5.6 | Create `WarningLetterStatusBadge.js` | `components/` subfolder | 1h |
| 5.7 | Create `ConsumptionCandidateSelector.js` — pick violation records | `components/` subfolder | 3h |
| 5.8 | Create `ViolationDetailsSummary.js` — auto-populated card | `components/` subfolder | 1.5h |
| 5.9 | Create `useWarningLetterData.js` hook | `hooks/` subfolder | 1h |
| 5.10 | Create `warningLetterRoutes.js` + integrate into Vehicle routes | routes file + VehicleMain.js | 1h |
| 5.11 | Create `WarningLetterList.scss` | Same folder | 1h |
| 5.12 | Create `WarningLetterForm.scss` | Same folder | 1h |
| 5.13 | Add "Warning Letters" to vehicle sidebar navigation | VehicleMain.js or layout | 0.5h |

### Phase 6 — Database & Navigation

| # | Task | Files | Estimate |
|---|------|-------|----------|
| 6.1 | Insert `navigationitems` record for Warning Letters | SQL script | 0.5h |
| 6.2 | Assign permissions to roles | SQL script | 0.5h |
| 6.3 | Run EF migration or manual schema update | Migration | 1h |

### Phase 7 — Testing

| # | Task | Files | Estimate |
|---|------|-------|----------|
| 7.1 | Unit tests for `WarningLetterService` (template rendering) | `FMS.Testing/` | 3h |
| 7.2 | Unit tests for Create/Update command handlers | `FMS.Testing/` | 2h |
| 7.3 | Unit tests for consumption candidate query | `FMS.Testing/` | 1.5h |
| 7.4 | Integration test — end-to-end PDF generation | `FMS.Testing/` | 2h |

---

## 13. Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 52 |
| **Backend Tasks** | 32 |
| **Frontend Tasks** | 13 |
| **Database Tasks** | 4 |
| **Testing Tasks** | 4 |
| **Estimated Total** | ~75 hours |
| **New Entity** | 1 (WarningLetter) |
| **Modified Entities** | 1 (Employee +2 columns) |
| **New Enums** | 2 (WarningLetterType, WarningLetterStatus) |
| **API Endpoints** | 14 |
| **Frontend Pages** | 3 |
| **Letter Types** | 3 |

---

## 14. Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Employee entity lacks `Email` field | Add column; until populated, email send disabled with clear UI message |
| Employee entity lacks `Trade` field | Add column; letters show "N/A" until populated |
| No fuel price entity | Use editable form field with smart defaults (latest PumpTransaction.Price) |
| Letterhead logo not available at all sites | Graceful fallback to text-only header (existing `BuildHtmlBlock` pattern) |
| Domain layer modification required (Employee) | Minimal addition — 2 nullable string columns, no breaking changes |

---

## 15. Out of Scope (V1)

- Bulk letter generation (batch select multiple employees/vehicles)
- Letter template designer (edit HTML via UI)
- Digital signature capture
- Escalation tracking (1st warning → 2nd → final)
- Mobile app integration
- Integration with HR systems
- Automatic letter generation via scheduled rules/alerts

These may be considered for V2 based on user feedback.
