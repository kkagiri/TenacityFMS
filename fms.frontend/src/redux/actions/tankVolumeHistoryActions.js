import axiosInstance from "./../../api/axiosInstance";
import { cloneDeep } from "lodash";

// Action Types
export const FETCH_TANK_VOLUME_HISTORY_SUCCESS =
  "FETCH_TANK_VOLUME_HISTORY_SUCCESS";
export const FETCH_TANK_VOLUME_HISTORY_FAILURE =
  "FETCH_TANK_VOLUME_HISTORY_FAILURE";
export const FETCH_TANK_VOLUME_HISTORY_BY_ID_SUCCESS =
  "FETCH_TANK_VOLUME_HISTORY_BY_ID_SUCCESS";
export const FETCH_TANK_VOLUME_HISTORY_BY_ID_FAILURE =
  "FETCH_TANK_VOLUME_HISTORY_BY_ID_FAILURE";
export const FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_SUCCESS =
  "FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_SUCCESS";
export const FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_FAILURE =
  "FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_FAILURE";
export const FETCH_TANK_VOLUME_HISTORY_BY_TANK_ID_SUCCESS =
  "FETCH_TANK_VOLUME_HISTORY_BY_TANK_ID_SUCCESS";
export const FETCH_TANK_VOLUME_HISTORY_BY_TANK_ID_FAILURE =
  "FETCH_TANK_VOLUME_HISTORY_BY_TANK_ID_FAILURE";
export const FETCH_TANK_VOLUME_HISTORY_FILTERED_SUCCESS =
  "FETCH_TANK_VOLUME_HISTORY_FILTERED_SUCCESS";
export const FETCH_TANK_VOLUME_HISTORY_FILTERED_FAILURE =
  "FETCH_TANK_VOLUME_HISTORY_FILTERED_FAILURE";
export const SET_TANK_VOLUME_HISTORY_LOADING =
  "SET_TANK_VOLUME_HISTORY_LOADING";

// Unified Action Creator for filtered tank volume history
export const fetchTankVolumeHistoryFiltered = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: SET_TANK_VOLUME_HISTORY_LOADING, payload: true });

    // Default filters
    const defaultFilters = {
      siteId: null,        // null = all sites
      tankId: null,        // null = all tanks
      startDate: null,     // null = last 1 day (handled by backend)
      endDate: null,       // null = now (handled by backend)
      take: 100,           // default record limit
      includeVehicleNames: true
    };

    const queryParams = { ...defaultFilters, ...filters };

    // Build query string
    const params = new URLSearchParams();

    if (queryParams.siteId) params.append('siteId', queryParams.siteId);
    if (queryParams.tankId) params.append('tankId', queryParams.tankId);
    if (queryParams.startDate) params.append('startDate', queryParams.startDate);
    if (queryParams.endDate) params.append('endDate', queryParams.endDate);
    if (queryParams.take) params.append('take', queryParams.take);
    if (queryParams.includeVehicleNames !== undefined) params.append('includeVehicleNames', queryParams.includeVehicleNames);

    const response = await axiosInstance.get(`/tankvolumehistory/filtered?${params.toString()}`);

    dispatch({
      type: FETCH_TANK_VOLUME_HISTORY_FILTERED_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    console.error("Error fetching filtered tank volume history:", error);
    dispatch({
      type: FETCH_TANK_VOLUME_HISTORY_FILTERED_FAILURE,
      payload: error.message,
    });
  }
};

// Legacy Action Creators (maintained for backward compatibility)
export const fetchTankVolumeHistory = () => async (dispatch) => {
  return dispatch(fetchTankVolumeHistoryFiltered());
};

export const fetchTankVolumeHistoryBySiteId =
  (startDate, endDate, siteId) => async (dispatch) => {
    return dispatch(fetchTankVolumeHistoryFiltered({
      siteId: siteId,
      startDate: startDate,
      endDate: endDate,
      take: 200
    }));
  };

export const fetchTankVolumeHistoryByTankId = (tankId) => async (dispatch) => {
  // Create date range for last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  return dispatch(fetchTankVolumeHistoryFiltered({
    tankId: tankId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    take: 200
  }));
};

export const fetchTankVolumeHistoryByDateRange =
  (startDate, endDate) => async (dispatch) => {
    return dispatch(fetchTankVolumeHistoryFiltered({
      startDate: startDate,
      endDate: endDate,
      take: 500
    }));
  };
