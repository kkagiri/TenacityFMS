import axiosInstance from "../api/axiosInstance";

/**
 * API service for managing notification categories (Admin only)
 */
class NotificationCategoriesApi {
  constructor() {
    this.basePath = "/notifications/admin/categories";
  }

  /**
   * Get all notification categories (including inactive for admin)
   * @param {boolean} includeInactive - Include inactive categories
   * @returns {Promise} API response
   */
  async getAllCategories(includeInactive = false) {
    try {
      const response = await axiosInstance.get(`${this.basePath}?includeInactive=${includeInactive}`);
      return {
        isSuccess: true,
        data: response.data?.data || [],
        message: "Categories retrieved successfully"
      };
    } catch (error) {
      console.error("Error fetching all categories:", error);
      return {
        isSuccess: false,
        data: [],
        message: error.response?.data?.message || "Failed to fetch categories"
      };
    }
  }

  /**
   * Create a new notification category
   * @param {Object} categoryData - Category data
   * @returns {Promise} API response
   */
  async createCategory(categoryData) {
    try {
      const response = await axiosInstance.post(this.basePath, categoryData);
      return {
        isSuccess: true,
        data: response.data,
        message: "Category created successfully"
      };
    } catch (error) {
      console.error("Error creating category:", error);
      return {
        isSuccess: false,
        data: null,
        message: error.response?.data?.message || "Failed to create category"
      };
    }
  }

  /**
   * Update an existing notification category
   * @param {string} id - Category ID
   * @param {Object} categoryData - Updated category data
   * @returns {Promise} API response
   */
  async updateCategory(id, categoryData) {
    try {
      const response = await axiosInstance.put(`${this.basePath}/${id}`, categoryData);
      return {
        isSuccess: true,
        data: response.data,
        message: "Category updated successfully"
      };
    } catch (error) {
      console.error("Error updating category:", error);
      return {
        isSuccess: false,
        data: null,
        message: error.response?.data?.message || "Failed to update category"
      };
    }
  }

  /**
   * Delete a notification category
   * @param {string} id - Category ID
   * @returns {Promise} API response
   */
  async deleteCategory(id) {
    try {
      await axiosInstance.delete(`${this.basePath}/${id}`);
      return {
        isSuccess: true,
        data: null,
        message: "Category deleted successfully"
      };
    } catch (error) {
      console.error("Error deleting category:", error);
      return {
        isSuccess: false,
        data: null,
        message: error.response?.data?.message || "Failed to delete category"
      };
    }
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
   * Get available delivery methods
   * @returns {Array} Available delivery methods
   */
  getDeliveryMethods() {
    return [
      { id: "System", name: "System Notification", icon: "fa-regular fa-bell" },
      { id: "Email", name: "Email", icon: "fa-regular fa-envelope" },
      { id: "SMS", name: "SMS", icon: "fa-regular fa-mobile" }
    ];
  }

  /**
   * Get available icon classes
   * @returns {Array} Available icon classes
   */
  getIconClasses() {
    return [
      { id: "fa-solid fa-gauge", name: "Gauge", icon: "fa-solid fa-gauge" },
      { id: "fa-solid fa-balance-scale", name: "Balance Scale", icon: "fa-solid fa-balance-scale" },
      { id: "fa-solid fa-wrench", name: "Wrench", icon: "fa-solid fa-wrench" },
      { id: "fa-solid fa-shield-exclamation", name: "Shield Alert", icon: "fa-solid fa-shield-exclamation" },
      { id: "fa-solid fa-truck", name: "Truck", icon: "fa-solid fa-truck" },
      { id: "fa-solid fa-warehouse", name: "Warehouse", icon: "fa-solid fa-warehouse" },
      { id: "fa-solid fa-calendar-check", name: "Calendar Check", icon: "fa-solid fa-calendar-check" },
      { id: "fa-solid fa-microchip", name: "Microchip", icon: "fa-solid fa-microchip" },
      { id: "fa-solid fa-user-check", name: "User Check", icon: "fa-solid fa-user-check" },
      { id: "fa-solid fa-triangle-exclamation", name: "Warning Triangle", icon: "fa-solid fa-triangle-exclamation" },
      { id: "fa-solid fa-bell", name: "Bell", icon: "fa-solid fa-bell" },
      { id: "fa-solid fa-cog", name: "Settings", icon: "fa-solid fa-cog" },
      { id: "fa-solid fa-info-circle", name: "Info Circle", icon: "fa-solid fa-info-circle" },
      { id: "fa-solid fa-exclamation-circle", name: "Exclamation Circle", icon: "fa-solid fa-exclamation-circle" }
    ];
  }

  /**
   * Validate category data
   * @param {Object} category - Category object to validate
   * @returns {Object} Validation result
   */
  validateCategory(category) {
    const errors = [];

    if (!category.id || category.id.trim() === "") {
      errors.push("Category ID is required");
    }

    if (!category.name || category.name.trim() === "") {
      errors.push("Category name is required");
    }

    if (!category.defaultPriority) {
      errors.push("Default priority is required");
    }

    if (category.displayOrder < 0) {
      errors.push("Display order cannot be negative");
    }

    if (!category.defaultDeliveryMethods || category.defaultDeliveryMethods.length === 0) {
      errors.push("At least one default delivery method must be selected");
    }

    // Validate ID format (alphanumeric and underscores only)
    if (category.id && !/^[a-zA-Z0-9_]+$/.test(category.id)) {
      errors.push("Category ID can only contain letters, numbers, and underscores");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create and export singleton instance
const notificationCategoriesApi = new NotificationCategoriesApi();
export default notificationCategoriesApi;
