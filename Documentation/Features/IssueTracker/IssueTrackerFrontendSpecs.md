# Issue Tracker Frontend Development Specifications

## Document Information
- **Version**: 1.0
- **Date**: July 26, 2025
- **Author**: FMS Development Team
- **Status**: Development Specification
- **Related Documents**: IssueTrackerController.cs, VehicleGPSTrackingImplementation.md

## Executive Summary

The Issue Tracker Frontend module provides a comprehensive interface for managing fleet-related issues with GPS integration, automated issue creation, and advanced reporting capabilities. This specification outlines the complete frontend implementation including React components, Redux state management, API services, and GPS integration.

## Technical Requirements

### Technology Stack
- **Frontend Framework**: React 18.2.0 with Hooks
- **UI Library**: DevExtreme 23.2.8
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS with `tw-` prefix + SCSS
- **Icons**: FontAwesome (`fa-light fa-icon`)
- **API Communication**: Axios with axiosInstance
- **Real-time**: SignalR integration
- **GPS Integration**: GPS tracking service integration
- **Reporting**: Excel/PDF export capabilities

## Folder Structure

```
fms.frontend/src/
├── pages/
│   └── issueTracker/
│       ├── IssueTrackerPage.js              # Main dashboard page
│       ├── IssueTrackerListPage.js          # Issues list view
│       ├── IssueTrackerFormPage.js          # Create/Edit issue form
│       ├── IssueTrackerDetailsPage.js       # Issue details view
│       ├── IssueTrackerReportsPage.js       # Reports and analytics
│       └── components/
│           ├── IssueCard.js                 # Individual issue card
│           ├── IssueForm.js                 # Issue creation form
│           ├── IssueFilters.js              # Filtering component
│           ├── IssueStatusIndicator.js      # Status visualization
│           ├── IssuePriorityBadge.js        # Priority badge component
│           ├── IssueTimeline.js             # Issue timeline view
│           ├── IssueGPSMap.js               # GPS location map
│           ├── IssueReportGenerator.js      # Report generation
│           ├── IssueAssignmentModal.js      # Assignment modal
│           ├── IssueCategorySelector.js     # Category selector
│           ├── IssueComments.js             # Comments section
│           └── IssueAutoCreation.js         # GPS-based auto creation
│
├── services/
│   ├── issueTrackerService.js               # Main API service
│   ├── issueTrackerGPSService.js           # GPS integration service
│   └── issueTrackerReportService.js        # Reporting service
│
├── redux/
│   ├── actions/
│   │   └── issueTrackerActions.js           # Redux actions
│   ├── reducers/
│   │   └── issueTrackerReducer.js           # Redux reducer
│   ├── selectors/
│   │   └── issueTrackerSelectors.js         # State selectors
│   └── types/
│       └── issueTrackerTypes.js             # Action types
│
├── hooks/
│   ├── useIssueTracker.js                   # Custom hook for issues
│   ├── useIssueFilters.js                   # Custom hook for filtering
│   ├── useIssueGPS.js                       # Custom hook for GPS data
│   └── useIssueReports.js                   # Custom hook for reports
│
├── utils/
│   ├── issueTrackerHelpers.js               # Utility functions
│   ├── issueTrackerValidation.js            # Form validation
│   └── issueTrackerConstants.js             # Constants and enums
│
└── styles/
    └── issueTracker/
        ├── IssueTracker.scss                # Main styles
        ├── IssueForm.scss                   # Form styles
        ├── IssueCard.scss                   # Card styles
        └── IssueReports.scss                # Reports styles
```

## API Endpoints Integration

### Base Endpoints (from IssueTrackerController)
- `GET /api/IssueTracker` - Get all issues
- `GET /api/IssueTracker/{id}` - Get issue by ID
- `POST /api/IssueTracker` - Create new issue
- `PUT /api/IssueTracker/{id}` - Update issue
- `DELETE /api/IssueTracker/{id}` - Delete issue

