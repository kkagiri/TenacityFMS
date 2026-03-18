using System.Collections.Generic;
using FMS.Application.Common;
using MediatR;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.VehicleTracking.DTOs;
using FMS.Application.Features.VehicleTracking.Services;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;
using System;

namespace FMS.Application.Features.VehicleTracking.Commands.BulkAssignVehiclesToProvider
{
    /// <summary>
    /// Command to bulk assign multiple vehicles to a provider
    /// </summary>
    public class BulkAssignVehiclesToProviderCommand : IRequest<FMSResponse<string>>
    {
        public int ProviderId { get; set; }
        public List<int> VehicleIds { get; set; } = new();
        public List<VehicleProviderAssignmentItemDTO> Assignments { get; set; } = new();
        public string UserId { get; set; } = string.Empty;
    }

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

                if (request.Assignments == null || request.Assignments.Count == 0)
                {
                    return FMSResponse<string>.Failed(
                        "Bulk assignment now requires per-vehicle external device IDs. Provide assignments with vehicleId and externalDeviceId.");
                }

                var normalizedAssignments = request.Assignments
                    .Where(a => a.VehicleId > 0)
                    .GroupBy(a => a.VehicleId)
                    .ToDictionary(g => g.Key, g => g.Last());

                if (normalizedAssignments.Count == 0)
                {
                    return FMSResponse<string>.Failed(
                        "Bulk assignment request does not contain any valid vehicle mappings.");
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

                        foreach (var assignment in normalizedAssignments.Values)
                        {
                            try
                            {
                                var vehicleId = assignment.VehicleId;
                                var vehicle = await scopedContext.Vehicles
                                    .Where(v => v.VehicleId == vehicleId)
                                    .Select(v => new { v.VehicleId, v.HasGPSInstalled, v.HyoungNo })
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

                                if (string.IsNullOrWhiteSpace(assignment.ExternalDeviceId))
                                {
                                    failCount++;
                                    errors.Add($"Vehicle {vehicle.HyoungNo}: Missing external device ID");
                                    continue;
                                }

                                bool ok = await scopedConfigService.MapVehicleToProviderAsync(
                                    vehicleId,
                                    provider.Name,
                                    externalDeviceId: assignment.ExternalDeviceId,
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
                                if (processedCount % 50 == 0 || processedCount == normalizedAssignments.Count)
                                {
                                    await BroadcastProgress(jobId, provider, normalizedAssignments.Count,
                                        processedCount, successCount, failCount, startTime, errors);

                                    scopedLogger.LogInformation(
                                        "Job {JobId}: Processed {Count}/{Total} vehicles ({SuccessCount} succeeded, {FailCount} failed)",
                                        jobId, processedCount, normalizedAssignments.Count, successCount, failCount);
                                }
                            }
                            catch (Exception ex)
                            {
                                failCount++;
                                errors.Add($"Vehicle {assignment.VehicleId}: {ex.Message}");
                                scopedLogger.LogError(ex, "Job {JobId}: Error assigning vehicle {VehicleId}",
                                    jobId, assignment.VehicleId);
                            }
                        }

                        scopedLogger.LogInformation("Job {JobId} completed: {SuccessCount} succeeded, {FailCount} failed",
                            jobId, successCount, failCount);

                        // Send final completion message
                        await BroadcastProgress(jobId, provider, normalizedAssignments.Count,
                            normalizedAssignments.Count, successCount, failCount, startTime, errors, isComplete: true);
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
                            TotalVehicles = normalizedAssignments.Count,
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
                    $"Bulk assignment job started for {normalizedAssignments.Count} vehicles");
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
