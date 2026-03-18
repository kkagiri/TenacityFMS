/**
 * File: useFutureRecordsValidation.js
 * Purpose: Manage mobile validation state for tank entries that can affect later volume history rows.
 * Dependencies: React hooks, tankStockFutureRecordsService
 * Last Modified: 2026-03-13
 *
 * Key Functions:
 * - validateHistoricalEntry(): Triggers backend validation for the selected tank timestamp
 * - confirmProceed(): Records user acknowledgement for warning states that permit continuation
 * - resetValidation(): Clears validation state when tank or datetime inputs change
 */
import { useCallback, useState } from 'react';
import tankStockFutureRecordsService from '../services/tankStockFutureRecordsService';

export const useFutureRecordsValidation = () => {
    const [validationState, setValidationState] = useState({
        isValidating: false,
        validationResult: null,
        error: null,
        userConfirmed: false,
        showWarning: false,
    });

    const validateHistoricalEntry = useCallback(async (tankId, entryDate, entryType) => {
        const entryDateObj = new Date(entryDate);
        const now = new Date();

        if (Number.isNaN(entryDateObj.getTime())) {
            setValidationState({
                isValidating: false,
                validationResult: null,
                error: 'Invalid entry date selected',
                userConfirmed: false,
                showWarning: true,
            });

            return {
                canProceed: false,
                needsValidation: false,
                error: 'Invalid entry date selected',
            };
        }

        if (entryDateObj >= now) {
            setValidationState({
                isValidating: false,
                validationResult: null,
                error: null,
                userConfirmed: false,
                showWarning: false,
            });
            return { canProceed: true, needsValidation: false };
        }

        setValidationState((prev) => ({
            ...prev,
            isValidating: true,
            error: null,
        }));

        try {
            const result = await tankStockFutureRecordsService.validateHistoricalEntry({
                tankId,
                entryDate,
                entryType,
            });

            const formattedResult = tankStockFutureRecordsService.formatValidationResult(result);

            setValidationState({
                isValidating: false,
                validationResult: formattedResult,
                error: null,
                userConfirmed: false,
                showWarning: formattedResult.config.showWarning,
            });

            return {
                canProceed: formattedResult.canProceed,
                needsValidation: true,
                needsUserConfirmation: formattedResult.needsUserConfirmation,
                validationResult: formattedResult,
            };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to validate historical entry';

            setValidationState({
                isValidating: false,
                validationResult: null,
                error: errorMessage,
                userConfirmed: false,
                showWarning: true,
            });

            return {
                canProceed: false,
                needsValidation: true,
                error: errorMessage,
            };
        }
    }, []);

    const confirmProceed = useCallback(() => {
        setValidationState((prev) => ({
            ...prev,
            userConfirmed: true,
            showWarning: false,
        }));
    }, []);

    const cancelProceed = useCallback(() => {
        setValidationState((prev) => ({
            ...prev,
            userConfirmed: false,
            showWarning: false,
        }));
    }, []);

    const resetValidation = useCallback(() => {
        setValidationState({
            isValidating: false,
            validationResult: null,
            error: null,
            userConfirmed: false,
            showWarning: false,
        });
    }, []);

    const canSubmit = useCallback(() => {
        const { validationResult, userConfirmed, error, isValidating } = validationState;

        if (isValidating) return false;
        if (error) return false;
        if (!validationResult) return true;
        if (validationResult.config.blockSubmission) return false;
        if (validationResult.config.requiresConfirmation && !userConfirmed) return false;
        return true;
    }, [validationState]);

    return {
        ...validationState,
        canSubmit: canSubmit(),
        validateHistoricalEntry,
        confirmProceed,
        cancelProceed,
        resetValidation,
    };
};

export default useFutureRecordsValidation;