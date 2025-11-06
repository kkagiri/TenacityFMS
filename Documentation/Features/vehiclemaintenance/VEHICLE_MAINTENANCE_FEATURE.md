# Vehicle Maintenance Monitoring Feature

## Overview
This document describes the complete implementation of the Vehicle Maintenance Monitoring feature for the Hyoung FMS system.

## Features Implemented

### Backend (C# .NET)

#### 1. Domain Models
- **VehicleMaintenance**: Main entity for maintenance records
  - Tracks maintenance type, status, scheduled/completed dates
  - Odometer readings at schedule and completion
  - Cost tracking and service provider information
  - Priority levels and overdue status
  - Issue tracking relationship
  - User responsibility tracking

- **MaintenanceSchedule**: Configuration for service schedules
  - Defines maintenance intervals (kilometers and/or days)
  - Warning thresholds for due soon notifications
  - Can apply to all vehicles or specific vehicle types
  - Estimated costs and default priority

- **MaintenanceIssue**: Issue tracking for maintenance work
  - Issue type and severity levels
  - Detailed description and status tracking
  - Responsible person identification
  - Resolution tracking with notes
  - Additional cost tracking

#### 2. Entity Framework Configuration
- `VehicleMaintenanceConfiguration.cs`: Complete EF Core configuration with indexes
- `MaintenanceScheduleConfiguration.cs`: Schedule entity configuration
- `MaintenanceIssueConfiguration.cs`: Issue entity configuration
- `GpsdataContext.VehicleMaintenance.cs`: Partial DbContext class for maintenance entities

#### 3. DTOs (Data Transfer Objects)
- `VehicleMaintenanceDTO`: Complete maintenance record transfer
- `MaintenanceScheduleDTO`: Schedule configuration transfer
- `MaintenanceIssueDTO`: Issue tracking transfer
- `MaintenanceDashboardDTO`: Dashboard statistics with supporting DTOs:
  - `MaintenanceByTypeDTO`
  - `UpcomingMaintenanceDTO`
  - `OverdueMaintenanceDTO`
  - `MonthlyMaintenanceTrendDTO`

#### 4. AutoMapper Profile
- `VehicleMaintenanceMappingProfile.cs`: Complete mappings between entities and DTOs
  - Includes navigation property mappings
  - Handles related vehicle and schedule data

#### 5. CQRS Commands
- `CreateMaintenanceCommand`: Create new maintenance records
- `UpdateMaintenanceCommand`: Update existing records
- `DeleteMaintenanceCommand`: Delete maintenance records
- `CreateMaintenanceScheduleCommand`: Create schedule configurations
- `UpdateMaintenanceScheduleCommand`: Update schedule configurations

#### 6. CQRS Queries
- `GetAllMaintenanceQuery`: Retrieve all maintenance records with filters
- `GetMaintenanceByIdQuery`: Get single maintenance record with related data
- `GetMaintenanceDashboardQuery`: Generate comprehensive dashboard statistics
- `GetAllMaintenanceSchedulesQuery`: Retrieve schedule configurations

#### 7. API Controller
- `VehicleMaintenanceController.cs`: RESTful API endpoints
  - GET /api/v1/VehicleMaintenance - List all with filters
  - GET /api/v1/VehicleMaintenance/{id} - Get by ID
  - POST /api/v1/VehicleMaintenance - Create new
  - PUT /api/v1/VehicleMaintenance/{id} - Update
  - DELETE /api/v1/VehicleMaintenance/{id} - Delete
  - GET /api/v1/VehicleMaintenance/dashboard - Dashboard stats
  - GET /api/v1/VehicleMaintenance/schedules - List schedules
  - POST /api/v1/VehicleMaintenance/schedules - Create schedule
  - PUT /api/v1/VehicleMaintenance/schedules/{id} - Update schedule
  - Includes caching with Redis (5-15 minute TTL)
  - JWT authentication required

### Frontend (React)

#### 1. API Service Layer
- `maintenanceService.js`: Complete API integration
  - All CRUD operations for maintenance records
  - Dashboard data fetching
  - Schedule management operations
  - Error handling and logging

