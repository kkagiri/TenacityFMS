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
  Do not use devextreme checkbox for boolean values; use standard HTML checkbox inputs instead. or any other

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
    public string Name { get; set; }
    // ... properties only
}

// ❌ WRONG - Never put DTOs in service files or controller files
// ❌ WRONG - Never put multiple DTOs in one file
```

**Service/Interface Separation**:
```csharp
// File: IVehicleService.cs (interface only, in Features/Vehicle/Services/)
public interface IVehicleService
{
    Task<FMSResponse<VehicleDto>> GetVehicleAsync(Guid id);
}

// File: VehicleService.cs (implementation only, in Features/Vehicle/Services/)
public class VehicleService : IVehicleService
{
    // Implementation here
}

// ❌ WRONG - Never put interface and implementation in same file
```

### Database Operations
- **Use `GPSDataContext`** for all database operations
- Create entity configuration files in `FMS.Persistence`
- Add new entities to `GPSDataContext`
- **CRITICAL: MySQL 5.6 Syntax Compatibility**
  - ❌ **DO NOT use `CURRENT_TIMESTAMP` for default values**
  - ❌ **DO NOT use multiple TIMESTAMP columns with defaults**
  - ❌ **DO NOT use JSON data type** (not supported in MySQL 5.6)
  - ❌ **DO NOT use generated columns**
  - ✅ Use explicit datetime values or NULL for timestamps
  - ✅ Use TEXT for JSON-like data with application-level parsing
  - ✅ Use VARCHAR with appropriate length constraints
- Generate MySQL 5.6 compatible syntax and place in `documentation/features/[domain]/[feature]/[version]/database-schema.sql`
- **Don't create new PTS models** unless explicitly told

**MySQL 5.6 Compatible Examples**:
```sql
-- ❌ INCORRECT (MySQL 5.7+)
CREATE TABLE vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ✅ CORRECT (MySQL 5.6)
CREATE TABLE vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME NULL,
    updated_at DATETIME NULL
);

-- ❌ INCORRECT (JSON not supported)
CREATE TABLE settings (
    config JSON
);

-- ✅ CORRECT (Use TEXT)
CREATE TABLE settings (
    config TEXT NULL
);
```

### User ID Pattern in Controllers
```csharp
var userIdClaim = User.Claims.FirstOrDefault(c =>
    c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
    Guid.TryParse(c.Value, out _));

var userId = userIdClaim?.Value;
```

### Permission Check Pattern
```csharp
var hasPermission = User.HasClaim("permissions", "_createFuelRefill");
if (!hasPermission) return Forbid();
if (!ModelState.IsValid) return BadRequest(ModelState);
```

## Frontend Development Standards

### Technology Stack
- React 18.2.0 with hooks
- DevExtreme 23.2.8 for UI components
- Redux Toolkit for state management
- Tailwind CSS with `tw-` prefix
- FontAwesome icons with `fa-light fa-icon`
- SCSS (not CSS)

### Key Rules
1. **All Tailwind classes must use `tw-` prefix** (e.g., `tw-font-semibold`)
2. **Use SCSS, not CSS**
3. **FontAwesome icons**: Start with `"fa-light fa-icon"`
4. **No dark mode** - light mode only
5. **API URLs**: Use `/vehicles` not `/api/vehicles` (axiosInstance handles base URL)

### Mobile Responsiveness
- **Always make applications mobile and web responsive**
- Use height-based collapsing for mobile sidebars (not width-based)
- Reference: TankStock Layout for working mobile implementation

### Popup Configuration
```javascript
// Standard popup settings
showCloseButton={true}
width="auto"
height="auto"
```

## File Organization

### Backend Features - Domain-Driven Structure
```
FMS.Application/Features/
├── Vehicle/                          # Domain folder
│   ├── Commands/                    # Write operations
│   │   ├── CreateVehicleCommand.cs          # Command only
│   │   ├── CreateVehicleCommandHandler.cs   # Handler only
│   │   ├── UpdateVehicleCommand.cs
│   │   ├── UpdateVehicleCommandHandler.cs
│   │   ├── DeleteVehicleCommand.cs
│   │   └── DeleteVehicleCommandHandler.cs
│   ├── Queries/                     # Read operations
│   │   ├── GetVehicleQuery.cs               # Query only
│   │   ├── GetVehicleQueryHandler.cs        # Handler only
│   │   ├── GetVehiclesQuery.cs
│   │   └── GetVehiclesQueryHandler.cs
│   ├── DTOs/                        # Data Transfer Objects
│   │   ├── VehicleDto.cs                    # One DTO per file
│   │   ├── VehicleDetailDto.cs
│   │   ├── CreateVehicleDto.cs
│   │   └── UpdateVehicleDto.cs
│   ├── Services/                    # Business logic services
│   │   ├── IVehicleService.cs               # Interface
│   │   ├── VehicleService.cs                # Implementation
│   │   ├── IVehicleValidationService.cs
│   │   └── VehicleValidationService.cs
│   └── Validators/                  # FluentValidation validators
│       ├── CreateVehicleValidator.cs
│       └── UpdateVehicleValidator.cs

