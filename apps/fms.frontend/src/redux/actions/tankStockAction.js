import axiosInstance from './../../api/axiosInstance';

export const FETCH_TANK_STOCKS_SUCCESS = 'FETCH_TANK_STOCKS_SUCCESS';
export const FETCH_TANK_STOCKS_FAILURE = 'FETCH_TANK_STOCKS_FAILURE';
export const CREATE_TANK_STOCK_SUCCESS = 'CREATE_TANK_STOCK_SUCCESS';
export const CREATE_TANK_STOCK_FAILURE = 'CREATE_TANK_STOCK_FAILURE';
export const UPDATE_TANK_STOCK_SUCCESS = 'UPDATE_TANK_STOCK_SUCCESS';
export const UPDATE_TANK_STOCK_FAILURE = 'UPDATE_TANK_STOCK_FAILURE';
export const DELETE_TANK_STOCK_SUCCESS = 'DELETE_TANK_STOCK_SUCCESS';
export const DELETE_TANK_STOCK_FAILURE = 'DELETE_TANK_STOCK_FAILURE';
export const CREATE_OPENING_STOCK_SUCCESS = 'CREATE_OPENING_STOCK_SUCCESS';
export const CREATE_OPENING_STOCK_FAILURE = 'CREATE_OPENING_STOCK_FAILURE';
export const CREATE_CLOSING_STOCK_SUCCESS = 'CREATE_CLOSING_STOCK_SUCCESS';
export const CREATE_CLOSING_STOCK_FAILURE = 'CREATE_CLOSING_STOCK_FAILURE';
export const FETCH_TANK_STOCK_BY_ID_SUCCESS = 'FETCH_TANK_STOCK_BY_ID_SUCCESS';
export const FETCH_TANK_STOCK_BY_ID_FAILURE = 'FETCH_TANK_STOCK_BY_ID_FAILURE';
export const CREATE_TANK_TRANSFER_SUCCESS = 'CREATE_TANK_TRANSFER_SUCCESS';
export const CREATE_TANK_TRANSFER_FAILURE = 'CREATE_TANK_TRANSFER_FAILURE';

export const CREATE_DELIVERY_SUCCESS = 'CREATE_DELIVERY_SUCCESS';
export const CREATE_DELIVERY_FAILURE = 'CREATE_DELIVERY_FAILURE';
export const FETCH_DELIVERIES_SUCCESS = 'FETCH_DELIVERIES_SUCCESS';
export const FETCH_DELIVERIES_FAILURE = 'FETCH_DELIVERIES_FAILURE';

export const FETCH_STOCK_DISCREPANCIES_REQUEST = 'FETCH_STOCK_DISCREPANCIES_REQUEST';
export const FETCH_STOCK_DISCREPANCIES_SUCCESS = 'FETCH_STOCK_DISCREPANCIES_SUCCESS';
export const FETCH_STOCK_DISCREPANCIES_FAILURE = 'FETCH_STOCK_DISCREPANCIES_FAILURE';

// New action types for stock adjustments
export const CREATE_STOCK_ADJUSTMENT_REQUEST = 'CREATE_STOCK_ADJUSTMENT_REQUEST';
export const CREATE_STOCK_ADJUSTMENT_SUCCESS = 'CREATE_STOCK_ADJUSTMENT_SUCCESS';
export const CREATE_STOCK_ADJUSTMENT_FAILURE = 'CREATE_STOCK_ADJUSTMENT_FAILURE';

export const FETCH_STOCK_ADJUSTMENTS_REQUEST = 'FETCH_STOCK_ADJUSTMENTS_REQUEST';
export const FETCH_STOCK_ADJUSTMENTS_SUCCESS = 'FETCH_STOCK_ADJUSTMENTS_SUCCESS';
export const FETCH_STOCK_ADJUSTMENTS_FAILURE = 'FETCH_STOCK_ADJUSTMENTS_FAILURE';

export const RECONCILE_STOCKS_REQUEST = 'RECONCILE_STOCKS_REQUEST';
export const RECONCILE_STOCKS_SUCCESS = 'RECONCILE_STOCKS_SUCCESS';
export const RECONCILE_STOCKS_FAILURE = 'RECONCILE_STOCKS_FAILURE';

