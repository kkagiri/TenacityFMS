import * as providerApi from "../../api/providerApi";

// Action types - Provider List
export const FETCH_PROVIDERS_REQUEST = "FETCH_PROVIDERS_REQUEST";
export const FETCH_PROVIDERS_SUCCESS = "FETCH_PROVIDERS_SUCCESS";
export const FETCH_PROVIDERS_FAILURE = "FETCH_PROVIDERS_FAILURE";

// Action types - Provider Details
export const FETCH_PROVIDER_DETAILS_REQUEST = "FETCH_PROVIDER_DETAILS_REQUEST";
export const FETCH_PROVIDER_DETAILS_SUCCESS = "FETCH_PROVIDER_DETAILS_SUCCESS";
export const FETCH_PROVIDER_DETAILS_FAILURE = "FETCH_PROVIDER_DETAILS_FAILURE";

// Action types - Provider Health
export const FETCH_PROVIDERS_HEALTH_REQUEST = "FETCH_PROVIDERS_HEALTH_REQUEST";
export const FETCH_PROVIDERS_HEALTH_SUCCESS = "FETCH_PROVIDERS_HEALTH_SUCCESS";
export const FETCH_PROVIDERS_HEALTH_FAILURE = "FETCH_PROVIDERS_HEALTH_FAILURE";

// Action types - Provider Statistics
export const FETCH_PROVIDER_STATISTICS_REQUEST = "FETCH_PROVIDER_STATISTICS_REQUEST";
export const FETCH_PROVIDER_STATISTICS_SUCCESS = "FETCH_PROVIDER_STATISTICS_SUCCESS";
export const FETCH_PROVIDER_STATISTICS_FAILURE = "FETCH_PROVIDER_STATISTICS_FAILURE";

// Action types - Provider Update
export const UPDATE_PROVIDER_REQUEST = "UPDATE_PROVIDER_REQUEST";
export const UPDATE_PROVIDER_SUCCESS = "UPDATE_PROVIDER_SUCCESS";
export const UPDATE_PROVIDER_FAILURE = "UPDATE_PROVIDER_FAILURE";

// Action types - Provider Test Connection
export const TEST_PROVIDER_CONNECTION_REQUEST = "TEST_PROVIDER_CONNECTION_REQUEST";
export const TEST_PROVIDER_CONNECTION_SUCCESS = "TEST_PROVIDER_CONNECTION_SUCCESS";
export const TEST_PROVIDER_CONNECTION_FAILURE = "TEST_PROVIDER_CONNECTION_FAILURE";

// Action types - Provider Reload
export const RELOAD_PROVIDERS_REQUEST = "RELOAD_PROVIDERS_REQUEST";
export const RELOAD_PROVIDERS_SUCCESS = "RELOAD_PROVIDERS_SUCCESS";
export const RELOAD_PROVIDERS_FAILURE = "RELOAD_PROVIDERS_FAILURE";

// Action types - Provider Mappings
export const FETCH_PROVIDER_MAPPINGS_REQUEST = "FETCH_PROVIDER_MAPPINGS_REQUEST";
export const FETCH_PROVIDER_MAPPINGS_SUCCESS = "FETCH_PROVIDER_MAPPINGS_SUCCESS";
export const FETCH_PROVIDER_MAPPINGS_FAILURE = "FETCH_PROVIDER_MAPPINGS_FAILURE";

// Action types - Assign Vehicle to Provider
export const ASSIGN_VEHICLE_TO_PROVIDER_REQUEST = "ASSIGN_VEHICLE_TO_PROVIDER_REQUEST";
export const ASSIGN_VEHICLE_TO_PROVIDER_SUCCESS = "ASSIGN_VEHICLE_TO_PROVIDER_SUCCESS";
export const ASSIGN_VEHICLE_TO_PROVIDER_FAILURE = "ASSIGN_VEHICLE_TO_PROVIDER_FAILURE";

// Action types - Bulk Assign Vehicles to Provider
export const BULK_ASSIGN_VEHICLES_TO_PROVIDER_REQUEST = "BULK_ASSIGN_VEHICLES_TO_PROVIDER_REQUEST";
export const BULK_ASSIGN_VEHICLES_TO_PROVIDER_SUCCESS = "BULK_ASSIGN_VEHICLES_TO_PROVIDER_SUCCESS";
export const BULK_ASSIGN_VEHICLES_TO_PROVIDER_FAILURE = "BULK_ASSIGN_VEHICLES_TO_PROVIDER_FAILURE";

