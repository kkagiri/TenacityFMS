import {
    FETCH_VEHICLE_MANUFACTURERS_SUCCESS,
    FETCH_VEHICLE_MANUFACTURERS_FAILURE
  } from '../actions/vehicleManufacturerActions';
  
  const initialState = {
    manufacturers: [],
    loading: false,
    error: null,
  };
  
  const vehicleManufacturerReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_VEHICLE_MANUFACTURERS_SUCCESS:
        return {
          ...state,
          manufacturers: action.payload,
          loading: false,
          error: null,
        };
      case FETCH_VEHICLE_MANUFACTURERS_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      default:
        return state;
    }
  };
  
  export default vehicleManufacturerReducer;