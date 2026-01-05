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

  // Rule Set Assignments (Cascade Model)
  FETCH_ASSIGNMENTS_REQUEST: "FETCH_ASSIGNMENTS_REQUEST",
  FETCH_ASSIGNMENTS_SUCCESS: "FETCH_ASSIGNMENTS_SUCCESS",
  FETCH_ASSIGNMENTS_FAILURE: "FETCH_ASSIGNMENTS_FAILURE",
  FETCH_VEHICLE_ASSIGNMENTS_SUCCESS: "FETCH_VEHICLE_ASSIGNMENTS_SUCCESS",
  CREATE_ASSIGNMENT_SUCCESS: "CREATE_ASSIGNMENT_SUCCESS",
  UPDATE_ASSIGNMENT_SUCCESS: "UPDATE_ASSIGNMENT_SUCCESS",
  DELETE_ASSIGNMENT_SUCCESS: "DELETE_ASSIGNMENT_SUCCESS",
  BULK_CREATE_ASSIGNMENTS_SUCCESS: "BULK_CREATE_ASSIGNMENTS_SUCCESS",

  // Effective Rules (merged from cascade hierarchy)
  FETCH_EFFECTIVE_RULES_REQUEST: "FETCH_EFFECTIVE_RULES_REQUEST",
  FETCH_EFFECTIVE_RULES_SUCCESS: "FETCH_EFFECTIVE_RULES_SUCCESS",
  FETCH_EFFECTIVE_RULES_FAILURE: "FETCH_EFFECTIVE_RULES_FAILURE",
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

