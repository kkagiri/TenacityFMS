import {
    FETCH_VEHICLE_TYPES_SUCCESS,
    FETCH_VEHICLE_TYPES_FAILURE
  } from '../actions/vehicleTypeActions';
  
  const initialState = {
    vehicleTypes: [],
    loading: false,
    error: null,
  };
  
  const vehicleTypeReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_VEHICLE_TYPES_SUCCESS:
        return {
          ...state,
          vehicleTypes: action.payload,
          loading: false,
          error: null,
        };
      case FETCH_VEHICLE_TYPES_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      default:
        return state;
    }
  };
  
  export default vehicleTypeReducer;