├── TaskManagement/                   # Another domain example
│   ├── Commands/
│   ├── Queries/
│   ├── DTOs/
│   ├── Services/
│   └── Validators/
```

**Critical Rules**:
- ✅ Each class in its own file
- ✅ Follow domain-driven folder structure
- ✅ Check if domain folder exists before creating files
- ❌ Never use `FMS.Application/Services/` directly
- ❌ Never use `FMS.Application/DTO/` directly
- ❌ Never put multiple classes in one file

### Frontend Structure
```
src/
├── api/              # HTTP clients
├── components/       # Reusable components
├── pages/           # Page components
├── redux/           # State management
├── services/        # Business logic
├── utils/           # Utility functions
├── contexts/        # React contexts
└── hooks/           # Custom hooks
```

## Documentation Requirements

### When User Requests Documentation with [doc] Prefix
Create/update documentation following **feature-based folder structure**:

**Structure Pattern**: `documentation/features/[domain]/[feature]/[version]/[type]/`

**Examples**:
```
documentation/features/vehicle/fleet-management/V1/bug-fix/
documentation/features/vehicle/gps-tracking/V2/implementation/
documentation/features/tankstock/reconciliation/V1/enhancement/
documentation/features/dashboard/real-time-widgets/V1/bug-fix/
```

**Document Types**:
1. **bug-fix/** - Bug fixes and issue resolutions
2. **implementation/** - New feature implementations
3. **enhancement/** - Feature improvements and enhancements
4. **migration/** - Migration and refactoring documentation
5. **api/** - API changes and updates

**Required Files** (create only what's relevant):
1. **README.md** - Overview and summary
2. **requirements.md** - Feature requirements (PRD)
3. **design.md** - Architecture and design decisions
4. **user-flow.md** - User interaction flows
5. **tasks.md** - Task list and completion tracking
6. **database-schema.sql** - MySQL 5.6 compatible schema changes
7. **api-changes.md** - API endpoint changes
8. **testing.md** - Test cases and validation

### When Creating New Features
1. Check existing implementations first
2. Follow established patterns
3. Ensure mobile responsiveness
4. Include proper validation
5. **DO NOT mention or create documentation** (only if user explicitly requests with [doc])

## Common Patterns

### API Service Example
```javascript
// Frontend service
const getVehicles = async () => {
  const response = await axiosInstance.get('/vehicles');
  return response.data;
};
```

### Component Example
```jsx
// React component with proper styling
<div className="tw-flex tw-flex-col tw-gap-4">
  <i className="fa-light fa-car"></i>
  <span className="tw-font-semibold">Vehicle List</span>
