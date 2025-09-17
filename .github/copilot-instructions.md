# GitHub Copilot Instructions for FMS System

## System Overview

The FMS (Fleet Management System) is a full-stack application built with Clean Architecture and CQRS pattern:

- **Backend**: .NET 8.0 with CQRS, Entity Framework Core, MySQL
- **Frontend**: React 18 + DevExtreme UI + Redux Toolkit + Tailwind CSS
- **Real-time**: SignalR for live updates, WebSocket for device communication
- **Database**: MySQL with Entity Framework Core
- **Architecture**: Clean Architecture with feature-based organization

## Core Development Patterns

### Backend Patterns

#### 1. Response Handling (MANDATORY)
Always use `FMSResponse<T>` for ALL API responses:

```csharp
// ✅ CORRECT - Use FMSResponse for all responses
public async Task<FMSResponse<VehicleDto>> Handle(CreateVehicleCommand request)
{
    // Business logic here
    return FMSResponse<VehicleDto>.Success(vehicleDto, "Vehicle created successfully");
}

// ❌ WRONG - Don't return raw data
public async Task<VehicleDto> Handle(CreateVehicleCommand request)
{
    return vehicleDto;
}
```

#### 2. CQRS Command Pattern
Commands modify data and return `FMSResponse<T>`:

```csharp
// Location: FMS.Application/Features/[Feature]/Commands/
public record CreateVehicleCommand(VehicleDTO VehicleDTO)
    : IRequest<FMSResponse<VehicleDTO>>;

public class CreateVehicleCommandHandler
    : IRequestHandler<CreateVehicleCommand, FMSResponse<VehicleDTO>>
{
    public async Task<FMSResponse<VehicleDTO>> Handle(CreateVehicleCommand request)
    {
        // Always include validation
        var validationResult = await ValidateVehicleDTO(request.VehicleDTO);
        if (!validationResult.IsValid)
        {
            return FMSResponse<VehicleDTO>.ValidationFailed(validationResult.Errors);
        }

        // Business logic here
        return FMSResponse<VehicleDTO>.Success(result, "Operation completed");
    }
}
```

#### 3. CQRS Query Pattern
Queries read data and return `FMSResponse<T>`:

```csharp
// Location: FMS.Application/Features/[Feature]/Queries/
public record GetVehiclesQuery() : IRequest<FMSResponse<List<VehicleDto>>>;

public class GetVehiclesQueryHandler
    : IRequestHandler<GetVehiclesQuery, FMSResponse<List<VehicleDto>>>
{
    public async Task<FMSResponse<List<VehicleDto>>> Handle(GetVehiclesQuery request)
    {
        var vehicles = await _context.Vehicles.ToListAsync();
        return FMSResponse<List<VehicleDto>>.Success(_mapper.Map<List<VehicleDto>>(vehicles));
    }
}
```

#### 4. Database Entity Configuration
New entities require configuration in `FMS.Persistence/EntityConfigurations/`:

```csharp
// Location: FMS.Persistence/EntityConfigurations/
public class VehicleConfiguration : IEntityTypeConfiguration<Vehicle>
{
    public void Configure(EntityTypeBuilder<Vehicle> builder)
    {
        builder.ToTable("vehicles");
        builder.HasKey(v => v.VehicleId);

        builder.Property(v => v.HyoungNo)
            .HasMaxLength(50)
            .IsRequired();

        // Relationships
        builder.HasOne(v => v.VehicleType)
            .WithMany()
            .HasForeignKey(v => v.VehicleTypeId);
    }
}
```

Add to `GpsdataContext.cs`:
```csharp
public virtual DbSet<Vehicle> Vehicles { get; set; }
```

### Frontend Patterns

#### 1. Tailwind CSS (MANDATORY)
Always use `tw-` prefix to avoid DevExtreme conflicts:

