# AGENTS.md - Fleet Management System (FMS)

> This file provides essential context for AI coding agents working on the Hyoung FMS project.
> Last updated: 2026-02-02

## Project Overview

**Hyoung FMS** is a comprehensive Fleet Management System with real-time tracking, fuel management, and device monitoring capabilities. It supports multiple organizations/sites (multi-tenancy) and provides real-time communication with fuel dispensing devices via PTS (Pump/Tank/Station) controllers.

### Key Business Domains
- **Fleet Management**: Vehicle tracking, maintenance scheduling, GPS monitoring
- **Fuel Management**: Fuel consumption tracking, refills, inventory, tank reconciliation
- **Device Communication**: Real-time WebSocket communication with PTS devices
- **User Management**: Role-based access control (RBAC) and permissions
- **Reporting & Analytics**: Comprehensive reports using DevExpress Reporting
- **Notifications**: Push notifications via Firebase and SignalR real-time updates

---

## Technology Stack

### Backend (.NET 8.0)
| Component | Technology |
|-----------|------------|
| Framework | .NET 8.0 |
| API | ASP.NET Core Web API |
| Data Access | Entity Framework Core 8.0 with Pomelo MySQL provider |
| Architecture | CQRS with MediatR 12.5 |
| Mapping | AutoMapper |
| Real-time | SignalR with Redis backplane |
| Caching | StackExchange.Redis |
| Logging | Serilog + NLog |
| Reports | DevExpress Reporting 23.2 + jsReport |
| Auth | JWT Bearer tokens |
| Testing | xUnit, Moq |

### Frontend
| Component | Technology |
|-----------|------------|
| Framework | React 18 |
| State Management | Redux Toolkit |
| UI Components | DevExtreme 23.2 |
| Styling | Tailwind CSS, Sass |
| HTTP Client | Axios |
| Reports | DevExpress Analytics |
| Build Tool | CRACO (Create React App Configuration Override) |

### Mobile
| Component | Technology |
|-----------|------------|
| Framework | React Native 0.72 |
| Navigation | React Navigation 6 |
| State | Redux Toolkit + Redux Persist |
| Push Notifications | Firebase Cloud Messaging + Notifee |
| Permissions | React Native Permissions |

### Infrastructure
| Component | Technology |
|-----------|------------|
| Database | MySQL |
| Cache/Messaging | Redis |
| Web Server | IIS / Kestrel |
| Containerization | Docker (for Redis) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
Hyoung.FMS/
├── FMS.WebClient/              # Main ASP.NET Core API (Entry Point)
│   ├── Controllers/            # API Controllers (v1 versioning)
│   ├── Extensions/             # DI registration extensions
│   ├── appsettings.json        # Configuration
│   └── web.config              # IIS deployment config
│
├── FMS.Application/            # Business Logic Layer (CQRS)
│   ├── Command/                # Write operations (MediatR)
│   ├── Queries/                # Read operations (MediatR)
│   ├── Features/               # Domain feature handlers
│   ├── Services/               # Business services
│   ├── PTSServices/            # PTS device communication
│   └── MappingProfile/         # AutoMapper profiles
│
├── FMS.Domain/                 # Domain Layer
│   ├── Entities/               # Domain entities
│   ├── ATGEntities/            # Automatic Tank Gauge entities
│   ├── PTSCommon/              # PTS shared types
│   └── Events/                 # Domain events
│
├── FMS.Persistence/            # Data Access Layer
│   ├── DataAccess/             # DbContext definitions
│   ├── EntityConfigurations/   # EF Core configurations
│   └── Migrations/             # Database migrations
│
├── FMS.Infrastructure/         # Infrastructure Services
│   └── (External service integrations)
│
├── FMS.BackgroundServices/     # Background Processing
│   └── (RabbitMQ consumers, hosted services)
│
├── FMS.PTS.WindowsService/     # PTS Device Communication Service
│   ├── WebSocket server for device connections
│   └── Real-time data processing
│
├── FMS.IoT.Gateway/            # IoT Protocol Gateway
├── FMS.IoT.Contracts/          # IoT Message Contracts
├── FMS.IoT.ProcessingEngine/   # IoT Data Processing
│
├── FMS.Testing/                # Unit & Integration Tests
│
├── fms.frontend/               # React Web Application
│   ├── src/                    # Source code
│   ├── public/                 # Static assets
│   └── build/                  # Production build output
│
├── fms.mobile/                 # React Native Mobile App
│   ├── android/                # Android-specific code
│   └── ios/                    # iOS-specific code
│
├── Shared/FMS.Shared/          # Shared Components
├── scripts/                    # Automation scripts
│   ├── environment/            # Environment setup
│   ├── redis/                  # Redis management
│   └── verification/           # Verification scripts
│
├── packages/                   # Local NuGet packages (DevExpress)
└── Documentation/              # Project documentation
```

---

## Architecture Patterns

### CQRS (Command Query Responsibility Segregation)
All business operations follow CQRS pattern using MediatR:

```csharp
// Command (Write)
public class CreateVehicleCommand : IRequest<FMSResponse<VehicleDto>>
{
    public string RegistrationNumber { get; set; }
    // ...
}

