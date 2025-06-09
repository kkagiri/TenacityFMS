# FMS.Application Refactoring Guide

## New Structure Overview

We are refactoring the FMS.Application project to better organize code by domain boundaries rather than technical concerns. This will improve maintainability, readability, and help enforce better separation of concerns.

## Core Structure

```
FMS.Application/
├── Core/                       # Core domain-agnostic components
│   ├── Common/                 # Shared components across the application
│   │   ├── Models/             # Base models and shared domain models
│   │   ├── Interfaces/         # Core interfaces
│   │   ├── Exceptions/         # Custom exceptions
│   │   └── Responses/          # Response objects like FMSResponse
│   └── Domain/                 # Core domain components
│       ├── Entities/           # Domain entities
│       ├── Events/             # Domain events
│       └── Validation/         # Domain validation
├── Features/                   # Business features organized by domain
│   ├── Fuel/                   # Fuel-related features
│   │   ├── Commands/           # Commands for fuel operations
│   │   ├── Queries/            # Queries for fuel data
│   │   └── DTOs/               # DTOs for fuel data
│   ├── Tank/                   # Tank management features
│   ├── Vehicle/                # Vehicle management features
│   ├── Site/                   # Site management features
│   ├── Employee/               # Employee management features
│   ├── UserManagement/         # User, Role, Permission management features
│   └── PTS/                    # PTS integration features
│       ├── Commands/           # Commands specific to PTS
│       ├── Queries/            # Queries specific to PTS
│       ├── DTOs/               # DTOs specific to PTS
│       └── Services/           # Services specific to PTS
└── Infrastructure/             # Technical implementation concerns
    ├── Communication/          # Communication services
    │   ├── Redis/              # Redis implementation
    │   ├── SignalR/            # SignalR implementation
    │   ├── WebSocket/          # WebSocket implementation
    │   ├── HttpPolling/        # HttpPolling implementation
    │   └── Tracker/            # Device tracking
    ├── Persistence/            # Data access
    │   ├── Repositories/       # Repository implementations
    │   └── UnitOfWork/         # Unit of work implementation
    └── Services/               # Shared services
        ├── Authentication/     # Authentication services
        ├── Logging/            # Logging services
        └── EventBus/           # Event bus implementation
```

## Migration Guidelines

### 1. Fast Migration Method (Recommended)

**Step 1: Create Feature Structure**
```powershell
md "FMS.Application\Features\{FeatureName}"; md "FMS.Application\Features\{FeatureName}\Commands"; md "FMS.Application\Features\{FeatureName}\Queries"; md "FMS.Application\Features\{FeatureName}\DTOs"
```

**Step 2: Batch Move Files with Robocopy**
```powershell
# Move Commands
robocopy "FMS.Application\Command\DatabaseCommand\{FeatureName}Cmd" "FMS.Application\Features\{FeatureName}\Commands" *.cs /MOVE

# Move Queries
robocopy "FMS.Application\Queries\Database\FMSQuery\{FeatureName}Query" "FMS.Application\Features\{FeatureName}\Queries" *.cs /MOVE

# Move DTOs
robocopy "FMS.Application\ModelsDTOs\{FeatureName}" "FMS.Application\Features\{FeatureName}\DTOs" *.cs /MOVE
```

**Step 3: Handle Duplicate Files**
- Check for duplicates in multiple locations (e.g., ModelsDTOs/FMS/{FeatureName}/)
- Use file comparison to identify which version to keep
- Move duplicates with descriptive suffixes (e.g., FileName_Legacy.cs, FileName_V2.cs)
- Review and consolidate after migration

### 2. Duplicate File Prevention Strategy

**Before Moving:**
1. **Identify all locations** where feature files exist:
   ```powershell
   # Search for all files containing the feature name
   Get-ChildItem -Path "FMS.Application" -Recurse -Filter "*{FeatureName}*" -File
   ```

2. **Compare duplicate files** to determine differences:
   - Check file sizes and modification dates
   - Review content to identify the authoritative version
   - Document differences for later consolidation

3. **Use descriptive naming** for duplicates:
   - `{FileName}_Main.cs` - Primary/current version
   - `{FileName}_Legacy.cs` - Older version to be reviewed
   - `{FileName}_FMS.cs` - Version from FMS subfolder
   - `{FileName}_Alternative.cs` - Different implementation

### 3. Naming Conventions

- Use consistent naming across the codebase:
  - Commands: `{Action}{Entity}Command` (e.g., `CreateTankCommand`)
  - Queries: `{Entity}{Action}Query` (e.g., `TankGetByIdQuery`)
  - DTOs: `{Entity}Dto` (e.g., `TankDto`)
  - Command Handlers: `{Action}{Entity}CommandHandler`
  - Query Handlers: `{Entity}{Action}QueryHandler`

### 4. Migration Strategy

1. **Pre-Migration Analysis**: Identify all files and potential duplicates
2. **Create Feature Structure**: Use batch folder creation
3. **Batch Move Files**: Use robocopy for efficiency
4. **Handle Duplicates**: Move with descriptive names
5. **Update Namespaces**: Batch update using IDE tools
6. **Update References**: Use find/replace across solution
7. **Test & Validate**: Ensure all references work
8. **Cleanup**: Remove empty folders and consolidate duplicates

### 5. Specific Migration Paths

| Current Location | New Location | Method |
|------------------|--------------|---------|
| Command/DatabaseCommand/{Feature}Cmd/ | Features/{Feature}/Commands/ | Robocopy /MOVE |
| Command/PTSCommand/ | Features/PTS/Commands/ | Robocopy /MOVE |
| Queries/Database/FMSQuery/{Feature}Query/ | Features/{Feature}/Queries/ | Robocopy /MOVE |
| Queries/PTSQueries/ | Features/PTS/Queries/ | Robocopy /MOVE |
| ModelsDTOs/{Feature}/ | Features/{Feature}/DTOs/ | Robocopy /MOVE |
| ModelsDTOs/FMS/{Feature}/ | Features/{Feature}/DTOs/ | Manual (check duplicates) |
| Common/FMSResponse.cs | Core/Common/Responses/ | Manual move |
| Communication/ | Infrastructure/Communication/ | Robocopy /MOVE |
| Events/ | Core/Domain/Events/ | Robocopy /MOVE |

### 6. Complex Features (Multi-Domain)

For features like **UserManagement** that contain multiple related domains:
- Create subfolders within the feature: `Features/UserManagement/{User,Role,Permission}/`
- Or create separate features: `Features/User/`, `Features/Role/`, `Features/Permission/`
- Consider domain relationships and coupling when deciding structure

### 7. Post-Migration Checklist

- [ ] All files moved to new locations
- [ ] Namespaces updated
- [ ] References updated in controllers and other classes
- [ ] Duplicate files reviewed and consolidated
- [ ] Empty folders removed
- [ ] Build succeeds without errors
- [ ] Tests pass (if applicable)