### Additional Required Endpoints
- `GET /api/IssueTracker/vehicle/{vehicleId}` - Get issues by vehicle
- `GET /api/IssueTracker/reports/export` - Export reports
- `GET /api/IssueTracker/categories` - Get issue categories
- `GET /api/IssueTracker/priorities` - Get priority levels
- `GET /api/IssueTracker/statuses` - Get status options
- `POST /api/IssueTracker/gps/auto-create` - Auto-create from GPS data
- `GET /api/IssueTracker/analytics` - Get analytics data

## Component Specifications

### 1. IssueTrackerPage.js (Main Dashboard)

```jsx
// Main dashboard with overview and quick actions
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, Chart, Popup } from 'devextreme-react';

const IssueTrackerPage = () => {
  // Features:
  // - Overview statistics (total, open, high priority, overdue)
  // - Recent issues list
  // - Priority distribution chart
  // - Status breakdown chart
  // - Quick action buttons
  // - Real-time updates via SignalR
  // - GPS location indicators
  // - Mobile responsive layout
};
```

### 2. IssueTrackerListPage.js (Issues List)

```jsx
// Comprehensive list view with advanced filtering
import React from 'react';
import { DataGrid, FilterRow, Popup } from 'devextreme-react';

const IssueTrackerListPage = () => {
  // Features:
  // - DataGrid with all issues
  // - Advanced filtering (status, priority, category, date range)
  // - Sorting capabilities
  // - Bulk operations (assign, update status, export)
  // - GPS location column with map popup
  // - Vehicle information integration
  // - Inline editing capabilities
  // - Export to Excel/PDF
};
```

### 3. IssueTrackerFormPage.js (Create/Edit Form)

```jsx
// Comprehensive form for issue creation and editing
import React from 'react';
import { Form, TextBox, SelectBox, DateBox, TextArea } from 'devextreme-react';

const IssueTrackerFormPage = () => {
  // Features:
  // - Dynamic form fields based on category
  // - Vehicle selection with GPS location
  // - Auto-population from GPS data
  // - File attachments
  // - Priority and status selection
  // - Assignment to users
  // - Due date scheduling
  // - Related issue linking
  // - Form validation
  // - Draft saving
};
```

### 4. IssueTrackerReportsPage.js (Reports & Analytics)

```jsx
// Advanced reporting and analytics dashboard
import React from 'react';
import { Chart, PivotGrid, DataGrid } from 'devextreme-react';

const IssueTrackerReportsPage = () => {
  // Features:
  // - Pre-defined report templates
  // - Custom report builder
  // - Time-based analytics
  // - Vehicle-specific reports
  // - GPS-based location analytics
  // - Performance metrics
  // - Export capabilities
  // - Scheduled report generation
  // - Interactive charts and graphs
};
```

## Redux State Management

### State Structure

```javascript
// issueTrackerReducer.js
const initialState = {
  // Issues data
  issues: [],
  selectedIssue: null,
  issueDetails: null,

  // Loading states
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,

  // UI states
  showCreateModal: false,
  showEditModal: false,
  showDetailsModal: false,
  showGPSModal: false,

  // Filters and search
  filters: {
    status: null,
    priority: null,
    category: null,
    assignedTo: null,
    vehicle: null,
    dateRange: null,
    searchTerm: ''
  },

  // Pagination
  pagination: {
    currentPage: 1,
    pageSize: 20,
    totalItems: 0
  },

  // Reference data
  categories: [],
  priorities: [],
  statuses: [],
  users: [],
  vehicles: [],

  // GPS integration
  gpsData: {
    vehicleLocations: [],
    isGPSEnabled: false,
    autoCreateSettings: {}
  },

  // Reports
  reports: {
    analytics: null,
    exportData: null,
    isGeneratingReport: false
  },

  // Error handling
  error: null,
  validationErrors: {}
};
```

### Actions

