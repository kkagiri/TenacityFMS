import axiosInstance from '../../api/axiosInstance';

//Cursor - Stock Management Action Types
export const STOCK_MANAGEMENT_TYPES = {
  // Stock Adjustments
  FETCH_STOCK_ADJUSTMENTS_REQUEST: 'FETCH_STOCK_ADJUSTMENTS_REQUEST',
  FETCH_STOCK_ADJUSTMENTS_SUCCESS: 'FETCH_STOCK_ADJUSTMENTS_SUCCESS',
  FETCH_STOCK_ADJUSTMENTS_FAILURE: 'FETCH_STOCK_ADJUSTMENTS_FAILURE',

  CREATE_STOCK_ADJUSTMENT_REQUEST: 'CREATE_STOCK_ADJUSTMENT_REQUEST',
  CREATE_STOCK_ADJUSTMENT_SUCCESS: 'CREATE_STOCK_ADJUSTMENT_SUCCESS',
  CREATE_STOCK_ADJUSTMENT_FAILURE: 'CREATE_STOCK_ADJUSTMENT_FAILURE',

  // Stock Reconciliation
  FETCH_STOCK_DISCREPANCIES_REQUEST: 'FETCH_STOCK_DISCREPANCIES_REQUEST',
  FETCH_STOCK_DISCREPANCIES_SUCCESS: 'FETCH_STOCK_DISCREPANCIES_SUCCESS',
  FETCH_STOCK_DISCREPANCIES_FAILURE: 'FETCH_STOCK_DISCREPANCIES_FAILURE',

  RECONCILE_STOCKS_REQUEST: 'RECONCILE_STOCKS_REQUEST',
  RECONCILE_STOCKS_SUCCESS: 'RECONCILE_STOCKS_SUCCESS',
  RECONCILE_STOCKS_FAILURE: 'RECONCILE_STOCKS_FAILURE',

  // Stock Reporting
  GENERATE_STOCK_REPORT_REQUEST: 'GENERATE_STOCK_REPORT_REQUEST',
  GENERATE_STOCK_REPORT_SUCCESS: 'GENERATE_STOCK_REPORT_SUCCESS',
  GENERATE_STOCK_REPORT_FAILURE: 'GENERATE_STOCK_REPORT_FAILURE',

  FETCH_STOCK_REPORTS_REQUEST: 'FETCH_STOCK_REPORTS_REQUEST',
  FETCH_STOCK_REPORTS_SUCCESS: 'FETCH_STOCK_REPORTS_SUCCESS',
  FETCH_STOCK_REPORTS_FAILURE: 'FETCH_STOCK_REPORTS_FAILURE',

  // Clear actions
  CLEAR_STOCK_ADJUSTMENTS: 'CLEAR_STOCK_ADJUSTMENTS',
  CLEAR_STOCK_DISCREPANCIES: 'CLEAR_STOCK_DISCREPANCIES',
  CLEAR_STOCK_REPORTS: 'CLEAR_STOCK_REPORTS'
};

