using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
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
    public record CreateTankVolumeHistoryCommand (TankVolumeHistory TankVolumeHistory) : IRequest<FMSResponseMessage>;

    public class CreateTankVolumeHistoryCommandHandler : IRequestHandler<CreateTankVolumeHistoryCommand, FMSResponseMessage> {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateTankVolumeHistoryCommandHandler> _logger;
        private readonly IMediator _mediator;

        public CreateTankVolumeHistoryCommandHandler (
            GpsdataContext context,
            ILogger<CreateTankVolumeHistoryCommandHandler> logger,
            IMediator mediator) {
            _context = context;
            _logger = logger;
            _mediator = mediator;
        }

        public async Task<FMSResponseMessage> Handle (CreateTankVolumeHistoryCommand request, CancellationToken cancellationToken) {
            try {
                // Validate the request
                if (request.TankVolumeHistory.TankId == null || request.TankVolumeHistory.VolumeChange == null) {
                    return new FMSResponseMessage (false, "Tank ID and Volume Change are required");
                }

                if (request.TankVolumeHistory.ReferenceId == null && !string.IsNullOrEmpty (request.TankVolumeHistory.ReferenceType)) {
                    return new FMSResponseMessage (false, "Reference ID is required when Reference Type is provided");
                }

                // Create the tank volume history record without calculating the NewVolume
                var tankVolumeHistory = new TankVolumeHistory {
                    TankId = request.TankVolumeHistory.TankId,
                    Timestamp = request.TankVolumeHistory.Timestamp,
                    VolumeChange = request.TankVolumeHistory.VolumeChange,
                    ChangeReason = request.TankVolumeHistory.ChangeReason,
                    RecordedBy = request.TankVolumeHistory.RecordedBy,
                    ReferenceType = request.TankVolumeHistory.ReferenceType,
                    ReferenceId = request.TankVolumeHistory.ReferenceId ?? 0,
                    CreatedOn = DateTime.UtcNow
                };

                _logger.LogInformation ("Creating new tank volume history record for tank {TankId} with change {VolumeChange}",
                    tankVolumeHistory.TankId, tankVolumeHistory.VolumeChange);

                _context.TankVolumeHistories.Add (tankVolumeHistory);
                await _context.SaveChangesAsync (cancellationToken);

                // Update all affected tank volume history records to recalculate volumes
                var updateResult = await _mediator.Send (
                    new UpdateTankVolumeHistoryCommand (
                        tankVolumeHistory.TankId.Value,
                        tankVolumeHistory.Timestamp),
                    cancellationToken);

                if (!updateResult.Success) {
                    _logger.LogWarning ("Failed to update tank volume history: {Message}", updateResult.Message);
                    return new FMSResponseMessage (false, $"Created record but failed to update volumes: {updateResult.Message}");
                }

                return new FMSResponseMessage (true, "Tank volume history created successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating tank volume history");
                return new FMSResponseMessage (false, $"Error creating tank volume history: {ex.Message}");
            }
        }
    }
}