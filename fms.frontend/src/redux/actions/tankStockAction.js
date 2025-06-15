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

const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};
export const fetchTankStocks = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get('/tankstock');
    dispatch({ type: FETCH_TANK_STOCKS_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: FETCH_TANK_STOCKS_FAILURE, payload: error.message });
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

export const createOpeningStock = (tankId, amount,date) => async (dispatch) => {
  try {
  //  const formattedDate = formatDateTime(date);

    const response = await axiosInstance.post(`/tankstock/openingstock?tankId=${tankId}&amount=${amount}&dateTime=${date}`);

    if (response.data.success) {
      dispatch({ type: CREATE_OPENING_STOCK_SUCCESS, payload: response.data });
      return response.data;
    } else {
      dispatch({ type: CREATE_OPENING_STOCK_FAILURE, payload: response.data.message });
      return response.data; // Return the response data even if it's not successful
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error creating opening stock';
    dispatch({ type: CREATE_OPENING_STOCK_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage }; // Return a consistent error object
  }
};

export const createClosingStock = (tankId, amount,date) => async (dispatch) => {
  try {
    const formattedDate = formatDateTime(date);

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
    dispatch({ type: CREATE_CLOSING_STOCK_FAILURE, payload: error.message });
    return { success: false, message: errorMessage };
  }
};

export const createTankTransfer = (tankTransferDTO) => async (dispatch) => {
  try {

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

export const reconcileStocks = (reconciliationData) => async (dispatch) => {
  try {
    const response = await axiosInstance.post('/tankstock/reconcile', {
      siteId: reconciliationData.siteId,
      userId: reconciliationData.userId
    });

    if (response.data.success) {
      // Refresh discrepancies after successful reconciliation
      dispatch(fetchStockDiscrepancies({ siteId: reconciliationData.siteId }));
      return { success: true, data: response.data.data, message: response.data.message };
    } else {
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error reconciling stocks';
    return { success: false, message: errorMessage };
  }
};
