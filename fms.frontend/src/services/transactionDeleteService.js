/**
 * File: transactionDeleteService.js
 * Purpose: Wraps single and bulk tank volume history delete API calls for the frontend.
 * Dependencies: axiosInstance
 * Last Modified: 2026-03-27
 *
 * Key Functions:
 * - validateDelete(): Checks whether a single transaction can be deleted.
 * - validateBulkDelete(): Requests server-side validation for selected transaction IDs.
 * - bulkDeleteTransactions(): Executes the confirmed bulk delete request.
 */
import axiosInstance from '../api/axiosInstance';

/**
 * Service for transaction deletion operations
 */
class TransactionDeleteService {
  /**
   * Validates if a transaction can be deleted based on future records policy
   * @param {Object} params - Validation parameters
   * @param {number} params.tankId - The tank ID
   * @param {string} params.entryDate - The date of the transaction (ISO format)
   * @param {number} params.entryType - The type of entry (VolumeChangeReasonEnum numeric value)
   * @returns {Promise<Object>} Validation result with policy decision and warning messages
   */
  async validateDelete(params) {
    try {
      // Validate parameters
      if (!params.tankId || typeof params.tankId !== 'number') {
        throw new Error('Invalid tankId: must be a positive number');
      }

      if (!params.entryDate) {
        throw new Error('Invalid entryDate: must be provided');
      }

      if (typeof params.entryType !== 'number') {
        throw new Error('Invalid entryType: must be a number (VolumeChangeReasonEnum)');
      }

      // Ensure entryDate is in ISO format
      const entryDate = params.entryDate instanceof Date
        ? params.entryDate.toISOString()
        : params.entryDate;

      const requestPayload = {
        tankId: params.tankId,
        entryDate: entryDate,
        entryType: params.entryType
      };

      console.log('Sending delete validation request:', requestPayload);

      const response = await axiosInstance.post('/tankvolumehistory/validate-delete', requestPayload);

      console.log('Delete validation response:', response.data);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Error validating delete:', error);

      // Handle different error types
      if (error.response?.data) {
        return {
          success: false,
          error: error.response.data.message || error.response.data,
          details: error.response.data
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred during validation'
      };
    }
  }

  /**
   * Deletes a transaction by ID
   * @param {number} transactionId - The ID of the transaction to delete
   * @param {boolean} userConfirmed - Whether the user has confirmed the deletion
   * @param {string} deletionReason - Optional reason for deletion
   * @returns {Promise<Object>} Result of the delete operation
   */
  async deleteTransaction(transactionId, userConfirmed = false, deletionReason = '') {
    try {
      if (!transactionId || typeof transactionId !== 'number') {
        throw new Error('Invalid transactionId: must be a positive number');
      }

      console.log('Sending delete request:', { transactionId, userConfirmed, deletionReason });

      const url = `/tankvolumehistory/${transactionId}?userConfirmed=${userConfirmed}`;

      const requestBody = deletionReason ? { deletionReason } : {};

      const response = await axiosInstance.delete(url, {
        data: requestBody
      });

      console.log('Delete response:', response.data);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Error deleting transaction:', error);

      // Handle different error types
      if (error.response?.data) {
        return {
          success: false,
          error: error.response.data.message || error.response.data,
          details: error.response.data
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred during deletion'
      };
    }
  }

  async validateBulkDelete(transactionIds) {
    try {
      if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
        throw new Error('At least one transaction ID is required');
      }

      const response = await axiosInstance.post('/tankvolumehistory/bulk-validate-delete', {
        transactionIds,
        userConfirmed: false
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error validating bulk delete:', error);

      if (error.response?.data) {
        return {
          success: false,
          error: error.response.data.message || error.response.data,
          details: error.response.data.data || error.response.data
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred during bulk validation'
      };
    }
  }

  async bulkDeleteTransactions(transactionIds, userConfirmed = false) {
    try {
      if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
        throw new Error('At least one transaction ID is required');
      }

      const response = await axiosInstance.post('/tankvolumehistory/bulk-delete', {
        transactionIds,
        userConfirmed
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error performing bulk delete:', error);

      if (error.response?.data) {
        return {
          success: false,
          error: error.response.data.message || error.response.data,
          details: error.response.data.data || error.response.data
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred during bulk deletion'
      };
    }
  }

  /**
   * Volume Change Reason Enum mapping (should match backend VolumeChangeReasonEnum)
   */
  static VolumeChangeReasonEnum = {
    OpeningStock: 0,
    ClosingStock: 1,
    Delivery: 2,
    TransferIn: 3,
    TransferOut: 4,
    Adjustment: 5,
    Dispensing: 6,
    ManualRefill: 7,
    AutomatedDispensing: 8,
    Reconciliation: 9,
    AutomatedReconciliation: 10
  };

  /**
   * Converts a change reason name to its numeric enum value
   * @param {string} reasonName - The reason name (e.g., 'OpeningStock')
   * @returns {number|undefined} The numeric enum value or undefined if not found
   */
  getReasonEnumValue(reasonName) {
    return TransactionDeleteService.VolumeChangeReasonEnum[reasonName];
  }
}

// Export singleton instance
const transactionDeleteService = new TransactionDeleteService();
export default transactionDeleteService;
