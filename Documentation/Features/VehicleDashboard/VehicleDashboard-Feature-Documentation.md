# Vehicle Dashboard Feature Documentation

## Overview
The Vehicle Dashboard feature provides comprehensive analytics and monitoring capabilities for the fleet management system. It offers real-time insights into vehicle status, performance metrics, utilization rates, and maintenance requirements.

## Feature Components

### 1. Dashboard Analytics Query (`GetVehicleDashboardAnalyticsQuery`)
- **Purpose**: Aggregates all dashboard data into a single response
- **Returns**: Complete dashboard analytics including metrics, status distribution, utilization, alerts, activities, and performance data
- **Use Case**: Primary endpoint for dashboard initialization

### 2. Dashboard Metrics Query (`GetVehicleDashboardMetricsQuery`)
- **Purpose**: Provides high-level fleet metrics and KPIs
- **Returns**: `VehicleDashboardMetricsDTO` with counts and percentages
- **Metrics Include**:
  - Total, Active, Online, Offline vehicles
  - Vehicles with issues, maintenance due
  - In-transit, idle vehicles
  - Utilization rates and health scores
  - GPS-enabled and unassigned vehicles

### 3. Status Distribution Query (`GetVehicleStatusDistributionQuery`)
- **Purpose**: Shows distribution of vehicles across different statuses
- **Returns**: List of status categories with counts and percentages
- **Status Categories**:
  - Active, Inactive, Maintenance, Out of Service

### 4. Fleet Utilization Query (`GetFleetUtilizationQuery`)
- **Purpose**: Provides fleet utilization analytics over a specified period
- **Parameters**: Days (1-365, default 30)
- **Returns**: `FleetUtilizationDTO` with:
  - Overall utilization percentage
  - Daily utilization trends
  - Per-vehicle utilization data
  - Average hours per day

### 5. Maintenance Alerts Query (`GetVehicleMaintenanceAlertsQuery`)
- **Purpose**: Retrieves upcoming and overdue maintenance alerts
- **Parameters**: Limit (1-100, default 20)
- **Returns**: List of maintenance alerts with priority levels
- **Alert Types**: Oil Change, Brake Service, Tire Rotation, Engine Service, General Inspection

### 6. Recent Activities Query (`GetVehicleRecentActivitiesQuery`)
- **Purpose**: Shows recent vehicle-related activities and events
- **Parameters**: Limit (1-100, default 10)
- **Returns**: List of recent activities with timestamps
- **Activity Types**: Fuel transactions, trips, maintenance, alerts, status changes

### 7. Performance Metrics Query (`GetVehiclePerformanceMetricsQuery`)
- **Purpose**: Calculates vehicle performance KPIs over a period
- **Parameters**: Days (1-365, default 7)
- **Returns**: `VehiclePerformanceMetricsDTO` with:
  - Fuel efficiency (km/L)
  - Average speed, total distance
  - Fuel consumption, idle time
  - Cost efficiency metrics

## Data Transfer Objects (DTOs)

### Core DTOs Used:
- `VehicleDashboardAnalyticsDTO` - Complete dashboard data
- `VehicleDashboardMetricsDTO` - High-level metrics
- `VehicleStatusDistributionDTO` - Status breakdown
- `FleetUtilizationDTO` - Utilization analytics
- `MaintenanceAlertDTO` - Maintenance notifications
- `VehicleActivityDTO` - Activity records
- `VehiclePerformanceMetricsDTO` - Performance KPIs

## Implementation Notes

### Current Status
All queries are implemented with sample data and TODO comments marking areas for actual database integration:

1. **Database Integration**: Replace sample data with actual database queries
2. **Business Logic**: Implement proper calculation algorithms
3. **Data Sources**: Connect to relevant tables (Vehicles, FuelTransactions, Trips, Maintenance, etc.)
4. **Caching**: Consider implementing caching for performance optimization

### Error Handling
All queries use `FMSResponse<T>` for consistent error handling:
- Validation errors for invalid parameters
- System errors for database issues
- Success responses with data

### Validation Rules
- Days parameters: 1-365 range
- Limit parameters: 1-100 range
- Database context availability checks

## Frontend Integration

### Redux Actions
The frontend uses corresponding Redux actions:
- `FETCH_DASHBOARD_ANALYTICS_*`
- `FETCH_DASHBOARD_METRICS_*`
- `FETCH_STATUS_DISTRIBUTION_*`
- `FETCH_FLEET_UTILIZATION_*`
- `FETCH_MAINTENANCE_ALERTS_*`
- `FETCH_RECENT_ACTIVITIES_*`
- `FETCH_PERFORMANCE_METRICS_*`

### API Endpoints
Each query corresponds to a controller endpoint in `VehicleController`:
- `GET /api/vehicle/dashboard/analytics`
- `GET /api/vehicle/dashboard/metrics`
- `GET /api/vehicle/dashboard/status-distribution`
- `GET /api/vehicle/dashboard/fleet-utilization?days={days}`
- `GET /api/vehicle/dashboard/maintenance-alerts`
- `GET /api/vehicle/dashboard/recent-activities?limit={limit}`
- `GET /api/vehicle/dashboard/performance-metrics?days={days}`

### Caching Strategy
- Analytics: 5-minute cache
- Metrics: 15-minute cache
- Status Distribution: 10-minute cache
- Fleet Utilization: 30-minute cache
- Maintenance Alerts: 5-minute cache
- Recent Activities: 2-minute cache
- Performance Metrics: 15-minute cache

## Future Enhancements

1. **Real-time Updates**: Implement SignalR for live dashboard updates
2. **Filtering**: Add filtering by vehicle type, location, driver
3. **Historical Data**: Extended historical analysis capabilities
4. **Custom Dashboards**: User-configurable dashboard layouts
5. **Export Features**: PDF/Excel export of dashboard data
6. **Mobile Optimization**: Enhanced mobile dashboard experience

## Database Tables Integration

### Primary Tables
- `Vehicles` - Vehicle master data
- `FuelTransactions` - Fuel consumption data
- `VehicleTrips` - Trip and mileage data
- `MaintenanceSchedules` - Maintenance planning
- `VehicleAlerts` - Alert and notification data
- `GPSData` - Vehicle location and status

### Performance Considerations
- Index optimization for date-range queries
- Aggregation query optimization
- Consider materialized views for complex calculations
- Implement data archiving for historical data

## Testing Strategy

1. **Unit Tests**: Test each query handler independently
2. **Integration Tests**: Test with actual database
3. **Performance Tests**: Load testing for dashboard endpoints
4. **Cache Tests**: Verify caching behavior
5. **Validation Tests**: Test parameter validation

Created: July 14, 2025
Last Updated: July 14, 2025