```jsx
// ✅ CORRECT
<div className="tw-flex tw-items-center tw-justify-between tw-p-4">
  <span className="tw-font-semibold">Title</span>
  <button className="tw-bg-blue-500 tw-text-white tw-px-4 tw-py-2">Click</button>
</div>

// ❌ WRONG - Missing tw- prefix
<div className="flex items-center justify-between p-4">
  <span className="font-semibold">Title</span>
  <button className="bg-blue-500 text-white px-4 py-2">Click</button>
</div>
```

#### 2. FontAwesome Icons
Use `fa-light fa-icon` pattern:

```jsx
// ✅ CORRECT
<i className="fa-light fa-car"></i>
<i className="fa-light fa-gas-pump"></i>

// ❌ WRONG - Missing fa-light
<i className="fas fa-car"></i>
```

#### 3. SCSS Over CSS
Always use SCSS files, never CSS:

```scss
// ✅ CORRECT - Use SCSS files
.vehicle-card {
  @apply tw-border tw-rounded-lg tw-p-4;

  .title {
    @apply tw-font-semibold tw-text-gray-800;
  }

  &.active {
    @apply tw-border-blue-500 tw-bg-blue-50;
  }
}
```

#### 4. Module Routing Pattern
Each module uses wildcard routing for sub-navigation:

```javascript
// Content.js - Add both routes for each module
{/* Tank Stock System Routes */}
<Route
  path="/tankstock"
  element={React.createElement(resolvedComponents("tank stock"))}
/>
<Route
  path="/tankstock/*"
  element={React.createElement(resolvedComponents("tank stock"))}
/>

// app-routes.js - Map to Main component
case "tank stock":
    return TankStockMain;

// TankStockMain.js - Handle internal routing
const TankStockMain = () => {
  return (
    <TankStockLayout>
      <Routes>
        <Route index element={<TankStockDashboard />} />
        <Route path="/dashboard" element={<TankStockDashboard />} />
        <Route path="/management" element={<TankManagement />} />
        <Route path="*" element={<Navigate to="/tankstock" replace />} />
      </Routes>
    </TankStockLayout>
  );
};
```

#### 5. Permission System
Use JWT-based permissions (preferred over API calls):

```javascript
// ✅ CORRECT - Use usePermissions hook
import { usePermissions } from '../hooks/usePermissions';

const MyComponent = () => {
  const { hasPermission } = usePermissions();

  if (!hasPermission('_Read_Vehicle')) {
    return <div>Access denied</div>;
  }

  return <div>Vehicle content</div>;
};

// ❌ WRONG - Don't use API-based permissions
useEffect(() => {
  dispatch(fetchpermissionbyUserId(user.id));
}, [dispatch]);
```

## Critical Workflows

### 1. Adding New Features
1. **Check existing implementations** in `Documentation/Features/` first
2. **Create feature folder** in `FMS.Application/Features/[FeatureName]/`
3. **Follow CQRS structure**: Commands/, Queries/, DTOs/, Services/
4. **Add to GPSDataContext** if new entities needed
5. **Create entity configuration** in `FMS.Persistence/EntityConfigurations/`
6. **Update documentation** in `Documentation/Features/[FeatureName]/`

### 2. Database Changes
1. **Create entity** in `FMS.Domain/Entities/`
2. **Add configuration** in `FMS.Persistence/EntityConfigurations/`
3. **Register in GPSDataContext**
4. **Generate MySQL syntax** and place in `Documentation/[Feature]/database/`
5. **Create migration script**

### 3. Navigation Setup
1. **Add to database**: Insert into `navigationitems` table
2. **Add routes** in `Content.js` (both base and wildcard)
3. **Add mapping** in `app-routes.js`
4. **Create Main component** with internal routing
5. **Assign roles** via Navigation Management

### 4. Environment Setup
```powershell
# Backend setup
scripts/environment/setup-environment.bat

# Frontend setup
cd fms.frontend
npm install
npm run build-themes

# Redis (optional)
scripts/redis/start-redis.bat
```

## Key Files & Locations

