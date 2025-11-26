---
trigger: always_on
---

---
alwaysApply: true
---
# AI Agent Development Instructions - FMS System

## 🚨 CRITICAL RULES - READ FIRST

### 1. **NEVER REPEAT EXISTING CODE**
- **Check existing files FIRST** before writing any code
- Look in the feature/pages/service folders for similar functionality
- If functionality exists, reference or extend it - DO NOT rewrite it
- Search the codebase before creating new files, functions, or features
- **Rule**: If the code exists, USE IT - don't duplicate it

### 2. **Documentation Protocol - STRICTLY ENFORCED**
- **⚠️ CRITICAL: ONLY write documentation when user EXPLICITLY requests with [doc] prefix**
- **DO NOT auto-generate documentation at any time**
- **DO NOT suggest documentation unless user asks**
- **Write documentation ONCE ONLY per [doc] request**
- **Folder Structure**: `documentation/features/{domain}/{feature}/{version}/{type}/`
  - Example: `documentation/features/vehicle/fleet-management/V1/bug-fix/`
  - Example: `documentation/features/taskmanagement/assignment/V2/implementation/`
  - Example: `documentation/features/tankstock/reconciliation/V1/enhancement/`

**Correct Pattern**:
```
documentation/
└── features/
    ├── vehicle/
    │   ├── fleet-management/
    │   │   └── V1/
    │   │       ├── bug-fix/
    │   │       │   ├── README.md
    │   │       │   ├── requirements.md
    │   │       │   └── database-schema.sql
    │   │       └── implementation/
    │   └── gps-tracking/
    │       └── V2/
    │           └── bug-fix/
    └── taskmanagement/
        └── assignment/
            └── V1/
                └── implementation/
```

**Behavior Rules**:
- ❌ **Never mention documentation** unless user requests with [doc]
- ❌ **Never create documentation files** unless user requests with [doc]
- ❌ **Never suggest "documentation should be updated"**
- ✅ **Only create documentation when user explicitly says [doc] in their prompt**
- ✅ **Place documentation in correct feature-based folder structure**
- ✅ **Create ONLY the requested documentation types**

### 3. **Build & Run Policy**
- **DO NOT build or run the application automatically**
- After completing code changes, ALWAYS:
  1. Summarize what was changed
  2. Recommend: "Please build and test the application"
  3. Wait for user feedback before proceeding
- **Exception**: User explicitly asks to build/run

