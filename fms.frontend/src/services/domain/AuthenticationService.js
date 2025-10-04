/**
 * AuthenticationService Class
 *
 * Handles all authentication-related operations with standardized enterprise patterns:
 * - User sign in/sign out
 * - JWT token management
 * - Navigation items fetching
 * - User profile management
 * - Session management
 *
 * Replaces legacy Redux AuthActions with FMSResponse<T> format and v1 API integration
 */

import BaseService from "../core/BaseService.js";

export class AuthenticationService extends BaseService {
  constructor() {
    super("AuthenticationService", "/User", {
      useCache: true,
      cacheTimeout: 300000, // 5 minutes
      apiVersion: "v1",
    });

    // Initialize with stored token if available
    this._initializeStoredToken();
  }

  /**
   * Sign in user with credentials
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<FMSResponse<{user: object, token: string, navigationItems: array}>>}
   */
  async signIn(username, password) {
    try {
      this.logger.info("Attempting user sign in", { username });

      // Clear any existing auth state
      this.clearAuthToken();
      this.clearCache();

      const response = await this.post("/Login", {
        Username: username,
        Password: password,
      });

      this.logger.debug("Login response received:", response);

      // Handle FMSResponse<object> format from backend
      if (response.success && response.data) {
        // Backend returns FMSResponse<object> with Data = { Token: "..." }
        // So response.data contains { Token: "..." }
        const token = response.data.Token || response.data.token;

        if (!token) {
          this.logger.error("No token in response data:", response.data);
          return {
            success: false,
            data: null,
            message: "No authentication token received from server",
            errors: ["MISSING_TOKEN"],
          };
        }

        // Store token and set up authentication
        this.setAuthToken(token);

        // Test authentication by calling the health endpoint
        try {
          await this.axiosInstance.get("/api/v1/Health");
          this.logger.debug("Authentication test successful");
        } catch (authTestError) {
          this.logger.warn(
            "Authentication test failed - token may be invalid",
            authTestError
          );
        }

        // Since the login endpoint only returns a token, we need to fetch user details separately
        let user = null;
        try {
          const userResponse = await this.getCurrentUser();
          if (userResponse.success) {
            user = userResponse.data;
          }
        } catch (userError) {
          this.logger.warn(
            "Failed to fetch user details after login",
            userError
          );
          // For now, create a minimal user object from the token or username
          user = {
            id: null,
            userName: username,
            roles: [],
            permissions: [],
          };
        }

        // Fetch navigation items immediately after successful login
        const navigationResponse = await this.fetchNavigationItems();
        const navigationItems = navigationResponse.success
          ? navigationResponse.data
          : [];

        // Fetch user configurations if needed
        let configurations = {};
        try {
          const configResponse = await this.fetchUserConfigurations();
          configurations = configResponse.success ? configResponse.data : {};
        } catch (configError) {
          this.logger.warn("Failed to load user configurations", configError);
          // Don't fail login if configuration loading fails
        }

        this.logger.info("User sign in successful", {
          userId: user?.id,
          username: username,
        });

        return {
          success: true,
          data: {
            user,
            token,
            navigationItems,
            configurations,
          },
          message: "Successfully signed in",
          errors: [],
        };
      }

      return response;
    } catch (error) {
      this.logger.error("Sign in failed", error);

      // Clear any potentially corrupted auth state
      this.clearAuthToken();

      return this.errorHandler.handle(error);
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<FMSResponse<boolean>>}
   */
  async signOut() {
    try {
      this.logger.info("Signing out user");

      // Note: The backend doesn't have a signout endpoint, but we can still clear local state
      // In a real implementation, you might want to add a signout endpoint to invalidate the JWT server-side

      // Always clear local auth state
      this.clearAuthToken();
      this.clearCache();

      this.logger.info("User signed out successfully");

      return {
        success: true,
        data: true,
        message: "Successfully signed out",
        errors: [],
      };
    } catch (error) {
      this.logger.error("Sign out error", error);

      // Still clear local state even if any operations fail
      this.clearAuthToken();
      this.clearCache();

      // Return success since local cleanup succeeded
      return {
        success: true,
        data: true,
        message: "Signed out (local cleanup completed)",
        errors: [],
      };
    }
  }

  /**
   * Fetch navigation items for current user
   * @returns {Promise<FMSResponse<Array>>}
   */
  async fetchNavigationItems() {
    try {
      this.logger.debug("Fetching navigation items");

      // Navigation items are handled by a separate controller, so we need to call it directly
      // Since it's not under the /User endpoint, we'll use axiosInstance from our imports
      const axiosInstance = (await import("../../api/axiosInstance.js"))
        .default;

      const response = await axiosInstance.get("/api/v1/Navigation", {
        headers: {
          "API-Version": this.options.apiVersion,
        },
      });

      // Handle the response through our standard format
      const result = this._handleFMSResponse(response);

      if (result.success) {
        this.logger.debug("Navigation items fetched successfully", {
          count: result.data?.length || 0,
        });
      }

      return result;
    } catch (error) {
      this.logger.error("Failed to fetch navigation items", error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Get current user profile
   * @returns {Promise<FMSResponse<object>>}
   */
  async getCurrentUser() {
    try {
      const response = await this.get(
        "/details",
        {},
        {
          useCache: true,
          cacheTTL: 300000, // 5 minutes cache
        }
      );

      if (response.success && response.data) {
        const normalizedUser = this._normalizeUserData(response.data);
        return {
          ...response,
          data: normalizedUser,
        };
      }

      return response;
    } catch (error) {
      this.logger.error("Failed to get current user", error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Fetch user configurations (if available)
   * @returns {Promise<FMSResponse<object>>}
   */
  async fetchUserConfigurations() {
    try {
      // Note: This endpoint may not exist in the current backend
      // Return empty configuration for now
      this.logger.debug(
        "User configurations endpoint not implemented - returning empty config"
      );

      return {
        success: true,
        data: {},
        message: "No user configurations available",
        errors: [],
      };
    } catch (error) {
      this.logger.error("Failed to fetch user configurations", error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Refresh user session (if supported)
   * @returns {Promise<FMSResponse<object>>}
   */
  async refreshSession() {
    try {
      // Note: JWT refresh is typically handled automatically or requires a separate refresh token
      // For now, return the current state
      this.logger.debug(
        "Session refresh not implemented - returning current state"
      );

      return {
        success: true,
        data: { refreshed: false },
        message: "Session refresh not implemented",
        errors: [],
      };
    } catch (error) {
      this.logger.error("Failed to refresh session", error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Validate current authentication status
   * @returns {Promise<FMSResponse<{isValid: boolean, user?: object}>>}
   */
  async validateAuth() {
    try {
      const token = this.getStoredToken();

      if (!token) {
        return {
          success: true,
          data: { isValid: false },
          message: "No authentication token found",
          errors: [],
        };
      }

      // Try to get current user details to validate the token
      const userResponse = await this.getCurrentUser();

      if (userResponse.success && userResponse.data) {
        return {
          success: true,
          data: {
            isValid: true,
            user: userResponse.data,
          },
          message: "Authentication is valid",
          errors: [],
        };
      }

      // If user details fail, the token is likely invalid
      this.clearAuthToken();

      return {
        success: true,
        data: { isValid: false },
        message: "Authentication token is invalid",
        errors: [],
      };
    } catch (error) {
      this.logger.error("Auth validation failed", error);
      this.clearAuthToken();

      return {
        success: true,
        data: { isValid: false },
        message: "Authentication validation failed",
        errors: [],
      };
    }
  }

  // Token management methods
  setAuthToken(token) {
    localStorage.setItem("token", token); // Use 'token' to match axiosInstance

    // Update axios instance default headers
    if (this.axiosInstance?.defaults?.headers?.common) {
      this.axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
    }

    this.logger.debug("Authentication token set");
  }

  clearAuthToken() {
    localStorage.removeItem("token"); // Use 'token' to match axiosInstance

    // Remove from axios instance
    if (this.axiosInstance?.defaults?.headers?.common) {
      delete this.axiosInstance.defaults.headers.common["Authorization"];
    }

    this.logger.debug("Authentication token cleared");
  }

  getStoredToken() {
    return localStorage.getItem("token"); // Use 'token' to match axiosInstance
  }

  isAuthenticated() {
    return !!this.getStoredToken();
  }

  // Private helper methods
  _initializeStoredToken() {
    const token = this.getStoredToken();
    if (token && this.axiosInstance?.defaults?.headers?.common) {
      this.axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
    }
  }

  _normalizeUserData(user) {
    if (!user) return null;

    return {
      id: user.Id || user.id || user.ID,
      userName: user.UserName || user.userName || user.username,
      email: user.Email || user.email,
      firstName: user.FirstName || user.firstName,
      lastName: user.LastName || user.lastName,
      roles: user.Roles || user.roles || [],
      permissions: user.Permissions || user.permissions || [],
      lastLogin: user.LastLogin || user.lastLogin,
      isActive:
        user.IsActive !== undefined
          ? user.IsActive
          : user.isActive !== undefined
          ? user.isActive
          : true,
      // Preserve original data for debugging
      _original: user,
    };
  }
}

export default AuthenticationService;
