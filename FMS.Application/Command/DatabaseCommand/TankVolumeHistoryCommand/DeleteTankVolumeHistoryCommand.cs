using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand {
    public record DeleteTankVolumeHistoryCommand (
        int? Id = null,
        int? TankId = null,
        string ReferenceType = null,
        int? ReferenceId = null,
        DateTime? FromDate = null,
        DateTime? ToDate = null) : IRequest<FMSResponseMessage>;

    public class DeleteTankVolumeHistoryCommandHandler : IRequestHandler<DeleteTankVolumeHistoryCommand, FMSResponseMessage> {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteTankVolumeHistoryCommandHandler> _logger;
        private readonly IMediator _mediator;

        public DeleteTankVolumeHistoryCommandHandler (
            GpsdataContext context,
            ILogger<DeleteTankVolumeHistoryCommandHandler> logger,
            IMediator mediator) {
            _context = context;
            _logger = logger;
            _mediator = mediator;
        }

        public async Task<FMSResponseMessage> Handle (DeleteTankVolumeHistoryCommand request, CancellationToken cancellationToken) {
            try {
                // Validation
                List<string> validationErrors = new List<string> ();

                if (!request.Id.HasValue &&
                    !request.TankId.HasValue &&
                    string.IsNullOrEmpty (request.ReferenceType) &&
                    !request.ReferenceId.HasValue &&
                    !request.FromDate.HasValue &&
                    !request.ToDate.HasValue) {
                    validationErrors.Add ("At least one filter criterion must be provided");
                }

                if (validationErrors.Any ()) {
                    var response = FMSResponse.ValidationFailed (validationErrors);
                    return new FMSResponseMessage (false, response.Message);
                }

                // Build the query
                var query = _context.TankVolumeHistories.AsQueryable ();

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

                // Get the records to delete
                var records = await query.ToListAsync (cancellationToken);

                if (!records.Any ()) {
                    return new FMSResponseMessage (true, "No records found to delete");
                }

                // Get the earliest timestamp from the records to be deleted
                var earliestTimestamp = records.Min (r => r.Timestamp);
                var affectedTankIds = records.Select (r => r.TankId.Value).Distinct ().ToList ();

                // Remove the records
                _context.TankVolumeHistories.RemoveRange (records);
                await _context.SaveChangesAsync (cancellationToken);

                // For each affected tank, update the volume history
                foreach (var tankId in affectedTankIds) {
                    var updateResult = await _mediator.Send (
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
                    $"Successfully deleted {records.Count} tank volume history records");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error deleting tank volume history records");
                return new FMSResponseMessage (false, $"Error deleting tank volume history records: {ex.Message}");
            }
        }
    }
}