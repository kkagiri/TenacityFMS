import {
    FETCH_VEHICLE_MODELS_SUCCESS,
    FETCH_VEHICLE_MODELS_FAILURE,
    CREATE_VEHICLE_MODEL_SUCCESS,
    CREATE_VEHICLE_MODEL_FAILURE
  } from '../actions/vehicleModelActions';
  
  const initialState = {
    vehicleModels: [],
    loading: false,
    error: null,
  };
  
  const vehicleModelReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_VEHICLE_MODELS_SUCCESS:
        return {
          ...state,
          vehicleModels: action.payload,
          loading: false,
          error: null,
        };
      case FETCH_VEHICLE_MODELS_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case CREATE_VEHICLE_MODEL_SUCCESS:
        return {
          ...state,
          vehicleModels: [...state.vehicleModels, action.payload],
          loading: false,
          error: null,
        };
      case CREATE_VEHICLE_MODEL_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      default:
        return state;
    }
  };
  
  export default vehicleModelReducer;