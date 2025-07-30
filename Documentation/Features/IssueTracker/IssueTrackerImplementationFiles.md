# Issue Tracker Technical Implementation Files

## File Structure Summary

This document outlines all the files that need to be created for the Issue Tracker frontend implementation with GPS integration and reporting capabilities.

## Required Files Checklist

### 📂 Pages (`fms.frontend/src/pages/issueTracker/`)

- [ ] **IssueTrackerPage.js** - Main dashboard with overview statistics
- [ ] **IssueTrackerListPage.js** - Comprehensive list view with DataGrid
- [ ] **IssueTrackerFormPage.js** - Create/Edit issue form
- [ ] **IssueTrackerDetailsPage.js** - Detailed issue view
- [ ] **IssueTrackerReportsPage.js** - Reports and analytics dashboard

### 📂 Components (`fms.frontend/src/pages/issueTracker/components/`)

- [ ] **IssueCard.js** - Individual issue card component
- [ ] **IssueForm.js** - Issue creation/editing form
- [ ] **IssueFilters.js** - Advanced filtering component
- [ ] **IssueStatusIndicator.js** - Status visualization
- [ ] **IssuePriorityBadge.js** - Priority badge component
- [ ] **IssueTimeline.js** - Issue timeline view
- [ ] **IssueGPSMap.js** - GPS location map integration
- [ ] **IssueReportGenerator.js** - Report generation component
- [ ] **IssueAssignmentModal.js** - Assignment modal
- [ ] **IssueCategorySelector.js** - Category selection component
- [ ] **IssueComments.js** - Comments and communication
- [ ] **IssueAutoCreation.js** - GPS-based auto issue creation
- [ ] **IssueVehicleInfo.js** - Vehicle information display
- [ ] **IssueAttachments.js** - File attachment handling
- [ ] **IssueDashboardStats.js** - Dashboard statistics widgets

### 📂 Services (`fms.frontend/src/services/`)

- [ ] **issueTrackerService.js** - Main API service for CRUD operations
- [ ] **issueTrackerGPSService.js** - GPS integration and monitoring
- [ ] **issueTrackerReportService.js** - Reporting and analytics service

### 📂 Redux (`fms.frontend/src/redux/`)

#### Actions
- [ ] **issueTrackerActions.js** - All Redux actions for issue management

#### Reducers
- [ ] **issueTrackerReducer.js** - Main reducer for issue state management

#### Selectors
- [ ] **issueTrackerSelectors.js** - Memoized selectors for state

#### Types
- [ ] **issueTrackerTypes.js** - Action type constants

### 📂 Hooks (`fms.frontend/src/hooks/`)

- [ ] **useIssueTracker.js** - Custom hook for issue operations
- [ ] **useIssueFilters.js** - Custom hook for filtering logic
- [ ] **useIssueGPS.js** - Custom hook for GPS integration
- [ ] **useIssueReports.js** - Custom hook for reporting
- [ ] **useIssueForm.js** - Custom hook for form management
- [ ] **useIssuePermissions.js** - Custom hook for permission checking

### 📂 Utils (`fms.frontend/src/utils/`)

- [ ] **issueTrackerHelpers.js** - Utility functions
- [ ] **issueTrackerValidation.js** - Form validation logic
- [ ] **issueTrackerConstants.js** - Constants and enums
- [ ] **issueTrackerFormatters.js** - Data formatting utilities

### 📂 Styles (`fms.frontend/src/styles/issueTracker/`)

- [ ] **IssueTracker.scss** - Main component styles
- [ ] **IssueForm.scss** - Form-specific styles
- [ ] **IssueCard.scss** - Card component styles
- [ ] **IssueReports.scss** - Reports page styles
- [ ] **IssueResponsive.scss** - Mobile responsive styles

## Backend Enhancements Required

### 📂 Controllers (Enhancements to existing)

- [ ] **IssueTrackerController.cs** - Add missing endpoints:
  - GET `/api/IssueTracker/vehicle/{vehicleId}` - Get issues by vehicle
  - GET `/api/IssueTracker/reports/export` - Export reports
  - GET `/api/IssueTracker/categories` - Get categories
  - GET `/api/IssueTracker/priorities` - Get priorities
  - GET `/api/IssueTracker/statuses` - Get statuses
  - POST `/api/IssueTracker/gps/auto-create` - Auto-create from GPS
  - GET `/api/IssueTracker/analytics` - Analytics data

### 📂 DTOs (Additional required)

- [ ] **IssueTrackerAnalyticsDTO.cs** - Analytics response model
- [ ] **IssueTrackerExportDTO.cs** - Export data model
- [ ] **IssueTrackerGPSCreateDTO.cs** - GPS auto-creation model
- [ ] **IssueTrackerFilterDTO.cs** - Filtering parameters
- [ ] **IssueTrackerReportDTO.cs** - Report configuration model

### 📂 Commands (Additional required)

- [ ] **CreateIssueFromGPSCommand.cs** - GPS-based issue creation
- [ ] **BulkUpdateIssuesCommand.cs** - Bulk operations
- [ ] **ExportIssuesCommand.cs** - Report export command

### 📂 Queries (Additional required)

- [ ] **GetIssueAnalyticsQuery.cs** - Analytics data query
- [ ] **GetIssuesByVehicleQuery.cs** - Vehicle-specific issues
- [ ] **GetIssueExportDataQuery.cs** - Export data query
- [ ] **GetIssueCategoriesQuery.cs** - Categories reference data
- [ ] **GetIssuePrioritiesQuery.cs** - Priorities reference data
- [ ] **GetIssueStatusesQuery.cs** - Status reference data