export const GENERATE_STOCK_REPORT_REQUEST = 'GENERATE_STOCK_REPORT_REQUEST';
export const GENERATE_STOCK_REPORT_SUCCESS = 'GENERATE_STOCK_REPORT_SUCCESS';
export const GENERATE_STOCK_REPORT_FAILURE = 'GENERATE_STOCK_REPORT_FAILURE';

export const FETCH_TANK_STOCKS_REQUEST = 'FETCH_TANK_STOCKS_REQUEST';

// Dispensing Volume action types
export const CREATE_DISPENSING_VOLUME_REQUEST = 'CREATE_DISPENSING_VOLUME_REQUEST';
export const CREATE_DISPENSING_VOLUME_SUCCESS = 'CREATE_DISPENSING_VOLUME_SUCCESS';
export const CREATE_DISPENSING_VOLUME_FAILURE = 'CREATE_DISPENSING_VOLUME_FAILURE';

export const FETCH_DISPENSING_VOLUMES_REQUEST = 'FETCH_DISPENSING_VOLUMES_REQUEST';
export const FETCH_DISPENSING_VOLUMES_SUCCESS = 'FETCH_DISPENSING_VOLUMES_SUCCESS';
export const FETCH_DISPENSING_VOLUMES_FAILURE = 'FETCH_DISPENSING_VOLUMES_FAILURE';

export const UPDATE_DISPENSING_VOLUME_REQUEST = 'UPDATE_DISPENSING_VOLUME_REQUEST';
export const UPDATE_DISPENSING_VOLUME_SUCCESS = 'UPDATE_DISPENSING_VOLUME_SUCCESS';
export const UPDATE_DISPENSING_VOLUME_FAILURE = 'UPDATE_DISPENSING_VOLUME_FAILURE';

export const DELETE_DISPENSING_VOLUME_REQUEST = 'DELETE_DISPENSING_VOLUME_REQUEST';
export const DELETE_DISPENSING_VOLUME_SUCCESS = 'DELETE_DISPENSING_VOLUME_SUCCESS';
export const DELETE_DISPENSING_VOLUME_FAILURE = 'DELETE_DISPENSING_VOLUME_FAILURE';

// Variance Analysis action types
export const FETCH_VARIANCE_ANALYSIS_REQUEST = 'FETCH_VARIANCE_ANALYSIS_REQUEST';
export const FETCH_VARIANCE_ANALYSIS_SUCCESS = 'FETCH_VARIANCE_ANALYSIS_SUCCESS';
export const FETCH_VARIANCE_ANALYSIS_FAILURE = 'FETCH_VARIANCE_ANALYSIS_FAILURE';

// Delivery Cycle Analysis action types
export const FETCH_DELIVERY_CYCLE_ANALYSIS_REQUEST = 'FETCH_DELIVERY_CYCLE_ANALYSIS_REQUEST';
export const FETCH_DELIVERY_CYCLE_ANALYSIS_SUCCESS = 'FETCH_DELIVERY_CYCLE_ANALYSIS_SUCCESS';
export const FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE = 'FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE';

// Transfer Reconciliation action types
export const FETCH_TRANSFER_RECONCILIATION_REQUEST = 'FETCH_TRANSFER_RECONCILIATION_REQUEST';
export const FETCH_TRANSFER_RECONCILIATION_SUCCESS = 'FETCH_TRANSFER_RECONCILIATION_SUCCESS';
export const FETCH_TRANSFER_RECONCILIATION_FAILURE = 'FETCH_TRANSFER_RECONCILIATION_FAILURE';
export const CLEAR_TRANSFER_RECONCILIATION = 'CLEAR_TRANSFER_RECONCILIATION';

// Period Diagnostic action types
export const FETCH_PERIOD_DIAGNOSTIC_REQUEST = 'FETCH_PERIOD_DIAGNOSTIC_REQUEST';
export const FETCH_PERIOD_DIAGNOSTIC_SUCCESS = 'FETCH_PERIOD_DIAGNOSTIC_SUCCESS';
export const FETCH_PERIOD_DIAGNOSTIC_FAILURE = 'FETCH_PERIOD_DIAGNOSTIC_FAILURE';
export const CLEAR_PERIOD_DIAGNOSTIC = 'CLEAR_PERIOD_DIAGNOSTIC';

