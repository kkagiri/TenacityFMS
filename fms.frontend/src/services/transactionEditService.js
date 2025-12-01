/**
 * File: transactionEditService.js
 * Purpose: Service for transaction edit/update operations
 * Dependencies: axiosInstance
 * Last Modified: 2025-12-01
 *
 * Key Functions:
 * - getTransactionDetails: Fetches full transaction details including reference data
 * - updateTransaction: Updates a transaction and triggers volume history recalculation
 * - validateUpdate: Validates if a transaction can be updated
 */
import axiosInstance from '../api/axiosInstance';

/**
 * Volume Change Reason Enum mapping (should match backend VolumeChangeReasonEnum)
 */
export const VolumeChangeReasonEnum = {
  OpeningStock: 0,
  ClosingStock: 1,
  Delivery: 2,
  TransferIn: 3,
  TransferOut: 4,
  Adjustment: 5,
  Dispensing: 6,
  AutomatedDispensing: 7,
  Reconciliation: 8,
  AutomatedReconciliation: 9
};

/**
 * Maps VolumeChangeReasonEnum to reference table names
 */
export const ReferenceTypeMap = {
  [VolumeChangeReasonEnum.OpeningStock]: 'TankStock',
  [VolumeChangeReasonEnum.ClosingStock]: 'TankStock',
  [VolumeChangeReasonEnum.Delivery]: 'Delivery',
  [VolumeChangeReasonEnum.TransferIn]: 'TankTransfer',
  [VolumeChangeReasonEnum.TransferOut]: 'TankTransfer',
  [VolumeChangeReasonEnum.Adjustment]: 'Adjustment',
  [VolumeChangeReasonEnum.Dispensing]: 'FuelRefill',
  [VolumeChangeReasonEnum.AutomatedDispensing]: 'PumpTransaction',
  [VolumeChangeReasonEnum.Reconciliation]: 'Reconciliation',
  [VolumeChangeReasonEnum.AutomatedReconciliation]: 'AutomatedReconciliation'
};

/**
 * Determines if a transaction type is editable
 * @param {number} changeReason - The VolumeChangeReasonEnum value
 * @returns {boolean} Whether the transaction can be edited
 */
export const isTransactionEditable = (changeReason) => {
  // These types can be edited
  const editableTypes = [
    VolumeChangeReasonEnum.OpeningStock,
    VolumeChangeReasonEnum.ClosingStock,
    VolumeChangeReasonEnum.Delivery,
    VolumeChangeReasonEnum.TransferIn,
    VolumeChangeReasonEnum.TransferOut,
    VolumeChangeReasonEnum.Adjustment,
    VolumeChangeReasonEnum.Dispensing
  ];
  return editableTypes.includes(changeReason);
};

/**
 * Service for transaction edit operations
 */
