using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using MediatR;

namespace FMS.Application.Features.Geofence.Commands;

/**
 * File: UpdateGeofenceGroupCommand.cs
 * Purpose: Requests update of an existing synced GPSGate geofence group.
 * Dependencies: FMSResponse, UpdateGeofenceGroupRequestDTO, MediatR.
 * Last Modified: 2026-03-10
 */
public class UpdateGeofenceGroupCommand : IRequest<FMSResponse<GpsGeofenceGroupDTO>>
{
    public int LocalGroupId { get; init; }

    public UpdateGeofenceGroupRequestDTO Request { get; init; } = new();
}
