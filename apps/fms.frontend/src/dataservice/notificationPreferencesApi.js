import axiosInstance from "../api/axiosInstance";

/**
 * API service for managing user notification preferences
 */
class NotificationPreferencesApi {
  constructor() {
  // Align with backend route prefix
  this.basePath = "/notifications/preferences";
  }

  /**
   * Get user notification preferences by user ID
   * @param {string} userId - User ID
   * @returns {Promise} API response
   */
  async getUserPreferences(userId) {
    try {
      const response = await axiosInstance.get(`${this.basePath}/user/${userId}`);
      return {
        isSuccess: true,
        data: response.data || [],
        message: "Preferences retrieved successfully"
      };
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      return {
        isSuccess: false,
        data: [],
        message: error.response?.data?.message || "Failed to fetch preferences"
      };
    }
  }

  /**
   * Get current user's notification preferences
   * @returns {Promise} API response
   */
  async getCurrentUserPreferences() {
    try {
      const response = await axiosInstance.get(`${this.basePath}/user/current-user`);
      return {
        isSuccess: true,
        data: response.data?.data || [],
        message: "Preferences retrieved successfully"
      };
    } catch (error) {
      console.error("Error fetching current user preferences:", error);
      return {
        isSuccess: false,
        data: [],
        message: error.response?.data?.message || "Failed to fetch preferences"
      };
    }
  }

  /**
   * Get all available notification categories
   * @returns {Promise} API response
   */
  async getNotificationCategories() {
    try {
  const response = await axiosInstance.get("/notifications/categories");
      return {
        isSuccess: true,
        data: response.data?.data || [],
        message: "Categories retrieved successfully"
      };
    } catch (error) {
      console.error("Error fetching notification categories:", error);
      return {
        isSuccess: false,
        data: [
          // Default categories if API fails
          { id: "SensorVariance", name: "Sensor Variance", description: "Tank sensor reading variances" },
          { id: "StockReconciliation", name: "Stock Reconciliation", description: "Stock reconciliation alerts" },
          { id: "SystemMaintenance", name: "System Maintenance", description: "System maintenance notifications" },
          { id: "SecurityAlerts", name: "Security Alerts", description: "Security and access alerts" },
          { id: "DeliveryAlerts", name: "Delivery Alerts", description: "Fuel delivery notifications" },
          { id: "InventoryAlerts", name: "Inventory Alerts", description: "Inventory level warnings" }
        ],
        message: "Using default categories"
      };
    }
  }

  /**
   * Create a new notification preference
   * @param {Object} preferenceData - Preference data
   * @returns {Promise} API response
   */
  async createPreference(preferenceData) {
    try {
      const response = await axiosInstance.post(this.basePath, preferenceData);
      return {
        isSuccess: true,
        data: response.data,
        message: "Preference created successfully"
      };
    } catch (error) {
      console.error("Error creating preference:", error);
      return {
        isSuccess: false,
        data: null,
        message: error.response?.data?.message || "Failed to create preference"
      };
    }
  }

  /**
   * Update an existing notification preference
   * @param {number} id - Preference ID
   * @param {Object} preferenceData - Updated preference data
   * @returns {Promise} API response
   */
  async updatePreference(id, preferenceData) {
    try {
      const response = await axiosInstance.put(`${this.basePath}/${id}`, preferenceData);
      return {
        isSuccess: true,
        data: response.data,
        message: "Preference updated successfully"
      };
    } catch (error) {
      console.error("Error updating preference:", error);
      return {
        isSuccess: false,
        data: null,
        message: error.response?.data?.message || "Failed to update preference"
      };
    }
  }

  /**
   * Delete a notification preference
   * @param {number} id - Preference ID
   * @returns {Promise} API response
   */
  async deletePreference(id) {
    try {
      await axiosInstance.delete(`${this.basePath}/${id}`);
      return {
        isSuccess: true,
        data: null,
        message: "Preference deleted successfully"
      };
    } catch (error) {
      console.error("Error deleting preference:", error);
      return {
        isSuccess: false,
        data: null,
        message: error.response?.data?.message || "Failed to delete preference"
      };
    }
  }

