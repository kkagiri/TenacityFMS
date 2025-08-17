import axiosInstance from '../../api/axiosInstance';
import { showNotification } from './notificationActions';

// Action Types
export const ACTIVE_ALARM_TYPES = {
  // Loading states
  SET_LOADING: 'ACTIVE_ALARM_SET_LOADING',
  SET_ERROR: 'ACTIVE_ALARM_SET_ERROR',
  CLEAR_ERROR: 'ACTIVE_ALARM_CLEAR_ERROR',

  // Alarm CRUD operations
  FETCH_ALARMS_REQUEST: 'ACTIVE_ALARM_FETCH_ALARMS_REQUEST',
  FETCH_ALARMS_SUCCESS: 'ACTIVE_ALARM_FETCH_ALARMS_SUCCESS',
  FETCH_ALARMS_FAILURE: 'ACTIVE_ALARM_FETCH_ALARMS_FAILURE',

  FETCH_ALARM_BY_ID_REQUEST: 'ACTIVE_ALARM_FETCH_BY_ID_REQUEST',
  FETCH_ALARM_BY_ID_SUCCESS: 'ACTIVE_ALARM_FETCH_BY_ID_SUCCESS',
  FETCH_ALARM_BY_ID_FAILURE: 'ACTIVE_ALARM_FETCH_BY_ID_FAILURE',

  CREATE_ALARM_REQUEST: 'ACTIVE_ALARM_CREATE_REQUEST',
  CREATE_ALARM_SUCCESS: 'ACTIVE_ALARM_CREATE_SUCCESS',
  CREATE_ALARM_FAILURE: 'ACTIVE_ALARM_CREATE_FAILURE',

  // Alarm state actions
  ACKNOWLEDGE_ALARM_REQUEST: 'ACTIVE_ALARM_ACKNOWLEDGE_REQUEST',
  ACKNOWLEDGE_ALARM_SUCCESS: 'ACTIVE_ALARM_ACKNOWLEDGE_SUCCESS',
  ACKNOWLEDGE_ALARM_FAILURE: 'ACTIVE_ALARM_ACKNOWLEDGE_FAILURE',

  RESOLVE_ALARM_REQUEST: 'ACTIVE_ALARM_RESOLVE_REQUEST',
  RESOLVE_ALARM_SUCCESS: 'ACTIVE_ALARM_RESOLVE_SUCCESS',
  RESOLVE_ALARM_FAILURE: 'ACTIVE_ALARM_RESOLVE_FAILURE',

  SUPPRESS_ALARM_REQUEST: 'ACTIVE_ALARM_SUPPRESS_REQUEST',
  SUPPRESS_ALARM_SUCCESS: 'ACTIVE_ALARM_SUPPRESS_SUCCESS',
  SUPPRESS_ALARM_FAILURE: 'ACTIVE_ALARM_SUPPRESS_FAILURE',

  ESCALATE_ALARM_REQUEST: 'ACTIVE_ALARM_ESCALATE_REQUEST',
  ESCALATE_ALARM_SUCCESS: 'ACTIVE_ALARM_ESCALATE_SUCCESS',
  ESCALATE_ALARM_FAILURE: 'ACTIVE_ALARM_ESCALATE_FAILURE',

  // Bulk operations
  BULK_ACKNOWLEDGE_REQUEST: 'ACTIVE_ALARM_BULK_ACKNOWLEDGE_REQUEST',
  BULK_ACKNOWLEDGE_SUCCESS: 'ACTIVE_ALARM_BULK_ACKNOWLEDGE_SUCCESS',
  BULK_ACKNOWLEDGE_FAILURE: 'ACTIVE_ALARM_BULK_ACKNOWLEDGE_FAILURE',

  // Statistics
  FETCH_STATISTICS_REQUEST: 'ACTIVE_ALARM_FETCH_STATISTICS_REQUEST',
  FETCH_STATISTICS_SUCCESS: 'ACTIVE_ALARM_FETCH_STATISTICS_SUCCESS',
  FETCH_STATISTICS_FAILURE: 'ACTIVE_ALARM_FETCH_STATISTICS_FAILURE',

  // Auto-processing admin operations
  PROCESS_AUTO_RESOLVE_REQUEST: 'ACTIVE_ALARM_PROCESS_AUTO_RESOLVE_REQUEST',
  PROCESS_AUTO_RESOLVE_SUCCESS: 'ACTIVE_ALARM_PROCESS_AUTO_RESOLVE_SUCCESS',
  PROCESS_AUTO_RESOLVE_FAILURE: 'ACTIVE_ALARM_PROCESS_AUTO_RESOLVE_FAILURE',

  PROCESS_ESCALATION_REQUEST: 'ACTIVE_ALARM_PROCESS_ESCALATION_REQUEST',
  PROCESS_ESCALATION_SUCCESS: 'ACTIVE_ALARM_PROCESS_ESCALATION_SUCCESS',
  PROCESS_ESCALATION_FAILURE: 'ACTIVE_ALARM_PROCESS_ESCALATION_FAILURE',

  // Filter and view state
  SET_FILTERS: 'ACTIVE_ALARM_SET_FILTERS',
  CLEAR_FILTERS: 'ACTIVE_ALARM_CLEAR_FILTERS',
  SET_VIEW_MODE: 'ACTIVE_ALARM_SET_VIEW_MODE',
  SET_PAGINATION: 'ACTIVE_ALARM_SET_PAGINATION',

  // Real-time updates
  ALARM_CREATED: 'ACTIVE_ALARM_CREATED',
  ALARM_UPDATED: 'ACTIVE_ALARM_UPDATED',
  ALARM_STATE_CHANGED: 'ACTIVE_ALARM_STATE_CHANGED',

  // Selection
  SELECT_ALARM: 'ACTIVE_ALARM_SELECT',
  DESELECT_ALARM: 'ACTIVE_ALARM_DESELECT',
  SELECT_MULTIPLE_ALARMS: 'ACTIVE_ALARM_SELECT_MULTIPLE',
  CLEAR_SELECTION: 'ACTIVE_ALARM_CLEAR_SELECTION',
};

