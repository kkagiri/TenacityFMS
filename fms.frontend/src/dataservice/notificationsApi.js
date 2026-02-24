import axiosInstance from "../api/axiosInstance";

class NotificationsApi {
  constructor() {
    this.basePath = "/notifications";
  }

  // Get notifications for the current user with filters
  async getNotifications({ type, status, dateFrom, dateTo, category, priority, isRead, siteId, skip, take } = {}) {
    try {
      const params = new URLSearchParams();
      if (type && type !== "all") params.append("type", type);
      if (status && status !== "all") params.append("status", status);
      if (category) params.append("category", category);
      if (priority) params.append("priority", priority);
      if (typeof isRead === "boolean") params.append("isRead", String(isRead));
      if (siteId != null) params.append("siteId", String(siteId));
      if (dateFrom) params.append("fromDate", new Date(dateFrom).toISOString());
      if (dateTo) params.append("toDate", new Date(dateTo).toISOString());
      if (skip != null) params.append("skip", String(skip));
      if (take != null) params.append("take", String(take));

      const qs = params.toString();
      const url = qs ? `${this.basePath}?${qs}` : this.basePath;
      const response = await axiosInstance.get(url);
      return {
        isSuccess: true,
        data: response.data?.data || response.data || [],
        message: response.data?.message || "Notifications retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return { isSuccess: false, data: [], message: error.response?.data?.message || "Failed to fetch notifications" };
    }
  }

  // Get statistics for chart
  async getStatistics({ dateFrom, dateTo } = {}) {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("fromDate", new Date(dateFrom).toISOString());
      if (dateTo) params.append("toDate", new Date(dateTo).toISOString());
      const qs = params.toString();
      const url = qs ? `${this.basePath}/statistics?${qs}` : `${this.basePath}/statistics`;
      const response = await axiosInstance.get(url);
      return {
        isSuccess: true,
        data: response.data?.data || response.data || [],
        message: response.data?.message || "Statistics retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching statistics:", error);
      return { isSuccess: false, data: [], message: error.response?.data?.message || "Failed to fetch statistics" };
    }
  }

  async markAsRead(notificationId) {
    try {
      const response = await axiosInstance.post(`${this.basePath}/${notificationId}/read`);
      return { isSuccess: true, data: response.data, message: response.data?.message || "Notification marked as read" };
    } catch (error) {
      console.error("Error marking as read:", error);
      return { isSuccess: false, data: null, message: error.response?.data?.message || "Failed to mark as read" };
    }
  }

  async markAllAsRead() {
    try {
      const response = await axiosInstance.post(`${this.basePath}/read-all`);
      return { isSuccess: true, data: response.data, message: response.data?.message || 'All notifications marked as read' };
    } catch (error) {
      console.error('Error marking all as read:', error);
      return { isSuccess: false, data: null, message: error.response?.data?.message || 'Failed to mark all as read' };
    }
  }

  async acknowledge(notificationId) {
    try {
      const response = await axiosInstance.post(`${this.basePath}/${notificationId}/acknowledge`);
      return { isSuccess: true, data: response.data, message: response.data?.message || "Notification acknowledged" };
    } catch (error) {
      console.error("Error acknowledging notification:", error);
      return { isSuccess: false, data: null, message: error.response?.data?.message || "Failed to acknowledge" };
    }
  }

  // Retry/send
  async sendNotification(notificationId) {
    try {
      const response = await axiosInstance.post(`${this.basePath}/${notificationId}/send`);
      return { isSuccess: true, data: response.data, message: response.data?.message || "Notification resend queued" };
    } catch (error) {
      console.error("Error resending notification:", error);
      return { isSuccess: false, data: null, message: error.response?.data?.message || "Failed to resend" };
    }
  }

  // Policies
  async getPolicies() {
    try {
      // Backend returns raw array (no { data })
      const response = await axiosInstance.get(`${this.basePath}/policies`);
      return {
        isSuccess: true,
        data: Array.isArray(response.data) ? response.data : (response.data?.data || []),
        message: "Policies retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching policies:", error);
      return { isSuccess: false, data: [], message: error.response?.data?.message || "Failed to fetch policies" };
    }
  }

