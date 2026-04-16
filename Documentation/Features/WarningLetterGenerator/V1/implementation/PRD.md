# Warning Letter Generator: As-Is Implementation Review

**Version:** 1.1
**Date:** 2026-04-16
**Status:** Implemented with operational dependencies
**Domain:** Employee Discipline / Fleet Compliance

**Primary implementation areas reviewed**

- `FMS.Application/Features/WarningLetter/*`
- `FMS.WebClient/Controllers/WarningLettersController.cs`
- `fms.frontend/src/pages/vehicles/warningLetters/*`
- `fms.frontend/src/pages/reports/ReportsMain.js`
- `fms.frontend/src/pages/employees/details/components/EmployeeWarningLettersWorkspace.js`
- `fms.frontend/src/pages/notifications/recipients/RecipientManagement.js`

---

## 1. Purpose

This document records the warning-letter feature as it exists in the codebase today. It is not a future-state design document. It reflects the current backend, frontend, notification, and document-handling behavior that is already wired into FMS.

---

## 2. Current Status Summary

### Implemented

1. Warning letters are implemented as a dedicated feature under `FMS.Application/Features/WarningLetter/` with CQRS commands, queries, DTOs, services, templates, and workflow-stage resolution.
2. The API supports draft creation, update, delete, finalize, preview HTML, PDF generation/download, email sending, signature request, approved-letter upload, signed-copy upload, acknowledgment, settings management, and reporting endpoints.
3. The reports workspace exposes a full warning-letter register, a multi-step creation/edit wizard, and a preview/workflow page.
4. The employee details workspace exposes employee-scoped warning-letter history and actions.
5. Generated PDFs, approved-letter uploads, and signed-copy uploads are all supported and stored separately.
6. Uploads are PDF-only and are validated against the QR/reference embedded on page 1 of the official warning-letter PDF.
7. Signature requests integrate with the notification system and site-specific recipient groups.
8. Signed-copy upload triggers issuer notification and email delivery with the signed copy attached.
9. Draft creation aligns vehicle-to-employee assignment and attempts GPSGate driver-name synchronization when the driver-name service is available.

### Current Operational Caveats

1. The primary settings UX is a slide panel opened from the list page. `WarningLetterSettingsPage.js` is now only a legacy wrapper around the same panel content.
2. Approved-letter upload is protected by `_Update_WarningLetter`; there is no separate approve-letter upload permission constant.
3. The candidate query reads `WarningLetter:ExcessFuelThresholdPercent`, but the current excess-fuel filter still uses a fixed `FuelLost > 4` condition.
4. The feature lives physically under `src/pages/vehicles/warningLetters`, but the active route surface is under the reports module: `/reports/warning-letters/*`.

---

## 3. Verified Lifecycle

### 3.1 Status Values

| Status Enum | Value | Meaning |
|---|---:|---|
| `Draft` | 0 | Initial editable record |
| `Finalized` | 1 | Finalized draft or approved-letter uploaded |
| `Sent` | 2 | Email sent or signature request sent |
| `Acknowledged` | 3 | Employee acknowledgment recorded |
| `SignedCopyReceived` | 4 | Signed copy uploaded |

### 3.2 Workflow Stages Shown in UI

Workflow stages are resolved dynamically from timestamps and status using `WarningLetterWorkflowStageResolver`.

| Workflow Stage | Value | Resolution Rule |
|---|---:|---|
| `Draft` | 0 | No approved letter, no signature request, no signed copy, no acknowledgment |
| `Approved` | 1 | `ApproveLetterUploadedAt` has value |
| `PendingSigned` | 2 | `SignatureRequestedAt` has value and no signed copy |
| `Signed` | 3 | `SignedCopyUploadedAt` has value |
| `Acknowledged` | 4 | `EmployeeAcknowledgedAt` has value or `Status == Acknowledged` |

### 3.3 Transition Coverage

| Transition | Backend Support | Frontend Support | Notes |
|---|---|---|---|
| Create draft | Yes | Yes | `POST /api/v1/warning-letters` and wizard step flow |
| Update draft | Yes | Yes | Draft edit page uses `PUT /{id}` |
| Draft -> Finalized | Yes | Yes | Explicit finalize endpoint |
| Finalized -> Approved stage | Yes | Yes | Achieved by uploading approved PDF |
| Approved -> Pending Signed | Yes | Yes | Signature request requires approved letter first |
| Pending Signed -> Signed | Yes | Yes | Signed-copy upload sets `Status = SignedCopyReceived` |
| Signed -> Acknowledged | Yes | Yes | Acknowledge action available after signed stage |
| Delete draft/early workflow item | Yes | Yes | Delete is allowed in list/workspace for draft/approved-stage records subject to ownership/permission |

