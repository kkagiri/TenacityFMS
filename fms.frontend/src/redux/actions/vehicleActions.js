import axiosInstance from "./../../api/axiosInstance";
// Action types
export const FETCH_VEHICLES_SUCCESS = "FETCH_VEHICLES_SUCCESS";
export const FETCH_VEHICLES_FAILURE = "FETCH_VEHICLES_FAILURE";
export const UPDATE_VEHICLES_SUCCESS = "UPDATE_VEHICLES_SUCCESS";
export const UPDATE_VEHICLES_FAILURE = "UPDATE_VEHICLES_FAILURE";
export const CREATE_VEHICLE_SUCCESS = "CREATE_VEHICLE_SUCCESS";
export const CREATE_VEHICLE_FAILURE = "CREATE_VEHICLE_FAILURE";

// New action types for vehicle-related features
export const FETCH_VEHICLE_CONSUMPTION_HISTORY_SUCCESS = "FETCH_VEHICLE_CONSUMPTION_HISTORY_SUCCESS";
export const FETCH_VEHICLE_CONSUMPTION_HISTORY_FAILURE = "FETCH_VEHICLE_CONSUMPTION_HISTORY_FAILURE";
export const FETCH_VEHICLE_FUELING_HISTORY_SUCCESS = "FETCH_VEHICLE_FUELING_HISTORY_SUCCESS";
export const FETCH_VEHICLE_FUELING_HISTORY_FAILURE = "FETCH_VEHICLE_FUELING_HISTORY_FAILURE";
export const FETCH_VEHICLE_MAINTENANCE_HISTORY_SUCCESS = "FETCH_VEHICLE_MAINTENANCE_HISTORY_SUCCESS";
export const FETCH_VEHICLE_MAINTENANCE_HISTORY_FAILURE = "FETCH_VEHICLE_MAINTENANCE_HISTORY_FAILURE";
export const ADD_MAINTENANCE_RECORD_SUCCESS = "ADD_MAINTENANCE_RECORD_SUCCESS";
export const ADD_MAINTENANCE_RECORD_FAILURE = "ADD_MAINTENANCE_RECORD_FAILURE";
export const FETCH_VEHICLE_SCHEDULES_SUCCESS = "FETCH_VEHICLE_SCHEDULES_SUCCESS";
export const FETCH_VEHICLE_SCHEDULES_FAILURE = "FETCH_VEHICLE_SCHEDULES_FAILURE";
export const ADD_VEHICLE_SCHEDULE_SUCCESS = "ADD_VEHICLE_SCHEDULE_SUCCESS";
export const ADD_VEHICLE_SCHEDULE_FAILURE = "ADD_VEHICLE_SCHEDULE_FAILURE";
export const UPDATE_VEHICLE_SCHEDULE_SUCCESS = "UPDATE_VEHICLE_SCHEDULE_SUCCESS";
export const UPDATE_VEHICLE_SCHEDULE_FAILURE = "UPDATE_VEHICLE_SCHEDULE_FAILURE";
export const DELETE_VEHICLE_SCHEDULE_SUCCESS = "DELETE_VEHICLE_SCHEDULE_SUCCESS";
export const DELETE_VEHICLE_SCHEDULE_FAILURE = "DELETE_VEHICLE_SCHEDULE_FAILURE";

// New action types for consumption history state management
export const FETCH_VEHICLE_CONSUMPTION_HISTORY_REQUEST = 'FETCH_VEHICLE_CONSUMPTION_HISTORY_REQUEST';
export const CLEAR_VEHICLE_CONSUMPTION_HISTORY = 'CLEAR_VEHICLE_CONSUMPTION_HISTORY';

// Thunk action for fetching vehicles
export const fetchVehicleList = () => async (dispatch) => {
  try {
    console.log('Fetching vehicles from API...');
    const response = await axiosInstance.get(`/vehicle`);

    if (response.data && Array.isArray(response.data)) {
      dispatch({ type: FETCH_VEHICLES_SUCCESS, payload: response.data });
      return response.data;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      dispatch({ type: FETCH_VEHICLES_SUCCESS, payload: response.data.data });
      return response.data.data;
    } else {
      console.warn('Unexpected vehicle data format:', response.data);
      dispatch({ type: FETCH_VEHICLES_SUCCESS, payload: [] });
      return [];
    }
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch vehicles';
    dispatch({ type: FETCH_VEHICLES_FAILURE, payload: errorMessage });
    throw error; // Re-throw to be caught by the component
  }
};

