import axiosInstance from '../api/axiosInstance';

/**
 * Vehicle Maintenance API Service
 * Handles all API calls related to vehicle maintenance
 */
const maintenanceService = {
  /**
   * Get all maintenance records with optional filters
   * @param {number} vehicleId - Filter by vehicle ID
   * @param {string} status - Filter by status
   * @returns {Promise<Array>} List of maintenance records
   */
  getAllMaintenance: async (vehicleId = null, status = null) => {
    try {
      const params = {};
      if (vehicleId) params.vehicleId = vehicleId;
      if (status) params.status = status;

      const response = await axiosInstance.get('/VehicleMaintenance', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      throw error;
    }
  },

  /**
   * Get maintenance record by ID
   * @param {number} maintenanceId - Maintenance record ID
   * @returns {Promise<Object>} Maintenance record
   */
  getMaintenanceById: async (maintenanceId) => {
    try {
      const response = await axiosInstance.get(`/VehicleMaintenance/${maintenanceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching maintenance record ${maintenanceId}:`, error);
      throw error;
    }
  },

  /**
   * Create new maintenance record
   * @param {Object} maintenanceData - Maintenance data
   * @returns {Promise<Object>} Created maintenance record
   */
  createMaintenance: async (maintenanceData) => {
    try {
      const response = await axiosInstance.post('/VehicleMaintenance', maintenanceData);
      return response.data;
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      throw error;
    }
  },

  /**
   * Update existing maintenance record
   * @param {number} maintenanceId - Maintenance record ID
   * @param {Object} maintenanceData - Updated maintenance data
   * @returns {Promise<Object>} Updated maintenance record
   */
  updateMaintenance: async (maintenanceId, maintenanceData) => {
    try {
      const response = await axiosInstance.put(`/VehicleMaintenance/${maintenanceId}`, maintenanceData);
      return response.data;
    } catch (error) {
      console.error(`Error updating maintenance record ${maintenanceId}:`, error);
      throw error;
    }
  },

  /**
   * Delete maintenance record
   * @param {number} maintenanceId - Maintenance record ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteMaintenance: async (maintenanceId) => {
    try {
      const response = await axiosInstance.delete(`/VehicleMaintenance/${maintenanceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting maintenance record ${maintenanceId}:`, error);
      throw error;
    }
  },

  /**
   * Get maintenance dashboard statistics
   * @returns {Promise<Object>} Dashboard data
   */
  getDashboard: async () => {
    try {
      const response = await axiosInstance.get('/VehicleMaintenance/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance dashboard:', error);
      throw error;
    }
  },

  /**
   * Get all maintenance schedules
   * @param {boolean} isActive - Filter by active status
   * @returns {Promise<Array>} List of maintenance schedules
   */
  getAllSchedules: async (isActive = null) => {
    try {
      const params = {};
      if (isActive !== null) params.isActive = isActive;

      const response = await axiosInstance.get('/VehicleMaintenance/schedules', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);
      throw error;
    }
  },

  /**
   * Create new maintenance schedule
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Object>} Created schedule
   */
  createSchedule: async (scheduleData) => {
    try {
      const response = await axiosInstance.post('/VehicleMaintenance/schedules', scheduleData);
      return response.data;
    } catch (error) {
      console.error('Error creating maintenance schedule:', error);
      throw error;
    }
  },

  /**
   * Update existing maintenance schedule
   * @param {number} scheduleId - Schedule ID
   * @param {Object} scheduleData - Updated schedule data
   * @returns {Promise<Object>} Updated schedule
   */
  updateSchedule: async (scheduleId, scheduleData) => {
    try {
      const response = await axiosInstance.put(`/VehicleMaintenance/schedules/${scheduleId}`, scheduleData);
      return response.data;
    } catch (error) {
      console.error(`Error updating maintenance schedule ${scheduleId}:`, error);
      throw error;
    }
  },

  /**
   * Import maintenance records from bulk data
   * @param {Array} records - Array of maintenance records to import
   * @returns {Promise<Object>} Import result with success count and errors
   */
  importMaintenanceRecords: async (records) => {
    try {
      const response = await axiosInstance.post('/VehicleMaintenance/import', records);
      return response.data;
    } catch (error) {
      console.error('Error importing maintenance records:', error);
      throw error;
    }
  },
};

export default maintenanceService;
