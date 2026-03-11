using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using MediatR;

namespace FMS.Application.Features.Geofence.Commands;

/**
 * File: CreateGeofenceGroupCommand.cs
 * Purpose: Requests creation of a GPSGate geofence group and a local cache refresh.
 * Dependencies: FMSResponse, CreateGeofenceGroupRequestDTO, MediatR.
 * Last Modified: 2026-03-10
 */
public class CreateGeofenceGroupCommand : IRequest<FMSResponse<GpsGeofenceGroupDTO>>
{
    public CreateGeofenceGroupRequestDTO Request { get; init; } = new();
}
