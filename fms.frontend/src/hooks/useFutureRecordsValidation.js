import { useState, useCallback } from 'react';
import tankStockFutureRecordsService from '../services/tankStockFutureRecordsService';

/**
 * Custom hook for handling tank stock future records validation
 */
export const useFutureRecordsValidation = () => {
  const [validationState, setValidationState] = useState({
    isValidating: false,
    validationResult: null,
    error: null,
    userConfirmed: false,
    showWarning: false
  });

  /**
   * Validates a historical entry against future records policy
   */
  const validateHistoricalEntry = useCallback(async (tankId, entryDate, entryType) => {
    // Skip validation for current or future dates
    const entryDateObj = new Date(entryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (entryDateObj >= today) {
      setValidationState({
        isValidating: false,
        validationResult: null,
        error: null,
        userConfirmed: false,
        showWarning: false
      });
      return { canProceed: true, needsValidation: false };
    }

    setValidationState(prev => ({
      ...prev,
      isValidating: true,
      error: null
    }));

    try {
      const result = await tankStockFutureRecordsService.validateHistoricalEntry({
        tankId,
        entryDate: entryDate,
        entryType
      });

      console.log('Validation result received:', result);

      const formattedResult = tankStockFutureRecordsService.formatValidationResult(result);

      setValidationState({
        isValidating: false,
        validationResult: formattedResult,
        error: null,
        userConfirmed: false,
        showWarning: formattedResult.config.showWarning
      });

      return {
        canProceed: formattedResult.canProceed,
        needsValidation: true,
        needsUserConfirmation: formattedResult.needsUserConfirmation,
        validationResult: formattedResult
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to validate historical entry';

      setValidationState({
        isValidating: false,
        validationResult: null,
        error: errorMessage,
        userConfirmed: false,
        showWarning: true
      });

      return {
        canProceed: false,
        needsValidation: true,
        error: errorMessage
      };
    }
  }, []);

  /**
   * Handles user confirmation for proceeding with the entry
   */
  const confirmProceed = useCallback(() => {
    setValidationState(prev => ({
      ...prev,
      userConfirmed: true,
      showWarning: false
    }));
  }, []);

  /**
   * Handles user cancellation
   */
  const cancelProceed = useCallback(() => {
    setValidationState(prev => ({
      ...prev,
      userConfirmed: false,
      showWarning: false
    }));
  }, []);

  /**
   * Resets the validation state
   */
  const resetValidation = useCallback(() => {
    setValidationState({
      isValidating: false,
      validationResult: null,
      error: null,
      userConfirmed: false,
      showWarning: false
    });
  }, []);

  /**
   * Checks if the form can be submitted based on validation state
   */
  const canSubmit = useCallback(() => {
    const { validationResult, userConfirmed, error } = validationState;

    // If there's an error, don't allow submission
    if (error) return false;

    // If no validation result, allow submission (for current date entries)
    if (!validationResult) return true;

    // If entry is blocked, don't allow submission
    if (validationResult.config.blockSubmission) return false;

    // If user confirmation is required and not yet confirmed, don't allow submission
    if (validationResult.needsUserConfirmation && !userConfirmed) return false;

    // Otherwise, allow submission
    return true;
  }, [validationState]);

  return {
    // State
    ...validationState,
    canSubmit: canSubmit(),

    // Actions
    validateHistoricalEntry,
    confirmProceed,
    cancelProceed,
    resetValidation
  };
};
