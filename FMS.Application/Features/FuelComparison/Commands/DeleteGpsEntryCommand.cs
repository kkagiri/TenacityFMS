using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelComparison.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FMS.Persistence.DataAccess;

namespace FMS.Application.Features.FuelComparison.Commands
{
    /// <summary>
    /// Command to soft-delete a GPS report entry
    /// Entry remains in database but is excluded from comparisons
    /// </summary>
    public record DeleteGpsEntryCommand(GpsEntryDeleteDto DeleteDto) : IRequest<FMSResponse<bool>>;

    public class DeleteGpsEntryCommandHandler : IRequestHandler<DeleteGpsEntryCommand, FMSResponse<bool>>
    {
        private readonly GpsdataContext _context;

        public DeleteGpsEntryCommandHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<FMSResponse<bool>> Handle(DeleteGpsEntryCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var dto = request.DeleteDto;

                // Validate input
                if (string.IsNullOrWhiteSpace(dto.DeletionReason))
                {
                    return FMSResponse<bool>.ValidationFailed(
                        new List<string> { "Deletion reason is required" });
                }

                if (dto.DeletionReason.Length > 500)
                {
                    return FMSResponse<bool>.ValidationFailed(
                        new List<string> { "Deletion reason cannot exceed 500 characters" });
                }

                // Find the GPS entry
                var gpsEntry = await _context.GpsGateReportEntries
                    .FirstOrDefaultAsync(e => e.Id == dto.Id && !e.IsDeleted, cancellationToken);

                if (gpsEntry == null)
                {
                    return FMSResponse<bool>.NotFound(
                        "GPS_ENTRY_NOT_FOUND",
                        $"GPS entry with ID {dto.Id} not found or already deleted");
                }

                // Soft delete
                gpsEntry.IsDeleted = true;
                gpsEntry.DeletedBy = dto.DeletedBy;
                gpsEntry.DeletedAt = DateTime.UtcNow;
                gpsEntry.DeletionReason = dto.DeletionReason;

                await _context.SaveChangesAsync(cancellationToken);

                return FMSResponse<bool>.Success(
                    true,
                    $"GPS entry deleted successfully. Reason: {dto.DeletionReason}");
            }
            catch (Exception ex)
            {
                return FMSResponse<bool>.SystemError(
                    $"Error deleting GPS entry: {ex.Message}");
            }
        }
    }
}