```javascript
// issueTrackerActions.js
export const IssueTrackerActions = {
  // CRUD operations
  FETCH_ISSUES_REQUEST: 'FETCH_ISSUES_REQUEST',
  FETCH_ISSUES_SUCCESS: 'FETCH_ISSUES_SUCCESS',
  FETCH_ISSUES_FAILURE: 'FETCH_ISSUES_FAILURE',

  CREATE_ISSUE_REQUEST: 'CREATE_ISSUE_REQUEST',
  CREATE_ISSUE_SUCCESS: 'CREATE_ISSUE_SUCCESS',
  CREATE_ISSUE_FAILURE: 'CREATE_ISSUE_FAILURE',

  UPDATE_ISSUE_REQUEST: 'UPDATE_ISSUE_REQUEST',
  UPDATE_ISSUE_SUCCESS: 'UPDATE_ISSUE_SUCCESS',
  UPDATE_ISSUE_FAILURE: 'UPDATE_ISSUE_FAILURE',

  DELETE_ISSUE_REQUEST: 'DELETE_ISSUE_REQUEST',
  DELETE_ISSUE_SUCCESS: 'DELETE_ISSUE_SUCCESS',
  DELETE_ISSUE_FAILURE: 'DELETE_ISSUE_FAILURE',

  // GPS integration
  FETCH_GPS_DATA_REQUEST: 'FETCH_GPS_DATA_REQUEST',
  GPS_AUTO_CREATE_ISSUE: 'GPS_AUTO_CREATE_ISSUE',
  UPDATE_GPS_SETTINGS: 'UPDATE_GPS_SETTINGS',

  // UI actions
  SET_SELECTED_ISSUE: 'SET_SELECTED_ISSUE',
  SET_FILTERS: 'SET_FILTERS',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  SET_PAGINATION: 'SET_PAGINATION',

  // Modal actions
  SHOW_CREATE_MODAL: 'SHOW_CREATE_MODAL',
  HIDE_CREATE_MODAL: 'HIDE_CREATE_MODAL',
  SHOW_EDIT_MODAL: 'SHOW_EDIT_MODAL',
  HIDE_EDIT_MODAL: 'HIDE_EDIT_MODAL',

  // Report actions
  GENERATE_REPORT_REQUEST: 'GENERATE_REPORT_REQUEST',
  GENERATE_REPORT_SUCCESS: 'GENERATE_REPORT_SUCCESS',
  EXPORT_REPORT_REQUEST: 'EXPORT_REPORT_REQUEST'
};
```

## Service Layer

### issueTrackerService.js

```javascript
// Main API service for issue tracker operations
import axiosInstance from '../utils/axiosInstance';

class IssueTrackerService {
  // Base URL for issue tracker endpoints
  baseURL = '/issuetracker';

  // CRUD operations
  async getAllIssues(filters = {}, pagination = {}) {
    const params = { ...filters, ...pagination };
    const response = await axiosInstance.get(this.baseURL, { params });
    return response.data;
  }

  async getIssueById(id) {
    const response = await axiosInstance.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  async createIssue(issueData) {
    const response = await axiosInstance.post(this.baseURL, issueData);
    return response.data;
  }

  async updateIssue(id, issueData) {
    const response = await axiosInstance.put(`${this.baseURL}/${id}`, issueData);
    return response.data;
  }

  async deleteIssue(id) {
    const response = await axiosInstance.delete(`${this.baseURL}/${id}`);
    return response.data;
  }

  // Additional endpoints
  async getIssuesByVehicle(vehicleId) {
    const response = await axiosInstance.get(`${this.baseURL}/vehicle/${vehicleId}`);
    return response.data;
  }

  async getCategories() {
    const response = await axiosInstance.get(`${this.baseURL}/categories`);
    return response.data;
  }

  async getPriorities() {
    const response = await axiosInstance.get(`${this.baseURL}/priorities`);
    return response.data;
  }

  async getStatuses() {
    const response = await axiosInstance.get(`${this.baseURL}/statuses`);
    return response.data;
  }

  async getAnalytics(dateRange = {}) {
    const response = await axiosInstance.get(`${this.baseURL}/analytics`, {
      params: dateRange
    });
    return response.data;
  }

  async exportReport(format, filters = {}) {
    const response = await axiosInstance.get(`${this.baseURL}/reports/export`, {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response.data;
  }
}

export default new IssueTrackerService();
```

