using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

// Alias to avoid conflict with namespace TankVolumeHistory
using TankVolumeHistoryEntity = FMS.Domain.Entities.Features.TankStockManagement.TankVolumeHistory;

namespace FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand
{
    public record ProcessTankStockChangeCommand(
        int TankId,
        DateTime Timestamp,
        decimal VolumeChange,
        VolumeChangeReasonEnum ChangeReason,
        string RecordedBy,
        int ReferenceId,
        string ReferenceType,
        ActionType ActionType,
        decimal? NewPhysicalStockValue = null, // For opening/closing stock operations
        string? PhysicalStockSource = null) : IRequest<FMSResponseMessage>; // For opening/closing stock operations

    public enum ActionType
    {
        Create,
        Update,
        Delete
    }

    public class ProcessTankStockChangeCommandHandler : IRequestHandler<ProcessTankStockChangeCommand, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<ProcessTankStockChangeCommandHandler> _logger;
        private readonly IMediator _mediator;

        public ProcessTankStockChangeCommandHandler(
            GpsdataContext context,
            ILogger<ProcessTankStockChangeCommandHandler> logger,
            IMediator mediator)
        {
            _context = context;
            _logger = logger;
            _mediator = mediator;
        }

        public async Task<FMSResponseMessage> Handle(ProcessTankStockChangeCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Validate the request
                var tank = await _context.Tanks
                    .FirstOrDefaultAsync(t => t.Id == request.TankId, cancellationToken);

                if (tank == null)
                {
                    return new FMSResponseMessage(false, $"Tank with ID {request.TankId} not found");
                }

                // Different handling based on action type
                switch (request.ActionType)
                {
                    case ActionType.Create:
                        // For opening/closing stock, use the physical stock value directly as the new volume
                        // For other operations, calculate new volume from previous volume + change
                        decimal newVolume;
                        decimal previousVolume = 0m;
                        if ((request.ChangeReason == VolumeChangeReasonEnum.OpeningStock ||
                             request.ChangeReason == VolumeChangeReasonEnum.ClosingStock) &&
                            request.NewPhysicalStockValue.HasValue)
                        {
                            // Use the physical stock value directly - user entered absolute value
                            newVolume = request.NewPhysicalStockValue.Value;
                        }
                        else
                        {
                            // Calculate the new volume based on previous volume + volume change
                            previousVolume = await GetPreviousVolumeAsync(request.TankId, request.Timestamp, cancellationToken);
                            newVolume = previousVolume + request.VolumeChange;

                            // **DIAGNOSTIC LOGGING** for automated dispensing
                            if (request.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing)
                            {
                                _logger.LogInformation("[TankStockChange] 📊 DISPENSING CALCULATION - Tank {TankId}: PreviousVolume={PreviousVolume:F2}L + VolumeChange={VolumeChange:F2}L = NewVolume={NewVolume:F2}L, ReferenceId={ReferenceId}, ReferenceType={ReferenceType}",
                                    request.TankId, previousVolume, request.VolumeChange, newVolume, request.ReferenceId, request.ReferenceType);
                            }
                        }

                        // CRITICAL VALIDATION: Prevent negative stock
                        // Tank volume can never go below zero - this would indicate data corruption or invalid operation
                        if (newVolume < 0)
                        {
                            // For historical entries, check if subsequent transactions (deliveries, transfers)
                            // would recover the balance. This handles real-world scenarios where recording
                            // order doesn't match physical order (e.g., fuel dispensed before delivery was
                            // officially recorded in the system).
                            bool isHistoricalEntry = request.Timestamp < DateTime.UtcNow.AddMinutes(-5);
                            bool chainRecovers = false;

                            if (isHistoricalEntry)
                            {
                                chainRecovers = await CheckHistoricalChainRecoveryAsync(
                                    request.TankId, request.Timestamp, newVolume, cancellationToken);
                            }

                            if (!chainRecovers)
                            {
                                _logger.LogError(
                                    "[TankStockChange] ❌ NEGATIVE STOCK PREVENTED: Tank {TankId}, Operation: {ChangeReason}, " +
                                    "Previous Volume: {PreviousVolume:F2}L, Volume Change: {VolumeChange:F2}L, " +
                                    "Would Result In: {NewVolume:F2}L. ReferenceId: {ReferenceId}, ReferenceType: {ReferenceType}. " +
                                    "This usually means the tank has no opening stock for today or stock levels are not synchronized!",
                                    request.TankId, request.ChangeReason,
                                    previousVolume, request.VolumeChange, newVolume,
                                    request.ReferenceId, request.ReferenceType);

                                return new FMSResponseMessage(false,
                                    $"Operation would result in negative tank stock ({newVolume:F2}L). " +
                                    $"Current available volume is insufficient for this {GetOperationDescription(request.ChangeReason)} of {Math.Abs(request.VolumeChange):F2}L. " +
                                    "Please verify the transaction amount or check tank stock levels.");
                            }

                            _logger.LogWarning(
                                "[TankStockChange] ⚠️ HISTORICAL NEGATIVE OVERRIDE: Tank {TankId}, Operation: {ChangeReason}, " +
                                "Previous Volume: {PreviousVolume:F2}L, Volume Change: {VolumeChange:F2}L, " +
                                "Point-in-time: {NewVolume:F2}L (temporarily negative). " +
                                "Chain recovers via subsequent transactions (deliveries/transfers). " +
                                "ReferenceId: {ReferenceId}, ReferenceType: {ReferenceType}",
                                request.TankId, request.ChangeReason,
                                previousVolume, request.VolumeChange, newVolume,
                                request.ReferenceId, request.ReferenceType);
                        }

                        // Create new tank volume history record
                        var newRecord = new TankVolumeHistory
                        {
                            TankId = request.TankId,
                            Timestamp = request.Timestamp,
                            VolumeChange = request.VolumeChange,
                            NewVolume = newVolume,
                            ChangeReason = request.ChangeReason,
                            RecordedBy = request.RecordedBy,
                            ReferenceId = request.ReferenceId,
                            ReferenceType = request.ReferenceType,
                            CreatedOn = DateTime.UtcNow
                        };

                        _context.TankVolumeHistories.Add(newRecord);

                        // Update tank properties for all operations when physical stock value is provided
                        if (request.NewPhysicalStockValue.HasValue)
                        {
                            // FIX: Use both UTC and local date comparison to handle timezone differences
                            var isCurrentDayUtc = request.Timestamp.Date == DateTime.UtcNow.Date;
                            var isCurrentDayLocal = request.Timestamp.Date == DateTime.Now.Date;
                            var isCurrentDay = isCurrentDayUtc || isCurrentDayLocal;

                            // FIX: Only update physical stock value for TODAY's entries
                            // Historical entries should NOT update the tank's current physical stock
                            if (isCurrentDay)
                            {
                                tank.PhysicalStockValue = request.NewPhysicalStockValue.Value;
                                tank.LastPhysicalStockUpdate = request.Timestamp;
                                tank.PhysicalStockSource = request.PhysicalStockSource ?? GetDefaultPhysicalStockSource(request.ChangeReason);

                                _logger.LogInformation(
                                    "[TankStockChange] 📊 PHYSICAL STOCK UPDATED - Tank {TankId}: PhysicalStockValue={PhysicalStock:F2}L, Source={Source}, Reason={Reason}",
                                    request.TankId, request.NewPhysicalStockValue.Value, request.PhysicalStockSource, request.ChangeReason);
                            }
                            else
                            {
                                _logger.LogInformation(
                                    "[TankStockChange] 📋 HISTORICAL ENTRY - Tank {TankId}: Physical stock NOT updated for historical date {EntryDate:yyyy-MM-dd}. Value={Value:F2}L",
                                    request.TankId, request.Timestamp.Date, request.NewPhysicalStockValue.Value);
                            }

                            // Update book balance only for current day and if bookkeeping is enabled
                            if (isCurrentDay && tank.UseBookKeeping == 1)
                            {
                                // For opening/closing stock, use the exact physical stock value
                                if (request.ChangeReason == VolumeChangeReasonEnum.OpeningStock ||
                                    request.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                                {
                                    tank.CurrentStock = request.NewPhysicalStockValue.Value;
                                }
                                else
                                {
                                    // For other operations (delivery, fuel refill, transfer), apply the change to current stock
                                    tank.CurrentStock = (tank.CurrentStock ?? 0) + request.VolumeChange;
                                }
                                tank.LastStockUpdate = DateTime.UtcNow;
                            }

                            _context.Tanks.Update(tank);
                        }
                        // Handle cases where no physical stock is provided but we still need to update book balance
                        else if ((request.Timestamp.Date == DateTime.UtcNow.Date || request.Timestamp.Date == DateTime.Now.Date) && tank.UseBookKeeping == 1)
                        {
                            // Only update book balance for current day operations when no physical stock is specified
                            tank.CurrentStock = (tank.CurrentStock ?? 0) + request.VolumeChange;
                            tank.LastStockUpdate = DateTime.UtcNow;
                            _context.Tanks.Update(tank);
                        }

                        await _context.SaveChangesAsync(cancellationToken);
                        break;

                    case ActionType.Update:
                        // Find existing tank volume history record
                        var existingRecord = await _context.TankVolumeHistories
                            .FirstOrDefaultAsync(h =>
                                h.TankId == request.TankId &&
                                h.ReferenceId == request.ReferenceId &&
                                h.ReferenceType == request.ReferenceType,
                                cancellationToken);

                        if (existingRecord == null)
                        {
                            // Create new record if not found
                            var newUpdateRecord = new TankVolumeHistory
                            {
                                TankId = request.TankId,
                                Timestamp = request.Timestamp,
                                VolumeChange = request.VolumeChange,
                                ChangeReason = request.ChangeReason,
                                RecordedBy = request.RecordedBy,
                                ReferenceId = request.ReferenceId,
                                ReferenceType = request.ReferenceType,
                                CreatedOn = DateTime.UtcNow
                            };

                            _context.TankVolumeHistories.Add(newUpdateRecord);
                        }
                        else
                        {
                            // Update existing record
                            existingRecord.Timestamp = request.Timestamp;
                            existingRecord.VolumeChange = request.VolumeChange;
                            existingRecord.RecordedBy = request.RecordedBy;
                        }

                        await _context.SaveChangesAsync(cancellationToken);
                        break;

                    case ActionType.Delete:
                        // Find and soft delete tank volume history record
                        var recordToDelete = await _context.TankVolumeHistories
                            .FirstOrDefaultAsync(h =>
                                h.TankId == request.TankId &&
                                h.ReferenceId == request.ReferenceId &&
                                h.ReferenceType == request.ReferenceType &&
                                (h.IsDeleted != true),
                                cancellationToken);

                        if (recordToDelete != null)
                        {
                            // Perform soft delete instead of hard delete
                            recordToDelete.IsDeleted = true;
                            recordToDelete.DeletedAt = DateTime.UtcNow;
                            recordToDelete.DeletedBy = request.RecordedBy;

                            await _context.SaveChangesAsync(cancellationToken);
                        }
                        break;
                }

                // Update all affected tank volume history records
                var updateResult = await _mediator.Send(
                    new UpdateTankVolumeHistoryCommand(
                        request.TankId,
                        request.Timestamp),
                    cancellationToken);

                if (!updateResult.Success)
                {
                    _logger.LogWarning("Failed to update tank volume history: {Message}", updateResult.Message);
                    return new FMSResponseMessage(false, $"Failed to update tank volume history: {updateResult.Message}");
                }

                return new FMSResponseMessage(true,
                    $"Successfully processed {request.ActionType} action for tank {request.TankId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing tank stock change for tank {TankId}", request.TankId);
                return new FMSResponseMessage(false, $"Error processing tank stock change: {ex.Message}");
            }
        }

