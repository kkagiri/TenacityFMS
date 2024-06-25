import {
    FETCH_VEHICLES_SUCCESS,
    FETCH_VEHICLES_FAILURE,
  } from '../actions/vehicleActions';
  
  const initialState = {
    vehicles: [],
    loading: true,
    error: null,
  };
  
  const vehicleReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_VEHICLES_SUCCESS:
        return {
          ...state,
          vehicles: action.payload,
          loading: false,
          error: null,
        };
      case FETCH_VEHICLES_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      default:
        return state;
    }
  };
  
  export default vehicleReducer;
  