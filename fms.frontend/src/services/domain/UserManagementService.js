/**
 * UserManagementService - Complete User Management Service
 *
 * Migrated from userActions.js to use BaseService architecture:
 * - FMSResponse<T> handling
 * - v1 API endpoints
 * - Standardized error handling
 * - Caching and performance optimization
 * - Enterprise patterns
 *
 * @version 1.0.0
 * @since API v1
 */

import BaseService from '../core/BaseService';

export class UserManagementService extends BaseService {
  constructor(config) {
    super(config);
    this.baseUrl = '/user';
  }

  // ===========================================
  // USER CORE OPERATIONS
  // ===========================================

  /**
   * Fetch all users
   * @param {Object} filters - Filter criteria
   * @param {boolean} [filters.includeDeleted=false] - Include soft-deleted users
   * @param {string} [filters.role] - Filter by role
   * @param {number} [filters.siteId] - Filter by site
   * @returns {Promise<FMSResponse<User[]>>}
   */
  async fetchUsers(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.includeDeleted) params.append('includeDeleted', 'true');
      if (filters.role) params.append('role', filters.role);
      if (filters.siteId) params.append('siteId', filters.siteId);

      const url = params.toString() ? `${this.baseUrl}?${params.toString()}` : this.baseUrl;

      return await this.get(url, {
        cacheKey: `users-${JSON.stringify(filters)}`,
        cacheTTL: 3 * 60 * 1000 // 3 minutes cache
      });
    } catch (error) {
      return this.handleError('Error fetching users', error);
    }
  }

  /**
   * Fetch user by ID
   * @param {number} userId - User ID
   * @returns {Promise<FMSResponse<User>>}
   */
  async fetchUserById(userId) {
    try {
      if (!userId || userId <= 0) {
        return this.createValidationErrorResponse('Invalid user ID');
      }

      return await this.get(`${this.baseUrl}/${userId}`, {
        cacheKey: `user-${userId}`,
        cacheTTL: 5 * 60 * 1000 // 5 minutes cache
      });
    } catch (error) {
      return this.handleError(`Error fetching user ${userId}`, error);
    }
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<FMSResponse<User>>}
   */
  async createUser(userData) {
    try {
      // Validate required fields
      if (!userData.username) {
        return this.createValidationErrorResponse('Username is required');
      }

      if (!userData.email) {
        return this.createValidationErrorResponse('Email is required');
      }

      if (!userData.firstName) {
        return this.createValidationErrorResponse('First name is required');
      }

      if (!userData.lastName) {
        return this.createValidationErrorResponse('Last name is required');
      }

      const result = await this.post(this.baseUrl, userData);

      // Clear users cache
      this.clearCachePattern('users-');

      return result;
    } catch (error) {
      return this.handleError('Error creating user', error);
    }
  }

  /**
   * Update user
   * @param {number} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<FMSResponse<User>>}
   */
  async updateUser(userId, userData) {
    try {
      if (!userId || userId <= 0) {
        return this.createValidationErrorResponse('Invalid user ID');
      }

      const result = await this.put(`${this.baseUrl}/${userId}`, userData);

      // Clear related caches
      this.clearCachePattern('users-');
      this.clearCache(`user-${userId}`);

      return result;
    } catch (error) {
      return this.handleError(`Error updating user ${userId}`, error);
    }
  }

  /**
   * Soft delete user
   * @param {number} userId - User ID
   * @returns {Promise<FMSResponse<boolean>>}
   */
  async softDeleteUser(userId) {
    try {
      if (!userId || userId <= 0) {
        return this.createValidationErrorResponse('Invalid user ID');
      }

      const result = await this.post(`${this.baseUrl}/${userId}/soft-delete`);

      // Clear related caches
      this.clearCachePattern('users-');
      this.clearCache(`user-${userId}`);

      return result;
    } catch (error) {
      return this.handleError(`Error soft deleting user ${userId}`, error);
    }
  }

  /**
   * Restore soft-deleted user
   * @param {number} userId - User ID
   * @returns {Promise<FMSResponse<boolean>>}
   */
  async restoreUser(userId) {
    try {
      if (!userId || userId <= 0) {
        return this.createValidationErrorResponse('Invalid user ID');
      }

      const result = await this.post(`${this.baseUrl}/${userId}/restore`);

      // Clear related caches
      this.clearCachePattern('users-');
      this.clearCache(`user-${userId}`);

      return result;
    } catch (error) {
      return this.handleError(`Error restoring user ${userId}`, error);
    }
  }

  /**
   * Permanently delete user
   * @param {number} userId - User ID
   * @returns {Promise<FMSResponse<boolean>>}
   */
  async deleteUser(userId) {
    try {
      if (!userId || userId <= 0) {
        return this.createValidationErrorResponse('Invalid user ID');
      }

      const result = await this.delete(`${this.baseUrl}/${userId}`);

      // Clear related caches
      this.clearCachePattern('users-');
      this.clearCache(`user-${userId}`);

      return result;
    } catch (error) {
      return this.handleError(`Error deleting user ${userId}`, error);
    }
  }

  // ===========================================
  // USER ACTIVITIES
  // ===========================================

  /**
   * Fetch user activities
   * @param {number} userId - User ID
   * @param {Object} filters - Filter criteria
   * @param {string} [filters.startDate] - Start date filter
   * @param {string} [filters.endDate] - End date filter
   * @param {string} [filters.activityType] - Activity type filter
   * @param {number} [filters.limit] - Limit number of results
   * @returns {Promise<FMSResponse<UserActivity[]>>}
   */
  async fetchUserActivities(userId, filters = {}) {
    try {
      if (!userId || userId <= 0) {
        return this.createValidationErrorResponse('Invalid user ID');
      }

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.activityType) params.append('activityType', filters.activityType);
      if (filters.limit) params.append('limit', filters.limit);

      const url = `${this.baseUrl}/${userId}/activities${params.toString() ? '?' + params.toString() : ''}`;

      return await this.get(url, {
        cacheKey: `user-activities-${userId}-${JSON.stringify(filters)}`,
        cacheTTL: 2 * 60 * 1000 // 2 minutes cache (activities change frequently)
      });
    } catch (error) {
      return this.handleError(`Error fetching activities for user ${userId}`, error);
    }
  }

  /**
   * Fetch all activities (system-wide)
   * @param {Object} filters - Filter criteria
   * @returns {Promise<FMSResponse<Activity[]>>}
   */
  async fetchAllActivities(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.activityType) params.append('activityType', filters.activityType);
      if (filters.limit) params.append('limit', filters.limit);

      const url = `/activities${params.toString() ? '?' + params.toString() : ''}`;

      return await this.get(url, {
        cacheKey: `all-activities-${JSON.stringify(filters)}`,
        cacheTTL: 2 * 60 * 1000 // 2 minutes cache
      });
    } catch (error) {
      return this.handleError('Error fetching all activities', error);
    }
  }

  // ===========================================
  // USER SITES MANAGEMENT
  // ===========================================

  /**
   * Fetch user sites
   * @param {number} userId - User ID
   * @returns {Promise<FMSResponse<Site[]>>}
   */
  async fetchUserSites(userId) {
    try {
      if (!userId || userId <= 0) {
        return this.createValidationErrorResponse('Invalid user ID');
      }

      return await this.get(`${this.baseUrl}/${userId}/sites`, {
        cacheKey: `user-sites-${userId}`,
        cacheTTL: 10 * 60 * 1000 // 10 minutes cache
      });
    } catch (error) {
      return this.handleError(`Error fetching sites for user ${userId}`, error);
    }
  }

  /**
   * Update user sites
   * @param {number} userId - User ID
   * @param {Array<number>} siteIds - Array of site IDs
   * @returns {Promise<FMSResponse<boolean>>}
   */
  async updateUserSites(userId, siteIds) {
    try {
      if (!userId || userId <= 0) {
        return this.createValidationErrorResponse('Invalid user ID');
      }

      if (!Array.isArray(siteIds)) {
        return this.createValidationErrorResponse('Site IDs must be an array');
      }

      const result = await this.put(`${this.baseUrl}/${userId}/sites`, { siteIds });

      // Clear related caches
      this.clearCache(`user-sites-${userId}`);

      return result;
    } catch (error) {
      return this.handleError(`Error updating sites for user ${userId}`, error);
    }
  }

  /**
   * Fetch all sites
   * @returns {Promise<FMSResponse<Site[]>>}
   */
  async fetchAllSites() {
    try {
      return await this.get('/sites', {
        cacheKey: 'all-sites',
        cacheTTL: 30 * 60 * 1000 // 30 minutes cache (sites don't change often)
      });
    } catch (error) {
      return this.handleError('Error fetching all sites', error);
    }
  }

  // ===========================================
  // ROLES AND PERMISSIONS
  // ===========================================

  /**
   * Fetch user roles
   * @param {number} userId - User ID
   * @returns {Promise<FMSResponse<Role[]>>}
   */
  async fetchUserRoles(userId) {
    try {
      if (!userId || userId <= 0) {
        return this.createValidationErrorResponse('Invalid user ID');
      }

      return await this.get(`${this.baseUrl}/${userId}/roles`, {
        cacheKey: `user-roles-${userId}`,
        cacheTTL: 10 * 60 * 1000 // 10 minutes cache
      });
    } catch (error) {
      return this.handleError(`Error fetching roles for user ${userId}`, error);
    }
  }

  /**
   * Fetch user permissions
   * @param {number} userId - User ID
   * @returns {Promise<FMSResponse<Permission[]>>}
   */
  async fetchUserPermissions(userId) {
    try {
      if (!userId || userId <= 0) {
        return this.createValidationErrorResponse('Invalid user ID');
      }

      return await this.get(`${this.baseUrl}/${userId}/permissions`, {
        cacheKey: `user-permissions-${userId}`,
        cacheTTL: 15 * 60 * 1000 // 15 minutes cache
      });
    } catch (error) {
      return this.handleError(`Error fetching permissions for user ${userId}`, error);
    }
  }

  /**
   * Fetch all roles
   * @returns {Promise<FMSResponse<Role[]>>}
   */
  async fetchAllRoles() {
    try {
      return await this.get('/roles', {
        cacheKey: 'all-roles',
        cacheTTL: 30 * 60 * 1000 // 30 minutes cache
      });
    } catch (error) {
      return this.handleError('Error fetching all roles', error);
    }
  }

  /**
   * Update user roles
   * @param {number} userId - User ID
   * @param {Array<number>} roleIds - Array of role IDs
   * @returns {Promise<FMSResponse<boolean>>}
   */
  async updateUserRoles(userId, roleIds) {
    try {
      if (!userId || userId <= 0) {
        return this.createValidationErrorResponse('Invalid user ID');
      }

      if (!Array.isArray(roleIds)) {
        return this.createValidationErrorResponse('Role IDs must be an array');
      }

      const result = await this.put(`${this.baseUrl}/${userId}/roles`, { roleIds });

      // Clear related caches
      this.clearCache(`user-roles-${userId}`);
      this.clearCache(`user-permissions-${userId}`);

      return result;
    } catch (error) {
      return this.handleError(`Error updating roles for user ${userId}`, error);
    }
  }

  // ===========================================
  // FILTER AND SEARCH OPERATIONS
  // ===========================================

  /**
   * Fetch users for filter dropdown
   * @param {Object} options - Filter options
   * @returns {Promise<FMSResponse<User[]>>}
   */
  async fetchUsersForFilter(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.activeOnly) params.append('activeOnly', 'true');
      if (options.siteId) params.append('siteId', options.siteId);

      const url = `${this.baseUrl}/filter${params.toString() ? '?' + params.toString() : ''}`;

      return await this.get(url, {
        cacheKey: `users-filter-${JSON.stringify(options)}`,
        cacheTTL: 5 * 60 * 1000 // 5 minutes cache
      });
    } catch (error) {
      return this.handleError('Error fetching users for filter', error);
    }
  }

  /**
   * Search users
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @returns {Promise<FMSResponse<User[]>>}
   */
  async searchUsers(searchTerm, filters = {}) {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return this.createValidationErrorResponse('Search term is required');
      }

      const params = new URLSearchParams({
        search: searchTerm.trim()
      });

      if (filters.role) params.append('role', filters.role);
      if (filters.siteId) params.append('siteId', filters.siteId);
      if (filters.limit) params.append('limit', filters.limit);

      return await this.get(`${this.baseUrl}/search?${params.toString()}`, {
        cacheKey: `user-search-${searchTerm}-${JSON.stringify(filters)}`,
        cacheTTL: 2 * 60 * 1000 // 2 minutes cache
      });
    } catch (error) {
      return this.handleError('Error searching users', error);
    }
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  /**
   * Create validation error response
   * @private
   */
  createValidationErrorResponse(message) {
    return {
      success: false,
      data: null,
      message: message,
      errors: [message],
      errorType: 'VALIDATION'
    };
  }

  /**
   * Clear cache patterns
   * @private
   */
  clearCachePattern(pattern) {
    if (this.cache) {
      const keys = Array.from(this.cache.keys());
      keys.forEach(key => {
        if (key.startsWith(pattern)) {
          this.cache.delete(key);
        }
      });
    }
  }

  /**
   * Health check for user management service
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    try {
      // Try to fetch a small amount of data to verify connectivity
      const result = await this.get(`${this.baseUrl}?limit=1`);

      return {
        status: 'healthy',
        message: 'User management service is operational',
        timestamp: new Date().toISOString(),
        responseTime: result.responseTime || 'N/A'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `User management service error: ${error.message}`,
        timestamp: new Date().toISOString(),
        error: error
      };
    }
  }
}

export default UserManagementService;