import axiosInstance from './../../api/axiosInstance';

export const CREATE_CLOSING_STOCK_SUCCESS = 'CREATE_CLOSING_STOCK_SUCCESS';
export const CREATE_CLOSING_STOCK_FAILURE = 'CREATE_CLOSING_STOCK_FAILURE';
export const CREATE_CLOSING_STOCK_REQUEST = 'CREATE_CLOSING_STOCK_REQUEST';

const formatDateTime = (date) => {
  if (!date) return new Date().toISOString();

  // If date is already a string, return it
  if (typeof date === 'string') return date;

  // Convert Date object to ISO string
  return new Date(date).toISOString();
};

export const createClosingStock = (formData) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_CLOSING_STOCK_REQUEST });

    // Validate required fields
    if (!formData.tankId || formData.tankId <= 0) {
      const error = 'Invalid Tank ID';
      dispatch({ type: CREATE_CLOSING_STOCK_FAILURE, payload: error });
      return { success: false, message: error };
    }

    if (!formData.amount || formData.amount <= 0) {
      const error = 'Closing stock amount must be greater than 0';
      dispatch({ type: CREATE_CLOSING_STOCK_FAILURE, payload: error });
      return { success: false, message: error };
    }

    const formattedDate = formatDateTime(formData.date);

    // API call matches TankStockController endpoint: /tankstock/closingstock
    const response = await axiosInstance.post(
      `/tankstock/closingstock?tankId=${formData.tankId}&amount=${formData.amount}&dateTime=${formattedDate}`
    );

    if (response.data.success) {
      dispatch({
        type: CREATE_CLOSING_STOCK_SUCCESS,
        payload: response.data
      });
      return response.data;
    } else {
      dispatch({
        type: CREATE_CLOSING_STOCK_FAILURE,
        payload: response.data.message || 'Failed to create closing stock'
      });
      return response.data;
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error creating closing stock';
    dispatch({
      type: CREATE_CLOSING_STOCK_FAILURE,
      payload: errorMessage
    });
    return { success: false, message: errorMessage };
  }
};
