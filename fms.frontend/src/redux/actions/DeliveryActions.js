import deliveryApi from '../../api/deliveryApi';

export const FETCH_DELIVERIES_REQUEST = 'FETCH_DELIVERIES_REQUEST';
export const FETCH_DELIVERIES_SUCCESS = 'FETCH_DELIVERIES_SUCCESS';
export const FETCH_DELIVERIES_FAILURE = 'FETCH_DELIVERIES_FAILURE';

export const CREATE_DELIVERY_REQUEST = 'CREATE_DELIVERY_REQUEST';
export const CREATE_DELIVERY_SUCCESS = 'CREATE_DELIVERY_SUCCESS';
export const CREATE_DELIVERY_FAILURE = 'CREATE_DELIVERY_FAILURE';

export const UPDATE_DELIVERY_REQUEST = 'UPDATE_DELIVERY_REQUEST';
export const UPDATE_DELIVERY_SUCCESS = 'UPDATE_DELIVERY_SUCCESS';
export const UPDATE_DELIVERY_FAILURE = 'UPDATE_DELIVERY_FAILURE';

export const DELETE_DELIVERY_REQUEST = 'DELETE_DELIVERY_REQUEST';
export const DELETE_DELIVERY_SUCCESS = 'DELETE_DELIVERY_SUCCESS';
export const DELETE_DELIVERY_FAILURE = 'DELETE_DELIVERY_FAILURE';

export const CLEAR_DELIVERY_ERROR = 'CLEAR_DELIVERY_ERROR';


export const fetchDeliveries = () => async (dispatch) => {
    dispatch({ type: FETCH_DELIVERIES_REQUEST });
    try {
        const response = await deliveryApi.getDeliveries();
        dispatch({ type: FETCH_DELIVERIES_SUCCESS, payload: response });
        return response;
    } catch (error) {
        dispatch({ type: FETCH_DELIVERIES_FAILURE, payload: error.message });
        throw error;
    }
};

export const fetchDeliveriesbyDateRange = (startDate,endDate) => async (dispatch) => {
    dispatch({ type: FETCH_DELIVERIES_REQUEST });
    try {
        const response = await deliveryApi.getDeliveriesByDateRange(startDate, endDate);
        dispatch({ type: FETCH_DELIVERIES_SUCCESS, payload: response });
        return response;
    } catch (error) {
        dispatch({ type: FETCH_DELIVERIES_FAILURE, payload: error.message });
        throw error;
    }
};

export const fetchDeliveriesbyDateRangebySiteId = (startDate,endDate,siteId) => async (dispatch) => {
    dispatch({ type: FETCH_DELIVERIES_REQUEST });
    try {
        const response = await deliveryApi.getDeliveriesByDateRangeAndSite(startDate, endDate, siteId);
        dispatch({ type: FETCH_DELIVERIES_SUCCESS, payload: response });
        return response;
    } catch (error) {
        dispatch({ type: FETCH_DELIVERIES_FAILURE, payload: error.message });
        throw error;
    }
};

export const createDelivery = (deliveryDTO) => async (dispatch) => {
    dispatch({ type: CREATE_DELIVERY_REQUEST });
    try {
        // Validate required fields before API call
        if (!deliveryDTO.tankId || deliveryDTO.tankId <= 0) {
            const error = 'Invalid Tank ID';
            dispatch({ type: CREATE_DELIVERY_FAILURE, payload: error });
            return { success: false, message: error };
        }

        if (!deliveryDTO.manualDeliveryAmount || deliveryDTO.manualDeliveryAmount <= 0) {
            const error = 'Delivery amount must be greater than 0';
            dispatch({ type: CREATE_DELIVERY_FAILURE, payload: error });
            return { success: false, message: error };
        }

        if (!deliveryDTO.supplierId || deliveryDTO.supplierId <= 0) {
            const error = 'Valid supplier is required';
            dispatch({ type: CREATE_DELIVERY_FAILURE, payload: error });
            return { success: false, message: error };
        }

        if (deliveryDTO.stockBeforeDelivery < 0) {
            const error = 'Stock before delivery cannot be negative';
            dispatch({ type: CREATE_DELIVERY_FAILURE, payload: error });
            return { success: false, message: error };
        }

        const response = await deliveryApi.createDelivery(deliveryDTO);

        if (response.success) {
            dispatch({ type: CREATE_DELIVERY_SUCCESS, payload: response });
            return response;
        } else {
            dispatch({ type: CREATE_DELIVERY_FAILURE, payload: response.message });
            return response;
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Error creating delivery';
        dispatch({ type: CREATE_DELIVERY_FAILURE, payload: errorMessage });
        return { success: false, message: errorMessage };
    }
};

// Update delivery (correction-based)
export const updateDelivery = (originalDeliveryId, correctionData) => async (dispatch) => {
    dispatch({ type: UPDATE_DELIVERY_REQUEST });
    try {
        const response = await deliveryApi.updateDelivery(originalDeliveryId, correctionData);
        if (response.success) {
            dispatch({ type: UPDATE_DELIVERY_SUCCESS, payload: response });
            return response;
        } else {
            dispatch({ type: UPDATE_DELIVERY_FAILURE, payload: response.message });
            throw new Error(response.message || 'Failed to update delivery');
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Error updating delivery';
        dispatch({ type: UPDATE_DELIVERY_FAILURE, payload: errorMessage });
        throw error;
    }
};

// Soft delete delivery
export const deleteDelivery = (deliveryId) => async (dispatch) => {
    dispatch({ type: DELETE_DELIVERY_REQUEST });
    try {
        const response = await deliveryApi.softDeleteDelivery(deliveryId);
        if (response.success) {
            dispatch({ type: DELETE_DELIVERY_SUCCESS, payload: { deliveryId, response } });
            return response;
        } else {
            dispatch({ type: DELETE_DELIVERY_FAILURE, payload: response.message });
            throw new Error(response.message || 'Failed to delete delivery');
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Error deleting delivery';
        dispatch({ type: DELETE_DELIVERY_FAILURE, payload: errorMessage });
        throw error;
    }
};

// Clear error
export const clearDeliveryError = () => ({
    type: CLEAR_DELIVERY_ERROR
});
