import {
  FETCH_TANK_VOLUME_HISTORY_SUCCESS,
  FETCH_TANK_VOLUME_HISTORY_FAILURE,
  FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_SUCCESS,
  FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_FAILURE,
  FETCH_TANK_VOLUME_HISTORY_BY_TANK_ID_SUCCESS,
  FETCH_TANK_VOLUME_HISTORY_BY_TANK_ID_FAILURE,
  FETCH_TANK_VOLUME_HISTORY_FILTERED_SUCCESS,
  FETCH_TANK_VOLUME_HISTORY_FILTERED_FAILURE,
  SET_TANK_VOLUME_HISTORY_LOADING,
} from "../actions/tankVolumeHistoryActions";
import { cloneDeep } from "lodash";

const initialState = {
  tankVolumeHistory: [],
  currentTankVolumeHistory: null,
  loading: false,
  isLoading: false, // For backward compatibility
  error: null,
  lastFilters: null, // Track last applied filters
};

const tankVolumeHistoryReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_TANK_VOLUME_HISTORY_LOADING:
      return {
        ...state,
        loading: action.payload,
        isLoading: action.payload,
        error: null,
      };
    case FETCH_TANK_VOLUME_HISTORY_SUCCESS:
    case FETCH_TANK_VOLUME_HISTORY_FILTERED_SUCCESS:
      return {
        ...state,
        tankVolumeHistory: action.payload,
        loading: false,
        isLoading: false,
        error: null,
      };
    case FETCH_TANK_VOLUME_HISTORY_FAILURE:
    case FETCH_TANK_VOLUME_HISTORY_FILTERED_FAILURE:
      return {
        ...state,
        loading: false,
        isLoading: false,
        error: action.payload,
      };
    case FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_SUCCESS:
      return {
        ...state,
        tankVolumeHistory: action.payload,
        loading: false,
        isLoading: false,
        error: null,
      };
    case FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_FAILURE:
      return {
        ...state,
        loading: false,
        isLoading: false,
        error: action.payload,
      };
    case FETCH_TANK_VOLUME_HISTORY_BY_TANK_ID_SUCCESS:
      return {
        ...state,
        tankVolumeHistory: action.payload,
        loading: false,
        isLoading: false,
        error: null,
      };
    case FETCH_TANK_VOLUME_HISTORY_BY_TANK_ID_FAILURE:
      return {
        ...state,
        loading: false,
        isLoading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default tankVolumeHistoryReducer;
