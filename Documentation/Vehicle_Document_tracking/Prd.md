# Product Requirements Document: Vehicle Document Expiry Tracking System

## 1. Overview

### 1.1 Purpose
The Vehicle Document Expiry Tracking System enables fleet managers to track, manage, and receive notifications for expiring vehicle-related documents including insurance, road permits, and NTSA inspections.

### 1.2 Goals
- Prevent vehicles from operating with expired documentation
- Automate expiry notifications to relevant stakeholders
- Provide centralized document management for fleet vehicles
- Ensure regulatory compliance for all fleet vehicles

---

## 2. Features & Requirements

### 2.1 Core Features

#### Feature 1: Document Management
**User Stories:**
- As a fleet manager, I want to create document records for vehicles so I can track their expiry dates
- As a fleet manager, I want to view all documents for a specific vehicle
- As a fleet manager, I want to delete obsolete document records
- As a fleet manager, I want to update document information when renewals occur

#### Feature 2: Document Types
The system will support the following document types:
- **Insurance** - Vehicle insurance certificates
- **Road Permit** - Road usage permits/licenses
- **NTSA Inspection** - National Transport and Safety Authority inspection certificates

#### Feature 3: Expiry Notifications
**User Stories:**
- As a fleet manager, I want to receive notifications 30 days before document expiry
- As a fleet manager, I want to receive notifications 7 days before document expiry
- As a fleet manager, I want to receive notifications on the day of expiry
- As a fleet manager, I want to receive notifications for expired documents (daily until renewed)

**Notification Channels:**
- In-app notifications (real-time via SignalR)
- Email notifications (optional)
- Dashboard alerts/badges

---

## 3. User Interface Requirements

### 3.1 Navigation
- Location: Under **Vehicles > Maintenance** section
- New menu item: "Vehicle Documents" or "Document Tracking"

### 3.2 Document List View
**Components:**
- Data table with filtering and sorting
- Search by vehicle registration, document type
- Filter by: Document Type, Status (Valid/Expiring Soon/Expired), Vehicle
- Columns:
  - Vehicle Registration Number
  - Document Type
  - Document Number
  - Issue Date
  - Expiry Date
  - Status (badge: Valid/Warning/Expired)
  - Days Until Expiry
  - Actions (View/Edit/Delete)

### 3.3 Create/Edit Document Form
**Fields:**
- Vehicle Selection (dropdown)
- Document Type (dropdown: Insurance, Road Permit, NTSA Inspection)
- Document Number (text input)
- Issue Date (date picker)
- Expiry Date (date picker)
- Issuing Authority (text input, optional)
- Document File Upload (optional - for future phase)
- Notes (textarea, optional)

**Validation Rules:**
- All required fields must be filled
- Expiry date must be after issue date
- Document number must be unique per vehicle per document type
- Vehicle must be selected

### 3.4 Document Detail View
- Display all document information
- Show document history/audit trail
- Related notifications sent for this document
- Quick actions: Edit, Delete, Renew (creates new record)

---

## 4. Technical Requirements

### 4.1 Frontend Architecture (React)

#### Redux State Structure
```javascript
{
  vehicleDocuments: {
    documents: [],
    loading: false,
    error: null,
    selectedDocument: null,
    filters: {
      vehicleId: null,
      documentType: null,
      status: null
    }
  }
}
```

#### Required Actions
- `FETCH_VEHICLE_DOCUMENTS_REQUEST/SUCCESS/FAILURE`
- `CREATE_VEHICLE_DOCUMENT_REQUEST/SUCCESS/FAILURE`
- `UPDATE_VEHICLE_DOCUMENT_REQUEST/SUCCESS/FAILURE`
- `DELETE_VEHICLE_DOCUMENT_REQUEST/SUCCESS/FAILURE`
- `SET_DOCUMENT_FILTERS`
- `SELECT_DOCUMENT`

#### Required Components
- `VehicleDocumentsList.jsx` - Main list view
- `VehicleDocumentForm.jsx` - Create/Edit form
- `VehicleDocumentDetail.jsx` - Detail view
- `DocumentStatusBadge.jsx` - Status indicator
- `DocumentExpiryAlert.jsx` - Warning component

### 4.2 Backend Architecture

#### API Endpoints

