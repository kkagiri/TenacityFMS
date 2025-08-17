import issueTrackerService from '../../services/issueTrackerService';
import * as types from '../types/issueTrackerTypes';

/**
 * Issue Tracker Redux Actions
 * All action creators for the Issue Tracker module
 */

// =============================================================================
// CRUD Actions
// =============================================================================

/**
 * Fetch all issues with optional filtering
 */
export const fetchIssues = (filters = {}) => async (dispatch) => {
  dispatch({ type: types.FETCH_ISSUES_REQUEST });
  try {
    const response = await issueTrackerService.getIssues(filters);
    dispatch({
      type: types.FETCH_ISSUES_SUCCESS,
      payload: response
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.FETCH_ISSUES_FAILURE,
      payload: error.message
    });
    throw error;
  }
};

/**
 * Fetch issue by ID
 */
export const fetchIssueById = (id) => async (dispatch) => {
  dispatch({ type: types.FETCH_ISSUE_BY_ID_REQUEST });
  try {
    const response = await issueTrackerService.getIssueById(id);
    dispatch({
      type: types.FETCH_ISSUE_BY_ID_SUCCESS,
      payload: response
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.FETCH_ISSUE_BY_ID_FAILURE,
      payload: error.message
    });
    throw error;
  }
};

/**
 * Create new issue
 */
export const createIssue = (issueData) => async (dispatch) => {
  dispatch({ type: types.CREATE_ISSUE_REQUEST });
  try {
    const response = await issueTrackerService.createIssue(issueData);
    dispatch({
      type: types.CREATE_ISSUE_SUCCESS,
      payload: response
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.CREATE_ISSUE_FAILURE,
      payload: error.message
    });
    throw error;
  }
};

/**
 * Update existing issue
 */
export const updateIssue = (id, issueData) => async (dispatch) => {
  dispatch({ type: types.UPDATE_ISSUE_REQUEST });
  try {
    const response = await issueTrackerService.updateIssue(id, issueData);
    dispatch({
      type: types.UPDATE_ISSUE_SUCCESS,
      payload: response
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.UPDATE_ISSUE_FAILURE,
      payload: error.message
    });
    throw error;
  }
};

/**
 * Delete issue
 */
export const deleteIssue = (id) => async (dispatch) => {
  dispatch({ type: types.DELETE_ISSUE_REQUEST });
  try {
    const response = await issueTrackerService.deleteIssue(id);
    dispatch({
      type: types.DELETE_ISSUE_SUCCESS,
      payload: { id, response }
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.DELETE_ISSUE_FAILURE,
      payload: error.message
    });
    throw error;
  }
};

// =============================================================================
// Vehicle-specific Actions
// =============================================================================

/**
 * Fetch issues by vehicle
 */
export const fetchIssuesByVehicle = (vehicleId, filters = {}) => async (dispatch) => {
  dispatch({ type: types.FETCH_ISSUES_BY_VEHICLE_REQUEST });
  try {
    const response = await issueTrackerService.getIssuesByVehicle(vehicleId, filters);
    dispatch({
      type: types.FETCH_ISSUES_BY_VEHICLE_SUCCESS,
      payload: { vehicleId, issues: response }
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.FETCH_ISSUES_BY_VEHICLE_FAILURE,
      payload: error.message
    });
    throw error;
  }
};

// =============================================================================
// Reference Data Actions
// =============================================================================

/**
 * Fetch issue categories
 */
export const fetchIssueCategories = () => async (dispatch) => {
  dispatch({ type: types.FETCH_ISSUE_CATEGORIES_REQUEST });
  try {
    const response = await issueTrackerService.getIssueCategories();
    dispatch({
      type: types.FETCH_ISSUE_CATEGORIES_SUCCESS,
      payload: response
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.FETCH_ISSUE_CATEGORIES_FAILURE,
      payload: error.message
    });
    throw error;
  }
};

/**
 * Fetch issue priorities
 */
export const fetchIssuePriorities = () => async (dispatch) => {
  dispatch({ type: types.FETCH_ISSUE_PRIORITIES_REQUEST });
  try {
    const response = await issueTrackerService.getIssuePriorities();
    dispatch({
      type: types.FETCH_ISSUE_PRIORITIES_SUCCESS,
      payload: response
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.FETCH_ISSUE_PRIORITIES_FAILURE,
      payload: error.message
    });
    throw error;
  }
};

/**
 * Fetch issue statuses
 */
export const fetchIssueStatuses = () => async (dispatch) => {
  dispatch({ type: types.FETCH_ISSUE_STATUSES_REQUEST });
  try {
    const response = await issueTrackerService.getIssueStatuses();
    dispatch({
      type: types.FETCH_ISSUE_STATUSES_SUCCESS,
      payload: response
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.FETCH_ISSUE_STATUSES_FAILURE,
      payload: error.message
    });
    throw error;
  }
};

// =============================================================================
// Analytics Actions
// =============================================================================

/**
 * Fetch issue analytics
 */
export const fetchIssueAnalytics = (filters = {}) => async (dispatch) => {
  dispatch({ type: types.FETCH_ISSUE_ANALYTICS_REQUEST });
  try {
    const response = await issueTrackerService.getIssueAnalytics(filters);
    dispatch({
      type: types.FETCH_ISSUE_ANALYTICS_SUCCESS,
      payload: response
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.FETCH_ISSUE_ANALYTICS_FAILURE,
      payload: error.message
    });
    throw error;
  }
};