        private async Task<decimal> GetPreviousVolumeAsync(int tankId, DateTime beforeTimestamp, CancellationToken cancellationToken)
        {
            try
            {
                // FIXED: Retrieve all transactions up to beforeTimestamp and process sequentially
                // This ensures proper ordering even with concurrent same-timestamp transactions
                var allPreviousTransactions = await _context.TankVolumeHistories
                    .Where(h => h.TankId == tankId &&
                        h.Timestamp < beforeTimestamp &&
                        (h.IsDeleted != true))
                    .OrderBy(h => h.Timestamp)          // Ascending: earliest first
                    .ThenBy(h => h.Id)                   // Ascending: lowest ID first for same timestamp
                    .ToListAsync(cancellationToken);

                // If no transactions exist, get the current stock from the tank
                if (!allPreviousTransactions.Any())
                {
                    var tank = await _context.Tanks
                        .Where(t => t.Id == tankId)
                        .Select(t => new { t.CurrentStock, t.Name })
                        .FirstOrDefaultAsync(cancellationToken);

                    var currentStock = tank?.CurrentStock ?? 0m;

                    // **DIAGNOSTIC WARNING** - No volume history means no opening stock
                    _logger.LogWarning("[GetPreviousVolume] ⚠️ NO VOLUME HISTORY - Tank {TankId} ({TankName}) has no TankVolumeHistory records before {BeforeTimestamp}. " +
                        "Falling back to Tank.CurrentStock: {CurrentStock}L. If this is 0, automated dispensing will fail!",
                        tankId, tank?.Name ?? "Unknown", beforeTimestamp, currentStock);

                    return currentStock;
                }

                // Get the LAST transaction (most recent before this timestamp)
                var lastTransaction = allPreviousTransactions.Last();
                var historyVolume = lastTransaction.NewVolume ?? 0m;

                _logger.LogDebug("[GetPreviousVolume] Tank {TankId}: Found {Count} history records, last volume: {LastVolume}L from {LastTimestamp}",
                    tankId, allPreviousTransactions.Count, historyVolume, lastTransaction.Timestamp);

                // Validate the transaction sequence to detect any corruption
                if (!ValidateTransactionSequence(allPreviousTransactions))
                {
                    _logger.LogWarning("Transaction sequence corruption detected for Tank {TankId}. " +
                        "Volume calculations may be inaccurate. Attempting recovery...", tankId);
                }

                // CRITICAL FIX: Detect severe data corruption
                // If history shows extremely negative volume but Tank.CurrentStock is positive,
                // fall back to Tank.CurrentStock to allow operations to proceed
                if (historyVolume < -1000) // Severely negative (corruption indicator)
                {
                    var tank = await _context.Tanks
                        .Where(t => t.Id == tankId)
                        .Select(t => new { t.CurrentStock, t.Name })
                        .FirstOrDefaultAsync(cancellationToken);

                    var tankCurrentStock = tank?.CurrentStock ?? 0m;

                    // If Tank.CurrentStock is positive but history is severely negative, use Tank.CurrentStock
                    if (tankCurrentStock > 0)
                    {
                        _logger.LogWarning(
                            "[GetPreviousVolume] 🔧 DATA CORRUPTION RECOVERY - Tank {TankId} ({TankName}): " +
                            "History shows {HistoryVolume:N0}L but Tank.CurrentStock is {TankCurrentStock:N0}L. " +
                            "Using Tank.CurrentStock as the baseline. The TankVolumeHistory needs reconciliation!",
                            tankId, tank?.Name ?? "Unknown", historyVolume, tankCurrentStock);

                        return tankCurrentStock;
                    }
                }

                return historyVolume;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting previous volume for tank {TankId} before {Timestamp}",
                    tankId, beforeTimestamp);
                throw;
            }
        }

        /// <summary>
        /// Validates that the transaction sequence has correct cumulative volumes
        /// Returns false if sequence is broken (indicating data corruption)
        /// </summary>
        private bool ValidateTransactionSequence(List<TankVolumeHistoryEntity> transactions)
        {
            if (transactions.Count < 2)
                return true; // Nothing to validate

            for (int i = 1; i < transactions.Count; i++)
            {
                var previous = transactions[i - 1];
                var current = transactions[i];

                // Check if current's NewVolume = previous's NewVolume + current's VolumeChange
                decimal expectedVolume = (previous.NewVolume ?? 0m) + (current.VolumeChange ?? 0m);
                decimal actualVolume = current.NewVolume ?? 0m;

                // Allow 0.01L tolerance for rounding
                if (Math.Abs(expectedVolume - actualVolume) > 0.01m)
                {
                    _logger.LogWarning(
                        "Sequence break detected at transaction {TransactionId}: " +
                        "Expected NewVolume={Expected:F2}L (from {PrevId}: {PrevVolume:F2} + {Change:F2}), " +
                        "but got {Actual:F2}L. Variance: {Variance:F2}L",
                        current.Id, expectedVolume, previous.Id, previous.NewVolume,
                        current.VolumeChange, actualVolume, actualVolume - expectedVolume);
                    return false;
                }
            }

            return true;
        }

        private static string GetDefaultPhysicalStockSource(VolumeChangeReasonEnum changeReason)
        {
            return changeReason
            switch
            {
                VolumeChangeReasonEnum.OpeningStock => "Manual",
                VolumeChangeReasonEnum.ClosingStock => "Manual",
                VolumeChangeReasonEnum.Delivery => "Delivery",
                VolumeChangeReasonEnum.Dispensing => "FuelRefill",
                VolumeChangeReasonEnum.TransferIn => "Transfer",
                VolumeChangeReasonEnum.TransferOut => "Transfer",
                VolumeChangeReasonEnum.Adjustment => "Adjustment",
                VolumeChangeReasonEnum.AutomatedDispensing => "PumpTransaction",
                _ => "System"
            };
        }

        /// <summary>
        /// For historical entries that would result in a temporarily negative stock, checks whether
        /// subsequent transactions (deliveries, transfers, opening stock resets) bring the balance
        /// back to a non-negative value. This handles real-world scenarios where the recording order
        /// doesn't match the physical order of events (e.g., fuel dispensed before the delivery was
        /// officially recorded in the system).
        /// </summary>
        private async Task<bool> CheckHistoricalChainRecoveryAsync(
            int tankId, DateTime afterTimestamp, decimal startingVolume, CancellationToken cancellationToken)
        {
            var subsequentRecords = await _context.TankVolumeHistories
                .Where(h => h.TankId == tankId &&
                            h.Timestamp >= afterTimestamp &&
                            h.IsDeleted != true)
                .OrderBy(h => h.Timestamp)
                .ThenBy(h => h.Id)
                .ToListAsync(cancellationToken);

            if (!subsequentRecords.Any())
            {
                _logger.LogDebug("[HistoricalChainRecovery] Tank {TankId}: No subsequent records after {Timestamp}. Chain cannot recover.",
                    tankId, afterTimestamp);
                return false;
            }

            decimal runningVolume = startingVolume;

            foreach (var record in subsequentRecords)
            {
                // Opening/closing stock are absolute values entered by the user — they reset the baseline.
                // The UpdateTankVolumeHistoryCommand recalculation preserves these values.
                if (record.ChangeReason == VolumeChangeReasonEnum.OpeningStock ||
                    record.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                {
                    runningVolume = record.NewVolume ?? 0m;
                }
                else
                {
                    runningVolume += record.VolumeChange ?? 0m;
                }
            }

            _logger.LogInformation(
                "[HistoricalChainRecovery] Tank {TankId}: Starting={StartingVolume:F2}L, " +
                "SubsequentRecords={Count}, FinalVolume={FinalVolume:F2}L, Recovers={Recovers}",
                tankId, startingVolume, subsequentRecords.Count, runningVolume, runningVolume >= 0);

            return runningVolume >= 0;
        }

        /// <summary>
        /// Gets a user-friendly description of the operation for error messages
        /// </summary>
        private static string GetOperationDescription(VolumeChangeReasonEnum changeReason)
        {
            return changeReason switch
            {
                VolumeChangeReasonEnum.OpeningStock => "opening stock entry",
                VolumeChangeReasonEnum.ClosingStock => "closing stock entry",
                VolumeChangeReasonEnum.Delivery => "fuel delivery",
                VolumeChangeReasonEnum.Dispensing => "fuel dispensing/refill",
                VolumeChangeReasonEnum.TransferIn => "transfer in",
                VolumeChangeReasonEnum.TransferOut => "transfer out",
                VolumeChangeReasonEnum.Adjustment => "stock adjustment",
                VolumeChangeReasonEnum.AutomatedDispensing => "automated pump transaction",
                VolumeChangeReasonEnum.AutomatedReconciliation => "automated reconciliation",
                VolumeChangeReasonEnum.Reconciliation => "reconciliation",
                _ => "operation"
            };
        }

    }
}