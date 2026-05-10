import axiosInstance from '../../api/axiosInstance';

// Action Types
export const FETCH_CONSUMPTION_SUMMARY_REQUEST = 'FETCH_CONSUMPTION_SUMMARY_REQUEST';
export const FETCH_CONSUMPTION_SUMMARY_SUCCESS = 'FETCH_CONSUMPTION_SUMMARY_SUCCESS';
export const FETCH_CONSUMPTION_SUMMARY_FAILURE = 'FETCH_CONSUMPTION_SUMMARY_FAILURE';
export const CLEAR_CONSUMPTION_SUMMARY = 'CLEAR_CONSUMPTION_SUMMARY';

export const FETCH_VEHICLE_CONSUMPTION_DETAIL_REQUEST = 'FETCH_VEHICLE_CONSUMPTION_DETAIL_REQUEST';
export const FETCH_VEHICLE_CONSUMPTION_DETAIL_SUCCESS = 'FETCH_VEHICLE_CONSUMPTION_DETAIL_SUCCESS';
export const FETCH_VEHICLE_CONSUMPTION_DETAIL_FAILURE = 'FETCH_VEHICLE_CONSUMPTION_DETAIL_FAILURE';
export const CLEAR_VEHICLE_CONSUMPTION_DETAIL = 'CLEAR_VEHICLE_CONSUMPTION_DETAIL';

// Helper function to format date
const formatDate = (date) => {
    if (!date) return null;
    return date.toISOString().split('T')[0]; // Returns 'YYYY-MM-DD'
};

/**
 * Fetch consumption summary data grouped by site and vehicle model
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {number|null} siteId - Optional site ID filter
 * @param {string|null} vehicleType - Optional vehicle type filter
 * @param {string} groupBy - Grouping period: week, month, quarter, year
 */
export const fetchConsumptionSummary = (startDate, endDate, siteId = null, vehicleType = null, groupBy = 'week') => async (dispatch) => {
    dispatch({ type: FETCH_CONSUMPTION_SUMMARY_REQUEST });

    try {
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);

        // Build query parameters
        const params = new URLSearchParams({
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            groupBy: groupBy
        });

        if (siteId) {
            params.append('siteId', siteId.toString());
        }

        if (vehicleType) {
            params.append('vehicleType', vehicleType);
        }

        const response = await axiosInstance.get(`/consumption/summary?${params.toString()}`, {
            timeout: 120000 // 2 minutes timeout for potentially large datasets
        });

        dispatch({
            type: FETCH_CONSUMPTION_SUMMARY_SUCCESS,
            payload: response.data
        });

        return { success: true, data: response.data };
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        dispatch({
            type: FETCH_CONSUMPTION_SUMMARY_FAILURE,
            payload: errorMessage
        });

        return { success: false, message: errorMessage };
    }
};

/**
 * Fetch detailed consumption data for a specific vehicle
 * @param {number} vehicleId - Vehicle ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 */
export const fetchVehicleConsumptionDetail = (vehicleId, startDate, endDate) => async (dispatch) => {
    dispatch({ type: FETCH_VEHICLE_CONSUMPTION_DETAIL_REQUEST });

    try {
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);

        const response = await axiosInstance.get(
            `/consumption/vehicleDetail/${vehicleId}?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
            {
                timeout: 60000 // 1 minute timeout
            }
        );

        dispatch({
            type: FETCH_VEHICLE_CONSUMPTION_DETAIL_SUCCESS,
            payload: response.data
        });

        return { success: true, data: response.data };
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        dispatch({
            type: FETCH_VEHICLE_CONSUMPTION_DETAIL_FAILURE,
            payload: errorMessage
        });

        return { success: false, message: errorMessage };
    }
};

/**
 * Clear consumption summary data
 */
export const clearConsumptionSummary = () => ({
    type: CLEAR_CONSUMPTION_SUMMARY
});

/**
 * Clear vehicle consumption detail data
 */
export const clearVehicleConsumptionDetail = () => ({
    type: CLEAR_VEHICLE_CONSUMPTION_DETAIL
});
