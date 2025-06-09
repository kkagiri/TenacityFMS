using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand {
    /// <summary>
    /// Service to handle tank volume history integration with various operations
    /// This service should be used in fuel refill, tank stock, tank transfer, and delivery operations
    /// to ensure consistent tank volume history updates
    /// </summary>
    public class TankVolumeHistoryIntegrationService {
        private readonly IMediator _mediator;
        private readonly ILogger<TankVolumeHistoryIntegrationService> _logger;

        public TankVolumeHistoryIntegrationService (
            IMediator mediator,
            ILogger<TankVolumeHistoryIntegrationService> logger) {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Process a fuel refill change that affects tank volume
        /// </summary>
        public async Task<FMSResponseMessage> ProcessFuelRefillChangeAsync (
            int tankId,
            DateTime timestamp,
            decimal volumeChange,
            int refillId,
            ActionType actionType,
            string recordedBy,
            CancellationToken cancellationToken = default) {
            return await ProcessChangeAsync (
                tankId,
                timestamp,
                volumeChange,
                VolumeChangeReasonEnum.Dispensing,
                recordedBy,
                refillId,
                "FuelRefill",
                actionType,
                cancellationToken);
        }

        /// <summary>
        /// Process a delivery change that affects tank volume
        /// </summary>
        public async Task<FMSResponseMessage> ProcessDeliveryChangeAsync (
            int tankId,
            DateTime timestamp,
            decimal volumeChange,
            int deliveryId,
            ActionType actionType,
            string recordedBy,
            CancellationToken cancellationToken = default) {
            return await ProcessChangeAsync (
                tankId,
                timestamp,
                volumeChange,
                VolumeChangeReasonEnum.Delivery,
                recordedBy,
                deliveryId,
                "Delivery",
                actionType,
                cancellationToken);
        }

        /// <summary>
        /// Process a tank stock change
        /// </summary>
        public async Task<FMSResponseMessage> ProcessTankStockChangeAsync (
            int tankId,
            DateTime timestamp,
            decimal volumeChange,
            int stockId,
            bool isOpening,
            ActionType actionType,
            string recordedBy,
            CancellationToken cancellationToken = default) {
            var reason = isOpening ? VolumeChangeReasonEnum.OpeningStock : VolumeChangeReasonEnum.ClosingStock;

            return await ProcessChangeAsync (
                tankId,
                timestamp,
                volumeChange,
                reason,
                recordedBy,
                stockId,
                "TankStock",
                actionType,
                cancellationToken);
        }

        /// <summary>
        /// Process a tank transfer that affects source tank volume (outgoing)
        /// </summary>
        public async Task<FMSResponseMessage> ProcessTankTransferOutChangeAsync (
            int sourceTankId,
            DateTime timestamp,
            decimal volumeChange,
            int transferId,
            ActionType actionType,
            string recordedBy,
            CancellationToken cancellationToken = default) {
            // For outgoing transfers, volume change is negative
            return await ProcessChangeAsync (
                sourceTankId,
                timestamp, -Math.Abs (volumeChange),
                VolumeChangeReasonEnum.TransferOut,
                recordedBy,
                transferId,
                "TankTransfer",
                actionType,
                cancellationToken);
        }

        /// <summary>
        /// Process a tank transfer that affects destination tank volume (incoming)
        /// </summary>
        public async Task<FMSResponseMessage> ProcessTankTransferInChangeAsync (
            int destinationTankId,
            DateTime timestamp,
            decimal volumeChange,
            int transferId,
            ActionType actionType,
            string recordedBy,
            CancellationToken cancellationToken = default) {
            // For incoming transfers, volume change is positive
            return await ProcessChangeAsync (
                destinationTankId,
                timestamp,
                Math.Abs (volumeChange),
                VolumeChangeReasonEnum.TransferIn,
                recordedBy,
                transferId,
                "TankTransfer",
                actionType,
                cancellationToken);
        }

        /// <summary>
        /// Process a manual adjustment to tank volume
        /// </summary>
        public async Task<FMSResponseMessage> ProcessAdjustmentChangeAsync (
            int tankId,
            DateTime timestamp,
            decimal volumeChange,
            int adjustmentId,
            ActionType actionType,
            string recordedBy,
            CancellationToken cancellationToken = default) {
            return await ProcessChangeAsync (
                tankId,
                timestamp,
                volumeChange,
                VolumeChangeReasonEnum.Adjustment,
                recordedBy,
                adjustmentId,
                "Adjustment",
                actionType,
                cancellationToken);
        }

        /// <summary>
        /// Process a pump transaction that affects tank volume (automated dispensing)
        /// </summary>
        public async Task<FMSResponseMessage> ProcessPumpTransactionChangeAsync (
            int tankId,
            DateTime timestamp,
            decimal volumeChange,
            int transactionId,
            ActionType actionType,
            string recordedBy,
            CancellationToken cancellationToken = default) {
            // For pump transactions, volume change is negative (fuel is dispensed)
            return await ProcessChangeAsync (
                tankId,
                timestamp, -Math.Abs (volumeChange), // Ensure negative
                VolumeChangeReasonEnum.AutomatedDispensing,
                recordedBy,
                transactionId,
                "PumpTransaction",
                actionType,
                cancellationToken);
        }

        /// <summary>
        /// Reconciles a tank's current stock with the latest volume history entry
        /// This ensures the tank.CurrentStock matches the ledger history
        /// </summary>
        /// <param name="tankId">The ID of the tank to reconcile</param>
        /// <param name="recordedBy">The ID of the user performing the reconciliation</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Response message indicating success or failure</returns>
        public async Task<FMSResponseMessage> ReconcileTankCurrentStockAsync (
            int tankId,
            string recordedBy,
            CancellationToken cancellationToken = default) {
            try {
                _logger.LogInformation ("Starting tank current stock reconciliation for tank {TankId}", tankId);

                // Use UpdateTankVolumeHistoryCommand with the earliest possible date to recalculate all history
                // and update the current stock
                var command = new UpdateTankVolumeHistoryCommand (
                    tankId,
                    DateTime.MinValue, // Use earliest date to process all history
                    false, // Not historical update
                    true); // Update tank current stock

                var result = await _mediator.Send (command, cancellationToken);

                if (result.Success) {
                    _logger.LogInformation ("Successfully reconciled tank {TankId} current stock", tankId);
                    return new FMSResponseMessage (true, "Successfully reconciled tank current stock with volume history");
                } else {
                    _logger.LogWarning ("Failed to reconcile tank {TankId} current stock: {Message}", tankId, result.Message);
                    return result;
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error reconciling tank {TankId} current stock", tankId);
                return new FMSResponseMessage (false, $"Error reconciling tank current stock: {ex.Message}");
            }
        }

        /// <summary>
        /// Reconciles all tanks' current stock with their latest volume history entries
        /// </summary>
        /// <param name="recordedBy">The ID of the user performing the reconciliation</param>
        /// <param name="siteId">Optional site ID to limit reconciliation to tanks at a specific site</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Response message indicating success or failure</returns>
        public async Task<FMSResponseMessage> ReconcileAllTankCurrentStocksAsync (
            string recordedBy,
            int? siteId = null,
            CancellationToken cancellationToken = default) {
            try {
                _logger.LogInformation ("Starting reconciliation of all tanks' current stock");

                // We'll use a custom command to update all tanks at once
                var command = new ReconcileAllTanksCommand (siteId, recordedBy);
                var result = await _mediator.Send (command, cancellationToken);

                return result;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error reconciling all tanks' current stock");
                return new FMSResponseMessage (false, $"Error reconciling all tanks' current stock: {ex.Message}");
            }
        }

        /// <summary>
        /// Generic method to process any change affecting tank volume
        /// </summary>
        public async Task<FMSResponseMessage> ProcessChangeAsync (
            int tankId,
            DateTime timestamp,
            decimal volumeChange,
            VolumeChangeReasonEnum changeReason,
            string recordedBy,
            int referenceId,
            string referenceType,
            ActionType actionType,
            CancellationToken cancellationToken = default) {
            try {
                // Send the command to process the tank stock change
                var command = new ProcessTankStockChangeCommand (
                    tankId,
                    timestamp,
                    volumeChange,
                    changeReason,
                    recordedBy,
                    referenceId,
                    referenceType,
                    actionType);

                return await _mediator.Send (command, cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing tank volume change for tank {TankId}", tankId);
                return new FMSResponseMessage (false, $"Error processing tank volume change: {ex.Message}");
            }
        }
    }
}