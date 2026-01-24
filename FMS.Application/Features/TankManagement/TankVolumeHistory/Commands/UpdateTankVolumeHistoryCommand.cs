using System;
using System.Collections.Generic;
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

namespace FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand
{
    public record UpdateTankVolumeHistoryCommand(
        int TankId,
        DateTime EffectiveDate,
        bool IsHistoricalUpdate = false,
        bool UpdateTankCurrentStock = true) : IRequest<FMSResponseMessage>;

    public class UpdateTankVolumeHistoryCommandHandler : IRequestHandler<UpdateTankVolumeHistoryCommand, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<UpdateTankVolumeHistoryCommandHandler> _logger;

        public UpdateTankVolumeHistoryCommandHandler(GpsdataContext context, ILogger<UpdateTankVolumeHistoryCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage> Handle(UpdateTankVolumeHistoryCommand request, CancellationToken cancellationToken)
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

                _logger.LogInformation("Starting tank volume history update for tank {TankId} from {EffectiveDate}",
                    request.TankId, request.EffectiveDate);

                // Get all non-deleted tank volume history records for this tank from the effective date onwards
                // ordered by timestamp (oldest first), then by ID for consistent ordering when timestamps are equal
                // CRITICAL: Secondary sort by Id ensures deterministic ordering for same-timestamp transactions
                var affectedRecords = await _context.TankVolumeHistories
                    .Where(h => h.TankId == request.TankId &&
                        h.Timestamp >= request.EffectiveDate &&
                        (h.IsDeleted != true))
                    .OrderBy(h => h.Timestamp)
                    .ThenBy(h => h.Id)  // Secondary sort ensures consistent processing order
                    .ToListAsync(cancellationToken);

                if (!affectedRecords.Any())
                {
                    return new FMSResponseMessage(true, "No records found to update");
                }

                // Get the last non-deleted record before the effective date to use as base volume
                // CRITICAL: Secondary sort by Id ensures we get the correct last record when timestamps are equal
                var baseRecord = await _context.TankVolumeHistories
                    .Where(h => h.TankId == request.TankId &&
                        h.Timestamp < request.EffectiveDate &&
                        (h.IsDeleted != true))
                    .OrderByDescending(h => h.Timestamp)
                    .ThenByDescending(h => h.Id)  // Secondary sort for deterministic ordering
                    .FirstOrDefaultAsync(cancellationToken);

                // If there's a historical record, use its NewVolume as base
                // If not, use 0 as starting point (or we could use tank.CurrentVolume if needed)
                decimal baseVolume = baseRecord?.NewVolume ?? 0;

                _logger.LogDebug("Base volume for recalculation is {BaseVolume} from record ID {RecordId}",
                    baseVolume, baseRecord?.Id ?? 0);

                // Recalculate all subsequent volumes
                foreach (var record in affectedRecords)
                {
                    // CRITICAL FIX: OpeningStock is a BASELINE RESET, not a cumulative change
                    // OpeningStock entries should preserve their NewVolume as the user-entered value
                    // and reset the baseVolume for subsequent calculations
                    if (record.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                    {
                        // OpeningStock: Use its existing NewVolume as the new baseline
                        // Don't recalculate - preserve the user-entered opening stock value
                        baseVolume = record.NewVolume ?? 0;

                        _logger.LogDebug("OpeningStock record ID {RecordId} - using as new baseline: {BaseVolume}",
                            record.Id, baseVolume);
                        continue;
                    }

                    // For all other entries: calculate NewVolume from previous volume + change
                    baseVolume += record.VolumeChange ?? 0;

                    _logger.LogDebug("Updating record ID {RecordId} with new volume {NewVolume} (change: {VolumeChange})",
                        record.Id, baseVolume, record.VolumeChange);

                    record.NewVolume = baseVolume;
                }

                // Save changes without transaction (TransactionMiddleware handles this)
                await _context.SaveChangesAsync(cancellationToken);

                // Update tank's CurrentStock with the latest volume history value if requested
                // This ensures the ledger (history) matches the current stock
                if (request.UpdateTankCurrentStock && tank.UseBookKeeping == 1)
                {
                    // Get the most recent record for this tank (which could be the last updated one or a more recent one)
                    // CRITICAL: Secondary sort by Id ensures we get the correct latest record when timestamps are equal
                    var latestRecord = await _context.TankVolumeHistories
                        .Where(h => h.TankId == request.TankId)
                        .OrderByDescending(h => h.Timestamp)
                        .ThenByDescending(h => h.Id)  // Secondary sort for deterministic ordering
                        .FirstOrDefaultAsync(cancellationToken);

                    if (latestRecord != null && latestRecord.NewVolume.HasValue)
                    {
                        _logger.LogInformation("Reconciling tank {TankId} current stock. Old: {OldStock}, New: {NewStock}",
                            tank.Id, tank.CurrentStock, latestRecord.NewVolume);

                        tank.CurrentStock = latestRecord.NewVolume;
                        tank.LastStockUpdate = DateTime.Now;

                        await _context.SaveChangesAsync(cancellationToken);
                    }
                }

                _logger.LogInformation("Successfully updated {RecordCount} tank volume history records for tank {TankId}",
                    affectedRecords.Count, request.TankId);

                return new FMSResponseMessage(true,
                    $"Successfully updated {affectedRecords.Count} tank volume history records from {request.EffectiveDate.ToShortDateString()}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating tank volume history for tank {TankId} from date {EffectiveDate}",
                    request.TankId, request.EffectiveDate);
                return new FMSResponseMessage(false, $"Error updating tank volume history: {ex.Message}");
            }
        }
    }
}