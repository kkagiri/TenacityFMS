using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Communication.SignalR
{
    /// <summary>
    /// Implementation of GPS fetch progress service using FrontEndHub
    /// </summary>
    public class GpsFetchProgressService : IGpsFetchProgressService
    {
        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly ILogger<GpsFetchProgressService> _logger;

        public GpsFetchProgressService(
            IHubContext<FrontEndHub> hubContext,
            ILogger<GpsFetchProgressService> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task SendProgress(string jobId, string status, int progressPercent, string message)
        {
            try
            {
                await _hubContext.Clients.All.SendAsync("GpsFetchProgress", new
                {
                    jobId,
                    status,
                    progressPercent,
                    message,
                    timestamp = DateTime.UtcNow
                });

                _logger.LogDebug("GPS fetch progress sent: Job {JobId} - {Status} ({Percent}%): {Message}",
                    jobId, status, progressPercent, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending GPS fetch progress for job {JobId}", jobId);
                throw;
            }
        }

        public async Task SendCompleted(string jobId, object result)
        {
            try
            {
                await _hubContext.Clients.All.SendAsync("GpsFetchCompleted", new
                {
                    jobId,
                    result,
                    timestamp = DateTime.UtcNow
                });

                _logger.LogInformation("GPS fetch completion sent: Job {JobId}", jobId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending GPS fetch completion for job {JobId}", jobId);
                throw;
            }
        }

        public async Task SendError(string jobId, string error)
        {
            try
            {
                await _hubContext.Clients.All.SendAsync("GpsFetchError", new
                {
                    jobId,
                    error,
                    timestamp = DateTime.UtcNow
                });

                _logger.LogError("GPS fetch error sent: Job {JobId} - {Error}", jobId, error);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending GPS fetch error for job {JobId}", jobId);
                throw;
            }
        }
    }
}
