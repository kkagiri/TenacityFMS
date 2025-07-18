import configurationService from '../../services/configurationService';

// Action Types
export const CONFIGURATION_ACTIONS = {
  // Fetch configurations list
  FETCH_CONFIGURATIONS_REQUEST: 'FETCH_CONFIGURATIONS_REQUEST',
  FETCH_CONFIGURATIONS_SUCCESS: 'FETCH_CONFIGURATIONS_SUCCESS',
  FETCH_CONFIGURATIONS_FAILURE: 'FETCH_CONFIGURATIONS_FAILURE',

  // Fetch single configuration
  FETCH_CONFIGURATION_REQUEST: 'FETCH_CONFIGURATION_REQUEST',
  FETCH_CONFIGURATION_SUCCESS: 'FETCH_CONFIGURATION_SUCCESS',
  FETCH_CONFIGURATION_FAILURE: 'FETCH_CONFIGURATION_FAILURE',

  // Create configuration
  CREATE_CONFIGURATION_REQUEST: 'CREATE_CONFIGURATION_REQUEST',
  CREATE_CONFIGURATION_SUCCESS: 'CREATE_CONFIGURATION_SUCCESS',
  CREATE_CONFIGURATION_FAILURE: 'CREATE_CONFIGURATION_FAILURE',

  // Update configuration
  UPDATE_CONFIGURATION_REQUEST: 'UPDATE_CONFIGURATION_REQUEST',
  UPDATE_CONFIGURATION_SUCCESS: 'UPDATE_CONFIGURATION_SUCCESS',
  UPDATE_CONFIGURATION_FAILURE: 'UPDATE_CONFIGURATION_FAILURE',

  // Delete configuration
  DELETE_CONFIGURATION_REQUEST: 'DELETE_CONFIGURATION_REQUEST',
  DELETE_CONFIGURATION_SUCCESS: 'DELETE_CONFIGURATION_SUCCESS',
  DELETE_CONFIGURATION_FAILURE: 'DELETE_CONFIGURATION_FAILURE',

  // Get site configuration
  FETCH_SITE_CONFIGURATION_REQUEST: 'FETCH_SITE_CONFIGURATION_REQUEST',
  FETCH_SITE_CONFIGURATION_SUCCESS: 'FETCH_SITE_CONFIGURATION_SUCCESS',
  FETCH_SITE_CONFIGURATION_FAILURE: 'FETCH_SITE_CONFIGURATION_FAILURE',

  // UI actions
  SET_SELECTED_CONFIGURATION: 'SET_SELECTED_CONFIGURATION',
  CLEAR_CONFIGURATION_ERROR: 'CLEAR_CONFIGURATION_ERROR',
  SET_CONFIGURATION_FILTER: 'SET_CONFIGURATION_FILTER'
};

// Action Creators

/**
 * Fetch all configurations with optional filters
 * @param {Object} params - Query parameters
 */
export const fetchConfigurations = (params = {}) => async (dispatch) => {
  dispatch({ type: CONFIGURATION_ACTIONS.FETCH_CONFIGURATIONS_REQUEST });

  try {
    const response = await configurationService.getConfigurations(params);

    if (response.success) {
      dispatch({
        type: CONFIGURATION_ACTIONS.FETCH_CONFIGURATIONS_SUCCESS,
        payload: {
          configurations: response.data,
          message: response.message
        }
      });
    } else {
      dispatch({
        type: CONFIGURATION_ACTIONS.FETCH_CONFIGURATIONS_FAILURE,
        payload: response.message || 'Failed to fetch configurations'
      });
    }

    return response;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch configurations';
    dispatch({
      type: CONFIGURATION_ACTIONS.FETCH_CONFIGURATIONS_FAILURE,
      payload: errorMessage
    });
    throw error;
  }
};

/**
 * Fetch a single configuration by ID
 * @param {number} id - Configuration ID
 */
export const fetchConfiguration = (id) => async (dispatch) => {
  dispatch({ type: CONFIGURATION_ACTIONS.FETCH_CONFIGURATION_REQUEST });

  try {
    const response = await configurationService.getConfiguration(id);

    if (response.success) {
      dispatch({
        type: CONFIGURATION_ACTIONS.FETCH_CONFIGURATION_SUCCESS,
        payload: {
          configuration: response.data,
          message: response.message
        }
      });
    } else {
      dispatch({
        type: CONFIGURATION_ACTIONS.FETCH_CONFIGURATION_FAILURE,
        payload: response.message || 'Failed to fetch configuration'
      });
    }

    return response;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch configuration';
    dispatch({
      type: CONFIGURATION_ACTIONS.FETCH_CONFIGURATION_FAILURE,
      payload: errorMessage
    });
    throw error;
  }
};

/**
 * Create a new configuration
 * @param {Object} configData - Configuration data to create
 */