// Query (Read)
public class GetVehicleByIdQuery : IRequest<FMSResponse<VehicleDto>>
{
    public int VehicleId { get; set; }
}

// Handler
public class CreateVehicleCommandHandler : IRequestHandler<CreateVehicleCommand, FMSResponse<VehicleDto>>
{
    // Implementation
}
```

### API Response Standardization
All API endpoints return `FMSResponse<T>`:

```csharp
public class FMSResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public T Data { get; set; }
    public List<string> Errors { get; set; }
    public int StatusCode { get; set; }
}
```

### API Versioning
All endpoints use `/api/v1/` prefix:
- Controllers are organized by domain in `FMS.WebClient/Controllers/`
- V2 controllers (if any) are in `FMS.WebClient/Controllers/V2/`

---

## Build Commands

### Backend
```bash
# Restore dependencies
dotnet restore Hyoung.Fms.sln

# Build solution
dotnet build Hyoung.Fms.sln

# Run Web API (port 7009)
cd FMS.WebClient && dotnet run

# Run tests
dotnet test FMS.Testing/FMS.Testing.csproj

# Publish for deployment
dotnet publish FMS.WebClient/FMS.WebClient.csproj -c Release -o ./publish
```

### Frontend
```bash
# Install dependencies (run once)
cd fms.frontend && npm install

# Start development server
cd fms.frontend && npm start

# Build for production
npm run build

# Build with specific environment
npm run build:dev
npm run build:prod
```

### Mobile
```bash
# Install dependencies
cd fms.mobile && npm install

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Combined (Root package.json)
```bash
# Start backend + frontend
npm run start:web

# Start backend + frontend + mobile
npm run start:all
```

---

## Development Environment Setup

### Prerequisites
1. **.NET 8.0 SDK**
2. **Node.js 16+** (for frontend/mobile)
3. **MySQL Server**
4. **Redis** (Docker recommended)
5. **Visual Studio 2022** or **VS Code**

### Environment Variables
Backend environment variables are configured via:
- `FMS.WebClient/appsettings.json` (base)
- `FMS.WebClient/appsettings.Development.json` (development)
- Environment variables (production secrets)

Required environment variables:
```
# Database
DBHOST=localhost
DBPORT=3306
DBNAME=fms_database
DBUSER=root
DBPASSWORD=your_password

# JWT
JWTKEY=your_secret_key
JWTISSUER=FMS
JWTAUDIENCE=FMS
JWTEXPIRATIONMINUTES=480

# Redis (optional)
REDIS_CONNECTION=localhost:6379

# Firebase (for push notifications)
FIREBASE_SERVICE_ACCOUNT_PATH=C:\Secrets\firebase-key.json
```

