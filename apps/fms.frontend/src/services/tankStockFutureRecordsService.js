import axiosInstance from '../api/axiosInstance';

/**
 * Service for tank stock future records validation and policy management
 */
export class TankStockFutureRecordsService {
  /**
   * Valid volume change reason enum values matching backend VolumeChangeReasonEnum
   */
  static VolumeChangeReasons = {
    OPENING_STOCK: 'OpeningStock',
    CLOSING_STOCK: 'ClosingStock',
    DELIVERY: 'Delivery',
    TRANSFER_IN: 'TransferIn',
    TRANSFER_OUT: 'TransferOut',
    ADJUSTMENT: 'Adjustment',
    DISPENSING: 'Dispensing',
    AUTOMATED_DISPENSING: 'AutomatedDispensing',
    RECONCILIATION: 'Reconciliation',
    AUTOMATED_RECONCILIATION: 'AutomatedReconciliation'
  };

  /**
   * Enum numeric values matching backend VolumeChangeReasonEnum
   */
  static VolumeChangeReasonNumbers = {
    'OpeningStock': 0,
    'ClosingStock': 1,
    'Delivery': 2,
    'TransferIn': 3,
    'TransferOut': 4,
    'Adjustment': 5,
    'Dispensing': 6,
    'AutomatedDispensing': 7,
    'Reconciliation': 8,
    'AutomatedReconciliation': 9
  };

  /**
   * Converts string enum value to numeric value
   * @param {string} entryType - The string enum value
   * @returns {number} The numeric enum value
   */
  getEnumNumericValue(entryType) {
    return TankStockFutureRecordsService.VolumeChangeReasonNumbers[entryType];
  }

