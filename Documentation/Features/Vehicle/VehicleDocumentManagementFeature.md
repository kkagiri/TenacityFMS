# Feature Documentation: Vehicle Document Expiry Tracking System

This document provides a comprehensive overview of the implementation of the Vehicle Document Expiry Tracking System. The feature was developed in multiple phases, covering backend, background services, and frontend implementation.

## 1. Feature Overview

The Vehicle Document Expiry Tracking System is designed to manage critical vehicle documents such as insurance policies and licenses. The key functionalities include:

- **CRUD Operations**: Creating, reading, updating, and deleting vehicle documents.
- **File Uploads**: Attaching document files (e.g., PDF, JPG) to each record.
- **Status Tracking**: Automatically determining the status of a document (e.g., `Valid`, `Expires Soon`, `Expired`) based on its expiry date.
- **Automated Alerts**: A background service runs daily to identify documents that are nearing expiry or have already expired and creates system alerts (`ActiveAlarm`).
- **Frontend Interface**: A user-friendly interface to manage documents, view their status, and upload files.

---

## 2. Backend Implementation

The backend was built following the principles of Clean Architecture and the CQRS (Command Query Responsibility Segregation) pattern.

### 2.1. Domain Layer

New entities and enumerations were created to model the feature's domain.

- **Enums**:

  - `VehicleDocumentType.cs`: Defines the type of document (e.g., `Insurance`, `License`).
  - `DocumentStatus.cs`: Defines the possible statuses of a document (`Valid`, `Expired`, `ExpiresSoon`).

- **Entity**: `FMS.Domain/Entities/Features/VehicleDocumentManagement/VehicleDocument.cs`

  - This is the core entity representing a vehicle document. It includes properties for `VehicleId`, `DocumentType`, `Issuer`, `PolicyNumber`, `IssueDate`, `ExpiryDate`, and fields to store uploaded file information (`DocumentFileName`, `DocumentFileUrl`).
  - It also contains business logic to `UpdateStatus()` based on the current date and expiry date.

  ```csharp
  // FMS.Domain/Entities/Features/VehicleDocumentManagement/VehicleDocument.cs
  public class VehicleDocument : AuditableEntity
  {
      public int VehicleDocumentId { get; set; }
      public int VehicleId { get; set; }
      public VehicleDocumentType DocumentType { get; set; }
      public string Issuer { get; set; } // e.g., Insurance Provider or Issuing Authority
      public string PolicyNumber { get; set; } // e.g., Policy or License Number
      public DateTime IssueDate { get; set; }
      public DateTime ExpiryDate { get; set; }
      public DocumentStatus Status { get; private set; }
      public string? DocumentFileName { get; set; }
      public string? DocumentFileUrl { get; set; }
      // ... methods for creating, updating, and status calculation
  }
  ```

### 2.2. Persistence Layer

- **Entity Configuration**: `FMS.Persistence/EntityConfigurations/VehicleDocumentConfiguration.cs`

  - Configures the database table mapping for the `VehicleDocument` entity, including property constraints and relationships.

- **Database Context**: `FMS.Persistence/DataAccess/GpsdataContext.cs`
  - The `VehicleDocument` entity was registered as a `DbSet` to enable EF Core operations.
  - `public virtual DbSet<VehicleDocument> VehicleDocuments { get; set; }`

### 2.3. Application Layer (CQRS)

The application logic was implemented using CQRS, with commands, queries, and handlers co-located in the same files for better maintainability.

- **Location**: `FMS.Application/Features/VehicleDocumentManagement/`

- **DTOs** (`Dtos/`):

  - `VehicleDocumentDto.cs`: Data Transfer Object for sending document data to the client.
  - `CreateVehicleDocumentDto.cs` & `UpdateVehicleDocumentDto.cs`: DTOs for creating and updating documents, including an `IFormFile` property for file uploads.

- **Commands** (`Commands/`):

  - `CreateVehicleDocumentCommand.cs`: Handles the creation of a new document, including saving the uploaded file.
  - `UpdateVehicleDocumentCommand.cs`: Handles updates to an existing document.
  - `DeleteVehicleDocumentCommand.cs`: Handles the removal of a document.

