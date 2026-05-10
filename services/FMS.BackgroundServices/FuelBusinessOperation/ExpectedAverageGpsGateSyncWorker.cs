/**
 * File: ExpectedAverageGpsGateSyncWorker.cs
 * Purpose: Background worker that drains expected-average sync jobs and retries GPSGate pushes.
 * Dependencies: IExpectedAverageSyncQueue, ITrackingExpectedAverageSyncService, IEventExpressionEngine
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - ExecuteAsync(): consumes queued sync jobs and applies retry/backoff.
 */

using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.CommonInterface;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Application.Features.ExpectedFuelAverage.Services;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.FuelBusinessOperation;

public class ExpectedAverageGpsGateSyncWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IExpectedAverageSyncQueue _queue;
    private readonly ILogger<ExpectedAverageGpsGateSyncWorker> _logger;

    public ExpectedAverageGpsGateSyncWorker(
        IServiceProvider serviceProvider,
        IExpectedAverageSyncQueue queue,
        ILogger<ExpectedAverageGpsGateSyncWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _queue = queue;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Expected Average GPSGate sync worker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var request = await _queue.DequeueAsync(stoppingToken);
                await ProcessRequestAsync(request, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in Expected Average GPSGate sync worker loop");
            }
        }

        _logger.LogInformation("Expected Average GPSGate sync worker stopped");
    }

    private async Task ProcessRequestAsync(ExpectedAverageSyncRequest request, CancellationToken cancellationToken)
    {
        const int maxAttempts = 3;
        string? lastMessage = null;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            using var scope = _serviceProvider.CreateScope();
            var syncService = scope.ServiceProvider.GetRequiredService<ITrackingExpectedAverageSyncService>();
            var result = await syncService.PushExpectedAverageAsync(request.VehicleId, request.Source, attempt, cancellationToken);

            if (result.IsSuccess)
            {
                return;
            }

            lastMessage = result.Message;

            if (attempt < maxAttempts)
            {
                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
                _logger.LogWarning(
                    "Expected average GPSGate sync attempt {Attempt}/{MaxAttempts} failed for vehicle {VehicleId}: {Message}. Retrying in {Delay}",
                    attempt,
                    maxAttempts,
                    request.VehicleId,
                    result.Message,
                    delay);

                await Task.Delay(delay, cancellationToken);
            }
        }

        using var finalScope = _serviceProvider.CreateScope();
        var eventEngine = finalScope.ServiceProvider.GetRequiredService<IEventExpressionEngine>();
        var context = finalScope.ServiceProvider.GetRequiredService<GpsdataContext>();
        var vehicle = await context.Vehicles
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId, cancellationToken);

        var failedEvent = new ExpectedAveragePushFailedEvent
        {
            VehicleId = request.VehicleId,
            VehicleName = vehicle?.VehicleCode ?? string.Empty,
            Source = request.Source,
            Attempts = maxAttempts,
            FailureReason = lastMessage ?? "GPSGate push failed after retries",
            Message = $"Failed to push expected average to GPSGate for vehicle {vehicle?.VehicleCode ?? request.VehicleId.ToString()} after {maxAttempts} attempts.",
            Severity = "High"
        };

        await eventEngine.ProcessAsync(failedEvent, cancellationToken);
    }
}