### issueTrackerGPSService.js

```javascript
// GPS integration service for issue tracker
import axiosInstance from '../utils/axiosInstance';
import vehicleGPSTrackingService from './vehicleGPSTrackingService';

class IssueTrackerGPSService {
  baseURL = '/issuetracker/gps';

  // Auto-create issues based on GPS data
  async autoCreateIssueFromGPS(gpsData, issueType) {
    const issueData = this.mapGPSDataToIssue(gpsData, issueType);
    const response = await axiosInstance.post(`${this.baseURL}/auto-create`, issueData);
    return response.data;
  }

  // Monitor GPS events for automatic issue creation
  async monitorGPSEvents(vehicleId) {
    const gpsEvents = [
      'vehicle_offline',
      'geofence_violation',
      'speed_violation',
      'panic_button',
      'engine_fault',
      'maintenance_due'
    ];

    const vehicleLocation = await vehicleGPSTrackingService.getVehicleLocation(vehicleId);

    if (!vehicleLocation.isSuccess) {
      return this.createConnectivityIssue(vehicleId);
    }

    return this.analyzeGPSData(vehicleLocation.data, gpsEvents);
  }

  // Map GPS data to issue format
  mapGPSDataToIssue(gpsData, issueType) {
    const issueTypeMapping = {
      'vehicle_offline': {
        category: 1, // Connectivity
        priority: 2, // High
        title: `Vehicle Offline - ${gpsData.vehicleName}`,
        description: `Vehicle has been offline since ${gpsData.lastSeen}. Location: ${gpsData.lastKnownLocation}`
      },
      'geofence_violation': {
        category: 2, // Security
        priority: 3, // Critical
        title: `Geofence Violation - ${gpsData.vehicleName}`,
        description: `Vehicle exceeded authorized area at ${gpsData.location}. Time: ${gpsData.timestamp}`
      },
      'speed_violation': {
        category: 3, // Safety
        priority: 2, // High
        title: `Speed Violation - ${gpsData.vehicleName}`,
        description: `Vehicle exceeded speed limit (${gpsData.speedLimit}km/h) - Current: ${gpsData.currentSpeed}km/h`
      },
      'maintenance_due': {
        category: 4, // Maintenance
        priority: 1, // Medium
        title: `Maintenance Due - ${gpsData.vehicleName}`,
        description: `Vehicle odometer: ${gpsData.odometer}km. Maintenance scheduled at ${gpsData.maintenanceThreshold}km`
      }
    };

    const template = issueTypeMapping[issueType];

    return {
      ...template,
      vehicle: gpsData.vehicleId,
      openDate: new Date().toISOString(),
      status: 1, // Open
      openby: 'system_gps',
      gpsData: {
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        timestamp: gpsData.timestamp,
        speed: gpsData.speed,
        heading: gpsData.heading
      }
    };
  }

  // Analyze GPS data for potential issues
  async analyzeGPSData(gpsData, monitoredEvents) {
    const detectedIssues = [];

    // Check for connectivity issues
    if (!gpsData.isOnline) {
      detectedIssues.push({
        type: 'vehicle_offline',
        severity: 'high',
        data: gpsData
      });
    }

    // Check for speed violations (example threshold: 120 km/h)
    if (gpsData.speed > 120) {
      detectedIssues.push({
        type: 'speed_violation',
        severity: 'high',
        data: { ...gpsData, speedLimit: 120 }
      });
    }

    // Check maintenance due based on odometer
    const maintenanceThreshold = await this.getMaintenanceThreshold(gpsData.vehicleId);
    if (gpsData.odometer >= maintenanceThreshold) {
      detectedIssues.push({
        type: 'maintenance_due',
        severity: 'medium',
        data: { ...gpsData, maintenanceThreshold }
      });
    }

    return detectedIssues;
  }

  async getMaintenanceThreshold(vehicleId) {
    // Get vehicle maintenance schedule
    const response = await axiosInstance.get(`/vehicles/${vehicleId}/maintenance-schedule`);
    return response.data.nextMaintenanceKm || 10000; // Default 10,000 km
  }

  // Create connectivity issue when GPS is offline
  createConnectivityIssue(vehicleId) {
    return {
      type: 'vehicle_offline',
      severity: 'critical',
      data: {
        vehicleId,
        lastSeen: new Date().toISOString(),
        status: 'offline'
      }
    };
  }
}

export default new IssueTrackerGPSService();
```

