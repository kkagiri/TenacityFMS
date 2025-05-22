import {
  FETCH_TANK_VOLUME_HISTORY_SUCCESS,
  FETCH_TANK_VOLUME_HISTORY_FAILURE,
  FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_SUCCESS,
  FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_FAILURE,
  FETCH_TANK_VOLUME_HISTORY_BY_TANK_ID_SUCCESS,
  FETCH_TANK_VOLUME_HISTORY_BY_TANK_ID_FAILURE,
} from "../actions/tankVolumeHistoryActions";
import { cloneDeep } from "lodash";

const initialState = {
  tankVolumeHistory: [],
  currentTankVolumeHistory: null,
  loading: true,
  error: null,
};

const tankVolumeHistoryReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_TANK_VOLUME_HISTORY_SUCCESS:
      return {
        ...state,
        tankVolumeHistory: action.payload,
        loading: false,
        error: null,
      };
    case FETCH_TANK_VOLUME_HISTORY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_SUCCESS:
      return {
        ...state,
        tankVolumeHistory: action.payload,
        loading: false,
        error: null,
      };
    case FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case FETCH_TANK_VOLUME_HISTORY_BY_TANK_ID_SUCCESS:
      return {
        ...state,
        tankVolumeHistory: action.payload,
        loading: false,
        error: null,
      };
    case FETCH_TANK_VOLUME_HISTORY_BY_TANK_ID_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default tankVolumeHistoryReducer;
