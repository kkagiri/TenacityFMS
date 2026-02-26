/**
 * File: ReportJobProgressService.cs
 * Purpose: Broadcasts report job progress to connected clients via FrontEndHub.
 *          Uses IHubContext<FrontEndHub> following the GpsFetchProgressService pattern.
 * Dependencies: FrontEndHub, IHubContext, ReportJobProgressDTO
 * Last Modified: 2026-02-24
 *
 * Key Methods:
 * - SendJobStarted: Broadcasts "ReportJobStarted" event
 * - SendProgress: Broadcasts "ReportJobProgress" event
 * - SendCompleted: Broadcasts "ReportJobCompleted" event
 * - SendError: Broadcasts "ReportJobError" event
 */

using System;
using System.Threading.Tasks;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.Reporting.DTOs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Reporting.Services
{
    /// <summary>
    /// Broadcasts report job lifecycle events via SignalR FrontEndHub
    /// </summary>
    public class ReportJobProgressService : IReportJobProgressService
    {
        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly ILogger<ReportJobProgressService> _logger;

        public ReportJobProgressService(
            IHubContext<FrontEndHub> hubContext,
            ILogger<ReportJobProgressService> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task SendJobStarted(ReportJobProgressDTO progress)
        {
            try
            {
                progress.Timestamp = DateTime.UtcNow;
                await _hubContext.Clients.All.SendAsync("ReportJobStarted", progress);
                _logger.LogInformation(
                    "Report job started: {JobId} - {ReportTitle} for user {UserId}",
                    progress.JobId, progress.ReportTitle, progress.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting report job started for {JobId}", progress.JobId);
            }
        }

        public async Task SendProgress(ReportJobProgressDTO progress)
        {
            try
            {
                progress.Timestamp = DateTime.UtcNow;
                await _hubContext.Clients.All.SendAsync("ReportJobProgress", progress);
                _logger.LogDebug(
                    "Report job progress: {JobId} - {Status} ({Percent}%): {Message}",
                    progress.JobId, progress.Status, progress.ProgressPercent, progress.StatusMessage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting report job progress for {JobId}", progress.JobId);
            }
        }

        public async Task SendCompleted(ReportJobProgressDTO progress)
        {
            try
            {
                progress.Timestamp = DateTime.UtcNow;
                await _hubContext.Clients.All.SendAsync("ReportJobCompleted", progress);
                _logger.LogInformation(
                    "Report job completed: {JobId} - {RecordCount} records, {FileSize} bytes in {Elapsed:F1}s",
                    progress.JobId, progress.RecordCount, progress.FileSizeBytes, progress.ElapsedSeconds);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting report job completed for {JobId}", progress.JobId);
            }
        }

        public async Task SendError(ReportJobProgressDTO progress)
        {
            try
            {
                progress.Timestamp = DateTime.UtcNow;
                await _hubContext.Clients.All.SendAsync("ReportJobError", progress);
                _logger.LogError(
                    "Report job error: {JobId} - {Message}",
                    progress.JobId, progress.StatusMessage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting report job error for {JobId}", progress.JobId);
            }
        }
    }
}
