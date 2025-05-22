import axiosInstance from "../../api/axiosInstance";

/**
 * We define all action types for fueling rules here.
 * Each type corresponds to a request or response cycle
 * (like fetching, creating, updating, etc.).
 */
export const FUELING_RULE_ACTIONS = {
  // Fetching all rule sets or a specific rule set
  FETCH_RULESETS_REQUEST: "FETCH_RULESETS_REQUEST", // e.g. loading start
  FETCH_RULESETS_SUCCESS: "FETCH_RULESETS_SUCCESS",
  FETCH_RULESETS_FAILURE: "FETCH_RULESETS_FAILURE",

  FETCH_SINGLE_RULESET_REQUEST: "FETCH_SINGLE_RULESET_REQUEST",
  FETCH_SINGLE_RULESET_SUCCESS: "FETCH_SINGLE_RULESET_SUCCESS",
  FETCH_SINGLE_RULESET_FAILURE: "FETCH_SINGLE_RULESET_FAILURE",

  // Create / Update / Delete rule sets
  CREATE_RULESET_SUCCESS: "CREATE_RULESET_SUCCESS",
  UPDATE_RULESET_SUCCESS: "UPDATE_RULESET_SUCCESS",
  DELETE_RULESET_SUCCESS: "DELETE_RULESET_SUCCESS",

  // Assign rule set to tag
  ASSIGN_RULESET_SUCCESS: "ASSIGN_RULESET_SUCCESS",

  // Daily/Monthly rules
  CREATE_DAILYMONTHLY_RULE_SUCCESS: "CREATE_DAILYMONTHLY_RULE_SUCCESS",
  UPDATE_DAILYMONTHLY_RULE_SUCCESS: "UPDATE_DAILYMONTHLY_RULE_SUCCESS",
  DELETE_DAILYMONTHLY_RULE_SUCCESS: "DELETE_DAILYMONTHLY_RULE_SUCCESS",

  // Number of refills rules
  CREATE_REFILLCOUNT_RULE_SUCCESS: "CREATE_REFILLCOUNT_RULE_SUCCESS",
  UPDATE_REFILLCOUNT_RULE_SUCCESS: "UPDATE_REFILLCOUNT_RULE_SUCCESS",
  DELETE_REFILLCOUNT_RULE_SUCCESS: "DELETE_REFILLCOUNT_RULE_SUCCESS",

  // Time window rules
  CREATE_TIMEWINDOW_RULE_SUCCESS: "CREATE_TIMEWINDOW_RULE_SUCCESS",
  UPDATE_TIMEWINDOW_RULE_SUCCESS: "UPDATE_TIMEWINDOW_RULE_SUCCESS",
  DELETE_TIMEWINDOW_RULE_SUCCESS: "DELETE_TIMEWINDOW_RULE_SUCCESS",
};

// =========== FETCHING RULE SETS ===========
export const fetchAllRuleSets = () => async (dispatch) => {
  dispatch({ type: FUELING_RULE_ACTIONS.FETCH_RULESETS_REQUEST });
  try {
    const response = await axiosInstance.get("/fuelingrule/rulesets");
    dispatch({
      type: FUELING_RULE_ACTIONS.FETCH_RULESETS_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: FUELING_RULE_ACTIONS.FETCH_RULESETS_FAILURE,
      payload: error.response?.data || "Failed to fetch rule sets",
    });
  }
};

export const fetchRuleSetById = (id) => async (dispatch) => {
  dispatch({ type: FUELING_RULE_ACTIONS.FETCH_SINGLE_RULESET_REQUEST });
  try {
    const response = await axiosInstance.get(`/fuelingrule/rulesets/${id}`);
    dispatch({
      type: FUELING_RULE_ACTIONS.FETCH_SINGLE_RULESET_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: FUELING_RULE_ACTIONS.FETCH_SINGLE_RULESET_FAILURE,
      payload: error.response?.data || "Failed to fetch rule set",
    });
  }
};

