import axiosInstance from './../../api/axiosInstance';

export const FETCH_CONSUMPTION_SUCCESS = 'FETCH_CONSUMPTION_SUCCESS';
export const FETCH_CONSUMPTION_FAILURE = 'FETCH_CONSUMPTION_FAILURE';
export const FETCH_VEHICLE_REFILLS_REQUEST = 'FETCH_VEHICLE_REFILLS_REQUEST';
export const FETCH_VEHICLE_REFILLS_FAILURE = 'FETCH_VEHICLE_REFILLS_FAILURE';

const formatDate = (date) => {
    return date.toISOString().split('T')[0]; // This will return date in 'YYYY-MM-DD' format
  }

export const fetchConsumptionByDateRange = (startDate, endDate) => async (dispatch) => {
    try {
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);
    
        const response = await axiosInstance.get(`/consumption/manualRefills?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
        dispatch({ type: FETCH_CONSUMPTION_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_CONSUMPTION_FAILURE, payload: error.message });
    }
}

export const fetchConsumptionByDateRangebySitId = (startDate, endDate,siteId) => async (dispatch) => {
    try {
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);
    
        const response = await axiosInstance.get(`/consumption/manualRefillsbySiteId?startDate=${formattedStartDate}&endDate=${formattedEndDate}&siteId=${siteId}`);
        dispatch({ type: FETCH_CONSUMPTION_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_CONSUMPTION_FAILURE, payload: error.message });
    }
}

export const fetchConsumptionByDateRangeByVehicleID = (startDate, endDate, vehicleId) => async (dispatch) => {
    try {
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);
    
        const response = await axiosInstance.get(`/consumption/vehicleRefills?startDate=${formattedStartDate}&endDate=${formattedEndDate}&vehicleId=${vehicleId}`);
        dispatch({ type: FETCH_VEHICLE_REFILLS_REQUEST, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_VEHICLE_REFILLS_FAILURE, payload: error.message });
    }
}