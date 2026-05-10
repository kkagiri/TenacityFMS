/**
 * File: vehicleDashboardActions.js
 * Purpose: Redux actions for vehicle dashboard metrics, analytics, and summary datasets.
 * Dependencies: axiosInstance
 * Last Modified: 2026-02-25
 *
 * Key Functions:
 * - fetchDashboardMetrics(): Loads top-level fleet KPI metrics.
 * - fetchPerformanceMetrics(): Loads summary and per-vehicle performance data.
 * - refreshDashboardData(): Refreshes all dashboard datasets in parallel.
 */
import axiosInstance from "./../../api/axiosInstance";

const extractDashboardPayload = (response) => {
  const responseData = response?.data;
  return responseData?.data ?? responseData?.Data ?? responseData ?? null;
};

const isSuccessfulResponse = (response) => {
  const responseData = response?.data;
  const explicitSuccess = responseData?.success ?? responseData?.isSuccess ?? responseData?.Success ?? responseData?.IsSuccess;
  return explicitSuccess ?? true;
};

// Action Types
export const FETCH_DASHBOARD_ANALYTICS_REQUEST = 'FETCH_DASHBOARD_ANALYTICS_REQUEST';
export const FETCH_DASHBOARD_ANALYTICS_SUCCESS = 'FETCH_DASHBOARD_ANALYTICS_SUCCESS';
export const FETCH_DASHBOARD_ANALYTICS_FAILURE = 'FETCH_DASHBOARD_ANALYTICS_FAILURE';

export const FETCH_DASHBOARD_METRICS_REQUEST = 'FETCH_DASHBOARD_METRICS_REQUEST';
export const FETCH_DASHBOARD_METRICS_SUCCESS = 'FETCH_DASHBOARD_METRICS_SUCCESS';
export const FETCH_DASHBOARD_METRICS_FAILURE = 'FETCH_DASHBOARD_METRICS_FAILURE';

export const FETCH_STATUS_DISTRIBUTION_REQUEST = 'FETCH_STATUS_DISTRIBUTION_REQUEST';
export const FETCH_STATUS_DISTRIBUTION_SUCCESS = 'FETCH_STATUS_DISTRIBUTION_SUCCESS';
export const FETCH_STATUS_DISTRIBUTION_FAILURE = 'FETCH_STATUS_DISTRIBUTION_FAILURE';

export const FETCH_FLEET_UTILIZATION_REQUEST = 'FETCH_FLEET_UTILIZATION_REQUEST';
export const FETCH_FLEET_UTILIZATION_SUCCESS = 'FETCH_FLEET_UTILIZATION_SUCCESS';
export const FETCH_FLEET_UTILIZATION_FAILURE = 'FETCH_FLEET_UTILIZATION_FAILURE';

export const FETCH_MAINTENANCE_ALERTS_REQUEST = 'FETCH_MAINTENANCE_ALERTS_REQUEST';
export const FETCH_MAINTENANCE_ALERTS_SUCCESS = 'FETCH_MAINTENANCE_ALERTS_SUCCESS';
export const FETCH_MAINTENANCE_ALERTS_FAILURE = 'FETCH_MAINTENANCE_ALERTS_FAILURE';

export const FETCH_RECENT_ACTIVITIES_REQUEST = 'FETCH_RECENT_ACTIVITIES_REQUEST';
export const FETCH_RECENT_ACTIVITIES_SUCCESS = 'FETCH_RECENT_ACTIVITIES_SUCCESS';
export const FETCH_RECENT_ACTIVITIES_FAILURE = 'FETCH_RECENT_ACTIVITIES_FAILURE';

export const FETCH_PERFORMANCE_METRICS_REQUEST = 'FETCH_PERFORMANCE_METRICS_REQUEST';
export const FETCH_PERFORMANCE_METRICS_SUCCESS = 'FETCH_PERFORMANCE_METRICS_SUCCESS';
export const FETCH_PERFORMANCE_METRICS_FAILURE = 'FETCH_PERFORMANCE_METRICS_FAILURE';

export const CLEAR_DASHBOARD_DATA = 'CLEAR_DASHBOARD_DATA';
export const SET_DASHBOARD_LOADING = 'SET_DASHBOARD_LOADING';
export const SET_DASHBOARD_ERROR = 'SET_DASHBOARD_ERROR';

// Action Creators

