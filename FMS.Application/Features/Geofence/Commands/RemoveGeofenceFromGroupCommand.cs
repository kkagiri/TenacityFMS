using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using MediatR;

namespace FMS.Application.Features.Geofence.Commands;

/**
 * File: RemoveGeofenceFromGroupCommand.cs
 * Purpose: Requests removal of a synced geofence from a synced GPSGate group.
 * Dependencies: FMSResponse, MediatR.
 * Last Modified: 2026-03-10
 */
public class RemoveGeofenceFromGroupCommand : IRequest<FMSResponse<GpsGeofenceGroupDTO>>
{
    public int LocalGroupId { get; init; }

    public int LocalGeofenceId { get; init; }
}
