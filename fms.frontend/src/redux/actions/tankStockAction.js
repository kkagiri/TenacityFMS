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

export const updateTankStock = (id, tankStock) => async (dispatch) => {
  try {
    const response = await axiosInstance.put(`/tankstock/${id}`, tankStock);
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

    // Format the date properly for the API
    const formattedDate = dateTime instanceof Date ?
      formatDateTime(dateTime) :
      dateTime;

    const response = await axiosInstance.post(`/tankstock/openingstock?tankId=${tankId}&amount=${amount}&dateTime=${formattedDate}`);

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

    // Format the date properly for the API
    const formattedDate = dateTime instanceof Date ?
      formatDateTime(dateTime) :
      dateTime;

    const response = await axiosInstance.post(`/tankstock/closingstock?tankId=${tankId}&amount=${amount}&dateTime=${formattedDate}`);
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