### Backend Structure
```
FMS.Application/
├── Features/[FeatureName]/
│   ├── Commands/          # Write operations
│   ├── Queries/           # Read operations
│   ├── DTOs/             # Data transfer objects
│   └── Services/         # Business logic
├── Common/
│   └── FMSResponse.cs    # Response wrapper (MANDATORY)
└── MappingProfile/       # AutoMapper configurations

FMS.Persistence/
├── DataAccess/
│   └── GpsdataContext.cs # EF Core context
└── EntityConfigurations/ # Entity configurations

FMS.WebClient/            # API controllers
FMS.Domain/              # Entities and domain models
```

### Frontend Structure
```
fms.frontend/src/
├── pages/[module]/       # Feature modules
│   ├── [ModuleName]Main.js    # Main routing component
│   ├── layout/               # Layout components
│   ├── dashboard/            # Dashboard views
│   └── components/           # Module components
├── api/                     # HTTP clients
├── redux/                   # State management
├── utils/                   # Utilities
└── hooks/                   # Custom hooks
```

## Quality Checklist

### Backend Code
- [ ] Uses `FMSResponse<T>` for all responses
- [ ] Includes validation in commands
- [ ] Follows CQRS pattern (Commands vs Queries)
- [ ] Has proper error handling
- [ ] Includes logging where appropriate
- [ ] New entities have configurations
- [ ] Added to GPSDataContext if needed

### Frontend Code
- [ ] Uses `tw-` prefix for Tailwind classes
- [ ] Uses `fa-light fa-icon` for FontAwesome
- [ ] Uses SCSS, not CSS
- [ ] Follows module routing pattern
- [ ] Uses JWT permissions (not API calls)
- [ ] Mobile responsive (height-based collapsing)
- [ ] Includes proper error boundaries

### Database Changes
- [ ] Entity configuration created
- [ ] Added to GPSDataContext
- [ ] MySQL syntax generated
- [ ] Migration script created
- [ ] Documentation updated

## Common Patterns & Examples

### API Controller Pattern
```csharp
[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    private readonly IMediator _mediator;

    [HttpPost]
    public async Task<IActionResult> Create(CreateVehicleCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
}
```

### Redux Action Pattern
```javascript
// Use Redux Toolkit
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchVehicles',
  async () => {
    const response = await axiosInstance.get('/vehicles');
    return response.data;
  }
);
```

### Component Structure
```jsx
import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

const VehicleList = () => {
  const { hasPermission } = usePermissions();

  return (
    <div className="tw-p-4">
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <h2 className="tw-text-xl tw-font-semibold">Vehicles</h2>
        {hasPermission('_Create_Vehicle') && (
          <button className="tw-bg-blue-500 tw-text-white tw-px-4 tw-py-2">
            <i className="fa-light fa-plus tw-mr-2"></i>
            Add Vehicle
          </button>
        )}
      </div>
      {/* Component content */}
    </div>
  );
};
```

## Development Commands

### Backend
```bash
# Build solution
dotnet build Hyoung.Fms.sln

# Run API
# Open FMS.WebClient in Visual Studio and run

# Run PTS Service
# Open FMS.PTS.WindowsService in Visual Studio and run
```

### Frontend
```bash
cd fms.frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build:prod

# Build DevExtreme themes
npm run build-themes
```

### Database
```bash
# Generate migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update
```

## Troubleshooting

### Common Issues
1. **Navigation not working**: Check database `navigationitems` table and role assignments
2. **Permissions not working**: Ensure JWT contains permissions, use `usePermissions` hook
3. **Styling conflicts**: Always use `tw-` prefix for Tailwind classes
4. **API errors**: Check that responses use `FMSResponse<T>` pattern
5. **Module routing**: Ensure both base and wildcard routes are configured

### Getting Help
1. Check existing implementations in `Documentation/Features/`
2. Review CLAUDE.md for detailed patterns
3. Check folderstructure.instructions.md for file organization
4. Look at working examples (TankStock, Vehicles, Notifications modules)

---

*This document focuses on THIS project's specific patterns and conventions. Follow these guidelines to maintain consistency and avoid common pitfalls.*