  /**
   * Validates that the entry type is a valid enum value
   * @param {string} entryType - The entry type to validate
   * @returns {boolean} True if valid, false otherwise
   */
  isValidEntryType(entryType) {
    return Object.values(TankStockFutureRecordsService.VolumeChangeReasons).includes(entryType);
  }
  /**
   * Validates if a historical tank stock entry can be processed based on future records policy
   * @param {Object} params - Validation parameters
   * @param {number} params.tankId - The tank ID
   * @param {string} params.entryDate - The date of the historical entry (ISO format)
   * @param {string} params.entryType - The type of entry (OpeningStock, ClosingStock, TransferOut, etc.)
   * @returns {Promise<Object>} Validation result with policy decision and warning messages
   */
  async validateHistoricalEntry(params) {
    try {
      // Validate parameters
      if (!params.tankId || typeof params.tankId !== 'number') {
        throw new Error('Invalid tankId: must be a positive number');
      }

      if (!params.entryDate) {
        throw new Error('Invalid entryDate: must be provided');
      }

      if (!params.entryType || !this.isValidEntryType(params.entryType)) {
        throw new Error(`Invalid entryType: must be one of ${Object.values(TankStockFutureRecordsService.VolumeChangeReasons).join(', ')}`);
      }

      // Ensure entryDate is in ISO format
      const entryDate = params.entryDate instanceof Date
        ? params.entryDate.toISOString()
        : params.entryDate;

      // Try sending the enum as numeric value first (as .NET often expects)
      const entryTypeNumeric = this.getEnumNumericValue(params.entryType);

      let requestPayload = {
        tankId: params.tankId,
        entryDate: entryDate,
        entryType: entryTypeNumeric !== undefined ? entryTypeNumeric : params.entryType
      };

      console.log('Sending validation request (attempt 1 - numeric enum):', requestPayload);

      let response;
      try {
        response = await axiosInstance.post('/tankstock/validate-historical-entry', requestPayload);
      } catch (firstError) {
        console.log('First attempt failed, trying with string enum value:', firstError.response?.data);

        // If numeric failed, try with string value
        requestPayload.entryType = params.entryType;
        console.log('Sending validation request (attempt 2 - string enum):', requestPayload);

        try {
          response = await axiosInstance.post('/tankstock/validate-historical-entry', requestPayload);
        } catch (secondError) {
          console.log('Second attempt failed, trying with request wrapper:', secondError.response?.data);

          // If that failed too, try wrapping in a request object (in case API expects that)
          const wrappedPayload = { request: requestPayload };
          console.log('Sending validation request (attempt 3 - wrapped):', wrappedPayload);
          response = await axiosInstance.post('/tankstock/validate-historical-entry', wrappedPayload);
        }
      }

      // The API returns an FMSResponse wrapper, so we need to extract the data
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else if (response.data && response.data.data) {
        return response.data.data;
      } else {
        return response.data;
      }
    } catch (error) {
      console.error('Error validating historical entry:', error);
      console.error('Request params:', params);

      // Extract error message from API response if available
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        // Handle validation errors from ModelState
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat();
        throw new Error(errorMessages.join('; '));
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Failed to validate historical entry');
      }
    }
  }

  /**
   * Gets the current tank stock future records policy configuration
   * @returns {Promise<Object>} Current policy configuration
   */
  async getFutureRecordsPolicy() {
    try {
      const response = await axiosInstance.get('/tankstock/future-records-policy');
      return response.data;
    } catch (error) {
      console.error('Error getting future records policy:', error);
      throw error;
    }
  }

  /**
   * Updates the tank stock future records policy configuration
   * @param {Object} policy - Policy configuration
   * @param {string} policy.futureRecordsPolicy - Values: "BLOCK", "WARN_RECONCILE", "WARN_RECALCULATE", "ALLOW_RECALCULATE"
   * @param {boolean} policy.showDetailedWarnings - Whether to show detailed warnings
   * @param {number} policy.maxHistoricalDays - Maximum days allowed for historical entries
   * @returns {Promise<Object>} Update result
   */
  async updateFutureRecordsPolicy(policy) {
    try {
      const response = await axiosInstance.put('/tankstock/future-records-policy', policy);
      return response.data;
    } catch (error) {
      console.error('Error updating future records policy:', error);
      throw error;
    }
  }

  /**
   * Gets warning type configuration for UI rendering
   * @param {string} warningType - The warning type from validation result
   * @returns {Object} UI configuration for the warning type
   */
  getWarningTypeConfig(warningType) {
    const configs = {
      'NONE': {
        showWarning: false,
        icon: 'fas fa-check-circle',
        iconClass: 'tw-text-green-500',
        alertType: 'success'
      },
      'BLOCKED': {
        showWarning: true,
        icon: 'fas fa-ban',
        iconClass: 'tw-text-red-500',
        alertType: 'error',
        blockSubmission: true
      },
      'WARN_RECONCILE': {
        showWarning: true,
        icon: 'fas fa-exclamation-triangle',
        iconClass: 'tw-text-orange-500',
        alertType: 'warning',
        requiresConfirmation: true,
        recommendedAction: 'Manual reconciliation recommended after entry'
      },
      'WARN_RECALCULATE': {
        showWarning: true,
        icon: 'fas fa-exclamation-triangle',
        iconClass: 'tw-text-yellow-500',
        alertType: 'warning',
        requiresConfirmation: true,
        recommendedAction: 'Automatic recalculation will be performed'
      },
      'INFO_RECALCULATE': {
        showWarning: true,
        icon: 'fas fa-info-circle',
        iconClass: 'tw-text-blue-500',
        alertType: 'info',
        requiresConfirmation: false,
        recommendedAction: 'Automatic recalculation enabled'
      },
      'HISTORICAL_CUTOFF': {
        showWarning: true,
        icon: 'fas fa-calendar-times',
        iconClass: 'tw-text-red-500',
        alertType: 'error',
        blockSubmission: true
      },
      'ERROR': {
        showWarning: true,
        icon: 'fas fa-times-circle',
        iconClass: 'tw-text-red-500',
        alertType: 'error',
        blockSubmission: true
      }
    };

    return configs[warningType] || configs['ERROR'];
  }

  /**
   * Formats validation result for display in UI
   * @param {Object} validationResult - The validation result from API
   * @returns {Object} Formatted result for UI consumption
   */
  formatValidationResult(validationResult) {
    const config = this.getWarningTypeConfig(validationResult.warningType);

    return {
      ...validationResult,
      config,
      formattedMessage: this.formatMessage(validationResult),
      canProceed: validationResult.isAllowed && !config.blockSubmission,
      needsUserConfirmation: config.requiresConfirmation || validationResult.requiresUserConfirmation
    };
  }

  /**
   * Formats the validation message for better UI display
   * @param {Object} validationResult - The validation result
   * @returns {string} Formatted message
   */
  formatMessage(validationResult) {
    let message = validationResult.message;

    if (validationResult.futureRecordsCount > 0) {
      message += ` (${validationResult.futureRecordsCount} future record${validationResult.futureRecordsCount > 1 ? 's' : ''} affected)`;
    }

    return message;
  }
}

// Export singleton instance
export default new TankStockFutureRecordsService();

// Export enum values for use in other components
export const VolumeChangeReasons = TankStockFutureRecordsService.VolumeChangeReasons;
