using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.VehicleTracking.DTOs;
using FMS.Application.Features.VehicleTracking.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTracking.Commands.BulkAssignVehiclesToProvider
{
    /// <summary>
    /// Handler for BulkAssignVehiclesToProviderCommand
    /// Fixes bug: Fetches device_id for each vehicle instead of using null
    /// Runs as background job with progress updates via SignalR
    /// </summary>
    public class BulkAssignVehiclesToProviderCommandHandler : IRequestHandler<BulkAssignVehiclesToProviderCommand, FMSResponse<string>>
    {
        private readonly IProviderConfigurationService _configService;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly ILogger<BulkAssignVehiclesToProviderCommandHandler> _logger;

        public BulkAssignVehiclesToProviderCommandHandler(
            IProviderConfigurationService configService,
            IServiceScopeFactory serviceScopeFactory,
            IHubContext<FrontEndHub> hubContext,
            ILogger<BulkAssignVehiclesToProviderCommandHandler> logger)
        {
            _configService = configService;
            _serviceScopeFactory = serviceScopeFactory;
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task<FMSResponse<string>> Handle(BulkAssignVehiclesToProviderCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Initiating bulk assignment of {Count} vehicles to provider {ProviderId}",
                    request.VehicleIds.Count, request.ProviderId);

                // Get provider
                var provider = await _configService.GetByIdAsync(request.ProviderId);
                if (provider == null)
                {
                    return FMSResponse<string>.Failed($"Provider {request.ProviderId} not found");
                }

                // Generate job ID
                string jobId = Guid.NewGuid().ToString("N");

                // Start background task (fire and forget)
                _ = Task.Run(async () =>
                {
                    int successCount = 0;
                    int failCount = 0;
                    List<string> errors = new();

                    try
                    {
                        // Create a new scope for this background task
                        using var scope = _serviceScopeFactory.CreateScope();
                        var scopedConfigService = scope.ServiceProvider.GetRequiredService<IProviderConfigurationService>();
                        var scopedContext = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
                        var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<BulkAssignVehiclesToProviderCommandHandler>>();

                        var startTime = DateTime.UtcNow;

                        foreach (int vehicleId in request.VehicleIds)
                        {
                            try
                            {
                                // ✓ BUG FIX: Get vehicle's device_id from database
                                var vehicle = await scopedContext.Vehicles
                                    .Where(v => v.VehicleId == vehicleId)
                                    .Select(v => new { v.VehicleId, v.DeviceId, v.HasGPSInstalled, v.HyoungNo })
                                    .FirstOrDefaultAsync();

                                if (vehicle == null)
                                {
                                    failCount++;
                                    errors.Add($"Vehicle {vehicleId}: Not found");
                                    continue;
                                }

                                if (vehicle.HasGPSInstalled != 1)
                                {
                                    failCount++;
                                    errors.Add($"Vehicle {vehicle.HyoungNo}: GPS not installed");
                                    continue;
                                }

                                if (!vehicle.DeviceId.HasValue)
                                {
                                    failCount++;
                                    errors.Add($"Vehicle {vehicle.HyoungNo}: Missing GPSGate device ID");
                                    continue;
                                }

                                // ✓ BUG FIX: Pass correct device ID as externalDeviceId
                                bool ok = await scopedConfigService.MapVehicleToProviderAsync(
                                    vehicleId,
                                    provider.Name,
                                    externalDeviceId: vehicle.DeviceId.Value.ToString(), // ✓ Correct GPSGate device ID
                                    currentUser: request.UserId);

                                if (ok)
                                {
                                    successCount++;
                                }
                                else
                                {
                                    failCount++;
                                    errors.Add($"Vehicle {vehicle.HyoungNo}: Mapping failed");
                                }

                                var processedCount = successCount + failCount;

                                // Broadcast progress every 50 vehicles or on completion
                                if (processedCount % 50 == 0 || processedCount == request.VehicleIds.Count)
                                {
                                    await BroadcastProgress(jobId, provider, request.VehicleIds.Count,
                                        processedCount, successCount, failCount, startTime, errors);

                                    scopedLogger.LogInformation(
                                        "Job {JobId}: Processed {Count}/{Total} vehicles ({SuccessCount} succeeded, {FailCount} failed)",
                                        jobId, processedCount, request.VehicleIds.Count, successCount, failCount);
                                }
                            }
                            catch (Exception ex)
                            {
                                failCount++;
                                errors.Add($"Vehicle {vehicleId}: {ex.Message}");
                                scopedLogger.LogError(ex, "Job {JobId}: Error assigning vehicle {VehicleId}",
                                    jobId, vehicleId);
                            }
                        }

                        scopedLogger.LogInformation("Job {JobId} completed: {SuccessCount} succeeded, {FailCount} failed",
                            jobId, successCount, failCount);

                        // Send final completion message
                        await BroadcastProgress(jobId, provider, request.VehicleIds.Count,
                            request.VehicleIds.Count, successCount, failCount, startTime, errors, isComplete: true);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Job {JobId}: Fatal error during bulk assignment", jobId);

                        // Send error notification
                        await _hubContext.Clients.All.SendAsync("BulkProviderAssignmentProgress", new
                        {
                            JobId = jobId,
                            Operation = "BulkAssign",
                            ProviderId = request.ProviderId,
                            ProviderName = provider.DisplayName,
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
                    $"Bulk assignment job started for {request.VehicleIds.Count} vehicles");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating bulk assignment to provider {ProviderId}", request.ProviderId);
                return FMSResponse<string>.Failed($"Failed to start bulk assignment job: {ex.Message}");
            }
        }

        private async Task BroadcastProgress(
            string jobId,
            ProviderConfigurationDto provider,
            int totalVehicles,
            int processedVehicles,
            int successCount,
            int failCount,
            DateTime startTime,
            List<string> errors,
            bool isComplete = false)
        {
            var progressPercentage = (int)Math.Round((double)processedVehicles / totalVehicles * 100);
            var elapsed = (DateTime.UtcNow - startTime).TotalSeconds;
            var rate = processedVehicles / elapsed;
            var remainingSeconds = isComplete ? 0 : (int)Math.Ceiling((totalVehicles - processedVehicles) / rate);

            await _hubContext.Clients.All.SendAsync("BulkProviderAssignmentProgress", new
            {
                JobId = jobId,
                Operation = "BulkAssign",
                ProviderId = provider.Id,
                ProviderName = provider.DisplayName,
                TotalVehicles = totalVehicles,
                ProcessedVehicles = processedVehicles,
                SuccessCount = successCount,
                FailCount = failCount,
                ProgressPercentage = progressPercentage,
                EstimatedRemainingSeconds = remainingSeconds,
                IsComplete = isComplete,
                Errors = errors.Take(10).ToList(), // Only send first 10 errors to avoid large payloads
                Timestamp = DateTime.UtcNow
            });
        }
    }
}
