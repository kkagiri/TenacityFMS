using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Domain.Entities.Features.Geofence;
using FMS.Domain.Entities.Features.GPSIntergration.GpsGate;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Geofence.Commands;

/// <summary>
/// Command to start an async geofence sync job from GPSGate.
/// Returns immediately with a job ID that can be polled for status.
/// Supports selective sync by specifying GroupIds, or full sync if no groups specified.
/// </summary>
public class StartGeofenceSyncJobCommand : IRequest<FMSResponse<SyncGeofencesResponseDTO>>
{
    public bool ForceFullSync { get; set; }
    public string? InitiatedBy { get; set; }

    /// <summary>
    /// If provided, only sync these specific groups and their geofences.
    /// If null or empty, syncs all geofences and groups from GPSGate.
    /// </summary>
    public List<int>? GroupIds { get; set; }
}

public class StartGeofenceSyncJobCommandHandler : IRequestHandler<StartGeofenceSyncJobCommand, FMSResponse<SyncGeofencesResponseDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<StartGeofenceSyncJobCommandHandler> _logger;

    public StartGeofenceSyncJobCommandHandler(
        GpsdataContext context,
        IServiceScopeFactory serviceScopeFactory,
        ILogger<StartGeofenceSyncJobCommandHandler> logger)
    {
        _context = context;
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public async Task<FMSResponse<SyncGeofencesResponseDTO>> Handle(StartGeofenceSyncJobCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Check if there's already a running sync job
            var existingJob = await _context.GeofenceSyncJobs
                .Where(j => j.Status == SyncJobStatus.Running || j.Status == SyncJobStatus.Queued)
                .OrderByDescending(j => j.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingJob != null)
            {
                _logger.LogWarning("Geofence sync job {JobId} is already running", existingJob.JobId);
                return FMSResponse<SyncGeofencesResponseDTO>.Failed(
                    $"A sync job is already in progress (Job ID: {existingJob.JobId}). Please wait for it to complete.");
            }

            // Create job record
            var jobId = Guid.NewGuid().ToString("N");
            var isSelectiveSync = request.GroupIds?.Any() == true;
            var job = new GeofenceSyncJob
            {
                JobId = jobId,
                Status = SyncJobStatus.Queued,
                StatusMessage = isSelectiveSync
                    ? $"Job queued, syncing {request.GroupIds!.Count} selected group(s)..."
                    : "Job queued, starting full sync...",
                ForceFullSync = request.ForceFullSync,
                InitiatedBy = request.InitiatedBy,
                CreatedAt = DateTime.UtcNow,
                TotalGroups = request.GroupIds?.Count ?? 0  // For selective sync, we know the group count upfront
            };

            _context.GeofenceSyncJobs.Add(job);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Geofence sync job {JobId} created by {User}. ForceFullSync: {ForceFullSync}, SelectiveSync: {IsSelective}, GroupCount: {GroupCount}",
                jobId, request.InitiatedBy, request.ForceFullSync, isSelectiveSync, request.GroupIds?.Count ?? 0);

            // Capture group IDs for the background task
            var groupIdsToSync = request.GroupIds?.ToList();

            // Start background processing
            _ = Task.Run(async () =>
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService<IGeofenceSyncJobProcessor>();
                await processor.ProcessSyncJobAsync(jobId, request.ForceFullSync, groupIdsToSync);
            });

            // Return immediately with job info
            var response = new SyncGeofencesResponseDTO
            {
                JobId = jobId,
                Status = SyncJobStatus.Queued,
                StatusMessage = isSelectiveSync
                    ? $"Syncing {request.GroupIds!.Count} selected group(s). Poll GET /api/v1/Geofence/sync-jobs/{jobId} for status."
                    : "Sync job started. Poll GET /api/v1/Geofence/sync-jobs/{jobId} for status.",
                ProgressPercent = 0,
                SyncedAt = DateTime.UtcNow,
                Message = isSelectiveSync
                    ? $"Selective sync started for {request.GroupIds!.Count} group(s). The sync will run in the background."
                    : "Geofence sync job started successfully. The sync will run in the background."
            };

            return FMSResponse<SyncGeofencesResponseDTO>.Success(response, response.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting geofence sync job");
            return FMSResponse<SyncGeofencesResponseDTO>.SystemError("Failed to start geofence sync job: " + ex.Message);
        }
    }
}