// =========== ASSIGN RULE SET TO VEHICLE ===========
export const assignRuleSetToVehicle =
  (ruleSetId, vehicleId) => async (dispatch) => {
    try {
      const response = await axiosInstance.post(
        `/fuelingrule/rulesets/${ruleSetId}/assign-to-vehicle/${vehicleId}`
      );
      dispatch({
        type: FUELING_RULE_ACTIONS.ASSIGN_RULESET_SUCCESS,
        payload: response.data,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || "Failed to assign rule set to vehicle",
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

// =========== RULE SET ASSIGNMENTS (CASCADE MODEL) ===========

/**
 * Fetch all rule set assignments with optional filtering
 * @param {Object} filters - Optional filters: ruleSetId, targetType, siteId, vehicleTypeId, vehicleId, tagId, isActive
 */
export const fetchAssignments =
  (filters = {}) =>
  async (dispatch) => {
    dispatch({ type: FUELING_RULE_ACTIONS.FETCH_ASSIGNMENTS_REQUEST });
    try {
      const params = new URLSearchParams();
      if (filters.ruleSetId) params.append("ruleSetId", filters.ruleSetId);
      if (filters.targetType) params.append("targetType", filters.targetType);
      if (filters.siteId) params.append("siteId", filters.siteId);
      if (filters.vehicleTypeId)
        params.append("vehicleTypeId", filters.vehicleTypeId);
      if (filters.vehicleId) params.append("vehicleId", filters.vehicleId);
      if (filters.tagId) params.append("tagId", filters.tagId);
      if (filters.isActive !== undefined)
        params.append("isActive", filters.isActive);

      const queryString = params.toString();
      const url = `/fuelingrule/assignments${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await axiosInstance.get(url);
      dispatch({
        type: FUELING_RULE_ACTIONS.FETCH_ASSIGNMENTS_SUCCESS,
        payload: response.data?.data || response.data || [],
      });
      return { success: true, data: response.data };
    } catch (error) {
      dispatch({
        type: FUELING_RULE_ACTIONS.FETCH_ASSIGNMENTS_FAILURE,
        payload: error.response?.data || "Failed to fetch assignments",
      });
      return { success: false, error: error.response?.data };
    }
  };

/**
 * Fetch assignments for a specific vehicle (cascade hierarchy)
 * @param {number} vehicleId - Vehicle ID
 * @param {number} siteId - Optional site ID to include site-level rules
 * @param {number} tagId - Optional tag ID to include tag-level rules
 */
export const fetchVehicleAssignments =
  (vehicleId, siteId = null, tagId = null) =>
  async (dispatch) => {
    dispatch({ type: FUELING_RULE_ACTIONS.FETCH_ASSIGNMENTS_REQUEST });
    try {
      const params = new URLSearchParams();
      if (siteId) params.append("siteId", siteId);
      if (tagId) params.append("tagId", tagId);

      const queryString = params.toString();
      const url = `/fuelingrule/assignments/vehicle/${vehicleId}${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await axiosInstance.get(url);
      dispatch({
        type: FUELING_RULE_ACTIONS.FETCH_VEHICLE_ASSIGNMENTS_SUCCESS,
        payload: {
          vehicleId,
          assignments: response.data?.data || response.data || [],
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      dispatch({
        type: FUELING_RULE_ACTIONS.FETCH_ASSIGNMENTS_FAILURE,
        payload: error.response?.data || "Failed to fetch vehicle assignments",
      });
      return { success: false, error: error.response?.data };
    }
  };

/**
 * Fetch assignments for a specific rule set
 * @param {number} ruleSetId - Rule set ID
 * @param {boolean} isActive - Filter by active status (default: true)
 */
export const fetchRuleSetAssignments =
  (ruleSetId, isActive = true) =>
  async (dispatch) => {
    dispatch({ type: FUELING_RULE_ACTIONS.FETCH_ASSIGNMENTS_REQUEST });
    try {
      const params = new URLSearchParams();
      if (isActive !== undefined) params.append("isActive", isActive);

      const queryString = params.toString();
      const url = `/fuelingrule/rulesets/${ruleSetId}/assignments${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await axiosInstance.get(url);
      dispatch({
        type: FUELING_RULE_ACTIONS.FETCH_ASSIGNMENTS_SUCCESS,
        payload: response.data?.data || response.data || [],
      });
      return { success: true, data: response.data };
    } catch (error) {
      dispatch({
        type: FUELING_RULE_ACTIONS.FETCH_ASSIGNMENTS_FAILURE,
        payload: error.response?.data || "Failed to fetch rule set assignments",
      });
      return { success: false, error: error.response?.data };
    }
  };

/**
 * Create a new rule set assignment
 * @param {Object} assignmentData - Assignment data including fuelingRuleSetId, targetType, and target ID
 */
export const createAssignment = (assignmentData) => async (dispatch) => {
  try {
    const response = await axiosInstance.post(
      "/fuelingrule/assignments",
      assignmentData
    );
    dispatch({
      type: FUELING_RULE_ACTIONS.CREATE_ASSIGNMENT_SUCCESS,
      payload: response.data?.data || response.data,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to create assignment",
    };
  }
};

/**
 * Update an existing rule set assignment
 * @param {number} id - Assignment ID
 * @param {Object} assignmentData - Updated assignment data
 */
export const updateAssignment = (id, assignmentData) => async (dispatch) => {
  try {
    const response = await axiosInstance.put(
      `/fuelingrule/assignments/${id}`,
      assignmentData
    );
    dispatch({
      type: FUELING_RULE_ACTIONS.UPDATE_ASSIGNMENT_SUCCESS,
      payload: response.data?.data || response.data,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to update assignment",
    };
  }
};

/**
 * Delete (deactivate) a rule set assignment
 * @param {number} id - Assignment ID
 */
export const deleteAssignment = (id) => async (dispatch) => {
  try {
    const response = await axiosInstance.delete(
      `/fuelingrule/assignments/${id}`
    );
    dispatch({
      type: FUELING_RULE_ACTIONS.DELETE_ASSIGNMENT_SUCCESS,
      payload: id,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to delete assignment",
    };
  }
};

/**
 * Permanently delete a rule set assignment
 * @param {number} id - Assignment ID
 */
export const hardDeleteAssignment = (id) => async (dispatch) => {
  try {
    const response = await axiosInstance.delete(
      `/fuelingrule/assignments/${id}/permanent`
    );
    dispatch({
      type: FUELING_RULE_ACTIONS.DELETE_ASSIGNMENT_SUCCESS,
      payload: id,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to permanently delete assignment",
    };
  }
};

/**
 * Bulk create assignments - assign a rule set to multiple targets at once
 * @param {Object} bulkData - { fuelingRuleSetId, targetType, targetIds, priority? }
 */
export const bulkCreateAssignments = (bulkData) => async (dispatch) => {
  try {
    const response = await axiosInstance.post(
      "/fuelingrule/assignments/bulk",
      bulkData
    );
    dispatch({
      type: FUELING_RULE_ACTIONS.BULK_CREATE_ASSIGNMENTS_SUCCESS,
      payload: response.data?.data || response.data,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to bulk create assignments",
    };
  }
};

/**
 * Assignment Target Types Enum (matches backend)
 * Backend enum starts at 1: Site=1, VehicleType=2, Tag=3, Vehicle=4
 */
export const AssignmentTargetType = {
  Site: 1,
  VehicleType: 2,
  Tag: 3,
  Vehicle: 4,
};

/**
 * Get display name for target type
 */
export const getTargetTypeDisplayName = (targetType) => {
  switch (targetType) {
    case AssignmentTargetType.Site:
    case 1:
      return "Site";
    case AssignmentTargetType.VehicleType:
    case 2:
      return "Vehicle Type";
    case AssignmentTargetType.Tag:
    case 3:
      return "Tag";
    case AssignmentTargetType.Vehicle:
    case 4:
      return "Vehicle";
    default:
      return "Unknown";
  }
};

// =========== EFFECTIVE RULES (MERGED FROM CASCADE) ===========

/**
 * Fetch effective (merged) rules for a vehicle.
 * Returns the calculated fuel allowance considering Site → VehicleType → Tag → Vehicle cascade.
 *
 * @param {number} vehicleId - Vehicle ID
 * @param {number} siteId - Optional site ID (uses vehicle's working site if not provided)
 * @param {number} tagId - Optional tag ID to include tag-level rules
 */
export const fetchEffectiveRulesForVehicle =
  (vehicleId, siteId = null, tagId = null) =>
  async (dispatch) => {
    dispatch({ type: FUELING_RULE_ACTIONS.FETCH_EFFECTIVE_RULES_REQUEST });
    try {
      const params = new URLSearchParams();
      if (siteId) params.append("siteId", siteId);
      if (tagId) params.append("tagId", tagId);

      const queryString = params.toString();
      const url = `/fuelingrule/vehicle/${vehicleId}/effective-rules${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await axiosInstance.get(url);

      dispatch({
        type: FUELING_RULE_ACTIONS.FETCH_EFFECTIVE_RULES_SUCCESS,
        payload: {
          vehicleId,
          effectiveRules: response.data?.data || response.data,
        },
      });

      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error) {
      dispatch({
        type: FUELING_RULE_ACTIONS.FETCH_EFFECTIVE_RULES_FAILURE,
        payload:
          error.response?.data?.message ||
          error.response?.data ||
          "Failed to fetch effective rules",
      });
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data ||
          "Failed to fetch effective rules",
      };
    }
  };

/**
 * Check if vehicle has fueling rules configured (via cascade hierarchy).
 * This is a simplified check that returns hasRules and basic info.
 *
 * @param {number} vehicleId - Vehicle ID
 * @param {number} siteId - Optional site ID
 */
export const checkVehicleHasRules =
  (vehicleId, siteId = null) =>
  async (dispatch) => {
    const result = await dispatch(
      fetchEffectiveRulesForVehicle(vehicleId, siteId)
    );
    if (result.success) {
      return {
        success: true,
        hasRules: result.data?.hasRules || false,
        isAllowed: result.data?.isAllowed || true,
        maxFuelAllowed: result.data?.maxFuelAllowed || 0,
        message: result.data?.message,
        effectiveRules: result.data,
      };
    }
    return { success: false, hasRules: false, error: result.error };
  };
