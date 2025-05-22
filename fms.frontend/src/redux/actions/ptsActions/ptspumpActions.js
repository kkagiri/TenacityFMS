import axiosInstance from "../../../api/axiosInstance";
import {
  AUTHORIZE_PUMP_REQUEST,
  AUTHORIZE_PUMP_SUCCESS,
  AUTHORIZE_PUMP_FAILURE,
  GET_PUMP_STATE_REQUEST,
  GET_PUMP_STATE_SUCCESS,
  GET_PUMP_STATE_FAILURE,
  STOP_PUMP_REQUEST,
  STOP_PUMP_SUCCESS,
  STOP_PUMP_FAILURE,
  CLOSE_TRANSACTION_REQUEST,
  CLOSE_TRANSACTION_SUCCESS,
  CLOSE_TRANSACTION_FAILURE,
  UPDATE_PUMP_STATUS,
  UPDATE_NOZZLE_STATE,
  UPDATE_FILLING_STATUS,
  UPDATE_PUMP_TRANSACTION_COMPLETED,
  RECEIVE_UPLOAD_STATUS_UPDATE,
} from "./ptsTypes";

// Action Creators
export const authorizePump = (command) => async (dispatch) => {
  dispatch({ type: AUTHORIZE_PUMP_REQUEST });

  try {
    const response = await axiosInstance.post("/pump/authorize", command);

    dispatch({
      type: AUTHORIZE_PUMP_SUCCESS,
      payload: response.data,
    });

    return response.data; // Return for component use
  } catch (error) {
    dispatch({
      type: AUTHORIZE_PUMP_FAILURE,
      payload: error.response?.data || error.message,
    });

    throw error; // Allow component to catch and handle
  }
};

export const getPumpState = (deviceId, pumpId) => async (dispatch) => {
  dispatch({ type: GET_PUMP_STATE_REQUEST });

  try {
    const response = await axiosInstance.get(
      `/pump/${deviceId}/${pumpId}/state`
    );

    dispatch({
      type: GET_PUMP_STATE_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: GET_PUMP_STATE_FAILURE,
      payload: error.response?.data || error.message,
    });

    throw error;
  }
};

export const stopPump = (deviceId, pumpId) => async (dispatch) => {
  dispatch({ type: STOP_PUMP_REQUEST });

  try {
    const response = await axiosInstance.post(
      `/pump/${deviceId}/${pumpId}/stop`
    );

    dispatch({
      type: STOP_PUMP_SUCCESS,
      payload: { deviceId, pumpId, ...response.data },
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: STOP_PUMP_FAILURE,
      payload: error.response?.data || error.message,
    });

    throw error;
  }
};

export const closeTransaction =
  (deviceId, pumpId, transaction) => async (dispatch) => {
    dispatch({ type: CLOSE_TRANSACTION_REQUEST });

    try {
      const response = await axiosInstance.post(
        `/pump/${deviceId}/${pumpId}/close`,
        { transaction }
      );

      dispatch({
        type: CLOSE_TRANSACTION_SUCCESS,
        payload: { deviceId, pumpId, transaction, ...response.data },
      });

      return response.data;
    } catch (error) {
      dispatch({
        type: CLOSE_TRANSACTION_FAILURE,
        payload: error.response?.data || error.message,
      });

      throw error;
    }
  };

// Action for receiving UploadStatus updates from SignalR
export const receiveUploadStatusUpdate = (data) => ({
  type: RECEIVE_UPLOAD_STATUS_UPDATE,
  payload: data,
});
