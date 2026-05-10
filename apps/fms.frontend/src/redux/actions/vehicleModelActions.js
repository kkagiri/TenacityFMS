import axiosInstance from './../../api/axiosInstance';
// Action types
export const FETCH_VEHICLE_MODELS_SUCCESS = 'FETCH_VEHICLE_MODELS_SUCCESS';
export const FETCH_VEHICLE_MODELS_FAILURE = 'FETCH_VEHICLE_MODELS_FAILURE';
export const CREATE_VEHICLE_MODEL_SUCCESS = 'CREATE_VEHICLE_MODEL_SUCCESS';
export const CREATE_VEHICLE_MODEL_FAILURE = 'CREATE_VEHICLE_MODEL_FAILURE';

// Action creators
export const fetchVehicleModelsSuccess = (vehicleModels) => ({
  type: FETCH_VEHICLE_MODELS_SUCCESS,
  payload: vehicleModels
});

export const fetchVehicleModelsFailure = (error) => ({
  type: FETCH_VEHICLE_MODELS_FAILURE,
  payload: error
});

export const createVehicleModelSuccess = (vehicleModel) => ({
  type: CREATE_VEHICLE_MODEL_SUCCESS,
  payload: vehicleModel
});

export const createVehicleModelFailure = (error) => ({
  type: CREATE_VEHICLE_MODEL_FAILURE,
  payload: error
});

// Thunk actions
export const fetchVehicleModels = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get('/VehicleModel');
    dispatch(fetchVehicleModelsSuccess(response.data));
    return { success: true, data: response.data };
  } catch (error) {
    dispatch(fetchVehicleModelsFailure(error.message));
    return { success: false, message: error.message };
  }
};

export const createVehicleModel = (vehicleModel) => async (dispatch) => {
  try {
    const response = await axiosInstance.post('/vehiclemodel', vehicleModel);
    dispatch(createVehicleModelSuccess(response.data));
    return { success: true, data: response.data };
  } catch (error) {
    dispatch(createVehicleModelFailure(error.message));
    return { success: false, message: error.message };
  }
};