## Component Implementation Examples

### IssueCard.js Component

```jsx
import React from 'react';
import { Card } from 'devextreme-react/card';
import { Badge, Button } from 'devextreme-react';

const IssueCard = ({ issue, onView, onEdit, onAssign }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      1: 'tw-bg-green-100 tw-text-green-800',
      2: 'tw-bg-yellow-100 tw-text-yellow-800',
      3: 'tw-bg-red-100 tw-text-red-800'
    };
    return colors[priority] || 'tw-bg-gray-100 tw-text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      1: 'tw-bg-blue-100 tw-text-blue-800', // Open
      2: 'tw-bg-orange-100 tw-text-orange-800', // In Progress
      3: 'tw-bg-green-100 tw-text-green-800', // Resolved
      4: 'tw-bg-gray-100 tw-text-gray-800' // Closed
    };
    return colors[status] || 'tw-bg-gray-100 tw-text-gray-800';
  };

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-4 tw-mb-4 tw-border tw-border-gray-200">
      <div className="tw-flex tw-justify-between tw-items-start tw-mb-3">
        <div className="tw-flex-1">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-1">
            {issue.problemTitle}
          </h3>
          <p className="tw-text-sm tw-text-gray-600 tw-mb-2">
            {issue.problemDescription?.substring(0, 100)}...
          </p>
        </div>
        <div className="tw-flex tw-flex-col tw-gap-1 tw-ml-4">
          <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${getPriorityColor(issue.priority)}`}>
            {issue.priorityName}
          </span>
          <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${getStatusColor(issue.status)}`}>
            {issue.statusName}
          </span>
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm tw-text-gray-600 tw-mb-3">
        <div>
          <i className="fa-light fa-car tw-mr-2"></i>
          <span>{issue.vehicleName}</span>
        </div>
        <div>
          <i className="fa-light fa-user tw-mr-2"></i>
          <span>{issue.assignToName || 'Unassigned'}</span>
        </div>
        <div>
          <i className="fa-light fa-calendar tw-mr-2"></i>
          <span>{new Date(issue.openDate).toLocaleDateString()}</span>
        </div>
        {issue.gpsData && (
          <div>
            <i className="fa-light fa-location-dot tw-mr-2"></i>
            <span>GPS Available</span>
          </div>
        )}
      </div>

      <div className="tw-flex tw-justify-between tw-items-center tw-pt-3 tw-border-t tw-border-gray-200">
        <div className="tw-flex tw-gap-2">
          <Button
            text="View"
            type="normal"
            stylingMode="text"
            onClick={() => onView(issue.id)}
            className="tw-text-blue-600 hover:tw-text-blue-800"
          />
          <Button
            text="Edit"
            type="normal"
            stylingMode="text"
            onClick={() => onEdit(issue.id)}
            className="tw-text-green-600 hover:tw-text-green-800"
          />
        </div>

        {!issue.assignTo && (
          <Button
            text="Assign"
            type="default"
            stylingMode="contained"
            onClick={() => onAssign(issue.id)}
            className="tw-bg-blue-600 tw-text-white hover:tw-bg-blue-700"
          />
        )}
      </div>
    </div>
  );
};

export default IssueCard;
```

### IssueGPSMap.js Component