### 3.4 Effective Document Priority

When a user requests the warning-letter PDF, the service returns documents in this order:

1. Signed copy, if present.
2. Approved letter upload, if present.
3. Previously generated PDF on disk, if present.
4. Newly generated PDF as a fallback.

This means the preview/download surface eventually becomes the signed operational document, not just the original generated PDF.

---

## 4. Backend Surface

### 4.1 Core Data Model

The primary entity is `FMS.Domain.Entities.Features.WarningLetterManagement.WarningLetter` stored in table `warning_letter`.

Key persisted areas used by the current workflow:

- Core identity and scope: `EmployeeId`, `VehicleId`, `SiteId`, `LetterType`, `LetterDate`, `PeriodStart`, `PeriodEnd`
- Violation metrics: `ExpectedValue`, `ActualValue`, `ExcessValue`, `FuelPrice`, `ExcessCost`, `ViolationSummary`
- Issuer metadata: `IssuedByUserId`, `IssuedByName`, `IssuedByTitle`
- Email workflow: `EmailSentAt`, `EmailRecipient`
- Signature workflow: `SignatureRequestedAt`, `SignatureRequestedBy`, `SignatureRequestRecipientUserId`, `SignatureRequestRecipient`, `SignatureRequestCcUserIds`, `SignatureRequestCcRecipients`
- Approved-letter upload track: `ApproveLetter*`
- Signed-copy upload track: `SignedCopy*`
- Acknowledgment: `EmployeeAcknowledgedAt`
- Generated PDF cache: `PdfFilePath`
- Audit: `DateCreated`, `DateModified`, `CreatedBy`, `ModifiedBy`, `Notes`

### 4.2 Draft Creation Side Effects

`CreateWarningLetterCommandHandler` does more than insert a letter record.

1. It validates employee, vehicle, site, issuing user, employee position, and site/vehicle alignment.
2. It auto-resolves issuer name/title from system configuration when configured.
3. It derives the violation summary when the caller does not supply one.
4. It auto-calculates `ExcessCost` when possible.
5. It assigns the selected employee as the vehicle default employee when needed.
6. It creates an `EmployeeVehicle` link if one does not exist.
7. It attempts GPSGate driver-name synchronization through `IGPSGateDriverNameService` when that dependency is registered.

### 4.3 Candidate Sourcing

Warning-letter candidates are built from `Vehicleconsumption` rows.

| Letter Type | Current Candidate Logic |
|---|---|
| Excess Fuel Consumption | Returns records where `FuelLost > 4` |
| Excessive Speed | Returns records where `MaxSpeed > configured speed threshold` |
| Excessive Idling | Returns records where `EngHours > configured idling threshold` |

Additional current behavior:

1. Candidates can be filtered by site, vehicle, employee, and date range.
2. Duplicate candidates are suppressed when an existing warning letter of the same type already overlaps the same vehicle/date window.
3. The handler loads `WarningLetter:ExcessFuelThresholdPercent`, but that value is not yet applied in the live fuel-candidate filter.

---

## 5. Current API Surface

Base route: `/api/v1/warning-letters`

### 5.1 Register, Details, and Settings

| Method | Route | Purpose | Primary Permission |
|---|---|---|---|
| `GET` | `/` | Filtered register | `_Read_WarningLetter` |
| `GET` | `/{id}` | Single letter detail | `_Read_WarningLetter` |
| `GET` | `/employee/{employeeId}` | Employee-scoped register | `_Read_WarningLetter` |
| `GET` | `/vehicle/{vehicleId}` | Vehicle-scoped register | `_Read_WarningLetter` |
| `GET` | `/settings` | Load settings | `_Read_WarningLetter` |
| `PUT` | `/settings` | Persist settings | `_Update_WarningLetter` |
| `GET` | `/site-recipients` | Site recipient lookup | `_Read_WarningLetter` |
| `GET` | `/{id}/signature-recipients` | Load signature-recipient options | `_Read_WarningLetter` |

### 5.2 Draft and Workflow Commands

| Method | Route | Purpose | Primary Permission |
|---|---|---|---|
| `POST` | `/` | Create draft | `_Create_WarningLetter` |
| `PUT` | `/{id}` | Update draft | `_Update_WarningLetter` |
| `DELETE` | `/{id}` | Delete letter | `_Delete_WarningLetter` |
| `POST` | `/reset-workflow-artifacts` | Reset workflow artifacts | `_Delete_WarningLetter` |
| `PUT` | `/{id}/finalize` | Finalize draft | `_Finalize_WarningLetter` |
| `PUT` | `/{id}/acknowledge` | Mark acknowledged | `_Update_WarningLetter` |

