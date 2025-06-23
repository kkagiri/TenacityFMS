//Cursor - Mobile pump control service adapted from web frontend
import axios from 'axios';
import Config from 'react-native-config';

const API_BASE_URL = Config.API_BASE_URL || 'http://localhost:5000/api';

class PumpControlService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.api.interceptors.request.use(
      (config) => {
        // Token will be added by Redux middleware
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Device management
  async getDeviceList() {
    try {
      const response = await this.api.get('/device/list');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch device list: ${error.message}`);
    }
  }

  async getDeviceStatus(deviceId) {
    try {
      const response = await this.api.get(`/device/${deviceId}/status`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch device status: ${error.message}`);
    }
  }

  async getDeviceConfig(deviceId) {
    try {
      const response = await this.api.get(`/device/${deviceId}/config`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch device config: ${error.message}`);
    }
  }

  // Pump operations
  async authorizePump(authRequest) {
    try {
      const response = await this.api.post('/pump/authorize', authRequest);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to authorize pump: ${error.message}`);
    }
  }

  async stopPump(deviceId, pumpId) {
    try {
      const response = await this.api.post('/pump/stop', {
        deviceId,
        pumpId,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to stop pump: ${error.message}`);
    }
  }

  async completePump(deviceId, pumpId, transactionId) {
    try {
      const response = await this.api.post('/pump/complete', {
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
      const response = await this.api.post('/pump/cancel', {
        deviceId,
        transactionId,
        reason,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel transaction: ${error.message}`);
    }
  }

  // Vehicle and tag operations
  async getVehicleList() {
    try {
      const response = await this.api.get('/vehicle/list');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch vehicle list: ${error.message}`);
    }
  }

  async validateVehicle(vehicleId) {
    try {
      const response = await this.api.post('/vehicle/validate', {vehicleId});
      return response.data;
    } catch (error) {
      throw new Error(`Failed to validate vehicle: ${error.message}`);
    }
  }

  async validateTag(tagId) {
    try {
      const response = await this.api.post('/tag/validate', {tagId});
      return response.data;
    } catch (error) {
      throw new Error(`Failed to validate tag: ${error.message}`);
    }
  }

  async getTagsByVehicle(vehicleId) {
    try {
      const response = await this.api.get(`/tag/vehicle/${vehicleId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }
  }

  // Transaction history
  async getTransactionHistory(filters = {}) {
    try {
      const response = await this.api.get('/transaction/history', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch transaction history: ${error.message}`);
    }
  }

  async getTransactionDetails(transactionId) {
    try {
      const response = await this.api.get(`/transaction/${transactionId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch transaction details: ${error.message}`);
    }
  }

  // Site information
  async getSiteList() {
    try {
      const response = await this.api.get('/site/list');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch site list: ${error.message}`);
    }
  }

  // Authentication
  async login(credentials) {
    try {
      const response = await this.api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async logout() {
    try {
      const response = await this.api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  async refreshToken() {
    try {
      const response = await this.api.post('/auth/refresh');
      return response.data;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  // Set auth token for subsequent requests
  setAuthToken(token) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }
}

export const pumpControlService = new PumpControlService();
export default pumpControlService;