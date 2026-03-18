/**
 * File: UpdateGeofenceClassificationCommand.cs
 * Purpose: Updates the operational classification of a cached geofence (Parking, Load, Dump, Fuel, Workshop).
 * Dependencies: GpsdataContext, SiteClassification enum.
 * Last Modified: 2026-03-17
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Geofence.Commands;

public class UpdateGeofenceClassificationCommand : IRequest<FMSResponse<GpsGeofenceDTO>>
{
    public int LocalGeofenceId { get; init; }
    public string Classification { get; init; } = "Unknown";
}

public class UpdateGeofenceClassificationCommandHandler
    : IRequestHandler<UpdateGeofenceClassificationCommand, FMSResponse<GpsGeofenceDTO>>
{
    private readonly GpsdataContext _context;

    public UpdateGeofenceClassificationCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<GpsGeofenceDTO>> Handle(
        UpdateGeofenceClassificationCommand request,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<SiteClassification>(request.Classification, true, out var classification))
        {
            return FMSResponse<GpsGeofenceDTO>.Failed(
                $"Invalid classification '{request.Classification}'. Valid values: Unknown, Parking, Load, Dump, Fuel, Workshop.");
        }

        var entity = await _context.GpsGeofences
            .FirstOrDefaultAsync(x => x.Id == request.LocalGeofenceId, cancellationToken);

        if (entity == null)
        {
            return FMSResponse<GpsGeofenceDTO>.Failed($"Geofence with ID {request.LocalGeofenceId} not found.");
        }

        entity.Classification = classification;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new GpsGeofenceDTO
        {
            Id = entity.Id,
            ExternalGeofenceId = entity.ExternalGeofenceId,
            Name = entity.Name,
            Description = entity.Description,
            GeofenceType = entity.GeofenceType.ToString(),
            GeometryJson = entity.GeometryJson,
            CenterLatitude = entity.CenterLatitude,
            CenterLongitude = entity.CenterLongitude,
            RadiusMeters = entity.RadiusMeters,
            Classification = entity.Classification.ToString(),
            IsActive = entity.IsActive,
            LastSyncedAt = entity.LastSyncedAt,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };

        return FMSResponse<GpsGeofenceDTO>.Success(dto, $"Geofence classification updated to {classification}.");
    }
}
