import deliveryApi from '../../api/deliveryApi';

const formatLocalDateTimeForApi = (dateInput) => {
    if (!dateInput) return null;

    const toLocalDateTimeString = (dateValue) => {
        if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) {
            return null;
        }

        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateValue.getDate()).padStart(2, '0');
        const hours = String(dateValue.getHours()).padStart(2, '0');
        const minutes = String(dateValue.getMinutes()).padStart(2, '0');
        const seconds = String(dateValue.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    if (dateInput instanceof Date) {
        return toLocalDateTimeString(dateInput);
    }

    if (typeof dateInput === 'string') {
        const trimmedDate = dateInput.trim();
        if (!trimmedDate) return null;

        // If an offset/Z is present, convert to local wall-clock time for consistent backend storage.
        const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(trimmedDate);
        if (hasTimezone) {
            return toLocalDateTimeString(new Date(trimmedDate));
        }

        // Already local datetime string; strip milliseconds if present.
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(trimmedDate)) {
            return trimmedDate.split('.')[0];
        }

        // Date-only input.
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
            return `${trimmedDate}T00:00:00`;
        }

        return toLocalDateTimeString(new Date(trimmedDate));
    }

    return null;
};

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

export const fetchDeliveriesbyDateRange = (startDate, endDate) => async (dispatch) => {
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

export const fetchDeliveriesbyDateRangebySiteId = (startDate, endDate, siteId) => async (dispatch) => {
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
        const normalizedDeliveryDTO = {
            ...deliveryDTO,
            deliveryDate: formatLocalDateTimeForApi(deliveryDTO.deliveryDate),
        };

        // Validate required fields before API call
        if (!normalizedDeliveryDTO.tankId || normalizedDeliveryDTO.tankId <= 0) {
            const error = 'Invalid Tank ID';
            dispatch({ type: CREATE_DELIVERY_FAILURE, payload: error });
            return { success: false, message: error };
        }

        if (!normalizedDeliveryDTO.manualDeliveryAmount || normalizedDeliveryDTO.manualDeliveryAmount <= 0) {
            const error = 'Delivery amount must be greater than 0';
            dispatch({ type: CREATE_DELIVERY_FAILURE, payload: error });
            return { success: false, message: error };
        }

        if (!normalizedDeliveryDTO.supplierId || normalizedDeliveryDTO.supplierId <= 0) {
            const error = 'Valid supplier is required';
            dispatch({ type: CREATE_DELIVERY_FAILURE, payload: error });
            return { success: false, message: error };
        }

        if (normalizedDeliveryDTO.stockBeforeDelivery < 0) {
            const error = 'Stock before delivery cannot be negative';
            dispatch({ type: CREATE_DELIVERY_FAILURE, payload: error });
            return { success: false, message: error };
        }

        const response = await deliveryApi.createDelivery(normalizedDeliveryDTO);

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
        const normalizedCorrectionData = {
            ...correctionData,
            deliveryDate: formatLocalDateTimeForApi(correctionData.deliveryDate),
        };

        const response = await deliveryApi.updateDelivery(originalDeliveryId, normalizedCorrectionData);
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
