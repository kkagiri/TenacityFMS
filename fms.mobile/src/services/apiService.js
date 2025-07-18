import axios from 'axios';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = Config.API_BASE_URL || 'http://10.0.2.2:5000/api'; // Android emulator localhost

class ApiService {
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
      async (config) => {
        try {
          const token = await AsyncStorage.getItem('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error retrieving auth token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear storage and redirect to login
          await AsyncStorage.multiRemove(['auth_token', 'user_data']);
          // Dispatch logout action would be handled by calling component
        }
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(credentials) {
    try {
      const response = await this.api.post('/auth/login', credentials);
      if (response.data.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Login failed');
    }
  }

  async logout() {
    try {
      await this.api.post('/auth/logout');
      await AsyncStorage.multiRemove(['auth_token', 'user_data']);
      return { success: true };
    } catch (error) {
      // Even if logout fails on server, clear local storage
      await AsyncStorage.multiRemove(['auth_token', 'user_data']);
      throw this.handleError(error, 'Logout failed');
    }
  }

  async refreshToken() {
    try {
      const response = await this.api.post('/auth/refresh');
      if (response.data.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Token refresh failed');
    }
  }

  // Transaction endpoints
  async getTransactionHistory(filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        pageSize: filters.pageSize || 20,
        startDate: filters.startDate,
        endDate: filters.endDate,
        pumpId: filters.pumpId,
        deviceId: filters.deviceId,
        vehicleId: filters.vehicleId,
        tagId: filters.tagId,
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc'
      };

      // Remove undefined values
      Object.keys(params).forEach(key =>
        params[key] === undefined && delete params[key]
      );

      const response = await this.api.get('/transaction/history', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch transaction history');
    }
  }

  async getTransactionDetails(transactionId) {
    try {
      const response = await this.api.get(`/transaction/${transactionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch transaction details');
    }
  }

  async getTransactionSummary(filters = {}) {
    try {
      const response = await this.api.get('/transaction/summary', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch transaction summary');
    }
  }

  // Device and Pump endpoints
  async getDeviceList() {
    try {
      const response = await this.api.get('/device/list');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch device list');
    }
  }

  async getDeviceStatus(deviceId) {
    try {
      const response = await this.api.get(`/device/${deviceId}/status`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch device status');
    }
  }

  async getPumpList(deviceId) {
    try {
      const response = await this.api.get(`/device/${deviceId}/pumps`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch pump list');
    }
  }

  // Vehicle and Tag endpoints
  async getVehicleList() {
    try {
      const response = await this.api.get('/vehicle/list');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch vehicle list');
    }
  }

  async validateTag(tagId) {
    try {
      const response = await this.api.post('/tag/validate', { tagId });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to validate tag');
    }
  }

  // Site information
  async getSiteList() {
    try {
      const response = await this.api.get('/site/list');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch site list');
    }
  }

  // Pump authorization and control
  async authorizePump(authRequest) {
    try {
      const response = await this.api.post('/pump/authorize', authRequest);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to authorize pump');
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
      throw this.handleError(error, 'Failed to stop pump');
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
      throw this.handleError(error, 'Failed to complete pump');
    }
  }

  // Error handling helper
  handleError(error, defaultMessage) {
    const message = error.response?.data?.message ||
                   error.response?.data?.error ||
                   error.message ||
                   defaultMessage;
    return new Error(message);
  }

  // Utility method to set auth token manually
  async setAuthToken(token) {
    await AsyncStorage.setItem('auth_token', token);
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return !!token;
    } catch (error) {
      return false;
    }
  }
}

export default new ApiService();