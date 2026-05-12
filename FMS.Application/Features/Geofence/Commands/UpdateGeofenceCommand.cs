using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using MediatR;

namespace FMS.Application.Features.Geofence.Commands;

/**
 * File: UpdateGeofenceCommand.cs
 * Purpose: Requests update of an existing GPSGate geofence and targeted local cache sync.
 * Dependencies: FMSResponse, CreateGeofenceRequestDTO, MediatR.
 * Last Modified: 2026-06-14
 */
public class UpdateGeofenceCommand : IRequest<FMSResponse<GpsGeofenceDTO>>
{
    public int GeofenceId { get; init; }
    public CreateGeofenceRequestDTO Request { get; init; } = new();
}
