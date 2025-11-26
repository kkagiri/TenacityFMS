using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelComparison.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FMS.Persistence.DataAccess;
using FMS.Domain.Entities;
using System.Linq;

namespace FMS.Application.Features.FuelComparison.Commands
{
    /// <summary>
    /// Command to update (edit) a GPS report entry volume
    /// Preserves original volume and adds modification tracking
    /// </summary>
    public record UpdateGpsEntryCommand(GpsEntryUpdateDto UpdateDto) : IRequest<FMSResponse<GpsEntryUpdateDto>>;

    public class UpdateGpsEntryCommandHandler : IRequestHandler<UpdateGpsEntryCommand, FMSResponse<GpsEntryUpdateDto>>
    {
        private readonly GpsdataContext _context;

        public UpdateGpsEntryCommandHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<FMSResponse<GpsEntryUpdateDto>> Handle(UpdateGpsEntryCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var dto = request.UpdateDto;

                // Validate input
                if (dto.ModifiedVolume <= 0)
                {
                    return FMSResponse<GpsEntryUpdateDto>.ValidationFailed(new List<string> { "Modified volume must be greater than 0" });
                }

                if (string.IsNullOrWhiteSpace(dto.ModificationReason))
                {
                    return FMSResponse<GpsEntryUpdateDto>.ValidationFailed(new List<string> { "Modification reason is required" });
                }

                if (dto.ModificationReason.Length > 500)
                {
                    return FMSResponse<GpsEntryUpdateDto>.ValidationFailed(new List<string> { "Modification reason cannot exceed 500 characters" });
                }

                // Find the GPS entry
                var gpsEntry = await _context.GpsGateReportEntries
                    .FirstOrDefaultAsync(e => e.Id == dto.Id && !e.IsDeleted, cancellationToken);

                if (gpsEntry == null)
                {
                    return FMSResponse<GpsEntryUpdateDto>.NotFound(
                        "GPS_ENTRY_NOT_FOUND",
                        $"GPS entry with ID {dto.Id} not found or has been deleted");
                }

                // Preserve original volume if this is the first modification
                if (!gpsEntry.OriginalVolume.HasValue)
                {
                    gpsEntry.OriginalVolume = gpsEntry.RefillVolume;
                }

                // Update modification details
                gpsEntry.ModifiedVolume = dto.ModifiedVolume;
                gpsEntry.ModificationReason = dto.ModificationReason;
                gpsEntry.ModifiedBy = dto.ModifiedBy;
                gpsEntry.ModifiedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                return FMSResponse<GpsEntryUpdateDto>.Success(
                    dto,
                    $"GPS entry updated successfully. Original: {gpsEntry.OriginalVolume}L, New: {dto.ModifiedVolume}L");
            }
            catch (Exception ex)
            {
                return FMSResponse<GpsEntryUpdateDto>.Failed(
                    $"Error updating GPS entry: {ex.Message}");
            }
        }
    }
}
