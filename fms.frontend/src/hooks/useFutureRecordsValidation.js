/**
 * File: useFutureRecordsValidation.js
 * Purpose: Centralize tank stock future-record validation state and submission gating for historical and back-timed entries.
 * Dependencies: React hooks, tankStockFutureRecordsService
 * Last Modified: 2026-03-13
 *
 * Key Functions:
 * - validateHistoricalEntry(): Checks whether a selected tank entry timestamp conflicts with later ledger records
 * - confirmProceed(): Marks a warning as acknowledged when policy allows the user to continue
 * - resetValidation(): Clears warning and error state when the user changes key form inputs
 */
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
    const entryDateObj = new Date(entryDate);
    const now = new Date();

    if (Number.isNaN(entryDateObj.getTime())) {
      setValidationState({
        isValidating: false,
        validationResult: null,
        error: 'Invalid entry date selected',
        userConfirmed: false,
        showWarning: true
      });

      return {
        canProceed: false,
        needsValidation: false,
        error: 'Invalid entry date selected'
      };
    }

    // Skip validation only when the selected timestamp is now or in the future.
    // Any earlier timestamp can affect later ledger rows, even within the same day.
    if (entryDateObj >= now) {
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
    const { validationResult, userConfirmed, error, isValidating } = validationState;

    // Don't allow submission while validating
    if (isValidating) return false;

    // If there's an error, don't allow submission
    if (error) return false;

    // If no validation result, allow submission (for current date entries)
    if (!validationResult) return true;

    // If entry is blocked by policy, don't allow submission
    if (validationResult.config.blockSubmission) return false;

    // If user confirmation is required and not yet confirmed, don't allow submission
    if (validationResult.config.requiresConfirmation && !userConfirmed) return false;

    // For all other cases (including INFO messages), allow submission
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