// =========== CREATE / UPDATE / DELETE RULE SET ===========
export const createRuleSet = (ruleSetData) => async (dispatch) => {
  try {
    const response = await axiosInstance.post(
      "/fuelingrule/rulesets",
      ruleSetData
    );
    dispatch({
      type: FUELING_RULE_ACTIONS.CREATE_RULESET_SUCCESS,
      payload: response.data.data, // or adapt to your actual response shape
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to create rule set",
    };
  }
};

export const updateRuleSet = (id, ruleSetData) => async (dispatch) => {
  try {
    const response = await axiosInstance.put(`/fuelingrule/rulesets/${id}`, {
      id,
      ...ruleSetData,
    });
    dispatch({
      type: FUELING_RULE_ACTIONS.UPDATE_RULESET_SUCCESS,
      payload: response.data.data, // or adapt to your actual response shape
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to update rule set",
    };
  }
};

export const deleteRuleSet = (id) => async (dispatch) => {
  try {
    const response = await axiosInstance.delete(`/fuelingrule/rulesets/${id}`);
    dispatch({
      type: FUELING_RULE_ACTIONS.DELETE_RULESET_SUCCESS,
      payload: id,
    });
    return { success: true, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to delete rule set",
    };
  }
};

// =========== ASSIGN RULE SET TO TAG ===========
export const assignRuleSetToTag = (ruleSetId, tagId) => async (dispatch) => {
  try {
    const response = await axiosInstance.post(
      `/fuelingrule/rulesets/${ruleSetId}/assign/${tagId}`
    );
    dispatch({
      type: FUELING_RULE_ACTIONS.ASSIGN_RULESET_SUCCESS,
      payload: response.data,
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to assign rule set to tag",
    };
  }
};

// =========== DAILY / MONTHLY LIMIT RULES ===========
export const createDailyMonthlyRule =
  (ruleSetId, ruleData) => async (dispatch) => {
    try {
      const response = await axiosInstance.post(
        `/fuelingrule/rulesets/${ruleSetId}/dailymonthly`,
        ruleData
      );
      dispatch({
        type: FUELING_RULE_ACTIONS.CREATE_DAILYMONTHLY_RULE_SUCCESS,
        payload: response.data,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || "Failed to create daily/monthly rule",
      };
    }
  };

export const updateDailyMonthlyRule =
  (ruleId, ruleData) => async (dispatch) => {
    try {
      const response = await axiosInstance.put(
        `/fuelingrule/rules/dailymonthly/${ruleId}`,
        ruleData
      );
      dispatch({
        type: FUELING_RULE_ACTIONS.UPDATE_DAILYMONTHLY_RULE_SUCCESS,
        payload: response.data,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || "Failed to update daily/monthly rule",
      };
    }
  };

export const deleteDailyMonthlyRule = (ruleId) => async (dispatch) => {
  try {
    const response = await axiosInstance.delete(
      `/fuelingrule/rules/dailymonthly/${ruleId}`
    );
    dispatch({
      type: FUELING_RULE_ACTIONS.DELETE_DAILYMONTHLY_RULE_SUCCESS,
      payload: ruleId,
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to delete daily/monthly rule",
    };
  }
};

// =========== NUMBER OF REFILLS RULES ===========
export const createRefillCountRule =
  (ruleSetId, ruleData) => async (dispatch) => {
    try {
      const response = await axiosInstance.post(
        `/fuelingrule/rulesets/${ruleSetId}/refillcount`,
        ruleData
      );
      dispatch({
        type: FUELING_RULE_ACTIONS.CREATE_REFILLCOUNT_RULE_SUCCESS,
        payload: response.data,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || "Failed to create refill count rule",
      };
    }
  };

export const updateRefillCountRule = (ruleId, ruleData) => async (dispatch) => {
  try {
    const response = await axiosInstance.put(
      `/fuelingrule/rules/refillcount/${ruleId}`,
      ruleData
    );
    dispatch({
      type: FUELING_RULE_ACTIONS.UPDATE_REFILLCOUNT_RULE_SUCCESS,
      payload: response.data,
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to update refill count rule",
    };
  }
};

export const deleteRefillCountRule = (ruleId) => async (dispatch) => {
  try {
    const response = await axiosInstance.delete(
      `/fuelingrule/rules/refillcount/${ruleId}`
    );
    dispatch({
      type: FUELING_RULE_ACTIONS.DELETE_REFILLCOUNT_RULE_SUCCESS,
      payload: ruleId,
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to delete refill count rule",
    };
  }
};

// =========== TIME WINDOW RULES ===========
export const createTimeWindowRule =
  (ruleSetId, ruleData) => async (dispatch) => {
    try {
      const response = await axiosInstance.post(
        `/fuelingrule/rulesets/${ruleSetId}/timewindow`,
        ruleData
      );
      dispatch({
        type: FUELING_RULE_ACTIONS.CREATE_TIMEWINDOW_RULE_SUCCESS,
        payload: response.data,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || "Failed to create time window rule",
      };
    }
  };

export const updateTimeWindowRule = (ruleId, ruleData) => async (dispatch) => {
  try {
    const response = await axiosInstance.put(
      `/fuelingrule/rules/timewindow/${ruleId}`,
      ruleData
    );
    dispatch({
      type: FUELING_RULE_ACTIONS.UPDATE_TIMEWINDOW_RULE_SUCCESS,
      payload: response.data,
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to update time window rule",
    };
  }
};

export const deleteTimeWindowRule = (ruleId) => async (dispatch) => {
  try {
    const response = await axiosInstance.delete(
      `/fuelingrule/rules/timewindow/${ruleId}`
    );
    dispatch({
      type: FUELING_RULE_ACTIONS.DELETE_TIMEWINDOW_RULE_SUCCESS,
      payload: ruleId,
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to delete time window rule",
    };
  }
};