// Action Creators

// Loading and Error Management
export const setLoading = (isLoading) => ({
  type: ACTIVE_ALARM_TYPES.SET_LOADING,
  payload: isLoading,
});

export const setError = (error) => ({
  type: ACTIVE_ALARM_TYPES.SET_ERROR,
  payload: error,
});

export const clearError = () => ({
  type: ACTIVE_ALARM_TYPES.CLEAR_ERROR,
});

// Fetch Active Alarms with filtering and pagination
export const fetchActiveAlarms = (filters = {}) => async (dispatch) => {
  dispatch({ type: ACTIVE_ALARM_TYPES.FETCH_ALARMS_REQUEST });

  try {
    const queryParams = new URLSearchParams();

    // Add filter parameters
    if (filters.siteId) queryParams.append('siteId', filters.siteId);
    if (filters.alarmType) queryParams.append('alarmType', filters.alarmType);
    if (filters.state) queryParams.append('state', filters.state);
    if (filters.priority) queryParams.append('priority', filters.priority);
    if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
    if (filters.toDate) queryParams.append('toDate', filters.toDate);

    // Add pagination parameters
    if (filters.skip !== undefined) queryParams.append('skip', filters.skip);
    if (filters.take !== undefined) queryParams.append('take', filters.take);

    const response = await axiosInstance.get(
      `/active-alarms?${queryParams.toString()}`
    );

    dispatch({
      type: ACTIVE_ALARM_TYPES.FETCH_ALARMS_SUCCESS,
      payload: {
        alarms: response.data.data || response.data,
        totalCount: response.data.totalCount || 0,
        hasMore: response.data.hasMore || false,
      },
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch active alarms';
    dispatch({
      type: ACTIVE_ALARM_TYPES.FETCH_ALARMS_FAILURE,
      payload: errorMessage,
    });
    dispatch(showNotification(errorMessage, { type: 'error' }));
    throw error;
  }
};

// Fetch Single Alarm by ID
export const fetchAlarmById = (alarmId) => async (dispatch) => {
  dispatch({ type: ACTIVE_ALARM_TYPES.FETCH_ALARM_BY_ID_REQUEST });

  try {
    const response = await axiosInstance.get(`/active-alarms/${alarmId}`);

    dispatch({
      type: ACTIVE_ALARM_TYPES.FETCH_ALARM_BY_ID_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch alarm details';
    dispatch({
      type: ACTIVE_ALARM_TYPES.FETCH_ALARM_BY_ID_FAILURE,
      payload: errorMessage,
    });
    dispatch(showNotification(errorMessage, { type: 'error' }));
    throw error;
  }
};

// Create New Alarm
export const createAlarm = (alarmData) => async (dispatch) => {
  dispatch({ type: ACTIVE_ALARM_TYPES.CREATE_ALARM_REQUEST });

  try {
    const response = await axiosInstance.post('/active-alarms', alarmData);

    if (response.data.success) {
      dispatch({
        type: ACTIVE_ALARM_TYPES.CREATE_ALARM_SUCCESS,
        payload: response.data.activeAlarm
      });

      return { type: ACTIVE_ALARM_TYPES.CREATE_ALARM_SUCCESS, payload: response.data };
    } else {
      throw new Error(response.data.message || 'Failed to create alarm');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create alarm';
    dispatch({
      type: ACTIVE_ALARM_TYPES.CREATE_ALARM_FAILURE,
      payload: errorMessage
    });
    throw error;
  }
};

// Create Test Alarm (for testing purposes)
export const createTestAlarm = (testScenario) => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));

    // Get current user from state
    const { auth } = getState();
    const currentUser = auth.user?.username;

    console.log('Raw testScenario received:', testScenario);

    // Map severity string to enum value
    const severityMap = {
      'Low': 1,
      'Medium': 2,
      'High': 3,
      'Critical': 4
    };

    // Map test scenario to alarm request format (send DTO directly, no wrapper)
    const alarmRequest = {
      alarmType: testScenario.alarmType || testScenario.type,
      triggerSource: testScenario.triggerSource || "Manual",
      message: testScenario.message || testScenario.name,
      description: testScenario.description,
      severity: severityMap[testScenario.severity] || 2, // Default to Medium if unknown
      priority: testScenario.priority || testScenario.severity,
      siteId: testScenario.siteId,
      tankId: testScenario.tankId,
      deviceId: testScenario.deviceId,
      ptsDeviceId: testScenario.ptsDeviceId,
      thresholdValue: testScenario.thresholdValue,
      actualValue: testScenario.actualValue,
      unit: testScenario.unit,
      autoResolveMinutes: testScenario.autoResolveMinutes || 0,
      triggeredBy: currentUser,
      suppressNotifications: testScenario.suppressNotifications || false,
      createNotification: testScenario.createNotification !== false, // Default true
      checkForDuplicates: false,
      additionalData: {
        testScenario: true,
        originalScenario: testScenario
      }
    };

    // Validate required fields before sending
    if (!alarmRequest.alarmType) {
      throw new Error('AlarmType is required but not provided in test scenario');
    }
    if (!alarmRequest.message) {
      throw new Error('Message is required but not provided in test scenario');
    }

    console.log('Sending alarm request:', alarmRequest);

    // Send the DTO directly without wrapping in 'request'
    const response = await axiosInstance.post('/active-alarms/test', alarmRequest);

    if (response.data.success) {
      dispatch(showNotification(
        `Test alarm "${testScenario.name}" created successfully`,
        'success'
      ));

      // Refresh alarms list
      dispatch(fetchActiveAlarms());

      return { success: true, data: response.data };
    } else {
      throw new Error(response.data.message || 'Failed to create test alarm');
    }
  } catch (error) {
    console.error('Error creating test alarm:', error);

    let errorMessage = 'Failed to create test alarm';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      // Handle validation errors
      const validationErrors = Object.values(error.response.data.errors).flat();
      errorMessage = validationErrors.join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }

    dispatch(showNotification(errorMessage, 'error'));
    dispatch(setError(errorMessage));

    return { success: false, error: errorMessage };
  } finally {
    dispatch(setLoading(false));
  }
};

