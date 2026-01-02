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
      const response = await this.api.get(
        `/v1/FuelTag/validate-vehicle/${vehicleId}`
      );
      return response.data;
    } catch (error) {
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
