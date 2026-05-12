using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FMS.TankVolumeHistory;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand {
    public record UploadTankVolumeCommand (
        List<TankVolumeHistoryDTO> TankVolumeHistories,
        bool IsHistoricalData) : IRequest<FMSResponseMessage>;

    public class UploadTankVolumeCommandHandler : IRequestHandler<UploadTankVolumeCommand, FMSResponseMessage> {
        private readonly GpsdataContext _context;
        private readonly ILogger<UploadTankVolumeCommandHandler> _logger;
        private readonly IMediator _mediator;

        public UploadTankVolumeCommandHandler (
            GpsdataContext context,
            ILogger<UploadTankVolumeCommandHandler> logger,
            IMediator mediator) {
            _context = context;
            _logger = logger;
            _mediator = mediator;
        }

        public async Task<FMSResponseMessage> Handle (UploadTankVolumeCommand request, CancellationToken cancellationToken) {
            try {
                // Validation
                List<string> validationErrors = new List<string> ();

                if (request.TankVolumeHistories == null || !request.TankVolumeHistories.Any ()) {
                    validationErrors.Add ("No tank volume records provided");
                } else {
                    // Validate each tank volume history record
                    foreach (var record in request.TankVolumeHistories) {
                        if (!record.TankId.HasValue || record.TankId <= 0) {
                            validationErrors.Add ($"Invalid tank ID {record.TankId} for record with timestamp {record.Timestamp}");
                        }

                        if (record.VolumeChange == null) {
                            validationErrors.Add ($"Volume change is required for record with timestamp {record.Timestamp}");
                        }

                        // Check if the tank exists
                        if (record.TankId.HasValue && record.TankId > 0) {
                            var tankExists = await _context.Tanks.AnyAsync (t => t.Id == record.TankId, cancellationToken);
                            if (!tankExists) {
                                validationErrors.Add ($"Tank with ID {record.TankId} does not exist");
                            }
                        }
                    }
                }

                if (validationErrors.Any ()) {
                    var response = FMSResponse.ValidationFailed (validationErrors);
                    return new FMSResponseMessage (false, response.Message);
                }

                // Group records by tank for processing
                var recordsByTank = request.TankVolumeHistories.GroupBy (r => r.TankId.Value);
                int totalCreated = 0;
                int totalTanksUpdated = 0;

                foreach (var tankGroup in recordsByTank) {
                    int tankId = tankGroup.Key;
                    var tankRecords = tankGroup.OrderBy (r => r.Timestamp).ToList ();

                    // If historical data, we need to process each record in order
                    DateTime earliestTimestamp = tankRecords.Min (r => r.Timestamp);

                    // Process records for this tank
                    foreach (var record in tankRecords) {
                        var tankVolumeHistory = new TankVolumeHistory {
                            TankId = record.TankId,
                            Timestamp = record.Timestamp,
                            VolumeChange = record.VolumeChange,
                            ChangeReason = record.ChangeReason,
                            RecordedBy = record.RecordedBy,
                            ReferenceType = record.ReferenceType,
                            ReferenceId = record.ReferenceId,
                            CreatedOn = DateTime.UtcNow
                            // NewVolume will be calculated during the update process
                        };

                        _context.TankVolumeHistories.Add (tankVolumeHistory);
                        totalCreated++;
                    }

                    // Save the new records first
                    await _context.SaveChangesAsync (cancellationToken);

                    // Now update the tank volume history for this tank
                    var updateResult = await _mediator.Send (
                        new UpdateTankVolumeHistoryCommand (
                            tankId,
                            earliestTimestamp,
                            request.IsHistoricalData),
                        cancellationToken);

                    if (updateResult.Success) {
                        totalTanksUpdated++;
                    } else {
                        // Log the error but continue with the next tank
                        _logger.LogWarning ("Failed to update tank volume history for tank {TankId}: {Message}",
                            tankId, updateResult.Message);
                    }
                }

                return new FMSResponseMessage (true,
                    $"Successfully uploaded {totalCreated} tank volume records across {totalTanksUpdated} tanks");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error uploading tank volume records");
                return new FMSResponseMessage (false, $"Error uploading tank volume records: {ex.Message}");
            }
        }
    }
}