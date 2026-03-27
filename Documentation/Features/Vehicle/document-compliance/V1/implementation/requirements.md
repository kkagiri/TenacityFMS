# Vehicle Document Compliance System Requirements

## Objective

Provide a document compliance capability for vehicles that supports requirement management, document lifecycle tracking, reminder preferences, dashboards, and event-based notification delivery.

## Functional Requirements

### Document Management

1. The system shall allow users to create, update, view, and delete vehicle documents.
2. The system shall store document number, issue date, expiry date, issuing authority, notes, document type, compliance category, and file metadata.
3. The system shall support uploading a file for a vehicle document.
4. The system shall expose a secure download path for uploaded files.

### Compliance Classification

1. The system shall classify documents by compliance category.
2. The system shall support at least these categories:
   - Insurance Certificate
   - Vehicle Registration
   - NTSA Inspection Certificate
   - KENHA Road Permit
   - KENHA Permit Exemption
   - Speed Governor Certificate
   - Driving License
   - Other
3. The system shall map common document types to a default compliance category when not explicitly provided.

### Requirement Management

1. The system shall allow requirement definitions by target scope.
2. The system shall support site-level requirements.
3. The system shall support vehicle-type-level requirements.
4. Each requirement shall define:
   - compliance category
   - document type
   - target type
   - optional site
   - optional vehicle type
   - alert lead days
   - default issuing authority
   - notes
   - active status

### Reminder Preferences

1. The system shall store reminder preferences per user and compliance category.
2. A user preference shall override the default reminder lead days where applicable.
3. The system shall enforce one preference record per user per compliance category.

### Status Evaluation

1. The system shall calculate whether a document is valid, expiring soon, or expired.
2. The system shall treat a document as expiring soon when remaining days are less than or equal to the alert lead days.
3. The system shall update document status consistently based on UTC date logic.

### Background Monitoring

1. The system shall scan vehicle documents in the background without manual user action.
2. The system shall identify both due-soon and expired documents.
3. The system shall emit a dedicated event type for compliance notification.

### Event Model

1. The system shall emit `VehicleDocumentCompliance` events.
2. The event shall include subtype values for due soon and expired scenarios.
3. The event payload shall contain vehicle, site, document, and file context needed for notification rendering.

### Event Expression Support

1. The system shall expose `Vehicle Document Compliance` as an event type in the event expression UI.
2. The system shall support the following trigger filters:
   - status
   - compliance category
   - document type
3. The system shall support the following scope filters:
   - site
   - vehicle type
   - vehicle
4. The UI shall link compliance category and document type filtering.
5. The UI shall allow `All compliance categories` and `All document types` selections.
6. The vehicle selector shall be searchable.
7. Selecting a vehicle type shall filter available vehicles.
8. Selecting a vehicle shall lock the effective vehicle type to that vehicle.

### Notification Delivery

1. The system shall support event-driven notification delivery through the existing notification service.
2. The system shall support email delivery for vehicle document compliance notifications.
3. The system shall provide a quick-start email template for the vehicle document event type.
4. The quick template shall be auto-loaded by default when the user selects `VehicleDocumentCompliance` and no custom template already exists.
5. Notifications shall include a direct document link when a file URL exists.
6. Notifications shall support binary document attachment when the file can be resolved and read from storage.

### Seeded Defaults

1. The system shall provide SQL scripts to seed the compliance schema and default requirements.
2. The system shall provide a separate SQL script to seed the default notification policy and event expression.
3. The seeded policy shall use a valid existing user in FK-backed `CreatedBy` columns.

## Non-Functional Requirements

### Database Compatibility

1. The solution shall remain compatible with MySQL 5.5 and 5.6.
2. The schema shall avoid unsupported features such as JSON columns and generated columns.

### Reliability

1. The event pipeline shall avoid duplicate notification flooding by honoring cooldown settings.
2. File attachment handling shall fail safely when a document file cannot be resolved.

### Security

1. Document files shall only be served through the existing file endpoint rules.
2. Frontend filtering and scope rules shall not replace backend validation.

### Usability

1. The event expression UI shall expose linked dropdown behavior for document compliance filters.
2. The quick-start message template shall reduce setup time for administrators.
3. The scope selector shall support fast discovery of vehicles through search.

## Assumptions

- The existing notification pipeline remains the delivery mechanism.
- Event expressions continue to reference notification policies for channel and recipient handling.
- Vehicle documents are stored with accessible file URLs that can be resolved to a physical path by the file handling service.
