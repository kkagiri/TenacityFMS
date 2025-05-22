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
        /// Generic method to process any change affecting tank volume
        /// </summary>
        private async Task<FMSResponseMessage> ProcessChangeAsync (
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