- **Queries** (`Queries/`):

  - `GetVehicleDocumentsQuery.cs`: Fetches all documents for a specific vehicle and document type.
  - `GetVehicleDocumentByIdQuery.cs`: Fetches a single document by its ID.
  - `GetExpiringDocumentsQuery.cs`: Fetches documents that are expiring within a specified number of days.

- **File Handling Service**:
  - `IFileHandlingService.cs` (Interface) and `FileHandlingService.cs` (Implementation) were created to abstract the logic for saving and deleting files from the filesystem (`wwwroot/vehicle-documents`).

### 2.4. API Layer

- **Controller**: `FMS.WebClient/Controllers/VehicleManagement/VehicleDocumentsController.cs`
  - A new API controller was created to expose the CQRS commands and queries via RESTful endpoints.
  - It includes actions for `GET`, `POST`, `PUT`, and `DELETE` operations. The create and update endpoints are configured with `[FromForm]` to handle `multipart/form-data` requests, allowing file uploads.

---

## 3. Background Service for Alerts

To proactively notify users about document expiry, a background service was implemented.

- **Service**: `FMS.BackgroundServices/VehicleDocumentNotifier/VehicleDocumentExpiryNotifierService.cs`
  - This service inherits from `BackgroundService` and runs as a periodic task (once a day).
  - It uses the `GetExpiringDocumentsQuery` to fetch documents that are expiring at 30, 7, and 1-day intervals, as well as those that have already expired.
  - For each expiring document, it calls the existing `IActiveAlarmService` to create a new `ActiveAlarm` in the system, making the alert visible to users.
- **Registration**: The service was registered in `FMS.WebClient/Program.cs` using `services.AddHostedService<VehicleDocumentExpiryNotifierService>();`.

---

## 4. Frontend Implementation

The frontend was developed using React and DevExtreme components.

### 4.1. API Service

- **File**: `fms.frontend/src/api/vehicleDocumentsApi.js`
  - A dedicated API service was created to encapsulate all communication with the backend `VehicleDocumentsController`.
  - It uses the global `axiosInstance` for making HTTP requests, ensuring consistency with the rest of the application.
  - Functions include `getVehicleDocuments`, `createVehicleDocument`, `updateVehicleDocument`, and `deleteVehicleDocument`.

### 4.2. React Components

- **Location**: `fms.frontend/src/pages/vehicles/maintenance/documents/`
- **Components**:
  - `VehicleDocumentsList.jsx`: The main component that displays a list of documents in a DevExtreme `DataGrid`. It includes functionality to add, edit, and delete documents.
  - `VehicleDocumentForm.jsx`: A form, displayed in a `Popup`, for creating and editing document details. It includes a `FileUploader` component for attaching files.
  - `DocumentStatusBadge.jsx`: A small, reusable component to display the document's status (`Valid`, `Expired`, etc.) with a color-coded badge.

### 4.3. Routing

- **File**: `fms.frontend/src/pages/vehicles/VehicleMain.js`
- A new route was added to the vehicle module's router to render the `VehicleDocumentsList` component.
  ```javascript
  <Route path="maintenance/documents" element={<VehicleDocumentsList />} />
  ```

---

## 5. Refactoring: Insurance & License Split

The initial implementation for the vehicle details page had a combined "Insurance & License" tab. This was refactored for better separation of concerns.

1.  **Component Split**:

    - The existing `VehicleInsuranceLicense.js` component was renamed and refactored into `VehicleInsurance.js`, responsible only for managing insurance policies (DocumentType 1).
    - A new component, `VehicleLicense.js`, was created to specifically manage licenses and registrations (DocumentType 2).

2.  **Backend Integration**:

    - Both components now use the `vehicleDocumentsApi.js` service, passing the appropriate `documentType` parameter (`1` for insurance, `2` for license) when fetching data.

3.  **UI Update in `VehicleDetails.js`**:
    - The `TabPanel` in `VehicleDetails.js` was updated to remove the single "Insurance & License" tab.
    - Two new, distinct tabs were added:
      - An **"Insurance"** tab that renders the `VehicleInsurance` component.
      - A **"Licenses"** tab that renders the `VehicleLicense` component.

This refactoring resulted in a cleaner, more modular UI where related documents are grouped logically, improving user experience and code maintainability.
