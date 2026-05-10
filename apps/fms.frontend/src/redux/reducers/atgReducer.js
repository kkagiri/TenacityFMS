import {
  FETCH_ATG_DASHBOARD_START,
  FETCH_ATG_DASHBOARD_SUCCESS,
  FETCH_ATG_DASHBOARD_ERROR,
  FETCH_PTS_DEVICE_START,
  FETCH_PTS_DEVICE_SUCCESS,
  FETCH_PTS_DEVICE_ERROR,
  START_FUELING_TRANSACTION,
  START_FUELING_TRANSACTION_SUCCESS,
  START_FUELING_TRANSACTION_ERROR,
  COMPLETE_FUELING_TRANSACTION,
  COMPLETE_FUELING_TRANSACTION_SUCCESS,
  COMPLETE_FUELING_TRANSACTION_ERROR,
} from "../types/atgTypes";

const initialState = {
  loading: false,
  error: null,
  summary: {
    fuelDispensed: { value: "0", unit: "L", change: "0%" },
    tankLevels: { value: "0", unit: "L", change: "0%" },
    fuelPrice: { value: "0", unit: "$/L", change: "0%" },
    onlinePumps: { value: "0", unit: "Active", change: "0%" },
  },
  ptsDevices: [],
  selectedDevice: null,
  pumps: [],
  nozzles: [],
  currentTransaction: null,
};

const atgReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_ATG_DASHBOARD_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case FETCH_ATG_DASHBOARD_SUCCESS:
      return {
        ...state,
        loading: false,
        summary: action.payload.summary,
        ptsDevices: action.payload.ptsDevices,
      };

    case FETCH_ATG_DASHBOARD_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case FETCH_PTS_DEVICE_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case FETCH_PTS_DEVICE_SUCCESS:
      return {
        ...state,
        loading: false,
        selectedDevice: action.payload.device,
        pumps: action.payload.pumps,
        nozzles: action.payload.nozzles,
      };

    case FETCH_PTS_DEVICE_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case START_FUELING_TRANSACTION:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case START_FUELING_TRANSACTION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentTransaction: action.payload,
      };

    case START_FUELING_TRANSACTION_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case COMPLETE_FUELING_TRANSACTION:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case COMPLETE_FUELING_TRANSACTION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentTransaction: null,
      };

    case COMPLETE_FUELING_TRANSACTION_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default atgReducer;