#### 2. Redux State Management
- **Actions** (`maintenanceActions.js`):
  - Fetch maintenance records
  - Fetch dashboard data
  - Fetch schedules
  - Create/Update/Delete operations
  - Proper loading and error states

- **Reducers** (`maintenanceReducer.js`):
  - Manages maintenance records state
  - Dashboard data state
  - Schedules state
  - Loading states for each operation
  - Error handling for all operations

#### 3. Pages

##### Dashboard (`MaintenanceDashboard.js`)
- **Summary Cards**:
  - Up to Date count
  - Due Soon count
  - Overdue count
  - In Progress count

- **Cost Summary**:
  - Current month total cost
  - Current year total cost
  - Average cost per maintenance

- **Charts**:
  - Status distribution pie chart
  - Maintenance by type bar chart
  - Monthly trend line chart (12 months)

- **Data Tables**:
  - Upcoming maintenance (next 30 days)
  - Overdue maintenance with priority

- **Features**:
  - Real-time data loading
  - Auto-refresh capability
  - Export functionality
  - Responsive design

##### List Page (`MaintenanceList.js`)
- **Data Grid Features**:
  - Search, filter, and sort
  - Multi-column filtering
  - Export to Excel
  - Row selection
  - Pagination

- **CRUD Operations**:
  - Add new maintenance records
  - Edit existing records
  - Delete records with confirmation
  - Form validation

- **Visual Indicators**:
  - Status badges (color-coded)
  - Priority indicators
  - Cost formatting

##### Settings Page (`MaintenanceSettings.js`)
- **Schedule Management**:
  - Configure maintenance types
  - Set kilometer intervals
  - Set day intervals
  - Define warning thresholds
  - Estimated cost configuration
  - Apply to all vehicles or specific types

- **Features**:
  - Active/inactive schedules
  - Default priority settings
  - Description and notes
  - Edit existing schedules

## Use Cases Addressed

### 1. Odometer Entry and Tracking
- System stores odometer readings at schedule time and completion
- Tracks next due odometer reading
- Can be integrated with GPS module for automatic updates

### 2. Service Configuration
- Maintenance schedules define when services are due
- Examples configured:
  - Oil Change: Every 5,000 km
  - Tire Rotation: Every 10,000 km
  - Brake Service: Every 20,000 km
  - Major Service: Every 40,000 km

### 3. GPS Integration Ready
- Odometer fields support GPS data integration
- VehicleTrackingService interface available for live odometer updates
- `OdometerAtSchedule` and `OdometerAtCompletion` fields

### 4. Issue Tracking
- MaintenanceIssue entity tracks problems found during maintenance
- Records who was responsible for issues
- Tracks issue resolution with notes
- Additional costs for unexpected issues

### 5. Notifications and Alerts
- Dashboard shows overdue maintenance
- Due soon warnings (configurable thresholds)
- Priority-based sorting for urgent items

## Database Schema

### Tables Created
1. `vehicle_maintenance` - Main maintenance records
2. `maintenance_schedule` - Service configuration
3. `maintenance_issue` - Issue tracking

### Key Relationships
- VehicleMaintenance -> Vehicle (Many-to-One)
- VehicleMaintenance -> MaintenanceSchedule (Many-to-One, optional)
- MaintenanceIssue -> VehicleMaintenance (Many-to-One)
- MaintenanceSchedule -> VehicleType (Many-to-One, optional)
- All entities -> User (for audit tracking)

## Installation and Setup

### Backend Setup
1. The entity configurations are automatically discovered by EF Core
2. Run database migration:
   ```bash
   dotnet ef migrations add AddVehicleMaintenanceFeature --project FMS.Persistence
   dotnet ef database update --project FMS.Persistence
   ```

### Frontend Setup
1. Ensure the maintenance reducer is added to the Redux store:
   ```javascript
   // In your store configuration
   import maintenanceReducer from './redux/reducers/maintenanceReducer';

   const rootReducer = combineReducers({
     // ... other reducers
     maintenance: maintenanceReducer,
   });
   ```

2. Add routes for maintenance pages:
   ```javascript
   import { MaintenanceDashboard, MaintenanceList, MaintenanceSettings } from './pages/maintenance';

   // In your router
   <Route path="/maintenance/dashboard" component={MaintenanceDashboard} />
   <Route path="/maintenance/list" component={MaintenanceList} />
   <Route path="/maintenance/settings" component={MaintenanceSettings} />
   ```

