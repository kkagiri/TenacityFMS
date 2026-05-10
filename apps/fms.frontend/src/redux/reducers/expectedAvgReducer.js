import {
  FETCH_EXPECTED_AVG_SUCCESS,
  FETCH_EXPECTED_AVG_FAILURE,
  FETCH_EXPECTED_AVG_BY_VEHICLE_SITE_SUCCESS,
  FETCH_EXPECTED_AVG_BY_VEHICLE_SITE_FAILURE,
  CREATE_EXPECTED_AVG_SUCCESS,
  CREATE_EXPECTED_AVG_FAILURE
} from '../actions/expectedAvgActions';

const initialState = {
  expectedAverages: [],
  expectedAveragesByVehicleSite: [],
  loading: false,
  error: null,
};

const expectedAvgReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_EXPECTED_AVG_SUCCESS:
      return {
        ...state,
        expectedAverages: action.payload,
        loading: false,
        error: null,
      };
    case FETCH_EXPECTED_AVG_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case FETCH_EXPECTED_AVG_BY_VEHICLE_SITE_SUCCESS:
      return {
        ...state,
        expectedAveragesByVehicleSite: action.payload,
        loading: false,
        error: null,
      };
    case FETCH_EXPECTED_AVG_BY_VEHICLE_SITE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case CREATE_EXPECTED_AVG_SUCCESS:
      return {
        ...state,
        expectedAverages: [...state.expectedAverages, action.payload],
        loading: false,
        error: null,
      };
    case CREATE_EXPECTED_AVG_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default expectedAvgReducer;