**Base Route:** `/api/vehicledocuments`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicledocuments` | Get all documents with filters |
| GET | `/api/vehicledocuments/{id}` | Get document by ID |
| GET | `/api/vehicledocuments/vehicle/{vehicleId}` | Get documents for vehicle |
| POST | `/api/vehicledocuments` | Create new document |
| PUT | `/api/vehicledocuments/{id}` | Update document |
| DELETE | `/api/vehicledocuments/{id}` | Delete document |
| GET | `/api/vehicledocuments/expiring` | Get expiring documents (within 30 days) |

#### Domain Model: `VehicleDocument`

```csharp
public class VehicleDocument : Entity
{
    public Guid Id { get; private set; }
    public Guid VehicleId { get; private set; }
    public VehicleDocumentType DocumentType { get; private set; }
    public string DocumentNumber { get; private set; }
    public DateTime IssueDate { get; private set; }
    public DateTime ExpiryDate { get; private set; }
    public string IssuingAuthority { get; private set; }
    public string Notes { get; private set; }
    public DocumentStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string CreatedBy { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public string UpdatedBy { get; private set; }

    // Navigation
    public virtual Vehicle Vehicle { get; private set; }

    // Computed properties
    public int DaysUntilExpiry => (ExpiryDate.Date - DateTime.UtcNow.Date).Days;
    public bool IsExpired => DateTime.UtcNow.Date > ExpiryDate.Date;
    public bool IsExpiringSoon => DaysUntilExpiry <= 30 && !IsExpired;
}

public enum VehicleDocumentType
{
    Insurance = 1,
    RoadPermit = 2,
    NTSAInspection = 3
}

public enum DocumentStatus
{
    Valid = 1,
    ExpiringSoon = 2,
    Expired = 3
}
```

#### Commands

**CreateVehicleDocumentCommand**
```csharp
public class CreateVehicleDocumentCommand : IRequest<Guid>
{
    public Guid VehicleId { get; set; }
    public VehicleDocumentType DocumentType { get; set; }
    public string DocumentNumber { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string IssuingAuthority { get; set; }
    public string Notes { get; set; }
}
```

**UpdateVehicleDocumentCommand**
```csharp
public class UpdateVehicleDocumentCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
    public string DocumentNumber { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string IssuingAuthority { get; set; }
    public string Notes { get; set; }
}
```

**DeleteVehicleDocumentCommand**
```csharp
public class DeleteVehicleDocumentCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
}
```

#### Queries

**GetVehicleDocumentsQuery**
```csharp
public class GetVehicleDocumentsQuery : IRequest<List<VehicleDocumentDto>>
{
    public Guid? VehicleId { get; set; }
    public VehicleDocumentType? DocumentType { get; set; }
    public DocumentStatus? Status { get; set; }
}
```

**GetVehicleDocumentByIdQuery**
```csharp
public class GetVehicleDocumentByIdQuery : IRequest<VehicleDocumentDto>
{
    public Guid Id { get; set; }
}
```

**GetExpiringDocumentsQuery**
```csharp
public class GetExpiringDocumentsQuery : IRequest<List<VehicleDocumentDto>>
{
    public int DaysThreshold { get; set; } = 30;
}
```

#### DTOs

**VehicleDocumentDto**
```csharp
public class VehicleDocumentDto
{
    public Guid Id { get; set; }
    public Guid VehicleId { get; set; }
    public string VehicleRegistration { get; set; }
    public VehicleDocumentType DocumentType { get; set; }
    public string DocumentTypeName { get; set; }
    public string DocumentNumber { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string IssuingAuthority { get; set; }
    public string Notes { get; set; }
    public DocumentStatus Status { get; set; }
    public int DaysUntilExpiry { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
}
```

**CreateVehicleDocumentDto**
```csharp
public class CreateVehicleDocumentDto
{
    [Required]
    public Guid VehicleId { get; set; }

    [Required]
    public VehicleDocumentType DocumentType { get; set; }

    [Required]
    [MaxLength(100)]
    public string DocumentNumber { get; set; }

    [Required]
    public DateTime IssueDate { get; set; }

    [Required]
    public DateTime ExpiryDate { get; set; }

    [MaxLength(200)]
    public string IssuingAuthority { get; set; }

    [MaxLength(1000)]
    public string Notes { get; set; }
}
```

---

## 5. Database Schema

### 5.1 Table: `vehicle_documents`

```sql
CREATE TABLE `vehicle_documents` (
  `Id` CHAR(36) NOT NULL,
  `VehicleId` CHAR(36) NOT NULL,
  `DocumentType` INT NOT NULL,
  `DocumentNumber` VARCHAR(100) NOT NULL,
  `IssueDate` DATETIME NOT NULL,
  `ExpiryDate` DATETIME NOT NULL,
  `IssuingAuthority` VARCHAR(200) NULL,
  `Notes` VARCHAR(1000) NULL,
  `Status` INT NOT NULL,
  `CreatedAt` DATETIME NOT NULL,
  `CreatedBy` VARCHAR(100) NOT NULL,
  `UpdatedAt` DATETIME NULL,
  `UpdatedBy` VARCHAR(100) NULL,
  PRIMARY KEY (`Id`),
  INDEX `IX_vehicle_documents_VehicleId` (`VehicleId`),
  INDEX `IX_vehicle_documents_ExpiryDate` (`ExpiryDate`),
  INDEX `IX_vehicle_documents_DocumentType` (`DocumentType`),
  INDEX `IX_vehicle_documents_Status` (`Status`),
  UNIQUE INDEX `UK_vehicle_documents_VehicleId_DocumentType_DocumentNumber`
    (`VehicleId`, `DocumentType`, `DocumentNumber`),
  CONSTRAINT `FK_vehicle_documents_Vehicles_VehicleId`
    FOREIGN KEY (`VehicleId`) REFERENCES `vehicles` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 5.2 Entity Configuration

```csharp
public class VehicleDocumentConfiguration : IEntityTypeConfiguration<VehicleDocument>
{
    public void Configure(EntityTypeBuilder<VehicleDocument> builder)
    {
        builder.ToTable("vehicle_documents");

        builder.HasKey(vd => vd.Id);

        builder.Property(vd => vd.Id)
            .HasColumnName("Id")
            .HasColumnType("CHAR(36)")
            .IsRequired();

        builder.Property(vd => vd.VehicleId)
            .HasColumnName("VehicleId")
            .HasColumnType("CHAR(36)")
            .IsRequired();

        builder.Property(vd => vd.DocumentType)
            .HasColumnName("DocumentType")
            .HasColumnType("INT")
            .IsRequired();

        builder.Property(vd => vd.DocumentNumber)
            .HasColumnName("DocumentNumber")
            .HasColumnType("VARCHAR(100)")
            .IsRequired();

        builder.Property(vd => vd.IssueDate)
            .HasColumnName("IssueDate")
            .HasColumnType("DATETIME")
            .IsRequired();

        builder.Property(vd => vd.ExpiryDate)
            .HasColumnName("ExpiryDate")
            .HasColumnType("DATETIME")
            .IsRequired();

        builder.Property(vd => vd.IssuingAuthority)
            .HasColumnName("IssuingAuthority")
            .HasColumnType("VARCHAR(200)")
            .IsRequired(false);

        builder.Property(vd => vd.Notes)
            .HasColumnName("Notes")
            .HasColumnType("VARCHAR(1000)")
            .IsRequired(false);

        builder.Property(vd => vd.Status)
            .HasColumnName("Status")
            .HasColumnType("INT")
            .IsRequired();

        builder.Property(vd => vd.CreatedAt)
            .HasColumnName("CreatedAt")
            .HasColumnType("DATETIME")
            .IsRequired();

        builder.Property(vd => vd.CreatedBy)
            .HasColumnName("CreatedBy")
            .HasColumnType("VARCHAR(100)")
            .IsRequired();

        builder.Property(vd => vd.UpdatedAt)
            .HasColumnName("UpdatedAt")
            .HasColumnType("DATETIME")
            .IsRequired(false);

        builder.Property(vd => vd.UpdatedBy)
            .HasColumnName("UpdatedBy")
            .HasColumnType("VARCHAR(100)")
            .IsRequired(false);

        // Indexes
        builder.HasIndex(vd => vd.VehicleId)
            .HasDatabaseName("IX_vehicle_documents_VehicleId");

        builder.HasIndex(vd => vd.ExpiryDate)
            .HasDatabaseName("IX_vehicle_documents_ExpiryDate");

        builder.HasIndex(vd => vd.DocumentType)
            .HasDatabaseName("IX_vehicle_documents_DocumentType");

        builder.HasIndex(vd => vd.Status)
            .HasDatabaseName("IX_vehicle_documents_Status");

        // Unique constraint
        builder.HasIndex(vd => new { vd.VehicleId, vd.DocumentType, vd.DocumentNumber })
            .IsUnique()
            .HasDatabaseName("UK_vehicle_documents_VehicleId_DocumentType_DocumentNumber");

        // Relationships
        builder.HasOne(vd => vd.Vehicle)
            .WithMany()
            .HasForeignKey(vd => vd.VehicleId)
            .OnDelete(DeleteBehavior.Cascade);

        // Ignore computed properties
        builder.Ignore(vd => vd.DaysUntilExpiry);
        builder.Ignore(vd => vd.IsExpired);
        builder.Ignore(vd => vd.IsExpiringSoon);
    }
}
```

---

## 6. Notification Integration

### 6.1 Background Service: `VehicleDocumentExpiryNotificationService`

**Purpose:** Runs daily to check for expiring documents and trigger notifications

**Trigger Conditions:**
- 30 days before expiry (first warning)
- 7 days before expiry (urgent warning)
- On expiry date (critical alert)
- Daily after expiry until renewed (expired alert)

**Notification Recipients:**
- Fleet managers
- Site administrators for the vehicle's assigned site
- Members of "Vehicle Maintenance" notification group

### 6.2 Notification Types

**Insurance Expiry Notification**
- Title: "Vehicle Insurance Expiring Soon"
- Message: "Insurance for {VehicleRegistration} expires in {DaysRemaining} days"
- Priority: High (7 days or less), Medium (30 days)

**Road Permit Expiry Notification**
- Title: "Vehicle Road Permit Expiring Soon"
- Message: "Road permit for {VehicleRegistration} expires in {DaysRemaining} days"
- Priority: High (7 days or less), Medium (30 days)

**NTSA Inspection Expiry Notification**
- Title: "NTSA Inspection Due"
- Message: "NTSA inspection for {VehicleRegistration} expires in {DaysRemaining} days"
- Priority: High (7 days or less), Medium (30 days)

**Expired Document Notification**
- Title: "Vehicle Document EXPIRED"
- Message: "{DocumentType} for {VehicleRegistration} has expired {DaysExpired} days ago"
- Priority: Critical

---

## 7. Implementation Phases

### Phase 1: Core CRUD Operations (Week 1)
- Database schema and migrations
- Domain models and entity configurations
- Basic API endpoints
- Commands and queries
- Frontend list and form components

### Phase 2: Notification System (Week 2)
- Background service implementation
- Notification integration
- Email notification templates
- Alert dashboard widgets

### Phase 3: Reporting & Analytics (Week 3)
- Document expiry reports
- Compliance dashboard
- Export functionality
- Document history/audit trail

---

## 8. Success Metrics

- **Compliance Rate:** % of vehicles with valid documents
- **Notification Effectiveness:** % of documents renewed before expiry
- **User Adoption:** Number of documents tracked per vehicle
- **Response Time:** Average time from notification to document renewal
- **Incident Reduction:** Reduction in vehicles operating with expired documents

---

## 9. Future Enhancements

1. **Document File Upload:** Attach PDF/image copies of documents
2. **Automated Reminders:** SMS notifications for urgent expiries
3. **Renewal Workflow:** Integration with insurance/permit providers
4. **Mobile App:** Mobile access for field managers
5. **Predictive Analytics:** ML-based renewal cost predictions
6. **Integration:** Connect with NTSA systems for automatic updates
7. **Document Templates:** Generate renewal application documents

---

## 10. Appendix

### A. Glossary
- **NTSA:** National Transport and Safety Authority
- **Road Permit:** Legal authorization for vehicle road usage
- **Fleet Manager:** User responsible for vehicle maintenance and compliance

### B. Related Systems
- Vehicle Management Module
- Maintenance Scheduling System
- Notification System
- User Management System

### C. Compliance Requirements
- NTSA regulations for vehicle inspections
- Insurance Act requirements
- Road Traffic Act requirements