Use the provided scripts for setup:
```powershell
# Backend environment
scripts/environment/setup-environment.bat

# Frontend environment
scripts/environment/setup-frontend-env.ps1

# PTS Service environment
scripts/environment/setup-pts-env.bat
```

### Redis (Docker)
```powershell
# Start Redis
scripts/redis/start-redis.bat

# Stop Redis
scripts/redis/stop-redis.bat
```

---

## Code Style Guidelines

### C# Style (from .editorconfig)
- Use block-scoped namespaces
- Explicit type when type is apparent: `var list = new List<string>();`
- Implicit type when type is obvious: `var result = await service.GetData();`
- Spacing around binary operators: `before_and_after`
- Treat warnings as messages (not errors during development)

### Naming Conventions
- **Classes**: PascalCase (e.g., `CreateVehicleCommand`)
- **Interfaces**: PascalCase with 'I' prefix (e.g., `IVehicleService`)
- **Methods**: PascalCase (e.g., `GetVehicleByIdAsync`)
- **Properties**: PascalCase (e.g., `RegistrationNumber`)
- **Fields**: camelCase with underscore (e.g., `_dbContext`)
- **Constants**: PascalCase (e.g., `MaxRetryAttempts`)

### CQRS Conventions
- Commands: `[Action][Entity]Command` (e.g., `CreateVehicleCommand`)
- Queries: `Get[Entity][ByCriteria]Query` (e.g., `GetVehicleByIdQuery`)
- Handlers: `[Command/Query]Handler` in same file or `Handlers/` folder
- DTOs: `[Entity]Dto` in `ModelsDTOs/` or `Dtos/` folders

### Frontend Conventions
- Components: PascalCase (e.g., `VehicleList.jsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useVehicleData.js`)
- Services: camelCase (e.g., `vehicleService.js`)
- Redux slices: camelCase (e.g., `vehicleSlice.js`)

---

## Testing Strategy

### Test Projects
- **FMS.Testing**: Unit and integration tests using xUnit and Moq
- Excluded test files (deprecated): `EmailServiceTest.cs`, `TagQueries/*`, etc.

### Running Tests
```bash
# All tests
dotnet test

# Specific project
dotnet test FMS.Testing/FMS.Testing.csproj

# With verbosity
dotnet test --logger "console;verbosity=detailed"
```

### Test Patterns
- Use `Moq` for mocking dependencies
- Use `EF Core InMemory` for database tests
- Follow Arrange-Act-Assert pattern
- Name tests: `[MethodName]_[Scenario]_[ExpectedResult]`

---

## Deployment

### CI/CD Pipeline
GitHub Actions workflow: `.github/workflows/deploy-to-iis.yml`

**Triggers:**
- Push to `productionv1`, `main`, or `master` branches
- Manual workflow dispatch with options to skip backend/frontend

**Deployment Process:**
1. Build React app (using existing node_modules)
2. Publish .NET backend to temp location
3. Stop IIS app pools
4. Swap deployment folders (atomic deployment)
5. Start IIS app pools
6. Cleanup old deployments

**IIS Configuration:**
- Backend Pool: `HyoungFMS.WebAPI`
- Backend Path: `C:\inetpub\wwwroot\hyoungFMS\webAPI`
- Frontend Pool: `HyoungFMS.ReactApp`
- Frontend Path: `C:\inetpub\wwwroot\hyoungFMS\reactApp`
- Port: 7009 (backend), 80 (frontend)

### Self-Hosted Deployment
```powershell
# Build backend
dotnet publish FMS.WebClient/FMS.WebClient.csproj -c Release -o ./publish

# Build frontend
cd fms.frontend && npm run build

# Deploy to IIS (see deployment scripts in deployment/ folder)
```

---

## Security Considerations

### Authentication
- JWT Bearer tokens for API authentication
- Token expiration: 8 hours (480 minutes)
- SignalR connections require authenticated JWT

