//TODO: Implement soft deletion with proper validation and future records handling

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.Services;
using FMS.Application.Services.TankStock;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand {
    public record DeleteTankVolumeHistoryCommand (
        string DeletedBy,
        int? Id = null,
        int? TankId = null,
        string? ReferenceType = null,
        int? ReferenceId = null,
        DateTime? FromDate = null,
        DateTime? ToDate = null,
        bool ValidateFutureRecords = true) : IRequest<FMSResponseMessage>;

    public class DeleteTankVolumeHistoryCommandHandler : IRequestHandler<DeleteTankVolumeHistoryCommand, FMSResponseMessage> {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteTankVolumeHistoryCommandHandler> _logger;
        private readonly IMediator _mediator;
        private readonly TankStockFutureRecordsService _futureRecordsService;
        private readonly ITankVolumeHistoryDeletionService _deletionValidationService;

        public DeleteTankVolumeHistoryCommandHandler (
            GpsdataContext context,
            ILogger<DeleteTankVolumeHistoryCommandHandler> logger,
            IMediator mediator,
            TankStockFutureRecordsService futureRecordsService,
            ITankVolumeHistoryDeletionService deletionValidationService) {
            _context = context;
            _logger = logger;
            _mediator = mediator;
            _futureRecordsService = futureRecordsService;
            _deletionValidationService = deletionValidationService;
        }

        public async Task<FMSResponseMessage> Handle (DeleteTankVolumeHistoryCommand request, CancellationToken cancellationToken) {
            try {
                // Validation
                List<string> validationErrors = new ();

                if (string.IsNullOrWhiteSpace (request.DeletedBy)) {
                    validationErrors.Add ("DeletedBy is required for soft delete operations");
                }

                if (!request.Id.HasValue &&
                    !request.TankId.HasValue &&
                    string.IsNullOrEmpty (request.ReferenceType) &&
                    !request.ReferenceId.HasValue &&
                    !request.FromDate.HasValue &&
                    !request.ToDate.HasValue) {
                    validationErrors.Add ("At least one filter criterion must be provided");
                }

                if (validationErrors.Any ()) {
                    FMSResponse response = FMSResponse.ValidationFailed (validationErrors);
                    return new FMSResponseMessage (false, response.Message);
                }

                // Build the query to find records to soft delete
                IQueryable<TankVolumeHistory> query = _context.TankVolumeHistories.AsQueryable ();

                // Apply filters
                if (request.Id.HasValue) {
                    query = query.Where (h => h.Id == request.Id.Value);
                }

                if (request.TankId.HasValue) {
                    query = query.Where (h => h.TankId == request.TankId.Value);
                }

                if (!string.IsNullOrEmpty (request.ReferenceType)) {
                    query = query.Where (h => h.ReferenceType == request.ReferenceType);
                }

                if (request.ReferenceId.HasValue) {
                    query = query.Where (h => h.ReferenceId == request.ReferenceId.Value);
                }

                if (request.FromDate.HasValue) {
                    query = query.Where (h => h.Timestamp >= request.FromDate.Value);
                }

                if (request.ToDate.HasValue) {
                    query = query.Where (h => h.Timestamp <= request.ToDate.Value);
                }

                // Get the records to soft delete
                List<TankVolumeHistory> records = await query.ToListAsync (cancellationToken);

                if (!records.Any ()) {
                    return new FMSResponseMessage (true, "No records found to delete");
                }

                // Validate future records policy if requested
                if (request.ValidateFutureRecords) {
                    foreach (TankVolumeHistory record in records) {
                        if (!record.TankId.HasValue) {
                            continue;
                        }

                        // Use the deletion validation service for comprehensive validation
                        DeletionValidationResult deletionValidation = await _deletionValidationService.ValidateDeletionAsync (
                            record.Id, cancellationToken);

                        if (!deletionValidation.IsAllowed) {
                            return new FMSResponseMessage (false,
                                $"Cannot delete record (ID: {record.Id}): {deletionValidation.Reason}. {deletionValidation.RecommendedAction}");
                        }

                        if (deletionValidation.SubsequentAdjustments > 0) {
                            _logger.LogWarning ("Deleting record {RecordId} will affect {SubsequentAdjustments} subsequent adjustments",
                                record.Id, deletionValidation.SubsequentAdjustments);
                        }

                        // Also validate with the future records service for policy compliance
                        var futureValidation = await _futureRecordsService.ValidateHistoricalEntryAsync (
                            record.TankId.Value,
                            record.Timestamp,
                            record.ChangeReason,
                            cancellationToken);

                        if (!futureValidation.IsAllowed) {
                            return new FMSResponseMessage (false,
                                $"Cannot delete record (ID: {record.Id}): {futureValidation.Message}");
                        }

                        if (futureValidation.RequiresUserConfirmation) {
                            _logger.LogWarning ("Deleting record {RecordId} with future records: {Message}",
                                record.Id, futureValidation.Message);
                        }
                    }
                }

                // Get the earliest timestamp and affected tank IDs before soft deletion
                DateTime earliestTimestamp = records.Min (r => r.Timestamp);
                List<int> affectedTankIds = records
                    .Select (r => r.TankId)
                    .Where (id => id.HasValue)
                    .Select (id => id!.Value)
                    .Distinct ()
                    .ToList ();

                // Perform soft delete
                DateTime deletionTime = DateTime.UtcNow;
                foreach (TankVolumeHistory record in records) {
                    record.IsDeleted = true;
                    record.DeletedAt = deletionTime;
                    record.DeletedBy = request.DeletedBy;
                }

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Soft deleted {Count} tank volume history records by user {DeletedBy}",
                    records.Count, request.DeletedBy);

                // Handle cascade deletion based on reference type
                await HandleCascadeDeletionAsync (records, request.DeletedBy, cancellationToken);

                // Update tank volume history for affected tanks
                foreach (int tankId in affectedTankIds) {
                    FMSResponseMessage updateResult = await _mediator.Send (
                        new UpdateTankVolumeHistoryCommand (
                            tankId,
                            earliestTimestamp),
                        cancellationToken);

                    if (!updateResult.Success) {
                        _logger.LogWarning ("Failed to update tank volume history for tank {TankId}: {Message}",
                            tankId, updateResult.Message);
                    }
                }

                return new FMSResponseMessage (true,
                    $"Successfully soft deleted {records.Count} tank volume history records");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error soft deleting tank volume history records");
                return new FMSResponseMessage (false, $"Error deleting tank volume history records: {ex.Message}");
            }
        }

        /// <summary>
        /// Handles cascade deletion of related records based on the volume change reason
        /// </summary>
        private async Task HandleCascadeDeletionAsync (
            List<TankVolumeHistory> records,
            string deletedBy,
            CancellationToken cancellationToken) {
            foreach (TankVolumeHistory record in records) {
                if (!record.ReferenceId.HasValue) continue;

                try {
                    // Handle different reference types for cascade deletion
                    switch (record.ChangeReason) {
                        case VolumeChangeReasonEnum.Adjustment:
                            await HandleStockAdjustmentDeletionAsync (record.ReferenceId.Value, deletedBy, cancellationToken);
                            break;

                        case VolumeChangeReasonEnum.Delivery:
                            await HandleDeliveryDeletionAsync (record.ReferenceId.Value, deletedBy, cancellationToken);
                            break;

                        case VolumeChangeReasonEnum.Dispensing:
                        case VolumeChangeReasonEnum.AutomatedDispensing:
                            await HandleFuelRefillDeletionAsync (record.ReferenceId.Value, deletedBy, cancellationToken);
                            break;

                        case VolumeChangeReasonEnum.TransferIn:
                        case VolumeChangeReasonEnum.TransferOut:
                            await HandleTransferDeletionAsync (record.ReferenceId.Value, deletedBy, cancellationToken);
                            break;

                        case VolumeChangeReasonEnum.OpeningStock:
                        case VolumeChangeReasonEnum.ClosingStock:
                        case VolumeChangeReasonEnum.Reconciliation:
                        case VolumeChangeReasonEnum.AutomatedReconciliation:
                            // These typically don't have related records to delete
                            _logger.LogInformation ("No cascade deletion needed for {ChangeReason} record {RecordId}",
                                record.ChangeReason, record.Id);
                            break;

                        default:
                            _logger.LogWarning ("Unknown volume change reason {ChangeReason} for record {RecordId}",
                                record.ChangeReason, record.Id);
                            break;
                    }
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error handling cascade deletion for record {RecordId} with reason {ChangeReason}",
                        record.Id, record.ChangeReason);
                }
            }
        }

        private async Task HandleStockAdjustmentDeletionAsync (int referenceId, string deletedBy, CancellationToken cancellationToken) {
            try {
                StockAdjustment? stockAdjustment = await _context.StockAdjustments
                    .Where (sa => sa.Id == referenceId && !sa.IsDeleted)
                    .FirstOrDefaultAsync (cancellationToken);

                if (stockAdjustment != null) {
                    stockAdjustment.IsDeleted = true;
                    stockAdjustment.DeletedAt = DateTime.UtcNow;
                    stockAdjustment.DeletedBy = deletedBy;

                    _logger.LogInformation ("Soft deleted stock adjustment {StockAdjustmentId} by user {DeletedBy}",
                        referenceId, deletedBy);
                } else {
                    _logger.LogWarning ("Stock adjustment {StockAdjustmentId} not found or already deleted", referenceId);
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error soft deleting stock adjustment {ReferenceId}", referenceId);
            }
        }

        private async Task HandleDeliveryDeletionAsync (int referenceId, string deletedBy, CancellationToken cancellationToken) {
            try {
                Delivery? delivery = await _context.Deliveries
                    .Where (d => d.Id == referenceId && !d.IsDeleted)
                    .FirstOrDefaultAsync (cancellationToken);

                if (delivery != null) {
                    delivery.IsDeleted = true;
                    delivery.DeletedAt = DateTime.UtcNow;
                    delivery.DeletedBy = deletedBy;

                    _logger.LogInformation ("Soft deleted delivery {DeliveryId} by user {DeletedBy}",
                        referenceId, deletedBy);
                } else {
                    _logger.LogWarning ("Delivery {DeliveryId} not found or already deleted", referenceId);
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error soft deleting delivery {ReferenceId}", referenceId);
            }
        }

        private async Task HandleFuelRefillDeletionAsync (int referenceId, string deletedBy, CancellationToken cancellationToken) {
            try {
                FuelRefill? fuelRefill = await _context.FuelRefills
                    .Where (fr => fr.Id == referenceId && !fr.IsDeleted)
                    .FirstOrDefaultAsync (cancellationToken);

                if (fuelRefill != null) {
                    fuelRefill.IsDeleted = true;
                    fuelRefill.DeletedAt = DateTime.UtcNow;
                    fuelRefill.DeletedBy = deletedBy;

                    _logger.LogInformation ("Soft deleted fuel refill {FuelRefillId} by user {DeletedBy}",
                        referenceId, deletedBy);
                } else {
                    _logger.LogWarning ("Fuel refill {FuelRefillId} not found or already deleted", referenceId);
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error soft deleting fuel refill {ReferenceId}", referenceId);
            }
        }

        private async Task HandleTransferDeletionAsync (int referenceId, string deletedBy, CancellationToken cancellationToken) {
            try {
                TankTransfer? transfer = await _context.TankTransfers
                    .Where (tt => tt.Id == referenceId && !tt.IsDeleted)
                    .FirstOrDefaultAsync (cancellationToken);

                if (transfer != null) {
                    transfer.IsDeleted = true;
                    transfer.DeletedAt = DateTime.UtcNow;
                    transfer.DeletedBy = deletedBy;

                    _logger.LogInformation ("Soft deleted tank transfer {TransferId} by user {DeletedBy}",
                        referenceId, deletedBy);
                } else {
                    _logger.LogWarning ("Tank transfer {TransferId} not found or already deleted", referenceId);
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error soft deleting tank transfer {ReferenceId}", referenceId);
            }
        }
    }
}