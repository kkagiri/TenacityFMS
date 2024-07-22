// actions/vehicleManufacturerActions.js
import axiosInstance from "../api/axiosInstance";

// Action types
export const FETCH_VEHICLE_MANUFACTURERS_SUCCESS = 'FETCH_VEHICLE_MANUFACTURERS_SUCCESS';
export const FETCH_VEHICLE_MANUFACTURERS_FAILURE = 'FETCH_VEHICLE_MANUFACTURERS_FAILURE';

// Action creators
export const fetchVehicleManufacturersSuccess = (manufacturers) => ({
  type: FETCH_VEHICLE_MANUFACTURERS_SUCCESS,
  payload: manufacturers
});

export const fetchVehicleManufacturersFailure = (error) => ({
  type: FETCH_VEHICLE_MANUFACTURERS_FAILURE,
  payload: error
});

// Thunk action
export const fetchVehicleManufacturers = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get('/vehiclemanufacturer');
    dispatch(fetchVehicleManufacturersSuccess(response.data));
  } catch (error) {
    dispatch(fetchVehicleManufacturersFailure(error.message));
  }
};