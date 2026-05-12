using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.Geofence.Commands;

/**
 * File: DeleteGeofenceCommand.cs
 * Purpose: Requests deletion of a synced GPSGate geofence.
 * Dependencies: FMSResponse, MediatR.
 * Last Modified: 2026-03-10
 */
public class DeleteGeofenceCommand : IRequest<FMSResponse<bool>>
{
    public int LocalGeofenceId { get; init; }
}