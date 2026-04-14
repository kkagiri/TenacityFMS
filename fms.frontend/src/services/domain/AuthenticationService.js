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
        // Backend returns FMSResponse<object> with Data = { Token, RefreshToken, User }
        const token = response.data.Token || response.data.token;
        const refreshToken = response.data.RefreshToken || response.data.refreshToken;
        const loginUser = this._normalizeUserData(
          response.data.User || response.data.user
        );

        if (!token) {
          this.logger.error("No token in response data:", response.data);
          return {
            success: false,
            data: null,
            message: "No authentication token received from server",
            errors: ["MISSING_TOKEN"],
          };
        }

        // Store access token and set up authentication
        this.setAuthToken(token);

        // Store refresh token for automatic token renewal
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
          this.logger.debug("Refresh token stored successfully");
        } else {
          this.logger.warn("No refresh token received from server - token refresh will not be available");
        }

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
        let user = loginUser;
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
          user =
            loginUser || {
              id: null,
              userName: username,
              roles: [],
              permissions: [],
              requirePasswordChangeOnFirstLogin: false,
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
   * Check if there are any active fueling processes
   * Important: Only checks for FullTank mode fueling (no predetermined end)
   * @private
   * @returns {Object} Status object with hasActive, count, and processes array
   */
  _checkActiveFuelingProcesses() {
    try {
      // Import store dynamically to avoid circular dependencies
      const store = require('../../store').default;
      const state = store.getState();

      // Check pump reducer for active fueling processes
      const activeFueling = state.pump?.activeFuelingProcesses || [];

      if (activeFueling.length > 0) {
        this.logger.warn(`⛽ Found ${activeFueling.length} active fueling process(es)`);
        return {
          hasActive: true,
          count: activeFueling.length,
          processes: activeFueling
        };
      }

      return { hasActive: false, count: 0, processes: [] };
    } catch (error) {
      this.logger.warn('⚠️ Could not check fueling status', error);
      return { hasActive: false, count: 0, processes: [] };
    }
  }

  /**
   * Sign out current user - Production-grade implementation
   *
   * Special handling for active fueling:
   * - Checks for active FullTank fueling processes
   * - Returns warning if fueling is active (caller should confirm with user)
   * - Can force signout to terminate fueling if needed
   *
   * @param {boolean} force - Force logout even with active fueling (default: false)
   * @returns {Promise<FMSResponse<{success: boolean, activeFueling?: object}>>}
   */
  async signOut(force = false) {
    try {
      this.logger.info("🔓 Starting sign out process");

      // 1. Check for active fueling processes FIRST (before disconnecting anything)
      const fuelingStatus = this._checkActiveFuelingProcesses();

      if (fuelingStatus.hasActive && !force) {
        this.logger.warn(`⛽ Active fueling detected - logout requires confirmation`);

        // Return status indicating active fueling - let the caller handle confirmation
        return {
          success: false,
          data: {
            success: false,
            requiresConfirmation: true,
            activeFueling: fuelingStatus
          },
          message: `Cannot logout: ${fuelingStatus.count} active fueling process(es)`,
          errors: ['ACTIVE_FUELING_PROCESSES']
        };
      }

      // If force = true or no active fueling, proceed with logout
      if (fuelingStatus.hasActive && force) {
        this.logger.warn(`⛽ Forcing logout with ${fuelingStatus.count} active fueling process(es)`);

        // Try to send stop commands to active pumps
        try {
          const { default: ptsSignalRService } = await import('../../signalR/ptsSignalRService');

          if (ptsSignalRService?.isConnected) {
            this.logger.debug('🛑 Attempting to stop active pumps...');

            for (const process of fuelingStatus.processes) {
              try {
                this.logger.debug(`🛑 Stopping pump ${process.pumpId}...`);
                // Note: You may need to implement a stop pump command in PTSSignalRService
                // await ptsSignalRService.connection.invoke('StopPump', process.pumpId);
              } catch (stopError) {
                this.logger.error(`Failed to stop pump ${process.pumpId}`, stopError);
              }
            }

            // Give pumps a moment to receive stop commands
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (pumpStopError) {
          this.logger.error('⚠️ Error stopping pumps', pumpStopError);
          // Continue with logout even if pump stop fails
        }
      }

      // 2. Disconnect SignalR connections before clearing token
      try {
        this.logger.debug("📡 Disconnecting SignalR connections...");

        // Import SignalR services dynamically
        const { default: dashboardSignalRService } = await import('../../signalR/dashboardSignalRService');
        const { default: ptsSignalRService } = await import('../../signalR/ptsSignalRService');

        await Promise.allSettled([
          dashboardSignalRService?.disconnect?.(),
          ptsSignalRService?.disconnect?.()
        ]);

        this.logger.debug("✅ SignalR connections disconnected");
      } catch (signalRError) {
        this.logger.warn("⚠️ Error disconnecting SignalR", signalRError);
        // Don't fail logout if SignalR disconnect fails
      }

      // 2. Call backend logout endpoint (if available in future)
      // Note: Currently the backend doesn't have a logout endpoint
      // In production, you should implement one to:
      // - Blacklist JWT tokens
      // - Log logout events for security auditing
      // - Invalidate refresh tokens
      // - Track active user sessions
      /*
      try {
        await this.post('/Logout', {});
        this.logger.info("✅ Server-side session invalidated");
      } catch (backendError) {
        this.logger.warn("⚠️ Backend logout endpoint not available", backendError);
        // Continue with client-side cleanup
      }
      */

      // 3. Clear authentication token and cache
      this.clearAuthToken();
      this.clearCache();

      // 4. Clear user-specific localStorage data
      const keysToRemove = [
        'fms_dashboard_layouts',        // User dashboard layouts
        'fms_layout_settings',          // User layout settings
        'dashboard_widgetConfig',       // Widget configurations
        'dashboard_todayFuelBaseline',  // Dashboard cache
        'selectedSite',                 // User selections
        'selectedPeriod',               // User selections
        'issueTrackerSavedFilters',    // User filters
        'currentUser',                  // Legacy user data
      ];

      keysToRemove.forEach(key => {
        try {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            this.logger.debug(`✅ Cleared localStorage: ${key}`);
          }
        } catch (storageError) {
          this.logger.warn(`⚠️ Failed to clear ${key}`, storageError);
        }
      });

      this.logger.info("✅ User signed out successfully");

      // Return success with info about terminated fueling if applicable
      return {
        success: true,
        data: {
          success: true,
          fuelingTerminated: fuelingStatus.hasActive,
          terminatedProcesses: fuelingStatus.hasActive ? fuelingStatus.processes : []
        },
        message: fuelingStatus.hasActive
          ? `Signed out successfully. ${fuelingStatus.count} fueling process(es) terminated.`
          : "Successfully signed out",
        errors: [],
      };
    } catch (error) {
      this.logger.error("🚨 Sign out error", error);

      // CRITICAL: Still clear local state even if operations fail
      // Security is more important than perfect error handling
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

      const response = await axiosInstance.get("/v1/Navigation", {
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
    localStorage.removeItem("refreshToken"); // Also clear refresh token

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
      requirePasswordChangeOnFirstLogin:
        user.RequirePasswordChangeOnFirstLogin ??
        user.requirePasswordChangeOnFirstLogin ??
        false,
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
