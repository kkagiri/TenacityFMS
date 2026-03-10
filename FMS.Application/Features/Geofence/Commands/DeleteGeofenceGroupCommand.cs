using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.Geofence.Commands;

/**
 * File: DeleteGeofenceGroupCommand.cs
 * Purpose: Requests deletion of a synced GPSGate geofence group.
 * Dependencies: FMSResponse, MediatR.
 * Last Modified: 2026-03-10
 */
public class DeleteGeofenceGroupCommand : IRequest<FMSResponse<bool>>
{
    public int LocalGroupId { get; init; }
}
