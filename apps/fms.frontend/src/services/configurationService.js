import axiosInstance from '../api/axiosInstance';

/**
 * Configuration Service for automated fueling configuration management
 * Handles API calls to the backend configuration endpoints
 */
class ConfigurationService {

  /**
   * Get all automated fueling configurations
   * @param {Object} params - Query parameters
   * @param {number} params.siteId - Optional site ID filter
   * @param {boolean} params.isActive - Optional active status filter
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.pageSize - Page size (default: 50)
   * @returns {Promise<Object>} FMSResponse with configuration list
   */
  async getConfigurations(params = {}) {
    try {
      const { siteId, isActive, page = 1, pageSize = 50 } = params;
      const queryParams = new URLSearchParams();

      if (siteId !== undefined) queryParams.append('siteId', siteId);
      if (isActive !== undefined) queryParams.append('isActive', isActive);
      queryParams.append('page', page);
      queryParams.append('pageSize', pageSize);

      const response = await axiosInstance.get(`/automated-fueling-configuration?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching configurations:', error);
      throw error;
    }
  }

  /**
   * Get a specific configuration by ID
   * @param {number} id - Configuration ID
   * @returns {Promise<Object>} FMSResponse with configuration data
   */
  async getConfiguration(id) {
    try {
      const response = await axiosInstance.get(`/automated-fueling-configuration/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching configuration ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new configuration
   * @param {Object} configData - Configuration data to create
   * @returns {Promise<Object>} FMSResponse with created configuration
   */
  async createConfiguration(configData) {
    try {
      const response = await axiosInstance.post('/automated-fueling-configuration', configData);
      return response.data;
    } catch (error) {
      console.error('Error creating configuration:', error);
      throw error;
    }
  }

  /**
   * Update an existing configuration
   * @param {number} id - Configuration ID
   * @param {Object} configData - Updated configuration data
   * @returns {Promise<Object>} FMSResponse with updated configuration
   */
  async updateConfiguration(id, configData) {
    try {
      const response = await axiosInstance.put(`/automated-fueling-configuration/${id}`, {
        ...configData,
        id: id
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating configuration ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a configuration
   * @param {number} id - Configuration ID
   * @returns {Promise<Object>} FMSResponse confirmation
   */
  async deleteConfiguration(id) {
    try {
      const response = await axiosInstance.delete(`/automated-fueling-configuration/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting configuration ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get effective configuration for a specific site
   * @param {number} siteId - Site ID
   * @returns {Promise<Object>} FMSResponse with effective configuration
   */
  async getSiteConfiguration(siteId) {
    try {
      const response = await axiosInstance.get(`/automated-fueling-configuration/site/${siteId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching site configuration for ${siteId}:`, error);
      throw error;
    }
  }
}

export default new ConfigurationService();
