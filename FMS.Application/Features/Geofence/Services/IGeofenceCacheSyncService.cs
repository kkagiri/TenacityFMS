using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Application.Features.Geofence.Services;

/**
 * File: IGeofenceCacheSyncService.cs
 * Purpose: Synchronizes targeted GPSGate geofence and group changes into the local cache tables.
 * Dependencies: Geofence DTOs and vehicle GPSGate DTOs.
 * Last Modified: 2026-03-10
 */
public interface IGeofenceCacheSyncService
{
    Task<GpsGeofenceDTO> UpsertGeofenceAsync(GeofenceDTO geofence, CancellationToken cancellationToken);

    Task<GpsGeofenceGroupDTO> UpsertGroupAsync(GeofenceGroupDTO group, CancellationToken cancellationToken);

    Task SyncGroupMembershipsAsync(int externalGroupId, IReadOnlyCollection<int> externalGeofenceIds, CancellationToken cancellationToken);

    Task MarkGroupInactiveAsync(int externalGroupId, CancellationToken cancellationToken);

    Task MarkGeofenceInactiveAsync(int externalGeofenceId, CancellationToken cancellationToken);
}
