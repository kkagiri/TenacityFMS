//Cursor - Mobile pump control service adapted from web frontend
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/environment";

const API_BASE_URL = API_CONFIG.BASE_URL;

class PumpControlService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor for auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem("auth_token");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error(
            "[PumpControlService] Error retrieving auth token:",
            error
          );
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("API Error:", error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Device management
  async getDeviceList() {
    try {
      const response = await this.api.get("/v1/PTSDevice");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch device list: ${error.message}`);
    }
  }

  async getDeviceStatus(deviceId) {
    try {
      const response = await this.api.get(`/v1/PTSDevice/Device/${deviceId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch device status: ${error.message}`);
    }
  }

  async getDeviceConfig(deviceId) {
    try {
      const response = await this.api.get(`/v1/PTSDevice/GetById/${deviceId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch device config: ${error.message}`);
    }
  }

  // Pump operations
  async authorizePump(authRequest) {
    try {
      const response = await this.api.post("/v1/Pump/authorize", authRequest);
      return response.data;
    } catch (error) {
      // Preserve validation errors from API response
      const responseData = error.response?.data;
      if (responseData?.validationErrors?.length > 0) {
        const validationError = new Error(
          responseData.validationErrors.join("\n")
        );
        validationError.validationErrors = responseData.validationErrors;
        validationError.isValidationError = true;
        throw validationError;
      }
      throw new Error(`Failed to authorize pump: ${error.message}`);
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
      throw new Error(`Failed to stop pump: ${error.message}`);
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
      throw new Error(`Failed to complete pump: ${error.message}`);
    }
  }

  async cancelTransaction(deviceId, transactionId, reason) {
    try {
      const response = await this.api.post("/v1/Pump/cancel", {
        deviceId,
        transactionId,
        reason,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel transaction: ${error.message}`);
    }
  }

  // ==========================================
  // Tank Transfer Operations
  // ==========================================

  /**
   * Authorize pump for tank-to-tank transfer
   * POST /api/v1/Pump/authorize-transfer
   * @param {Object} transferRequest - Transfer authorization data
   * @param {string} transferRequest.deviceId - PTS device ID
   * @param {number} transferRequest.pumpId - Pump number
   * @param {number} transferRequest.sourceTankId - Source tank ID
   * @param {number} transferRequest.destinationTankId - Destination tank ID
   * @param {number} transferRequest.volume - Volume to transfer in liters
   * @param {number} [transferRequest.nozzleId] - Optional nozzle ID
   * @param {string} [transferRequest.reason] - Optional transfer reason
   */
  async authorizeTankTransfer(transferRequest) {
    try {
      const response = await this.api.post(
        "/v1/Pump/authorize-transfer",
        transferRequest
      );
      return response.data;
    } catch (error) {
      // Preserve validation errors from API response
      const responseData = error.response?.data;
      if (responseData?.validationErrors?.length > 0) {
        const validationError = new Error(
          responseData.validationErrors.join("\n")
        );
        validationError.validationErrors = responseData.validationErrors;
        validationError.isValidationError = true;
        throw validationError;
      }
      throw new Error(`Failed to authorize tank transfer: ${error.message}`);
    }
  }

  // ==========================================
  // Tank Operations
  // ==========================================

  /**
   * Get all tanks
   * GET /api/v1/Tank
   */
  async getTanks() {
    try {
      const response = await this.api.get("/v1/Tank");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch tanks: ${error.message}`);
    }
  }

  /**
   * Get tanks by site ID
   * GET /api/v1/Tank/site/{siteId}
   */
  async getTanksBySite(siteId) {
    try {
      const response = await this.api.get(`/v1/Tank/site/${siteId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch tanks for site: ${error.message}`);
    }
  }

  /**
   * Get tank by ID
   * GET /api/v1/Tank/{tankId}
   */
  async getTankById(tankId) {
    try {
      const response = await this.api.get(`/v1/Tank/${tankId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch tank: ${error.message}`);
    }
  }

  // ==========================================
  // Pump State Operations
  // ==========================================

  /**
   * Get pump state
   * GET /api/v1/Pump/{deviceId}/{pumpId}/state
   */
  async getPumpState(deviceId, pumpId) {
    try {
      const response = await this.api.get(
        `/v1/Pump/${deviceId}/${pumpId}/state`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get pump state: ${error.message}`);
    }
  }

  /**
   * Get nozzle state (lifted/down)
   * GET /api/v1/Pump/{deviceId}/{pumpId}/nozzle-state
   */
  async getNozzleState(deviceId, pumpId) {
    try {
      const response = await this.api.get(
        `/v1/Pump/${deviceId}/${pumpId}/nozzle-state`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get nozzle state: ${error.message}`);
    }
  }

  /**
   * Close/complete a transaction
   * POST /api/v1/Pump/{deviceId}/{pumpId}/close
   */
  async closeTransaction(deviceId, pumpId, transactionId) {
    try {
      const response = await this.api.post(
        `/v1/Pump/${deviceId}/${pumpId}/close`,
        {
          transaction: transactionId,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to close transaction: ${error.message}`);
    }
  }

  /**
   * Get transaction info
   * GET /api/v1/Pump/{deviceId}/{pumpId}/transaction/{transactionId}
   */
  async getTransactionInfo(deviceId, pumpId, transactionId) {
    try {
      const response = await this.api.get(
        `/v1/Pump/${deviceId}/${pumpId}/transaction/${transactionId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get transaction info: ${error.message}`);
    }
  }

  // ==========================================
  // Tag Operations (FuelTag Controller)
  // ==========================================

  /**
   * Validate a tag for fueling
   * GET /api/v1/FuelTag/validate/{tagId}
   */
  async validateTagById(tagId) {
    try {
      const response = await this.api.get(`/v1/FuelTag/validate/${tagId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to validate tag: ${error.message}`);
    }
  }

  /**
   * Get tags by vehicle ID
   * GET /api/v1/FuelTag/by-vehicle/{vehicleId}
   */
  async getTagsByVehicleId(vehicleId) {
    try {
      const response = await this.api.get(
        `/v1/FuelTag/by-vehicle/${vehicleId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch tags for vehicle: ${error.message}`);
    }
  }

  /**
   * Get tag details by tag name
   * GET /api/v1/FuelTag/details/{tagName}
   */
  async getTagDetails(tagName) {
    try {
      const response = await this.api.get(
        `/v1/FuelTag/details/${encodeURIComponent(tagName)}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get tag details: ${error.message}`);
    }
  }

  /**
   * Validate vehicle for fueling (checks if vehicle can fuel)
   * GET /api/v1/FuelTag/validate-vehicle/{vehicleId}
   */
  async validateVehicleForFueling(vehicleId) {
    try {
      console.log(
        "[PumpControlService] Calling validateVehicleForFueling API for vehicleId:",
        vehicleId
      );
      const response = await this.api.get(
        `/v1/FuelTag/validate-vehicle/${vehicleId}`
      );
      console.log(
        "[PumpControlService] validateVehicleForFueling API status:",
        response.status
      );
      console.log(
        "[PumpControlService] validateVehicleForFueling API data:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } catch (error) {
      console.error(
        "[PumpControlService] validateVehicleForFueling API error:",
        error.message
      );
      console.error(
        "[PumpControlService] Error details:",
        error.response?.status,
        error.response?.data
      );
      throw new Error(`Failed to validate vehicle: ${error.message}`);
    }
  }

  // Vehicle and tag operations (legacy - kept for compatibility)
  async getVehicleList() {
    try {
      const response = await this.api.get("/v1/Vehicle/simple");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch vehicle list: ${error.message}`);
    }
  }

  async validateVehicle(vehicleId) {
    try {
      const response = await this.api.post("/v1/vehicle/validate", {
        vehicleId,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to validate vehicle: ${error.message}`);
    }
  }

  async validateTag(tagId) {
    try {
      const response = await this.api.post("/v1/tag/validate", { tagId });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to validate tag: ${error.message}`);
    }
  }

  async getTagsByVehicle(vehicleId) {
    try {
      const response = await this.api.get(`/v1/tag/vehicle/${vehicleId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }
  }

  // Transaction history
  async getTransactionHistory(filters = {}) {
    try {
      const response = await this.api.get("/v1/transaction/history", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch transaction history: ${error.message}`);
    }
  }

  async getTransactionDetails(transactionId) {
    try {
      const response = await this.api.get(`/v1/transaction/${transactionId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch transaction details: ${error.message}`);
    }
  }

  // ==========================================
  // Fueling Rules Operations
  // ==========================================

  /**
   * Get all available rule sets
   * GET /api/v1/FuelingRule/rulesets
   */
  async getRuleSets() {
    try {
      const response = await this.api.get("/v1/FuelingRule/rulesets");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch rule sets: ${error.message}`);
    }
  }

  /**
   * Get fueling rules for a vehicle
   * GET /api/v1/FuelingRule/vehicle/{vehicleId}
   */
  async getVehicleFuelingRules(vehicleId) {
    try {
      const response = await this.api.get(
        `/v1/FuelingRule/vehicle/${vehicleId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch vehicle fueling rules: ${error.message}`
      );
    }
  }

  /**
   * Get effective/merged fueling rules for a vehicle from cascade hierarchy
   * GET /api/v1/FuelingRule/vehicle/{vehicleId}/effective-rules
   * @param {number} vehicleId - The vehicle ID
   * @param {number|null} siteId - Optional site ID for site-level rules
   * @param {number|null} tagId - Optional tag ID for tag-level rules
   * @returns {Promise<Object>} Effective rules with merged limits and applied rule sets
   */
  async getVehicleEffectiveRules(vehicleId, siteId = null, tagId = null) {
    try {
      let url = `/v1/FuelingRule/vehicle/${vehicleId}/effective-rules`;
      const params = [];
      if (siteId) params.push(`siteId=${siteId}`);
      if (tagId) params.push(`tagId=${tagId}`);
      if (params.length > 0) url += `?${params.join("&")}`;

      console.log("[PumpControlService] getVehicleEffectiveRules - URL:", url);
      const response = await this.api.get(url);
      console.log(
        "[PumpControlService] getVehicleEffectiveRules - Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } catch (error) {
      console.error(
        "[PumpControlService] Failed to fetch effective rules:",
        error
      );
      throw new Error(
        `Failed to fetch effective fueling rules: ${error.message}`
      );
    }
  }

  /**
   * Assign a rule set to a vehicle
   * POST /api/v1/FuelingRule/rulesets/{ruleSetId}/assign-to-vehicle/{vehicleId}
   */
  async assignRuleSetToVehicle(ruleSetId, vehicleId) {
    try {
      const response = await this.api.post(
        `/v1/FuelingRule/rulesets/${ruleSetId}/assign-to-vehicle/${vehicleId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to assign rule set to vehicle: ${error.message}`);
    }
  }

  /**
   * Check if vehicle has fueling rules configured using the effective rules API
   * Returns { hasRules: boolean, isAllowed: boolean, maxFuelAllowed: number, ... }
   */
  async checkVehicleFuelingRules(vehicleId, siteId = null, tagId = null) {
    try {
      console.log(
        "[PumpControlService] checkVehicleFuelingRules called for vehicleId:",
        vehicleId,
        "siteId:",
        siteId,
        "tagId:",
        tagId
      );

      // Use the new effective rules endpoint for cascade-merged rules
      const effectiveRulesResponse = await this.getVehicleEffectiveRules(
        vehicleId,
        siteId,
        tagId
      );
      console.log(
        "[PumpControlService] getVehicleEffectiveRules response:",
        JSON.stringify(effectiveRulesResponse, null, 2)
      );

      // Extract data from FMSResponse wrapper if present
      const effectiveRules =
        effectiveRulesResponse?.data || effectiveRulesResponse;

      // Parse the effective rules response
      const hasRules = effectiveRules?.hasRules || false;
      const isAllowed = effectiveRules?.isAllowed ?? true;
      const maxFuelAllowed = effectiveRules?.maxFuelAllowed || null;

      console.log(
        "[PumpControlService] Parsed - hasRules:",
        hasRules,
        "| isAllowed:",
        isAllowed,
        "| maxFuelAllowed:",
        maxFuelAllowed,
        "| dailyLimit:",
        effectiveRules?.dailyLimit,
        "| monthlyLimit:",
        effectiveRules?.monthlyLimit,
        "| tankCapacity:",
        effectiveRules?.tankCapacity,
        "| currentFuelLevel:",
        effectiveRules?.currentFuelLevel,
        "| hardLimit:",
        effectiveRules?.hardLimit
      );

      const result = {
        hasRules,
        isAllowed,
        isValid: isAllowed,
        maxFuelAllowed,
        message:
          effectiveRules?.message ||
          (isAllowed ? "Fueling allowed" : "Fueling not allowed"),
        vehicleInfo: effectiveRules?.vehicle || null,

        // Tank/Hard Limit Info (critical for accurate fueling)
        tankCapacity: effectiveRules?.tankCapacity || 0,
        currentFuelLevel: effectiveRules?.currentFuelLevel ?? null,
        hasGpsFuelSensor: effectiveRules?.hasGpsFuelSensor || false,
        hardLimit: effectiveRules?.hardLimit || 0,
        limitingFactor: effectiveRules?.limitingFactor || null,

        // Soft Limits
        dailyLimit: effectiveRules?.dailyLimit || 0,
        monthlyLimit: effectiveRules?.monthlyLimit || 0,
        perTransactionLimit: effectiveRules?.perTransactionLimit || 0,

        // Usage Stats
        dailyUsed: effectiveRules?.fuelUsedToday || 0,
        monthlyUsed: effectiveRules?.fuelUsedThisMonth || 0,
        dailyRemaining: effectiveRules?.dailyRemaining ?? null,
        monthlyRemaining: effectiveRules?.monthlyRemaining ?? null,

        // Refill Info
        refillsToday: effectiveRules?.refillsToday || 0,
        maxRefillsPerDay: effectiveRules?.maxRefillsPerDay ?? null,
        refillsRemainingToday: effectiveRules?.refillsRemainingToday ?? null,

        // Time Window
        timeWindowStart: effectiveRules?.timeWindowStart || null,
        timeWindowEnd: effectiveRules?.timeWindowEnd || null,

        // Applied Rules
        appliedRuleSets: effectiveRules?.appliedRuleSets || [],
        softLimits: effectiveRules?.softLimits || {},
      };

      console.log(
        "[PumpControlService] Returning result:",
        JSON.stringify(result, null, 2)
      );
      return result;
    } catch (error) {
      console.error(
        "[PumpControlService] Error checking vehicle rules:",
        error
      );
      return {
        hasRules: false,
        isAllowed: true, // Allow fueling if rules check fails
        isValid: true,
        message: error.message,
        vehicleInfo: null,
      };
    }
  }

  // ==========================================
  // GPS and Fuel Level Operations
  // ==========================================

  /**
   * Get vehicle GPS info including fuel level
   * GET /api/v1/vehicletracking/{vehicleId}/gps-information
   */
  async getVehicleGPSInfo(vehicleId) {
    try {
      const response = await this.api.get(
        `/v1/vehicletracking/${vehicleId}/gps-information`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch vehicle GPS info: ${error.message}`);
    }
  }

  /**
   * Get current fuel level from GPS data
   * Returns fuel level in liters or percentage based on GPS sensor data
   */
  async getVehicleFuelLevel(vehicleId, tankCapacity = null) {
    try {
      const gpsResponse = await this.getVehicleGPSInfo(vehicleId);
      const gpsData = gpsResponse?.data || gpsResponse;

      if (!gpsData) {
        return {
          available: false,
          message: "No GPS data available",
        };
      }

      // Check for fuel level in sensor health data
      const fuelLevel = gpsData?.sensorHealth?.fuelLevel ?? gpsData?.fuelLevel;
      const fuelLevelUnit = gpsData?.sensorHealth?.fuelLevelUnit || "%";

      if (fuelLevel === null || fuelLevel === undefined) {
        return {
          available: false,
          message: "Fuel level sensor data not available",
        };
      }

      // Convert to liters if we have tank capacity and fuel level is in percentage
      let fuelLevelLiters = null;
      if (tankCapacity && fuelLevelUnit === "%") {
        fuelLevelLiters = (fuelLevel / 100) * tankCapacity;
      } else if (fuelLevelUnit === "L") {
        fuelLevelLiters = fuelLevel;
      }

      return {
        available: true,
        fuelLevel,
        fuelLevelUnit,
        fuelLevelLiters,
        tankCapacity,
        remainingCapacity:
          tankCapacity && fuelLevelLiters
            ? tankCapacity - fuelLevelLiters
            : null,
        lastUpdated: gpsData?.lastUpdated || gpsData?.receivedAt,
      };
    } catch (error) {
      console.error(
        "[PumpControlService] Error getting vehicle fuel level:",
        error
      );
      return {
        available: false,
        message: error.message,
      };
    }
  }

  // Site information
  async getSiteList() {
    try {
      const response = await this.api.get("/v1/Site");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch site list: ${error.message}`);
    }
  }

  // Authentication
  async login(credentials) {
    try {
      const response = await this.api.post("/v1/User/Login", credentials);
      const responseData = response.data.data;
      if (responseData?.token) {
        return {
          token: responseData.token,
          refreshToken: responseData.refreshToken,
          user: responseData.user,
        };
      }
      throw new Error(response.data.message || "Login failed");
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async logout() {
    // No dedicated logout endpoint - just clear auth token
    this.setAuthToken(null);
    return { success: true };
  }

  async refreshToken() {
    try {
      const response = await this.api.post("/v1/User/refresh-token");
      const responseData = response.data.data;
      if (responseData?.token) {
        return {
          token: responseData.token,
          refreshToken: responseData.refreshToken,
        };
      }
      throw new Error("Token refresh failed");
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  // Set auth token for subsequent requests
  setAuthToken(token) {
    if (token) {
      this.api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common["Authorization"];
    }
  }
}

export const pumpControlService = new PumpControlService();
export default pumpControlService;