</div>
```

## Quality Checklist

### Before Submitting Code
- [ ] Checked existing files/features for similar functionality
- [ ] **Verified domain folder exists in Features/{Domain}/ (asked user if missing)**
- [ ] **Ensured one class per file (no multiple classes)**
- [ ] **DTOs are in Features/{Domain}/DTOs/ folder only**
- [ ] **Services are in Features/{Domain}/Services/ folder only**
- [ ] **Interfaces and implementations are in separate files**
- [ ] Used proper response types (`FMSResponse`)
- [ ] Included validation
- [ ] Followed naming conventions (PascalCase for domains and files)
- [ ] Added proper error handling
- [ ] Tested mobile responsiveness (frontend)
- [ ] Used `tw-` prefix for Tailwind
- [ ] File is under 600 lines (or properly split)
- [ ] File has documentation header
- [ ] Followed CQRS pattern with separate Command/Handler files (backend)
- [ ] Did NOT modify Domain layer
- [ ] MySQL syntax is MySQL 5.6 compatible (no CURRENT_TIMESTAMP, no JSON type)
- [ ] Checked for and documented any {deprecated} code encountered
- [ ] Recommended build/test instead of auto-building

## Key Files to Reference
- `FMSResponse.cs` - Response handling patterns
- `package.json` - Frontend dependencies
- `tailwind.config.js` - Styling configuration
- `axiosInstance.js` - API communication setup
- Existing feature folders - Implementation patterns

## Important Notes
- **Notification system implementation** - Ask user if notifications need to be implemented
- **GPSGate integration** - Use dedicated axios instance
- **Real-time updates** - Use SignalR for live data
- **Role-based access** - Implement proper permission checks
- **Environment configuration** - Use appropriate environment files

---

# FMS Module Navigation Setup Guide

## Overview: Setting Up Navigation for Any Module

This guide helps AI agents understand how to set up navigation for any module in the FMS system, following established patterns like the Tank Stock, Notifications, Vehicles, and Admin modules.

## Common Navigation Issues

When working with module navigation, you may encounter these issues:
1. Routes redirect to the main FMS dashboard instead of the module dashboard
2. Module systems don't load properly from the navigation menu
3. Sub-routes within modules (e.g., `/module/sub-feature`) don't work
4. Navigation items don't appear for certain user roles

## Root Cause Analysis

Navigation issues typically occur when:
1. The navigation item in the database doesn't have the correct link path or page mapping
2. The main router (Content.js) lacks wildcard route support for module sub-routes
3. Role-based access is not properly configured
4. Component mapping in app-routes.js is missing or incorrect

## Step-by-Step Module Navigation Setup

### 1. Database Navigation Item Setup {deprecated}

**⚠️ DEPRECATED: This approach is no longer used. Navigation is now managed through the Navigation Management UI.**

~~Every module requires a navigation item in the database. Use the Navigation Management page (`/admin/navigations`) to create or update navigation items:~~

~~**Required Fields for Any Module:**~~

~~- **Page**: The module identifier (must match case in app-routes.js)~~
  ~~- Examples: `"tank stock"`, `"notifications"`, `"vehicles"`, `"admin"`~~
~~- **Link**: The exact route path the module should use~~
  ~~- Examples: `/tankstock`, `/notifications`, `/vehicles`, `/admin`~~
~~- **Icon**: FontAwesome icon class~~
  ~~- Examples: `fa-light fa-gas-pump`, `fa-light fa-bell`, `fa-light fa-car`~~
~~- **Parent ID**: `null` for top-level items, or parent navigation item ID~~
~~- **Roles**: Assign appropriate user roles (Admin, Manager, etc.)~~

~~**SQL Template for New Module Navigation:**~~
```sql
-- DEPRECATED: Use Navigation Management UI instead
-- INSERT INTO navigationitems (Page, Link, Icon, ParentId)
-- VALUES ('[module-name]', '/[route-path]', '[icon-class]', NULL);
```

**Current Approach:**
Use the Navigation Management page (`/admin/navigations`) to create navigation items through the UI. The system automatically handles database operations.

### 2. Router Configuration in Content.js (CURRENT APPROACH)

Every module needs two routes in `Content.js` - one for the base path and one wildcard for sub-routes:

**Pattern Template:**
```javascript
{/* [Module Name] System Routes - Handle all [module] sub-routes internally */}
<Route
  path="/[route-path]"
  element={React.createElement(resolvedComponents("[page-name]"))}
/>
<Route
  path="/[route-path]/*"
  element={React.createElement(resolvedComponents("[page-name]"))}
/>
```

### 3. Component Mapping in app-routes.js

Ensure the module is properly mapped in `app-routes.js` switch statement:

**Pattern Template:**
```javascript
case "[page-name]":
    return [ModuleMainComponent];
```

### 4. Module Main Component Structure

Each module should have a main component that handles internal routing using React Router.

### 5. Role Assignment

After creating the navigation item, assign it to appropriate roles via Navigation Management.

---

# Permission System Migration Guide

## Overview
This guide helps migrate from the current API-based permission system to a JWT token-based permission system for better performance and user experience.

## Current vs New Approach

### Current Approach (Less Efficient)
```javascript
// In each component
import { fetchpermissionbyUserId } from '../../redux/actions/permissionActions';
```

### New Approach (Recommended)
```javascript
// Import the custom hook
import { usePermissions } from '../hooks/usePermissions';