## Future Enhancements

### Recommended Additions
1. **GPS Odometer Integration**:
   - Automatic odometer reading from GPS providers
   - Real-time calculation of maintenance due dates based on live odometer

2. **Notification System**:
   - Email/SMS alerts for overdue maintenance
   - Scheduled reminders before maintenance is due

3. **Mobile App**:
   - Mobile interface for mechanics to update maintenance status
   - Photo upload for before/after documentation

4. **Analytics**:
   - Cost trend analysis
   - Service provider performance metrics
   - Vehicle reliability scoring based on maintenance history

5. **Integration with Parts Inventory**:
   - Track parts used in maintenance
   - Automatic inventory deduction
   - Parts cost tracking

6. **Maintenance History Reports**:
   - Comprehensive vehicle maintenance history
   - Exportable PDF reports
   - Maintenance cost breakdown by vehicle/type

## API Documentation

### Authentication
All endpoints require JWT Bearer token authentication:
```
Authorization: Bearer <token>
```

### Endpoints

#### Maintenance Records

**GET /api/v1/VehicleMaintenance**
- Query parameters: `vehicleId`, `status`
- Returns: Array of maintenance records

**GET /api/v1/VehicleMaintenance/{id}**
- Returns: Single maintenance record with issues

**POST /api/v1/VehicleMaintenance**
- Body: VehicleMaintenanceDTO
- Returns: Created maintenance record

**PUT /api/v1/VehicleMaintenance/{id}**
- Body: VehicleMaintenanceDTO
- Returns: Updated maintenance record

**DELETE /api/v1/VehicleMaintenance/{id}**
- Returns: Success/failure response

**GET /api/v1/VehicleMaintenance/dashboard**
- Returns: MaintenanceDashboardDTO with statistics

#### Schedules

**GET /api/v1/VehicleMaintenance/schedules**
- Query parameters: `isActive`
- Returns: Array of maintenance schedules

**POST /api/v1/VehicleMaintenance/schedules**
- Body: MaintenanceScheduleDTO
- Returns: Created schedule

**PUT /api/v1/VehicleMaintenance/schedules/{id}**
- Body: MaintenanceScheduleDTO
- Returns: Updated schedule

## Testing

### Backend Testing
```bash
# Run all tests
dotnet test

# Test specific controller
dotnet test --filter "FullyQualifiedName~VehicleMaintenanceController"
```

### Frontend Testing
```bash
# Run frontend tests
npm test

# Run with coverage
npm test -- --coverage
```

## Code Structure

### Backend
```
FMS.Domain/
  └── Entities/Features/VehicleManagement/
      ├── VehicleMaintenance.cs
      ├── MaintenanceSchedule.cs
      └── MaintenanceIssue.cs

FMS.Persistence/
  ├── EntityConfigurations/
  │   ├── VehicleMaintenanceConfiguration.cs
  │   ├── MaintenanceScheduleConfiguration.cs
  │   └── MaintenanceIssueConfiguration.cs
  └── DataAccess/
      └── GpsdataContext.VehicleMaintenance.cs

FMS.Application/
  ├── Features/VehicleMaintenance/
  │   ├── Commands/
  │   ├── Queries/
  │   └── DTOs/
  └── MappingProfile/
      └── VehicleMaintenanceMappingProfile.cs

FMS.WebClient/
  └── Controllers/VehicleManagement/
      └── VehicleMaintenanceController.cs
```

### Frontend
```
fms.frontend/src/
  ├── services/
  │   └── maintenanceService.js
  ├── redux/
  │   ├── actions/
  │   │   └── maintenanceActions.js
  │   └── reducers/
  │       └── maintenanceReducer.js
  └── pages/maintenance/
      ├── dashboard/
      │   └── MaintenanceDashboard.js
      ├── list/
      │   └── MaintenanceList.js
      ├── settings/
      │   └── MaintenanceSettings.js
      └── index.js
```

## Contributors
- Built for Hyoung FMS
- Follows existing codebase patterns and conventions
- Compatible with multi-provider GPS tracking system

## Support
For issues or questions, please refer to the main FMS documentation or contact the development team.
