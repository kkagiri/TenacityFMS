import axiosInstance from "../api/axiosInstance";

// Action types
export const FETCH_VEHICLES_SUCCESS = 'FETCH_VEHICLES_SUCCESS';
export const FETCH_VEHICLES_FAILURE = 'FETCH_VEHICLES_FAILURE';

// Action creators
export const fetchVehiclesSuccess = (vehicles) => ({
  type: FETCH_VEHICLES_SUCCESS,
  payload: vehicles
});

export const fetchVehiclesFailure = (error) => ({
  type: FETCH_VEHICLES_FAILURE,
  payload: error
});

// Thunk action for fetching vehicles
export const fetchVehicleList = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get(`/vehicle`);
    dispatch(fetchVehiclesSuccess(response.data));
  } catch (error) {
    dispatch(fetchVehiclesFailure(error.message));
  }
};


export const updateVehicles = (vehicleDTOs) => async (dispatch) => {
  try {
    const response = await axiosInstance.put('/vehicle', vehicleDTOs);
    dispatch(updateVehiclesSuccess(response.data));
  } catch (error) {
    dispatch(updateVehiclesFailure(error.message));
  }
};