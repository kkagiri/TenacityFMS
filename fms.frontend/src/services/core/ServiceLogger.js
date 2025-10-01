/**
 * ServiceLogger Class
 *
 * Provides standardized logging for all services with context awareness
 * and appropriate log levels for development and production environments.
 */

export class ServiceLogger {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Log debug messages (development only)
   * @param {string} message - Log message
   * @param {*} data - Additional data to log
   */
  debug(message, data = null) {
    if (this.isDevelopment) {
      console.log(`[${this.serviceName}] DEBUG: ${message}`, data || '');
    }
  }

  /**
   * Log info messages
   * @param {string} message - Log message
   * @param {*} data - Additional data to log
   */
  info(message, data = null) {
    console.info(`[${this.serviceName}] INFO: ${message}`, data || '');
  }

  /**
   * Log warning messages
   * @param {string} message - Log message
   * @param {*} data - Additional data to log
   */
  warn(message, data = null) {
    console.warn(`[${this.serviceName}] WARN: ${message}`, data || '');
  }

  /**
   * Log error messages
   * @param {string} message - Log message
   * @param {*} data - Additional data to log
   */
  error(message, data = null) {
    console.error(`[${this.serviceName}] ERROR: ${message}`, data || '');
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {*} metadata - Additional metadata
   */
  performance(operation, duration, metadata = null) {
    if (this.isDevelopment) {
      console.log(`[${this.serviceName}] PERF: ${operation} took ${duration}ms`, metadata || '');
    }
  }

  /**
   * Log API requests with sanitized data
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {*} requestData - Request data (will be sanitized)
   * @param {*} responseData - Response data
   */
  apiRequest(method, url, requestData = null, responseData = null) {
    if (this.isDevelopment) {
      console.group(`[${this.serviceName}] API: ${method} ${url}`);

      if (requestData) {
        console.log('Request:', this._sanitizeData(requestData));
      }

      if (responseData) {
        console.log('Response:', responseData);
      }

      console.groupEnd();
    }
  }

  /**
   * Sanitize sensitive data for logging
   * @private
   */
  _sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential', 'authorization'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}

export default ServiceLogger;