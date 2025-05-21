import {
    FETCH_VEHICLES_SUCCESS,
    FETCH_VEHICLES_FAILURE,
    UPDATE_VEHICLES_SUCCESS,
    UPDATE_VEHICLES_FAILURE,
    CREATE_VEHICLE_SUCCESS,
    CREATE_VEHICLE_FAILURE
  } from '../actions/vehicleActions';

  const initialState = {
    vehicles: [],
    loading: true,
    error: null,
  };

  const VehicleReducer = (state = initialState, action) => {
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
      case UPDATE_VEHICLES_SUCCESS:
        return {
          ...state,
          vehicles: action.payload,
          loading: false,
          error: null,
        };
      case UPDATE_VEHICLES_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case CREATE_VEHICLE_SUCCESS:
        return {
          ...state,
          vehicles: [action.payload, ...state.vehicles],
          loading: false,
          error: null,
        };
      case CREATE_VEHICLE_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      default:
        return state;
    }
  };

  export default VehicleReducer;