```jsx
import React, { useEffect, useState } from 'react';
import { Map } from 'devextreme-react/map';
import { Popup } from 'devextreme-react/popup';
import vehicleGPSTrackingService from '../../services/vehicleGPSTrackingService';

const IssueGPSMap = ({ issue, visible, onClose }) => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && issue.vehicle) {
      loadGPSData();
    }
  }, [visible, issue.vehicle]);

  const loadGPSData = async () => {
    setLoading(true);
    try {
      const response = await vehicleGPSTrackingService.getVehicleLocation(issue.vehicle);
      if (response.isSuccess) {
        setMapData({
          center: [response.data.latitude, response.data.longitude],
          markers: [{
            location: [response.data.latitude, response.data.longitude],
            tooltip: {
              text: `${issue.problemTitle}\nVehicle: ${issue.vehicleName}\nSpeed: ${response.data.speed} km/h\nStatus: ${response.data.isOnline ? 'Online' : 'Offline'}`
            }
          }]
        });
      }
    } catch (error) {
      console.error('Error loading GPS data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      title="Issue GPS Location"
      width="80%"
      height="80%"
      showCloseButton={true}
    >
      <div className="tw-h-full tw-w-full">
        {loading ? (
          <div className="tw-flex tw-justify-center tw-items-center tw-h-full">
            <div className="tw-text-center">
              <i className="fa-light fa-spinner fa-spin tw-text-4xl tw-text-blue-600 tw-mb-4"></i>
              <p className="tw-text-gray-600">Loading GPS data...</p>
            </div>
          </div>
        ) : mapData ? (
          <Map
            provider="google"
            type="roadmap"
            zoom={15}
            center={mapData.center}
            markers={mapData.markers}
            height="100%"
            width="100%"
          />
        ) : (
          <div className="tw-flex tw-justify-center tw-items-center tw-h-full">
            <div className="tw-text-center">
              <i className="fa-light fa-location-slash tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
              <p className="tw-text-gray-600">GPS data not available for this issue</p>
            </div>
          </div>
        )}
      </div>
    </Popup>
  );
};

export default IssueGPSMap;
```

## GPS Integration Features

### 1. Automatic Issue Creation
- Monitor GPS events (offline, geofence violations, speed violations)
- Auto-create issues based on predefined rules
- Vehicle maintenance alerts based on odometer readings
- Engine fault code detection

### 2. Location-Based Features
- Display issue location on map
- Track vehicle route when issue occurred
- Geofence violation detection
- Proximity-based issue assignment

### 3. Real-time Monitoring
- Live vehicle status in issue dashboard
- Real-time location updates
- Alert notifications for critical issues
- GPS connectivity status monitoring

## Reporting Features

### 1. Standard Reports
- Issues by status/priority
- Vehicle-specific issue history
- User assignment reports
- Time-based analytics
- GPS-related issues summary

### 2. Custom Report Builder
- Drag-and-drop report designer
- Custom date ranges
- Multiple export formats (Excel, PDF, CSV)
- Scheduled report generation
- Email delivery of reports

### 3. Analytics Dashboard
- Issue trends over time
- Performance metrics
- GPS coverage analytics
- Resolution time statistics
- Cost impact analysis

## Mobile Responsiveness

### Design Principles
- **Mobile-first approach** for all components
- **Height-based navigation** (not width-based)
- **Touch-friendly interfaces** with adequate spacing
- **Responsive data grids** with horizontal scrolling
- **Collapsible sidebars** using height transitions
- **Swipe gestures** for card interactions

### Responsive Breakpoints
```scss
// Tailwind responsive classes
.tw-mobile-responsive {
  @apply tw-block lg:tw-hidden; // Mobile only
}

.tw-desktop-responsive {
  @apply tw-hidden lg:tw-block; // Desktop only
}

.tw-tablet-responsive {
  @apply tw-hidden md:tw-block lg:tw-hidden; // Tablet only
}
```

## Error Handling & Validation

