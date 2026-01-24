/**
 * File: UnifiedNotificationProcessingService.cs
 * Purpose: Combined background service that handles all notification and alarm processing.
 * Dependencies: INotificationService, IAlarmHandlerService, IActiveAlarmService, ILogger
 * Last Modified: 2026-01-24
 *
 * Consolidates:
 * - NotificationBackgroundService (scheduled notifications, alarm checks)
 * - ActiveAlarmProcessingService (auto-resolution, escalation)
 *
 * Key Functions:
 * - ExecuteAsync(): Main processing loop with staggered intervals
 * - ProcessScheduledNotificationsAsync(): Send due scheduled notifications
 * - ProcessScheduledAlarmChecksAsync(): Check for alarm conditions
 * - ProcessActiveAlarmAutoResolutionAsync(): Auto-resolve alarms based on conditions
 * - ProcessActiveAlarmEscalationAsync(): Escalate alarms that exceed thresholds
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.Notification.Services.ActiveAlarm;
using FMS.Application.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.Notification
{
    /// <summary>
    /// Unified background service for all notification and alarm processing.
    /// Combines functionality from NotificationBackgroundService and ActiveAlarmProcessingService.
    /// </summary>
    public class UnifiedNotificationProcessingService : BackgroundService
    {
        private readonly ILogger<UnifiedNotificationProcessingService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        // Processing intervals
        private readonly TimeSpan _scheduledNotificationInterval = TimeSpan.FromMinutes(1); // Check every minute
        private readonly TimeSpan _alarmCheckInterval = TimeSpan.FromMinutes(5); // Check alarms every 5 minutes
        private readonly TimeSpan _activeAlarmProcessingInterval = TimeSpan.FromMinutes(5); // Process active alarms every 5 minutes

        // Track last execution times
        private DateTime _lastAlarmCheck = DateTime.MinValue;
        private DateTime _lastActiveAlarmProcessing = DateTime.MinValue;

        public UnifiedNotificationProcessingService(
            ILogger<UnifiedNotificationProcessingService> logger,
            IServiceScopeFactory serviceScopeFactory)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Unified Notification Processing Service starting");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                    var alarmHandlerService = scope.ServiceProvider.GetRequiredService<IAlarmHandlerService>();
                    var activeAlarmService = scope.ServiceProvider.GetRequiredService<IActiveAlarmService>();

                    // 1. Process scheduled notifications (every cycle - 1 minute)
                    await ProcessScheduledNotificationsAsync(notificationService, stoppingToken);

                    // 2. Process scheduled alarm checks (every 5 minutes)
                    if (DateTime.UtcNow - _lastAlarmCheck >= _alarmCheckInterval)
                    {
                        await ProcessScheduledAlarmChecksAsync(alarmHandlerService, stoppingToken);
                        _lastAlarmCheck = DateTime.UtcNow;
                    }

                    // 3. Process active alarm lifecycle (every 5 minutes)
                    if (DateTime.UtcNow - _lastActiveAlarmProcessing >= _activeAlarmProcessingInterval)
                    {
                        await ProcessActiveAlarmsAsync(activeAlarmService, stoppingToken);
                        _lastActiveAlarmProcessing = DateTime.UtcNow;
                    }

                    // Wait for the next cycle (base interval is 1 minute for notifications)
                    await Task.Delay(_scheduledNotificationInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Unified Notification Processing Service is stopping due to cancellation");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Unified Notification Processing Service cycle");

                    // Wait a bit before retrying on error
                    try
                    {
                        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                    }
                    catch (OperationCanceledException)
                    {
                        break;
                    }
                }
            }

            _logger.LogInformation("Unified Notification Processing Service has stopped");
        }

        #region Scheduled Notifications (from NotificationBackgroundService)

        private async Task ProcessScheduledNotificationsAsync(INotificationService notificationService, CancellationToken stoppingToken)
        {
            try
            {
                _logger.LogDebug("Processing scheduled notifications");

                var result = await notificationService.SendScheduledNotificationsAsync(stoppingToken);

                if (!result.IsSuccess)
                {
                    _logger.LogWarning("Error processing scheduled notifications: {Message}", result.Message);
                }
                else
                {
                    _logger.LogDebug("Scheduled notifications processed successfully: {Message}", result.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing scheduled notifications");
            }
        }

        #endregion

        #region Alarm Checks (from NotificationBackgroundService)

        private async Task ProcessScheduledAlarmChecksAsync(IAlarmHandlerService alarmHandlerService, CancellationToken stoppingToken)
        {
            try
            {
                _logger.LogDebug("Processing scheduled alarm checks");

                var result = await alarmHandlerService.ProcessScheduledAlarmChecksAsync(stoppingToken);

                if (!result.IsSuccess)
                {
                    _logger.LogWarning("Error processing scheduled alarm checks: {Message}", result.Message);
                }
                else
                {
                    _logger.LogDebug("Scheduled alarm checks processed successfully: {Message}", result.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing scheduled alarm checks");
            }
        }

        #endregion

        #region Active Alarm Processing (from ActiveAlarmProcessingService)

        private async Task ProcessActiveAlarmsAsync(IActiveAlarmService activeAlarmService, CancellationToken stoppingToken)
        {
            try
            {
                _logger.LogDebug("Starting active alarm processing cycle");

                // Process auto-resolution
                var autoResolvedCount = await activeAlarmService.ProcessAutoResolveAlarmsAsync(stoppingToken);
                if (autoResolvedCount > 0)
                {
                    _logger.LogInformation("Auto-resolved {Count} active alarms", autoResolvedCount);
                }

                // Process escalation
                var escalatedCount = await activeAlarmService.ProcessEscalationAlarmsAsync(stoppingToken);
                if (escalatedCount > 0)
                {
                    _logger.LogInformation("Auto-escalated {Count} active alarms", escalatedCount);
                }

                _logger.LogDebug("Completed active alarm processing cycle. Auto-resolved: {AutoResolved}, Escalated: {Escalated}",
                    autoResolvedCount, escalatedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing active alarms");
            }
        }

        #endregion

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Unified Notification Processing Service is stopping");
            await base.StopAsync(cancellationToken);
        }
    }
}