// In component
const { hasPermission, permissions } = usePermissions();
const canEdit = hasPermission("_EditVehicle");
```

## Best Practices

1. **Use Descriptive Permission Names**: Follow the pattern `_Action_Resource` (e.g., `_Read_tankVolumeHistory`)
2. **Implement Graceful Degradation**: Show appropriate messages when users lack permissions
3. **Cache Permission Checks**: The `usePermissions` hook already memoizes results for performance
4. **Consistent Error Handling**: Use standardized access denied UI components
5. **Security Note**: Remember that frontend permission checks are for UX only. Always validate permissions on the backend as well.

---

## AI Agent Response Protocol

### During Development (NO DOCUMENTATION REQUESTED)

When completing code tasks WITHOUT [doc] prefix:

1. ✅ Summarize what was changed/created
2. ✅ List files modified/created
3. ✅ Highlight any architectural decisions made
4. ✅ **⚠️ DEPRECATED CODE WARNING**: If any code contains `{deprecated}` comments or attributes, explicitly notify the user
5. ❌ **DO NOT mention documentation**
6. ❌ **DO NOT suggest documenting**
7. ❌ **DO NOT create any documentation files**
8. ✅ **STOP and recommend**: "Please build and test the application to verify these changes"
9. ✅ Wait for user feedback before proceeding

### When User Requests Documentation [doc] PREFIX

When user EXPLICITLY requests documentation with [doc] prefix:

1. ✅ Create documentation files ONLY in the correct folder structure
2. ✅ Use: `documentation/features/{domain}/{feature}/{version}/{type}/`
3. ✅ Create files specified by user (or all if user didn't specify which documents)
4. ✅ Place ALL files in the correct folder
5. ❌ **DO NOT create documentation in any other location**
6. ❌ **DO NOT split documentation across multiple locations**

### Documentation File Placement - CRITICAL

**Correct Pattern**:
```
documentation/features/vehicle/fleet-management/V1/bug-fix/
├── README.md
├── requirements.md
├── design.md
└── database-schema.sql
```

**Wrong Patterns** ❌:
```
documentation/vehicle/fleet-management/...         (missing "features" folder)
documentation/bug-fix/vehicle/...                 (wrong structure)
documentation/fleet-management/v1/...             (missing domain)
src/documentation/...                             (wrong location entirely)
```

**Enforcement**:
- Before creating any documentation file, verify the complete path
- Always include `features/{domain}/{feature}/{version}/{type}/` in the path
- Never deviate from this structure
- If user specifies just a filename, add it to the correct folder structure

### Example Correct Responses

**Without [doc] in request:**
```
Changes Summary:
- Created: VehicleService.js (280 lines)
- Modified: VehicleDataGrid.js (added delete functionality)
- Updated: usePermissions hook (added caching)

Architecture Decisions:
- Split VehicleService into three separate services (SRP compliance)
- Used existing axiosInstance instead of creating new HTTP client

Next Steps:
Please build and test the application to verify these changes.
Let me know if you encounter any issues or need adjustments.
```

**With [doc] in request:**
```
Documentation Created:
✅ Created: documentation/features/vehicle/fleet-management/V1/bug-fix/README.md
✅ Created: documentation/features/vehicle/fleet-management/V1/bug-fix/requirements.md
✅ Created: documentation/features/vehicle/fleet-management/V1/bug-fix/design.md

Files successfully placed in correct folder structure.

Please review the documentation and let me know if adjustments are needed.
```

**WRONG RESPONSE** ❌:
```
Changes Summary:
- Created: VehicleService.js

📄 Documentation:
I've also created some helpful documentation files...
[Creates docs without being asked]
```

### Mixed Scenarios

**Scenario A: Code changes + [doc] request**
```
Changes Summary:
- Created: VehicleService.cs
- Modified: CreateVehicleCommand.cs

Documentation Created:
✅ documentation/features/vehicle/fleet-management/V1/implementation/README.md
✅ documentation/features/vehicle/fleet-management/V1/implementation/requirements.md
✅ documentation/features/vehicle/fleet-management/V1/implementation/design.md

[Both sections present]
```

**Scenario B: Code changes without [doc]**
```
Changes Summary:
- Created: VehicleService.cs
- Modified: CreateVehicleCommand.cs

