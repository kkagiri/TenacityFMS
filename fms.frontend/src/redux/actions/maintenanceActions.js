import maintenanceService from '../../services/maintenanceService';

// Action Types
export const FETCH_MAINTENANCE_REQUEST = 'FETCH_MAINTENANCE_REQUEST';
export const FETCH_MAINTENANCE_SUCCESS = 'FETCH_MAINTENANCE_SUCCESS';
export const FETCH_MAINTENANCE_FAILURE = 'FETCH_MAINTENANCE_FAILURE';

export const FETCH_DASHBOARD_REQUEST = 'FETCH_DASHBOARD_REQUEST';
export const FETCH_DASHBOARD_SUCCESS = 'FETCH_DASHBOARD_SUCCESS';
export const FETCH_DASHBOARD_FAILURE = 'FETCH_DASHBOARD_FAILURE';

export const FETCH_SCHEDULES_REQUEST = 'FETCH_SCHEDULES_REQUEST';
export const FETCH_SCHEDULES_SUCCESS = 'FETCH_SCHEDULES_SUCCESS';
export const FETCH_SCHEDULES_FAILURE = 'FETCH_SCHEDULES_FAILURE';

export const CREATE_MAINTENANCE_REQUEST = 'CREATE_MAINTENANCE_REQUEST';
export const CREATE_MAINTENANCE_SUCCESS = 'CREATE_MAINTENANCE_SUCCESS';
export const CREATE_MAINTENANCE_FAILURE = 'CREATE_MAINTENANCE_FAILURE';

export const UPDATE_MAINTENANCE_REQUEST = 'UPDATE_MAINTENANCE_REQUEST';
export const UPDATE_MAINTENANCE_SUCCESS = 'UPDATE_MAINTENANCE_SUCCESS';
export const UPDATE_MAINTENANCE_FAILURE = 'UPDATE_MAINTENANCE_FAILURE';

export const DELETE_MAINTENANCE_REQUEST = 'DELETE_MAINTENANCE_REQUEST';
export const DELETE_MAINTENANCE_SUCCESS = 'DELETE_MAINTENANCE_SUCCESS';
export const DELETE_MAINTENANCE_FAILURE = 'DELETE_MAINTENANCE_FAILURE';

export const IMPORT_MAINTENANCE_REQUEST = 'IMPORT_MAINTENANCE_REQUEST';
export const IMPORT_MAINTENANCE_SUCCESS = 'IMPORT_MAINTENANCE_SUCCESS';
export const IMPORT_MAINTENANCE_FAILURE = 'IMPORT_MAINTENANCE_FAILURE';

// Action Creators

/**
 * Fetch all maintenance records
 */
export const fetchMaintenanceRecords = (vehicleId = null, status = null) => {
  return async (dispatch) => {
    dispatch({ type: FETCH_MAINTENANCE_REQUEST });
    try {
      const data = await maintenanceService.getAllMaintenance(vehicleId, status);
      dispatch({
        type: FETCH_MAINTENANCE_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: FETCH_MAINTENANCE_FAILURE,
        payload: error.message || 'Failed to fetch maintenance records',
      });
      throw error;
    }
  };
};

/**
 * Fetch maintenance dashboard data
 */
export const fetchMaintenanceDashboard = () => {
  return async (dispatch) => {
    dispatch({ type: FETCH_DASHBOARD_REQUEST });
    try {
      const data = await maintenanceService.getDashboard();
      dispatch({
        type: FETCH_DASHBOARD_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: FETCH_DASHBOARD_FAILURE,
        payload: error.message || 'Failed to fetch dashboard data',
      });
      throw error;
    }
  };
};

/**
 * Fetch all maintenance schedules
 */
export const fetchMaintenanceSchedules = (isActive = null) => {
  return async (dispatch) => {
    dispatch({ type: FETCH_SCHEDULES_REQUEST });
    try {
      const data = await maintenanceService.getAllSchedules(isActive);
      dispatch({
        type: FETCH_SCHEDULES_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: FETCH_SCHEDULES_FAILURE,
        payload: error.message || 'Failed to fetch schedules',
      });
      throw error;
    }
  };
};

/**
 * Create new maintenance record
 */
export const createMaintenanceRecord = (maintenanceData) => {
  return async (dispatch) => {
    dispatch({ type: CREATE_MAINTENANCE_REQUEST });
    try {
      const response = await maintenanceService.createMaintenance(maintenanceData);
      dispatch({
        type: CREATE_MAINTENANCE_SUCCESS,
        payload: response.data,
      });
      return response;
    } catch (error) {
      dispatch({
        type: CREATE_MAINTENANCE_FAILURE,
        payload: error.message || 'Failed to create maintenance record',
      });
      throw error;
    }
  };
};

/**
 * Update existing maintenance record
 */
export const updateMaintenanceRecord = (maintenanceId, maintenanceData) => {
  return async (dispatch) => {
    dispatch({ type: UPDATE_MAINTENANCE_REQUEST });
    try {
      const response = await maintenanceService.updateMaintenance(maintenanceId, maintenanceData);
      dispatch({
        type: UPDATE_MAINTENANCE_SUCCESS,
        payload: response.data,
      });
      return response;
    } catch (error) {
      dispatch({
        type: UPDATE_MAINTENANCE_FAILURE,
        payload: error.message || 'Failed to update maintenance record',
      });
      throw error;
    }
  };
};

/**
 * Delete maintenance record
 */
export const deleteMaintenanceRecord = (maintenanceId) => {
  return async (dispatch) => {
    dispatch({ type: DELETE_MAINTENANCE_REQUEST });
    try {
      const response = await maintenanceService.deleteMaintenance(maintenanceId);
      dispatch({
        type: DELETE_MAINTENANCE_SUCCESS,
        payload: maintenanceId,
      });
      return response;
    } catch (error) {
      dispatch({
        type: DELETE_MAINTENANCE_FAILURE,
        payload: error.message || 'Failed to delete maintenance record',
      });
      throw error;
    }
  };
};

/**
 * Import maintenance records from Excel/CSV
 * @param {Array} records - Array of records to import
 */
export const importMaintenanceRecords = (records) => {
  return async (dispatch) => {
    dispatch({ type: IMPORT_MAINTENANCE_REQUEST });
    try {
      const response = await maintenanceService.importMaintenanceRecords(records);
      dispatch({
        type: IMPORT_MAINTENANCE_SUCCESS,
        payload: response,
      });
      return { success: true, imported: response?.imported || records.length, ...response };
    } catch (error) {
      dispatch({
        type: IMPORT_MAINTENANCE_FAILURE,
        payload: error.message || 'Failed to import maintenance records',
      });
      return { success: false, message: error.message || 'Failed to import maintenance records' };
    }
  };
};
