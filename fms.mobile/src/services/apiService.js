import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/environment";

const API_BASE_URL = API_CONFIG.BASE_URL;

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Flag to prevent multiple refresh attempts
    this.isRefreshing = false;
    this.refreshSubscribers = [];

    // Request interceptor for auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem("auth_token");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error("Error retrieving auth token:", error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling with automatic token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying, attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Skip refresh for login and refresh-token endpoints
          if (
            originalRequest.url?.includes("/Login") ||
            originalRequest.url?.includes("/refresh-token")
          ) {
            return Promise.reject(error);
          }

          if (this.isRefreshing) {
            // Wait for the ongoing refresh to complete
            return new Promise((resolve, reject) => {
              this.refreshSubscribers.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            console.log("[ApiService] Attempting to refresh token on 401...");
            const refreshResult = await this.refreshToken();

            // Notify all waiting requests
            this.refreshSubscribers.forEach((sub) =>
              sub.resolve(refreshResult.token)
            );
            this.refreshSubscribers = [];

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            console.error(
              "[ApiService] Token refresh failed:",
              refreshError.message
            );
            // Notify all waiting requests of failure
            this.refreshSubscribers.forEach((sub) => sub.reject(refreshError));
            this.refreshSubscribers = [];

            // Clear tokens - user needs to login again
            await AsyncStorage.multiRemove([
              "auth_token",
              "refresh_token",
              "user_data",
            ]);
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Enhanced error logging with URL for debugging
        const errorUrl = error.config?.url || "unknown";
        const errorMethod = error.config?.method?.toUpperCase() || "unknown";
        console.error(
          `API Error [${errorMethod} ${errorUrl}]:`,
          error.response?.status,
          error.response?.data || error.message
        );
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(credentials) {
    try {
      const response = await this.api.post("/v1/User/Login", credentials);
      const responseData = response.data.data;

      // Backend returns PascalCase (Token, RefreshToken, User)
      // Handle both cases for compatibility
      const token = responseData?.Token || responseData?.token;
      const refreshToken =
        responseData?.RefreshToken || responseData?.refreshToken;
      const user = responseData?.User || responseData?.user;

      if (token) {
        await AsyncStorage.setItem("auth_token", token);
        // Store refresh token for token renewal
        if (refreshToken) {
          await AsyncStorage.setItem("refresh_token", refreshToken);
          console.log("[ApiService] Refresh token stored successfully");
        } else {
          console.warn("[ApiService] No refresh token in login response");
        }
        await AsyncStorage.setItem("user_data", JSON.stringify(user));

        // Return normalized format for authSlice
        return {
          token: token,
          refreshToken: refreshToken,
          user: user,
        };
      }
      throw new Error(response.data.message || "Login failed");
    } catch (error) {
      throw this.handleError(error, "Login failed");
    }
  }

  async logout() {
    try {
      // Note: No dedicated logout endpoint - just clear local storage
      await AsyncStorage.multiRemove([
        "auth_token",
        "refresh_token",
        "user_data",
      ]);
      return { success: true };
    } catch (error) {
      // Even if logout fails on server, clear local storage
      await AsyncStorage.multiRemove([
        "auth_token",
        "refresh_token",
        "user_data",
      ]);
      throw this.handleError(error, "Logout failed");
    }
  }

  /**
   * Refresh the access token using the stored refresh token
   * Returns new tokens and updates storage
   */
  async refreshToken() {
    try {
      const storedRefreshToken = await AsyncStorage.getItem("refresh_token");
      if (!storedRefreshToken) {
        throw new Error("No refresh token available");
      }

      // Call refresh-token endpoint with the refresh token
      // Note: Backend expects "RefreshToken" (PascalCase) in request body
      const response = await this.api.post("/v1/User/refresh-token", {
        RefreshToken: storedRefreshToken,
      });

      const responseData = response.data.data;

      // Backend returns PascalCase (Token, RefreshToken, User)
      // Handle both cases for compatibility
      const token = responseData?.Token || responseData?.token;
      const refreshToken =
        responseData?.RefreshToken || responseData?.refreshToken;
      const user = responseData?.User || responseData?.user;

      if (token) {
        await AsyncStorage.setItem("auth_token", token);
        // Update refresh token (token rotation)
        if (refreshToken) {
          await AsyncStorage.setItem("refresh_token", refreshToken);
          console.log("[ApiService] Refresh token rotated successfully");
        }
        // Update user data if returned
        if (user) {
          await AsyncStorage.setItem("user_data", JSON.stringify(user));
        }
        return {
          success: true,
          token: token,
          refreshToken: refreshToken,
          user: user,
        };
      }
      throw new Error(response.data.message || "Token refresh failed");
    } catch (error) {
      // If refresh fails, clear all tokens (requires re-login)
      await AsyncStorage.multiRemove(["auth_token", "refresh_token"]);
      throw this.handleError(
        error,
        "Token refresh failed - please login again"
      );
    }
  }

  /**
   * Decode base64 string (React Native compatible)
   * @param {string} base64 - Base64 encoded string
   * @returns {string} Decoded string
   */
  _base64Decode(base64) {
    // Handle URL-safe base64
    const base64Standard = base64.replace(/-/g, "+").replace(/_/g, "/");

    // Pad with '=' if needed
    const padding = base64Standard.length % 4;
    const paddedBase64 = padding
      ? base64Standard + "=".repeat(4 - padding)
      : base64Standard;

    // Decode using built-in atob or polyfill
    if (typeof atob !== "undefined") {
      return atob(paddedBase64);
    }

    // React Native polyfill for atob
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let output = "";
    let buffer = 0;
    let bits = 0;

    for (let i = 0; i < paddedBase64.length; i++) {
      const char = paddedBase64[i];
      if (char === "=") break;

      const index = chars.indexOf(char);
      if (index === -1) continue;

      buffer = (buffer << 6) | index;
      bits += 6;

      if (bits >= 8) {
        bits -= 8;
        output += String.fromCharCode((buffer >> bits) & 0xff);
      }
    }

    return output;
  }

  /**
   * Check if the current access token is expired
   */
  isTokenExpired(token, bufferSeconds = 60) {
    try {
      if (!token) return true;

      const parts = token.split(".");
      if (parts.length !== 3) return true;

      // Decode the payload (base64) using React Native compatible decoder
      const payload = JSON.parse(this._base64Decode(parts[1]));
      if (!payload.exp) return true;

      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const bufferMs = bufferSeconds * 1000;

      const isExpired = currentTime >= expirationTime - bufferMs;

      if (isExpired) {
        console.log(
          `[ApiService] Token expires at ${new Date(
            expirationTime
          ).toISOString()}, current time: ${new Date(
            currentTime
          ).toISOString()}`
        );
      }

      return isExpired;
    } catch (error) {
      console.warn("[ApiService] Error checking token expiration:", error);
      return true; // Assume expired if we can't check
    }
  }

  /**
   * Get valid token - refreshes if expired
   */
  async getValidToken() {
    try {
      const token = await AsyncStorage.getItem("auth_token");

      if (!token) {
        throw new Error("No auth token available");
      }

      // Check if token is expired (with 60 second buffer)
      if (this.isTokenExpired(token, 60)) {
        console.log("[ApiService] Token expired, attempting refresh...");
        const refreshResult = await this.refreshToken();
        return refreshResult.token;
      }

      return token;
    } catch (error) {
      throw error;
    }
  }

  // Transaction endpoints
  async getTransactionHistory(filters = {}) {
    try {
      // Default to last 30 days if no dates provided
      const now = new Date();
      const defaultEndDate = now.toISOString();
      const defaultStartDate = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const params = {
        startDate: filters.startDate || defaultStartDate,
        endDate: filters.endDate || defaultEndDate,
        ptsId: filters.ptsId || filters.deviceId,
        vehicleId: filters.vehicleId,
        tankId: filters.tankId,
      };

      // Remove undefined/null values
      Object.keys(params).forEach(
        (key) =>
          (params[key] === undefined || params[key] === null) &&
          delete params[key]
      );

      const response = await this.api.get("/v1/Consumption/pumptransactions", {
        params,
      });

      // Transform response to expected format for the slice
      const data = response.data?.data || response.data || [];
      const transactions = Array.isArray(data) ? data : [];

      return {
        data: transactions,
        totalCount: transactions.length,
        currentPage: filters.page || 1,
        pageSize: filters.pageSize || 20,
        hasMore: false, // Backend doesn't paginate yet
      };
    } catch (error) {
      throw this.handleError(error, "Failed to fetch transaction history");
    }
  }

  async getTransactionDetails(transactionId) {
    try {
      const response = await this.api.get(`/transaction/${transactionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch transaction details");
    }
  }

  async getTransactionSummary(filters = {}) {
    try {
      // Default to last 30 days if no dates provided
      const now = new Date();
      const defaultEndDate = now.toISOString();
      const defaultStartDate = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const params = {
        startDate: filters.startDate || defaultStartDate,
        endDate: filters.endDate || defaultEndDate,
        ptsId: filters.ptsId || filters.deviceId,
        vehicleId: filters.vehicleId,
        tankId: filters.tankId,
      };

      // Remove undefined/null values
      Object.keys(params).forEach(
        (key) =>
          (params[key] === undefined || params[key] === null) &&
          delete params[key]
      );

      const response = await this.api.get("/v1/Consumption/pumptransactions", {
        params,
      });

      // Calculate summary from transactions data
      const data = response.data?.data || response.data || [];
      const transactions = Array.isArray(data) ? data : [];

      const totalVolume = transactions.reduce(
        (sum, t) => sum + (t.volume || 0),
        0
      );
      const totalAmount = transactions.reduce(
        (sum, t) => sum + (t.amount || 0),
        0
      );

      return {
        totalTransactions: transactions.length,
        totalVolume,
        totalAmount,
        averageTransactionAmount:
          transactions.length > 0 ? totalAmount / transactions.length : 0,
      };
    } catch (error) {
      throw this.handleError(error, "Failed to fetch transaction summary");
    }
  }

  // Device and Pump endpoints
  async getDeviceList() {
    try {
      const response = await this.api.get("/v1/PTSDevice");
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch device list");
    }
  }

  /**
   * Get PTS devices filtered by site ID
   * @param {number} siteId - The site ID to filter devices by
   * @returns {Promise<Array>} List of PTS devices for the specified site
   */
  async getDevicesBySite(siteId) {
    try {
      const response = await this.api.get(`/v1/PTSDevice/site/${siteId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch devices for site");
    }
  }

  async getDeviceStatus(deviceId) {
    try {
      const response = await this.api.get(`/v1/PTSDevice/Device/${deviceId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch device status");
    }
  }

  async getPumpList(deviceId) {
    try {
      const response = await this.api.get(`/v1/PTSDevice/${deviceId}/pumps`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch pump list");
    }
  }

  // Vehicle and Tag endpoints
  async getVehicleList() {
    try {
      const response = await this.api.get("/v1/Vehicle/simple");
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch vehicle list");
    }
  }

  /**
   * Search vehicles by search term (hyoung number, plate, name)
   * @param {string} searchTerm - Search query (minimum 2 characters)
   * @param {number} limit - Maximum results to return (default 10)
   * @returns {Promise<Array>} List of matching vehicles
   */
  async searchVehicles(searchTerm, limit = 10) {
    try {
      const response = await this.api.get("/v1/Vehicle/quick-search", {
        params: { searchTerm, limit },
      });
      // Handle FMSResponse wrapper - data is in response.data.data
      return response.data?.data || response.data || [];
    } catch (error) {
      throw this.handleError(error, "Failed to search vehicles");
    }
  }

  /**
   * Get vehicle by ID
   * @param {number} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Vehicle details
   */
  async getVehicleById(vehicleId) {
    try {
      const response = await this.api.get(`/v1/Vehicle/${vehicleId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch vehicle details");
    }
  }

  /**
   * Get GPS information for a vehicle
   * @param {number} vehicleId - Vehicle ID
   * @returns {Promise<Object>} GPS data including location, speed, etc.
   */
  async getVehicleGPSInfo(vehicleId) {
    try {
      const response = await this.api.get(
        `/v1/vehicletracking/${vehicleId}/gps-information`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch vehicle GPS information");
    }
  }

  /**
   * Get consumption history for a vehicle
   * @param {number} vehicleId - Vehicle ID
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<Array>} Consumption history records
   */
  async getVehicleConsumptionHistory(
    vehicleId,
    startDate,
    endDate,
    entry = 30
  ) {
    try {
      // Format dates as YYYY-MM-DD
      const formatDate = (date) => {
        const d = new Date(date);
        return d.toISOString().split("T")[0];
      };

      const response = await this.api.get(
        `/v1/consumption/gethistoryconsumptionbyvehicle`,
        {
          params: {
            vehicleId,
            datestring: formatDate(endDate),
            dateFromString: formatDate(startDate),
            entry,
          },
        }
      );
      // Handle FMSResponse wrapper
      return response.data?.data || response.data || [];
    } catch (error) {
      throw this.handleError(error, "Failed to fetch consumption history");
    }
  }

  /**
   * Get fueling/refill history for a vehicle
   * @param {number} vehicleId - Vehicle ID
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<Array>} Fueling history records
   */
  async getVehicleFuelingHistory(vehicleId, startDate, endDate) {
    try {
      // Format dates as YYYY-MM-DD
      const formatDate = (date) => {
        const d = new Date(date);
        return d.toISOString().split("T")[0];
      };

      const response = await this.api.get(`/v1/consumption/vehicleRefills`, {
        params: {
          vehicleId,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
        },
      });
      // Handle FMSResponse wrapper
      return response.data?.data || response.data || [];
    } catch (error) {
      throw this.handleError(error, "Failed to fetch fueling history");
    }
  }

  async validateTag(tagId) {
    try {
      const response = await this.api.post("/tag/validate", { tagId });
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to validate tag");
    }
  }

  // Site information
  async getSiteList() {
    try {
      const response = await this.api.get("/v1/Site");
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch site list");
    }
  }

  // Pump authorization and control
  async authorizePump(authRequest) {
    try {
      const response = await this.api.post("/pump/authorize", authRequest);
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to authorize pump");
    }
  }

  async stopPump(deviceId, pumpId) {
    try {
      // API endpoint: POST /api/v1/Pump/{deviceId}/{pumpId}/stop
      const response = await this.api.post(
        `/v1/Pump/${deviceId}/${pumpId}/stop`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to stop pump");
    }
  }

  async completePump(deviceId, pumpId, transactionId) {
    try {
      const response = await this.api.post("/v1/Pump/complete", {
        deviceId,
        pumpId,
        transactionId,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to complete pump");
    }
  }

  // Tank endpoints
  async getTankList() {
    try {
      const response = await this.api.get("/v1/Tank");
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch tank list");
    }
  }

  async getTanksBySite(siteId) {
    try {
      const response = await this.api.get(`/v1/Tank/site/${siteId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch tanks for site");
    }
  }

  async getTankById(tankId) {
    try {
      const response = await this.api.get(`/v1/Tank/${tankId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch tank details");
    }
  }

  // Tank Stock endpoints
  async createOpeningStock(tankId, amount, dateTime) {
    try {
      const params = new URLSearchParams({
        tankId: tankId.toString(),
        amount: amount.toString(),
        dateTime: dateTime.toISOString(),
      });
      const response = await this.api.post(
        `/v1/TankStock/openingstock?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to create opening stock");
    }
  }

  async createClosingStock(tankId, amount, dateTime) {
    try {
      const params = new URLSearchParams({
        tankId: tankId.toString(),
        amount: amount.toString(),
        dateTime: dateTime.toISOString(),
      });
      const response = await this.api.post(
        `/v1/TankStock/closingstock?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to create closing stock");
    }
  }

  async getTankCurrentVolume(tankId) {
    try {
      // Get from tank volume history with correct endpoint
      const response = await this.api.get(`/v1/Tank/volume-history`, {
        params: {
          tankId: tankId,
          startDate: new Date(Date.now() - 3600000).toISOString(), // Last hour
          endDate: new Date().toISOString(),
        },
      });
      // Return latest volume or 0
      if (response.data && response.data.length > 0) {
        return response.data[response.data.length - 1].volume || 0;
      }
      return 0;
    } catch (error) {
      // Don't throw error for volume fetch - just return 0
      console.warn("Failed to fetch tank current volume:", error.message);
      return 0;
    }
  }

  async getTankStockRecords(options = {}) {
    try {
      const params = {
        startDate: options.startDate,
        endDate: options.endDate,
        siteIds: options.siteIds,
        tankIds: options.tankIds,
      };
      // Remove undefined values
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );
      const response = await this.api.get("/v1/TankStock", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch tank stock records");
    }
  }

  // ============================================
  // Tank Volume History (Transaction Hub) endpoints
  // ============================================

  /**
   * Get filtered tank volume history
   * Matches backend: GET /v1/TankVolumeHistory/filtered
   * @param {Object} filters - Filter parameters
   * @param {number|number[]} filters.siteId - Site ID(s) to filter by
   * @param {number} filters.tankId - Tank ID to filter by
   * @param {string} filters.recordedBy - User ID to filter by
   * @param {string} filters.startDate - Start date (YYYY-MM-DD)
   * @param {string} filters.endDate - End date (YYYY-MM-DD)
   * @param {number} filters.take - Number of records to return (default: 100)
   * @param {boolean} filters.includeVehicleNames - Include vehicle names (default: true)
   * @param {boolean} filters.useManualDispensing - Filter by manual dispensing
   */
  async getTankVolumeHistory(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.siteId) {
        // Handle array of site IDs
        if (Array.isArray(filters.siteId)) {
          filters.siteId.forEach((id) => params.append("siteId", id));
        } else {
          params.append("siteId", filters.siteId);
        }
      }
      if (filters.tankId) params.append("tankId", filters.tankId);
      if (filters.recordedBy) params.append("recordedBy", filters.recordedBy);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.take) params.append("take", filters.take);
      if (filters.includeVehicleNames !== undefined) {
        params.append("includeVehicleNames", filters.includeVehicleNames);
      }
      if (filters.useManualDispensing !== undefined) {
        params.append("useManualDispensing", filters.useManualDispensing);
      }

      const response = await this.api.get(
        `/v1/TankVolumeHistory/filtered?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch tank volume history");
    }
  }

  /**
   * Get tank volume history by site
   * Matches backend: GET /v1/TankVolumeHistory/bySite
   */
  async getTankVolumeHistoryBySite(startDate, endDate, siteId) {
    try {
      const params = new URLSearchParams();
      params.append("startDate", startDate);
      params.append("endDate", endDate);
      params.append("siteId", siteId);

      const response = await this.api.get(
        `/v1/TankVolumeHistory/bySite?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(
        error,
        "Failed to fetch tank volume history by site"
      );
    }
  }

  /**
   * Get tank volume history by date range
   * Matches backend: GET /v1/TankVolumeHistory/byDateRange
   */
  async getTankVolumeHistoryByDateRange(startDate, endDate) {
    try {
      const response = await this.api.get(
        `/v1/TankVolumeHistory/byDateRange?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(
        error,
        "Failed to fetch tank volume history by date range"
      );
    }
  }

  /**
   * Get tank volume history by tank and date range
   * Matches backend: GET /v1/TankVolumeHistory/byTankAndDateRange
   */
  async getTankVolumeHistoryByTankAndDateRange(startDate, endDate, tankId) {
    try {
      const response = await this.api.get(
        `/v1/TankVolumeHistory/byTankAndDateRange?startDate=${startDate}&endDate=${endDate}&TankId=${tankId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(
        error,
        "Failed to fetch tank volume history by tank"
      );
    }
  }

  /**
   * Get users list for transaction history filter
   * Matches backend: GET /v1/TankVolumeHistory/users
   */
  async getTankVolumeHistoryUsers() {
    try {
      const response = await this.api.get("/v1/TankVolumeHistory/users");
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch users for filter");
    }
  }

  // ============================================
  // Tank Transfer endpoints
  // ============================================

  /**
   * Authorize pump for tank-to-tank transfer
   * Matches backend: POST /api/v1/pump/authorize-transfer
   * Expects: PumpAuthorizeTransferCommand { DeviceId, PumpId, SourceTankId, DestinationTankId, Volume }
   */
  async authorizeTankTransfer(transferAuthData) {
    try {
      const response = await this.api.post(
        "/v1/pump/authorize-transfer",
        transferAuthData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to authorize tank transfer");
    }
  }

  /**
   * Create tank transfer record (after physical transfer completes)
   * This records the transfer in the database
   */
  async createTankTransfer(transferData) {
    try {
      const response = await this.api.post(
        "/v1/TankStock/transfer",
        transferData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to create tank transfer");
    }
  }

  // Error handling helper - Enhanced to support FMSResponse validationErrors
  handleError(error, defaultMessage) {
    const responseData = error.response?.data;

    // Check for FMSResponse validationErrors array
    if (
      responseData?.validationErrors &&
      Array.isArray(responseData.validationErrors) &&
      responseData.validationErrors.length > 0
    ) {
      // Join validation errors with newlines for display
      const validationMessage = responseData.validationErrors.join("\n");
      const err = new Error(validationMessage);
      err.validationErrors = responseData.validationErrors;
      err.isValidationError = true;
      return err;
    }

    const message =
      responseData?.message ||
      responseData?.error ||
      error.message ||
      defaultMessage;
    return new Error(message);
  }

  // Utility method to set auth token manually
  async setAuthToken(token) {
    await AsyncStorage.setItem("auth_token", token);
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      return !!token;
    } catch (error) {
      return false;
    }
  }
}

export default new ApiService();
