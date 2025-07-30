import * as types from '../types/issueTrackerTypes';

/**
 * Issue Tracker Redux Reducer
 * Manages all state for the Issue Tracker module
 */

const initialState = {
  // Issues data
  issues: [],
  currentIssue: null,
  vehicleIssues: {},
  totalCount: 0,

  // Reference data
  categories: [],
  priorities: [],
  statuses: [],

  // Analytics data
  analytics: null,
  dashboardStats: null,

  // UI state
  filters: {
    status: '',
    priority: '',
    category: '',
    vehicleId: '',
    assignedTo: '',
    dateFrom: null,
    dateTo: null,
    searchText: ''
  },
  selectedIssues: [],

  // Form state
  formData: {},
  formErrors: {},
  isFormDirty: false,

  // Loading states
  loading: {
    issues: false,
    currentIssue: false,
    categories: false,
    priorities: false,
    statuses: false,
    analytics: false,
    dashboardStats: false,
    creating: false,
    updating: false,
    deleting: false,
    bulkOperations: false,
    exporting: false
  },

  // Error handling
  error: null,
  operationErrors: {},

  // Success messages
  successMessage: null,

  // Export state
  exportData: null,

  // Real-time updates
  lastUpdate: null,
  notifications: []
};

const issueTrackerReducer = (state = initialState, action) => {
  switch (action.type) {

    // =======================================================================
    // CRUD Operations
    // =======================================================================

    case types.FETCH_ISSUES_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, issues: true },
        error: null
      };

    case types.FETCH_ISSUES_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, issues: false },
        issues: action.payload.data || action.payload,
        totalCount: action.payload.totalCount || action.payload.length,
        error: null,
        lastUpdate: new Date().toISOString()
      };

    case types.FETCH_ISSUES_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, issues: false },
        error: action.payload,
        operationErrors: { ...state.operationErrors, fetchIssues: action.payload }
      };

    case types.FETCH_ISSUE_BY_ID_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, currentIssue: true },
        error: null
      };

    case types.FETCH_ISSUE_BY_ID_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, currentIssue: false },
        currentIssue: action.payload.data || action.payload,
        error: null
      };

    case types.FETCH_ISSUE_BY_ID_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, currentIssue: false },
        error: action.payload,
        operationErrors: { ...state.operationErrors, fetchCurrentIssue: action.payload }
      };

    case types.CREATE_ISSUE_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, creating: true },
        error: null
      };

    case types.CREATE_ISSUE_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, creating: false },
        issues: [action.payload.data || action.payload, ...state.issues],
        currentIssue: action.payload.data || action.payload,
        successMessage: 'Issue created successfully',
        error: null,
        formData: {},
        formErrors: {},
        isFormDirty: false
      };

    case types.CREATE_ISSUE_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, creating: false },
        error: action.payload,
        operationErrors: { ...state.operationErrors, createIssue: action.payload }
      };

    case types.UPDATE_ISSUE_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, updating: true },
        error: null
      };

    case types.UPDATE_ISSUE_SUCCESS:
      const updatedIssue = action.payload.data || action.payload;
      return {
        ...state,
        loading: { ...state.loading, updating: false },
        issues: state.issues.map(issue =>
          issue.id === updatedIssue.id ? updatedIssue : issue
        ),
        currentIssue: state.currentIssue?.id === updatedIssue.id ? updatedIssue : state.currentIssue,
        successMessage: 'Issue updated successfully',
        error: null,
        formData: {},
        formErrors: {},
        isFormDirty: false
      };

    case types.UPDATE_ISSUE_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, updating: false },
        error: action.payload,
        operationErrors: { ...state.operationErrors, updateIssue: action.payload }
      };

    case types.DELETE_ISSUE_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, deleting: true },
        error: null
      };

    case types.DELETE_ISSUE_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, deleting: false },
        issues: state.issues.filter(issue => issue.id !== action.payload.id),
        currentIssue: state.currentIssue?.id === action.payload.id ? null : state.currentIssue,
        successMessage: 'Issue deleted successfully',
        error: null
      };

    case types.DELETE_ISSUE_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, deleting: false },
        error: action.payload,
        operationErrors: { ...state.operationErrors, deleteIssue: action.payload }
      };

    // =======================================================================
    // Vehicle-specific Issues
    // =======================================================================

    case types.FETCH_ISSUES_BY_VEHICLE_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, issues: true },
        error: null
      };

    case types.FETCH_ISSUES_BY_VEHICLE_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, issues: false },
        vehicleIssues: {
          ...state.vehicleIssues,
          [action.payload.vehicleId]: action.payload.issues.data || action.payload.issues
        },
        error: null
      };

    case types.FETCH_ISSUES_BY_VEHICLE_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, issues: false },
        error: action.payload,
        operationErrors: { ...state.operationErrors, fetchVehicleIssues: action.payload }
      };

    // =======================================================================
    // Reference Data
    // =======================================================================

    case types.FETCH_ISSUE_CATEGORIES_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, categories: true }
      };

    case types.FETCH_ISSUE_CATEGORIES_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, categories: false },
        categories: action.payload.data || action.payload,
        error: null
      };

    case types.FETCH_ISSUE_CATEGORIES_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, categories: false },
        operationErrors: { ...state.operationErrors, fetchCategories: action.payload }
      };

    case types.FETCH_ISSUE_PRIORITIES_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, priorities: true }
      };

    case types.FETCH_ISSUE_PRIORITIES_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, priorities: false },
        priorities: action.payload.data || action.payload,
        error: null
      };

    case types.FETCH_ISSUE_PRIORITIES_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, priorities: false },
        operationErrors: { ...state.operationErrors, fetchPriorities: action.payload }
      };

    case types.FETCH_ISSUE_STATUSES_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, statuses: true }
      };

    case types.FETCH_ISSUE_STATUSES_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, statuses: false },
        statuses: action.payload.data || action.payload,
        error: null
      };

    case types.FETCH_ISSUE_STATUSES_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, statuses: false },
        operationErrors: { ...state.operationErrors, fetchStatuses: action.payload }
      };

    // =======================================================================
    // Analytics
    // =======================================================================

    case types.FETCH_ISSUE_ANALYTICS_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, analytics: true }
      };

    case types.FETCH_ISSUE_ANALYTICS_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, analytics: false },
        analytics: action.payload.data || action.payload,
        error: null
      };

    case types.FETCH_ISSUE_ANALYTICS_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, analytics: false },
        operationErrors: { ...state.operationErrors, fetchAnalytics: action.payload }
      };

    case types.FETCH_DASHBOARD_STATS_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, dashboardStats: true }
      };

    case types.FETCH_DASHBOARD_STATS_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, dashboardStats: false },
        dashboardStats: action.payload.data || action.payload,
        error: null
      };

    case types.FETCH_DASHBOARD_STATS_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, dashboardStats: false },
        operationErrors: { ...state.operationErrors, fetchDashboardStats: action.payload }
      };

    // =======================================================================
    // Export Operations
    // =======================================================================

    case types.EXPORT_ISSUE_REPORT_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, exporting: true },
        error: null
      };

    case types.EXPORT_ISSUE_REPORT_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, exporting: false },
        exportData: action.payload,
        successMessage: 'Report exported successfully',
        error: null
      };

    case types.EXPORT_ISSUE_REPORT_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, exporting: false },
        error: action.payload,
        operationErrors: { ...state.operationErrors, exportReport: action.payload }
      };

    // =======================================================================
    // Bulk Operations
    // =======================================================================

    case types.BULK_ASSIGN_ISSUES_REQUEST:
    case types.BULK_UPDATE_STATUS_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, bulkOperations: true },
        error: null
      };

    case types.BULK_ASSIGN_ISSUES_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, bulkOperations: false },
        successMessage: 'Issues assigned successfully',
        selectedIssues: [],
        error: null
      };

    case types.BULK_UPDATE_STATUS_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, bulkOperations: false },
        successMessage: 'Issue statuses updated successfully',
        selectedIssues: [],
        error: null
      };

    case types.BULK_ASSIGN_ISSUES_FAILURE:
    case types.BULK_UPDATE_STATUS_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, bulkOperations: false },
        error: action.payload,
        operationErrors: { ...state.operationErrors, bulkOperations: action.payload }
      };

    // =======================================================================
    // UI State Management
    // =======================================================================

    case types.SET_CURRENT_ISSUE:
      return {
        ...state,
        currentIssue: action.payload
      };

    case types.CLEAR_CURRENT_ISSUE:
      return {
        ...state,
        currentIssue: null
      };

    case types.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };

    case types.CLEAR_FILTERS:
      return {
        ...state,
        filters: initialState.filters
      };

    case types.SET_LOADING_STATE:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.operation]: action.payload.isLoading
        }
      };

    case types.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        operationErrors: {},
        successMessage: null
      };

    case types.SET_SELECTED_ISSUES:
      return {
        ...state,
        selectedIssues: action.payload
      };

    case types.CLEAR_SELECTED_ISSUES:
      return {
        ...state,
        selectedIssues: []
      };

    // =======================================================================
    // Form State Management
    // =======================================================================

    case types.SET_FORM_DATA:
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
        isFormDirty: true
      };

    case types.CLEAR_FORM_DATA:
      return {
        ...state,
        formData: {},
        isFormDirty: false
      };

    case types.SET_FORM_ERRORS:
      return {
        ...state,
        formErrors: action.payload
      };

    case types.CLEAR_FORM_ERRORS:
      return {
        ...state,
        formErrors: {}
      };

    case types.SET_FORM_DIRTY:
      return {
        ...state,
        isFormDirty: action.payload
      };

    // =======================================================================
    // Real-time Notifications (SignalR)
    // =======================================================================

    case types.ISSUE_CREATED_NOTIFICATION:
      return {
        ...state,
        issues: [action.payload, ...state.issues],
        notifications: [...state.notifications, {
          type: 'created',
          issue: action.payload,
          timestamp: new Date().toISOString()
        }],
        lastUpdate: new Date().toISOString()
      };

    case types.ISSUE_UPDATED_NOTIFICATION:
      return {
        ...state,
        issues: state.issues.map(issue =>
          issue.id === action.payload.id ? action.payload : issue
        ),
        currentIssue: state.currentIssue?.id === action.payload.id ? action.payload : state.currentIssue,
        notifications: [...state.notifications, {
          type: 'updated',
          issue: action.payload,
          timestamp: new Date().toISOString()
        }],
        lastUpdate: new Date().toISOString()
      };

    case types.ISSUE_DELETED_NOTIFICATION:
      return {
        ...state,
        issues: state.issues.filter(issue => issue.id !== action.payload),
        currentIssue: state.currentIssue?.id === action.payload ? null : state.currentIssue,
        notifications: [...state.notifications, {
          type: 'deleted',
          issueId: action.payload,
          timestamp: new Date().toISOString()
        }],
        lastUpdate: new Date().toISOString()
      };

    case types.GPS_ISSUE_DETECTED_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, {
          type: 'gps_detected',
          data: action.payload,
          timestamp: new Date().toISOString()
        }],
        lastUpdate: new Date().toISOString()
      };

    default:
      return state;
  }
};

export default issueTrackerReducer;