export const createConfiguration = (configData) => async (dispatch) => {
  dispatch({ type: CONFIGURATION_ACTIONS.CREATE_CONFIGURATION_REQUEST });

  try {
    const response = await configurationService.createConfiguration(configData);

    if (response.success) {
      dispatch({
        type: CONFIGURATION_ACTIONS.CREATE_CONFIGURATION_SUCCESS,
        payload: {
          configuration: response.data,
          message: response.message || 'Configuration created successfully'
        }
      });

      // Refresh configurations list
      dispatch(fetchConfigurations());
    } else {
      dispatch({
        type: CONFIGURATION_ACTIONS.CREATE_CONFIGURATION_FAILURE,
        payload: response.message || 'Failed to create configuration'
      });
    }

    return response;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create configuration';
    dispatch({
      type: CONFIGURATION_ACTIONS.CREATE_CONFIGURATION_FAILURE,
      payload: errorMessage
    });
    throw error;
  }
};

/**
 * Update an existing configuration
 * @param {number} id - Configuration ID
 * @param {Object} configData - Updated configuration data
 */
export const updateConfiguration = (id, configData) => async (dispatch) => {
  dispatch({ type: CONFIGURATION_ACTIONS.UPDATE_CONFIGURATION_REQUEST });

  try {
    const response = await configurationService.updateConfiguration(id, configData);

    if (response.success) {
      dispatch({
        type: CONFIGURATION_ACTIONS.UPDATE_CONFIGURATION_SUCCESS,
        payload: {
          configuration: response.data,
          message: response.message || 'Configuration updated successfully'
        }
      });

      // Refresh configurations list
      dispatch(fetchConfigurations());
    } else {
      dispatch({
        type: CONFIGURATION_ACTIONS.UPDATE_CONFIGURATION_FAILURE,
        payload: response.message || 'Failed to update configuration'
      });
    }

    return response;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update configuration';
    dispatch({
      type: CONFIGURATION_ACTIONS.UPDATE_CONFIGURATION_FAILURE,
      payload: errorMessage
    });
    throw error;
  }
};

/**
 * Delete a configuration
 * @param {number} id - Configuration ID
 */
export const deleteConfiguration = (id) => async (dispatch) => {
  dispatch({ type: CONFIGURATION_ACTIONS.DELETE_CONFIGURATION_REQUEST });

  try {
    const response = await configurationService.deleteConfiguration(id);

    if (response.success) {
      dispatch({
        type: CONFIGURATION_ACTIONS.DELETE_CONFIGURATION_SUCCESS,
        payload: {
          configurationId: id,
          message: response.message || 'Configuration deleted successfully'
        }
      });

      // Refresh configurations list
      dispatch(fetchConfigurations());
    } else {
      dispatch({
        type: CONFIGURATION_ACTIONS.DELETE_CONFIGURATION_FAILURE,
        payload: response.message || 'Failed to delete configuration'
      });
    }

    return response;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete configuration';
    dispatch({
      type: CONFIGURATION_ACTIONS.DELETE_CONFIGURATION_FAILURE,
      payload: errorMessage
    });
    throw error;
  }
};

/**
 * Fetch site-specific configuration
 * @param {number} siteId - Site ID
 */
export const fetchSiteConfiguration = (siteId) => async (dispatch) => {
  dispatch({ type: CONFIGURATION_ACTIONS.FETCH_SITE_CONFIGURATION_REQUEST });

  try {
    const response = await configurationService.getSiteConfiguration(siteId);

    if (response.success) {
      dispatch({
        type: CONFIGURATION_ACTIONS.FETCH_SITE_CONFIGURATION_SUCCESS,
        payload: {
          siteConfiguration: response.data,
          message: response.message
        }
      });
    } else {
      dispatch({
        type: CONFIGURATION_ACTIONS.FETCH_SITE_CONFIGURATION_FAILURE,
        payload: response.message || 'Failed to fetch site configuration'
      });
    }

    return response;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch site configuration';
    dispatch({
      type: CONFIGURATION_ACTIONS.FETCH_SITE_CONFIGURATION_FAILURE,
      payload: errorMessage
    });
    throw error;
  }
};

// UI Action Creators

/**
 * Set selected configuration for editing
 * @param {Object} configuration - Configuration object
 */
export const setSelectedConfiguration = (configuration) => ({
  type: CONFIGURATION_ACTIONS.SET_SELECTED_CONFIGURATION,
  payload: configuration
});

/**
 * Clear configuration error state
 */
export const clearConfigurationError = () => ({
  type: CONFIGURATION_ACTIONS.CLEAR_CONFIGURATION_ERROR
});

/**
 * Set configuration filter parameters
 * @param {Object} filters - Filter parameters
 */
export const setConfigurationFilter = (filters) => ({
  type: CONFIGURATION_ACTIONS.SET_CONFIGURATION_FILTER,
  payload: filters
});
