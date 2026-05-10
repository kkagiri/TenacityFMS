import axiosInstance from './../../api/axiosInstance';

// Action types
export const FETCH_EXPECTED_AVG_SUCCESS = 'FETCH_EXPECTED_AVG_SUCCESS';
export const FETCH_EXPECTED_AVG_FAILURE = 'FETCH_EXPECTED_AVG_FAILURE';
export const FETCH_EXPECTED_AVG_BY_VEHICLE_SITE_SUCCESS = 'FETCH_EXPECTED_AVG_BY_VEHICLE_SITE_SUCCESS';
export const FETCH_EXPECTED_AVG_BY_VEHICLE_SITE_FAILURE = 'FETCH_EXPECTED_AVG_BY_VEHICLE_SITE_FAILURE';
export const CREATE_EXPECTED_AVG_SUCCESS = 'CREATE_EXPECTED_AVG_SUCCESS';
export const CREATE_EXPECTED_AVG_FAILURE = 'CREATE_EXPECTED_AVG_FAILURE';
export const UPDATE_EXPECTED_AVG_SUCCESS = 'UPDATE_EXPECTED_AVG_SUCCESS';
export const UPDATE_EXPECTED_AVG_FAILURE = 'UPDATE_EXPECTED_AVG_FAILURE';



// Thunk actions
export const fetchExpectedAvg = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get('/expectedavg/getlist');
    dispatch({type: FETCH_EXPECTED_AVG_SUCCESS, payload: response.data});
    return { success: true, data: response.data };
  } catch (error) {
    dispatch({type: FETCH_EXPECTED_AVG_FAILURE, payload: error.message});
    return { success: false, message: error.message };
  }
};

export const fetchExpectedAvgbyVehicle = (vehicleId) => async (dispatch) => {
  try {
    const response = await axiosInstance.get('/expectedavg/getlistbyvehicle', {
      params: { vehicleid: vehicleId }
    });
    dispatch({ type: FETCH_EXPECTED_AVG_SUCCESS, payload: response.data });
    return { success: true, data: response.data };
  } catch (error) {
    dispatch({ type: FETCH_EXPECTED_AVG_FAILURE, payload: error.message });
    return { success: false, message: error.message };
  }
};


export const fetchExpectedAvgByVehicleSite = (vehicleId, siteId) => async (dispatch) => {
  try {
    const response = await axiosInstance.get('/expectedavg/getlistbyvehiclebysite', {
      params: { vehicleid: vehicleId, siteid: siteId }
    });
    dispatch({ type: FETCH_EXPECTED_AVG_BY_VEHICLE_SITE_SUCCESS, payload: response.data });
    return { success: true, data: response.data };
  } catch (error) {
    dispatch({ type: FETCH_EXPECTED_AVG_BY_VEHICLE_SITE_FAILURE, payload: error.message });
    return { success: false, message: error.message };
  }
};

export const createExpectedAvg = (expectedAvgData) => async (dispatch) => {
  try {
    const response = await axiosInstance.post('/expectedavg/create', expectedAvgData);
    dispatch({ type: CREATE_EXPECTED_AVG_SUCCESS, payload: response.data });
    return response.data;
  } catch (error) {
    dispatch( { type: CREATE_EXPECTED_AVG_FAILURE, payload: error.message });
    throw error;
  }
};

export const updateExpectedAvg = (expectedAvgData) => async (dispatch) => {
  try {
    const response = await axiosInstance.put('/expectedavg/update', expectedAvgData);
    dispatch({ type: UPDATE_EXPECTED_AVG_SUCCESS, payload: response.data });
    return response.data;
  } catch (error) {
    dispatch({ type: UPDATE_EXPECTED_AVG_FAILURE, payload: error.message });
    throw error;
  }
};