// Action types - Bulk Unassign Vehicles from Provider
export const BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_REQUEST = "BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_REQUEST";
export const BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_SUCCESS = "BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_SUCCESS";
export const BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_FAILURE = "BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_FAILURE";

// Action types - Clear State
export const CLEAR_PROVIDER_ERROR = "CLEAR_PROVIDER_ERROR";
export const CLEAR_PROVIDER_DETAILS = "CLEAR_PROVIDER_DETAILS";

// Action types - Provider Devices
export const FETCH_PROVIDER_DEVICES_REQUEST = "FETCH_PROVIDER_DEVICES_REQUEST";
export const FETCH_PROVIDER_DEVICES_SUCCESS = "FETCH_PROVIDER_DEVICES_SUCCESS";
export const FETCH_PROVIDER_DEVICES_FAILURE = "FETCH_PROVIDER_DEVICES_FAILURE";

// Action types - Map Device to Vehicle
export const MAP_DEVICE_TO_VEHICLE_REQUEST = "MAP_DEVICE_TO_VEHICLE_REQUEST";
export const MAP_DEVICE_TO_VEHICLE_SUCCESS = "MAP_DEVICE_TO_VEHICLE_SUCCESS";
export const MAP_DEVICE_TO_VEHICLE_FAILURE = "MAP_DEVICE_TO_VEHICLE_FAILURE";

/**
 * Fetch all providers
 */