class TransactionEditService {
  /**
   * Gets full transaction details including reference data
   * @param {number} transactionId - The TankVolumeHistory ID
   * @returns {Promise<Object>} Full transaction details
   */
  async getTransactionDetails(transactionId) {
    try {
      if (!transactionId || typeof transactionId !== 'number') {
        throw new Error('Invalid transactionId: must be a positive number');
      }

      console.log('Fetching transaction details for ID:', transactionId);

      const response = await axiosInstance.get(`/tankvolumehistory/${transactionId}/details`);

      console.log('Transaction details response:', response.data);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Error fetching transaction details:', error);

      if (error.response?.data) {
        return {
          success: false,
          error: error.response.data.message || error.response.data,
          details: error.response.data
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred while fetching transaction details'
      };
    }
  }

  /**
   * Validates if a transaction can be updated
   * @param {Object} params - Validation parameters
   * @param {number} params.transactionId - The TankVolumeHistory ID
   * @param {number} params.tankId - The tank ID
   * @param {string} params.timestamp - The transaction timestamp
   * @param {number} params.changeReason - The VolumeChangeReasonEnum value
   * @returns {Promise<Object>} Validation result
   */
  async validateUpdate(params) {
    try {
      const { transactionId, tankId, timestamp, changeReason } = params;

      if (!transactionId) {
        throw new Error('Invalid transactionId: must be provided');
      }

      // First check if the type is editable
      if (!isTransactionEditable(changeReason)) {
        return {
          success: true,
          data: {
            isAllowed: false,
            message: `Transactions of type "${this.getReasonName(changeReason)}" cannot be edited.`,
            requiresUserConfirmation: false
          }
        };
      }

      console.log('Validating update for transaction:', params);

      const response = await axiosInstance.post('/tankvolumehistory/validate-update', {
        transactionId,
        tankId,
        timestamp,
        changeReason
      });

      console.log('Update validation response:', response.data);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Error validating update:', error);

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
   * Updates a transaction and triggers volume history recalculation
   * @param {Object} updateData - The update data
   * @param {number} updateData.transactionId - The TankVolumeHistory ID
   * @param {number} updateData.volumeChange - The new volume change value
   * @param {string} updateData.timestamp - The new timestamp (optional)
   * @param {boolean} updateData.recalculateHistory - Whether to recalculate volume history
   * @param {string} updateData.updatedBy - User ID who made the update
   * @param {string} updateData.updateReason - Reason for the update
   * @returns {Promise<Object>} Result of the update operation
   */
  async updateTransaction(updateData) {
    try {
      const { transactionId, volumeChange, recalculateHistory = true, updateReason } = updateData;

      if (!transactionId) {
        throw new Error('Invalid transactionId: must be provided');
      }

      if (!updateReason) {
        throw new Error('Update reason is required');
      }

      console.log('Updating transaction:', updateData);

      const response = await axiosInstance.put(`/tankvolumehistory/${transactionId}`, {
        volumeChange,
        recalculateHistory,
        updateReason
      });

      console.log('Update response:', response.data);

      return {
        success: response.data?.success !== false,
        data: response.data,
        message: response.data?.message || 'Transaction updated successfully'
      };

    } catch (error) {
      console.error('Error updating transaction:', error);

      if (error.response?.data) {
        return {
          success: false,
          error: error.response.data.message || error.response.data,
          details: error.response.data
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred during update'
      };
    }
  }

  /**
   * Updates a transaction by reference (updates the source record and recalculates)
   * @param {Object} updateData - The update data
   * @param {number} updateData.transactionId - The TankVolumeHistory ID
   * @param {number} updateData.referenceId - The reference record ID
   * @param {string} updateData.referenceType - The reference type (FuelRefill, Delivery, etc.)
   * @param {Object} updateData.referenceData - The updated reference record data
   * @param {boolean} updateData.recalculateHistory - Whether to recalculate volume history
   * @param {string} updateData.updatedBy - User ID who made the update
   * @param {string} updateData.updateReason - Reason for the update
   * @returns {Promise<Object>} Result of the update operation
   */
  async updateTransactionByReference(updateData) {
    try {
      const {
        transactionId,
        referenceId,
        referenceType,
        referenceData,
        recalculateHistory = true,
        updatedBy,
        updateReason
      } = updateData;

      if (!transactionId || !referenceId || !referenceType) {
        throw new Error('transactionId, referenceId, and referenceType are required');
      }

      console.log('Updating transaction by reference:', updateData);

      const response = await axiosInstance.put(`/tankvolumehistory/${transactionId}/reference`, {
        referenceId,
        referenceType,
        referenceData,
        recalculateHistory,
        updatedBy,
        updateReason
      });

      console.log('Update by reference response:', response.data);

      return {
        success: response.data?.success !== false,
        data: response.data,
        message: response.data?.message || 'Transaction updated successfully'
      };

    } catch (error) {
      console.error('Error updating transaction by reference:', error);

      if (error.response?.data) {
        return {
          success: false,
          error: error.response.data.message || error.response.data,
          details: error.response.data
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred during update'
      };
    }
  }

  /**
   * Triggers recalculation of volume history for a tank from a specific date
   * @param {number} tankId - The tank ID
   * @param {string} fromDate - The date to start recalculation from
   * @returns {Promise<Object>} Result of the recalculation
   */
  async recalculateVolumeHistory(tankId, fromDate) {
    try {
      if (!tankId) {
        throw new Error('tankId is required');
      }

      console.log('Triggering volume history recalculation:', { tankId, fromDate });

      const response = await axiosInstance.post('/tankvolumehistory/recalculate', {
        tankId,
        fromDate: fromDate || new Date().toISOString()
      });

      console.log('Recalculation response:', response.data);

      return {
        success: response.data?.success !== false,
        data: response.data,
        message: response.data?.message || 'Volume history recalculated successfully'
      };

    } catch (error) {
      console.error('Error recalculating volume history:', error);

      if (error.response?.data) {
        return {
          success: false,
          error: error.response.data.message || error.response.data,
          details: error.response.data
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred during recalculation'
      };
    }
  }

  /**
   * Gets the human-readable name for a change reason
   * @param {number} changeReason - The VolumeChangeReasonEnum value
   * @returns {string} The human-readable name
   */
  getReasonName(changeReason) {
    const names = {
      [VolumeChangeReasonEnum.OpeningStock]: 'Opening Stock',
      [VolumeChangeReasonEnum.ClosingStock]: 'Closing Stock',
      [VolumeChangeReasonEnum.Delivery]: 'Delivery',
      [VolumeChangeReasonEnum.TransferIn]: 'Transfer In',
      [VolumeChangeReasonEnum.TransferOut]: 'Transfer Out',
      [VolumeChangeReasonEnum.Adjustment]: 'Adjustment',
      [VolumeChangeReasonEnum.Dispensing]: 'Dispensing',
      [VolumeChangeReasonEnum.AutomatedDispensing]: 'Automated Dispensing',
      [VolumeChangeReasonEnum.Reconciliation]: 'Reconciliation',
      [VolumeChangeReasonEnum.AutomatedReconciliation]: 'Automated Reconciliation'
    };
    return names[changeReason] || 'Unknown';
  }

  /**
   * Gets the reference type for a change reason
   * @param {number} changeReason - The VolumeChangeReasonEnum value
   * @returns {string} The reference type
   */
  getReferenceType(changeReason) {
    return ReferenceTypeMap[changeReason] || 'Unknown';
  }
}

// Export singleton instance
const transactionEditService = new TransactionEditService();
export default transactionEditService;
