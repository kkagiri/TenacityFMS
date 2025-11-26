using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.VehicleTracking.Services;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTracking.Commands.BulkUnassignVehiclesFromProvider
{
    /// <summary>
    /// Handler for BulkUnassignVehiclesFromProviderCommand
    /// Runs as background job with progress updates via SignalR
    /// </summary>
    public class BulkUnassignVehiclesFromProviderCommandHandler : IRequestHandler<BulkUnassignVehiclesFromProviderCommand, FMSResponse<string>>
    {
        private readonly IProviderConfigurationService _configService;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly ILogger<BulkUnassignVehiclesFromProviderCommandHandler> _logger;

        public BulkUnassignVehiclesFromProviderCommandHandler(
            IProviderConfigurationService configService,
            IServiceScopeFactory serviceScopeFactory,
            IHubContext<FrontEndHub> hubContext,
            ILogger<BulkUnassignVehiclesFromProviderCommandHandler> logger)
        {
            _configService = configService;
            _serviceScopeFactory = serviceScopeFactory;
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task<FMSResponse<string>> Handle(BulkUnassignVehiclesFromProviderCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Initiating bulk unassignment of {Count} vehicles from providers",
                    request.VehicleIds.Count);

                // Generate job ID
                string jobId = Guid.NewGuid().ToString("N");

                // Start background task (fire and forget)
                _ = Task.Run(async () =>
                {
                    int successCount = 0;
                    int failCount = 0;

                    try
                    {
                        // Create a new scope for this background task
                        using var scope = _serviceScopeFactory.CreateScope();
                        var scopedConfigService = scope.ServiceProvider.GetRequiredService<IProviderConfigurationService>();
                        var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<BulkUnassignVehiclesFromProviderCommandHandler>>();

                        var startTime = DateTime.UtcNow;

                        foreach (int vehicleId in request.VehicleIds)
                        {
                            try
                            {
                                bool ok = await scopedConfigService.UnmapVehicleFromProviderAsync(vehicleId, request.UserId);
                                if (ok)
                                {
                                    successCount++;
                                }
                                else
                                {
                                    failCount++;
                                }

                                var processedCount = successCount + failCount;

                                // Broadcast progress every 50 vehicles or on completion
                                if (processedCount % 50 == 0 || processedCount == request.VehicleIds.Count)
                                {
                                    await BroadcastProgress(jobId, request.VehicleIds.Count,
                                        processedCount, successCount, failCount, startTime,
                                        isComplete: processedCount == request.VehicleIds.Count);

                                    scopedLogger.LogInformation(
                                        "Job {JobId}: Unassigned {Count}/{Total} vehicles ({SuccessCount} succeeded, {FailCount} failed)",
                                        jobId, processedCount, request.VehicleIds.Count, successCount, failCount);
                                }
                            }
                            catch (Exception ex)
                            {
                                failCount++;
                                scopedLogger.LogError(ex, "Job {JobId}: Error unassigning vehicle {VehicleId}",
                                    jobId, vehicleId);
                            }
                        }

                        scopedLogger.LogInformation("Job {JobId} completed: {SuccessCount} succeeded, {FailCount} failed",
                            jobId, successCount, failCount);

                        // Send final completion message
                        await BroadcastProgress(jobId, request.VehicleIds.Count,
                            request.VehicleIds.Count, successCount, failCount, startTime, isComplete: true);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Job {JobId}: Fatal error during bulk unassignment", jobId);

                        // Send error notification
                        await _hubContext.Clients.All.SendAsync("BulkProviderAssignmentProgress", new
                        {
                            JobId = jobId,
                            Operation = "BulkUnassign",
                            ProviderId = (int?)null,
                            ProviderName = "None",
                            TotalVehicles = request.VehicleIds.Count,
                            ProcessedVehicles = successCount + failCount,
                            SuccessCount = successCount,
                            FailCount = failCount,
                            ProgressPercentage = 0,
                            EstimatedRemainingSeconds = 0,
                            IsComplete = true,
                            Error = ex.Message,
                            Timestamp = DateTime.UtcNow
                        });
                    }
                }, cancellationToken);

                // Return immediately with job ID
                return FMSResponse<string>.Success(jobId,
                    $"Bulk unassignment job started for {request.VehicleIds.Count} vehicles");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating bulk unassignment");
                return FMSResponse<string>.Failed($"Failed to start bulk unassignment job: {ex.Message}");
            }
        }

        private async Task BroadcastProgress(
            string jobId,
            int totalVehicles,
            int processedVehicles,
            int successCount,
            int failCount,
            DateTime startTime,
            bool isComplete = false)
        {
            var progressPercentage = (int)Math.Round((double)processedVehicles / totalVehicles * 100);
            var elapsed = (DateTime.UtcNow - startTime).TotalSeconds;
            var rate = processedVehicles / elapsed;
            var remainingSeconds = isComplete ? 0 : (int)Math.Ceiling((totalVehicles - processedVehicles) / rate);

            await _hubContext.Clients.All.SendAsync("BulkProviderAssignmentProgress", new
            {
                JobId = jobId,
                Operation = "BulkUnassign",
                ProviderId = (int?)null,
                ProviderName = "None",
                TotalVehicles = totalVehicles,
                ProcessedVehicles = processedVehicles,
                SuccessCount = successCount,
                FailCount = failCount,
                ProgressPercentage = progressPercentage,
                EstimatedRemainingSeconds = remainingSeconds,
                IsComplete = isComplete,
                Timestamp = DateTime.UtcNow
            });
        }
    }
}
