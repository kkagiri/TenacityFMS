/**
 * File: issueTrackerService.js
 * Purpose: Handles all API operations for the Issue Tracker module
 * Dependencies: axiosInstance, devextreme notify
 * Last Modified: 2026-02-05
 *
 * Key Functions:
 * - getIssues(): Fetches all issues with optional filtering
 * - getIssueById(id): Fetches single issue details
 * - createIssue(data): Creates a new issue with notification
 * - updateIssue(id, data): Updates existing issue
 * - performQuickAction(id, actionType, notes): Performs quick actions (Mark Complete, Escalate Priority)
 * - markIssueComplete(id, notes): Shorthand for mark complete action
 * - escalateIssuePriority(id, notes): Shorthand for escalate priority action
 */
import axiosInstance from '../api/axiosInstance';
import notify from 'devextreme/ui/notify';

class IssueTrackerService {
  constructor() {
    this.baseURL = '/issuetracker';
  }

  extractFileNameFromContentDisposition(contentDisposition) {
    if (!contentDisposition || typeof contentDisposition !== 'string') {
      return null;
    }

    // Examples:
    // content-disposition: attachment; filename="Report.xlsx"
    // content-disposition: attachment; filename*=UTF-8''Report%20Final.xlsx
    const utf8Match = contentDisposition.match(/filename\*=(?:UTF-8''|utf-8'')([^;]+)/);
    if (utf8Match && utf8Match[1]) {
      try {
        return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ''));
      } catch {
        // fall through
      }
    }

    const asciiMatch = contentDisposition.match(/filename=([^;]+)/);
    if (asciiMatch && asciiMatch[1]) {
      return asciiMatch[1].trim().replace(/^"|"$/g, '');
    }

    return null;
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
   * Perform quick action on issue (Mark Complete, Escalate Priority) with notifications
   * @param {number} issueId - Issue ID
   * @param {string} actionType - Action type: "MarkComplete" or "EscalateHigh"
   * @param {string} [notes] - Optional notes for the action
   * @returns {Promise} Action result
   */
  async performQuickAction(issueId, actionType, notes = null) {
    try {
      const response = await axiosInstance.post(`${this.baseURL}/${issueId}/quick-action`, {
        actionType,
        notes
      });

      const actionMessage = actionType.toLowerCase().includes('complete')
        ? 'Issue marked as complete'
        : 'Issue escalated to high priority';

      notify({
        message: response.data?.message || actionMessage,
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
      console.error(`Error performing quick action on issue ${issueId}:`, error);
      throw this.handleError(error, 'Failed to perform action on issue');
    }
  }

  /**
   * Mark issue as complete with notification to opener
   * @param {number} issueId - Issue ID
   * @param {string} [notes] - Optional completion notes
   * @returns {Promise} Action result
   */
  async markIssueComplete(issueId, notes = null) {
    return this.performQuickAction(issueId, 'MarkComplete', notes);
  }

  /**
   * Escalate issue to high priority with notification to assignee
   * @param {number} issueId - Issue ID
   * @param {string} [notes] - Optional escalation notes
   * @returns {Promise} Action result
   */
  async escalateIssuePriority(issueId, notes = null) {
    return this.performQuickAction(issueId, 'EscalateHigh', notes);
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
   * Get user dashboard data - comprehensive issue statistics for the logged-in user
   * @param {Object} filters - Filtering parameters
   * @param {number} [filters.vehicleId] - Filter by vehicle
   * @param {number} [filters.siteId] - Filter by site
   * @param {number} [filters.categoryId] - Filter by category
   * @param {number} [filters.weeksBack] - Filter by last N weeks
   * @param {Date} [filters.startDate] - Filter start date
   * @param {Date} [filters.endDate] - Filter end date
   * @returns {Promise} User dashboard data with statistics and issue lists
   */
  async getUserDashboard(filters = {}) {
    try {
      const params = {};
      if (filters.vehicleId) params.vehicleId = filters.vehicleId;
      if (filters.siteId) params.siteId = filters.siteId;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.weeksBack) params.weeksBack = filters.weeksBack;
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();

      const response = await axiosInstance.get(`${this.baseURL}/user-dashboard`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user dashboard:', error);
      throw this.handleError(error, 'Failed to fetch user dashboard');
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
   * Bulk delete issues
   * @param {number[]} issueIds - Issue IDs to delete
   * @returns {Promise<{deletedIds:number[], failedIds:number[], failures:Array}>} Bulk delete summary
   */
  async bulkDeleteIssues(issueIds = []) {
    if (!Array.isArray(issueIds) || issueIds.length === 0) {
      return {
        deletedIds: [],
        failedIds: [],
        failures: []
      };
    }

    const results = await Promise.allSettled(
      issueIds.map((issueId) => axiosInstance.delete(`${this.baseURL}/${issueId}`))
    );

    const deletedIds = [];
    const failedIds = [];
    const failures = [];

    results.forEach((result, index) => {
      const issueId = issueIds[index];
      if (result.status === 'fulfilled') {
        deletedIds.push(issueId);
      } else {
        failedIds.push(issueId);
        failures.push({
          issueId,
          error: result.reason
        });
      }
    });

    if (deletedIds.length > 0 && failedIds.length === 0) {
      notify({
        message: `Successfully deleted ${deletedIds.length} issue(s)`,
        type: 'success',
        displayTime: 3000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });
    } else if (deletedIds.length > 0 && failedIds.length > 0) {
      notify({
        message: `Deleted ${deletedIds.length} issue(s), but failed to delete ${failedIds.length} issue(s).`,
        type: 'warning',
        displayTime: 4000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });
    } else {
      notify({
        message: 'Failed to delete selected issues.',
        type: 'error',
        displayTime: 4000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });
    }

    return {
      deletedIds,
      failedIds,
      failures
    };
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

  // ===== HELPER METHODS FOR DASHBOARD FILTERS =====

  /**
   * Get all vehicles for filtering
   * Uses the simple vehicle endpoint for lightweight data
   * @returns {Promise} List of vehicles
   */
  async getVehicles() {
    try {
      const response = await axiosInstance.get('/vehicle/simple');
      // Simple endpoint returns array directly, not FMSResponse
      return response.data || [];
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
  }

  /**
   * Get all sites for filtering
   * Uses the site endpoint for current user's sites
   * @returns {Promise} List of sites
   */
  async getSites() {
    try {
      const response = await axiosInstance.get('/site');
      const result = response.data;
      // Handle FMSResponse format
      if (result.isSuccess || result.IsSuccess) {
        return result.data || result.Data || [];
      }
      return result || [];
    } catch (error) {
      console.error('Error fetching sites:', error);
      return [];
    }
  }

  /**
   * Get issue categories for filtering
   * @returns {Promise} List of categories
   */
  async getCategories() {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/categories`);
      const result = response.data;
      // Handle FMSResponse format
      if (result.isSuccess || result.IsSuccess) {
        return result.data || result.Data || [];
      }
      return result || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // ===== ACTIVITY STREAM OPERATIONS =====

  /**
   * Get activity stream for an issue
   * @param {number} issueId - Issue ID
   * @param {number} [limit] - Optional limit on number of activities
   * @returns {Promise} List of activities
   */
  async getIssueActivities(issueId, limit = null) {
    try {
      const params = limit ? { limit } : {};
      const response = await axiosInstance.get(`${this.baseURL}/${issueId}/activities`, { params });
      const result = response.data;
      if (result.isSuccess || result.IsSuccess) {
        return result.data || result.Data || [];
      }
      return result || [];
    } catch (error) {
      console.error(`Error fetching activities for issue ${issueId}:`, error);
      return [];
    }
  }

  // ===== REMINDER OPERATIONS =====

  /**
   * Get reminder for an issue
   * @param {number} issueId - Issue ID
   * @returns {Promise} Reminder data or null
   */
  async getIssueReminder(issueId) {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/${issueId}/reminder`);
      const result = response.data;
      if (result.isSuccess || result.IsSuccess) {
        return result.data || result.Data || null;
      }
      return result || null;
    } catch (error) {
      console.error(`Error fetching reminder for issue ${issueId}:`, error);
      return null;
    }
  }

  /**
   * Create or update reminder for an issue
   * @param {number} issueId - Issue ID
   * @param {Object} reminderData - Reminder configuration
   * @returns {Promise} Created reminder
   */
  async createIssueReminder(issueId, reminderData) {
    try {
      const response = await axiosInstance.post(`${this.baseURL}/${issueId}/reminder`, reminderData);

      notify({
        message: 'Reminder set successfully',
        type: 'success',
        displayTime: 3000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });

      const result = response.data;
      if (result.isSuccess || result.IsSuccess) {
        return result.data || result.Data;
      }
      return result;
    } catch (error) {
      console.error(`Error creating reminder for issue ${issueId}:`, error);
      throw this.handleError(error, 'Failed to create reminder');
    }
  }

  // ===== LINKED ISSUES OPERATIONS =====

  /**
   * Get linked issues (same template or category)
   * @param {number} issueId - Issue ID
   * @returns {Promise} List of linked issues
   */
  async getLinkedIssues(issueId) {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/${issueId}/linked-issues`);
      const result = response.data;
      if (result.isSuccess || result.IsSuccess) {
        return result.data || result.Data || [];
      }
      return result || [];
    } catch (error) {
      console.error(`Error fetching linked issues for issue ${issueId}:`, error);
      return [];
    }
  }

  // ===== FOLLOW ISSUE OPERATIONS =====

  /**
   * Follow an issue to receive activity notifications
   * @param {number} issueId - Issue ID
   * @param {Object} options - Follow options
   * @param {boolean} [options.notifyByEmail=true] - Receive email notifications
   * @param {boolean} [options.notifyByPush=true] - Receive push notifications
   * @returns {Promise} Follow result
   */
  async followIssue(issueId, options = {}) {
    try {
      const response = await axiosInstance.post(`${this.baseURL}/${issueId}/follow`, {
        notifyByEmail: options.notifyByEmail ?? true,
        notifyByPush: options.notifyByPush ?? true
      });

      notify({
        message: 'You are now following this issue',
        type: 'success',
        displayTime: 3000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });

      const result = response.data;
      if (result.isSuccess || result.IsSuccess) {
        return result.data || result.Data;
      }
      return result;
    } catch (error) {
      console.error(`Error following issue ${issueId}:`, error);
      throw this.handleError(error, 'Failed to follow issue');
    }
  }

  /**
   * Unfollow an issue to stop receiving activity notifications
   * @param {number} issueId - Issue ID
   * @returns {Promise} Unfollow result
   */
  async unfollowIssue(issueId) {
    try {
      const response = await axiosInstance.delete(`${this.baseURL}/${issueId}/follow`);

      notify({
        message: 'You have unfollowed this issue',
        type: 'info',
        displayTime: 3000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });

      const result = response.data;
      if (result.isSuccess || result.IsSuccess) {
        return result.data || result.Data;
      }
      return result;
    } catch (error) {
      console.error(`Error unfollowing issue ${issueId}:`, error);
      throw this.handleError(error, 'Failed to unfollow issue');
    }
  }

  /**
   * Check if current user is following an issue
   * @param {number} issueId - Issue ID
   * @returns {Promise<{isFollowing: boolean, followerId?: number, followedDate?: string}>}
   */
  async isFollowingIssue(issueId) {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/${issueId}/is-following`);
      const result = response.data;
      if (result.isSuccess || result.IsSuccess) {
        return result.data || result.Data || { isFollowing: false };
      }
      return result || { isFollowing: false };
    } catch (error) {
      console.error(`Error checking follow status for issue ${issueId}:`, error);
      return { isFollowing: false };
    }
  }

  /**
   * Get all issues followed by the current user (for dashboard ticker)
   * @param {number} [limit] - Maximum number of issues to return
   * @returns {Promise<Array>} List of followed issues with activity summary
   */
  async getFollowedIssues(limit = null) {
    try {
      const params = limit ? { limit } : {};
      const response = await axiosInstance.get(`${this.baseURL}/followed`, { params });
      const result = response.data;
      if (result.isSuccess || result.IsSuccess) {
        return result.data || result.Data || [];
      }
      return result || [];
    } catch (error) {
      console.error('Error fetching followed issues:', error);
      return [];
    }
  }

  // ===== ATTACHMENT METHODS =====

  /**
   * Upload an attachment to an issue
   * @param {number} issueId - Issue ID
   * @param {File} file - The file to upload
   * @param {string} category - "Installation" | "Calibration" | "General"
   * @param {string} [description] - Optional description
   * @returns {Promise} Uploaded attachment DTO
   */
  async uploadAttachment(issueId, file, category = 'General', description = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (description) {
        formData.append('description', description);
      }

      const response = await axiosInstance.post(
        `${this.baseURL}/${issueId}/attachments`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const result = response.data;
      if (result.isSuccess || result.IsSuccess) {
        return result.data || result.Data;
      }
      throw new Error(result.message || result.Message || 'Upload failed');
    } catch (error) {
      console.error(`Error uploading attachment for issue ${issueId}:`, error);
      throw this.handleError(error, 'Failed to upload attachment');
    }
  }

  /**
   * Get all attachments for an issue
   * @param {number} issueId - Issue ID
   * @returns {Promise<Array>} List of attachment DTOs
   */
  async getAttachments(issueId) {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/${issueId}/attachments`);
      const result = response.data;
      if (result.isSuccess || result.IsSuccess) {
        return result.data || result.Data || [];
      }
      return [];
    } catch (error) {
      console.error(`Error fetching attachments for issue ${issueId}:`, error);
      return [];
    }
  }

  /**
   * Delete an attachment from an issue
   * @param {number} issueId - Issue ID
   * @param {number} attachmentId - Attachment ID
   * @returns {Promise<boolean>} Success indicator
   */
  async deleteAttachment(issueId, attachmentId) {
    try {
      const response = await axiosInstance.delete(`${this.baseURL}/${issueId}/attachments/${attachmentId}`);
      const result = response.data;
      return result.isSuccess || result.IsSuccess || false;
    } catch (error) {
      console.error(`Error deleting attachment ${attachmentId} from issue ${issueId}:`, error);
      throw this.handleError(error, 'Failed to delete attachment');
    }
  }

  /**
   * Get the download URL for an attachment
   * @param {number} issueId - Issue ID
   * @param {number} attachmentId - Attachment ID
   * @returns {string} Download URL path
   */
  getAttachmentDownloadUrl(issueId, attachmentId) {
    return `/api/v1/issuetracker/${issueId}/attachments/${attachmentId}/download`;
  }

  /**
   * Download an attachment as a Blob using authenticated axios request.
   * This is required because <a href> downloads do not include the Bearer token header.
   * @param {number} issueId
   * @param {number} attachmentId
   * @returns {Promise<{blob: Blob, fileName: string | null}>}
   */
  async downloadAttachment(issueId, attachmentId) {
    try {
      const response = await axiosInstance.get(
        `${this.baseURL}/${issueId}/attachments/${attachmentId}/download`,
        {
          responseType: 'blob',
          headers: {
            Accept: 'application/octet-stream'
          }
        }
      );

      const contentDisposition = response?.headers?.['content-disposition']
        || response?.headers?.['Content-Disposition'];
      const fileName = this.extractFileNameFromContentDisposition(contentDisposition);

      return {
        blob: response.data,
        fileName: fileName || null
      };
    } catch (error) {
      console.error(`Error downloading attachment ${attachmentId} for issue ${issueId}:`, error);
      throw this.handleError(error, 'Failed to download attachment');
    }
  }

  // ===== CLOSE ISSUE (APPROVER ONLY) =====

  /**
   * Close an issue (requires approver permission - the closer cannot be the assignee)
   * @param {number} issueId - Issue ID
   * @param {string} [notes] - Optional closing notes from the approver
   * @returns {Promise} Close result
   */
  async closeIssue(issueId, notes = null) {
    try {
      const payload = notes ? { notes } : {};
      const response = await axiosInstance.post(`${this.baseURL}/${issueId}/close`, payload);
      const result = response.data;

      if (result.isSuccess || result.IsSuccess) {
        notify({
          message: 'Issue closed successfully by approver.',
          type: 'success',
          displayTime: 3000,
          position: { my: 'top center', at: 'top center', of: window, offset: '0 20' }
        });
        return result.data || result.Data;
      }

      throw new Error(result.message || result.Message || 'Close failed');
    } catch (error) {
      console.error(`Error closing issue ${issueId}:`, error);

      // Surface the approver-specific error message to the user
      const errorMsg = error?.response?.data?.message
        || error?.response?.data?.Message
        || error?.message
        || 'Failed to close issue';

      notify({
        message: errorMsg,
        type: 'error',
        displayTime: 4000,
        position: { my: 'top center', at: 'top center', of: window, offset: '0 20' }
      });

      throw error;
    }
  }
}

const issueTrackerService = new IssueTrackerService();

export default issueTrackerService;
