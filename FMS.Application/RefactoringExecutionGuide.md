# FMS.Application Refactoring Execution Guide

This guide provides step-by-step instructions for executing the refactoring of the FMS.Application project according to the new structure outlined in the RefactoringGuide.md file.

## Phase 1: Preparation

1. **Create a backup of the existing codebase**
   ```
   git checkout -b refactoring-backup
   git add .
   git commit -m "Create backup before refactoring"
   git checkout -b refactoring-implementation
   ```

2. **Create the new directory structure**
   ```
   python ContentsWriteScript.py
   ```

## Phase 2: Core Components Migration

1. **Move common response models**
   - Move `FMS.Application/Common/FMSResponse.cs` to `FMS.Application/Core/Common/Responses/FMSResponse.cs`
   - Update namespace from `FMS.Application.Common` to `FMS.Application.Core.Common.Responses`

2. **Create base interfaces**
   - Create `FMS.Application/Core/Common/Interfaces/ICommand.cs`
   - Create `FMS.Application/Core/Common/Interfaces/ICommandHandler.cs`
   - Create `FMS.Application/Core/Common/Interfaces/IQuery.cs`
   - Create `FMS.Application/Core/Common/Interfaces/IQueryHandler.cs`

3. **Move exceptions**
   - Move exception classes from `FMS.Application/Common` to `FMS.Application/Core/Common/Exceptions`
   - Update namespaces appropriately

## Phase 3: Feature-Based Migration

For each domain area (Tank, Vehicle, Site, PTS, etc.), execute the following steps:

1. **Create feature DTOs**
   - Identify related DTOs in `FMS.Application/ModelsDTOs`
   - Move them to `FMS.Application/Features/{Domain}/DTOs`
   - Update namespaces

2. **Create feature Commands**
   - Identify related commands in `FMS.Application/Command/DatabaseCommand`
   - Move them to `FMS.Application/Features/{Domain}/Commands`
   - Update namespaces and base interfaces

3. **Create feature Queries**
   - Identify related queries in `FMS.Application/Queries/Database`
   - Move them to `FMS.Application/Features/{Domain}/Queries`
   - Update namespaces and base interfaces

## Phase 4: PTS Integration Migration

1. **Move PTS commands**
   - Move commands from `FMS.Application/Command/PTSCommand` to `FMS.Application/Features/PTS/Commands`
   - Update namespaces and base interfaces

2. **Move PTS queries**
   - Move queries from `FMS.Application/Queries/PTSQueries` to `FMS.Application/Features/PTS/Queries`
   - Update namespaces and base interfaces

3. **Move PTS services**
   - Move PTS-specific services to `FMS.Application/Features/PTS/Services`
   - Update namespaces

## Phase 5: Infrastructure Migration

1. **Move communication components**
   - Move from `FMS.Application/Communication` to `FMS.Application/Infrastructure/Communication`
   - Organize by communication type (SignalR, Redis, WebSocket, etc.)
   - Update namespaces

2. **Move authentication services**
   - Move `FMS.Application/JWTGenerator.cs` to `FMS.Application/Infrastructure/Services/Authentication/JwtTokenGenerator.cs`
   - Create appropriate interfaces
   - Update namespaces

3. **Move other infrastructure components**
   - Move logging, event bus, and other infrastructure components to the appropriate locations
   - Update namespaces

## Phase 6: Testing and Verification

1. **Update project references**
   - Update any project references to point to the new namespace structure

2. **Compile and fix errors**
   - Compile the project and fix any errors related to namespace changes
   - Run tests to ensure functionality is preserved

3. **Verify functionality**
   - Test key functionality to ensure it works as expected after refactoring

## Phase 7: Clean Up

1. **Remove old structure**
   - Once all components have been migrated and verified, remove the old empty directories

2. **Update documentation**
   - Update any documentation to reflect the new structure

3. **Commit changes**
   ```
   git add .
   git commit -m "Complete refactoring of FMS.Application"
   ```

## Important Considerations

- **One component at a time**: Migrate one component at a time to minimize compilation errors
- **Namespace updates**: Be thorough in updating namespaces in each file
- **References**: Update all references to moved components
- **Tests**: Ensure tests pass after each major migration
- **Incremental commits**: Make incremental commits to track progress and enable rollback if needed

## Recommended Migration Order

1. Core Common components (Responses, Interfaces, Exceptions)
2. Infrastructure components (Communication, Services)
3. Feature components by domain (Tank, Vehicle, Site, etc.)
4. PTS integration components
5. Clean up and final verification