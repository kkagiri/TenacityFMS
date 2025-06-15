import axiosInstance from "../../../api/axiosInstance";

import {
  FETCH_DEVICE_SUMMARY,
  FETCH_DEVICE_SUMMARY_SUCCESS,
  FETCH_DEVICE_SUMMARY_FAILURE,
  FETCH_ONLINE_DEVICES_SUCCESS,
  FETCH_ONLINE_DEVICES_FAILURE,
  RECEIVE_DEVICE_STATUS,
  FETCH_PTS_DEVICE_LIST_SUCCESS,
  FETCH_PTS_DEVICE_LIST_FAILURE,
  FETCH_DASHBOARD_METRICS_SUCCESS,
  FETCH_DASHBOARD_METRICS_FAILURE,
  FETCH_PTS_DEVICE_BY_ID_SUCCESS,
  FETCH_PTS_DEVICE_BY_ID_FAILURE,
} from "../types";

export const CREATE_PTS_DEVICE_SUCCESS = "CREATE_PTS_DEVICE_SUCCESS";
export const CREATE_PTS_DEVICE_FAILURE = "CREATE_PTS_DEVICE_FAILURE";

export const UPDATE_PTS_DEVICE_SUCCESS = "UPDATE_PTS_DEVICE_SUCCESS";
export const UPDATE_PTS_DEVICE_FAILURE = "UPDATE_PTS_DEVICE_FAILURE";

export const DELETE_PTS_DEVICE_SUCCESS = "DELETE_PTS_DEVICE_SUCCESS";
export const DELETE_PTS_DEVICE_FAILURE = "DELETE_PTS_DEVICE_FAILURE";

export const GET_PTS_DEVICE_BY_ID_SUCCESS = "GET_PTS_DEVICE_BY_ID_SUCCESS";
export const GET_PTS_DEVICE_BY_ID_FAILURE = "GET_PTS_DEVICE_BY_ID_FAILURE";

export const fetchDashboardMetrics = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get("/PTSDevice/dashboard-metrics");
    dispatch({
      type: FETCH_DASHBOARD_METRICS_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({ type: FETCH_DASHBOARD_METRICS_FAILURE, payload: error.message });
  }
};

export const fetchPTSDeviceList = () => async (dispatch) => {
  try {
    // Dispatch request action to set loading state
    dispatch({ type: "FETCH_PTS_DEVICE_LIST_REQUEST" });

    const response = await axiosInstance.get("/PTSDevice");
    dispatch({
      type: FETCH_PTS_DEVICE_LIST_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({ type: FETCH_PTS_DEVICE_LIST_FAILURE, payload: error.message });
  }
};

// Alias for fetchPTSDeviceList
export const fetchPTSDevices = fetchPTSDeviceList;

export const fetchOnlineDeviceSummary = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get("/PTSDevice/summary");
    dispatch({
      type: FETCH_DEVICE_SUMMARY_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: FETCH_DEVICE_SUMMARY_FAILURE,
      payload: error.message,
    });
  }
};

export const receiveDeviceStatus = (device) => ({
  type: RECEIVE_DEVICE_STATUS,
  payload: device,
});

// Action to create a PTS device
export const createPTSDevice = (ptsDevice) => async (dispatch) => {
  try {
    const response = await axiosInstance.post("/PTSDevice/create", ptsDevice);
    dispatch({
      type: CREATE_PTS_DEVICE_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({ type: CREATE_PTS_DEVICE_FAILURE, payload: error.message });
  }
};

// Action to update a PTS device
export const updatePTSDevice = (deviceId, ptsDevice) => async (dispatch) => {
  try {
    const response = await axiosInstance.put(
      `/PTSDevice/update/${deviceId}`,
      ptsDevice
    );
    dispatch({
      type: UPDATE_PTS_DEVICE_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({ type: UPDATE_PTS_DEVICE_FAILURE, payload: error.message });
  }
};

// Action to delete a PTS device
export const deletePTSDevice = (deviceId) => async (dispatch) => {
  try {
    const response = await axiosInstance.delete(
      `/PTSDevice/delete/${deviceId}`
    );
    dispatch({
      type: DELETE_PTS_DEVICE_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({ type: DELETE_PTS_DEVICE_FAILURE, payload: error.message });
  }
};

// Action to get a PTS device by ID
export const getPTSDeviceById = (deviceId) => async (dispatch) => {
  try {
    const response = await axiosInstance.get(`/PTSDevice/GetById/${deviceId}`);
    dispatch({
      type: GET_PTS_DEVICE_BY_ID_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({ type: GET_PTS_DEVICE_BY_ID_FAILURE, payload: error.message });
  }
};
