import axiosInstance from "./../../api/axiosInstance";

export const fetchTagConfigs = () => async (dispatch) => {
  dispatch({ type: "TAG_CONFIGS_LOADING" });
  const res = await axiosInstance.get("/TagMonitoring/config");
  dispatch({ type: "TAG_CONFIGS_SUCCESS", payload: res.data });
};

export const createTagConfig = (config) => async (dispatch) => {
  await axiosInstance.post("/TagMonitoring/config", config);
  dispatch(fetchTagConfigs());
};

export const updateTagConfig = (id, config) => async (dispatch) => {
  await axiosInstance.put(`/TagMonitoring/config/${id}`, config);
  dispatch(fetchTagConfigs());
};

export const deleteTagConfig = (id) => async (dispatch) => {
  await axiosInstance.delete(`/TagMonitoring/config/${id}`);
  dispatch(fetchTagConfigs());
};

export const fetchTagLogs = () => async (dispatch) => {
  dispatch({ type: "TAG_LOGS_LOADING" });
  const res = await axiosInstance.get("/TagMonitoring/logs");
  dispatch({ type: "TAG_LOGS_SUCCESS", payload: res.data });
};