// Fetch complete dashboard analytics
export const fetchDashboardAnalytics = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_DASHBOARD_ANALYTICS_REQUEST });

    const response = await axiosInstance.get('/vehicle/dashboard/analytics');
    const payload = extractDashboardPayload(response);

    const result = {
      success: isSuccessfulResponse(response),
      data: payload,
      message: 'Dashboard analytics fetched successfully'
    };

    dispatch({
      type: FETCH_DASHBOARD_ANALYTICS_SUCCESS,
      payload
    });

    return result;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching dashboard analytics';

    dispatch({
      type: FETCH_DASHBOARD_ANALYTICS_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

// Fetch dashboard metrics only
export const fetchDashboardMetrics = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_DASHBOARD_METRICS_REQUEST });

    const response = await axiosInstance.get('/vehicle/dashboard/metrics');
    const payload = extractDashboardPayload(response);

    const result = {
      success: isSuccessfulResponse(response),
      data: payload,
      message: 'Dashboard metrics fetched successfully'
    };

    dispatch({
      type: FETCH_DASHBOARD_METRICS_SUCCESS,
      payload
    });

    return result;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching dashboard metrics';

    dispatch({
      type: FETCH_DASHBOARD_METRICS_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

// Fetch status distribution
export const fetchStatusDistribution = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_STATUS_DISTRIBUTION_REQUEST });

    const response = await axiosInstance.get('/vehicle/dashboard/status-distribution');
    const payload = extractDashboardPayload(response) || [];

    const result = {
      success: isSuccessfulResponse(response),
      data: payload,
      message: 'Status distribution fetched successfully'
    };

    dispatch({
      type: FETCH_STATUS_DISTRIBUTION_SUCCESS,
      payload
    });

    return result;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching status distribution';

    dispatch({
      type: FETCH_STATUS_DISTRIBUTION_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

// Fetch fleet utilization
export const fetchFleetUtilization = (days = 30) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_FLEET_UTILIZATION_REQUEST });

    const response = await axiosInstance.get(`/vehicle/dashboard/fleet-utilization?days=${days}`);
    const payload = extractDashboardPayload(response);

    const result = {
      success: isSuccessfulResponse(response),
      data: payload,
      message: 'Fleet utilization fetched successfully'
    };

    dispatch({
      type: FETCH_FLEET_UTILIZATION_SUCCESS,
      payload
    });

    return result;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching fleet utilization';

    dispatch({
      type: FETCH_FLEET_UTILIZATION_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

// Fetch maintenance alerts
export const fetchMaintenanceAlerts = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_MAINTENANCE_ALERTS_REQUEST });

    const response = await axiosInstance.get('/vehicle/dashboard/maintenance-alerts');
    const payload = extractDashboardPayload(response) || [];

    const result = {
      success: isSuccessfulResponse(response),
      data: payload,
      message: 'Maintenance alerts fetched successfully'
    };

    dispatch({
      type: FETCH_MAINTENANCE_ALERTS_SUCCESS,
      payload
    });

    return result;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching maintenance alerts';

    dispatch({
      type: FETCH_MAINTENANCE_ALERTS_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

// Fetch recent activities
export const fetchRecentActivities = (limit = 10) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_RECENT_ACTIVITIES_REQUEST });

    const response = await axiosInstance.get(`/vehicle/dashboard/recent-activities?limit=${limit}`);
    const payload = extractDashboardPayload(response) || [];

    const result = {
      success: isSuccessfulResponse(response),
      data: payload,
      message: 'Recent activities fetched successfully'
    };

    dispatch({
      type: FETCH_RECENT_ACTIVITIES_SUCCESS,
      payload
    });

    return result;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching recent activities';

    dispatch({
      type: FETCH_RECENT_ACTIVITIES_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

// Fetch performance metrics
export const fetchPerformanceMetrics = (days = 7) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_PERFORMANCE_METRICS_REQUEST });

    const response = await axiosInstance.get(`/vehicle/dashboard/performance-metrics?days=${days}`);
    const payload = extractDashboardPayload(response);

    const result = {
      success: isSuccessfulResponse(response),
      data: payload,
      message: 'Performance metrics fetched successfully'
    };

    dispatch({
      type: FETCH_PERFORMANCE_METRICS_SUCCESS,
      payload
    });

    return result;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching performance metrics';

    dispatch({
      type: FETCH_PERFORMANCE_METRICS_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

// Refresh all dashboard data
export const refreshDashboardData = () => async (dispatch) => {
  try {
    dispatch({ type: SET_DASHBOARD_LOADING, payload: true });

    // Fetch all dashboard data in parallel
    const promises = [
      dispatch(fetchDashboardMetrics()),
      dispatch(fetchStatusDistribution()),
      dispatch(fetchFleetUtilization()),
      dispatch(fetchMaintenanceAlerts()),
      dispatch(fetchRecentActivities()),
      dispatch(fetchPerformanceMetrics())
    ];

    const results = await Promise.allSettled(promises);

    // Check if any requests failed
    const hasFailures = results.some(result => result.status === 'rejected');

    if (hasFailures) {
      dispatch({
        type: SET_DASHBOARD_ERROR,
        payload: 'Some dashboard data could not be loaded'
      });
    }

    dispatch({ type: SET_DASHBOARD_LOADING, payload: false });

    return {
      success: !hasFailures,
      data: results,
      message: hasFailures ? 'Dashboard data partially loaded' : 'Dashboard data refreshed successfully'
    };
  } catch (error) {
    dispatch({ type: SET_DASHBOARD_LOADING, payload: false });
    dispatch({
      type: SET_DASHBOARD_ERROR,
      payload: 'Error refreshing dashboard data'
    });

    return {
      success: false,
      data: null,
      message: 'Error refreshing dashboard data'
    };
  }
};

// Clear dashboard data
export const clearDashboardData = () => ({
  type: CLEAR_DASHBOARD_DATA
});

// Set dashboard loading state
export const setDashboardLoading = (loading) => ({
  type: SET_DASHBOARD_LOADING,
  payload: loading
});

// Set dashboard error
export const setDashboardError = (error) => ({
  type: SET_DASHBOARD_ERROR,
  payload: error
});

// Auto-refresh dashboard data (call this with interval)
export const autoRefreshDashboard = (intervalMinutes = 5) => (dispatch) => {
  const refreshInterval = setInterval(() => {
    dispatch(refreshDashboardData());
  }, intervalMinutes * 60 * 1000);

  // Return cleanup function
  return () => {
    clearInterval(refreshInterval);
  };
};