//Cursor - Stock Adjustment Actions
export const fetchStockAdjustments = (filters = {}) => async (dispatch) => {
  dispatch({ type: STOCK_MANAGEMENT_TYPES.FETCH_STOCK_ADJUSTMENTS_REQUEST });

  try {
    const params = new URLSearchParams();
    if (filters.siteId) params.append('siteId', filters.siteId);
    if (filters.tankId) params.append('tankId', filters.tankId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await axiosInstance.get(`/tankstock/adjustments?${params.toString()}`);

    if (response.data.isSuccess) {
      dispatch({
        type: STOCK_MANAGEMENT_TYPES.FETCH_STOCK_ADJUSTMENTS_SUCCESS,
        payload: response.data.data
      });
      return { success: true, data: response.data.data, message: response.data.message };
    } else {
      dispatch({
        type: STOCK_MANAGEMENT_TYPES.FETCH_STOCK_ADJUSTMENTS_FAILURE,
        payload: response.data.message
      });
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error fetching stock adjustments';
    dispatch({
      type: STOCK_MANAGEMENT_TYPES.FETCH_STOCK_ADJUSTMENTS_FAILURE,
      payload: errorMessage
    });
    return { success: false, message: errorMessage };
  }
};

export const createStockAdjustment = (adjustmentData) => async (dispatch) => {
  dispatch({ type: STOCK_MANAGEMENT_TYPES.CREATE_STOCK_ADJUSTMENT_REQUEST });

  try {
    //Cursor - Updated to use correct endpoint from TankStockController
    const response = await axiosInstance.post('/tankstock/adjustments', adjustmentData);

    if (response.data.isSuccess) {
      dispatch({
        type: STOCK_MANAGEMENT_TYPES.CREATE_STOCK_ADJUSTMENT_SUCCESS,
        payload: response.data.data
      });
      return { success: true, data: response.data.data, message: response.data.message };
    } else {
      dispatch({
        type: STOCK_MANAGEMENT_TYPES.CREATE_STOCK_ADJUSTMENT_FAILURE,
        payload: response.data.message
      });
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error creating stock adjustment';
    dispatch({
      type: STOCK_MANAGEMENT_TYPES.CREATE_STOCK_ADJUSTMENT_FAILURE,
      payload: errorMessage
    });
    return { success: false, message: errorMessage };
  }
};

//Cursor - Stock Reconciliation Actions
export const fetchStockDiscrepancies = (siteId = null, thresholdValue = 10) => async (dispatch) => {
  dispatch({ type: STOCK_MANAGEMENT_TYPES.FETCH_STOCK_DISCREPANCIES_REQUEST });

  try {
    const params = new URLSearchParams();
    if (siteId) params.append('siteId', siteId);
    params.append('thresholdValue', thresholdValue);

    //Cursor - Updated to use correct endpoint from TankStockController
    const response = await axiosInstance.get(`/tankstock/discrepancies?${params.toString()}`);

    if (response.data.isSuccess) {
      dispatch({
        type: STOCK_MANAGEMENT_TYPES.FETCH_STOCK_DISCREPANCIES_SUCCESS,
        payload: response.data.data
      });
      return { success: true, data: response.data.data, message: response.data.message };
    } else {
      dispatch({
        type: STOCK_MANAGEMENT_TYPES.FETCH_STOCK_DISCREPANCIES_FAILURE,
        payload: response.data.message
      });
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error fetching stock discrepancies';
    dispatch({
      type: STOCK_MANAGEMENT_TYPES.FETCH_STOCK_DISCREPANCIES_FAILURE,
      payload: errorMessage
    });
    return { success: false, message: errorMessage };
  }
};

export const reconcileStocks = (reconciliationData) => async (dispatch) => {
  dispatch({ type: STOCK_MANAGEMENT_TYPES.RECONCILE_STOCKS_REQUEST });

  try {
    //Cursor - Updated to use correct endpoint from TankStockController
    const response = await axiosInstance.post('/tankstock/reconcile', reconciliationData);

    if (response.data.isSuccess) {
      dispatch({
        type: STOCK_MANAGEMENT_TYPES.RECONCILE_STOCKS_SUCCESS,
        payload: response.data.data
      });
      return { success: true, data: response.data.data, message: response.data.message };
    } else {
      dispatch({
        type: STOCK_MANAGEMENT_TYPES.RECONCILE_STOCKS_FAILURE,
        payload: response.data.message
      });
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error during stock reconciliation';
    dispatch({
      type: STOCK_MANAGEMENT_TYPES.RECONCILE_STOCKS_FAILURE,
      payload: errorMessage
    });
    return { success: false, message: errorMessage };
  }
};

//Cursor - Stock Reporting Actions
export const generateStockReport = (reportParams) => async (dispatch) => {
  dispatch({ type: STOCK_MANAGEMENT_TYPES.GENERATE_STOCK_REPORT_REQUEST });

  try {
    const response = await axiosInstance.post('/stockreport/generate', reportParams);

    if (response.data.isSuccess) {
      dispatch({
        type: STOCK_MANAGEMENT_TYPES.GENERATE_STOCK_REPORT_SUCCESS,
        payload: response.data.data
      });
      return { success: true, data: response.data.data, message: response.data.message };
    } else {
      dispatch({
        type: STOCK_MANAGEMENT_TYPES.GENERATE_STOCK_REPORT_FAILURE,
        payload: response.data.message
      });
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error generating stock report';
    dispatch({
      type: STOCK_MANAGEMENT_TYPES.GENERATE_STOCK_REPORT_FAILURE,
      payload: errorMessage
    });
    return { success: false, message: errorMessage };
  }
};

export const fetchStockReports = (filters = {}) => async (dispatch) => {
  dispatch({ type: STOCK_MANAGEMENT_TYPES.FETCH_STOCK_REPORTS_REQUEST });

  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.reportType) params.append('reportType', filters.reportType);

    const response = await axiosInstance.get(`/stockreport?${params.toString()}`);

    if (response.data.isSuccess) {
      dispatch({
        type: STOCK_MANAGEMENT_TYPES.FETCH_STOCK_REPORTS_SUCCESS,
        payload: response.data.data
      });
      return { success: true, data: response.data.data, message: response.data.message };
    } else {
      dispatch({
        type: STOCK_MANAGEMENT_TYPES.FETCH_STOCK_REPORTS_FAILURE,
        payload: response.data.message
      });
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error fetching stock reports';
    dispatch({
      type: STOCK_MANAGEMENT_TYPES.FETCH_STOCK_REPORTS_FAILURE,
      payload: errorMessage
    });
    return { success: false, message: errorMessage };
  }
};

export const exportStockReport = (reportId, format = 'excel') => async () => {
  try {
    const response = await axiosInstance.get(`/stockreport/export/${reportId}?format=${format}`, {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stock-report-${reportId}.${format === 'csv' ? 'csv' : 'xlsx'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'Report exported successfully' };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error exporting stock report';
    return { success: false, message: errorMessage };
  }
};

//Cursor - Clear Actions
export const clearStockAdjustments = () => ({
  type: STOCK_MANAGEMENT_TYPES.CLEAR_STOCK_ADJUSTMENTS
});

export const clearStockDiscrepancies = () => ({
  type: STOCK_MANAGEMENT_TYPES.CLEAR_STOCK_DISCREPANCIES
});

export const clearStockReports = () => ({
  type: STOCK_MANAGEMENT_TYPES.CLEAR_STOCK_REPORTS
});