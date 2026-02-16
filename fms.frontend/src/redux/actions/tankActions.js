import axiosInstance from "./../../api/axiosInstance";

export const FETCH_TANKS_SUCCESS = "FETCH_TANKS_SUCCESS";
export const FETCH_TANKS_FAILURE = "FETCH_TANKS_FAILURE";
export const CREATE_TANK_SUCCESS = "CREATE_TANK_SUCCESS";
export const CREATE_TANK_FAILURE = "CREATE_TANK_FAILURE";
export const UPDATE_TANK_SUCCESS = "UPDATE_TANK_SUCCESS";
export const UPDATE_TANK_FAILURE = "UPDATE_TANK_FAILURE";
export const DELETE_TANK_SUCCESS = "DELETE_TANK_SUCCESS";
export const DELETE_TANK_FAILURE = "DELETE_TANK_FAILURE";
export const FETCH_TANK_BY_SITE_ID_SUCCESS = "FETCH_TANK_BY_SITE_ID_SUCCESS";
export const FETCH_TANK_BY_SITE_ID_FAILURE = "FETCH_TANK_BY_SITE_ID_FAILURE";

const ensureArray = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload && Array.isArray(payload.Data)) {
    return payload.Data;
  }

  console.warn("[tankActions] Unexpected tanks payload shape", payload);
  return [];
};

export const fetchTanks = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get("/tank");

    const tanksData = ensureArray(response.data);
    console.log("[tankActions] Fetched tanks:", tanksData);

    dispatch({ type: FETCH_TANKS_SUCCESS, payload: tanksData });
    return { success: true, data: tanksData };
  } catch (error) {
    console.error("[tankActions] Error fetching tanks:", error);
    dispatch({ type: FETCH_TANKS_FAILURE, payload: error.message });
    return { success: false, message: error.message };
  }
};

export const fetctTankbySiteId = (siteId) => async (dispatch) => {
  try {
    const response = await axiosInstance.get(`/tank/site/${siteId}`);

    const tanksData = ensureArray(response.data);
    console.log("[tankActions] Fetched tanks by site:", siteId, tanksData);

    dispatch({ type: FETCH_TANK_BY_SITE_ID_SUCCESS, payload: tanksData });
    return { success: true, data: tanksData };
  } catch (error) {
    console.error("[tankActions] Error fetching tanks by site:", error);
    dispatch({ type: FETCH_TANK_BY_SITE_ID_FAILURE, payload: error.message });
    return { success: false, message: error.message };
  }
};

export const createTank = (tank) => async (dispatch) => {
  try {
    const response = await axiosInstance.post("/tank", tank);
    dispatch({ type: CREATE_TANK_SUCCESS, payload: response.data });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Create tank error details:", error.response || error);
    const errorMessage =
      error.response?.data?.title ||
      error.response?.data?.message ||
      error.message ||
      "Error creating tank";
    const validationErrors = error.response?.data?.errors;
    dispatch({ type: CREATE_TANK_FAILURE, payload: errorMessage });

    // Throw a more detailed error for the UI
    const detailError = new Error(errorMessage);
    detailError.validationErrors = validationErrors;
    detailError.response = error.response;
    throw detailError;
  }
};

export const updateTank = (id, tank) => async (dispatch) => {
  try {
    await axiosInstance.put(`/tank/${id}`, tank);
    dispatch({ type: UPDATE_TANK_SUCCESS, payload: { id, tank } });
    return { success: true };
  } catch (error) {
    console.error("Update tank error details:", error.response || error);
    const errorMessage =
      error.response?.data?.title ||
      error.response?.data?.message ||
      error.message ||
      "Error updating tank";
    const validationErrors = error.response?.data?.errors;
    dispatch({ type: UPDATE_TANK_FAILURE, payload: errorMessage });

    // Throw a more detailed error for the UI
    const detailError = new Error(errorMessage);
    detailError.validationErrors = validationErrors;
    detailError.response = error.response;
    throw detailError;
  }
};

export const deleteTank = (id) => async (dispatch) => {
  try {
    await axiosInstance.delete(`/tank/${id}`);
    dispatch({ type: DELETE_TANK_SUCCESS, payload: id });
    return { success: true };
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.title ||
      error.message ||
      "Error deleting tank";
    dispatch({ type: DELETE_TANK_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

export const fetchTankVolumeHistory =
  (tankId, startDate, endDate) => async (dispatch) => {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        tankId: tankId,
      });

      const response = await axiosInstance.get(
        `/tank/volume-history?${params}`
      );
      const result = response.data;

      return {
        success: result.success || true,
        data: result.data || result,
        message: result.message,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        success: false,
        message: errorMessage,
      };
    }
  };
