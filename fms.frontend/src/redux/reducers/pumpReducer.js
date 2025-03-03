import {
  AUTHORIZE_PUMP_SUCCESS,
  AUTHORIZE_PUMP_FAILURE,
  GET_PUMP_STATE_SUCCESS,
  GET_PUMP_STATE_FAILURE,
  STOP_PUMP_SUCCESS,
  STOP_PUMP_FAILURE,
  UPDATE_PUMP_STATUS,
  UPDATE_NOZZLE_STATE,
  UPDATE_PUMP_TRANSACTION_COMPLETED,
  UPDATE_FILLING_STATUS,
} from "../actions/pumpActions";

const initialState = {
  pumpState: null,
  loading: false,
  error: null,
};

const pumpReducer = (state = initialState, action) => {
  switch (action.type) {
    case AUTHORIZE_PUMP_SUCCESS:
      return {
        ...state,
        pumpState: action.payload,
        loading: false,
        error: null,
      };
    case AUTHORIZE_PUMP_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case GET_PUMP_STATE_SUCCESS:
      return {
        ...state,
        pumpState: action.payload,
        loading: false,
        error: null,
      };
    case GET_PUMP_STATE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case STOP_PUMP_SUCCESS:
      return {
        ...state,
        pumpState: action.payload,
        loading: false,
        error: null,
      };
    case STOP_PUMP_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case UPDATE_PUMP_STATUS: //handle real time pump status updates
      return {
        ...state,
        pumpState: action.payload,
      };
    case UPDATE_NOZZLE_STATE:
      return {
        ...state,
        pumpState: action.payload,
      };
    case UPDATE_PUMP_TRANSACTION_COMPLETED:
      return {
        ...state,
        pumpState: action.payload,
      };
    case UPDATE_FILLING_STATUS:
      return {
        ...state,
        pumpState: action.payload,
      };
    default:
      return state;
  }
};

export default pumpReducer;
