/**
 * File: tankStockFutureRecordsService.js
 * Purpose: Provide mobile access to tank stock future-record validation and warning formatting.
 * Dependencies: ApiService
 * Last Modified: 2026-03-13
 *
 * Key Functions:
 * - validateHistoricalEntry(): Checks whether an entry timestamp would affect later tank ledger rows
 * - formatValidationResult(): Maps backend warning types to mobile-friendly UI configuration
 * - getWarningTypeConfig(): Returns severity and confirmation requirements for each warning type
 */
import ApiService from './apiService';

export class TankStockFutureRecordsService {
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
        AUTOMATED_RECONCILIATION: 'AutomatedReconciliation',
    };

    static VolumeChangeReasonNumbers = {
        OpeningStock: 0,
        ClosingStock: 1,
        Delivery: 2,
        TransferIn: 3,
        TransferOut: 4,
        Adjustment: 5,
        Dispensing: 6,
        AutomatedDispensing: 7,
        Reconciliation: 8,
        AutomatedReconciliation: 9,
    };

    getEnumNumericValue(entryType) {
        return TankStockFutureRecordsService.VolumeChangeReasonNumbers[entryType];
    }

    isValidEntryType(entryType) {
        return Object.values(TankStockFutureRecordsService.VolumeChangeReasons).includes(entryType);
    }

    async validateHistoricalEntry(params) {
        try {
            if (!params.tankId || typeof params.tankId !== 'number') {
                throw new Error('Invalid tankId: must be a positive number');
            }

            if (!params.entryDate) {
                throw new Error('Invalid entryDate: must be provided');
            }

            if (!params.entryType || !this.isValidEntryType(params.entryType)) {
                throw new Error(
                    `Invalid entryType: must be one of ${Object.values(TankStockFutureRecordsService.VolumeChangeReasons).join(', ')}`
                );
            }

            const entryDate = params.entryDate instanceof Date
                ? params.entryDate.toISOString()
                : params.entryDate;

            const entryTypeNumeric = this.getEnumNumericValue(params.entryType);
            let requestPayload = {
                tankId: params.tankId,
                entryDate,
                entryType: entryTypeNumeric !== undefined ? entryTypeNumeric : params.entryType,
            };

            let response;
            try {
                response = await ApiService.api.post('/v1/TankStock/validate-historical-entry', requestPayload);
            } catch (firstError) {
                requestPayload.entryType = params.entryType;

                try {
                    response = await ApiService.api.post('/v1/TankStock/validate-historical-entry', requestPayload);
                } catch (secondError) {
                    response = await ApiService.api.post('/v1/TankStock/validate-historical-entry', { request: requestPayload });
                }
            }

            if (response.data?.success && response.data?.data) {
                return response.data.data;
            }

            if (response.data?.data) {
                return response.data.data;
            }

            return response.data;
        } catch (error) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }

            if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat();
                throw new Error(errorMessages.join('; '));
            }

            if (error.message) {
                throw error;
            }

            throw new Error('Failed to validate historical entry');
        }
    }

    getWarningTypeConfig(warningType) {
        const configs = {
            NONE: {
                showWarning: false,
                tone: 'success',
            },
            BLOCKED: {
                showWarning: true,
                tone: 'error',
                blockSubmission: true,
            },
            WARN_RECONCILE: {
                showWarning: true,
                tone: 'warning',
                requiresConfirmation: true,
                recommendedAction: 'Manual reconciliation recommended after entry',
            },
            WARN_RECALCULATE: {
                showWarning: true,
                tone: 'warning',
                requiresConfirmation: true,
                recommendedAction: 'Automatic recalculation will be performed',
            },
            INFO_RECALCULATE: {
                showWarning: true,
                tone: 'info',
                requiresConfirmation: false,
                recommendedAction: 'Automatic recalculation enabled',
            },
            HISTORICAL_CUTOFF: {
                showWarning: true,
                tone: 'error',
                blockSubmission: true,
            },
            ERROR: {
                showWarning: true,
                tone: 'error',
                blockSubmission: true,
            },
        };

        return configs[warningType] || configs.ERROR;
    }

    formatValidationResult(validationResult) {
        const config = this.getWarningTypeConfig(validationResult.warningType);

        return {
            ...validationResult,
            config,
            formattedMessage: this.formatMessage(validationResult),
            canProceed: validationResult.isAllowed && !config.blockSubmission,
            needsUserConfirmation: config.requiresConfirmation || validationResult.requiresUserConfirmation,
        };
    }

    formatMessage(validationResult) {
        let message = validationResult.message;

        if (validationResult.futureRecordsCount > 0) {
            message += ` (${validationResult.futureRecordsCount} future record${validationResult.futureRecordsCount > 1 ? 's' : ''} affected)`;
        }

        return message;
    }
}

export default new TankStockFutureRecordsService();
export const VolumeChangeReasons = TankStockFutureRecordsService.VolumeChangeReasons;