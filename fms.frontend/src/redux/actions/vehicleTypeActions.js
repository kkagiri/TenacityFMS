import axiosInstance from './../../api/axiosInstance';
// Action types
export const FETCH_VEHICLE_TYPES_SUCCESS = 'FETCH_VEHICLE_TYPES_SUCCESS';
export const FETCH_VEHICLE_TYPES_FAILURE = 'FETCH_VEHICLE_TYPES_FAILURE';

// Action creators
export const fetchVehicleTypesSuccess = (vehicleTypes) => ({
  type: FETCH_VEHICLE_TYPES_SUCCESS,
  payload: vehicleTypes
});

export const fetchVehicleTypesFailure = (error) => ({
  type: FETCH_VEHICLE_TYPES_FAILURE,
  payload: error
});

// Thunk action
export const fetchVehicleTypes = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get('/vehicletype');
    dispatch(fetchVehicleTypesSuccess(response.data));
  } catch (error) {
    dispatch(fetchVehicleTypesFailure(error.message));
  }
};
