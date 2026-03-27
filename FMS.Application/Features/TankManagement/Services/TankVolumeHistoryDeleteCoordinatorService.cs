/**
 * File: TankVolumeHistoryDeleteCoordinatorService.cs
 * Purpose: Coordinates single and bulk tank volume history deletion with atomic execution.
 * Dependencies: GpsdataContext, MediatR, TankStockFutureRecordsService, deletion DTOs.
 * Last Modified: 2026-03-27
 *
 * Key Functions:
 * - DeleteByFilterAsync(): Reuses the bulk-delete pipeline for legacy single/filter delete requests.
 * - ValidateBulkDeleteAsync(): Builds a full impact assessment before the delete is attempted.
 * - DeleteBulkAsync(): Executes an all-or-nothing delete and reference cleanup transaction.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.TankVolumeHistory.DTOs;
using FMS.Application.Services.TankStock;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TankTransferEntity = FMS.Domain.Entities.TankTransfer;
using TankVolumeHistoryEntity = FMS.Domain.Entities.Features.TankStockManagement.TankVolumeHistory;

namespace FMS.Application.Features.TankManagement.Services
{
    public interface ITankVolumeHistoryDeleteCoordinatorService
    {
        Task<FMSResponseMessage> DeleteByFilterAsync(DeleteTankVolumeHistoryCommand request, CancellationToken cancellationToken = default);
        Task<FMSResponse<BulkTankVolumeHistoryDeleteResultDto>> ValidateBulkDeleteAsync(IReadOnlyCollection<int> transactionIds, bool userConfirmed, CancellationToken cancellationToken = default);
        Task<FMSResponse<BulkTankVolumeHistoryDeleteResultDto>> DeleteBulkAsync(IReadOnlyCollection<int> transactionIds, string deletedBy, bool userConfirmed, CancellationToken cancellationToken = default);
    }

    public class TankVolumeHistoryDeleteCoordinatorService : ITankVolumeHistoryDeleteCoordinatorService
    {
        private static readonly VolumeChangeReasonEnum[] TransferReasons =
        {
            VolumeChangeReasonEnum.TransferIn,
            VolumeChangeReasonEnum.TransferOut,
        };

        private readonly GpsdataContext _context;
        private readonly ILogger<TankVolumeHistoryDeleteCoordinatorService> _logger;
        private readonly IMediator _mediator;
        private readonly TankStockFutureRecordsService _futureRecordsService;
        private readonly ITankVolumeHistoryDeletionService _deletionValidationService;

        public TankVolumeHistoryDeleteCoordinatorService(
            GpsdataContext context,
            ILogger<TankVolumeHistoryDeleteCoordinatorService> logger,
            IMediator mediator,
            TankStockFutureRecordsService futureRecordsService,
            ITankVolumeHistoryDeletionService deletionValidationService)
        {
            _context = context;
            _logger = logger;
            _mediator = mediator;
            _futureRecordsService = futureRecordsService;
            _deletionValidationService = deletionValidationService;
        }

        public async Task<FMSResponseMessage> DeleteByFilterAsync(DeleteTankVolumeHistoryCommand request, CancellationToken cancellationToken = default)
        {
            var validationErrors = ValidateDeleteRequest(request);
            if (validationErrors.Any())
            {
                var response = FMSResponse.ValidationFailed(validationErrors);
                return new FMSResponseMessage(false, response.Message);
            }

            var selectedRecords = await LoadRecordsByFilterAsync(request, asNoTracking: true, cancellationToken);
            if (!selectedRecords.Any())
            {
                return new FMSResponseMessage(true, "No records found to delete");
            }

            var selectedIds = selectedRecords.Select(record => record.Id).Distinct().ToList();
            var deleteResponse = await DeleteBulkAsync(selectedIds, request.DeletedBy, userConfirmed: !request.ValidateFutureRecords, cancellationToken);
            if (!deleteResponse.IsSuccess)
            {
                return new FMSResponseMessage(false, deleteResponse.Message);
            }

            return new FMSResponseMessage(true, deleteResponse.Data.SummaryMessage);
        }

        public async Task<FMSResponse<BulkTankVolumeHistoryDeleteResultDto>> ValidateBulkDeleteAsync(
            IReadOnlyCollection<int> transactionIds,
            bool userConfirmed,
            CancellationToken cancellationToken = default)
        {
            return await BuildValidationResponseAsync(transactionIds, userConfirmed, cancellationToken);
        }

        public async Task<FMSResponse<BulkTankVolumeHistoryDeleteResultDto>> DeleteBulkAsync(
            IReadOnlyCollection<int> transactionIds,
            string deletedBy,
            bool userConfirmed,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(deletedBy))
            {
                return FMSResponse<BulkTankVolumeHistoryDeleteResultDto>.ValidationFailed(
                    new List<string> { "DeletedBy is required for soft delete operations" });
            }

            var validationResponse = await BuildValidationResponseAsync(transactionIds, userConfirmed, cancellationToken);
            if (!validationResponse.IsSuccess)
            {
                return validationResponse;
            }

            var candidateIds = validationResponse.Data.DeletedTransactionIds;
            var executionResult = validationResponse.Data;

            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

                var candidateRecords = await LoadActiveRecordsByIdsAsync(candidateIds, asNoTracking: false, cancellationToken);
                var deletionTime = DateTime.UtcNow;
                var deleteSet = candidateRecords.Select(record => record.Id).ToHashSet();
                var impact = new DeleteImpactAccumulator();
                var earliestPerTank = new Dictionary<int, DateTime>();

                foreach (var record in candidateRecords)
                {
                    MarkHistoryDeleted(record, deletedBy, deletionTime, earliestPerTank);
                }

                foreach (var record in candidateRecords)
                {
                    await ApplyReferenceImpactAsync(record, deleteSet, deletedBy, deletionTime, impact, applyChanges: true, cancellationToken);
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                executionResult.DeletedTransactionCount = candidateRecords.Count;
                executionResult.DeletedReferenceCount = impact.DeletedReferenceCount;
                executionResult.UpdatedReferenceCount = impact.UpdatedReferenceCount;
                executionResult.PreservedReferenceCount = impact.PreservedReferenceCount;
                executionResult.PreservedPumpTransactionCount = impact.PreservedPumpTransactionCount;
                executionResult.PreservedPtsTransferCount = impact.PreservedPtsTransferCount;
                executionResult.AffectedTankIds = earliestPerTank.Keys.OrderBy(id => id).ToList();

                foreach (var affectedTank in earliestPerTank.OrderBy(item => item.Key))
                {
                    var updateResult = await _mediator.Send(
                        new UpdateTankVolumeHistoryCommand(affectedTank.Key, affectedTank.Value),
                        cancellationToken);

                    if (!updateResult.Success)
                    {
                        var warning = $"Failed to recalculate tank {affectedTank.Key}: {updateResult.Message}";
                        executionResult.RecalculationWarnings.Add(warning);
                        _logger.LogWarning("{Warning}", warning);
                    }
                }
            });

            executionResult.SummaryMessage = BuildSuccessMessage(executionResult);
            _logger.LogInformation(
                "Soft deleted {DeletedCount} tank volume history records ({SelectedCount} selected) by user {DeletedBy}",
                executionResult.DeletedTransactionCount,
                executionResult.SelectedCount,
                deletedBy);

            return FMSResponse<BulkTankVolumeHistoryDeleteResultDto>.Success(executionResult, executionResult.SummaryMessage);
        }

        private async Task<FMSResponse<BulkTankVolumeHistoryDeleteResultDto>> BuildValidationResponseAsync(
            IReadOnlyCollection<int> transactionIds,
            bool userConfirmed,
            CancellationToken cancellationToken)
        {
            var normalizedIds = transactionIds
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            if (!normalizedIds.Any())
            {
                return FMSResponse<BulkTankVolumeHistoryDeleteResultDto>.ValidationFailed(
                    new List<string> { "At least one transaction ID must be provided" });
            }

            var selectedRecords = await LoadActiveRecordsByIdsAsync(normalizedIds, asNoTracking: true, cancellationToken);
            var missingIds = normalizedIds.Except(selectedRecords.Select(record => record.Id)).ToList();
            var candidateRecords = await ExpandTransferLinkedRecordsAsync(selectedRecords, asNoTracking: true, cancellationToken);
            var evaluation = await EvaluateDeletionAsync(normalizedIds, missingIds, candidateRecords, userConfirmed, cancellationToken);

            if (evaluation.BlockedCount > 0)
            {
                var summaryErrors = new List<string> { evaluation.SummaryMessage };
                return FMSResponse<BulkTankVolumeHistoryDeleteResultDto>.ValidationFailedWithData(summaryErrors, evaluation);
            }

            if (evaluation.RequiresUserConfirmation && !userConfirmed)
            {
                var summaryErrors = new List<string> { evaluation.SummaryMessage };
                return FMSResponse<BulkTankVolumeHistoryDeleteResultDto>.ValidationFailedWithData(summaryErrors, evaluation);
            }

            return FMSResponse<BulkTankVolumeHistoryDeleteResultDto>.Success(evaluation, evaluation.SummaryMessage);
        }

        private async Task<BulkTankVolumeHistoryDeleteResultDto> EvaluateDeletionAsync(
            IReadOnlyCollection<int> selectedIds,
            IReadOnlyCollection<int> missingIds,
            IReadOnlyCollection<TankVolumeHistoryEntity> candidateRecords,
            bool userConfirmed,
            CancellationToken cancellationToken)
        {
            var result = new BulkTankVolumeHistoryDeleteResultDto
            {
                SelectedCount = selectedIds.Count,
                TotalTransactionsToDelete = candidateRecords.Count,
                DeletedTransactionIds = candidateRecords.Select(record => record.Id).OrderBy(id => id).ToList(),
                AffectedTankIds = candidateRecords
                    .Where(record => record.TankId.HasValue)
                    .Select(record => record.TankId!.Value)
                    .Distinct()
                    .OrderBy(id => id)
                    .ToList(),
            };

            foreach (var missingId in missingIds)
            {
                result.BlockedItems.Add(new BulkTankVolumeHistoryDeleteItemDto
                {
                    TransactionId = missingId,
                    Message = "Selected transaction was not found or is already deleted",
                    RecommendedAction = "Refresh the grid and retry the selection",
                });
            }

            foreach (var record in candidateRecords)
            {
                var hardValidation = await _deletionValidationService.ValidateDeletionAsync(record.Id, cancellationToken);
                if (!hardValidation.IsAllowed)
                {
                    result.BlockedItems.Add(ToDeleteItem(record, hardValidation.Reason, hardValidation.RecommendedAction));
                    continue;
                }

                if (!record.TankId.HasValue)
                {
                    continue;
                }

                var futureValidation = await _futureRecordsService.ValidateHistoricalEntryAsync(
                    record.TankId.Value,
                    record.Timestamp,
                    record.ChangeReason,
                    cancellationToken);

                if (!futureValidation.IsAllowed)
                {
                    result.BlockedItems.Add(ToDeleteItem(
                        record,
                        futureValidation.Message,
                        futureValidation.DetailedWarning ?? "Resolve future-record policy conflicts before deleting"));
                    continue;
                }

                if (futureValidation.RequiresUserConfirmation && !userConfirmed)
                {
                    result.WarningItems.Add(ToDeleteItem(
                        record,
                        futureValidation.Message,
                        futureValidation.DetailedWarning ?? "Confirm the delete to proceed with recalculation of future records"));
                }
            }

            var impact = new DeleteImpactAccumulator();
            var candidateIds = candidateRecords.Select(record => record.Id).ToHashSet();

            foreach (var record in candidateRecords)
            {
                await ApplyReferenceImpactAsync(record, candidateIds, deletedBy: string.Empty, deletionTime: null, impact, applyChanges: false, cancellationToken);
            }

            result.DeletedReferenceCount = impact.DeletedReferenceCount;
            result.UpdatedReferenceCount = impact.UpdatedReferenceCount;
            result.PreservedReferenceCount = impact.PreservedReferenceCount;
            result.PreservedPumpTransactionCount = impact.PreservedPumpTransactionCount;
            result.PreservedPtsTransferCount = impact.PreservedPtsTransferCount;
            result.BlockedCount = result.BlockedItems.Count;
            result.WarningCount = result.WarningItems.Count;
            result.RequiresUserConfirmation = result.WarningCount > 0;
            result.CanDelete = result.BlockedCount == 0 && (!result.RequiresUserConfirmation || userConfirmed);
            result.SummaryMessage = BuildValidationMessage(result, userConfirmed);

            return result;
        }

        private List<string> ValidateDeleteRequest(DeleteTankVolumeHistoryCommand request)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(request.DeletedBy))
            {
                errors.Add("DeletedBy is required for soft delete operations");
            }

            if (!request.Id.HasValue &&
                !request.TankId.HasValue &&
                string.IsNullOrWhiteSpace(request.ReferenceType) &&
                !request.ReferenceId.HasValue &&
                !request.FromDate.HasValue &&
                !request.ToDate.HasValue)
            {
                errors.Add("At least one filter criterion must be provided");
            }

            return errors;
        }

        private async Task<List<TankVolumeHistoryEntity>> LoadRecordsByFilterAsync(
            DeleteTankVolumeHistoryCommand request,
            bool asNoTracking,
            CancellationToken cancellationToken)
        {
            IQueryable<TankVolumeHistoryEntity> query = _context.TankVolumeHistories
                .Where(history => history.IsDeleted != true);

            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }

            if (request.Id.HasValue)
            {
                query = query.Where(history => history.Id == request.Id.Value);
            }

            if (request.TankId.HasValue)
            {
                query = query.Where(history => history.TankId == request.TankId.Value);
            }

            if (!string.IsNullOrWhiteSpace(request.ReferenceType))
            {
                query = query.Where(history => history.ReferenceType == request.ReferenceType);
            }

            if (request.ReferenceId.HasValue)
            {
                query = query.Where(history => history.ReferenceId == request.ReferenceId.Value);
            }

            if (request.FromDate.HasValue)
            {
                query = query.Where(history => history.Timestamp >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                query = query.Where(history => history.Timestamp <= request.ToDate.Value);
            }

            return await query
                .OrderBy(history => history.Timestamp)
                .ThenBy(history => history.Id)
                .ToListAsync(cancellationToken);
        }

        private async Task<List<TankVolumeHistoryEntity>> LoadActiveRecordsByIdsAsync(
            IReadOnlyCollection<int> transactionIds,
            bool asNoTracking,
            CancellationToken cancellationToken)
        {
            IQueryable<TankVolumeHistoryEntity> query = _context.TankVolumeHistories
                .Where(history => transactionIds.Contains(history.Id) && history.IsDeleted != true);

            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }

            return await query
                .OrderBy(history => history.Timestamp)
                .ThenBy(history => history.Id)
                .ToListAsync(cancellationToken);
        }

        private async Task<List<TankVolumeHistoryEntity>> ExpandTransferLinkedRecordsAsync(
            IReadOnlyCollection<TankVolumeHistoryEntity> records,
            bool asNoTracking,
            CancellationToken cancellationToken)
        {
            var transferReferenceIds = records
                .Where(record => IsTransferRecord(record) && record.ReferenceId.HasValue)
                .Select(record => record.ReferenceId!.Value)
                .Distinct()
                .ToList();

            if (!transferReferenceIds.Any())
            {
                return records.OrderBy(record => record.Timestamp).ThenBy(record => record.Id).ToList();
            }

            IQueryable<TankVolumeHistoryEntity> query = _context.TankVolumeHistories
                .Where(history => history.ReferenceId.HasValue)
                .Where(history => transferReferenceIds.Contains(history.ReferenceId!.Value))
                .Where(history => TransferReasons.Contains(history.ChangeReason))
                .Where(history => history.IsDeleted != true);

            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }

            var transferRecords = await query.ToListAsync(cancellationToken);

            return records
                .Concat(transferRecords)
                .GroupBy(record => record.Id)
                .Select(group => group.First())
                .OrderBy(record => record.Timestamp)
                .ThenBy(record => record.Id)
                .ToList();
        }

        private async Task ApplyReferenceImpactAsync(
            TankVolumeHistoryEntity record,
            HashSet<int> candidateIds,
            string deletedBy,
            DateTime? deletionTime,
            DeleteImpactAccumulator impact,
            bool applyChanges,
            CancellationToken cancellationToken)
        {
            if (!record.ReferenceId.HasValue)
            {
                return;
            }

            switch (record.ChangeReason)
            {
                case VolumeChangeReasonEnum.Adjustment:
                    await TryDeleteStockAdjustmentAsync(record.ReferenceId.Value, deletedBy, deletionTime, impact, applyChanges, cancellationToken);
                    break;

                case VolumeChangeReasonEnum.Delivery:
                    await TryDeleteDeliveryAsync(record.ReferenceId.Value, deletedBy, deletionTime, impact, applyChanges, cancellationToken);
                    break;

                case VolumeChangeReasonEnum.Dispensing:
                    await TryDeleteFuelRefillAsync(record.ReferenceId.Value, deletedBy, deletionTime, impact, applyChanges, cancellationToken);
                    await TryDeleteLinkedDispensingTankStockAsync(record.ReferenceId.Value, deletedBy, deletionTime, impact, applyChanges, cancellationToken);
                    break;

                case VolumeChangeReasonEnum.AutomatedDispensing:
                    await TryPreservePumpTransactionAsync(record.ReferenceId.Value, impact, cancellationToken);
                    await TryDeleteLinkedDispensingTankStockAsync(record.ReferenceId.Value, deletedBy, deletionTime, impact, applyChanges, cancellationToken);
                    break;

                case VolumeChangeReasonEnum.TransferIn:
                case VolumeChangeReasonEnum.TransferOut:
                    await TryHandleTransferReferenceAsync(record.ReferenceId.Value, deletedBy, deletionTime, impact, applyChanges, cancellationToken);
                    break;

                case VolumeChangeReasonEnum.OpeningStock:
                case VolumeChangeReasonEnum.ClosingStock:
                    await TryHandleTankStockReferenceAsync(record, candidateIds, deletedBy, deletionTime, impact, applyChanges, cancellationToken);
                    break;
            }
        }

        private async Task TryDeleteStockAdjustmentAsync(
            int referenceId,
            string deletedBy,
            DateTime? deletionTime,
            DeleteImpactAccumulator impact,
            bool applyChanges,
            CancellationToken cancellationToken)
        {
            var adjustment = await _context.StockAdjustments
                .FirstOrDefaultAsync(item => item.Id == referenceId && !item.IsDeleted, cancellationToken);

            if (adjustment == null || !impact.DeletedReferenceKeys.Add($"StockAdjustment:{referenceId}"))
            {
                return;
            }

            if (applyChanges && deletionTime.HasValue)
            {
                adjustment.IsDeleted = true;
                adjustment.DeletedAt = deletionTime.Value;
                adjustment.DeletedBy = deletedBy;
            }

            impact.DeletedReferenceCount++;
        }

        private async Task TryDeleteDeliveryAsync(
            int referenceId,
            string deletedBy,
            DateTime? deletionTime,
            DeleteImpactAccumulator impact,
            bool applyChanges,
            CancellationToken cancellationToken)
        {
            var delivery = await _context.Deliveries
                .FirstOrDefaultAsync(item => item.Id == referenceId && !item.IsDeleted, cancellationToken);

            if (delivery == null || !impact.DeletedReferenceKeys.Add($"Delivery:{referenceId}"))
            {
                return;
            }

            if (applyChanges && deletionTime.HasValue)
            {
                delivery.IsDeleted = true;
                delivery.DeletedAt = deletionTime.Value;
                delivery.DeletedBy = deletedBy;
            }

            impact.DeletedReferenceCount++;
        }

        private async Task TryDeleteFuelRefillAsync(
            int referenceId,
            string deletedBy,
            DateTime? deletionTime,
            DeleteImpactAccumulator impact,
            bool applyChanges,
            CancellationToken cancellationToken)
        {
            var fuelRefill = await _context.FuelRefills
                .FirstOrDefaultAsync(item => item.Id == referenceId && !item.IsDeleted, cancellationToken);

            if (fuelRefill == null || !impact.DeletedReferenceKeys.Add($"FuelRefill:{referenceId}"))
            {
                return;
            }

            if (applyChanges && deletionTime.HasValue)
            {
                fuelRefill.IsDeleted = true;
                fuelRefill.DeletedAt = deletionTime.Value;
                fuelRefill.DeletedBy = deletedBy;
            }

            impact.DeletedReferenceCount++;
        }

        private async Task TryDeleteLinkedDispensingTankStockAsync(
            int referenceId,
            string deletedBy,
            DateTime? deletionTime,
            DeleteImpactAccumulator impact,
            bool applyChanges,
            CancellationToken cancellationToken)
        {
            var linkedTankStock = await _context.Tankstocks
                .FirstOrDefaultAsync(
                    item => item.EntryId == referenceId &&
                        !item.IsDeleted &&
                        (item.EntryType == VolumeChangeReasonEnum.Dispensing || item.EntryType == VolumeChangeReasonEnum.AutomatedDispensing),
                    cancellationToken);

            if (linkedTankStock == null || !impact.DeletedReferenceKeys.Add($"TankstockDispensing:{linkedTankStock.EntryId}"))
            {
                return;
            }

            if (applyChanges && deletionTime.HasValue)
            {
                linkedTankStock.IsDeleted = true;
                linkedTankStock.DeletedAt = deletionTime.Value;
                linkedTankStock.DeletedBy = deletedBy;
                linkedTankStock.ActiveEntryKey = null;
            }

            impact.DeletedReferenceCount++;
        }

        private async Task TryPreservePumpTransactionAsync(int referenceId, DeleteImpactAccumulator impact, CancellationToken cancellationToken)
        {
            var exists = await _context.Pumptransactions.AnyAsync(transaction => transaction.Id == referenceId, cancellationToken);
            if (!exists || !impact.PreservedReferenceKeys.Add($"PumpTransaction:{referenceId}"))
            {
                return;
            }

            impact.PreservedReferenceCount++;
            impact.PreservedPumpTransactionCount++;
        }

        private async Task TryHandleTransferReferenceAsync(
            int referenceId,
            string deletedBy,
            DateTime? deletionTime,
            DeleteImpactAccumulator impact,
            bool applyChanges,
            CancellationToken cancellationToken)
        {
            var transfer = await _context.TankTransfers
                .FirstOrDefaultAsync(item => item.Id == referenceId && !item.IsDeleted, cancellationToken);

            if (transfer == null)
            {
                return;
            }

            var key = $"TankTransfer:{referenceId}";
            if (await IsLikelyPtsGeneratedTransferAsync(transfer, cancellationToken))
            {
                if (impact.PreservedReferenceKeys.Add(key))
                {
                    impact.PreservedReferenceCount++;
                    impact.PreservedPtsTransferCount++;
                }

                return;
            }

            if (!impact.DeletedReferenceKeys.Add(key))
            {
                return;
            }

            if (applyChanges && deletionTime.HasValue)
            {
                transfer.IsDeleted = true;
                transfer.DeletedAt = deletionTime.Value;
                transfer.DeletedBy = deletedBy;
            }

            impact.DeletedReferenceCount++;
        }

        private async Task TryHandleTankStockReferenceAsync(
            TankVolumeHistoryEntity record,
            HashSet<int> candidateIds,
            string deletedBy,
            DateTime? deletionTime,
            DeleteImpactAccumulator impact,
            bool applyChanges,
            CancellationToken cancellationToken)
        {
            var tankStock = await FindActiveTankStockAsync(record, cancellationToken);
            if (tankStock == null)
            {
                return;
            }

            var key = $"Tankstock:{tankStock.EntryId}";
            var siblingIsActive = await HasActiveSiblingAsync(record, tankStock, candidateIds, cancellationToken);

            if (siblingIsActive)
            {
                if (!impact.UpdatedReferenceKeys.Add(key))
                {
                    return;
                }

                if (applyChanges)
                {
                    if (record.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                    {
                        tankStock.ManualClosingLevel = null;
                        tankStock.ClosingMeter = null;
                        tankStock.ExpectedClosingLevel = null;
                        tankStock.Discrepancy = null;
                    }
                    else
                    {
                        tankStock.ManualOpeningLevel = null;
                        tankStock.OpeningMeter = null;
                    }
                }

                impact.UpdatedReferenceCount++;
                return;
            }

            if (!impact.DeletedReferenceKeys.Add(key))
            {
                return;
            }

            if (applyChanges && deletionTime.HasValue)
            {
                tankStock.IsDeleted = true;
                tankStock.DeletedAt = deletionTime.Value;
                tankStock.DeletedBy = deletedBy;
                tankStock.ActiveEntryKey = null;
            }

            impact.DeletedReferenceCount++;
        }

        private async Task<Tankstock?> FindActiveTankStockAsync(TankVolumeHistoryEntity record, CancellationToken cancellationToken)
        {
            Tankstock? tankStock = null;

            if (record.ReferenceId.HasValue)
            {
                tankStock = await _context.Tankstocks
                    .FirstOrDefaultAsync(item => item.EntryId == record.ReferenceId.Value && !item.IsDeleted, cancellationToken);
            }

            if (tankStock == null && record.TankId.HasValue)
            {
                tankStock = await _context.Tankstocks
                    .FirstOrDefaultAsync(
                        item => item.TankId == record.TankId.Value &&
                            !item.IsDeleted &&
                            (item.EntryDate.Date == record.Timestamp.Date || item.EntryDate.Date == record.Timestamp.Date.AddDays(-1)),
                        cancellationToken);
            }

            return tankStock;
        }

        private async Task<bool> HasActiveSiblingAsync(
            TankVolumeHistoryEntity record,
            Tankstock tankStock,
            HashSet<int> candidateIds,
            CancellationToken cancellationToken)
        {
            var siblingReason = record.ChangeReason == VolumeChangeReasonEnum.OpeningStock
                ? VolumeChangeReasonEnum.ClosingStock
                : VolumeChangeReasonEnum.OpeningStock;

            return await _context.TankVolumeHistories.AnyAsync(
                history => history.ReferenceId == tankStock.EntryId &&
                    history.TankId == tankStock.TankId &&
                    history.ChangeReason == siblingReason &&
                    history.IsDeleted != true &&
                    !candidateIds.Contains(history.Id),
                cancellationToken);
        }

        private async Task<bool> IsLikelyPtsGeneratedTransferAsync(TankTransferEntity transfer, CancellationToken cancellationToken)
        {
            if (!transfer.SourceTankId.HasValue ||
                !transfer.DestinationTankId.HasValue ||
                !transfer.Amount.HasValue ||
                !transfer.TransferDate.HasValue)
            {
                return false;
            }

            const decimal volumeTolerance = 0.01m;
            var transferDate = transfer.TransferDate.Value;
            var windowStart = transferDate.AddMinutes(-5);
            var windowEnd = transferDate.AddMinutes(5);
            var minVolume = transfer.Amount.Value - volumeTolerance;
            var maxVolume = transfer.Amount.Value + volumeTolerance;

            return await _context.Pumptransactions.AnyAsync(
                transaction => transaction.IsTransferMode &&
                    transaction.TankId == transfer.SourceTankId &&
                    transaction.DestinationTankId == transfer.DestinationTankId &&
                    transaction.Volume.HasValue &&
                    transaction.Volume.Value >= minVolume &&
                    transaction.Volume.Value <= maxVolume &&
                    transaction.DateTime >= windowStart &&
                    transaction.DateTime <= windowEnd,
                cancellationToken);
        }

        private static bool IsTransferRecord(TankVolumeHistoryEntity record)
        {
            return record.ChangeReason == VolumeChangeReasonEnum.TransferIn ||
                   record.ChangeReason == VolumeChangeReasonEnum.TransferOut;
        }

        private static void MarkHistoryDeleted(
            TankVolumeHistoryEntity record,
            string deletedBy,
            DateTime deletionTime,
            Dictionary<int, DateTime> earliestPerTank)
        {
            record.IsDeleted = true;
            record.DeletedAt = deletionTime;
            record.DeletedBy = deletedBy;

            if (record.TankId.HasValue)
            {
                var tankId = record.TankId.Value;
                if (!earliestPerTank.TryGetValue(tankId, out var current) || record.Timestamp < current)
                {
                    earliestPerTank[tankId] = record.Timestamp;
                }
            }
        }

        private static BulkTankVolumeHistoryDeleteItemDto ToDeleteItem(
            TankVolumeHistoryEntity record,
            string message,
            string recommendedAction)
        {
            return new BulkTankVolumeHistoryDeleteItemDto
            {
                TransactionId = record.Id,
                TankId = record.TankId,
                Timestamp = record.Timestamp,
                ChangeReason = record.ChangeReason,
                Message = message,
                RecommendedAction = recommendedAction,
            };
        }

        private static string BuildValidationMessage(BulkTankVolumeHistoryDeleteResultDto result, bool userConfirmed)
        {
            if (result.BlockedCount > 0)
            {
                return $"Bulk delete blocked for {result.BlockedCount} transaction(s). Resolve the blocked items before retrying.";
            }

            if (result.RequiresUserConfirmation && !userConfirmed)
            {
                return $"Bulk delete affects {result.WarningCount} historical transaction(s) with future records. Confirmation is required before deleting {result.TotalTransactionsToDelete} transaction(s).";
            }

            return $"Bulk delete is ready for {result.TotalTransactionsToDelete} transaction(s). {result.DeletedReferenceCount} reference row(s) will be deleted and {result.PreservedReferenceCount} reference row(s) will be preserved.";
        }

        private static string BuildSuccessMessage(BulkTankVolumeHistoryDeleteResultDto result)
        {
            var message = $"Successfully soft deleted {result.DeletedTransactionCount} tank volume history record(s). Deleted references: {result.DeletedReferenceCount}. Preserved references: {result.PreservedReferenceCount}.";
            if (result.RecalculationWarnings.Any())
            {
                message += $" Recalculation warnings: {result.RecalculationWarnings.Count}.";
            }

            return message;
        }

        private sealed class DeleteImpactAccumulator
        {
            public HashSet<string> DeletedReferenceKeys { get; } = new(StringComparer.OrdinalIgnoreCase);
            public HashSet<string> UpdatedReferenceKeys { get; } = new(StringComparer.OrdinalIgnoreCase);
            public HashSet<string> PreservedReferenceKeys { get; } = new(StringComparer.OrdinalIgnoreCase);
            public int DeletedReferenceCount { get; set; }
            public int UpdatedReferenceCount { get; set; }
            public int PreservedReferenceCount { get; set; }
            public int PreservedPumpTransactionCount { get; set; }
            public int PreservedPtsTransferCount { get; set; }
        }
    }
}