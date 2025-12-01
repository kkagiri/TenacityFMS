/**
 * File: GetTransactionDetailsQuery.cs
 * Purpose: Query to get transaction details including reference data from source tables
 * Dependencies: MediatR, Entity Framework Core
 * Last Modified: 2025-12-01
 *
 * Key Functions:
 * - GetTransactionDetailsQuery: Gets full details of a TankVolumeHistory entry
 * - Includes reference data from FuelRefill, Delivery, TankStock, TankTransfer, etc.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;

using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.TankVolumeHistory.Queries
{
    /// <summary>
    /// Query to get transaction details including reference data
    /// </summary>
    public record GetTransactionDetailsQuery(int TransactionId) : IRequest<FMSResponseMessage>;

    /// <summary>
    /// Handler for GetTransactionDetailsQuery
    /// </summary>
    public class GetTransactionDetailsQueryHandler : IRequestHandler<GetTransactionDetailsQuery, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetTransactionDetailsQueryHandler> _logger;

        public GetTransactionDetailsQueryHandler(
            GpsdataContext context,
            ILogger<GetTransactionDetailsQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage> Handle(GetTransactionDetailsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Get the TankVolumeHistory record
                var transaction = await _context.TankVolumeHistories
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == request.TransactionId && (t.IsDeleted != true), cancellationToken);

                if (transaction == null)
                {
                    return new FMSResponseMessage(false, $"Transaction with ID {request.TransactionId} not found");
                }

                // Build the response based on change reason
                object? referenceData = null;

                switch (transaction.ChangeReason)
                {
                    case VolumeChangeReasonEnum.Dispensing:
                        referenceData = await GetFuelRefillDetailsAsync(transaction.ReferenceId, cancellationToken);
                        break;

                    case VolumeChangeReasonEnum.Delivery:
                        referenceData = await GetDeliveryDetailsAsync(transaction.ReferenceId, cancellationToken);
                        break;

                    case VolumeChangeReasonEnum.OpeningStock:
                    case VolumeChangeReasonEnum.ClosingStock:
                        referenceData = await GetTankStockDetailsAsync(transaction.ReferenceId, cancellationToken);
                        break;

                    case VolumeChangeReasonEnum.TransferIn:
                    case VolumeChangeReasonEnum.TransferOut:
                        referenceData = await GetTankTransferDetailsAsync(transaction.ReferenceId, cancellationToken);
                        break;

                    case VolumeChangeReasonEnum.Adjustment:
                        referenceData = await GetAdjustmentDetailsAsync(transaction.ReferenceId, cancellationToken);
                        break;

                    default:
                        // For automated types, just return the transaction itself
                        referenceData = null;
                        break;
                }

                var result = new TransactionDetailsDto
                {
                    Id = transaction.Id,
                    TankId = transaction.TankId ?? 0,
                    Timestamp = transaction.Timestamp,
                    VolumeChange = transaction.VolumeChange ?? 0,
                    NewVolume = transaction.NewVolume ?? 0,
                    ChangeReason = transaction.ChangeReason,
                    ChangeReasonName = transaction.ChangeReason.ToString(),
                    ReferenceId = transaction.ReferenceId,
                    ReferenceType = transaction.ReferenceType,
                    RecordedBy = transaction.RecordedBy,
                    CreatedOn = transaction.CreatedOn,
                    ReferenceData = referenceData
                };

                return new FMSResponseMessage<TransactionDetailsDto>(true, "Transaction details retrieved successfully", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting transaction details for ID {TransactionId}", request.TransactionId);
                return new FMSResponseMessage(false, $"Error getting transaction details: {ex.Message}");
            }
        }

        private async Task<object?> GetFuelRefillDetailsAsync(int? referenceId, CancellationToken cancellationToken)
        {
            if (!referenceId.HasValue) return null;

            var fuelRefill = await _context.FuelRefills
                .AsNoTracking()
                .Include(f => f.Vehicle)
                .Include(f => f.Tank)
                .Include(f => f.Site)
                .FirstOrDefaultAsync(f => f.Id == referenceId.Value, cancellationToken);

            if (fuelRefill == null) return null;

            return new
            {
                fuelRefill.Id,
                fuelRefill.VehicleId,
                VehicleName = fuelRefill.Vehicle?.HyoungNo ?? fuelRefill.Vehicle?.NumberPlate,
                fuelRefill.TankId,
                TankName = fuelRefill.Tank?.Name,
                fuelRefill.SiteId,
                SiteName = fuelRefill.Site?.Name,
                fuelRefill.ManualFuelrefillAmount,
                fuelRefill.PreviousMeterReading,
                fuelRefill.CurrentMeterReading,
                fuelRefill.DriverId,
                Date = fuelRefill.Date,
                fuelRefill.Comment,
                fuelRefill.FuelBy,
                fuelRefill.TagId,
                fuelRefill.PumpTranscationId
            };
        }

        private async Task<object?> GetDeliveryDetailsAsync(int? referenceId, CancellationToken cancellationToken)
        {
            if (!referenceId.HasValue) return null;

            var delivery = await _context.Deliveries
                .AsNoTracking()
                .Include(d => d.Tank)
                    .ThenInclude(t => t.Site)
                .Include(d => d.Supplier)
                .FirstOrDefaultAsync(d => d.Id == referenceId.Value, cancellationToken);

            if (delivery == null) return null;

            return new
            {
                delivery.Id,
                delivery.TankId,
                TankName = delivery.Tank?.Name,
                SiteId = delivery.Tank?.SiteId,
                SiteName = delivery.Tank?.Site?.Name,
                DeliveryAmount = delivery.ManualDeliveryAmount,
                delivery.DeliveryDate,
                DeliveryNumber = delivery.Lponumber,
                SupplierName = delivery.Supplier?.Name,
                delivery.SupplierId,
                delivery.StockBeforeDelivery,
                delivery.StockAfterDelivery,
                delivery.RecordedBy
            };
        }

        private async Task<object?> GetTankStockDetailsAsync(int? referenceId, CancellationToken cancellationToken)
        {
            if (!referenceId.HasValue) return null;

            var tankStock = await _context.Tankstocks
                .AsNoTracking()
                .Include(t => t.Tank)
                .Include(t => t.Site)
                .FirstOrDefaultAsync(t => t.EntryId == referenceId.Value, cancellationToken);

            if (tankStock == null) return null;

            return new
            {
                tankStock.EntryId,
                tankStock.TankId,
                TankName = tankStock.Tank?.Name,
                tankStock.SiteId,
                SiteName = tankStock.Site?.Name,
                tankStock.EntryDate,
                tankStock.ManualOpeningLevel,
                tankStock.ManualClosingLevel,
                tankStock.OpeningMeter,
                tankStock.ClosingMeter,
                tankStock.RecordedBy,
                EntryType = tankStock.EntryType.ToString()
            };
        }

        private async Task<object?> GetTankTransferDetailsAsync(int? referenceId, CancellationToken cancellationToken)
        {
            if (!referenceId.HasValue) return null;

            var transfer = await _context.TankTransfers
                .AsNoTracking()
                .Include(t => t.SourceTank)
                .Include(t => t.DestinationTank)
                .FirstOrDefaultAsync(t => t.Id == referenceId.Value, cancellationToken);

            if (transfer == null) return null;

            return new
            {
                transfer.Id,
                transfer.SourceTankId,
                SourceTankName = transfer.SourceTank?.Name,
                transfer.DestinationTankId,
                DestinationTankName = transfer.DestinationTank?.Name,
                TransferAmount = transfer.Amount,
                transfer.TransferDate,
                RecordedBy = transfer.RecordedBy
            };
        }

        private async Task<object?> GetAdjustmentDetailsAsync(int? referenceId, CancellationToken cancellationToken)
        {
            if (!referenceId.HasValue) return null;

            var adjustment = await _context.StockAdjustments
                .AsNoTracking()
                .Include(a => a.Tank)
                .Include(a => a.Site)
                .FirstOrDefaultAsync(a => a.Id == referenceId.Value, cancellationToken);

            if (adjustment == null) return null;

            return new
            {
                adjustment.Id,
                adjustment.TankId,
                TankName = adjustment.Tank?.Name,
                adjustment.SiteId,
                SiteName = adjustment.Site?.Name,
                adjustment.VolumeChange,
                adjustment.PreviousVolume,
                adjustment.NewVolume,
                adjustment.AdjustmentDate,
                adjustment.Reason,
                adjustment.ReasonCode,
                adjustment.AdjustmentType,
                CreatedBy = adjustment.CreatedBy,
                adjustment.Notes
            };
        }
    }

    /// <summary>
    /// DTO for transaction details response
    /// </summary>
    public class TransactionDetailsDto
    {
        public int Id { get; set; }
        public int TankId { get; set; }
        public DateTime Timestamp { get; set; }
        public decimal VolumeChange { get; set; }
        public decimal NewVolume { get; set; }
        public VolumeChangeReasonEnum ChangeReason { get; set; }
        public string ChangeReasonName { get; set; } = string.Empty;
        public int? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
        public string? RecordedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public object? ReferenceData { get; set; }
    }
}
