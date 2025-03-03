import axiosInstance from "./../../api/axiosInstance";

export const AUTHORIZE_PUMP_SUCCESS = "AUTHORIZE_PUMP_SUCCESS";
export const AUTHORIZE_PUMP_FAILURE = "AUTHORIZE_PUMP_FAILURE";
export const GET_PUMP_STATE_SUCCESS = "GET_PUMP_STATE_SUCCESS";
export const GET_PUMP_STATE_FAILURE = "GET_PUMP_STATE_FAILURE";
export const STOP_PUMP_SUCCESS = "STOP_PUMP_SUCCESS";
export const STOP_PUMP_FAILURE = "STOP_PUMP_FAILURE";
export const UPDATE_PUMP_STATUS = "UPDATE_PUMP_STATUS";
export const UPDATE_NOZZLE_STATE = "UPDATE_NOZZLE_STATE";
export const UPDATE_PUMP_TRANSACTION_COMPLETED =
  "UPDATE_PUMP_TRANSACTION_COMPLETED";
export const UPDATE_FILLING_STATUS = "UPDATE_FILLING_STATUS";

export const authorizePump = (command) => async (dispatch) => {
  try {
    const response = await axiosInstance.post("/pump/authorize", command);
    dispatch({ type: AUTHORIZE_PUMP_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: AUTHORIZE_PUMP_FAILURE, payload: error.message });
  }
};

export const getPumpState = (deviceId, pumpId) => async (dispatch) => {
  try {
    const response = await axiosInstance.get(
      `/pump/${deviceId}/${pumpId}/state`
    );
    dispatch({ type: GET_PUMP_STATE_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: GET_PUMP_STATE_FAILURE, payload: error.message });
  }
};

export const stopPump = (deviceId, pumpId) => async (dispatch) => {
  try {
    const response = await axiosInstance.post(
      `/pump/${deviceId}/${pumpId}/stop`
    );
    dispatch({ type: STOP_PUMP_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: STOP_PUMP_FAILURE, payload: error.message });
  }
};
