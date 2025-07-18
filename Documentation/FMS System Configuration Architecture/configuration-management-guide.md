# Configuration Management Feature

## Overview
The Configuration Management feature provides administrators with the ability to manage automated fueling configurations for the FMS system. It supports both global and site-specific configurations with a comprehensive CRUD interface.

## Feature Components

### Backend Components

#### Controller
- **File**: `FMS.WebClient/Controllers/ConfigurationController.cs`
- **Route**: `/api/automated-fueling-configuration`
- **Authentication**: Required (Bearer token)

#### Endpoints
1. `GET /api/automated-fueling-configuration` - Get all configurations with optional filters
2. `GET /api/automated-fueling-configuration/{id}` - Get specific configuration
3. `POST /api/automated-fueling-configuration` - Create new configuration
4. `PUT /api/automated-fueling-configuration/{id}` - Update existing configuration
5. `DELETE /api/automated-fueling-configuration/{id}` - Delete configuration
6. `GET /api/automated-fueling-configuration/site/{siteId}` - Get effective configuration for site

#### Commands and Queries
Located in `FMS.Application/Features/Configuration/`:
- `CreateAutomatedFuelingConfigurationCommand`
- `UpdateAutomatedFuelingConfigurationCommand`
- `DeleteAutomatedFuelingConfigurationCommand`
- `GetAutomatedFuelingConfigurationQuery`
- `GetConfigurationsListQuery`

#### DTOs
Located in `FMS.Application/ModelsDTOs/Configuration/`:
- `AutomatedFuelingConfigurationDto`
- `CreateAutomatedFuelingConfigurationDto`
- `UpdateAutomatedFuelingConfigurationDto`

### Frontend Components

#### Redux State Management
- **Actions**: `src/redux/actions/configurationActions.js`
- **Reducer**: `src/redux/reducers/configurationReducer.js`
- **Service**: `src/services/configurationService.js`

#### React Components
- **Main Page**: `src/pages/admin/configuration/ConfigurationPage.js`
- **Styles**: `src/pages/admin/configuration/ConfigurationPage.scss`
- **Route**: `/admin/configuration`

## Configuration Properties

### Core Settings
- **Site ID**: Optional - Leave empty for global configuration
- **Update Tank Volume from BookKeeping**: Boolean - Whether to update tank volumes from bookkeeping records
- **Use PTS Probe Readings**: Boolean - Whether to use PTS probe readings for volume calculations
- **Volume Source Priority**: Enum (BookKeeping, PTS Probe, Manual)

### Ledger Management
- **Auto Create Ledger Entries**: Boolean - Automatically create ledger entries
- **Check for Duplicate Manual Entries**: Boolean - Validate against duplicate manual entries
- **Duplicate Volume Tolerance**: Decimal (%) - Tolerance percentage for duplicate detection

### Reconciliation Settings
- **Auto Reconcile Tank Volumes**: Boolean - Enable automatic tank volume reconciliation
- **Reconciliation Frequency**: Integer (minutes) - How often to run reconciliation
- **Max Volume Discrepancy Threshold**: Decimal (liters) - Maximum allowed discrepancy
- **Discrepancy Action**: Enum (Alert Only, Auto Correct, Block Transaction)

### Status
- **Is Active**: Boolean - Whether the configuration is active
- **Created On**: DateTime - Creation timestamp
- **Created By**: String - User who created the configuration
- **Updated On**: DateTime - Last update timestamp
- **Updated By**: String - User who last updated the configuration

## User Interface Features

### Data Grid
- **Search**: Full-text search across all configuration fields
- **Filtering**: Column-based filtering and header filters
- **Sorting**: Multi-column sorting support
- **Export**: Export configurations to Excel
- **Pagination**: Server-side pagination with configurable page sizes

### Form Management
- **Create/Edit**: Modal popup form with validation
- **Field Types**:
  - Text inputs for numeric values
  - Checkboxes for boolean settings
  - Select boxes for enumerated values
  - Number inputs with step validation
- **Validation**: Client-side validation with real-time feedback

### Actions
- **Add New**: Create new configuration
- **Edit**: Modify existing configuration
- **Delete**: Remove configuration with confirmation
- **View**: Display configuration details

## Data Flow

### Loading on Login
1. User successfully authenticates
2. `AuthActions.signIn()` dispatches `fetchConfigurations()`
3. Configurations are loaded into Redux store
4. Available for immediate use in admin panel

### CRUD Operations
1. User action triggers Redux action
2. Action calls ConfigurationService API method
3. Service makes HTTP request to backend controller
4. Controller uses MediatR to handle command/query
5. Response flows back through Redux store
6. UI updates with new data and success/error notifications

## Error Handling

### Backend
- All endpoints return `FMSResponseMessage<T>` for consistent error formatting
- Validation errors are captured and returned in response
- Exception handling with proper HTTP status codes

### Frontend
- Redux actions handle both success and failure cases
- Error messages displayed via Toast notifications
- Loading states prevent multiple simultaneous operations
- Form validation prevents invalid submissions

## Security

### Authentication
- All API endpoints require valid Bearer token
- User identity is extracted from JWT claims for audit fields

### Authorization
- Admin role required to access configuration management
- User context captured for created/updated by fields

## Mobile Responsiveness
- Grid automatically adjusts column widths
- Form popup becomes full-screen on mobile devices
- Touch-friendly button sizing and spacing

## Integration Points

### System Configuration Service
- Configurations can be cached and accessed by other system components
- Site-specific configurations override global settings
- Integration with automated fueling workflows

### Audit Trail
- All CRUD operations include user identity
- Timestamps for creation and modification
- Soft delete capability (via IsActive flag)

## Future Enhancements

### Planned Features
- Configuration versioning and history
- Bulk import/export capabilities
- Configuration templates
- Advanced validation rules
- Real-time configuration updates via SignalR

### API Extensions
- Configuration comparison endpoints
- Configuration backup/restore
- Configuration deployment to multiple sites
- Configuration validation endpoints

## Testing

### Frontend Testing
- Unit tests for Redux actions and reducers
- Component testing for form validation
- Integration tests for API communication

### Backend Testing
- Unit tests for commands and queries
- Integration tests for controller endpoints
- Validation testing for DTOs

## Performance Considerations

### Caching
- Configuration data cached in Redux store
- Server-side caching for frequently accessed configurations
- Cache invalidation on updates

### Pagination
- Server-side pagination for large configuration lists
- Configurable page sizes
- Efficient database queries with filtering

## Deployment Notes

### Database
- Ensure AutomatedFuelingConfiguration table exists
- Run any required migrations
- Verify foreign key constraints for SiteId

### Frontend
- New route added to admin section
- Redux store updated with configuration reducer
- Service registered for API communication

### Backend
- Controller registered in DI container
- MediatR handlers registered
- API documentation updated

This feature provides a comprehensive solution for managing automated fueling configurations with a modern, responsive user interface and robust backend architecture following FMS coding standards and patterns.