export const getVehicleById = (vehicleId) => async (dispatch) => {
  try {
    const response = await axiosInstance.get(`/vehicle/${vehicleId}`);

    // Return consistent structure with success and data properties
    if (response.data) {
      return {
        success: true,
        data: response.data.data || response.data
      };
    } else {
      throw new Error('No vehicle data received');
    }
  } catch (error) {
    console.error('Error fetching vehicle by ID:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch vehicle';
    throw new Error(errorMessage);
  }
}

export const updateVehicles = (changes) => async (dispatch) => {
  try {
    const updatedVehicles = changes.map((change) => ({
      ...change.data,
      vehicleId: change.key,
    }));
    const response = await axiosInstance.put("/vehicle", updatedVehicles);
    if (response.data.success) {
      dispatch({ type: UPDATE_VEHICLES_SUCCESS, payload: response.data.data });
      return response.data;
    } else {
      throw new Error(response.data.message || "Error updating vehicle");
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    dispatch({ type: UPDATE_VEHICLES_FAILURE, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};


export const deleteVehicle = (vehicleId) => async (dispatch) => {
  try {
    const response = await axiosInstance.delete(`/vehicle/${vehicleId}`);

    if (response.data && response.data.success) {
      return {
        success: true,
        message: 'Vehicle deleted successfully'
      };
    } else {
      throw new Error(response.data?.message || 'Failed to delete vehicle');
    }
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete vehicle';
    return {
      success: false,
      message: errorMessage
    };
  }
};



export const updateVehicle = (vehicleId, vehicleData) => async (dispatch) => {
  try {
    const response = await axiosInstance.put(`/vehicle/${vehicleId}`, vehicleData);

    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: 'Vehicle updated successfully'
      };
    } else {
      throw new Error(response.data?.message || 'Failed to update vehicle');
    }
  } catch (error) {
    console.error('Error updating vehicle:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update vehicle';
    return {
      success: false,
      message: errorMessage
    };
  }
};

export const createVehicle = (vehicleData) => async (dispatch) => {
  try {
    const response = await axiosInstance.post('/vehicle/create', vehicleData);
    // Return the same format as the dataservice
    const result = {
      success: true,
      data: response.data,
      message: 'Vehicle created successfully'
    };
    dispatch({type: CREATE_VEHICLE_SUCCESS, payload: response.data});
    return result;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error creating vehicle';
    dispatch({type: CREATE_VEHICLE_FAILURE, payload: errorMessage});
    // Return the same format as the dataservice for error
    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

// =============================================================================
// PLACEHOLDER ACTIONS FOR FUTURE IMPLEMENTATION
// These actions provide a structure for future API integration
// =============================================================================

export const fetchVehicleConsumptionHistory = ({ vehicleId, dateFrom, dateTo, entry = 30 }, options = {}) => async (dispatch) => {
  try {
    // Dispatch REQUEST action first
    dispatch({ type: FETCH_VEHICLE_CONSUMPTION_HISTORY_REQUEST });

    console.log('=== fetchVehicleConsumptionHistory called ===');

    const formattedDate = dateTo ? new Date(dateTo).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    let days = entry;
    if (dateFrom && dateTo) {
      const diffTime = Math.abs(new Date(dateTo) - new Date(dateFrom));
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      days = Math.max(5, Math.min(30, days));
    }

    const response = await axiosInstance.get(
      `/consumption/gethistoryconsumptionbyvehicle`,
      {
        params: {
          vehicleId,
          datestring: formattedDate,
          entry: days
        },
        // Pass through AbortController signal when provided
        signal: options.signal
      }
    );

    // Process data with stable keys and serialize dates (avoid non-serializable Date objects in Redux state)
    const usedKeys = new Map();
    const processedData = (response.data || []).map((item, idx) => {
      const dateObj = item.date ? new Date(item.date) : null;
      const isoDate = dateObj ? dateObj.toISOString() : `no-date-${idx}`;
      const baseId = (item.id !== undefined && item.id !== null) ? String(item.id) : `no-id-${idx}`;
      let rawKey = `${baseId}__${isoDate}`;
      // Ensure rowKey uniqueness
      const seen = usedKeys.get(rawKey) || 0;
      usedKeys.set(rawKey, seen + 1);
      const rowKey = seen === 0 ? rawKey : `${rawKey}__dup${seen}`;

      return {
        ...item,
        // Store ISO string to keep Redux state serializable
        date: isoDate,
        rowKey
      };
    });

    dispatch({
      type: FETCH_VEHICLE_CONSUMPTION_HISTORY_SUCCESS,
      payload: processedData
    });

    return {
      success: true,
      data: processedData,
      message: 'Consumption history loaded successfully'
    };
  } catch (error) {
    // Swallow cancellations without dispatching failure
    if (error?.name === 'CanceledError' || error?.message === 'canceled' || error?.code === 'ERR_CANCELED') {
      return { success: false, data: null, message: 'Request canceled' };
    }
    console.error('=== fetchVehicleConsumptionHistory ERROR ===', error);

    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch consumption history';
    dispatch({
      type: FETCH_VEHICLE_CONSUMPTION_HISTORY_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

// Add clear action
export const clearVehicleConsumptionHistory = () => ({
  type: CLEAR_VEHICLE_CONSUMPTION_HISTORY
});

// Vehicle Fueling History Actions
export const fetchVehicleFuelingHistory = ({ vehicleId, dateFrom, dateTo }) => async (dispatch) => {
  try {
    // TODO: Replace with actual API call
    // const response = await axiosInstance.get(`/vehicle/${vehicleId}/fueling-history`, {
    //   params: { dateFrom, dateTo }
    // });

    // Mock data for UI development
    const mockData = [
      {
        id: 1,
        date: '2024-07-01T00:00:00.000Z', // Convert to ISO string
        fuelStationName: 'Shell Westlands',
        fuelType: 'Diesel',
        quantity: 55.0,
        pricePerLiter: 150.00,
        totalCost: 8250.00,
        odometer: 125400,
        attendantName: 'Mary Johnson',
        receiptNumber: 'SH-001234',
        status: 'Completed'
      },
      {
        id: 2,
        date: '2024-07-05T00:00:00.000Z', // Convert to ISO string
        fuelStationName: 'Total Mombasa',
        fuelType: 'Diesel',
        quantity: 58.5,
        pricePerLiter: 148.50,
        totalCost: 8687.25,
        odometer: 126350,
        attendantName: 'Peter Mbeki',
        receiptNumber: 'TT-005678',
        status: 'Completed'
      }
    ];

    dispatch({
      type: FETCH_VEHICLE_FUELING_HISTORY_SUCCESS,
      payload: mockData
    });

    return {
      success: true,
      data: mockData,
      message: 'Fueling history loaded successfully (mock data)'
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch fueling history';
    dispatch({
      type: FETCH_VEHICLE_FUELING_HISTORY_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

// Vehicle Maintenance History Actions
export const fetchVehicleMaintenanceHistory = ({ vehicleId, dateFrom, dateTo }) => async (dispatch) => {
  try {
    // TODO: Replace with actual API call
    // const response = await axiosInstance.get(`/vehicle/${vehicleId}/maintenance-history`, {
    //   params: { dateFrom, dateTo }
    // });

    // Mock data for UI development
    const mockData = [
      {
        id: 1,
        date: '2024-06-15T00:00:00.000Z', // Convert to ISO string
        maintenanceType: 'Scheduled Service',
        description: 'Oil change, filter replacement, general inspection',
        serviceProvider: 'ABC Motors',
        cost: 15000.00,
        odometer: 124500,
        nextServiceDue: '2024-09-15T00:00:00.000Z', // Convert to ISO string
        status: 'Completed',
        invoiceNumber: 'INV-2024-001'
      },
      {
        id: 2,
        date: '2024-07-10T00:00:00.000Z', // Convert to ISO string
        maintenanceType: 'Repair',
        description: 'Brake pad replacement',
        serviceProvider: 'XYZ Service Center',
        cost: 8500.00,
        odometer: 125800,
        nextServiceDue: null,
        status: 'Completed',
        invoiceNumber: 'INV-2024-045'
      }
    ];

    dispatch({
      type: FETCH_VEHICLE_MAINTENANCE_HISTORY_SUCCESS,
      payload: mockData
    });

    return {
      success: true,
      data: mockData,
      message: 'Maintenance history loaded successfully (mock data)'
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch maintenance history';
    dispatch({
      type: FETCH_VEHICLE_MAINTENANCE_HISTORY_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

export const addMaintenanceRecord = (vehicleId, maintenanceData) => async (dispatch) => {
  try {
    // TODO: Replace with actual API call
    // const response = await axiosInstance.post(`/vehicle/${vehicleId}/maintenance`, maintenanceData);

    // Mock response
    const newRecord = {
      id: Date.now(),
      ...maintenanceData,
      status: 'Scheduled'
    };

    dispatch({
      type: ADD_MAINTENANCE_RECORD_SUCCESS,
      payload: newRecord
    });

    return {
      success: true,
      data: newRecord,
      message: 'Maintenance record added successfully (mock data)'
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to add maintenance record';
    dispatch({
      type: ADD_MAINTENANCE_RECORD_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

// Vehicle Schedule Actions
export const fetchVehicleSchedules = (vehicleId) => async (dispatch) => {
  try {
    // TODO: Replace with actual API call
    // const response = await axiosInstance.get(`/vehicle/${vehicleId}/schedules`);

    // Mock data for UI development
    const mockData = [
      {
        id: 1,
        title: 'Site Inspection - Mombasa',
        startDateTime: '2024-07-20T08:00:00.000Z', // Convert to ISO string
        endDateTime: '2024-07-20T17:00:00.000Z', // Convert to ISO string
        location: 'Mombasa Site',
        driverName: 'John Doe',
        purpose: 'Monthly site inspection',
        status: 'Scheduled',
        priority: 'High'
      },
      {
        id: 2,
        title: 'Equipment Transport',
        startDateTime: '2024-07-22T09:00:00.000Z', // Convert to ISO string
        endDateTime: '2024-07-22T15:00:00.000Z', // Convert to ISO string
        location: 'Kisumu Branch',
        driverName: 'Jane Smith',
        purpose: 'Transport new equipment',
        status: 'Scheduled',
        priority: 'Medium'
      }
    ];

    dispatch({
      type: FETCH_VEHICLE_SCHEDULES_SUCCESS,
      payload: mockData
    });

    return {
      success: true,
      data: mockData,
      message: 'Vehicle schedules loaded successfully (mock data)'
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch vehicle schedules';
    dispatch({
      type: FETCH_VEHICLE_SCHEDULES_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

export const addVehicleSchedule = (vehicleId, scheduleData) => async (dispatch) => {
  try {
    // TODO: Replace with actual API call
    // const response = await axiosInstance.post(`/vehicle/${vehicleId}/schedules`, scheduleData);

    // Mock response
    const newSchedule = {
      id: Date.now(),
      ...scheduleData,
      status: 'Scheduled'
    };

    dispatch({
      type: ADD_VEHICLE_SCHEDULE_SUCCESS,
      payload: newSchedule
    });

    return {
      success: true,
      data: newSchedule,
      message: 'Vehicle schedule added successfully (mock data)'
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to add vehicle schedule';
    dispatch({
      type: ADD_VEHICLE_SCHEDULE_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

export const updateVehicleSchedule = (vehicleId, scheduleId, scheduleData) => async (dispatch) => {
  try {
    // TODO: Replace with actual API call
    // const response = await axiosInstance.put(`/vehicle/${vehicleId}/schedules/${scheduleId}`, scheduleData);

    // Mock response
    const updatedSchedule = {
      id: scheduleId,
      ...scheduleData
    };

    dispatch({
      type: UPDATE_VEHICLE_SCHEDULE_SUCCESS,
      payload: updatedSchedule
    });

    return {
      success: true,
      data: updatedSchedule,
      message: 'Vehicle schedule updated successfully (mock data)'
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update vehicle schedule';
    dispatch({
      type: UPDATE_VEHICLE_SCHEDULE_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};

export const deleteVehicleSchedule = (vehicleId, scheduleId) => async (dispatch) => {
  try {
    // TODO: Replace with actual API call
    // const response = await axiosInstance.delete(`/vehicle/${vehicleId}/schedules/${scheduleId}`);

    dispatch({
      type: DELETE_VEHICLE_SCHEDULE_SUCCESS,
      payload: scheduleId
    });

    return {
      success: true,
      data: null,
      message: 'Vehicle schedule deleted successfully (mock data)'
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete vehicle schedule';
    dispatch({
      type: DELETE_VEHICLE_SCHEDULE_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
};
