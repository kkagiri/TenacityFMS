using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using MediatR;

namespace FMS.Application.Features.Geofence.Commands;

/**
 * File: CreateGeofenceCommand.cs
 * Purpose: Requests creation of a new GPSGate geofence and targeted local cache sync.
 * Dependencies: FMSResponse, CreateGeofenceRequestDTO, MediatR.
 * Last Modified: 2026-03-10
 */
public class CreateGeofenceCommand : IRequest<FMSResponse<GpsGeofenceDTO>>
{
    public CreateGeofenceRequestDTO Request { get; init; } = new();
}