/**
 * Export issue report
 */
export const exportIssueReport = (exportParams) => async (dispatch) => {
  dispatch({ type: types.EXPORT_ISSUE_REPORT_REQUEST });
  try {
    const response = await issueTrackerService.exportIssueReport(exportParams);
    dispatch({
      type: types.EXPORT_ISSUE_REPORT_SUCCESS,
      payload: response
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.EXPORT_ISSUE_REPORT_FAILURE,
      payload: error.message
    });
    throw error;
  }
};

// =============================================================================
// Bulk Operations
// =============================================================================

/**
 * Bulk assign issues
 */
export const bulkAssignIssues = (bulkData) => async (dispatch) => {
  dispatch({ type: types.BULK_ASSIGN_ISSUES_REQUEST });
  try {
    const response = await issueTrackerService.bulkAssignIssues(bulkData);
    dispatch({
      type: types.BULK_ASSIGN_ISSUES_SUCCESS,
      payload: response
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.BULK_ASSIGN_ISSUES_FAILURE,
      payload: error.message
    });
    throw error;
  }
};

/**
 * Bulk update status
 */
export const bulkUpdateStatus = (bulkData) => async (dispatch) => {
  dispatch({ type: types.BULK_UPDATE_STATUS_REQUEST });
  try {
    const response = await issueTrackerService.bulkUpdateStatus(bulkData);
    dispatch({
      type: types.BULK_UPDATE_STATUS_SUCCESS,
      payload: response
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.BULK_UPDATE_STATUS_FAILURE,
      payload: error.message
    });
    throw error;
  }
};

// =============================================================================
// UI State Actions
// =============================================================================

/**
 * Set current issue
 */
export const setCurrentIssue = (issue) => ({
  type: types.SET_CURRENT_ISSUE,
  payload: issue
});

/**
 * Clear current issue
 */
export const clearCurrentIssue = () => ({
  type: types.CLEAR_CURRENT_ISSUE
});

/**
 * Set filters
 */
export const setFilters = (filters) => ({
  type: types.SET_FILTERS,
  payload: filters
});

/**
 * Clear filters
 */
export const clearFilters = () => ({
  type: types.CLEAR_FILTERS
});

/**
 * Set loading state
 */
export const setLoadingState = (operation, isLoading) => ({
  type: types.SET_LOADING_STATE,
  payload: { operation, isLoading }
});

/**
 * Clear error
 */
export const clearError = () => ({
  type: types.CLEAR_ERROR
});

/**
 * Set selected issues
 */
export const setSelectedIssues = (selectedIssues) => ({
  type: types.SET_SELECTED_ISSUES,
  payload: selectedIssues
});

/**
 * Clear selected issues
 */
export const clearSelectedIssues = () => ({
  type: types.CLEAR_SELECTED_ISSUES
});

// =============================================================================
// Form State Actions
// =============================================================================

/**
 * Set form data
 */
export const setFormData = (formData) => ({
  type: types.SET_FORM_DATA,
  payload: formData
});

/**
 * Clear form data
 */
export const clearFormData = () => ({
  type: types.CLEAR_FORM_DATA
});

/**
 * Set form errors
 */
export const setFormErrors = (errors) => ({
  type: types.SET_FORM_ERRORS,
  payload: errors
});

/**
 * Clear form errors
 */
export const clearFormErrors = () => ({
  type: types.CLEAR_FORM_ERRORS
});

/**
 * Set form dirty state
 */
export const setFormDirty = (isDirty) => ({
  type: types.SET_FORM_DIRTY,
  payload: isDirty
});

// =============================================================================
// Dashboard Actions
// =============================================================================

/**
 * Fetch dashboard statistics
 */
export const fetchDashboardStats = () => async (dispatch) => {
  dispatch({ type: types.FETCH_DASHBOARD_STATS_REQUEST });
  try {
    // This will call the analytics endpoint with dashboard-specific filters
    const response = await issueTrackerService.getIssueAnalytics({ dashboard: true });
    dispatch({
      type: types.FETCH_DASHBOARD_STATS_SUCCESS,
      payload: response
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.FETCH_DASHBOARD_STATS_FAILURE,
      payload: error.message
    });
    throw error;
  }
};

// =============================================================================
// Real-time Notification Actions (SignalR)
// =============================================================================

/**
 * Handle issue created notification
 */
export const handleIssueCreatedNotification = (issue) => ({
  type: types.ISSUE_CREATED_NOTIFICATION,
  payload: issue
});

/**
 * Handle issue updated notification
 */
export const handleIssueUpdatedNotification = (issue) => ({
  type: types.ISSUE_UPDATED_NOTIFICATION,
  payload: issue
});

/**
 * Handle issue deleted notification
 */
export const handleIssueDeletedNotification = (issueId) => ({
  type: types.ISSUE_DELETED_NOTIFICATION,
  payload: issueId
});

/**
 * Handle GPS issue detected notification
 */
export const handleGPSIssueDetectedNotification = (gpsData) => ({
  type: types.GPS_ISSUE_DETECTED_NOTIFICATION,
  payload: gpsData
});
