# System Configuration Management Feature

## Overview
The System Configuration Management feature provides a comprehensive CRUD interface for managing system-wide configuration settings in the FMS application. This feature is integrated into the Admin section of the application.

## Backend Implementation

### Database Layer
- **Entity**: `SystemConfiguration` in FMS.Domain.Entities
- **Configuration**: `SystemConfigurationConfiguration` in FMS.Persistence.Configuration
- **DbContext**: Added to `GpsdataContext.cs`

### Application Layer
- **DTOs**:
  - `SystemConfigurationDto` - Read operations
  - `CreateSystemConfigurationDto` - Create operations
  - `UpdateSystemConfigurationDto` - Update operations
- **Commands**:
  - `CreateSystemConfigurationCommand`
  - `UpdateSystemConfigurationCommand`
  - `DeleteSystemConfigurationCommand`
- **Queries**:
  - `GetSystemConfigurationsListQuery` - Paginated list with filtering
  - `GetSystemConfigurationQuery` - Single record by ID
  - `GetCurrentSystemConfigurationQuery` - Active configuration
- **Handlers**: Corresponding handlers for all commands and queries
- **AutoMapper**: `SystemConfigurationMappingProfile` for entity-DTO mapping

### API Layer
- **Controller**: `SystemConfigurationController` with full CRUD endpoints
- **Endpoints**:
  - `GET /api/systemconfiguration` - List with filtering and pagination
  - `GET /api/systemconfiguration/{id}` - Get by ID
  - `GET /api/systemconfiguration/current` - Get active configuration
  - `POST /api/systemconfiguration` - Create new
  - `PUT /api/systemconfiguration/{id}` - Update existing
  - `DELETE /api/systemconfiguration/{id}` - Delete

## Frontend Implementation

### Redux State Management
- **Actions**: `systemConfigActions.js` - All CRUD and filtering actions
- **Reducer**: `systemConfigReducer.js` - State management
- **Integration**: Added to root reducer

### Components
- **Main Page**: `SystemConfiguration.js` - Main page with DataGrid
- **Form Component**: `SystemConfigForm.js` - Create/Edit popup form
- **Filters**: `SystemConfigFilters.js` - Filter panel
- **Bulk Actions**: `SystemConfigBulkActions.js` - Bulk operations
- **Import**: `SystemConfigImport.js` - CSV/JSON import functionality

### UI Features
- **DataGrid**: DevExtreme DataGrid with sorting, filtering, pagination
- **CRUD Operations**: Create, Read, Update, Delete with validation
- **Filtering**: Multi-field filtering (category, type, status, search)
- **Bulk Operations**: Select multiple records for bulk actions
- **Import/Export**: CSV and JSON import with progress tracking
- **Responsive Design**: Tailwind CSS with mobile support

### Navigation Integration
- **Admin Route**: `/admin/systemconfig`
- **App Routes**: Added to `app-routes.js` for navigation resolution
- **Admin Layout**: Integrated into AdminMain.js routing
- **Sidebar**: Added to admin navigation with appropriate icon

## Key Features

### Filtering and Search
- Filter by category, data type, editable status, active status
- Global search across configuration keys and values
- Real-time filtering with debounced input

### Bulk Operations
- Select multiple configurations for bulk actions
- Bulk activate/deactivate
- Bulk delete with confirmation
- Bulk edit for common fields

### Import/Export
- Import configurations from CSV or JSON files
- Download import templates
- Progress tracking during import
- Validation and error reporting
- Export current configurations

### Validation
- Frontend validation using DevExtreme validators
- Backend validation in command handlers
- Required field validation
- Data type validation
- Unique constraint validation

## Security
- Authorization required for all endpoints
- Role-based access control
- User audit trails for modifications
- Input sanitization and validation

## Error Handling
- Comprehensive error handling in all layers
- User-friendly error messages
- Logging for debugging and audit
- Graceful degradation for network issues

## Integration Points

### Admin Dashboard
- Added card for System Configuration access
- Integrated into admin navigation structure
- Consistent styling with other admin features

### Navigation System
- Added navigation item capability
- Route protection with role-based access
- Breadcrumb integration

## Database Schema
The SystemConfiguration table includes:
- `Id` - Primary key
- `ConfigKey` - Unique configuration key
- `ConfigValue` - Configuration value
- `DataType` - Value data type (String, Integer, Boolean, etc.)
- `Category` - Grouping category
- `Description` - Human-readable description
- `IsEditable` - Whether users can modify
- `IsActive` - Whether configuration is active
- `CreatedDate` - Creation timestamp
- `CreatedBy` - User who created
- `ModifiedDate` - Last modification timestamp
- `ModifiedBy` - User who last modified

## Usage Examples

### Creating a Configuration
```javascript
const newConfig = {
  configKey: 'MAX_FUEL_CAPACITY',
  configValue: '50000',
  dataType: 'Integer',
  category: 'Fuel Management',
  description: 'Maximum fuel capacity per tank in liters',
  isEditable: true,
  isActive: true
};
```

### Filtering Configurations
```javascript
const filters = {
  category: 'Fuel Management',
  dataType: 'Integer',
  isActive: true,
  searchTerm: 'capacity'
};
```

## Future Enhancements
- Configuration versioning and rollback
- Real-time configuration updates via SignalR
- Configuration validation rules
- Environment-specific configurations
- Configuration change notifications

## Files Created/Modified

### Backend
- `FMS.Application/ModelsDTOs/SystemConfiguration/SystemConfigurationDto.cs`
- `FMS.Application/Command/DatabaseCommand/SystemConfigurationCommands/`
- `FMS.Application/Queries/Database/SystemConfigurationQueries/`
- `FMS.Application/Handlers/DatabaseHandlers/SystemConfigurationHandlers/`
- `FMS.Application/MappingProfile/SystemConfigurationMappingProfile.cs`
- `FMS.WebClient/Controllers/SystemConfigurationController.cs`

### Frontend
- `fms.frontend/src/redux/actions/systemConfigActions.js`
- `fms.frontend/src/redux/reducers/systemConfigReducer.js`
- `fms.frontend/src/pages/SystemConfiguration/SystemConfiguration.js`
- `fms.frontend/src/pages/SystemConfiguration/components/`
- `fms.frontend/src/pages/admin/systemConfiguration/index.js`
- Updated `fms.frontend/src/app-routes.js`
- Updated `fms.frontend/src/pages/admin/AdminMain.js`

This comprehensive implementation provides a complete system configuration management solution integrated into the FMS application's admin interface.