// Test SignalR Broadcast
export const testSignalRBroadcast = (message) => async (dispatch) => {
  try {
    const response = await axiosInstance.post('/active-alarms/test-signalr', JSON.stringify(message));

    return response.data;
  } catch (error) {
    console.error('SignalR test failed:', error);
    throw error;
  }
};

// Acknowledge Alarm
export const acknowledgeAlarm = (alarmId, notes = '') => async (dispatch) => {
  dispatch({ type: ACTIVE_ALARM_TYPES.ACKNOWLEDGE_ALARM_REQUEST });

  try {
    const response = await axiosInstance.post(`/active-alarms/${alarmId}/acknowledge`, { notes });

    dispatch({
      type: ACTIVE_ALARM_TYPES.ACKNOWLEDGE_ALARM_SUCCESS,
      payload: { alarmId, alarm: response.data },
    });

    dispatch(showNotification('Alarm acknowledged successfully', { type: 'success' }));
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to acknowledge alarm';
    dispatch({
      type: ACTIVE_ALARM_TYPES.ACKNOWLEDGE_ALARM_FAILURE,
      payload: errorMessage,
    });
    dispatch(showNotification(errorMessage, { type: 'error' }));
    throw error;
  }
};

// Resolve Alarm
export const resolveAlarm = (alarmId, resolutionNotes) => async (dispatch) => {
  dispatch({ type: ACTIVE_ALARM_TYPES.RESOLVE_ALARM_REQUEST });

  try {
    const response = await axiosInstance.post(`/active-alarms/${alarmId}/resolve`, { resolutionNotes });

    dispatch({
      type: ACTIVE_ALARM_TYPES.RESOLVE_ALARM_SUCCESS,
      payload: { alarmId, alarm: response.data },
    });

    dispatch(showNotification('Alarm resolved successfully', { type: 'success' }));
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to resolve alarm';
    dispatch({
      type: ACTIVE_ALARM_TYPES.RESOLVE_ALARM_FAILURE,
      payload: errorMessage,
    });
    dispatch(showNotification(errorMessage, { type: 'error' }));
    throw error;
  }
};

