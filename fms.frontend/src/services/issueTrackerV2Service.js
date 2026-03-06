import axiosInstance from '../api/axiosInstance';
import notify from 'devextreme/ui/notify';

/**
 * Issue Tracker V2 Service
 * Handles API operations for Issue Tracker V2 features:
 * - Device Types
 * - Issue Templates
 * - Auto-Close Configurations
 */
class IssueTrackerV2Service {
  constructor() {
    this.baseURL = '/issuetracker';
    this.deviceTypesURL = `${this.baseURL}/device-types`;
    this.templatesURL = `${this.baseURL}/templates`;
    this.autoCloseURL = `${this.baseURL}/auto-close-configs`;
  }

  normalizeCheckerType(checkerType) {
    if (!checkerType) return checkerType;

    const checkerTypeMap = {
      Online: 'OnlineChecker',
      online: 'OnlineChecker',
      OnlineChecker: 'OnlineChecker',
      AlarmCleared: 'AlarmCleared',
      alarmcleared: 'AlarmCleared',
      StatusCheck: 'StatusChecker',
      StatusChecker: 'StatusChecker',
      statuschecker: 'StatusChecker',
      FuelActivity: 'FuelActivity',
      fuelactivity: 'FuelActivity',
      ActiveEvent: 'AlarmCleared',
      TimeBasedExpiry: 'Custom',
      ManualOnly: 'Custom',
      Custom: 'Custom',
      custom: 'Custom'
    };

    return checkerTypeMap[checkerType] || checkerType;
  }

  // ============================================
  // Device Types API
  // ============================================

  /**
   * Get all device types
   * @returns {Promise} List of device types
   */
  async getDeviceTypes() {
    try {
      const response = await axiosInstance.get(this.deviceTypesURL);
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching device types:', error);
      throw this.handleError(error, 'Failed to fetch device types');
    }
  }