### 4. **Architecture Planning Protocol**
- **BEFORE suggesting architecture changes** (services, hooks, new files, features):
  1. **Check the domain/feature folder first** - Look in `FMS.Application/Features/{Domain}/`
  2. **Verify folder structure exists** - Check if domain folder is present
  3. **If domain folder is MISSING**:
     - ❌ **STOP - DO NOT CREATE**
     - ✋ **ASK USER**: "The domain folder 'Features/{Domain}' does not exist. Should I create it with the following structure: [propose structure]?"
     - ⏸️ **WAIT for approval** before proceeding
  4. **If domain exists but structure is unclear**:
     - 📋 **Document** your findings (what exists, what's missing)
     - 💡 **Present a plan** to the user with proposed structure
     - ⏸️ **Wait for user agreement** before implementing
  5. **Check for anti-patterns**:
     - ❌ Files in `FMS.Application/DTO/` (wrong location)
     - ❌ Files in `FMS.Application/Services/` (wrong location)
     - ✅ Files should be in `FMS.Application/Features/{Domain}/DTOs/`
     - ✅ Files should be in `FMS.Application/Features/{Domain}/Services/`

- **Domain Folder Discovery Protocol**:
  ```
  Before creating ANY files:
  1. Search for existing domain folder: Features/{Domain}/
  2. If NOT found → Ask user for approval to create
  3. If found → Check for proper sub-folders (Commands/, Queries/, DTOs/, Services/)
  4. If structure incomplete → Propose completing it and wait for approval
  ```

- **Example Response when Domain Missing**:
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

- **Example Response when Files in Wrong Location**:
  ```
  ⚠️ INCORRECT FILE LOCATION DETECTED

  Found files in wrong locations:
  - FMS.Application/Services/TaskService.cs (should be in Features/TaskManagement/Services/)
  - FMS.Application/DTO/TaskDto.cs (should be in Features/TaskManagement/DTOs/)

  These files should follow domain-driven structure:
  ✅ FMS.Application/Features/TaskManagement/Services/TaskService.cs
  ✅ FMS.Application/Features/TaskManagement/DTOs/TaskDto.cs

  Recommendation: Do not use the incorrectly located files. Should I create properly structured files instead?
  ```

### 5. **Environment Awareness**
- **Assume development PC environment** unless stated otherwise
- Do not make environment-specific decisions that will:
  - Break local development
  - Require cloud resources
  - Need production infrastructure
- Use localhost, local database, local file system by default
- **Only suggest environment-specific changes** when user specifies:
  - "for production"
  - "for staging"
  - "for testing environment"

### 6. **Domain Layer is SACRED**
- **STRICTLY DO NOT modify** the Domain layer (`FMS.Domain/`)
- Domain entities are the source of truth
- If domain changes are needed:
  1. **Stop immediately**
  2. **Inform the user**: "This requires Domain layer changes"
  3. **Explain the impact**
  4. **Wait for explicit approval**

### 7. **File Size & Single Responsibility Principle (SRP)**
- **If a file reaches 600+ lines**: STOP and refactor
- **Actions to take**:
  1. Identify logical separations
  2. Split into multiple files following SRP
  3. Create folder structure if needed
- **Example Refactoring**:
  ```
  Before: VehicleService.js (800 lines)
  After:
  - VehicleService.js (core operations, 300 lines)
  - VehicleValidationService.js (validation logic, 200 lines)
  - VehicleReportService.js (reporting, 250 lines)
  ```

### 8. **File Documentation Header**
- **Every file MUST have** a documentation header at the top
- If missing, add it before making changes
- **Template**:
  ```javascript
  /**
   * File: [FileName].js
   * Purpose: [Brief description of what this file does]
   * Dependencies: [Key dependencies]
   * Last Modified: [Date]
   *
   * Key Functions/Components:
   * - [function1]: [what it does]
   * - [function2]: [what it does]
   */
  ```
- **Example**:
  ```javascript
  /**
   * File: VehicleService.js
   * Purpose: Handles all vehicle-related API communications and business logic
   * Dependencies: axiosInstance, FMSResponse
   * Last Modified: 2025-10-02
   *
   * Key Functions:
   * - getVehicles(): Fetches all vehicles with pagination
   * - createVehicle(data): Creates a new vehicle record
   * - updateVehicle(id, data): Updates existing vehicle
   * - deleteVehicle(id): Soft deletes a vehicle
   */
  ```

### 9. **Clean Architecture - CQRS Pattern & Class Organization**
- **Backend MUST follow Command Query Responsibility Segregation**
- **CRITICAL: ONE CLASS PER FILE - NO EXCEPTIONS**
- **Structure**: `FMS.Application/Features/{Domain}/`
  ```
  Features/
  ├── Vehicle/
  │   ├── Commands/
  │   │   ├── CreateVehicleCommand.cs           (command only)
  │   │   ├── CreateVehicleCommandHandler.cs    (handler only)
  │   │   ├── UpdateVehicleCommand.cs
  │   │   ├── UpdateVehicleCommandHandler.cs
  │   │   ├── DeleteVehicleCommand.cs
  │   │   └── DeleteVehicleCommandHandler.cs
  │   ├── Queries/
  │   │   ├── GetVehicleQuery.cs                (query only)
  │   │   ├── GetVehicleQueryHandler.cs         (handler only)
  │   │   ├── GetVehiclesQuery.cs
  │   │   └── GetVehiclesQueryHandler.cs
  │   ├── DTOs/
  │   │   ├── VehicleDto.cs                     (one DTO per file)
  │   │   ├── VehicleDetailDto.cs
  │   │   └── CreateVehicleDto.cs
  │   ├── Services/
  │   │   ├── IVehicleService.cs                (interface only)
  │   │   └── VehicleService.cs                 (implementation only)
  │   └── Validators/
  │       ├── CreateVehicleValidator.cs
  │       └── UpdateVehicleValidator.cs
  ```

- **Class Separation Rules**:
  - ❌ **NEVER put multiple classes in one file**
  - ❌ **NEVER put DTOs in service files**
  - ❌ **NEVER put classes in controller files** (controllers are classes themselves)
  - ✅ Each command in its own file
  - ✅ Each handler in its own file (even if small)
  - ✅ Each DTO in its own file in DTOs folder
  - ✅ Each interface in its own file
  - ✅ Each implementation in its own file
  - ✅ Services have dedicated Services folder

- **Interface & Implementation Pattern**:
  ```
  Features/
  ├── Vehicle/
  │   └── Services/
  │       ├── IVehicleService.cs          (interface definition)
  │       ├── VehicleService.cs           (main implementation)
  │       ├── IVehicleValidationService.cs
  │       └── VehicleValidationService.cs
  ```

- **CQRS Rules**:
  - Commands = Write operations (Create, Update, Delete)
  - Queries = Read operations (Get, List, Search)
  - Each command/query in separate file from handler
  - No mixing of read/write logic

---

## Project Overview
FMS (Fleet Management System) is a full-stack application with:
- **Backend**: .NET Core with CQRS pattern
- **Frontend**: React with DevExtreme UI components
- **Database**: MySQL with Entity Framework
- **Real-time**: SignalR integration

## Core Development Rules

### 1. File Management
- **Check existing files first** before creating new ones
- Look in documentation folder for similar queries/features (e.g., GetTasksQuery → check task PRD/documents)
- If file exists in another folder, don't recreate it
- **Don't repeat file creation/deletion** if there's no content changes

### 2. Project Structure
```
FMS.Application/        # Business logic, DTOs, commands, queries
FMS.WebClient/         # Web API controllers
FMS.Frontend/          # React frontend
FMS.Persistence/       # Data access layer
FMS.Domain/            # Entities and domain models (DO NOT MODIFY)
FMS.BackgroundServices/# Background jobs
documentation/         # Feature documentation all documentation goes here
```

## Backend Development Standards

### Response Handling
- **Always use `FMSResponse.cs`** for all API endpoints
- `FMSResponse<T>` for returning data
- `FMSResponse` for errors/validation
- **Always include validation checks**

### CQRS Implementation
- **ONE CLASS PER FILE - STRICTLY ENFORCED**
- Commands in separate file from CommandHandlers
- Queries in separate file from QueryHandlers
- Use existing features in `FMS.Application/Features/{Domain}/` before creating new ones
- **Check domain folder exists before creating files**

**Example Structure:**
```csharp
// File: CreateVehicleCommand.cs (command only)
public record CreateVehicleCommand : IRequest<FMSResponse<VehicleDto>>
{
    public string Name { get; init; }
    public string LicensePlate { get; init; }
}

// File: CreateVehicleCommandHandler.cs (handler only)
public class CreateVehicleCommandHandler : IRequestHandler<CreateVehicleCommand, FMSResponse<VehicleDto>>
{
    // Implementation here
}
```

**DTO Separation**:
```csharp
// File: VehicleDto.cs (in Features/Vehicle/DTOs/ folder)
public class VehicleDto
{
    public Guid Id { get; set; }
