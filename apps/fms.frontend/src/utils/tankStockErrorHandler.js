// Utility functions for handling tank stock errors
export const TankStockErrorHandler = {
  /**
   * Parse and categorize tank stock error messages
   * @param {string} errorMessage - The error message from the API
   * @returns {Object} Parsed error information
   */
  parseError: (errorMessage) => {
    if (!errorMessage) {
      return {
        type: 'unknown',
        message: 'An unknown error occurred',
        duration: 6000,
        showRetry: true
      };
    }

    // Opening stock already exists error
    if (errorMessage.includes('opening stock already exists') ||
        errorMessage.includes('without a subsequent closing stock')) {
      return {
        type: 'opening_stock_exists',
        message: errorMessage,
        duration: 8000,
        showRetry: true,
        actionSuggestion: 'Please create a closing stock for the existing opening stock first, or choose a different date.',
        actionSuggestionDelay: 500
      };
    }

    // Validation errors
    if (errorMessage.includes('validation') ||
        errorMessage.includes('required') ||
        errorMessage.includes('invalid')) {
      return {
        type: 'validation',
        message: errorMessage,
        duration: 5000,
        showRetry: true
      };
    }

    // Network or server errors
    if (errorMessage.includes('network') ||
        errorMessage.includes('server') ||
        errorMessage.includes('timeout')) {
      return {
        type: 'network',
        message: errorMessage,
        duration: 6000,
        showRetry: true,
        actionSuggestion: 'Please check your connection and try again.'
      };
    }

    // Permission errors
    if (errorMessage.includes('permission') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('access')) {
      return {
        type: 'permission',
        message: errorMessage,
        duration: 7000,
        showRetry: false
      };
    }

    // Default error handling
    return {
      type: 'general',
      message: errorMessage,
      duration: 6000,
      showRetry: true
    };
  },

  /**
   * Show appropriate notification based on error type
   * @param {string} errorMessage - The error message
   * @param {Function} notifyFunction - The notification function to use
   */
  showErrorNotification: (errorMessage, notifyFunction) => {
    const errorInfo = TankStockErrorHandler.parseError(errorMessage);

    // Show primary error message
    notifyFunction(errorInfo.message, 'error', errorInfo.duration);

    // Show additional action suggestion if available
    if (errorInfo.actionSuggestion && errorInfo.actionSuggestionDelay) {
      setTimeout(() => {
        notifyFunction(errorInfo.actionSuggestion, 'info', errorInfo.duration - 2000);
      }, errorInfo.actionSuggestionDelay);
    }

    return errorInfo;
  },

  /**
   * Check if an error suggests a specific action
   * @param {string} errorMessage - The error message
   * @returns {Object} Action suggestion information
   */
  getActionSuggestion: (errorMessage) => {
    const errorInfo = TankStockErrorHandler.parseError(errorMessage);

    if (errorInfo.type === 'opening_stock_exists') {
      return {
        hasAction: true,
        actionType: 'create_closing_stock',
        actionText: 'Create Closing Stock',
        actionDescription: 'Create a closing stock for the existing opening stock first'
      };
    }

    return {
      hasAction: false
    };
  },

  /**
   * Extract date information from opening stock error messages
   * @param {string} errorMessage - The error message
   * @returns {Object} Date information if available
   */
  extractDateFromError: (errorMessage) => {
    if (!errorMessage) return null;

    // Try to extract date pattern YYYY-MM-DD from error message
    const dateMatch = errorMessage.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return {
        dateString: dateMatch[1],
        date: new Date(dateMatch[1])
      };
    }

    return null;
  }
};

export default TankStockErrorHandler;