export const fetchProviders = () => async (dispatch) => {
  dispatch({ type: FETCH_PROVIDERS_REQUEST });
  try {
    const response = await providerApi.getAllProviders();

    if (response.success && response.data) {
      dispatch({
        type: FETCH_PROVIDERS_SUCCESS,
        payload: response.data,
      });
      return response;
    } else {
      throw new Error(response.message || "Failed to fetch providers");
    }
  } catch (error) {
    console.error("Error fetching providers:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch providers";
    dispatch({
      type: FETCH_PROVIDERS_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

/**
 * Fetch provider details by ID
 * @param {number} providerId - Provider ID
 */
export const fetchProviderDetails = (providerId) => async (dispatch) => {
  dispatch({ type: FETCH_PROVIDER_DETAILS_REQUEST });
  try {
    const response = await providerApi.getProviderById(providerId);

    if (response.success && response.data) {
      dispatch({
        type: FETCH_PROVIDER_DETAILS_SUCCESS,
        payload: response.data,
      });
      return response;
    } else {
      throw new Error(response.message || "Failed to fetch provider details");
    }
  } catch (error) {
    console.error(`Error fetching provider ${providerId}:`, error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch provider details";
    dispatch({
      type: FETCH_PROVIDER_DETAILS_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

/**
 * Fetch provider health status
 */
export const fetchProvidersHealth = () => async (dispatch) => {
  dispatch({ type: FETCH_PROVIDERS_HEALTH_REQUEST });
  try {
    const response = await providerApi.getProvidersHealth();

    if (response.success && response.data) {
      dispatch({
        type: FETCH_PROVIDERS_HEALTH_SUCCESS,
        payload: response.data,
      });
      return response;
    } else {
      throw new Error(response.message || "Failed to fetch provider health");
    }
  } catch (error) {
    console.error("Error fetching provider health:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch provider health";
    dispatch({
      type: FETCH_PROVIDERS_HEALTH_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

/**
 * Fetch provider statistics
 */
export const fetchProviderStatistics = () => async (dispatch) => {
  dispatch({ type: FETCH_PROVIDER_STATISTICS_REQUEST });
  try {
    const response = await providerApi.getProviderStatistics();

    if (response.success && response.data) {
      dispatch({
        type: FETCH_PROVIDER_STATISTICS_SUCCESS,
        payload: response.data,
      });
      return response;
    } else {
      throw new Error(response.message || "Failed to fetch provider statistics");
    }
  } catch (error) {
    console.error("Error fetching provider statistics:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch provider statistics";
    dispatch({
      type: FETCH_PROVIDER_STATISTICS_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

/**
 * Update provider configuration
 * @param {number} providerId - Provider ID
 * @param {object} updates - Update data
 */
export const updateProvider = (providerId, updates) => async (dispatch) => {
  dispatch({ type: UPDATE_PROVIDER_REQUEST });
  try {
    const response = await providerApi.updateProvider(providerId, updates);

    if (response.success) {
      dispatch({
        type: UPDATE_PROVIDER_SUCCESS,
        payload: response.data,
      });

      // Refresh provider list after update
      dispatch(fetchProviders());

      return response;
    } else {
      throw new Error(response.message || "Failed to update provider");
    }
  } catch (error) {
    console.error(`Error updating provider ${providerId}:`, error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to update provider";
    dispatch({
      type: UPDATE_PROVIDER_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

/**
 * Test provider connection
 * @param {string} providerName - Provider name
 */
export const testProviderConnection = (providerName) => async (dispatch) => {
  dispatch({ type: TEST_PROVIDER_CONNECTION_REQUEST });
  try {
    const response = await providerApi.testProviderConnection(providerName);

    if (response.success) {
      dispatch({
        type: TEST_PROVIDER_CONNECTION_SUCCESS,
        payload: response.data,
      });
      return response;
    } else {
      throw new Error(response.message || "Failed to test provider connection");
    }
  } catch (error) {
    console.error(`Error testing provider ${providerName}:`, error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to test provider connection";
    dispatch({
      type: TEST_PROVIDER_CONNECTION_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

/**
 * Reload all providers
 */
export const reloadProviders = () => async (dispatch) => {
  dispatch({ type: RELOAD_PROVIDERS_REQUEST });
  try {
    const response = await providerApi.reloadProviders();

    if (response.success) {
      dispatch({
        type: RELOAD_PROVIDERS_SUCCESS,
      });

      // Refresh provider list after reload
      dispatch(fetchProviders());

      return response;
    } else {
      throw new Error(response.message || "Failed to reload providers");
    }
  } catch (error) {
    console.error("Error reloading providers:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to reload providers";
    dispatch({
      type: RELOAD_PROVIDERS_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

/**
 * Fetch provider mappings
 * @param {number|null} vehicleId - Optional vehicle ID filter
 */
export const fetchProviderMappings = (vehicleId = null) => async (dispatch) => {
  dispatch({ type: FETCH_PROVIDER_MAPPINGS_REQUEST });
  try {
    const response = await providerApi.getProviderMappings(vehicleId);

    if (response.success && response.data) {
      dispatch({
        type: FETCH_PROVIDER_MAPPINGS_SUCCESS,
        payload: response.data,
      });
      return response;
    } else {
      throw new Error(response.message || "Failed to fetch provider mappings");
    }
  } catch (error) {
    console.error("Error fetching provider mappings:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch provider mappings";
    dispatch({
      type: FETCH_PROVIDER_MAPPINGS_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

/**
 * Assign vehicle to provider
 * @param {number} vehicleId - Vehicle ID
 * @param {number} providerId - Provider ID
 */
export const assignVehicleToProvider = (vehicleId, providerId) => async (dispatch) => {
  dispatch({ type: ASSIGN_VEHICLE_TO_PROVIDER_REQUEST });
  try {
    const response = await providerApi.assignVehicleToProvider(vehicleId, providerId);

    if (response.success) {
      dispatch({
        type: ASSIGN_VEHICLE_TO_PROVIDER_SUCCESS,
        payload: { vehicleId, providerId },
      });

      // Refresh mappings after assignment
      dispatch(fetchProviderMappings());

      return response;
    } else {
      throw new Error(response.message || "Failed to assign vehicle to provider");
    }
  } catch (error) {
    console.error(`Error assigning vehicle ${vehicleId} to provider ${providerId}:`, error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to assign vehicle to provider";
    dispatch({
      type: ASSIGN_VEHICLE_TO_PROVIDER_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

/**
 * Bulk assign vehicles to provider
 * @param {number[]} vehicleIds - Array of vehicle IDs
 * @param {number} providerId - Provider ID
 */
export const bulkAssignVehiclesToProvider = (vehicleIds, providerId) => async (dispatch) => {
  dispatch({ type: BULK_ASSIGN_VEHICLES_TO_PROVIDER_REQUEST });
  try {
    const response = await providerApi.bulkAssignVehiclesToProvider(vehicleIds, providerId);

    if (response.success !== false) {
      dispatch({
        type: BULK_ASSIGN_VEHICLES_TO_PROVIDER_SUCCESS,
        payload: {
          vehicleIds,
          providerId,
          jobId: response.jobId, // For async jobs
          successCount: response.successCount, // For sync completion (backward compat)
          failCount: response.failCount, // For sync completion (backward compat)
        },
      });

      // Don't auto-refresh for async jobs - UI will handle it
      if (!response.jobId) {
        // Only refresh for synchronous responses (backward compatibility)
        dispatch(fetchProviderMappings());
      }

      return response;
    } else {
      throw new Error(response.message || "Failed to bulk assign vehicles to provider");
    }
  } catch (error) {
    console.error(`Error bulk assigning ${vehicleIds.length} vehicles to provider ${providerId}:`, error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to bulk assign vehicles to provider";
    dispatch({
      type: BULK_ASSIGN_VEHICLES_TO_PROVIDER_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

/**
 * Bulk unassign vehicles from all providers
 * @param {number[]} vehicleIds - Array of vehicle IDs
 */
export const bulkUnassignVehiclesFromProvider = (vehicleIds) => async (dispatch) => {
  dispatch({ type: BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_REQUEST });
  try {
    const response = await providerApi.bulkUnassignVehiclesFromProvider(vehicleIds);

    if (response.success !== false) {
      dispatch({
        type: BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_SUCCESS,
        payload: {
          vehicleIds,
          jobId: response.jobId, // For async jobs
          successCount: response.successCount, // For sync completion (backward compat)
          failCount: response.failCount, // For sync completion (backward compat)
        },
      });

      // Don't auto-refresh for async jobs - UI will handle it
      if (!response.jobId) {
        // Only refresh for synchronous responses (backward compatibility)
        dispatch(fetchProviderMappings());
      }

      return response;
    } else {
      throw new Error(response.message || "Failed to bulk unassign vehicles from provider");
    }
  } catch (error) {
    console.error(`Error bulk unassigning ${vehicleIds.length} vehicles:`, error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to bulk unassign vehicles from provider";
    dispatch({
      type: BULK_UNASSIGN_VEHICLES_FROM_PROVIDER_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

/**
 * Clear provider error
 */
export const clearProviderError = () => ({
  type: CLEAR_PROVIDER_ERROR,
});

/**
 * Clear provider details
 */
export const clearProviderDetails = () => ({
  type: CLEAR_PROVIDER_DETAILS,
});

/**
 * Fetch all GPS devices from a provider
 * @param {string} providerName - Provider name
 */
export const fetchProviderDevices = (providerName) => async (dispatch) => {
  dispatch({ type: FETCH_PROVIDER_DEVICES_REQUEST });
  try {
    const response = await providerApi.getProviderDevices(providerName);

    if (response.success && response.data) {
      dispatch({
        type: FETCH_PROVIDER_DEVICES_SUCCESS,
        payload: response.data,
      });
      return response;
    } else {
      throw new Error(response.message || "Failed to fetch provider devices");
    }
  } catch (error) {
    console.error(`Error fetching devices from provider ${providerName}:`, error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch provider devices";
    dispatch({
      type: FETCH_PROVIDER_DEVICES_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

/**
 * Map a GPS device to a vehicle
 * @param {object} mappingData - Device mapping data
 * @param {number} mappingData.vehicleId - Vehicle ID
 * @param {string} mappingData.providerName - Provider name
 * @param {string} mappingData.externalDeviceId - External device ID
 * @param {string} mappingData.deviceIMEI - Device IMEI
 * @param {string} mappingData.deviceName - Device name
 * @param {string} mappingData.deviceType - Device type
 * @param {string} mappingData.metadata - Additional metadata as JSON string
 */
export const mapDeviceToVehicle = (mappingData) => async (dispatch) => {
  dispatch({ type: MAP_DEVICE_TO_VEHICLE_REQUEST });
  try {
    const response = await providerApi.mapDeviceToVehicle(mappingData);

    if (response.success) {
      dispatch({
        type: MAP_DEVICE_TO_VEHICLE_SUCCESS,
        payload: response.data,
      });

      // Refresh mappings after successful device mapping
      dispatch(fetchProviderMappings());

      return response;
    } else {
      throw new Error(response.message || "Failed to map device to vehicle");
    }
  } catch (error) {
    console.error("Error mapping device to vehicle:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to map device to vehicle";
    dispatch({
      type: MAP_DEVICE_TO_VEHICLE_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