  /**
   * Get device type by ID
   * @param {number} id - Device type ID
   * @returns {Promise} Device type details
   */
  async getDeviceTypeById(id) {
    try {
      const response = await axiosInstance.get(`${this.deviceTypesURL}/${id}`);
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error fetching device type ${id}:`, error);
      throw this.handleError(error, `Failed to fetch device type ${id}`);
    }
  }

  /**
   * Create new device type
   * @param {Object} deviceTypeData - Device type data
   * @returns {Promise} Created device type
   */
  async createDeviceType(deviceTypeData, options = {}) {
    try {
      const response = await axiosInstance.post(this.deviceTypesURL, deviceTypeData);
      if (!options.silent) this.showNotification('Device type created successfully', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error creating device type:', error);
      throw this.handleError(error, 'Failed to create device type');
    }
  }

  /**
   * Update device type
   * @param {number} id - Device type ID
   * @param {Object} deviceTypeData - Updated device type data
   * @returns {Promise} Updated device type
   */
  async updateDeviceType(id, deviceTypeData) {
    try {
      const payload = {
        id,
        ...deviceTypeData
      };

      const response = await axiosInstance.put(`${this.deviceTypesURL}/${id}`, payload);
      this.showNotification('Device type updated successfully', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error updating device type ${id}:`, error);
      throw this.handleError(error, `Failed to update device type ${id}`);
    }
  }

  /**
   * Delete device type
   * @param {number} id - Device type ID
   * @returns {Promise} Deletion result
   */
  async deleteDeviceType(id) {
    try {
      const response = await axiosInstance.delete(`${this.deviceTypesURL}/${id}`);
      this.showNotification('Device type deleted successfully', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error deleting device type ${id}:`, error);
      throw this.handleError(error, `Failed to delete device type ${id}`);
    }
  }

  // ============================================
  // Issue Templates API
  // ============================================

  /**
   * Get all issue templates
   * @returns {Promise} List of issue templates
   */
  async getTemplates() {
    try {
      const response = await axiosInstance.get(this.templatesURL);
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching issue templates:', error);
      throw this.handleError(error, 'Failed to fetch issue templates');
    }
  }

  /**
   * Get issue template by ID
   * @param {number} id - Template ID
   * @returns {Promise} Template details
   */
  async getTemplateById(id) {
    try {
      const response = await axiosInstance.get(`${this.templatesURL}/${id}`);
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error fetching issue template ${id}:`, error);
      throw this.handleError(error, `Failed to fetch issue template ${id}`);
    }
  }

  /**
   * Get issue templates by device type
   * @param {number} deviceTypeId - Device type ID
   * @returns {Promise} List of templates for device type
   */
  async getTemplatesByDeviceType(deviceTypeId) {
    try {
      const response = await axiosInstance.get(`${this.templatesURL}/by-device-type/${deviceTypeId}`);
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error fetching templates for device type ${deviceTypeId}:`, error);
      throw this.handleError(error, `Failed to fetch templates for device type ${deviceTypeId}`);
    }
  }

  /**
   * Create new issue template
   * @param {Object} templateData - Template data
   * @param {number} templateData.deviceTypeId - Device type ID
   * @param {string} templateData.name - Template name
   * @param {string} [templateData.titleTemplate] - Title template
   * @param {string} [templateData.descriptionTemplate] - Description template
   * @param {number} [templateData.defaultPriorityId] - Default priority ID
   * @param {number} [templateData.defaultStatusId] - Default status ID
   * @param {boolean} [templateData.isActive] - Is template active
   * @param {number[]} [templateData.categoryIds] - Category/tag IDs
   * @returns {Promise} Created template
   */
  async createTemplate(templateData, options = {}) {
    try {
      const response = await axiosInstance.post(this.templatesURL, templateData);
      if (!options.silent) this.showNotification('Issue template created successfully', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error creating issue template:', error);
      throw this.handleError(error, 'Failed to create issue template');
    }
  }

  /**
   * Update issue template
   * @param {number} id - Template ID
   * @param {Object} templateData - Updated template data
   * @returns {Promise} Updated template
   */
  async updateTemplate(id, templateData, options = {}) {
    try {
      const payload = {
        id,
        ...templateData
      };

      const response = await axiosInstance.put(`${this.templatesURL}/${id}`, payload);
      if (!options.silent) this.showNotification('Issue template updated successfully', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error updating issue template ${id}:`, error);
      throw this.handleError(error, `Failed to update issue template ${id}`);
    }
  }

  /**
   * Delete issue template
   * @param {number} id - Template ID
   * @returns {Promise} Deletion result
   */
  async deleteTemplate(id) {
    try {
      const response = await axiosInstance.delete(`${this.templatesURL}/${id}`);
      this.showNotification('Issue template deleted successfully', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error deleting issue template ${id}:`, error);
      throw this.handleError(error, `Failed to delete issue template ${id}`);
    }
  }

  // ============================================
  // Auto-Close Configurations API
  // ============================================

  /**
   * Get all auto-close configurations
   * @returns {Promise} List of auto-close configurations
   */
  async getAutoCloseConfigs() {
    try {
      const response = await axiosInstance.get(this.autoCloseURL);
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching auto-close configs:', error);
      throw this.handleError(error, 'Failed to fetch auto-close configurations');
    }
  }

  /**
   * Get auto-close configuration by ID
   * @param {number} id - Config ID
   * @returns {Promise} Config details
   */
  async getAutoCloseConfigById(id) {
    try {
      const response = await axiosInstance.get(`${this.autoCloseURL}/${id}`);
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error fetching auto-close config ${id}:`, error);
      throw this.handleError(error, `Failed to fetch auto-close config ${id}`);
    }
  }

  /**
   * Get auto-close configuration by template ID
   * @param {number} templateId - Template ID
   * @returns {Promise} Config for template
   */
  async getAutoCloseConfigByTemplate(templateId) {
    if (templateId === undefined || templateId === null || `${templateId}`.trim() === '' || `${templateId}` === 'undefined') {
      throw new Error('Template ID is required to fetch auto-close configuration');
    }

    try {
      const response = await axiosInstance.get(`${this.autoCloseURL}/by-template/${templateId}`);
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error fetching auto-close config for template ${templateId}:`, error);
      throw this.handleError(error, `Failed to fetch auto-close config for template ${templateId}`);
    }
  }

  /**
   * Create new auto-close configuration
   * @param {Object} configData - Configuration data
   * @returns {Promise} Created configuration
   */
  async createAutoCloseConfig(configData, options = {}) {
    try {
      const payload = {
        ...configData,
        checkerType: this.normalizeCheckerType(configData?.checkerType)
      };

      const response = await axiosInstance.post(this.autoCloseURL, payload);
      if (!options.silent) this.showNotification('Auto-close configuration created successfully', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error creating auto-close config:', error);
      throw this.handleError(error, 'Failed to create auto-close configuration');
    }
  }

  /**
   * Update auto-close configuration
   * @param {number} id - Config ID
   * @param {Object} configData - Updated configuration data
   * @returns {Promise} Updated configuration
   */
  async updateAutoCloseConfig(id, configData, options = {}) {
    try {
      const payload = {
        ...configData,
        checkerType: this.normalizeCheckerType(configData?.checkerType)
      };

      const response = await axiosInstance.put(`${this.autoCloseURL}/${id}`, payload);
      if (!options.silent) this.showNotification('Auto-close configuration updated successfully', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error updating auto-close config ${id}:`, error);
      throw this.handleError(error, `Failed to update auto-close config ${id}`);
    }
  }

  /**
   * Delete auto-close configuration
   * @param {number} id - Config ID
   * @returns {Promise} Deletion result
   */
  async deleteAutoCloseConfig(id) {
    try {
      const response = await axiosInstance.delete(`${this.autoCloseURL}/${id}`);
      this.showNotification('Auto-close configuration deleted successfully', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error deleting auto-close config ${id}:`, error);
      throw this.handleError(error, `Failed to delete auto-close config ${id}`);
    }
  }

  // ============================================
  // Template Actions API
  // ============================================

  /**
   * Get all template actions for a template (admin)
   * @param {number} templateId - Issue template ID
   * @returns {Promise} List of template actions
   */
  async getTemplateActions(templateId) {
    try {
      const response = await axiosInstance.get(`${this.templatesURL}/${templateId}/actions`);
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error fetching template actions for template ${templateId}:`, error);
      throw this.handleError(error, 'Failed to fetch template actions');
    }
  }

  /**
   * Get active template actions for completion popup
   * @param {number} templateId - Issue template ID
   * @returns {Promise} List of active template actions
   */
  async getTemplateActionsForCompletion(templateId) {
    try {
      const response = await axiosInstance.get(`${this.templatesURL}/${templateId}/actions/for-completion`);
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error fetching completion actions for template ${templateId}:`, error);
      throw this.handleError(error, 'Failed to fetch completion actions');
    }
  }

  /**
   * Get a single template action by ID
   * @param {number} templateId - Issue template ID
   * @param {number} actionId - Template action ID
   * @returns {Promise} Template action details
   */
  async getTemplateActionById(templateId, actionId) {
    try {
      const response = await axiosInstance.get(`${this.templatesURL}/${templateId}/actions/${actionId}`);
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error fetching template action ${actionId}:`, error);
      throw this.handleError(error, 'Failed to fetch template action');
    }
  }

  /**
   * Create a new template action
   * @param {number} templateId - Issue template ID
   * @param {Object} actionData - Template action data
   * @returns {Promise} Created template action
   */
  async createTemplateAction(templateId, actionData) {
    try {
      const response = await axiosInstance.post(`${this.templatesURL}/${templateId}/actions`, actionData);
      this.showNotification('Template action created successfully', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error creating template action:', error);
      throw this.handleError(error, 'Failed to create template action');
    }
  }

  /**
   * Update an existing template action
   * @param {number} templateId - Issue template ID
   * @param {number} actionId - Template action ID
   * @param {Object} actionData - Updated action data
   * @returns {Promise} Updated template action
   */
  async updateTemplateAction(templateId, actionId, actionData) {
    try {
      const response = await axiosInstance.put(`${this.templatesURL}/${templateId}/actions/${actionId}`, actionData);
      this.showNotification('Template action updated successfully', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error updating template action ${actionId}:`, error);
      throw this.handleError(error, 'Failed to update template action');
    }
  }

  /**
   * Delete a template action
   * @param {number} templateId - Issue template ID
   * @param {number} actionId - Template action ID
   * @returns {Promise} Deletion result
   */
  async deleteTemplateAction(templateId, actionId) {
    try {
      const response = await axiosInstance.delete(`${this.templatesURL}/${templateId}/actions/${actionId}`);
      this.showNotification('Template action deleted successfully', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error deleting template action ${actionId}:`, error);
      throw this.handleError(error, 'Failed to delete template action');
    }
  }

  /**
   * Toggle active status of a template action
   * @param {number} templateId - Issue template ID
   * @param {number} actionId - Template action ID
   * @returns {Promise} Updated template action
   */
  async toggleTemplateActionActive(templateId, actionId) {
    try {
      const response = await axiosInstance.patch(`${this.templatesURL}/${templateId}/actions/${actionId}/toggle-active`);
      this.showNotification('Template action status updated', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error toggling template action ${actionId}:`, error);
      throw this.handleError(error, 'Failed to toggle template action status');
    }
  }

  // ============================================
  // Issue Completion & Reassignment API
  // ============================================

  /**
   * Complete an issue with structured actions
   * @param {number} issueId - Issue ID
   * @param {Object} completionData - { actions: [...], notes? }
   * @returns {Promise} Completion result
   */
  async completeWithActions(issueId, completionData) {
    try {
      const response = await axiosInstance.post(`${this.baseURL}/${issueId}/complete-with-actions`, completionData);
      this.showNotification('Issue completed successfully', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error completing issue ${issueId}:`, error);
      throw this.handleError(error, 'Failed to complete issue');
    }
  }

  /**
   * Reassign an issue to a different user
   * @param {number} issueId - Issue ID
   * @param {Object} reassignData - { newAssigneeId, newAssigneeUserName?, notes? }
   * @returns {Promise} Reassignment result
   */
  async reassignIssue(issueId, reassignData) {
    try {
      const response = await axiosInstance.post(`${this.baseURL}/${issueId}/reassign`, reassignData);
      this.showNotification('Issue reassigned successfully', 'success');
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error reassigning issue ${issueId}:`, error);
      throw this.handleError(error, 'Failed to reassign issue');
    }
  }

  /**
   * Get structured completion records for an issue
   * @param {number} issueId - Issue ID
   * @returns {Promise} List of completion records
   */
  async getCompletionRecords(issueId) {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/${issueId}/completion-records`);
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error fetching completion records for issue ${issueId}:`, error);
      throw this.handleError(error, 'Failed to fetch completion records');
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Handle FMSResponse from backend
   * @param {Object} response - Axios response
   * @returns {Object} Data from response
   */
  handleResponse(response) {
    const data = response.data;

    // Handle FMSResponse wrapper
    if (data && typeof data === 'object') {
      if (data.isSuccess === true) {
        return data.data;
      } else if (data.isSuccess === false) {
        throw new Error(data.message || 'Operation failed');
      }
    }

    return data;
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   */
  showNotification(message, type) {
    notify({
      message,
      type,
      displayTime: 3000,
      position: {
        my: 'top center',
        at: 'top center',
        of: window,
        offset: '0 20'
      }
    });
  }

  /**
   * Handle errors consistently
   * @param {Object} error - Error object
   * @param {string} defaultMessage - Default error message
   * @returns {Error} Formatted error
   */
  handleError(error, defaultMessage) {
    let errorMessage = defaultMessage;

    if (error.response) {
      const { status, data } = error.response;

      if (data && data.message) {
        errorMessage = data.message;
      } else {
        switch (status) {
          case 400:
            errorMessage = 'Invalid request data';
            break;
          case 401:
            errorMessage = 'Unauthorized access';
            break;
          case 403:
            errorMessage = 'Insufficient permissions';
            break;
          case 404:
            errorMessage = 'Resource not found';
            break;
          case 409:
            errorMessage = 'Conflict in request';
            break;
          case 500:
            errorMessage = 'Server error occurred';
            break;
          default:
            errorMessage = defaultMessage;
        }
      }
    } else if (error.request) {
      errorMessage = 'No response from server. Please check your connection.';
    }

    // Show error notification
    this.showNotification(errorMessage, 'error');

    const formattedError = new Error(errorMessage);
    formattedError.originalError = error;
    return formattedError;
  }
}

const issueTrackerV2Service = new IssueTrackerV2Service();

export default issueTrackerV2Service;
