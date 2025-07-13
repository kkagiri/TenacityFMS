import axiosInstance from './../../api/axiosInstance';

export const FETCH_DELIVERIES_SUCCESS = 'FETCH_DELIVERIES_SUCCESS';
export const FETCH_DELIVERIES_FAILURE = 'FETCH_DELIVERIES_FAILURE';

export const CREATE_DELIVERY_SUCCESS = 'CREATE_DELIVERY_SUCCESS';
export const CREATE_DELIVERY_FAILURE = 'CREATE_DELIVERY_FAILURE';


export const fetchDeliveries = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/delivery');
        dispatch({ type: FETCH_DELIVERIES_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_DELIVERIES_FAILURE, payload: error.message });
    }
};

export const fetchDeliveriesbyDateRange = (startDate,endDate) => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/delivery/byDateRange?startDate='+startDate+'&endDate='+endDate);
        dispatch({ type: FETCH_DELIVERIES_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_DELIVERIES_FAILURE, payload: error.message });
    }
};

export const fetchDeliveriesbyDateRangebySiteId = (startDate,endDate,siteId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/delivery/byDateRangebySite?startDate='+startDate+'&endDate='+endDate + '&siteId='+siteId);
        dispatch({ type: FETCH_DELIVERIES_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_DELIVERIES_FAILURE, payload: error.message });
    }
};

export const createDelivery = (deliveryDTO) => async (dispatch) => {
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

        const response = await axiosInstance.post('/delivery/create', deliveryDTO);

        if (response.data.success) {
            dispatch({ type: CREATE_DELIVERY_SUCCESS, payload: response.data });
            return response.data;
        } else {
            dispatch({ type: CREATE_DELIVERY_FAILURE, payload: response.data.message });
            return response.data;
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Error creating delivery';
        dispatch({ type: CREATE_DELIVERY_FAILURE, payload: errorMessage });
        return { success: false, message: errorMessage };
    }
};