  // Get single policy by id
  async getPolicy(policyId) {
    try {
      const response = await axiosInstance.get(`${this.basePath}/policies/${policyId}`);
      // Accept either wrapped or direct object
      const data = response.data?.data || response.data;
      return {
        isSuccess: true,
        data,
        message: response.data?.message || 'Policy retrieved successfully'
      };
    } catch (error) {
      // Fallback: fetch all policies then locate
      try {
        const list = await this.getPolicies();
        if (list.isSuccess) {
          const found = (list.data || []).find(p => String(p.id ?? p.policyId) === String(policyId));
          if (found) {
            return { isSuccess: true, data: found, message: 'Policy retrieved from list fallback' };
          }
        }
      } catch { }
      console.error('Error fetching policy:', error);
      return { isSuccess: false, data: null, message: error.response?.data?.message || 'Failed to fetch policy' };
    }
  }

  async createPolicy(payload) {
    try {
      const response = await axiosInstance.post(`${this.basePath}/policies`, payload);
      const success = response.data?.success !== false;
      return {
        isSuccess: success,
        data: { id: response.data?.policyId },
        message: response.data?.message || (success ? "Policy created" : "Failed to create policy"),
      };
    } catch (error) {
      console.error("Error creating policy:", error);
      return {
        isSuccess: false,
        data: null,
        message: error.response?.data?.message || "Failed to create policy",
      };
    }
  }

  // Update an existing policy
  async updatePolicy(policyId, payload) {
    try {
      const response = await axiosInstance.put(`${this.basePath}/policies/${policyId}`, payload);
      return {
        isSuccess: response.data?.success !== false,
        data: response.data,
        message: response.data?.message || "Policy updated successfully",
      };
    } catch (error) {
      console.error("Error updating policy:", error);
      return {
        isSuccess: false,
        data: null,
        message: error.response?.data?.message || "Failed to update policy",
      };
    }
  }

  // Delete a policy
  async deletePolicy(policyId) {
    try {
      const response = await axiosInstance.delete(`${this.basePath}/policies/${policyId}`);
      return {
        isSuccess: true,
        data: response.data,
        message: response.data?.message || "Policy deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting policy:", error);
      return { isSuccess: false, data: null, message: error.response?.data?.message || "Failed to delete policy" };
    }
  }

  // Update policy status (activate/deactivate)
  async updatePolicyStatus(policyId, status) {
    try {
      const response = await axiosInstance.patch(`${this.basePath}/policies/${policyId}/status`, { status });
      return {
        isSuccess: true,
        data: response.data,
        message: response.data?.message || "Policy status updated",
      };
    } catch (error) {
      console.error("Error updating policy status:", error);
      return { isSuccess: false, data: null, message: error.response?.data?.message || "Failed to update policy status" };
    }
  }

  // Duplicate a policy (backend must support this endpoint)
  async duplicatePolicy(policyId) {
    try {
      const response = await axiosInstance.post(`${this.basePath}/policies/${policyId}/duplicate`);
      return {
        isSuccess: true,
        data: response.data?.data || response.data,
        message: response.data?.message || "Policy duplicated",
      };
    } catch (error) {
      console.error("Error duplicating policy:", error);
      return { isSuccess: false, data: null, message: error.response?.data?.message || "Failed to duplicate policy" };
    }
  }

  // Search users for recipient picker (pulls from FMS user management)
  async searchUsers(query = '', take = 50) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      params.append('take', String(take));
      const response = await axiosInstance.get(`${this.basePath}/search/users?${params.toString()}`);
      return {
        isSuccess: response.data?.success !== false,
        data: response.data?.data || [],
        message: 'Users loaded',
      };
    } catch (error) {
      return { isSuccess: false, data: [], message: error.response?.data?.message || 'Failed to search users' };
    }
  }

  // Search roles for recipient picker (pulls from FMS role management)
  async searchRoles(query = '', take = 50) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      params.append('take', String(take));
      const response = await axiosInstance.get(`${this.basePath}/search/roles?${params.toString()}`);
      return {
        isSuccess: response.data?.success !== false,
        data: response.data?.data || [],
        message: 'Roles loaded',
      };
    } catch (error) {
      return { isSuccess: false, data: [], message: error.response?.data?.message || 'Failed to search roles' };
    }
  }
}

const notificationsApi = new NotificationsApi();
export default notificationsApi;
