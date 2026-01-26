/**
 * File: maintenanceActions.js
 * Purpose: Redux action creators for vehicle maintenance flows and related API response handling
 * Dependencies: maintenanceService
 * Last Modified: 2026-01-26
 *
 * Key Functions:
 * - fetchMaintenanceRecords(): Loads maintenance records with optional filters
 * - createMaintenanceRecord(): Creates a maintenance record and updates store
 * - updateMaintenanceRecord(): Updates a maintenance record and updates store
 * - deleteMaintenanceRecord(): Deletes a maintenance record and updates store
 * - importMaintenanceRecords(): Imports maintenance records from bulk data
 */
import maintenanceService from '../../services/maintenanceService';

const extractResponsePayload = (response, fallbackMessage) => {
  if (response && typeof response === 'object' && Object.prototype.hasOwnProperty.call(response, 'success')) {
    if (!response.success) {
      throw new Error(response.message || fallbackMessage);
    }
    return response.data ?? response;
  }

  if (response && typeof response === 'object' && Object.prototype.hasOwnProperty.call(response, 'data')) {
    return response.data;
  }

  return response;
};

const resolveErrorMessage = (error, fallbackMessage) => {
  return error?.message || error?.response?.data?.message || fallbackMessage;
};

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
      const response = await maintenanceService.getAllMaintenance(vehicleId, status);
      const data = extractResponsePayload(response, 'Failed to fetch maintenance records');
      dispatch({
        type: FETCH_MAINTENANCE_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: FETCH_MAINTENANCE_FAILURE,
        payload: resolveErrorMessage(error, 'Failed to fetch maintenance records'),
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
      const response = await maintenanceService.getDashboard();
      const data = extractResponsePayload(response, 'Failed to fetch dashboard data');
      dispatch({
        type: FETCH_DASHBOARD_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: FETCH_DASHBOARD_FAILURE,
        payload: resolveErrorMessage(error, 'Failed to fetch dashboard data'),
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
      const response = await maintenanceService.getAllSchedules(isActive);
      const data = extractResponsePayload(response, 'Failed to fetch schedules');
      dispatch({
        type: FETCH_SCHEDULES_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: FETCH_SCHEDULES_FAILURE,
        payload: resolveErrorMessage(error, 'Failed to fetch schedules'),
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
      const data = extractResponsePayload(response, 'Failed to create maintenance record');
      dispatch({
        type: CREATE_MAINTENANCE_SUCCESS,
        payload: data,
      });
      return response;
    } catch (error) {
      dispatch({
        type: CREATE_MAINTENANCE_FAILURE,
        payload: resolveErrorMessage(error, 'Failed to create maintenance record'),
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
      const data = extractResponsePayload(response, 'Failed to update maintenance record');
      dispatch({
        type: UPDATE_MAINTENANCE_SUCCESS,
        payload: data,
      });
      return response;
    } catch (error) {
      dispatch({
        type: UPDATE_MAINTENANCE_FAILURE,
        payload: resolveErrorMessage(error, 'Failed to update maintenance record'),
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
      extractResponsePayload(response, 'Failed to delete maintenance record');
      dispatch({
        type: DELETE_MAINTENANCE_SUCCESS,
        payload: maintenanceId,
      });
      return response;
    } catch (error) {
      dispatch({
        type: DELETE_MAINTENANCE_FAILURE,
        payload: resolveErrorMessage(error, 'Failed to delete maintenance record'),
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
      const data = extractResponsePayload(response, 'Failed to import maintenance records');
      dispatch({
        type: IMPORT_MAINTENANCE_SUCCESS,
        payload: data,
      });
      return { success: true, imported: data?.imported || records.length, ...data };
    } catch (error) {
      dispatch({
        type: IMPORT_MAINTENANCE_FAILURE,
        payload: resolveErrorMessage(error, 'Failed to import maintenance records'),
      });
      return { success: false, message: resolveErrorMessage(error, 'Failed to import maintenance records') };
    }
  };
};
