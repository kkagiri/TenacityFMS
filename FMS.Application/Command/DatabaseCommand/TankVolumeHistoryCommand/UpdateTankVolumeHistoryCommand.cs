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

namespace FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand {
    public record UpdateTankVolumeHistoryCommand (
        int TankId,
        DateTime EffectiveDate,
        bool IsHistoricalUpdate = false) : IRequest<FMSResponseMessage>;

    public class UpdateTankVolumeHistoryCommandHandler : IRequestHandler<UpdateTankVolumeHistoryCommand, FMSResponseMessage> {
        private readonly GpsdataContext _context;
        private readonly ILogger<UpdateTankVolumeHistoryCommandHandler> _logger;

        public UpdateTankVolumeHistoryCommandHandler (GpsdataContext context, ILogger<UpdateTankVolumeHistoryCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage> Handle (UpdateTankVolumeHistoryCommand request, CancellationToken cancellationToken) {
            try {
                // Validate the request
                var tank = await _context.Tanks
                    .FirstOrDefaultAsync (t => t.Id == request.TankId, cancellationToken);

                if (tank == null) {
                    return new FMSResponseMessage (false, $"Tank with ID {request.TankId} not found");
                }

                _logger.LogInformation ("Starting tank volume history update for tank {TankId} from {EffectiveDate}",
                    request.TankId, request.EffectiveDate);

                // Get all tank volume history records for this tank from the effective date onwards
                // ordered by timestamp (oldest first)
                var affectedRecords = await _context.TankVolumeHistories
                    .Where (h => h.TankId == request.TankId && h.Timestamp >= request.EffectiveDate)
                    .OrderBy (h => h.Timestamp)
                    .ToListAsync (cancellationToken);

                if (!affectedRecords.Any ()) {
                    return new FMSResponseMessage (true, "No records found to update");
                }

                // Get the last record before the effective date to use as base volume
                var baseRecord = await _context.TankVolumeHistories
                    .Where (h => h.TankId == request.TankId && h.Timestamp < request.EffectiveDate)
                    .OrderByDescending (h => h.Timestamp)
                    .FirstOrDefaultAsync (cancellationToken);

                // If there's a historical record, use its NewVolume as base
                // If not, use 0 as starting point (or we could use tank.CurrentVolume if needed)
                decimal baseVolume = baseRecord?.NewVolume ?? 0;

                _logger.LogDebug ("Base volume for recalculation is {BaseVolume} from record ID {RecordId}",
                    baseVolume, baseRecord?.Id ?? 0);

                // Recalculate all subsequent volumes
                foreach (var record in affectedRecords) {
                    // The new volume is the previous record's volume plus the current volume change
                    baseVolume += record.VolumeChange ?? 0;

                    _logger.LogDebug ("Updating record ID {RecordId} with new volume {NewVolume} (change: {VolumeChange})",
                        record.Id, baseVolume, record.VolumeChange);

                    record.NewVolume = baseVolume;
                }

                // Save changes without transaction (TransactionMiddleware handles this)
                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Successfully updated {RecordCount} tank volume history records for tank {TankId}",
                    affectedRecords.Count, request.TankId);

                return new FMSResponseMessage (true,
                    $"Successfully updated {affectedRecords.Count} tank volume history records from {request.EffectiveDate.ToShortDateString()}");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error updating tank volume history for tank {TankId} from date {EffectiveDate}",
                    request.TankId, request.EffectiveDate);
                return new FMSResponseMessage (false, $"Error updating tank volume history: {ex.Message}");
            }
        }
    }
}