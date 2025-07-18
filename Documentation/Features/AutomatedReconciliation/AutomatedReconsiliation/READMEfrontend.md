 # Automated Reconciliation System

This module provides a comprehensive automated reconciliation system for FMS tank monitoring and discrepancy management.

## Features

### 1. Multi-Role Dashboard Support
- **Operator Dashboard**: Real-time monitoring of executions and alerts
- **Manager Dashboard**: Policy management and performance analytics
- **Executive Dashboard**: Strategic overview and ROI analysis

### 2. Policy Management
- Create, edit, and manage reconciliation policies
- Support for different policy types:
  - **Scheduled**: Time-based execution
  - **Threshold**: Event-driven based on discrepancy thresholds
  - **Hybrid**: Combination of scheduled and threshold-based
  - **Event Driven**: Triggered by external events

### 3. Execution Monitoring
- Real-time tracking of policy executions
- Performance metrics and progress monitoring
- Manual execution triggering
- Error handling and retry mechanisms

### 4. Discrepancy Analysis
- Comprehensive discrepancy detection and analysis
- Severity classification (Low, Medium, High, Critical)
- Trend analysis and pattern recognition
- Business impact assessment

### 5. Analytics and Reporting
- Performance dashboards with KPIs
- Success rate monitoring
- System efficiency tracking
- ROI analysis and cost savings calculation

## File Structure

```
src/pages/automatedReconciliation/
├── AutomatedReconciliationSystem.js     # Main system component
├── components/
│   ├── EnhancedOperatorDashboard.js     # Operator view dashboard
│   ├── EnhancedManagerDashboard.js      # Manager view dashboard
│   ├── EnhancedExecutiveDashboard.js    # Executive view dashboard
│   ├── PolicyManagement.js             # Policy CRUD operations
│   ├── ExecutionMonitoring.js          # Execution tracking
│   └── DiscrepancyAnalysis.js          # Discrepancy analysis
├── README.md                           # This documentation
└── types/                              # Type definitions (if using TypeScript)
```

## Redux Integration

### Actions
Located in `src/redux/actions/automatedReconciliationActions.js`
- Policy management actions (CRUD)
- Execution monitoring actions
- Discrepancy analysis actions
- Analytics dashboard actions
- UI state management actions

### Reducer
Located in `src/redux/reducers/automatedReconciliationReducer.js`
- Manages all automated reconciliation state
- Handles loading states and error management
- Filters and pagination support

### State Structure
```javascript
{
  automatedReconciliation: {
    // Policy Management
    policies: [],
    selectedPolicy: null,
    policiesLoading: false,
    policiesError: null,

    // Execution Monitoring
    executions: [],
    selectedExecution: null,
    executionsLoading: false,
    executionsError: null,

    // Discrepancy Analysis
    discrepancies: [],
    discrepanciesLoading: false,
    discrepanciesError: null,

    // Analytics Dashboard
    analytics: null,
    analyticsLoading: false,
    analyticsError: null,

    // UI State
    activeTab: 'dashboard',
    userRole: 'operator',
    filters: { ... }
  }
}
```

## API Integration

### Service Layer
Located in `src/services/automatedReconciliationService.js`
- Centralized API calls for all reconciliation operations
- Integrates with the backend `/api/v1/automated-reconciliation` endpoints
- Consistent error handling and response formatting

### Backend Endpoints
All endpoints correspond to the `AutomatedReconciliationController.cs`:
- `GET /api/v1/automated-reconciliation/policies` - Get policies
- `POST /api/v1/automated-reconciliation/policies` - Create policy
- `PUT /api/v1/automated-reconciliation/policies/{id}` - Update policy
- `DELETE /api/v1/automated-reconciliation/policies/{id}` - Delete policy
- `GET /api/v1/automated-reconciliation/executions` - Get executions
- `POST /api/v1/automated-reconciliation/executions/manual-trigger` - Trigger execution
- `GET /api/v1/automated-reconciliation/discrepancies` - Get discrepancies
- `GET /api/v1/automated-reconciliation/analytics/dashboard` - Get analytics

## UI Components

### Design System
Uses the custom UI component library with Tailwind CSS:
- All classes use `tw-` prefix to avoid conflicts with DevExtreme
- FontAwesome icons with `fa-light` classes
- Consistent color scheme and spacing

### Reusable Components
- `Card`, `CardHeader`, `CardTitle`, `CardContent` - Container components
- `Button` - Action buttons with variants
- `Badge` - Status and type indicators
- `Progress` - Progress bars for executions
- `Tabs` - Navigation between different views
- `Select`, `Input` - Form controls

## Navigation Integration

### Route Configuration
Added to `app-routes.js`:
```javascript
case "automated reconciliation":
case "automated-reconciliation":
  return AutomatedReconciliationSystem;
```

### Menu Integration
Can be accessed through:
- Direct URL: `/automated-reconciliation`
- Navigation menu item: "Automated Reconciliation"

## Usage Examples

### Accessing Different Views
The system automatically switches between operator, manager, and executive views based on user role selection.

### Policy Management
- Create new policies with configurable schedules and thresholds
- Edit existing policies with validation
- Activate/deactivate policies
- Monitor policy performance

### Execution Monitoring
- View real-time execution progress
- Pause/resume executions
- Trigger manual executions
- Monitor execution history

### Discrepancy Analysis
- Filter discrepancies by severity, site, tank
- View trend analysis and business impact
- Reconcile discrepancies manually
- Export analysis reports

## Customization

### Adding New Policy Types
1. Add new type to backend enum
2. Update frontend type definitions
3. Add UI handling in PolicyManagement component
4. Update validation logic

### Extending Analytics
1. Add new metrics to backend DTO
2. Update reducer to handle new data
3. Create new dashboard components
4. Add to analytics dashboard

### Custom Themes
Modify Tailwind classes in components to match organizational branding while maintaining the `tw-` prefix.

## Performance Considerations

- Real-time updates use polling (can be upgraded to WebSocket)
- Pagination implemented for large datasets
- Lazy loading for dashboard components
- Efficient Redux state management with normalized data

## Security

- All API calls require authentication
- Role-based access control for different features
- Input validation on both frontend and backend
- Secure handling of sensitive tank data

## Future Enhancements

- WebSocket integration for real-time updates
- Advanced analytics with charts and graphs
- Mobile-responsive improvements
- Bulk operations for policy management
- Advanced filtering and search capabilities
- Integration with external monitoring systems