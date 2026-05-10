/**
 * Enterprise BaseService Class
 *
 * Provides standardized service architecture for FMS frontend:
 * - Consistent API communication patterns
 * - FMSResponse<T> handling
 * - Standardized error handling
 * - Logging and monitoring
 * - Cache management
 * - Request/response transformation
 *
 * @version 1.0.0
 * @since API v1
 */

import axiosInstance from '../../api/axiosInstance';
import { APIErrorHandler } from './APIErrorHandler';
import { ServiceLogger } from './ServiceLogger';

export class BaseService {
  constructor(serviceName, baseEndpoint, options = {}) {
    this.serviceName = serviceName;
    this.baseEndpoint = baseEndpoint;
    this.options = {
      useCache: false,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes default
      logRequests: process.env.NODE_ENV === 'development',
      apiVersion: 'v1',
      ...options
    };

    this.cache = new Map();
    this.logger = new ServiceLogger(serviceName);
    this.errorHandler = new APIErrorHandler(serviceName);
  }

  /**
   * Standardized GET request with FMSResponse handling
   * @param {string} endpoint - API endpoint (relative to baseEndpoint)
   * @param {Object} params - Query parameters
   * @param {Object} options - Request options
   * @returns {Promise<{success: boolean, data: any, message: string, errors?: Array}>}
   */
  async get(endpoint = '', params = {}, options = {}) {
    const cacheKey = this._getCacheKey('GET', endpoint, params);
    const url = this._buildUrl(endpoint);

    // Check cache first
    if (this.options.useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.options.cacheTimeout) {
        this.logger.debug(`Cache hit for ${endpoint}`, { params });
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {

      this.logger.debug(`GET ${url}`, { params, options });

      const response = await axiosInstance.get(url, {
        params,
        headers: {
          'API-Version': this.options.apiVersion,
          ...options.headers
        },
        ...options
      });

      const result = this._handleFMSResponse(response);

      // Cache successful responses
      if (this.options.useCache && result.success) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      this.logger.debug(`GET ${url} - Success`, result);
      return result;

    } catch (error) {
      this.logger.error(`GET ${url} - Error`, error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Standardized POST request with FMSResponse handling
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<{success: boolean, data: any, message: string, errors?: Array}>}
   */
  async post(endpoint = '', data = {}, options = {}) {
    const url = this._buildUrl(endpoint);

    try {

      this.logger.debug(`POST ${url}`, { data: this._sanitizeLogData(data), options });

      const response = await axiosInstance.post(url, data, {
        headers: {
          'API-Version': this.options.apiVersion,
          ...options.headers
        },
        ...options
      });

      const result = this._handleFMSResponse(response);

      // Invalidate related cache entries
      this._invalidateCache(endpoint);

      this.logger.debug(`POST ${url} - Success`, result);
      return result;

    } catch (error) {
      this.logger.error(`POST ${url} - Error`, error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Standardized PUT request with FMSResponse handling
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<{success: boolean, data: any, message: string, errors?: Array}>}
   */
  async put(endpoint = '', data = {}, options = {}) {
    const url = this._buildUrl(endpoint);

    try {

      this.logger.debug(`PUT ${url}`, { data: this._sanitizeLogData(data), options });

      const response = await axiosInstance.put(url, data, {
        headers: {
          'API-Version': this.options.apiVersion,
          ...options.headers
        },
        ...options
      });

      const result = this._handleFMSResponse(response);

      // Invalidate related cache entries
      this._invalidateCache(endpoint);

      this.logger.debug(`PUT ${url} - Success`, result);
      return result;

    } catch (error) {
      this.logger.error(`PUT ${url} - Error`, error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Standardized DELETE request with FMSResponse handling
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<{success: boolean, data: any, message: string, errors?: Array}>}
   */
  async delete(endpoint = '', options = {}) {
    const url = this._buildUrl(endpoint);

    try {

      this.logger.debug(`DELETE ${url}`, { options });

      const response = await axiosInstance.delete(url, {
        headers: {
          'API-Version': this.options.apiVersion,
          ...options.headers
        },
        ...options
      });

      const result = this._handleFMSResponse(response);

      // Invalidate related cache entries
      this._invalidateCache(endpoint);

      this.logger.debug(`DELETE ${url} - Success`, result);
      return result;

    } catch (error) {
      this.logger.error(`DELETE ${url} - Error`, error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Upload file with progress tracking
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with file
   * @param {Function} onProgress - Progress callback
   * @param {Object} options - Request options
   * @returns {Promise<{success: boolean, data: any, message: string, errors?: Array}>}
   */
  async upload(endpoint = '', formData, onProgress = null, options = {}) {
    const url = this._buildUrl(endpoint);

    try {

      this.logger.debug(`UPLOAD ${url}`, { hasFile: formData instanceof FormData });

      const response = await axiosInstance.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'API-Version': this.options.apiVersion,
          ...options.headers
        },
        onUploadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted, progressEvent);
        } : undefined,
        ...options
      });

      const result = this._handleFMSResponse(response);

      this.logger.debug(`UPLOAD ${url} - Success`, result);
      return result;

    } catch (error) {
      this.logger.error(`UPLOAD ${url} - Error`, error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Build full URL for endpoint
   * @private
   */
  _buildUrl(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const cleanBase = this.baseEndpoint.endsWith('/') ? this.baseEndpoint.slice(0, -1) : this.baseEndpoint;

    if (cleanEndpoint) {
      return `${cleanBase}/${cleanEndpoint}`;
    }
    return cleanBase;
  }

  /**
   * Handle FMSResponse format from backend
   * @private
   */
  _handleFMSResponse(response) {
    const data = response.data;

    // Handle both FMSResponse<T> and FMSResponseMessage formats
    if (data && typeof data === 'object') {
      // New FMSResponse<T> format
      if (data.hasOwnProperty('isSuccess') || data.hasOwnProperty('IsSuccess')) {
        return {
          success: data.isSuccess || data.IsSuccess || false,
          data: data.data || data.Data || data,
          message: data.message || data.Message || '',
          errors: data.validationErrors || data.ValidationErrors || [],
          errorType: data.errorType || data.ErrorType || null
        };
      }

      // Legacy FMSResponseMessage format
      if (data.hasOwnProperty('success') || data.hasOwnProperty('Success')) {
        return {
          success: data.success || data.Success || false,
          data: data.data || data.Data || data,
          message: data.message || data.Message || '',
          errors: []
        };
      }
    }

    // Raw data response (assume success)
    return {
      success: true,
      data: data,
      message: 'Request completed successfully',
      errors: []
    };
  }

  /**
   * Generate cache key
   * @private
   */
  _getCacheKey(method, endpoint, params) {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${this.serviceName}:${method}:${endpoint}:${paramsStr}`;
  }

  /**
   * Invalidate cache entries
   * @private
   */
  _invalidateCache(endpoint) {
    if (!this.options.useCache) return;

    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(endpoint) || key.includes(this.baseEndpoint)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.logger.debug(`Invalidated ${keysToDelete.length} cache entries for ${endpoint}`);
  }

  /**
   * Sanitize sensitive data for logging
   * @private
   */
  _sanitizeLogData(data) {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

export default BaseService;