Architecture Decisions:
- Used CQRS pattern with separate handlers
- Implemented validation at service level

Next Steps:
Please build and test the application to verify these changes.

[NO documentation section - user didn't ask for [doc]]
```

### Deprecated Code Warning Format:
```
⚠️ DEPRECATED CODE DETECTED:
The following files contain deprecated code that should be reviewed:
- VehicleDataGrid.js: legacyFilterMethod() marked as {deprecated} - Use modernFilterService instead
- AuthService.js: oldAuthMethod() marked as {deprecated} - Migrate to JWT-based auth

Recommendation: Consider refactoring or migrating away from deprecated code.
```

---
#  Styling Guide for Segmented Button Groups
designing a CSS style for segmented button groups that are close to each other. one button has to have differenct color eaxmplae
delete for red , edit for blue , refresh for green , add for green .. the rest can remain standard..

Create segmented button groups styled like Transaction Hub. Apply this CSS class to any adjacent buttons: user-details__action-buttons, and use button modifiers user-details__action-btn--first and user-details__action-btn--last. Ensure DevExtreme Button markup uses stylingMode="outlined" and type="default". Include the CSS below in the relevant SCSS file and apply the class wrapper around buttons.

CSS:
.user-details__action-buttons { display:inline-flex; border:1px solid #d1d5db; border-radius:6px; overflow:hidden; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,0.05); }
.user-details__action-buttons .dx-button { border-radius:0; border:none; background:#fff; color:#374151; position:relative; min-height:32px; padding:0 12px; font-weight:500; transition:all .2s ease; white-space:nowrap; }
.user-details__action-buttons .dx-button::after { content:''; position:absolute; right:0; top:50%; transform:translateY(-50%); width:1px; height:16px; background:#e5e7eb; }
.user-details__action-buttons .dx-button:hover:not(.dx-state-disabled){ background:#f8fafc; color:#2563eb; z-index:1; }
.user-details__action-buttons .dx-button:active:not(.dx-state-disabled){ background:#f1f5f9; }
.user-details__action-buttons .dx-button.dx-state-disabled{ opacity:.5; cursor:not-allowed; background:#f9fafb; color:#9ca3af; }
.user-details__action-buttons .dx-button .dx-button-content{ font-size:13px; display:flex; align-items:center; justify-content:center; gap:6px; }
.user-details__action-buttons .dx-button .dx-button-content i{ font-size:13px; }
.user-details__action-btn--first{ border-top-left-radius:5px; border-bottom-left-radius:5px; }
.user-details__action-btn--last{ border-top-right-radius:5px; border-bottom-right-radius:5px; }
.user-details__action-btn--last::after{ display:none; }
@media (max-width:768px){ .user-details__action-buttons .dx-button{ min-height:28px; padding:0 8px; } .user-details__action-buttons .dx-button .dx-button-content{ font-size:11px; } .user-details__action-buttons .dx-button .dx-button-content i{ font-size:11px; } }
@media (max-width:480px){ .user-details__action-buttons{ flex-direction:column; border-radius:6px; } .user-details__action-buttons .dx-button{ width:100%; } .user-details__action-buttons .dx-button::after{ display:none; } .user-details__action-buttons .dx-button:not(:last-child){ border-bottom:1px solid #e5e7eb; } .user-details__action-btn--first{ border-top-left-radius:5px; border-top-right-radius:5px; border-bottom-left-radius:0; } .user-details__action-btn--last{ border-bottom-left-radius:5px; border-bottom-right-radius:5px; border-top-right-radius:0; } }



Create DevExtreme Tabs styled like StockManagement. Use a Tabs component with itemRender showing a FontAwesome light icon and label, and apply container styles with Tailwind tw- classes. Include the SCSS below to match the StockManagement look.

JSX:

Use Tabs with dataSource items: { text, icon }
itemRender returns:
<div className="tw-flex tw-items-center tw-gap-2"><i className={item.icon}></i><span>{item.text}</span></div>
Wrap tabs in a white card: tw-bg-white tw-rounded-lg tw-shadow-lg tw-overflow-hidden
Place content in tw-p-4
SCSS:
.stock-management-tabs {
.dx-tabs {
background-color: #ffffff;
border-radius: 10px;
box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.dx-tab {
padding: 10px 20px;
}
}
**Remember: You are a helpful assistant that follows these rules strictly. When in doubt, ask the user for clarification rather than making assumptions.**