// Suppress Alarm
export const suppressAlarm = (alarmId) => async (dispatch) => {
  dispatch({ type: ACTIVE_ALARM_TYPES.SUPPRESS_ALARM_REQUEST });

  try {
    const response = await axiosInstance.post(`/active-alarms/${alarmId}/suppress`, {});

    dispatch({
      type: ACTIVE_ALARM_TYPES.SUPPRESS_ALARM_SUCCESS,
      payload: { alarmId, alarm: response.data },
    });

    dispatch(showNotification('Alarm suppressed successfully', { type: 'success' }));
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to suppress alarm';
    dispatch({
      type: ACTIVE_ALARM_TYPES.SUPPRESS_ALARM_FAILURE,
      payload: errorMessage,
    });
    dispatch(showNotification(errorMessage, { type: 'error' }));
    throw error;
  }
};

// Escalate Alarm
export const escalateAlarm = (alarmId) => async (dispatch) => {
  dispatch({ type: ACTIVE_ALARM_TYPES.ESCALATE_ALARM_REQUEST });

  try {
    const response = await axiosInstance.post(`/active-alarms/${alarmId}/escalate`, {});

    dispatch({
      type: ACTIVE_ALARM_TYPES.ESCALATE_ALARM_SUCCESS,
      payload: { alarmId, alarm: response.data },
    });

    dispatch(showNotification('Alarm escalated successfully', { type: 'success' }));
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to escalate alarm';
    dispatch({
      type: ACTIVE_ALARM_TYPES.ESCALATE_ALARM_FAILURE,
      payload: errorMessage,
    });
    dispatch(showNotification(errorMessage, { type: 'error' }));
    throw error;
  }
};

// Bulk Acknowledge Alarms
export const bulkAcknowledgeAlarms = (alarmIds, notes = '') => async (dispatch) => {
  dispatch({ type: ACTIVE_ALARM_TYPES.BULK_ACKNOWLEDGE_REQUEST });

  try {
    const response = await axiosInstance.post('/active-alarms/bulk-acknowledge', { alarmIds, notes });

    dispatch({
      type: ACTIVE_ALARM_TYPES.BULK_ACKNOWLEDGE_SUCCESS,
      payload: { alarmIds, result: response.data },
    });

    dispatch(showNotification(
      `${alarmIds.length} alarm(s) acknowledged successfully`,
      { type: 'success' }
    ));
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to acknowledge alarms';
    dispatch({
      type: ACTIVE_ALARM_TYPES.BULK_ACKNOWLEDGE_FAILURE,
      payload: errorMessage,
    });
    dispatch(showNotification(errorMessage, { type: 'error' }));
    throw error;
  }
};

