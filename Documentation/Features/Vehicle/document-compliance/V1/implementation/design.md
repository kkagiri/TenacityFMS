# Vehicle Document Compliance System Design

## Architecture Summary

The Vehicle Document Compliance System is built as a cross-cutting feature that spans schema, application logic, background processing, event evaluation, notification delivery, and frontend administration.

The design follows these principles:

- compliance is modeled explicitly, not inferred only from generic document types
- expiry monitoring is event-driven
- notification delivery reuses the existing notification infrastructure
- frontend configuration is optimized for quick setup and operational filtering

## Logical Design

### 1. Compliance Data Layer

The data model separates three concerns:

- actual uploaded documents
- compliance requirement definitions
- user reminder preferences

#### Vehicle Documents

`vehicle_documents` remains the primary record of real uploaded files and expiry dates.

Key additions:

- `ComplianceCategory`
- `AlertLeadDays`

This allows the system to distinguish between:

- what kind of operational compliance the document satisfies
- when reminders should begin

#### Vehicle Compliance Requirements

`vehicle_compliance_requirements` defines what should exist, independently of whether a document has already been uploaded.

This enables:

- seeded default compliance requirements by site
- future gap analysis between required and uploaded documents
- rule targeting by site or vehicle type

#### User Preferences

`vehicle_document_user_preferences` supports per-user reminder personalization by category.

This is used to move reminder behavior from a single global setting to a more practical per-user model.

## Event Design

### Event Type

The system introduces a dedicated event type:

- `VehicleDocumentCompliance`

This event isolates vehicle document expiry notifications from the older generic system-event flow.

### Event Payload

The event carries both business and delivery context. Important fields include:

- subtype
- vehicle id
- vehicle number
- vehicle type id
- vehicle type name
- site name
- document id
- document type name
- compliance category name
- document number
- issuing authority
- document file name
- expiry date
- days until expiry
- alert lead days
- document file URL

This payload supports both:

- fine-grained evaluator filtering
- rich email rendering without extra fetches during delivery

### Event Subtypes

The current subtypes are:

- `VehicleDocumentExpiringSoon`
- `VehicleDocumentExpired`

These subtype values are exposed in the event-expression trigger conditions.

## Background Processing Design

`VehicleDocumentExpiryNotifierService` is responsible for periodic scanning.

Responsibilities:

- load vehicle documents with associated vehicle, working site, and vehicle type context
- determine due-soon and expired state
- construct `VehicleDocumentComplianceEvent`
- pass the event into the event expression engine

The service is intentionally thin. The event carries all metadata needed downstream so the notification layer does not need to re-query the document.

## Event Expression Design

### Evaluator

`VehicleDocumentComplianceEvaluator` compares the incoming event against the expression conditions.

Supported condition keys:

- `subTypeFilter`
- `complianceCategoryFilter`
- `documentTypeFilter`
- `vehicleIdFilter`
- `vehicleTypeIdFilter`
- `_siteIds`

### Metadata Exposure

`EventExpressionTypeMetadataDto` exposes `Vehicle Document Compliance` to the frontend with:

- category `GPS & Vehicle`
- icon `fa-light fa-id-card`
- scope filters for site, vehicle type, and vehicle
- trigger filters for status, compliance category, and document type

### UI Linking Rules

The frontend enforces linked behavior:

- compliance category narrows document type options
- selecting vehicle type narrows vehicle list
- selecting vehicle sets the effective vehicle type
- vehicle search supports fleet number and registration

This reduces invalid combinations and speeds up configuration.

## Notification Design

### Policy Linkage

The event engine still resolves delivery through `NotificationPolicy` records.

This means the architecture is event-driven at the trigger and evaluation level, while the final channel/recipient delivery remains policy-based.

### Message Template Flow

The system supports:

- title template
- HTML message body template
- quick-start template for vehicle document compliance

The vehicle document quick template is auto-applied when:

- the selected event type is `VehicleDocumentCompliance`
- the user has not already entered a custom title or message template

### Attachment Flow

The event exposes file attachment metadata.

`NotificationService` then:

1. inspects notification data for event file attachments
2. resolves physical file paths via `IFileHandlingService`
3. reads binary file content
4. appends the file as an email attachment when within allowed size limits

This design keeps attachment logic centralized in the notification pipeline instead of scattering file reads across event handlers.

## Seed Design

Two SQL scripts are intentionally separated.

### Schema and Data Seed Script

`2026-03-25_employee_and_vehicle_document_compliance.sql`

Responsibilities:

- evolve schema
- backfill new columns
- create new compliance tables
- seed requirement records

### Event Seed Script

`2026-03-25_seed_vehicle_document_compliance_event.sql`

Responsibilities:

- resolve a valid seed user for FK-backed audit columns
- create the default notification policy
- create the default `VehicleDocumentCompliance` event expression

This separation makes rollout safer because event seeding can be applied independently of the core document schema migration.

## Frontend Design

### Event Expression Form

Relevant steps:

- Event Type & Triggers
- Scope
- Message Template

#### Trigger Conditions

The compliance category dropdown supports:

- `All compliance categories`
- explicit operational categories

The document type dropdown changes dynamically based on the chosen category.

#### Scope

The scope step supports:

- site filtering
- vehicle type filtering
- searchable vehicle lookup

This is especially important for fleets where raw vehicle IDs are not usable by administrators.

#### Message Template

The message template step provides:

- placeholder insertion
- quick-start vehicle document email template
- live preview

## Risks and Operational Notes

### Current Architectural Constraint

Although the feature is event-driven, notification delivery still depends on linked notification policies. This is intentional in the current implementation, but it means event expressions are not yet fully independent from policy records.

### File Delivery Constraint

Binary file attachment works only when:

- the stored file URL resolves successfully
- the physical file exists
- the file can be read
- attachment size remains within the configured limit

### Seed User Constraint

SQL seeding cannot use arbitrary audit values for `CreatedBy` because some tables have FK-backed references to `user(Id)`. The seed scripts therefore resolve an existing system or active user.

## Recommended Future Enhancements

- gap reporting for missing required documents
- dashboard widgets by compliance category and site
- bulk renewal workflows
- employee compliance events aligned with the same event-expression model
- admin tooling to regenerate default seeded event expressions where missing
