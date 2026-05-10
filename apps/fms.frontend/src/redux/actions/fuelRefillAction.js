import axiosInstance from './../../api/axiosInstance';

const formatLocalDateTime = (value) => {
    if (!value) {
        return value;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const serializeFuelRefillPayload = (fuelRefill) => ({
    ...fuelRefill,
    date: formatLocalDateTime(fuelRefill?.date),
});


export const FETCH_FUEL_REFILLS_SUCCESS = 'FETCH_FUEL_REFILLS_SUCCESS';
export const FETCH_FUEL_REFILLS_FAILURE = 'FETCH_FUEL_REFILLS_FAILURE';
export const CREATE_FUEL_REFILL_SUCCESS = 'CREATE_FUEL_REFILL_SUCCESS';
export const CREATE_FUEL_REFILL_FAILURE = 'CREATE_FUEL_REFILL_FAILURE';
export const UPDATE_FUEL_REFILL_SUCCESS = 'UPDATE_FUEL_REFILL_SUCCESS';
export const UPDATE_FUEL_REFILL_FAILURE = 'UPDATE_FUEL_REFILL_FAILURE';
export const DELETE_FUEL_REFILL_SUCCESS = 'DELETE_FUEL_REFILL_SUCCESS';
export const DELETE_FUEL_REFILL_FAILURE = 'DELETE_FUEL_REFILL_FAILURE';


//Cursor - Enhanced fetchFuelRefills with filtering support
export const fetchFuelRefills = (take = 100, dateRange = null, siteId = 'all') => async (dispatch) => {
    try {
        let url = `/fuelrefill?take=${take}`;

        // Add date range parameters if provided
        if (dateRange && dateRange.length === 2) {
            const startDate = dateRange[0].toISOString().split('T')[0];
            const endDate = dateRange[1].toISOString().split('T')[0];
            url += `&startDate=${startDate}&endDate=${endDate}`;
        }

        // Add site filter if not 'all'
        if (siteId && siteId !== 'all') {
            url += `&siteId=${siteId}`;
        }

        const response = await axiosInstance.get(url);
        dispatch({ type: FETCH_FUEL_REFILLS_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_FUEL_REFILLS_FAILURE, payload: error.message });
    }
};

export const fetchFuelRefillsbyDateRange = (startDate, endDate) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/fuelrefill?startDate=${startDate}&endDate=${endDate}`);
        dispatch({ type: FETCH_FUEL_REFILLS_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_FUEL_REFILLS_FAILURE, payload: error.message });
    }
};




export const createFuelRefill = (fuelRefill) => async (dispatch) => {
    try {
        const payload = serializeFuelRefillPayload(fuelRefill);

        // Use extended timeout for this operation as it involves multiple DB operations
        // on the backend (validation, tank history updates, etc.)
        const response = await axiosInstance.post('/fuelrefill', payload, {
            timeout: 60000 // 60 seconds timeout for slow networks
        });

        // Check if the response indicates success
        if (response.data && response.data.success === true) {
            dispatch({ type: CREATE_FUEL_REFILL_SUCCESS, payload: response.data.message });
            return { success: true, message: response.data.message };
        } else {
            // Handle case where response is received but indicates failure
            const errorMessage = response.data?.message || 'Failed to create fuel refill';
            dispatch({ type: CREATE_FUEL_REFILL_FAILURE, payload: errorMessage });
            return { success: false, message: errorMessage };
        }
    } catch (error) {
        // Handle HTTP errors (4xx, 5xx status codes)
        let errorMessage;

        if (error.response) {
            // Server responded with error status
            if (error.response.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data.errors) {
                    // Handle validation errors
                    const errors = error.response.data.errors;
                    errorMessage = Object.values(errors).flat().join(', ');
                } else {
                    errorMessage = `Server error: ${error.response.status}`;
                }
            } else {
                errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
            }
        } else if (error.code === 'ECONNABORTED') {
            // Timeout error - request took too long
            errorMessage = 'Request timeout: The server is taking too long to respond. Please try again.';
        } else if (error.request) {
            // Network error - no response received
            errorMessage = 'Network error: Unable to connect to server. Please check your connection.';
        } else {
            // Other errors
            errorMessage = error.message || 'An unexpected error occurred';
        }

        dispatch({ type: CREATE_FUEL_REFILL_FAILURE, payload: errorMessage });
        return { success: false, message: errorMessage };
    }
};

export const updateFuelRefill = (id, fuelRefill) => async (dispatch) => {
    try {
        const payload = serializeFuelRefillPayload(fuelRefill);

        // Use extended timeout for this operation as it involves multiple DB operations
        const response = await axiosInstance.put(`/fuelrefill/${id}`, payload, {
            timeout: 60000 // 60 seconds timeout for slow networks
        });
        dispatch({ type: UPDATE_FUEL_REFILL_SUCCESS, payload: { id, fuelRefill } });
        return { success: true, message: response.data.message };

    } catch (error) {
        let errorMessage;
        if (error.code === 'ECONNABORTED') {
            errorMessage = 'Request timeout: The server is taking too long to respond. Please try again.';
        } else {
            errorMessage = error.response?.data?.message || error.message;
        }
        dispatch({ type: UPDATE_FUEL_REFILL_FAILURE, payload: errorMessage });
        return { success: false, message: errorMessage };
    }
};

export const deleteFuelRefill = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/fuelrefill/${id}`);
        dispatch({ type: DELETE_FUEL_REFILL_SUCCESS, payload: id });
    } catch (error) {
        dispatch({ type: DELETE_FUEL_REFILL_FAILURE, payload: error.message });
    }
};