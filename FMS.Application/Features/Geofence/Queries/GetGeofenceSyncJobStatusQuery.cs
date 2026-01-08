using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Domain.Entities.Features.Geofence;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Geofence.Queries;

/// <summary>
/// Query to get the status of a geofence sync job
/// </summary>
public class GetGeofenceSyncJobStatusQuery : IRequest<FMSResponse<SyncGeofencesResponseDTO>>
{
    public string JobId { get; }

    public GetGeofenceSyncJobStatusQuery(string jobId)
    {
        JobId = jobId;
    }
}

public class GetGeofenceSyncJobStatusQueryHandler : IRequestHandler<GetGeofenceSyncJobStatusQuery, FMSResponse<SyncGeofencesResponseDTO>>
{
    private readonly GpsdataContext _context;

    public GetGeofenceSyncJobStatusQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<SyncGeofencesResponseDTO>> Handle(GetGeofenceSyncJobStatusQuery request, CancellationToken cancellationToken)
    {
        var job = await _context.GeofenceSyncJobs
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.JobId == request.JobId, cancellationToken);

        if (job == null)
        {
            return FMSResponse<SyncGeofencesResponseDTO>.NotFound($"Sync job with ID '{request.JobId}' not found");
        }

        // Calculate estimated time remaining
        double? estimatedSecondsRemaining = null;
        if (job.Status == SyncJobStatus.Running && job.StartedAt.HasValue && job.ProgressPercent > 0)
        {
            var elapsedSeconds = (DateTime.UtcNow - job.StartedAt.Value).TotalSeconds;
            var percentRemaining = 100 - job.ProgressPercent;
            estimatedSecondsRemaining = (elapsedSeconds / job.ProgressPercent) * percentRemaining;
        }

        var response = new SyncGeofencesResponseDTO
        {
            JobId = job.JobId,
            Status = job.Status,
            StatusMessage = job.StatusMessage,
            ProgressPercent = job.ProgressPercent,
            GeofencesSynced = job.GeofencesSynced,
            GroupsSynced = job.GroupsSynced,
            TotalGeofences = job.TotalGeofences,
            TotalGroups = job.TotalGroups,
            FailedCount = job.FailedCount,
            StartedAt = job.StartedAt,
            CompletedAt = job.CompletedAt,
            SyncedAt = job.CompletedAt ?? job.CreatedAt,
            EstimatedSecondsRemaining = estimatedSecondsRemaining,
            Message = job.Status == SyncJobStatus.Completed
                ? $"Completed: {job.GeofencesSynced} geofences, {job.GroupsSynced} groups synced"
                : job.Status == SyncJobStatus.Failed
                    ? $"Failed: {job.ErrorMessage}"
                    : $"In progress: {job.ProgressPercent}%"
        };

        return FMSResponse<SyncGeofencesResponseDTO>.Success(response);
    }
}

/// <summary>
/// Query to get recent sync job history
/// </summary>
public class GetGeofenceSyncJobHistoryQuery : IRequest<FMSResponse<List<SyncGeofencesResponseDTO>>>
{
    public int Limit { get; }

    public GetGeofenceSyncJobHistoryQuery(int limit = 10)
    {
        Limit = limit;
    }
}

public class GetGeofenceSyncJobHistoryQueryHandler : IRequestHandler<GetGeofenceSyncJobHistoryQuery, FMSResponse<List<SyncGeofencesResponseDTO>>>
{
    private readonly GpsdataContext _context;

    public GetGeofenceSyncJobHistoryQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<List<SyncGeofencesResponseDTO>>> Handle(GetGeofenceSyncJobHistoryQuery request, CancellationToken cancellationToken)
    {
        var jobs = await _context.GeofenceSyncJobs
            .AsNoTracking()
            .OrderByDescending(j => j.CreatedAt)
            .Take(request.Limit)
            .ToListAsync(cancellationToken);

        var response = jobs.Select(job => new SyncGeofencesResponseDTO
        {
            JobId = job.JobId,
            Status = job.Status,
            StatusMessage = job.StatusMessage,
            ProgressPercent = job.ProgressPercent,
            GeofencesSynced = job.GeofencesSynced,
            GroupsSynced = job.GroupsSynced,
            TotalGeofences = job.TotalGeofences,
            TotalGroups = job.TotalGroups,
            FailedCount = job.FailedCount,
            StartedAt = job.StartedAt,
            CompletedAt = job.CompletedAt,
            SyncedAt = job.CompletedAt ?? job.CreatedAt,
            Message = job.Status == SyncJobStatus.Completed
                ? $"Completed: {job.GeofencesSynced} geofences, {job.GroupsSynced} groups synced"
                : job.Status == SyncJobStatus.Failed
                    ? $"Failed: {job.ErrorMessage}"
                    : $"In progress: {job.ProgressPercent}%"
        }).ToList();

        return FMSResponse<List<SyncGeofencesResponseDTO>>.Success(response, $"Retrieved {response.Count} sync jobs");
    }
}