// Fetch Alarm Statistics
export const fetchAlarmStatistics = () => async (dispatch) => {
  dispatch({ type: ACTIVE_ALARM_TYPES.FETCH_STATISTICS_REQUEST });

  try {
    const response = await axiosInstance.get('/active-alarms/statistics');

    dispatch({
      type: ACTIVE_ALARM_TYPES.FETCH_STATISTICS_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch alarm statistics';
    dispatch({
      type: ACTIVE_ALARM_TYPES.FETCH_STATISTICS_FAILURE,
      payload: errorMessage,
    });
    dispatch(showNotification(errorMessage, { type: 'error' }));
    throw error;
  }
};

// Admin: Process Auto-Resolve
export const processAutoResolve = () => async (dispatch) => {
  dispatch({ type: ACTIVE_ALARM_TYPES.PROCESS_AUTO_RESOLVE_REQUEST });

  try {
    const response = await axiosInstance.post('/active-alarms/process-auto-resolve', {});

    dispatch({
      type: ACTIVE_ALARM_TYPES.PROCESS_AUTO_RESOLVE_SUCCESS,
      payload: response.data,
    });

    dispatch(showNotification('Auto-resolve processing completed', { type: 'success' }));
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to process auto-resolve';
    dispatch({
      type: ACTIVE_ALARM_TYPES.PROCESS_AUTO_RESOLVE_FAILURE,
      payload: errorMessage,
    });
    dispatch(showNotification(errorMessage, { type: 'error' }));
    throw error;
  }
};

// Admin: Process Escalation
export const processEscalation = () => async (dispatch) => {
  dispatch({ type: ACTIVE_ALARM_TYPES.PROCESS_ESCALATION_REQUEST });

  try {
    const response = await axiosInstance.post('/active-alarms/process-escalation', {});

    dispatch({
      type: ACTIVE_ALARM_TYPES.PROCESS_ESCALATION_SUCCESS,
      payload: response.data,
    });

    dispatch(showNotification('Escalation processing completed', { type: 'success' }));
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to process escalation';
    dispatch({
      type: ACTIVE_ALARM_TYPES.PROCESS_ESCALATION_FAILURE,
      payload: errorMessage,
    });
    dispatch(showNotification(errorMessage, { type: 'error' }));
    throw error;
  }
};

// Filter and View Management
export const setFilters = (filters) => ({
  type: ACTIVE_ALARM_TYPES.SET_FILTERS,
  payload: filters,
});

export const clearFilters = () => ({
  type: ACTIVE_ALARM_TYPES.CLEAR_FILTERS,
});

export const setViewMode = (viewMode) => ({
  type: ACTIVE_ALARM_TYPES.SET_VIEW_MODE,
  payload: viewMode,
});

export const setPagination = (pagination) => ({
  type: ACTIVE_ALARM_TYPES.SET_PAGINATION,
  payload: pagination,
});

// Selection Management
export const selectAlarm = (alarmId) => ({
  type: ACTIVE_ALARM_TYPES.SELECT_ALARM,
  payload: alarmId,
});

export const deselectAlarm = (alarmId) => ({
  type: ACTIVE_ALARM_TYPES.DESELECT_ALARM,
  payload: alarmId,
});

export const selectMultipleAlarms = (alarmIds) => ({
  type: ACTIVE_ALARM_TYPES.SELECT_MULTIPLE_ALARMS,
  payload: alarmIds,
});

export const clearSelection = () => ({
  type: ACTIVE_ALARM_TYPES.CLEAR_SELECTION,
});

// Real-time Updates (for SignalR integration)
export const handleAlarmCreated = (alarm) => ({
  type: ACTIVE_ALARM_TYPES.ALARM_CREATED,
  payload: alarm,
});

export const handleAlarmUpdated = (alarm) => ({
  type: ACTIVE_ALARM_TYPES.ALARM_UPDATED,
  payload: alarm,
});

export const handleAlarmStateChanged = (alarmId, newState) => ({
  type: ACTIVE_ALARM_TYPES.ALARM_STATE_CHANGED,
  payload: { alarmId, newState },
});

// Compound Actions for common use cases

// Refresh alarms with current filters
export const refreshAlarms = () => (dispatch, getState) => {
  const { activeAlarm } = getState();
  const { filters, pagination } = activeAlarm;

  return dispatch(fetchActiveAlarms({
    ...filters,
    skip: pagination.skip,
    take: pagination.take,
  }));
};

// Acknowledge and refresh
export const acknowledgeAndRefresh = (alarmId, notes) => async (dispatch) => {
  await dispatch(acknowledgeAlarm(alarmId, notes));
  return dispatch(refreshAlarms());
};

// Resolve and refresh
export const resolveAndRefresh = (alarmId, resolutionNotes) => async (dispatch) => {
  await dispatch(resolveAlarm(alarmId, resolutionNotes));
  return dispatch(refreshAlarms());
};

// Load initial data for dashboard
export const loadActiveAlarmDashboard = () => async (dispatch) => {
  try {
    // Load statistics and recent alarms in parallel
    await Promise.all([
      dispatch(fetchAlarmStatistics()),
      dispatch(fetchActiveAlarms({ take: 10, state: 'Active' }))
    ]);
  } catch (error) {
    console.error('Failed to load active alarm dashboard:', error);
  }
};
