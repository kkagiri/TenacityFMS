using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
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
        private readonly GpsdataContext _context;

        public TankVolumeHistoryIntegrationService (
            IMediator mediator,
            ILogger<TankVolumeHistoryIntegrationService> logger,
            GpsdataContext context) {
            _mediator = mediator;
            _logger = logger;
            _context = context;
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
            decimal? newPhysicalStockValue = null,
            string? physicalStockSource = null,
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
                newPhysicalStockValue, // Pass physical stock value for fuel refills
                physicalStockSource, // Pass physical stock source for fuel refills
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
            decimal? newPhysicalStockValue = null,
            string? physicalStockSource = null,
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
                newPhysicalStockValue, // Pass physical stock value for deliveries
                physicalStockSource, // Pass physical stock source for deliveries
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
            decimal? newPhysicalStockValue = null, // Add physical stock value parameter
            string? physicalStockSource = null, // Add physical stock source parameter
            CancellationToken cancellationToken = default) {
            var reason = isOpening ? VolumeChangeReasonEnum.OpeningStock : VolumeChangeReasonEnum.ClosingStock;
            var referenceType = isOpening ? "OpeningStock" : "ClosingStock"; //Cursor - Use distinct reference types

            return await ProcessChangeAsync (
                tankId,
                timestamp,
                volumeChange,
                reason,
                recordedBy,
                stockId,
                referenceType,
                actionType,
                newPhysicalStockValue, // Pass physical stock value
                physicalStockSource, // Pass physical stock source
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
            decimal? newPhysicalStockValue = null,
            string? physicalStockSource = null,
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
                newPhysicalStockValue, // Pass physical stock value for transfers
                physicalStockSource, // Pass physical stock source for transfers
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
            decimal? newPhysicalStockValue = null,
            string? physicalStockSource = null,
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
                newPhysicalStockValue, // Pass physical stock value for transfers
                physicalStockSource, // Pass physical stock source for transfers
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
                null, // No physical stock value for adjustments
                null, // No physical stock source for adjustments
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
                null, // No physical stock value for pump transactions
                null, // No physical stock source for pump transactions
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

                //Cursor - Modified to use direct reconciliation logic instead of UpdateTankVolumeHistoryCommand
                // Get the tank
                var tank = await _context.Tanks.FirstOrDefaultAsync (t => t.Id == tankId, cancellationToken);
                if (tank == null) {
                    return new FMSResponseMessage (false, $"Tank with ID {tankId} not found");
                }

                // Get the latest volume history for this tank
                var latestRecord = await _context.TankVolumeHistories
                    .Where (h => h.TankId == tankId)
                    .OrderByDescending (h => h.Timestamp)
                    .FirstOrDefaultAsync (cancellationToken);

                if (latestRecord == null || !latestRecord.NewVolume.HasValue) {
                    return new FMSResponseMessage (false, $"No volume history found for tank {tankId}");
                }

                var oldStock = tank.CurrentStock ?? 0;
                var newStock = latestRecord.NewVolume.Value;

                // Only create reconciliation record if there's a difference
                if (oldStock != newStock) {
                    // Update tank's current stock
                    tank.CurrentStock = newStock;
                    tank.LastStockUpdate = DateTime.UtcNow;

                    // Create TankVolumeHistory record for reconciliation
                    // Use AutomatedReconciliation if called by automated system
                    var changeReason = recordedBy == "SYSTEM_AUTO_RECONCILIATION" ?
                        VolumeChangeReasonEnum.AutomatedReconciliation :
                        VolumeChangeReasonEnum.Reconciliation;

                    var reconciliationRecord = new TankVolumeHistory {
                        TankId = tankId,
                        Timestamp = DateTime.UtcNow,
                        VolumeChange = newStock - oldStock, // Difference between new and old stock
                        NewVolume = newStock,
                        ChangeReason = changeReason,
                        RecordedBy = recordedBy,
                        ReferenceId = null, // No specific reference for reconciliation
                        ReferenceType = changeReason == VolumeChangeReasonEnum.AutomatedReconciliation ? "AutomatedReconciliation" : "Reconciliation",
                        CreatedOn = DateTime.UtcNow
                    };

                    _context.TankVolumeHistories.Add (reconciliationRecord);
                    await _context.SaveChangesAsync (cancellationToken);

                    _logger.LogInformation ("Successfully reconciled tank {TankId} current stock. Old: {OldStock}, New: {NewStock}, Difference: {Difference}",
                        tankId, oldStock, newStock, newStock - oldStock);

                    return new FMSResponseMessage (true, $"Successfully reconciled tank current stock. Adjusted by {newStock - oldStock:F2}L");
                } else {
                    _logger.LogInformation ("Tank {TankId} current stock already matches volume history: {Stock}", tankId, oldStock);
                    return new FMSResponseMessage (true, "Tank current stock already matches volume history - no reconciliation needed");
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
        // public async Task<FMSResponseMessage> ReconcileAllTankCurrentStocksAsync (
        //     string recordedBy,
        //     int? siteId = null,
        //     CancellationToken cancellationToken = default) {
        //     try {
        //         _logger.LogInformation ("Starting reconciliation of all tanks' current stock");

        //         // We'll use a custom command to update all tanks at once
        //         var command = new ReconcileAllTanksCommand (siteId, recordedBy);
        //         var result = await _mediator.Send (command, cancellationToken);

        //         return result;
        //     } catch (Exception ex) {
        //         _logger.LogError (ex, "Error reconciling all tanks' current stock");
        //         return new FMSResponseMessage (false, $"Error reconciling all tanks' current stock: {ex.Message}");
        //     }
        // }

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
            decimal? newPhysicalStockValue = null, // Add physical stock value parameter
            string? physicalStockSource = null, // Add physical stock source parameter
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
                    actionType,
                    newPhysicalStockValue, // Pass physical stock value
                    physicalStockSource); // Pass physical stock source

                return await _mediator.Send (command, cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing tank volume change for tank {TankId}", tankId);
                return new FMSResponseMessage (false, $"Error processing tank volume change: {ex.Message}");
            }
        }
    }
}