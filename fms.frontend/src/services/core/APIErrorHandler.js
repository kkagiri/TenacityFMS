/**
 * APIErrorHandler - Standardized Error Processing
 *
 * Provides consistent error handling across all services:
 * - HTTP status code handling
 * - FMSResponse error format processing
 * - User-friendly error messages
 * - Error logging and monitoring
 * - Retry logic for transient failures
 *
 * @version 1.0.0
 * @since API v1
 */

export class APIErrorHandler {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  /**
   * Handle API errors with standardized response format
   * @param {Error} error - The error object from axios or other sources
   * @returns {{success: boolean, data: null, message: string, errors: Array, errorType?: string}}
   */
  handle(error) {
    // Network or timeout errors
    if (error.code === 'ECONNABORTED') {
      return this._createErrorResponse(
        'Request timeout - please try again',
        ['The request took too long to complete. Please check your connection and try again.'],
        'TIMEOUT'
      );
    }

    if (error.message === 'Network Error') {
      return this._createErrorResponse(
        'Network connection error',
        ['Unable to connect to the server. Please check your internet connection.'],
        'NETWORK'
      );
    }

    // HTTP response errors
    if (error.response) {
      return this._handleHttpError(error.response);
    }

    // Request setup errors
    if (error.request) {
      return this._createErrorResponse(
        'No response from server',
        ['The server did not respond. Please try again later.'],
        'NO_RESPONSE'
      );
    }

    // Other errors (code errors, etc.)
    return this._createErrorResponse(
      'An unexpected error occurred',
      [error.message || 'Please try again or contact support if the problem persists.'],
      'UNKNOWN'
    );
  }

  /**
   * Handle HTTP response errors
   * @private
   */
  _handleHttpError(response) {
    const { status, statusText, data } = response;

    // Try to extract error information from response data
    let message = this._extractErrorMessage(data);
    let errors = this._extractErrorList(data);
    let errorType = this._extractErrorType(data);

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        return this._createErrorResponse(
          message || 'Invalid request data',
          errors.length > 0 ? errors : ['Please check your input and try again.'],
          errorType || 'VALIDATION'
        );

      case 401:
        // Handle authentication errors
        this._handleAuthenticationError();
        return this._createErrorResponse(
          'Authentication required',
          ['Please log in to continue.'],
          'AUTHENTICATION'
        );

      case 403:
        return this._createErrorResponse(
          'Access denied',
          ['You do not have permission to perform this action.'],
          'AUTHORIZATION'
        );

      case 404:
        return this._createErrorResponse(
          message || 'Resource not found',
          ['The requested resource could not be found.'],
          'NOT_FOUND'
        );

      case 409:
        return this._createErrorResponse(
          message || 'Conflict with existing data',
          errors.length > 0 ? errors : ['This operation conflicts with existing data.'],
          'CONFLICT'
        );

      case 422:
        return this._createErrorResponse(
          message || 'Validation failed',
          errors.length > 0 ? errors : ['Please check your input data.'],
          'VALIDATION'
        );

      case 429:
        return this._createErrorResponse(
          'Too many requests',
          ['Please wait a moment before trying again.'],
          'RATE_LIMIT'
        );

      case 500:
        return this._createErrorResponse(
          'Internal server error',
          ['A server error occurred. Please try again later.'],
          'SERVER_ERROR'
        );

      case 502:
        return this._createErrorResponse(
          'Service unavailable',
          ['The service is temporarily unavailable. Please try again later.'],
          'SERVICE_UNAVAILABLE'
        );

      case 503:
        return this._createErrorResponse(
          'Service maintenance',
          ['The service is currently under maintenance. Please try again later.'],
          'MAINTENANCE'
        );

      default:
        return this._createErrorResponse(
          message || `HTTP ${status} - ${statusText}`,
          errors.length > 0 ? errors : [`Server returned status ${status}. Please try again.`],
          'HTTP_ERROR'
        );
    }
  }

  /**
   * Extract error message from response data
   * @private
   */
  _extractErrorMessage(data) {
    if (!data) return null;

    // Try various message fields
    const messageFields = [
      'message', 'Message',
      'error', 'Error',
      'errorMessage', 'ErrorMessage',
      'title', 'Title'
    ];

    for (const field of messageFields) {
      if (data[field] && typeof data[field] === 'string') {
        return data[field];
      }
    }

    // Handle string response
    if (typeof data === 'string') {
      return data;
    }

    return null;
  }

  /**
   * Extract error list from response data
   * @private
   */
  _extractErrorList(data) {
    if (!data) return [];

    // Try various error array fields
    const errorFields = [
      'errors', 'Errors',
      'validationErrors', 'ValidationErrors',
      'errorList', 'ErrorList',
      'messages', 'Messages'
    ];

    for (const field of errorFields) {
      if (Array.isArray(data[field])) {
        return data[field].filter(error => error && typeof error === 'string');
      }
    }

    // Handle ModelState errors (ASP.NET format)
    if (data.errors && typeof data.errors === 'object') {
      const modelStateErrors = [];
      for (const [field, fieldErrors] of Object.entries(data.errors)) {
        if (Array.isArray(fieldErrors)) {
          fieldErrors.forEach(error => {
            modelStateErrors.push(`${field}: ${error}`);
          });
        }
      }
      return modelStateErrors;
    }

    return [];
  }

  /**
   * Extract error type from response data
   * @private
   */
  _extractErrorType(data) {
    if (!data) return null;

    const typeFields = [
      'errorType', 'ErrorType',
      'type', 'Type',
      'category', 'Category'
    ];

    for (const field of typeFields) {
      if (data[field] && typeof data[field] === 'string') {
        return data[field];
      }
    }

    return null;
  }

  /**
   * Create standardized error response
   * @private
   */
  _createErrorResponse(message, errors = [], errorType = null) {
    // Log the error for monitoring
    console.error(`[${this.serviceName}] API Error:`, {
      message,
      errors,
      errorType,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      data: null,
      message,
      errors: Array.isArray(errors) ? errors : [errors],
      errorType
    };
  }

  /**
   * Handle authentication errors
   * @private
   */
  _handleAuthenticationError() {
    // Clear expired token
    localStorage.removeItem('token');

    // Dispatch authentication failed event
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('authenticationFailed', {
        detail: { serviceName: this.serviceName }
      }));
    }

    // Could also redirect to login page
    // window.location.href = '/login';
  }

  /**
   * Check if error is retryable
   * @param {Object} errorResponse - The error response from handle()
   * @returns {boolean}
   */
  isRetryable(errorResponse) {
    const retryableTypes = [
      'TIMEOUT',
      'NETWORK',
      'NO_RESPONSE',
      'RATE_LIMIT',
      'SERVER_ERROR',
      'SERVICE_UNAVAILABLE',
      'MAINTENANCE'
    ];

    return retryableTypes.includes(errorResponse.errorType);
  }

  /**
   * Get suggested retry delay based on error type
   * @param {Object} errorResponse - The error response from handle()
   * @returns {number} - Delay in milliseconds
   */
  getRetryDelay(errorResponse) {
    switch (errorResponse.errorType) {
      case 'RATE_LIMIT':
        return 5000; // 5 seconds
      case 'SERVER_ERROR':
      case 'SERVICE_UNAVAILABLE':
        return 2000; // 2 seconds
      case 'TIMEOUT':
      case 'NETWORK':
        return 1000; // 1 second
      default:
        return 1000; // 1 second default
    }
  }
}

export default APIErrorHandler;