const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};
// Enhanced tank stock actions with better loading states
export const fetchTankStocks = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_TANK_STOCKS_REQUEST });

    const params = new URLSearchParams();
    if (filters.siteId) params.append('siteId', filters.siteId);
    if (filters.tankId) params.append('tankId', filters.tankId);

    const response = await axiosInstance.get(`/tankstock?${params.toString()}`);

    if (response.data.isSuccess) {
      dispatch({ type: FETCH_TANK_STOCKS_SUCCESS, payload: response.data.data || response.data });
      return { success: true, data: response.data.data || response.data };
    } else {
      dispatch({ type: FETCH_TANK_STOCKS_FAILURE, payload: response.data.message });
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching tank stocks';
    dispatch({ type: FETCH_TANK_STOCKS_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

export const createTankStock = (tankStock) => async (dispatch) => {
  try {
    const response = await axiosInstance.post('/tankstock', tankStock);
    dispatch({ type: CREATE_TANK_STOCK_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: CREATE_TANK_STOCK_FAILURE, payload: error.message });
  }
};

export const updateTankStock = (id, tankStock, options = {}) => async (dispatch) => {
  try {
    const queryParams = new URLSearchParams();
    if (options.processHistory) {
      queryParams.append('processHistory', 'true');
    }

    const url = queryParams.toString()
      ? `/tankstock/${id}?${queryParams.toString()}`
      : `/tankstock/${id}`;

    const response = await axiosInstance.put(url, tankStock);
    dispatch({ type: UPDATE_TANK_STOCK_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: UPDATE_TANK_STOCK_FAILURE, payload: error.message });
  }
};

export const deleteTankStock = (id) => async (dispatch) => {
  try {
    await axiosInstance.delete(`/tankstock/${id}`);
    dispatch({ type: DELETE_TANK_STOCK_SUCCESS, payload: id });
  } catch (error) {
    dispatch({ type: DELETE_TANK_STOCK_FAILURE, payload: error.message });
  }
};

export const createOpeningStock = (params) => async (dispatch) => {
  try {
    // Extract parameters from the params object or use individual parameters
    const tankId = params.tankId || params;
    const amount = params.amount;
    const dateTime = params.dateTime || params.date;
    const openingMeter = params.openingMeter;

    // Format the date properly for the API
    const formattedDate = dateTime instanceof Date ?
      formatDateTime(dateTime) :
      dateTime;

    // Build query string with optional meter reading
    let queryString = `tankId=${tankId}&amount=${amount}&dateTime=${formattedDate}`;
    if (openingMeter !== null && openingMeter !== undefined) {
      queryString += `&openingMeter=${openingMeter}`;
    }

    const response = await axiosInstance.post(`/tankstock/openingstock?${queryString}`);

    // Check multiple possible success indicators from backend
    if (response.data.success === true || response.data.isSuccess === true) {
      dispatch({ type: CREATE_OPENING_STOCK_SUCCESS, payload: response.data });
      return {
        success: true,
        message: response.data.message || 'Opening stock created successfully',
        data: response.data
      };
    } else {
      // Handle failure case
      const errorMessage = response.data.message || response.data.error || 'Failed to create opening stock';
      dispatch({ type: CREATE_OPENING_STOCK_FAILURE, payload: errorMessage });
      return {
        success: false,
        message: errorMessage,
        data: response.data
      };
    }
  } catch (error) {
    // Handle HTTP error responses (like 400, 500, etc.)
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;
      const errorMessage = errorData?.message || errorData?.error || `HTTP ${error.response.status}: ${error.response.statusText}`;

      dispatch({ type: CREATE_OPENING_STOCK_FAILURE, payload: errorMessage });
      return {
        success: false,
        message: errorMessage,
        data: errorData
      };
    } else {
      // Network or other error
      const errorMessage = error.message || 'Error creating opening stock';
      dispatch({ type: CREATE_OPENING_STOCK_FAILURE, payload: errorMessage });
      return {
        success: false,
        message: errorMessage,
        error: error
      };
    }
  }
};

export const createClosingStock = (params) => async (dispatch) => {
  try {
    // Extract parameters from the params object or use individual parameters
    const tankId = params.tankId || params;
    const amount = params.amount;
    const dateTime = params.dateTime || params.date;
    const closingMeter = params.closingMeter;

    // Format the date properly for the API
    const formattedDate = dateTime instanceof Date ?
      formatDateTime(dateTime) :
      dateTime;

    // Build query string with optional meter reading
    let queryString = `tankId=${tankId}&amount=${amount}&dateTime=${formattedDate}`;
    if (closingMeter !== null && closingMeter !== undefined) {
      queryString += `&closingMeter=${closingMeter}`;
    }
    if (params.confirmOverride) {
      queryString += `&confirmOverride=true`;
    }

    const response = await axiosInstance.post(`/tankstock/closingstock?${queryString}`);
    if (response.data.success) {
      dispatch({ type: CREATE_CLOSING_STOCK_SUCCESS, payload: response.data });
      return response.data;
    } else {
      dispatch({ type: CREATE_CLOSING_STOCK_FAILURE, payload: response.data.message });
      return response.data;
    }

  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Error Creating closing Stock";
    dispatch({ type: CREATE_CLOSING_STOCK_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

export const createTankTransfer = (tankTransferDTO) => async (dispatch) => {
  try {
    // Validate required fields before API call
    if (!tankTransferDTO.sourceTankId || tankTransferDTO.sourceTankId <= 0) {
      const error = 'Invalid source tank ID';
      dispatch({ type: CREATE_TANK_TRANSFER_FAILURE, payload: error });
      return { success: false, message: error };
    }

    if (!tankTransferDTO.destinationTankId || tankTransferDTO.destinationTankId <= 0) {
      const error = 'Invalid destination tank ID';
      dispatch({ type: CREATE_TANK_TRANSFER_FAILURE, payload: error });
      return { success: false, message: error };
    }

    if (tankTransferDTO.sourceTankId === tankTransferDTO.destinationTankId) {
      const error = 'Source and destination tanks must be different';
      dispatch({ type: CREATE_TANK_TRANSFER_FAILURE, payload: error });
      return { success: false, message: error };
    }

    if (!tankTransferDTO.amount || tankTransferDTO.amount <= 0) {
      const error = 'Transfer amount must be greater than 0';
      dispatch({ type: CREATE_TANK_TRANSFER_FAILURE, payload: error });
      return { success: false, message: error };
    }

    const response = await axiosInstance.post('/tankstock/transfer', tankTransferDTO);

    if (response.data.success) {
      dispatch({ type: CREATE_TANK_TRANSFER_SUCCESS, payload: response.data });
      return response.data;
    } else {
      dispatch({ type: CREATE_TANK_TRANSFER_FAILURE, payload: response.data.message });
      return response.data;
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error creating tank transfer';
    dispatch({ type: CREATE_TANK_TRANSFER_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
}

export const fetchStockDiscrepancies = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_STOCK_DISCREPANCIES_REQUEST });

    const params = new URLSearchParams();
    if (filters.siteId) params.append('siteId', filters.siteId);
    if (filters.threshold !== undefined) params.append('threshold', filters.threshold);

    const response = await axiosInstance.get(`/tankstock/discrepancies?${params.toString()}`);

    if (response.data.isSuccess) {
      dispatch({
        type: FETCH_STOCK_DISCREPANCIES_SUCCESS,
        payload: response.data.data || response.data
      });
      return { success: true, data: response.data.data || response.data };
    } else {
      dispatch({
        type: FETCH_STOCK_DISCREPANCIES_FAILURE,
        payload: response.data.message || 'Failed to fetch stock discrepancies'
      });
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching stock discrepancies';
    dispatch({ type: FETCH_STOCK_DISCREPANCIES_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

// Stock Adjustments Actions
export const createStockAdjustment = (adjustmentData) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_STOCK_ADJUSTMENT_REQUEST });

    const response = await axiosInstance.post('/tankstock/adjustments', adjustmentData);

    if (response.data.isSuccess) {
      dispatch({ type: CREATE_STOCK_ADJUSTMENT_SUCCESS, payload: response.data.data });
      return { success: true, data: response.data.data, message: response.data.message };
    } else {
      dispatch({ type: CREATE_STOCK_ADJUSTMENT_FAILURE, payload: response.data.message });
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error creating stock adjustment';
    dispatch({ type: CREATE_STOCK_ADJUSTMENT_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

export const fetchStockAdjustments = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_STOCK_ADJUSTMENTS_REQUEST });

    const params = new URLSearchParams();
    if (filters.siteId) params.append('siteId', filters.siteId);
    if (filters.tankId) params.append('tankId', filters.tankId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await axiosInstance.get(`/tankstock/adjustments?${params.toString()}`);

    if (response.data.isSuccess) {
      dispatch({ type: FETCH_STOCK_ADJUSTMENTS_SUCCESS, payload: response.data.data || response.data });
      return { success: true, data: response.data.data || response.data };
    } else {
      dispatch({ type: FETCH_STOCK_ADJUSTMENTS_FAILURE, payload: response.data.message });
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching stock adjustments';
    dispatch({ type: FETCH_STOCK_ADJUSTMENTS_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

// Enhanced reconcile stocks action
export const reconcileStocks = (reconciliationData) => async (dispatch) => {
  try {
    dispatch({ type: RECONCILE_STOCKS_REQUEST });

    const response = await axiosInstance.post('/tankstock/reconcile', {
      siteId: reconciliationData.siteId,
      userId: reconciliationData.userId
    });

    if (response.data.isSuccess) {
      dispatch({ type: RECONCILE_STOCKS_SUCCESS, payload: response.data.data });

      // Refresh discrepancies after successful reconciliation
      if (reconciliationData.siteId) {
        dispatch(fetchStockDiscrepancies({ siteId: reconciliationData.siteId }));
      }

      return { success: true, data: response.data.data, message: response.data.message };
    } else {
      dispatch({ type: RECONCILE_STOCKS_FAILURE, payload: response.data.message });
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error reconciling stocks';
    dispatch({ type: RECONCILE_STOCKS_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

// Stock Report Generation
export const generateStockReport = (reportParams) => async (dispatch) => {
  try {
    dispatch({ type: GENERATE_STOCK_REPORT_REQUEST });

    const response = await axiosInstance.post('/stockreport/generate', reportParams);

    if (response.data.isSuccess) {
      dispatch({ type: GENERATE_STOCK_REPORT_SUCCESS, payload: response.data.data });
      return { success: true, data: response.data.data, message: response.data.message };
    } else {
      dispatch({ type: GENERATE_STOCK_REPORT_FAILURE, payload: response.data.message });
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error generating stock report';
    dispatch({ type: GENERATE_STOCK_REPORT_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

// =========================
// Dispensing Volume Actions
// =========================

export const createDispensingVolume = (params) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_DISPENSING_VOLUME_REQUEST });

    const { tankId, dispensedVolume, entryDate, notes } = params;
    const formattedDate = entryDate instanceof Date ? formatDateTime(entryDate) : entryDate;

    const queryParams = new URLSearchParams();
    queryParams.append('tankId', tankId);
    queryParams.append('dispensedVolume', dispensedVolume);
    queryParams.append('entryDate', formattedDate);
    if (notes) queryParams.append('notes', notes);

    const response = await axiosInstance.post(`/tankstock/dispensing?${queryParams.toString()}`);

    if (response.data.success === true || response.data.isSuccess === true) {
      dispatch({ type: CREATE_DISPENSING_VOLUME_SUCCESS, payload: response.data });
      return {
        success: true,
        message: response.data.message || 'Dispensing volume recorded successfully',
        data: response.data
      };
    } else {
      const errorMessage = response.data.message || response.data.error || 'Failed to create dispensing volume';
      dispatch({ type: CREATE_DISPENSING_VOLUME_FAILURE, payload: errorMessage });
      return {
        success: false,
        message: errorMessage,
        data: response.data
      };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error creating dispensing volume';
    dispatch({ type: CREATE_DISPENSING_VOLUME_FAILURE, payload: errorMessage });
    return {
      success: false,
      message: errorMessage
    };
  }
};

export const fetchDispensingVolumes = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_DISPENSING_VOLUMES_REQUEST });

    const params = new URLSearchParams();
    if (filters.siteId) params.append('siteId', filters.siteId);
    if (filters.tankId) params.append('tankId', filters.tankId);
    if (filters.recordedBy) params.append('recordedBy', filters.recordedBy);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await axiosInstance.get(`/tankstock/dispensing?${params.toString()}`);

    dispatch({ type: FETCH_DISPENSING_VOLUMES_SUCCESS, payload: response.data });
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching dispensing volumes';
    dispatch({ type: FETCH_DISPENSING_VOLUMES_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

export const updateDispensingVolume = (params) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_DISPENSING_VOLUME_REQUEST });

    const { entryId, dispensedVolume, entryDate, notes } = params;
    const formattedDate = entryDate instanceof Date ? formatDateTime(entryDate) : entryDate;

    const queryParams = new URLSearchParams();
    queryParams.append('dispensedVolume', dispensedVolume);
    queryParams.append('entryDate', formattedDate);
    if (notes) queryParams.append('notes', notes);

    const response = await axiosInstance.put(`/tankstock/dispensing/${entryId}?${queryParams.toString()}`);

    if (response.data.success === true || response.data.isSuccess === true) {
      dispatch({ type: UPDATE_DISPENSING_VOLUME_SUCCESS, payload: response.data });
      return {
        success: true,
        message: response.data.message || 'Dispensing volume updated successfully'
      };
    } else {
      const errorMessage = response.data.message || 'Failed to update dispensing volume';
      dispatch({ type: UPDATE_DISPENSING_VOLUME_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error updating dispensing volume';
    dispatch({ type: UPDATE_DISPENSING_VOLUME_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

export const deleteDispensingVolume = (entryId) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_DISPENSING_VOLUME_REQUEST });

    const response = await axiosInstance.delete(`/tankstock/dispensing/${entryId}`);

    if (response.data.success === true || response.data.isSuccess === true) {
      dispatch({ type: DELETE_DISPENSING_VOLUME_SUCCESS, payload: entryId });
      return {
        success: true,
        message: response.data.message || 'Dispensing volume deleted successfully'
      };
    } else {
      const errorMessage = response.data.message || 'Failed to delete dispensing volume';
      dispatch({ type: DELETE_DISPENSING_VOLUME_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error deleting dispensing volume';
    dispatch({ type: DELETE_DISPENSING_VOLUME_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

/**
 * Fetches variance analysis data for a specific tank and date range
 * @param {number} tankId - Tank ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {boolean} useManualDispensing - Use manual dispensing from TankStock
 * @param {boolean} useCombinedDispensing - Use combined dispensing (TankVolumeHistory + TankStock gaps)
 * @returns {Promise} Response with variance analysis data
 */
export const fetchVarianceAnalysis = (
  tankId,
  startDate,
  endDate,
  useManualDispensing = false,
  useCombinedDispensing = false
) => async (dispatch) => {
  try {
    // Validate parameters before API call
    if (!tankId || tankId <= 0) {
      const errorMessage = 'Invalid tank ID';
      dispatch({ type: FETCH_VARIANCE_ANALYSIS_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }

    if (!startDate || !endDate) {
      const errorMessage = 'Start date and end date are required';
      dispatch({ type: FETCH_VARIANCE_ANALYSIS_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }

    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      const errorMessage = 'Invalid date format';
      dispatch({ type: FETCH_VARIANCE_ANALYSIS_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }

    if (startDate >= endDate) {
      const errorMessage = 'Start date must be before end date';
      dispatch({ type: FETCH_VARIANCE_ANALYSIS_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }

    // Validate mutually exclusive dispensing modes
    if (useManualDispensing && useCombinedDispensing) {
      const errorMessage = 'Cannot use both manual and combined dispensing modes';
      dispatch({ type: FETCH_VARIANCE_ANALYSIS_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }

    dispatch({ type: FETCH_VARIANCE_ANALYSIS_REQUEST });

    // Convert dates to ISO format (UTC)
    const params = new URLSearchParams({
      tankId: tankId.toString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      useManualDispensing: useManualDispensing.toString(),
      useCombinedDispensing: useCombinedDispensing.toString()
    });

    const response = await axiosInstance.get(`/tankstock/variance-analysis?${params.toString()}`);

    if (response.data.isSuccess) {
      // Normalize data - ensure dailyData is always an array
      const normalizedData = {
        ...response.data.data,
        dailyData: response.data.data?.dailyData || []
      };

      dispatch({
        type: FETCH_VARIANCE_ANALYSIS_SUCCESS,
        payload: normalizedData
      });

      return {
        success: true,
        data: normalizedData,
        message: response.data.message || 'Variance analysis loaded successfully'
      };
    } else {
      const errorMessage = response.data.message || 'Failed to fetch variance analysis';
      dispatch({ type: FETCH_VARIANCE_ANALYSIS_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching variance analysis';
    dispatch({ type: FETCH_VARIANCE_ANALYSIS_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

/**
 * Fetch delivery cycle analysis with consumption rates
 * Supports single tank or multiple tanks for site-level analysis
 * @param {number|number[]} tankIdOrIds - Single tank ID or array of tank IDs
 * @param {Date} startDate - Analysis start date
 * @param {Date} endDate - Analysis end date
 * @param {string} analysisType - Type of analysis: 'BetweenDeliveries', 'Monthly', 'UntilNextDelivery', 'Custom'
 * @param {boolean} useManualDispensing - Use manual dispensing from TankStock
 * @param {boolean} useCombinedDispensing - Use combined dispensing (TankVolumeHistory + TankStock gaps)
 * @returns {Promise} Response with delivery cycle analysis data including consumption rates
 */
export const fetchDeliveryCycleAnalysis = (
  tankIdOrIds,
  startDate,
  endDate,
  analysisType = 'BetweenDeliveries',
  useManualDispensing = false,
  useCombinedDispensing = false
) => async (dispatch) => {
  try {
    // Support both single tank ID and array of tank IDs
    const tankIds = Array.isArray(tankIdOrIds) ? tankIdOrIds : [tankIdOrIds];
    const isSingleTank = tankIds.length === 1;

    // Validate parameters before API call
    if (!tankIds || tankIds.length === 0 || tankIds.some(id => !id || id <= 0)) {
      const errorMessage = 'Invalid tank ID(s)';
      dispatch({ type: FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }

    if (!startDate || !endDate) {
      const errorMessage = 'Start date and end date are required';
      dispatch({ type: FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }

    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      const errorMessage = 'Invalid date format';
      dispatch({ type: FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }

    if (startDate >= endDate) {
      const errorMessage = 'Start date must be before end date';
      dispatch({ type: FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }

    const validAnalysisTypes = ['BetweenDeliveries', 'Monthly', 'UntilNextDelivery', 'Custom'];
    if (!validAnalysisTypes.includes(analysisType)) {
      const errorMessage = `Invalid analysis type. Must be one of: ${validAnalysisTypes.join(', ')}`;
      dispatch({ type: FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }

    // Validate mutually exclusive dispensing modes
    if (useManualDispensing && useCombinedDispensing) {
      const errorMessage = 'Cannot use both manual and combined dispensing modes';
      dispatch({ type: FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }

    dispatch({ type: FETCH_DELIVERY_CYCLE_ANALYSIS_REQUEST });

    // Build parameters - use tankId for single tank (backward compatible), tankIds for multiple
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      analysisType: analysisType,
      useManualDispensing: useManualDispensing.toString(),
      useCombinedDispensing: useCombinedDispensing.toString()
    });

    // Add tank ID(s) appropriately
    if (isSingleTank) {
      params.append('tankId', tankIds[0].toString());
    } else {
      tankIds.forEach(id => params.append('tankIds', id.toString()));
    }

    const response = await axiosInstance.get(`/tankstock/delivery-cycle-analysis?${params.toString()}`);

    if (response.data.isSuccess) {
      // Normalize data - ensure cycles is always an array
      const normalizedData = {
        ...response.data.data,
        cycles: response.data.data?.cycles || [],
        summary: response.data.data?.summary || {}
      };

      dispatch({
        type: FETCH_DELIVERY_CYCLE_ANALYSIS_SUCCESS,
        payload: normalizedData
      });

      return {
        success: true,
        data: normalizedData,
        message: response.data.message || 'Delivery cycle analysis loaded successfully'
      };
    } else {
      const errorMessage = response.data.message || 'Failed to fetch delivery cycle analysis';
      dispatch({ type: FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching delivery cycle analysis';
    dispatch({ type: FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

/**
 * Fetch transfer reconciliation analysis for a tank
 * @param {number} tankId - Tank ID to analyze
 * @param {Date} startDate - Start date of analysis period
 * @param {Date} endDate - End date of analysis period
 * @param {boolean} includeTransferDetails - Whether to include detailed transfer transactions
 */
export const fetchTransferReconciliation = (tankId, startDate, endDate, includeTransferDetails = false) => async (dispatch) => {
  try {
    // Validation
    if (!tankId || tankId <= 0) {
      const errorMessage = 'Valid tank ID is required';
      dispatch({ type: FETCH_TRANSFER_RECONCILIATION_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }

    if (!startDate || !endDate) {
      const errorMessage = 'Start date and end date are required';
      dispatch({ type: FETCH_TRANSFER_RECONCILIATION_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }

    if (startDate >= endDate) {
      const errorMessage = 'Start date must be before end date';
      dispatch({ type: FETCH_TRANSFER_RECONCILIATION_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }

    dispatch({ type: FETCH_TRANSFER_RECONCILIATION_REQUEST });

    // Build query parameters
    const params = new URLSearchParams({
      tankId: tankId.toString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      includeTransferDetails: includeTransferDetails.toString()
    });

    const response = await axiosInstance.get(`/tankstock/transfer-reconciliation?${params.toString()}`);

    if (response.data.isSuccess) {
      // Normalize data - ensure periods is always an array
      const normalizedData = {
        ...response.data.data,
        periods: response.data.data?.periods || [],
        summary: response.data.data?.summary || {}
      };

      dispatch({
        type: FETCH_TRANSFER_RECONCILIATION_SUCCESS,
        payload: normalizedData
      });

      return {
        success: true,
        data: normalizedData,
        message: response.data.message || 'Transfer reconciliation analysis loaded successfully'
      };
    } else {
      const errorMessage = response.data.message || 'Failed to fetch transfer reconciliation analysis';
      dispatch({ type: FETCH_TRANSFER_RECONCILIATION_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching transfer reconciliation analysis';
    dispatch({ type: FETCH_TRANSFER_RECONCILIATION_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

/**
 * Clear transfer reconciliation data from state
 */
export const clearTransferReconciliation = () => {
  return {
    type: CLEAR_TRANSFER_RECONCILIATION
  };
};

/**
 * Fetch period diagnostic data for a specific tank and time period
 * Combines TankStock, TankVolumeHistory, and TankTransfers for comprehensive analysis
 *
 * @param {number} tankId - Tank ID to analyze
 * @param {Date} startDate - Period start date
 * @param {Date} endDate - Period end date
 * @param {boolean} includeAllTransactionTypes - Include adjustments & reconciliations (default: true)
 * @param {boolean} includeDeletedRecords - Include soft-deleted records (default: false)
 * @returns {Promise<Object>} Result with diagnostic data or error message
 */
export const fetchPeriodDiagnostic = (
  tankId,
  startDate,
  endDate,
  includeAllTransactionTypes = true,
  includeDeletedRecords = false
) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_PERIOD_DIAGNOSTIC_REQUEST });

    console.log('🔍 Fetching period diagnostic:', {
      tankId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      includeAllTransactionTypes,
      includeDeletedRecords
    });

    // Build query parameters
    const params = new URLSearchParams({
      tankId: tankId.toString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      includeAllTransactionTypes: includeAllTransactionTypes.toString(),
      includeDeletedRecords: includeDeletedRecords.toString()
    });

    const response = await axiosInstance.get(`/tankstockreports/period-diagnostic?${params.toString()}`);

    if (response.data.isSuccess) {
      const diagnosticData = response.data.data;

      console.log('✅ Period diagnostic loaded:', diagnosticData);

      dispatch({
        type: FETCH_PERIOD_DIAGNOSTIC_SUCCESS,
        payload: diagnosticData
      });

      return {
        success: true,
        data: diagnosticData,
        message: response.data.message || 'Period diagnostic data loaded successfully'
      };
    } else {
      const errorMessage = response.data.message || 'Failed to fetch period diagnostic data';
      dispatch({ type: FETCH_PERIOD_DIAGNOSTIC_FAILURE, payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  } catch (error) {
    console.error('❌ Error fetching period diagnostic:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Error fetching period diagnostic data';
    dispatch({ type: FETCH_PERIOD_DIAGNOSTIC_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

/**
 * Clear period diagnostic data from state
 */
export const clearPeriodDiagnostic = () => {
  return {
    type: CLEAR_PERIOD_DIAGNOSTIC
  };
};