### 5.3 Preview, PDF, Email, and Uploads

| Method | Route | Purpose | Primary Permission |
|---|---|---|---|
| `POST` | `/preview` | Render preview HTML before save | `_Create_WarningLetter` |
| `GET` | `/{id}/html` | Render saved HTML | `_Read_WarningLetter` |
| `POST` | `/{id}/generate-pdf` | Generate and return PDF | `_Generate_WarningLetter_PDF` |
| `GET` | `/{id}/pdf` | Download current effective document | `_Generate_WarningLetter_PDF` |
| `POST` | `/{id}/send-email` | Email warning letter | `_Send_WarningLetter` |
| `POST` | `/{id}/request-signature` | Send signature request to site representative | `_Send_WarningLetter` |
| `POST` | `/{id}/approve-letter` | Upload approved PDF | `_Update_WarningLetter` |
| `GET` | `/{id}/approve-letter` | Download approved PDF | `_Read_WarningLetter` |
| `POST` | `/{id}/signed-copy` | Upload signed PDF | `_UploadSignedCopy_WarningLetter` |
| `GET` | `/{id}/signed-copy` | Download signed PDF | `_Read_WarningLetter` |

### 5.4 Reporting Endpoints

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/consumption-candidates` | Candidate rows for letter generation |
| `GET` | `/report/data` | Warning-letter analytics dataset |
| `GET` | `/report/candidates-data` | Candidate-report dataset |

---

## 6. Document Generation and Upload Validation

### 6.1 Template and Reference Generation

The service builds a template model that includes:

- Employee, vehicle, site, and issuer labels
- Warning sequence label (`1st`, `2nd`, `3rd`, or `LAST`)
- Metric labels and remedial wording by letter type
- Generated-by metadata
- A QR code generated from the letter reference

Reference format:

```text
WL-{SiteId}-{LetterYear}-{IdOrPreview}
```

Examples:

```text
WL-7-2026-00012
WL-7-2026-PREVIEW
```

### 6.2 Stored Document Paths

| Artifact | Current Storage |
|---|---|
| Generated PDFs | `C:\FMSData\reports\warning-letters\{year}\` |
| Uploaded approved letters | `C:\FMSData\uploads\warning-letters\approve\{warningLetterId}\` |
| Uploaded signed copies | `C:\FMSData\uploads\warning-letters\{warningLetterId}\` |
| Letterhead logo | `C:\FMSData\reports\branding\letterhead-logo.png` |

### 6.3 Upload Validation Rules

Both approved-letter and signed-copy uploads currently enforce the following rules:

1. File must be present.
2. File extension must be `.pdf`.
3. A QR code must be readable from page 1 of the uploaded PDF.
4. The QR payload must resolve to the warning letter's expected reference number.
5. Older multiline QR payloads are accepted if they include a `Reference:` line.

### 6.4 Workflow Preconditions

| Action | Current Guardrails |
|---|---|
| Send email | Letter cannot still be in `Draft` |
| Request signature | Approved letter must already be uploaded |
| Request signature | Letter cannot already be acknowledged |
| Upload approved letter | Must happen before signature request, signed-copy upload, or acknowledgment |
| Upload signed copy | Approved letter and signature request must already exist |
| Upload signed copy | Letter cannot already be acknowledged |

---

## 7. Frontend Surface

### 7.1 Active Routes

The warning-letter pages are mounted through `ReportsMain.js`.

| Route | Component |
|---|---|
| `/reports/warning-letters` | `WarningLetterListPage` |
| `/reports/warning-letters/new` | `WarningLetterFormPage` |
| `/reports/warning-letters/:id/edit` | `WarningLetterFormPage` |
| `/reports/warning-letters/:id/preview` | `WarningLetterPreviewPage` |

### 7.2 List Workspace

`WarningLetterListPage` currently provides:

1. Filters for site, employee, workflow stage, letter type, and date range.
2. Employee quick search tied to query-string persistence.
3. Draft, approved, pending-signed, signed, and acknowledged stage badges.
4. Row actions for preview, edit, acknowledge, and delete based on permissions and workflow state.
5. A slide-panel settings editor using `WarningLetterSettingsPanelContent`.

### 7.3 Create/Edit Wizard

`WarningLetterFormPage` is a four-step flow:

1. Select type and month.
2. Load and select a candidate record.
3. Review and edit letter details.
4. Generate preview HTML.

Current wizard behavior includes:

- Candidate-driven prefill of expected, actual, excess, and summary values.
- Excess-cost calculation from excess fuel and fuel price.
- Employee-position validation before preview/save.
- Auto-fill from warning-letter settings.
- Draft creation and update against the live API.

### 7.4 Preview and Workflow Page

`WarningLetterPreviewPage` currently supports:

1. PDF preview loading and regeneration.
2. Email sending.
3. Signature request with site representative selection and CC selection.
4. Approved-letter upload/download.
5. Signed-copy upload/download.
6. Acknowledge action.
7. Recipient-group inspection/editing for sites that need warning-letter recipient configuration.

### 7.5 Employee Workspace

`EmployeeWarningLettersWorkspace` exposes employee-scoped warning-letter history inside the employee details page. It provides preview, draft edit, acknowledge, delete, refresh, and navigation into the full reports workspace.

---

## 8. Notification and Recipient Groups

### 8.1 Required Group Names

The feature depends on these exact notification-group display names:

- `Warning Letter Site Representatives`
- `Warning Letter Signature CC`

These names are shared by:

1. `WarningLetterRecipientGroupResolver` on the backend.
2. `RecipientManagement.js` in the frontend warning-letter group tooling.
3. The preview page recipient-selection UX.

### 8.2 Current Notification Behavior

| Trigger | Recipients | Delivery |
|---|---|---|
| Signature request | Selected site representative | System + Email |
| Signature request | Selected CC users | Email CC |
| Signed copy uploaded | Issuer | System |
| Signed copy uploaded | Issuer with email configured | Email + signed-copy attachment |

### 8.3 Deep Link / Admin Support

The notification-recipient management page includes a dedicated warning-letter tab and site-aware group setup experience. That page can be used to ensure the required groups exist and to manage their members per site.

---

## 9. Settings and Configuration Keys

### 9.1 Keys Actively Used by Settings or Rendering

| Key | Current Use |
|---|---|
| `WarningLetter:FuelPricePerLitre` | Default fuel price for excess-fuel letters |
| `WarningLetter:IssuerName` | Fixed issuer name override |
| `WarningLetter:IssuerTitle` | Fixed issuer title override |
| `WarningLetter:MaxWarningCountBeforeLast` | Sequence threshold that switches subject to `LAST WARNING LETTER` |
| `WarningLetter:PdfStoragePath` | Optional override for generated-PDF base path |
| `IssueTracker:FrontendBaseUrl` | Base URL used when building preview links in signature-request emails |

### 9.2 Keys Used by Candidate and Report Queries

| Key | Current Use |
|---|---|
| `WarningLetter:SpeedThresholdKmh` | Speed candidate threshold |
| `WarningLetter:IdlingThresholdHours` | Idling candidate threshold |
| `WarningLetter:ExcessFuelThresholdPercent` | Loaded by candidate/report code, but not applied in the current fuel-candidate filter |

---

## 10. Permissions and Access

Current permission constants under `PermissionConstants.WarningLetter`:

| Permission | Current Use |
|---|---|
| `_Read_WarningLetter` | Read register/detail/settings |
| `_Create_WarningLetter` | Draft creation and preview |
| `_Update_WarningLetter` | Draft update, acknowledgment, settings update, approve-letter upload |
| `_UploadSignedCopy_WarningLetter` | Signed-copy upload |
| `_Delete_WarningLetter` | Delete and workflow reset |
| `_delete_any_letter` | Delete records not created by current user |
| `_Finalize_WarningLetter` | Finalize draft |
| `_Send_WarningLetter` | Email send and signature request |
| `_Generate_WarningLetter_PDF` | Generate/download effective PDF |

The included database script `database/011_warning_letter_human_resource_full_access.sql` grants Human Resource access to the warning-letter feature, including create, update, send, finalize, PDF, signed-copy upload, and supporting read permissions.

---

## 11. Current Gaps and Follow-Up Items

### Verified Gaps

1. `WarningLetter:ExcessFuelThresholdPercent` is loaded but not applied in `GetWarningLetterConsumptionCandidatesQuery` for live fuel-candidate filtering.
2. Documentation and folder naming still use `WarningLetterGenerator`, while the implemented feature namespace and code roots use `WarningLetter`.
3. The standalone settings page is no longer the primary UX path; operationally, the list-page slide panel is the active settings surface.

### Low-Risk Clarifications Worth Keeping in Mind

1. The effective PDF download is intentionally workflow-aware and may return a signed or approved upload instead of the originally generated PDF.
2. Signed-copy upload has a dedicated permission; approved-letter upload does not.
3. Signature requests depend on site notification-group membership, not arbitrary user selection.

---

## 12. Conclusion

The warning-letter feature is fully present in the live application as an operational workflow, not a placeholder module. The current implementation covers candidate discovery, draft creation, PDF generation, QR-protected document uploads, signature routing, acknowledgment, settings management, employee-scoped history, and analytics endpoints. The remaining work is mostly around cleanup and alignment, not core feature delivery.