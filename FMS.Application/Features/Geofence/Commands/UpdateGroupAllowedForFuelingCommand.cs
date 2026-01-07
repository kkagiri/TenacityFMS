using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Geofence.Commands;

/// <summary>
/// Command to update a geofence group's IsAllowedForFueling flag
/// </summary>
public class UpdateGroupAllowedForFuelingCommand : IRequest<FMSResponse<GpsGeofenceGroupDTO>>
{
    public int GroupId { get; set; }
    public bool IsAllowedForFueling { get; set; }
    public string UpdatedBy { get; set; } = "system";
}

/// <summary>
/// Handler for UpdateGroupAllowedForFuelingCommand
/// </summary>
public class UpdateGroupAllowedForFuelingCommandHandler : IRequestHandler<UpdateGroupAllowedForFuelingCommand, FMSResponse<GpsGeofenceGroupDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateGroupAllowedForFuelingCommandHandler> _logger;

    public UpdateGroupAllowedForFuelingCommandHandler(GpsdataContext context, ILogger<UpdateGroupAllowedForFuelingCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<GpsGeofenceGroupDTO>> Handle(UpdateGroupAllowedForFuelingCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var group = await _context.GpsGeofenceGroups
                .Include(g => g.Members)
                .ThenInclude(m => m.Geofence)
                .FirstOrDefaultAsync(g => g.Id == request.GroupId, cancellationToken);

            if (group == null)
            {
                return FMSResponse<GpsGeofenceGroupDTO>.Failed($"Geofence group with ID {request.GroupId} not found");
            }

            var previousValue = group.IsAllowedForFueling;
            group.IsAllowedForFueling = request.IsAllowedForFueling;
            group.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Geofence group '{GroupName}' (ID: {GroupId}) IsAllowedForFueling changed from {PreviousValue} to {NewValue} by {UpdatedBy}",
                group.Name, group.Id, previousValue, request.IsAllowedForFueling, request.UpdatedBy);

            var dto = new GpsGeofenceGroupDTO
            {
                Id = group.Id,
                ExternalGroupId = group.ExternalGroupId,
                Name = group.Name,
                Description = group.Description,
                Colour = group.Colour,
                IsPinned = group.IsPinned,
                IsActive = group.IsActive,
                IsAllowedForFueling = group.IsAllowedForFueling,
                LastSyncedAt = group.LastSyncedAt,
                CreatedAt = group.CreatedAt,
                UpdatedAt = group.UpdatedAt,
                GeofenceCount = group.Members?.Count ?? 0
            };

            var message = request.IsAllowedForFueling
                ? $"Geofence group '{group.Name}' is now allowed for fueling"
                : $"Geofence group '{group.Name}' is no longer allowed for fueling";

            return FMSResponse<GpsGeofenceGroupDTO>.Success(dto, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating geofence group IsAllowedForFueling for group ID {GroupId}", request.GroupId);
            return FMSResponse<GpsGeofenceGroupDTO>.Failed($"Failed to update geofence group: {ex.Message}");
        }
    }
}
