/**
 * File: ActiveAlarmProcessingService.cs
 * Purpose: Background service that periodically processes active alarm escalation and auto-resolution.
 * Dependencies: IActiveAlarmService, ILogger, IServiceProvider
 * Last Modified: 2026-01-19
 *
 * Key Functions:
 * - ExecuteAsync(): Runs processing cycles on an interval.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.Services.ActiveAlarm;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.ActiveAlarmProcessing
{
    /// <summary>
    /// Background service for processing active alarm auto-resolution and escalation
    /// Runs periodically to handle automatic alarm lifecycle operations
    /// </summary>
    public class ActiveAlarmProcessingService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ActiveAlarmProcessingService> _logger;
        private readonly TimeSpan _processingInterval = TimeSpan.FromMinutes(5); // Run every 5 minutes

        public ActiveAlarmProcessingService(
            IServiceProvider serviceProvider,
            ILogger<ActiveAlarmProcessingService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ActiveAlarm Processing Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessActiveAlarms(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in ActiveAlarm processing cycle");
                }

                // Wait for the next processing interval
                try
                {
                    await Task.Delay(_processingInterval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    // Service is being stopped
                    break;
                }
            }

            _logger.LogInformation("ActiveAlarm Processing Service stopped");
        }

        private async Task ProcessActiveAlarms(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var activeAlarmService = scope.ServiceProvider.GetRequiredService<IActiveAlarmService>();

            try
            {
                _logger.LogDebug("Starting ActiveAlarm processing cycle");

                // Process auto-resolution
                var autoResolvedCount = await activeAlarmService.ProcessAutoResolveAlarmsAsync(cancellationToken);
                if (autoResolvedCount > 0)
                {
                    _logger.LogInformation("Auto-resolved {Count} active alarms", autoResolvedCount);
                }

                // Process escalation
                var escalatedCount = await activeAlarmService.ProcessEscalationAlarmsAsync(cancellationToken);
                if (escalatedCount > 0)
                {
                    _logger.LogInformation("Auto-escalated {Count} active alarms", escalatedCount);
                }

                _logger.LogDebug("Completed ActiveAlarm processing cycle. Auto-resolved: {AutoResolved}, Escalated: {Escalated}",
                    autoResolvedCount, escalatedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing active alarms");
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("ActiveAlarm Processing Service is stopping");
            await base.StopAsync(cancellationToken);
        }
    }
}