## File Creation Priority

### 🚀 Phase 1: Foundation (Week 1)
1. **issueTrackerService.js** - Core API integration
2. **issueTrackerActions.js** - Redux actions
3. **issueTrackerReducer.js** - State management
4. **issueTrackerTypes.js** - Action constants
5. **IssueTrackerPage.js** - Main dashboard
6. **IssueCard.js** - Basic issue display

### 🔧 Phase 2: Core Features (Week 2)
1. **IssueTrackerListPage.js** - List view with DataGrid
2. **IssueTrackerFormPage.js** - Create/Edit functionality
3. **IssueForm.js** - Form component
4. **IssueFilters.js** - Filtering capabilities
5. **useIssueTracker.js** - Custom hook
6. **issueTrackerHelpers.js** - Utility functions

### 📡 Phase 3: GPS Integration (Week 3)
1. **issueTrackerGPSService.js** - GPS service integration
2. **IssueGPSMap.js** - Map component
3. **IssueAutoCreation.js** - Auto-creation from GPS
4. **useIssueGPS.js** - GPS hook
5. **IssueVehicleInfo.js** - Vehicle information

### 📊 Phase 4: Reporting (Week 4)
1. **issueTrackerReportService.js** - Reporting service
2. **IssueTrackerReportsPage.js** - Reports dashboard
3. **IssueReportGenerator.js** - Report generation
4. **useIssueReports.js** - Reporting hook
5. **IssueDashboardStats.js** - Statistics widgets

### 🎨 Phase 5: Polish & Optimization (Week 5)
1. **IssueDetailsPage.js** - Detailed view
2. **IssueTimeline.js** - Timeline component
3. **IssueComments.js** - Communication features
4. **IssueAttachments.js** - File handling
5. **Responsive styles** - Mobile optimization

## Integration Points

### GPS Service Integration
```javascript
// In issueTrackerGPSService.js
import vehicleGPSTrackingService from './vehicleGPSTrackingService';

// Monitor GPS events for automatic issue creation
const monitorGPSEvents = async (vehicleId) => {
  const location = await vehicleGPSTrackingService.getVehicleLocation(vehicleId);
  // Auto-create issues based on GPS data
};
```

### Existing FMS Integration
```javascript
// In useIssueTracker.js
import { useNotification } from '../hooks/useNotification';
import { usePermissions } from '../hooks/usePermissions';

// Integrate with existing notification system
// Use existing permission management
```

## Route Configuration

### Add to app-routes.js
```javascript
// Issue Tracker routes
{
  path: 'issue-tracker',
  element: <IssueTrackerPage />,
},
{
  path: 'issue-tracker/list',
  element: <IssueTrackerListPage />,
},
{
  path: 'issue-tracker/new',
  element: <IssueTrackerFormPage />,
},
{
  path: 'issue-tracker/edit/:id',
  element: <IssueTrackerFormPage />,
},
{
  path: 'issue-tracker/details/:id',
  element: <IssueTrackerDetailsPage />,
},
{
  path: 'issue-tracker/reports',
  element: <IssueTrackerReportsPage />,
}
```

## Navigation Integration

### Add to Navigation menu
```javascript
// In Navigation component
{
  text: 'Issue Tracker',
  icon: 'fa-light fa-exclamation-triangle',
  path: '/issue-tracker',
  items: [
    {
      text: 'Dashboard',
      icon: 'fa-light fa-tachometer-alt',
      path: '/issue-tracker'
    },
    {
      text: 'All Issues',
      icon: 'fa-light fa-list',
      path: '/issue-tracker/list'
    },
    {
      text: 'Create Issue',
      icon: 'fa-light fa-plus',
      path: '/issue-tracker/new'
    },
    {
      text: 'Reports',
      icon: 'fa-light fa-chart-bar',
      path: '/issue-tracker/reports'
    }
  ]
}
```

## Testing Files Required

### Unit Tests
- [ ] **IssueTrackerPage.test.js**
- [ ] **IssueCard.test.js**
- [ ] **issueTrackerService.test.js**
- [ ] **issueTrackerReducer.test.js**
- [ ] **useIssueTracker.test.js**

### Integration Tests
- [ ] **IssueTrackerFlow.test.js** - End-to-end workflows
- [ ] **GPSIntegration.test.js** - GPS service integration
- [ ] **ReportGeneration.test.js** - Report functionality

## Documentation Files

- [ ] **IssueTrackerUserGuide.md** - User documentation
- [ ] **IssueTrackerAPIGuide.md** - API documentation
- [ ] **IssueTrackerGPSGuide.md** - GPS integration guide
- [ ] **IssueTrackerDeploymentGuide.md** - Deployment instructions

## Configuration Files

### Environment Variables
```javascript
// Add to .env files
REACT_APP_ISSUE_TRACKER_GPS_MONITORING=true
REACT_APP_ISSUE_TRACKER_AUTO_CREATE=true
REACT_APP_ISSUE_TRACKER_REPORT_LIMIT=1000
```

### Feature Flags
```javascript
// Add to feature configuration
issueTracker: {
  gpsIntegration: true,
  autoCreation: true,
  advancedReports: true,
  mobileResponsive: true
}
```

This comprehensive file structure provides a complete implementation roadmap for the Issue Tracker frontend module with GPS integration and reporting capabilities. Each file serves a specific purpose in creating a modern, maintainable, and feature-rich issue management system.