### Authorization
- Role-based access control (RBAC)
- Claims-based permissions
- Permission constants in `Permissions.cs`

### Data Protection
- No credentials in code (use environment variables)
- Connection strings in environment variables
- Firebase service account in secure location (`C:\Secrets\`)
- Custom `web.config` preserved during publish

### PTS Communication
- WebSocket connections use dedicated PTS Windows Service
- Device authentication via tags/cards
- Real-time command validation

---

## Key Files and Locations

### Configuration Files
| File | Purpose |
|------|---------|
| `NuGet.config` | Package sources (NuGet.org + local DevExpress) |
| `.editorconfig` | C# code style rules |
| `FMS.WebClient/appsettings.json` | Base app configuration |
| `FMS.WebClient/web.config` | IIS deployment configuration |
| `fms.frontend/package.json` | Frontend dependencies |
| `fms.mobile/package.json` | Mobile dependencies |

### Important Entry Points
| File | Purpose |
|------|---------|
| `FMS.WebClient/Program.cs` | Web API entry point, DI configuration |
| `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs` | Service registration |
| `FMS.PTS.WindowsService/Program.cs` | PTS Windows Service entry |
| `fms.frontend/src/index.js` | React app entry |
| `fms.mobile/index.js` | React Native app entry |

### Database
- DbContext: `FMS.Persistence.DataAccess.GpsdataContext`
- Migrations: `FMS.Persistence/Migrations/`
- Provider: Pomelo.EntityFrameworkCore.MySql

---

## Common Issues & Troubleshooting

### Port 7009 in Use
The application requires port 7009. If occupied:
```powershell
# Set environment variable to auto-kill processes
$env:FORCE_KILL_PORTS="true"
dotnet run
```

### Redis Connection
If Redis is not running:
- Backend will work without caching
- SignalR will use in-memory backplane (not scalable)

### DevExpress Packages
DevExpress packages are stored locally in `packages/` folder:
```xml
<!-- NuGet.config -->
<add key="DevExpress-Local" value="packages" />
```

### Node Modules
Frontend CI/CD assumes `node_modules` exists (not installed during build):
```bash
cd fms.frontend && npm install  # Run locally before push
```

---

## Documentation References

### Project Documentation (`Documentation/`)
- `API_MODERNIZATION_IMPLEMENTATION_GUIDE.md` - API v1 modernization
- `FUEL_REFILL_TAB_IMPLEMENTATION.md` - Fuel refill feature
- `SIGNALR_DIAGNOSIS_GUIDE.md` - SignalR troubleshooting
- `Stock-Reconciliation-Architecture.md` - Tank reconciliation

### Deployment Documentation (`deployment/`)
- `START_HERE.md` - Deployment quick start
- `DEPLOYMENT_GUIDE.md` - Full deployment guide
- `CI_CD_SETUP_GUIDE.md` - CI/CD configuration
- `PORT_CONFIGURATION_GUIDE.md` - Port settings

### Setup Guides
- `README.md` - Project overview
- `SECURITY_SETUP_GUIDE.md` - Security configuration
- `QUICK_START_FUEL_REFILL.md` - Fuel refill quick start

---

## Contributing Guidelines

1. **Follow CQRS pattern** for new features
2. **Use FMSResponse<T>** for all API responses
3. **Add API version prefix** `/api/v1/` for new endpoints
4. **Write unit tests** for business logic
5. **Update this file** when changing architecture or conventions
6. **Run verification scripts** before committing:
   ```powershell
   scripts/verification/verify-environment.ps1
   ```

---

## Contact & Support

For questions about the codebase:
1. Check `Documentation/` folder for feature-specific guides
2. Review existing handlers in `FMS.Application/Features/`
3. Check test examples in `FMS.Testing/`
4. Review GitHub Copilot instructions in `.github/copilot-instructions.md`

---

*This document is maintained by the development team. Update it when making architectural changes or adding new patterns.*
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
