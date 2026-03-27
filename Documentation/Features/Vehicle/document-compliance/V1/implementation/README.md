# Vehicle Document Compliance System

## Overview

The Vehicle Document Compliance System extends the existing vehicle document feature into a compliance-driven workflow that supports requirement definition, reminder preferences, dashboards, event-based notifications, downloadable document files, and seeded out-of-the-box alerting.

This implementation shifts the system away from the older alarm-oriented approach and aligns document expiry monitoring with the Event Expression Engine. It allows the business to define compliance expectations by site and vehicle type, track uploaded vehicle documents against those expectations, and generate structured notifications when documents are expiring soon or already expired.

## Business Goals

- Centralize vehicle compliance documents in one feature set.
- Track document validity by operational compliance category, not only by raw document type.
- Support site-specific and vehicle-type-specific compliance requirements.
- Allow user reminder preferences per compliance category.
- Trigger notifications through event expressions instead of relying on deprecated notification policy management flows.
- Include document download context and binary email attachments where available.
- Provide a seeded default configuration so the feature works immediately in development and test environments.

## Functional Scope

The system covers the following areas:

- Vehicle document CRUD with file upload and download support.
- Compliance classification using dedicated categories such as insurance, registration, inspection, KENHA permit, speed governor, and driving license.
- Default alert lead days at both requirement and document level.
- Per-user reminder lead day overrides by compliance category.
- Background expiry monitoring.
- Event emission for `VehicleDocumentCompliance`.
- Event expression filtering by site, vehicle type, vehicle, compliance category, document type, and subtype.
- Notification delivery through the existing notification pipeline.
- Email body templating and optional file attachment delivery.

## Main Components

### Data Model

The feature uses these key storage elements:

- `vehicle_documents`
  - Stores the uploaded document, expiry date, alert lead days, compliance category, status, file metadata, and audit fields.
- `vehicle_compliance_requirements`
  - Defines which document types and compliance categories are required for a target scope.
  - Supports site-level and vehicle-type-level requirement assignment.
- `vehicle_document_user_preferences`
  - Stores per-user reminder lead day overrides for each compliance category.
- `notification_policy`
  - Stores the default seeded notification policy used by the event expression.
- `event_expressions`
  - Stores the seeded `VehicleDocumentCompliance` expression and any user-managed expressions.

### Core Backend Areas

- Vehicle document management feature
  - CRUD and reporting for uploaded documents.
- Background service
  - Scans for expiring and expired documents and emits compliance events.
- Event engine
  - Evaluates expressions against `VehicleDocumentCompliance` events.
- Notification service
  - Builds message payloads and email attachments.
- File handling service
  - Resolves document URLs to physical file paths and reads binary content for attachments.

### Frontend Areas

- Vehicle documents management UI.
- Vehicle document settings panel.
- Event expression create/edit workflow.
- Scope step with linked site, vehicle type, and vehicle selectors.
- Trigger condition step with linked compliance category and document type filters.
- Message template editor with auto-loaded quick template for vehicle document compliance.

## Event-Driven Notification Model

The notification path is:

1. A vehicle document is created or maintained with expiry data and optional file metadata.
2. The background expiry service evaluates due-soon and expired documents.
3. The service emits a `VehicleDocumentComplianceEvent`.
4. The event expression engine matches the event against active expressions.
5. Matching expressions resolve a linked notification policy.
6. The notification pipeline builds message payloads, email body content, and optional file attachments.
7. Recipients receive the alert through enabled delivery channels.

## Supported Event Subtypes

- `VehicleDocumentExpiringSoon`
- `VehicleDocumentExpired`

## Supported Scope Filters

- Site
- Vehicle type
- Vehicle

The scope behavior is intentionally linked:

- Selecting a vehicle type narrows the list of selectable vehicles.
- Selecting a specific vehicle locks the effective vehicle type to that vehicle.
- Vehicle lookup is searchable by fleet number and registration.

## Supported Trigger Filters

- Status / subtype
- Compliance category
- Document type

Compliance category and document type are linked in the UI:

- The user can choose `All compliance categories`.
- Document type options narrow based on the chosen compliance category.
- Invalid combinations are cleared automatically when the category changes.

## Default Seeded Configuration

Two SQL scripts support the feature:

- `2026-03-25_employee_and_vehicle_document_compliance.sql`
  - Adds schema changes and seeded compliance requirements.
- `2026-03-25_seed_vehicle_document_compliance_event.sql`
  - Seeds the default notification policy and event expression.

The seeded event expression is configured to:

- listen for `VehicleDocumentCompliance`
- create active events
- use a high priority
- use a long cooldown suited to expiry reminders

## User Experience Summary

From the user perspective, the feature works as follows:

- Operations teams define which compliance documents are required.
- Users upload and maintain vehicle documents.
- Dashboards and reports show due soon and expired items.
- Users configure or accept default event expressions.
- The system automatically sends structured reminders with a direct document link and optional attachment.

## Key Benefits

- Better operational visibility of compliance risk.
- Reduced missed renewals.
- More precise targeting by site, vehicle type, and vehicle.
- Cleaner transition to the event expression architecture.
- Consistent message templates and quick-start defaults.

## Related Implementation Files

- `FMS.Application/Features/VehicleDocumentManagement/`
- `FMS.Application/Features/EventEngine/Events/VehicleDocumentComplianceEvent.cs`
- `FMS.Application/Features/EventEngine/Expressions/Evaluators/VehicleDocumentComplianceEvaluator.cs`
- `FMS.BackgroundServices/VehicleDocumentNotifier/VehicleDocumentExpiryNotifierService.cs`
- `FMS.Application/Features/Notification/Services/NotificationService.cs`
- `FMS.Infrastructure/Services/FileHandlingService.cs`
- `fms.frontend/src/pages/vehicles/documents/`
- `fms.frontend/src/pages/eventExpressions/`