  /**
   * Bulk update preferences for a user
   * @param {string} userId - User ID
   * @param {Array} preferences - Array of preference objects
   * @returns {Promise} API response
   */
  async bulkUpdatePreferences(userId, preferences) {
    try {
      const response = await axiosInstance.post(`/notifications/preferences/bulk-update`, {
        userId,
        preferences: preferences.map(p => ({
          id: p.id,
            // backend controller BulkUpdatePreferencesRequest expects camelCase -> NotificationCategoryId will be serialized as notificationCategoryId
          notificationCategoryId: p.notificationCategoryId ?? p.notificationCategory,
          deliveryMethods: Array.isArray(p.deliveryMethods) ? p.deliveryMethods : (p.deliveryMethods ? String(p.deliveryMethods).split(',').map(x=>x.trim()).filter(Boolean) : ["System"]),
          isEnabled: p.isEnabled,
          priority: p.priority,
          quietHoursStart: p.quietHoursStart,
          quietHoursEnd: p.quietHoursEnd,
          maxNotificationsPerHour: p.maxNotificationsPerHour,
          maxNotificationsPerDay: p.maxNotificationsPerDay,
          requireAcknowledgment: p.requireAcknowledgment
        }))
      });
      return {
        isSuccess: true,
        data: response.data,
        message: "Preferences updated successfully"
      };
    } catch (error) {
      console.error("Error bulk updating preferences:", error);
      return {
        isSuccess: false,
        data: null,
        message: error.response?.data?.message || "Failed to update preferences"
      };
    }
  }

  /**
   * Get available delivery methods
   * @returns {Array} Available delivery methods
   */
  getDeliveryMethods() {
    return [
      { id: "System", name: "System Notification", icon: "fa-regular fa-bell" },
      { id: "Email", name: "Email", icon: "fa-regular fa-envelope" },
      { id: "SMS", name: "SMS", icon: "fa-regular fa-mobile" },
      { id: "Push", name: "Push Notification", icon: "fa-regular fa-mobile-notch" }
    ];
  }

  /**
   * Get available priority levels
   * @returns {Array} Available priority levels
   */
  getPriorityLevels() {
    return [
      { id: "Low", name: "Low", color: "tw-text-gray-500" },
      { id: "Medium", name: "Medium", color: "tw-text-blue-500" },
      { id: "High", name: "High", color: "tw-text-orange-500" },
      { id: "Critical", name: "Critical", color: "tw-text-red-500" }
    ];
  }

  /**
   * Validate preference data
   * @param {Object} preference - Preference object to validate
   * @returns {Object} Validation result
   */
  validatePreference(preference) {
    const errors = [];
    // Backwards compatibility: allow either notificationCategoryId (new) or notificationCategory (legacy)
    const categoryId = preference.notificationCategoryId ?? preference.notificationCategory;

    if (!preference.userId) {
      errors.push("User ID is required");
    }

    if (categoryId === undefined || categoryId === null || categoryId === "") {
      errors.push("Notification category is required");
    }

    if (preference.isEnabled && (!preference.deliveryMethods || preference.deliveryMethods.length === 0)) {
      errors.push("At least one delivery method must be selected");
    }

  if (preference.quietHoursStart && preference.quietHoursEnd) {
      const start = new Date(`2000-01-01T${preference.quietHoursStart}`);
      const end = new Date(`2000-01-01T${preference.quietHoursEnd}`);

      if (start >= end) {
        errors.push("Quiet hours start time must be before end time");
      }
    }

  if (preference.maxNotificationsPerHour && preference.maxNotificationsPerHour < 0) {
      errors.push("Maximum notifications per hour cannot be negative");
    }

  if (preference.maxNotificationsPerDay && preference.maxNotificationsPerDay < 0) {
      errors.push("Maximum notifications per day cannot be negative");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create and export singleton instance
const notificationPreferencesApi = new NotificationPreferencesApi();
export default notificationPreferencesApi;
