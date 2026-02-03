import axiosInstance from '../api/axiosInstance';
import notify from 'devextreme/ui/notify';

/**
 * Issue Tracker Service
 * Handles all API operations for the Issue Tracker module
 * Following FMS service patterns with FMSResponse handling
 */
class IssueTrackerService {
  constructor() {
    this.baseURL = '/issuetracker';
  }

  /**
   * Get all issues with optional filtering
   * @param {Object} filters - Filtering parameters
   * @returns {Promise} List of issues
   */
  async getIssues(filters = {}) {
    try {
      const response = await axiosInstance.get(this.baseURL, { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw this.handleError(error, 'Failed to fetch issues');
    }
  }

  /**
   * Get issue by ID
   * @param {number} id - Issue ID
   * @returns {Promise} Issue details
   */
  async getIssueById(id) {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching issue ${id}:`, error);
      throw this.handleError(error, `Failed to fetch issue ${id}`);
    }
  }

  /**
   * Create new issue
   * @param {Object} issueData - Issue creation data
   * @returns {Promise} Created issue
   */
  async createIssue(issueData) {
    try {
      const response = await axiosInstance.post(this.baseURL, issueData);

      // Show success notification
      notify({
        message: 'Issue created successfully',
        type: 'success',
        displayTime: 3000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw this.handleError(error, 'Failed to create issue');
    }
  }

  /**
   * Update existing issue
   * @param {number} id - Issue ID
   * @param {Object} issueData - Updated issue data
   * @returns {Promise} Updated issue
   */
  async updateIssue(id, issueData) {
    try {
      const response = await axiosInstance.put(`${this.baseURL}/${id}`, issueData);

      // Show success notification
      notify({
        message: 'Issue updated successfully',
        type: 'success',
        displayTime: 3000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error updating issue ${id}:`, error);
      throw this.handleError(error, `Failed to update issue ${id}`);
    }
  }

