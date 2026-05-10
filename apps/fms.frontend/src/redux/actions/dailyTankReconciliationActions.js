import dailyTankReconciliationService from '../../services/dailyTankReconciliationService';

// Action Types
export const FETCH_DAILY_RECONCILIATION_REPORT_REQUEST = 'FETCH_DAILY_RECONCILIATION_REPORT_REQUEST';
export const FETCH_DAILY_RECONCILIATION_REPORT_SUCCESS = 'FETCH_DAILY_RECONCILIATION_REPORT_SUCCESS';
export const FETCH_DAILY_RECONCILIATION_REPORT_FAILURE = 'FETCH_DAILY_RECONCILIATION_REPORT_FAILURE';

export const FETCH_RECONCILIATION_SUMMARY_REQUEST = 'FETCH_RECONCILIATION_SUMMARY_REQUEST';
export const FETCH_RECONCILIATION_SUMMARY_SUCCESS = 'FETCH_RECONCILIATION_SUMMARY_SUCCESS';
export const FETCH_RECONCILIATION_SUMMARY_FAILURE = 'FETCH_RECONCILIATION_SUMMARY_FAILURE';

export const FETCH_DISCREPANCY_ALERTS_REQUEST = 'FETCH_DISCREPANCY_ALERTS_REQUEST';
export const FETCH_DISCREPANCY_ALERTS_SUCCESS = 'FETCH_DISCREPANCY_ALERTS_SUCCESS';
export const FETCH_DISCREPANCY_ALERTS_FAILURE = 'FETCH_DISCREPANCY_ALERTS_FAILURE';

export const PROCESS_RECONCILIATION_REQUEST = 'PROCESS_RECONCILIATION_REQUEST';
export const PROCESS_RECONCILIATION_SUCCESS = 'PROCESS_RECONCILIATION_SUCCESS';
export const PROCESS_RECONCILIATION_FAILURE = 'PROCESS_RECONCILIATION_FAILURE';

export const CLEAR_DAILY_RECONCILIATION = 'CLEAR_DAILY_RECONCILIATION';

// Action Creators

/**
 * Fetch daily reconciliation report with analytics
 */
export const fetchDailyReconciliationReport = (params) => async (dispatch) => {
  dispatch({ type: FETCH_DAILY_RECONCILIATION_REPORT_REQUEST });

  try {
    const result = await dailyTankReconciliationService.getReport(params);

    if (result.success) {
      dispatch({
        type: FETCH_DAILY_RECONCILIATION_REPORT_SUCCESS,
        payload: result.data
      });
      return { success: true, data: result.data };
    } else {
      dispatch({
        type: FETCH_DAILY_RECONCILIATION_REPORT_FAILURE,
        payload: result.error
      });
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage = error.message || 'Failed to fetch daily reconciliation report';
    dispatch({
      type: FETCH_DAILY_RECONCILIATION_REPORT_FAILURE,
      payload: errorMessage
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * Fetch reconciliation summary for dashboard
 */
export const fetchReconciliationSummary = (params) => async (dispatch) => {
  dispatch({ type: FETCH_RECONCILIATION_SUMMARY_REQUEST });

  try {
    const result = await dailyTankReconciliationService.getSummary(params);

    if (result.success) {
      dispatch({
        type: FETCH_RECONCILIATION_SUMMARY_SUCCESS,
        payload: result.data
      });
      return { success: true, data: result.data };
    } else {
      dispatch({
        type: FETCH_RECONCILIATION_SUMMARY_FAILURE,
        payload: result.error
      });
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage = error.message || 'Failed to fetch reconciliation summary';
    dispatch({
      type: FETCH_RECONCILIATION_SUMMARY_FAILURE,
      payload: errorMessage
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * Fetch discrepancy alerts
 */
export const fetchDiscrepancyAlerts = (params) => async (dispatch) => {
  dispatch({ type: FETCH_DISCREPANCY_ALERTS_REQUEST });

  try {
    const result = await dailyTankReconciliationService.getAlerts(params);

    if (result.success) {
      dispatch({
        type: FETCH_DISCREPANCY_ALERTS_SUCCESS,
        payload: result.data
      });
      return { success: true, data: result.data };
    } else {
      dispatch({
        type: FETCH_DISCREPANCY_ALERTS_FAILURE,
        payload: result.error
      });
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage = error.message || 'Failed to fetch discrepancy alerts';
    dispatch({
      type: FETCH_DISCREPANCY_ALERTS_FAILURE,
      payload: errorMessage
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * Process daily reconciliation for a date range
 */
export const processReconciliation = (params) => async (dispatch) => {
  dispatch({ type: PROCESS_RECONCILIATION_REQUEST });

  try {
    const result = await dailyTankReconciliationService.processReconciliation(params);

    if (result.success) {
      dispatch({
        type: PROCESS_RECONCILIATION_SUCCESS,
        payload: result.data
      });
      return { success: true, data: result.data, message: result.message };
    } else {
      dispatch({
        type: PROCESS_RECONCILIATION_FAILURE,
        payload: result.error
      });
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage = error.message || 'Failed to process reconciliation';
    dispatch({
      type: PROCESS_RECONCILIATION_FAILURE,
      payload: errorMessage
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * Process yesterday's reconciliation
 */
export const processYesterdayReconciliation = (params) => async (dispatch) => {
  dispatch({ type: PROCESS_RECONCILIATION_REQUEST });

  try {
    const result = await dailyTankReconciliationService.processYesterday(params);

    if (result.success) {
      dispatch({
        type: PROCESS_RECONCILIATION_SUCCESS,
        payload: result.data
      });
      return { success: true, data: result.data, message: result.message };
    } else {
      dispatch({
        type: PROCESS_RECONCILIATION_FAILURE,
        payload: result.error
      });
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage = error.message || 'Failed to process yesterday\'s reconciliation';
    dispatch({
      type: PROCESS_RECONCILIATION_FAILURE,
      payload: errorMessage
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * Clear daily reconciliation data
 */
export const clearDailyReconciliation = () => ({
  type: CLEAR_DAILY_RECONCILIATION
});