### Form Validation
```javascript
// issueTrackerValidation.js
export const validateIssueForm = (formData) => {
  const errors = {};

  if (!formData.problemTitle?.trim()) {
    errors.problemTitle = 'Issue title is required';
  }

  if (!formData.problemDescription?.trim()) {
    errors.problemDescription = 'Issue description is required';
  }

  if (!formData.vehicle) {
    errors.vehicle = 'Vehicle selection is required';
  }

  if (!formData.priority) {
    errors.priority = 'Priority level is required';
  }

  if (!formData.category) {
    errors.category = 'Issue category is required';
  }

  if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
    errors.dueDate = 'Due date cannot be in the past';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

### API Error Handling
```javascript
// Error interceptor in service
const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return { error: 'Invalid request data', details: data.errors };
      case 401:
        return { error: 'Authentication required' };
      case 403:
        return { error: 'Permission denied' };
      case 404:
        return { error: 'Issue not found' };
      case 500:
        return { error: 'Server error occurred' };
      default:
        return { error: 'An unexpected error occurred' };
    }
  } else if (error.request) {
    return { error: 'Network connection error' };
  } else {
    return { error: 'Request configuration error' };
  }
};
```

## Performance Optimization

### 1. Data Loading Strategies
- **Lazy loading** for large issue lists
- **Virtual scrolling** for performance
- **Pagination** with configurable page sizes
- **Caching** of reference data (categories, users)
- **Debounced search** to minimize API calls

### 2. Component Optimization
- **React.memo** for pure components
- **useMemo/useCallback** for expensive operations
- **Code splitting** for route-based loading
- **Image optimization** for attachments

### 3. State Management
- **Normalized state structure** for better performance
- **Selective updates** to prevent unnecessary re-renders
- **Memoized selectors** for computed values

## Security Considerations

### 1. Data Protection
- **Input sanitization** for all form fields
- **XSS prevention** in dynamic content
- **CSRF protection** for state-changing operations
- **File upload validation** for attachments

### 2. Access Control
- **Role-based visibility** for sensitive issues
- **Permission checks** before operations
- **Audit logging** for all actions
- **Secure GPS data handling**

## Testing Strategy

### 1. Unit Testing
- Component rendering tests
- Service method tests
- Validation function tests
- Redux action/reducer tests

### 2. Integration Testing
- API integration tests
- GPS service integration
- Report generation tests
- Real-time update tests

### 3. E2E Testing
- Complete user workflows
- Mobile responsiveness
- Cross-browser compatibility
- Performance benchmarks

## Implementation Timeline

### Phase 1: Core Foundation (2 weeks)
- Basic CRUD operations
- Redux state management
- Main page components
- API service integration

### Phase 2: Advanced Features (3 weeks)
- GPS integration
- Real-time updates
- Advanced filtering
- Mobile responsiveness

### Phase 3: Reporting & Analytics (2 weeks)
- Report generation
- Analytics dashboard
- Export capabilities
- Custom report builder

### Phase 4: Polish & Testing (1 week)
- Performance optimization
- Testing suite completion
- Documentation finalization
- Production deployment

## Dependencies

### NPM Packages Required
```json
{
  "devextreme": "^23.2.8",
  "devextreme-react": "^23.2.8",
  "react-redux": "^8.1.0",
  "@reduxjs/toolkit": "^1.9.5",
  "axios": "^1.4.0",
  "react-router-dom": "^6.14.0",
  "date-fns": "^2.30.0",
  "react-hook-form": "^7.45.0",
  "yup": "^1.2.0",
  "lodash": "^4.17.21",
  "file-saver": "^2.0.5",
  "react-virtualized": "^9.22.3"
}
```

## Conclusion

This specification provides a comprehensive foundation for implementing a modern, GPS-integrated Issue Tracker frontend module. The modular architecture ensures maintainability, while the integration with existing FMS patterns ensures consistency across the application. The inclusion of mobile responsiveness, real-time updates, and advanced reporting capabilities makes this a production-ready solution for fleet management operations.
