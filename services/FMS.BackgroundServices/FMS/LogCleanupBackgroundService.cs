/**
 * File: LogCleanupBackgroundService.cs
 * Purpose: Runs scheduled cleanup for old log files through the shared log cleanup service.
 * Dependencies: IServiceProvider, ILogCleanupService, ILogger
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - ExecuteAsync(): Schedules and runs periodic log cleanup.
 * - PerformCleanupAsync(): Invokes the shared cleanup service for log retention.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Services.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.FMS;

public class LogCleanupBackgroundService : BackgroundService
{
    private const int CheckIntervalMinutes = 60;

    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<LogCleanupBackgroundService> _logger;

    public LogCleanupBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<LogCleanupBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Log Cleanup Background Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var cleanupService = scope.ServiceProvider.GetRequiredService<ILogCleanupService>();
                var autoCleanupEnabled = await cleanupService.GetAutoCleanupEnabledAsync();

                if (!autoCleanupEnabled)
                {
                    _logger.LogDebug("Scheduled log cleanup is disabled. Rechecking in {Minutes} minutes", CheckIntervalMinutes);
                    await Task.Delay(TimeSpan.FromMinutes(CheckIntervalMinutes), stoppingToken);
                    continue;
                }

                var cleanupHour = await cleanupService.GetCleanupHourAsync();
                var now = DateTime.Now;
                var nextRun = CalculateNextRunTime(now, cleanupHour);
                var delay = nextRun - now;

                _logger.LogDebug("Next log cleanup scheduled for: {NextRun}", nextRun);

                await Task.Delay(delay, stoppingToken);

                if (!stoppingToken.IsCancellationRequested)
                {
                    await PerformCleanupAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Log Cleanup Background Service is stopping");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in Log Cleanup Background Service");
                await Task.Delay(TimeSpan.FromMinutes(CheckIntervalMinutes), stoppingToken);
            }
        }

        _logger.LogInformation("Log Cleanup Background Service stopped");
    }

    private async Task PerformCleanupAsync(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Starting scheduled log cleanup");

            using var scope = _serviceProvider.CreateScope();
            var cleanupService = scope.ServiceProvider.GetRequiredService<ILogCleanupService>();
            var deletedCount = await cleanupService.CleanupOldLogsAsync(cancellationToken);

            _logger.LogInformation("Scheduled log cleanup completed. Files deleted: {DeletedCount}", deletedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during scheduled log cleanup");
        }
    }

    private static DateTime CalculateNextRunTime(DateTime currentTime, int cleanupHour)
    {
        var nextRun = currentTime.Date.AddHours(cleanupHour);

        if (currentTime >= nextRun)
        {
            nextRun = nextRun.AddDays(1);
        }

        return nextRun;
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Log Cleanup Background Service is stopping");
        await base.StopAsync(cancellationToken);
    }
}