  /**
   * Respond to issue assignment (confirm working / schedule date)
   * @param {number} issueId - Issue ID
   * @param {Object} responseData - Assignment response payload
   * @returns {Promise} Response result
   */
  async respondToIssueAssignment(issueId, responseData) {
    try {
      const response = await axiosInstance.post(`${this.baseURL}/${issueId}/assignment-response`, responseData);

      notify({
        message: response.data?.message || 'Issue assignment response submitted successfully',
        type: 'success',
        displayTime: 3000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error responding to issue assignment ${issueId}:`, error);
      throw this.handleError(error, 'Failed to submit assignment response');
    }
  }

  /**
   * Delete issue
   * @param {number} id - Issue ID
   * @returns {Promise} Deletion result
   */
  async deleteIssue(id) {
    try {
      const response = await axiosInstance.delete(`${this.baseURL}/${id}`);

      // Show success notification
      notify({
        message: 'Issue deleted successfully',
        type: 'success',
        displayTime: 3000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error deleting issue ${id}:`, error);
      throw this.handleError(error, `Failed to delete issue ${id}`);
    }
  }

  /**
   * Get issues by vehicle
   * @param {number} vehicleId - Vehicle ID
   * @param {Object} filters - Additional filters
   * @returns {Promise} Vehicle-specific issues
   */
  async getIssuesByVehicle(vehicleId, filters = {}) {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/vehicle/${vehicleId}`, { params: filters });
      return response.data;
    } catch (error) {
      console.error(`Error fetching issues for vehicle ${vehicleId}:`, error);
      throw this.handleError(error, `Failed to fetch issues for vehicle ${vehicleId}`);
    }
  }

  /**
   * Get issue categories
   * @returns {Promise} List of categories
   */
  async getIssueCategories() {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/categories`);
      return response.data;
    } catch (error) {
      console.error('Error fetching issue categories:', error);
      throw this.handleError(error, 'Failed to fetch issue categories');
    }
  }

  /**
   * Get issue priorities
   * @returns {Promise} List of priorities
   */
  async getIssuePriorities() {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/priorities`);
      return response.data;
    } catch (error) {
      console.error('Error fetching issue priorities:', error);
      throw this.handleError(error, 'Failed to fetch issue priorities');
    }
  }

  /**
   * Get issue statuses
   * @returns {Promise} List of statuses
   */
  async getIssueStatuses() {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/statuses`);
      return response.data;
    } catch (error) {
      console.error('Error fetching issue statuses:', error);
      throw this.handleError(error, 'Failed to fetch issue statuses');
    }
  }

  /**
   * Get issue analytics
   * @param {Object} filters - Analytics filter parameters
   * @returns {Promise} Analytics data
   */
  async getIssueAnalytics(filters = {}) {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/analytics`, { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching issue analytics:', error);
      throw this.handleError(error, 'Failed to fetch issue analytics');
    }
  }

  /**
   * Export issue report
   * @param {Object} exportParams - Export parameters
   * @returns {Promise} Export data or file
   */
  async exportIssueReport(exportParams) {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/reports/export`, {
        params: exportParams,
        responseType: exportParams.format === 'excel' ? 'blob' : 'json'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting issue report:', error);
      throw this.handleError(error, 'Failed to export issue report');
    }
  }

  /**
   * Bulk assign issues
   * @param {Object} bulkData - Bulk assignment data
   * @returns {Promise} Bulk operation result
   */
  async bulkAssignIssues(bulkData) {
    try {
      const response = await axiosInstance.put(`${this.baseURL}/bulk/assign`, bulkData);

      // Show success notification
      notify({
        message: `Successfully assigned ${bulkData.issueIds?.length || 0} issues`,
        type: 'success',
        displayTime: 3000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error in bulk assign operation:', error);
      throw this.handleError(error, 'Failed to bulk assign issues');
    }
  }

  /**
   * Bulk update issue status
   * @param {Object} bulkData - Bulk status update data
   * @returns {Promise} Bulk operation result
   */
  async bulkUpdateStatus(bulkData) {
    try {
      const response = await axiosInstance.put(`${this.baseURL}/bulk/status`, bulkData);

      // Show success notification
      notify({
        message: `Successfully updated status for ${bulkData.issueIds?.length || 0} issues`,
        type: 'success',
        displayTime: 3000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error in bulk status update:', error);
      throw this.handleError(error, 'Failed to bulk update issue status');
    }
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
      // Server responded with error status
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
            errorMessage = 'Issue not found';
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
      // Network error
      errorMessage = 'Network connection failed';
    }

    // Show notification to user
    notify({
      message: errorMessage,
      type: 'error',
      displayTime: 4000,
      position: {
        my: 'top center',
        at: 'top center',
        of: window,
        offset: '0 20'
      }
    });

    return new Error(errorMessage);
  }

  // ===== CATEGORY CRUD OPERATIONS =====

  /**
   * Create issue category
   * @param {Object} categoryData - Category data
   * @returns {Promise} Created category
   */
  async createIssueCategory(categoryData) {
    try {
      const response = await axiosInstance.post(`${this.baseURL}/categories`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error creating issue category:', error);
      throw this.handleError(error, 'Failed to create category');
    }
  }

  /**
   * Update issue category
   * @param {number} id - Category ID
   * @param {Object} categoryData - Updated category data
   * @returns {Promise} Updated category
   */
  async updateIssueCategory(id, categoryData) {
    try {
      const response = await axiosInstance.put(`${this.baseURL}/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      console.error(`Error updating issue category ${id}:`, error);
      throw this.handleError(error, `Failed to update category ${id}`);
    }
  }

  /**
   * Delete issue category
   * @param {number} id - Category ID
   * @returns {Promise} Deletion result
   */
  async deleteIssueCategory(id) {
    try {
      const response = await axiosInstance.delete(`${this.baseURL}/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting issue category ${id}:`, error);
      throw this.handleError(error, `Failed to delete category ${id}`);
    }
  }

  // ===== PRIORITY CRUD OPERATIONS =====

  /**
   * Create issue priority
   * @param {Object} priorityData - Priority data
   * @returns {Promise} Created priority
   */
  async createIssuePriority(priorityData) {
    try {
      const response = await axiosInstance.post(`${this.baseURL}/priorities`, priorityData);
      return response.data;
    } catch (error) {
      console.error('Error creating issue priority:', error);
      throw this.handleError(error, 'Failed to create priority');
    }
  }

  /**
   * Update issue priority
   * @param {number} id - Priority ID
   * @param {Object} priorityData - Updated priority data
   * @returns {Promise} Updated priority
   */
  async updateIssuePriority(id, priorityData) {
    try {
      const response = await axiosInstance.put(`${this.baseURL}/priorities/${id}`, priorityData);
      return response.data;
    } catch (error) {
      console.error(`Error updating issue priority ${id}:`, error);
      throw this.handleError(error, `Failed to update priority ${id}`);
    }
  }

  /**
   * Delete issue priority
   * @param {number} id - Priority ID
   * @returns {Promise} Deletion result
   */
  async deleteIssuePriority(id) {
    try {
      const response = await axiosInstance.delete(`${this.baseURL}/priorities/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting issue priority ${id}:`, error);
      throw this.handleError(error, `Failed to delete priority ${id}`);
    }
  }

  // ===== STATUS CRUD OPERATIONS =====

  /**
   * Create issue status
   * @param {Object} statusData - Status data
   * @returns {Promise} Created status
   */
  async createIssueStatus(statusData) {
    try {
      const response = await axiosInstance.post(`${this.baseURL}/statuses`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error creating issue status:', error);
      throw this.handleError(error, 'Failed to create status');
    }
  }

  /**
   * Update issue status
   * @param {number} id - Status ID
   * @param {Object} statusData - Updated status data
   * @returns {Promise} Updated status
   */
  async updateIssueStatus(id, statusData) {
    try {
      const response = await axiosInstance.put(`${this.baseURL}/statuses/${id}`, statusData);
      return response.data;
    } catch (error) {
      console.error(`Error updating issue status ${id}:`, error);
      throw this.handleError(error, `Failed to update status ${id}`);
    }
  }

  /**
   * Delete issue status
   * @param {number} id - Status ID
   * @returns {Promise} Deletion result
   */
  async deleteIssueStatus(id) {
    try {
      const response = await axiosInstance.delete(`${this.baseURL}/statuses/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting issue status ${id}:`, error);
      throw this.handleError(error, `Failed to delete status ${id}`);
    }
  }
}

const issueTrackerService = new IssueTrackerService();

export default issueTrackerService;
