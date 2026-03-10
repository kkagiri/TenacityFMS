using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using MediatR;

namespace FMS.Application.Features.Geofence.Commands;

/**
 * File: AddGeofenceToGroupCommand.cs
 * Purpose: Requests that a synced geofence be assigned to a synced GPSGate group.
 * Dependencies: FMSResponse, MediatR.
 * Last Modified: 2026-03-10
 */
public class AddGeofenceToGroupCommand : IRequest<FMSResponse<GpsGeofenceGroupDTO>>
{
    public int LocalGroupId { get; init; }

    public int LocalGeofenceId { get; init; }
}
