import {
  NOZZLE_STATE_CHANGE,
  UPLOADSTATUS_TAG_READ,
  FILLING_STATUS_UPDATE,
  PUMP_TRANSACTION_COMPLETED,
  PUMP_OFFLINE,
} from "../../actions/types";

const initialState = {
  nozzleState: null,
  tagRead: null,
  fillingStatus: null,
  pumpTransaction: null,
  pumpOffline: null,
};

const ptsPumpEventsReducer = (state = initialState, action) => {
  switch (action.type) {
    case NOZZLE_STATE_CHANGE:
      return { ...state, nozzleState: action.payload };
    case UPLOADSTATUS_TAG_READ:
      return { ...state, tagRead: action.payload };
    case FILLING_STATUS_UPDATE:
      return { ...state, fillingStatus: action.payload };
    case PUMP_TRANSACTION_COMPLETED:
      return { ...state, pumpTransaction: action.payload };
    case PUMP_OFFLINE:
      return { ...state, pumpOffline: action.payload };
    default:
      return state;
  }
};

export default ptsPumpEventsReducer;