/// <summary>
/// Interface for the background job processor
/// </summary>
public interface IGeofenceSyncJobProcessor
{
    /// <summary>
    /// Process a geofence sync job
    /// </summary>
    /// <param name="jobId">Unique job identifier</param>
    /// <param name="forceFullSync">If true, re-sync all data including group members</param>
    /// <param name="groupIds">If provided, only sync these specific groups. If null/empty, sync all.</param>
    Task ProcessSyncJobAsync(string jobId, bool forceFullSync, List<int>? groupIds = null);
}

/// <summary>
/// Background job processor for geofence sync
/// </summary>
public class GeofenceSyncJobProcessor : IGeofenceSyncJobProcessor
{
    private readonly GpsdataContext _context;
    private readonly IGPSGateGeofenceService _geofenceService;
    private readonly ILogger<GeofenceSyncJobProcessor> _logger;

    public GeofenceSyncJobProcessor(
        GpsdataContext context,
        IGPSGateGeofenceService geofenceService,
        ILogger<GeofenceSyncJobProcessor> logger)
    {
        _context = context;
        _geofenceService = geofenceService;
        _logger = logger;
    }

    public async Task ProcessSyncJobAsync(string jobId, bool forceFullSync, List<int>? groupIds = null)
    {
        GeofenceSyncJob? job = null;
        try
        {
            job = await _context.GeofenceSyncJobs
                .FirstOrDefaultAsync(j => j.JobId == jobId);

            if (job == null)
            {
                _logger.LogError("Sync job {JobId} not found", jobId);
                return;
            }

            // Update status to running
            job.Status = SyncJobStatus.Running;
            job.StartedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var isSelectiveSync = groupIds?.Any() == true;
            _logger.LogInformation("Job {JobId}: Starting geofence sync from GPSGate. SelectiveSync: {IsSelective}, GroupCount: {GroupCount}",
                jobId, isSelectiveSync, groupIds?.Count ?? 0);

            int geofencesSynced = 0;
            int groupsSynced = 0;
            int failedCount = 0;

            if (isSelectiveSync)
            {
                // SELECTIVE SYNC: Only sync specified groups and their geofences
                job.TotalGroups = groupIds!.Count;
                job.StatusMessage = $"Syncing {groupIds.Count} selected group(s)...";
                await _context.SaveChangesAsync();

                // First, get the group details from GPSGate
                var allGroupsResponse = await _geofenceService.GetGeofenceGroupsAsync();
                if (allGroupsResponse?.IsSuccess != true || allGroupsResponse.Data == null)
                {
                    throw new Exception("Failed to fetch groups from GPSGate");
                }

                // Filter to only the selected groups
                var selectedGroups = allGroupsResponse.Data
                    .Where(g => groupIds.Contains(g.Id))
                    .ToList();

                foreach (var externalGroup in selectedGroups)
                {
                    try
                    {
                        // Sync the group
                        var existingGroup = await _context.GpsGeofenceGroups
                            .FirstOrDefaultAsync(g => g.ExternalGroupId == externalGroup.Id);

                        GpsGeofenceGroup targetGroup;
                        if (existingGroup == null)
                        {
                            targetGroup = new GpsGeofenceGroup
                            {
                                ExternalGroupId = externalGroup.Id,
                                Name = externalGroup.Name ?? $"Group_{externalGroup.Id}",
                                Description = externalGroup.Description,
                                Colour = externalGroup.Colour,
                                IsPinned = externalGroup.IsPinned,
                                IsActive = true,
                                LastSyncedAt = DateTime.UtcNow,
                                CreatedAt = DateTime.UtcNow
                            };
                            _context.GpsGeofenceGroups.Add(targetGroup);
                            await _context.SaveChangesAsync();
                        }
                        else
                        {
                            existingGroup.Name = externalGroup.Name ?? existingGroup.Name;
                            existingGroup.Description = externalGroup.Description;
                            existingGroup.Colour = externalGroup.Colour;
                            existingGroup.IsPinned = externalGroup.IsPinned;
                            existingGroup.LastSyncedAt = DateTime.UtcNow;
                            existingGroup.UpdatedAt = DateTime.UtcNow;
                            targetGroup = existingGroup;
                            await _context.SaveChangesAsync();
                        }

                        // Fetch and sync geofences for this group
                        var groupGeofencesResponse = await _geofenceService.GetGeofencesInGroupAsync(externalGroup.Id);
                        if (groupGeofencesResponse?.IsSuccess == true && groupGeofencesResponse.Data != null)
                        {
                            foreach (var externalGf in groupGeofencesResponse.Data)
                            {
                                try
                                {
                                    await SyncSingleGeofenceAsync(externalGf);
                                    geofencesSynced++;
                                }
                                catch (Exception ex)
                                {
                                    failedCount++;
                                    _logger.LogWarning(ex, "Job {JobId}: Failed to sync geofence {GeofenceId}", jobId, externalGf.Id);
                                }
                            }
                        }

                        // Sync group members (link geofences to group)
                        await SyncGroupMembersAsync(targetGroup, externalGroup.Id);
                        groupsSynced++;

                        // Update progress
                        job.GroupsSynced = groupsSynced;
                        job.GeofencesSynced = geofencesSynced;
                        job.ProgressPercent = (int)((double)groupsSynced / job.TotalGroups * 100);
                        job.StatusMessage = $"Synced {groupsSynced}/{job.TotalGroups} groups ({geofencesSynced} geofences)...";
                        await _context.SaveChangesAsync();
                        _logger.LogDebug("Job {JobId}: Synced group {GroupId}, {GeofenceCount} geofences so far",
                            jobId, externalGroup.Id, geofencesSynced);
                    }
                    catch (Exception ex)
                    {
                        failedCount++;
                        _logger.LogWarning(ex, "Job {JobId}: Failed to sync group {GroupId}", jobId, externalGroup.Id);
                    }
                }
            }
            else
            {
                // FULL SYNC: Sync all geofences first, then all groups
                job.StatusMessage = "Fetching all geofences from GPSGate...";
                await _context.SaveChangesAsync();

                // Sync all geofences from GPSGate
                var geofenceResponse = await _geofenceService.GetAllGeofencesAsync();
                if (geofenceResponse?.IsSuccess == true && geofenceResponse.Data != null)
                {
                    job.TotalGeofences = geofenceResponse.Data.Count;
                    job.StatusMessage = $"Processing {job.TotalGeofences} geofences...";
                    await _context.SaveChangesAsync();

                    foreach (var externalGf in geofenceResponse.Data)
                    {
                        try
                        {
                            await SyncSingleGeofenceAsync(externalGf);
                            geofencesSynced++;

                            // Update progress every 10 geofences
                            if (geofencesSynced % 10 == 0)
                            {
                                job.GeofencesSynced = geofencesSynced;
                                job.ProgressPercent = (int)((double)geofencesSynced / job.TotalGeofences * 50); // First 50% is geofences
                                job.StatusMessage = $"Synced {geofencesSynced}/{job.TotalGeofences} geofences...";
                                await _context.SaveChangesAsync();
                                _logger.LogDebug("Job {JobId}: Synced {Count}/{Total} geofences", jobId, geofencesSynced, job.TotalGeofences);
                            }
                        }
                        catch (Exception ex)
                        {
                            failedCount++;
                            _logger.LogWarning(ex, "Job {JobId}: Failed to sync geofence {GeofenceId}", jobId, externalGf.Id);
                        }
                    }

                    await _context.SaveChangesAsync();
                }

                // Update progress for geofences complete
                job.GeofencesSynced = geofencesSynced;
                job.ProgressPercent = 50;
                job.StatusMessage = $"Geofences complete. Fetching groups from GPSGate...";
                await _context.SaveChangesAsync();

                // Sync all geofence groups from GPSGate
                var groupResponse = await _geofenceService.GetGeofenceGroupsAsync();
                if (groupResponse?.IsSuccess == true && groupResponse.Data != null)
                {
                    job.TotalGroups = groupResponse.Data.Count;
                    job.StatusMessage = $"Processing {job.TotalGroups} groups...";
                    await _context.SaveChangesAsync();

                    foreach (var externalGroup in groupResponse.Data)
                    {
                        try
                        {
                            var existingGroup = await _context.GpsGeofenceGroups
                                .FirstOrDefaultAsync(g => g.ExternalGroupId == externalGroup.Id);

                            if (existingGroup == null)
                            {
                                var newGroup = new GpsGeofenceGroup
                                {
                                    ExternalGroupId = externalGroup.Id,
                                    Name = externalGroup.Name ?? $"Group_{externalGroup.Id}",
                                    Description = externalGroup.Description,
                                    Colour = externalGroup.Colour,
                                    IsPinned = externalGroup.IsPinned,
                                    IsActive = true,
                                    LastSyncedAt = DateTime.UtcNow,
                                    CreatedAt = DateTime.UtcNow
                                };
                                _context.GpsGeofenceGroups.Add(newGroup);
                                await _context.SaveChangesAsync();

                                await SyncGroupMembersAsync(newGroup, externalGroup.Id);
                            }
                            else
                            {
                                existingGroup.Name = externalGroup.Name ?? existingGroup.Name;
                                existingGroup.Description = externalGroup.Description;
                                existingGroup.Colour = externalGroup.Colour;
                                existingGroup.IsPinned = externalGroup.IsPinned;
                                existingGroup.LastSyncedAt = DateTime.UtcNow;
                                existingGroup.UpdatedAt = DateTime.UtcNow;

                                if (forceFullSync)
                                {
                                    await SyncGroupMembersAsync(existingGroup, externalGroup.Id);
                                }
                            }
                            groupsSynced++;

                            // Update progress every 5 groups
                            if (groupsSynced % 5 == 0)
                            {
                                job.GroupsSynced = groupsSynced;
                                job.ProgressPercent = 50 + (int)((double)groupsSynced / job.TotalGroups * 50); // Last 50% is groups
                                job.StatusMessage = $"Synced {groupsSynced}/{job.TotalGroups} groups...";
                                await _context.SaveChangesAsync();
                                _logger.LogDebug("Job {JobId}: Synced {Count}/{Total} groups", jobId, groupsSynced, job.TotalGroups);
                            }
                        }
                        catch (Exception ex)
                        {
                            failedCount++;
                            _logger.LogWarning(ex, "Job {JobId}: Failed to sync group {GroupId}", jobId, externalGroup.Id);
                        }
                    }

                    await _context.SaveChangesAsync();
                }
            } // End of else block for full sync

            // Mark job as completed
            job.Status = SyncJobStatus.Completed;
            job.GeofencesSynced = geofencesSynced;
            job.GroupsSynced = groupsSynced;
            job.FailedCount = failedCount;
            job.ProgressPercent = 100;
            job.CompletedAt = DateTime.UtcNow;
            job.StatusMessage = $"Completed: {geofencesSynced} geofences, {groupsSynced} groups synced" +
                               (failedCount > 0 ? $" ({failedCount} failed)" : "");
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Job {JobId}: Geofence sync completed. Geofences: {GeofencesSynced}, Groups: {GroupsSynced}, Failed: {FailedCount}",
                jobId, geofencesSynced, groupsSynced, failedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Job {JobId}: Error during geofence sync", jobId);

            if (job != null)
            {
                job.Status = SyncJobStatus.Failed;
                job.ErrorMessage = ex.Message;
                job.StatusMessage = $"Failed: {ex.Message}";
                job.CompletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
    }

    /// <summary>
    /// Sync a single geofence from GPSGate to local database.
    /// All synced geofences are set to IsActive = true since GPSGate only returns active geofences.
    /// </summary>
    private async Task SyncSingleGeofenceAsync(Vehicle.DTOs.GeofenceDTO externalGf)
    {
        var existingGeofence = await _context.GpsGeofences
            .FirstOrDefaultAsync(g => g.ExternalGeofenceId == externalGf.Id);

        var firstCoord = externalGf.Coordinates?.FirstOrDefault();
        decimal? centerLat = firstCoord?.Latitude;
        decimal? centerLng = firstCoord?.Longitude;

        if (existingGeofence == null)
        {
            var newGeofence = new GpsGeofence
            {
                ExternalGeofenceId = externalGf.Id,
                Name = externalGf.Name ?? $"Geofence_{externalGf.Id}",
                Description = externalGf.Description,
                GeofenceType = MapToGeofenceType(externalGf.Type),
                CenterLatitude = centerLat,
                CenterLongitude = centerLng,
                RadiusMeters = externalGf.Radius.HasValue ? (int?)decimal.ToInt32(externalGf.Radius.Value) : null,
                IsActive = true, // Always set to true - if GPSGate returns it, it's active
                LastSyncedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            _context.GpsGeofences.Add(newGeofence);
        }
        else
        {
            existingGeofence.Name = externalGf.Name ?? existingGeofence.Name;
            existingGeofence.Description = externalGf.Description;
            existingGeofence.GeofenceType = MapToGeofenceType(externalGf.Type);
            existingGeofence.CenterLatitude = centerLat ?? existingGeofence.CenterLatitude;
            existingGeofence.CenterLongitude = centerLng ?? existingGeofence.CenterLongitude;
            existingGeofence.RadiusMeters = externalGf.Radius.HasValue ? (int?)decimal.ToInt32(externalGf.Radius.Value) : existingGeofence.RadiusMeters;
            existingGeofence.IsActive = true; // Always set to true - if GPSGate returns it, it's active
            existingGeofence.LastSyncedAt = DateTime.UtcNow;
            existingGeofence.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    private async Task SyncGroupMembersAsync(GpsGeofenceGroup group, int externalGroupId)
    {
        try
        {
            var geofencesResponse = await _geofenceService.GetGeofencesInGroupAsync(externalGroupId);
            if (geofencesResponse == null || !geofencesResponse.IsSuccess || geofencesResponse.Data == null) return;

            // Remove existing members
            var existingMembers = await _context.GpsGeofenceGroupMembers
                .Where(m => m.GroupId == group.Id)
                .ToListAsync();
            _context.GpsGeofenceGroupMembers.RemoveRange(existingMembers);

            // Add new members
            foreach (var geofence in geofencesResponse.Data)
            {
                var cachedGeofence = await _context.GpsGeofences
                    .FirstOrDefaultAsync(g => g.ExternalGeofenceId == geofence.Id);

                if (cachedGeofence != null)
                {
                    _context.GpsGeofenceGroupMembers.Add(new GpsGeofenceGroupMember
                    {
                        GroupId = group.Id,
                        GeofenceId = cachedGeofence.Id,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to sync members for group {GroupId}", externalGroupId);
        }
    }

    private static GpsGeofenceType MapToGeofenceType(GeofenceType type)
    {
        return type switch
        {
            GeofenceType.Polygon => GpsGeofenceType.Polygon,
            GeofenceType.Circle => GpsGeofenceType.Circle,
            GeofenceType.Route => GpsGeofenceType.Route,
            _ => GpsGeofenceType.Polygon
        };
    }
}
