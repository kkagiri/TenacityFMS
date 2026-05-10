/**
 * File: UnifiedNotificationProcessingService.cs
 * Purpose: Combined background service that handles all notification and alarm processing.
 * Dependencies: INotificationService, ILogger
 * Last Modified: 2026-02-02
 *
 * Consolidates:
 * - NotificationBackgroundService (scheduled notifications)
 *
 * Key Functions:
 * - ExecuteAsync(): Main processing loop with staggered intervals
 * - ProcessScheduledNotificationsAsync(): Send due scheduled notifications
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.Notification
{
    /// <summary>
    /// Unified background service for notification processing.
    /// </summary>
    public class UnifiedNotificationProcessingService : BackgroundService
    {
        private readonly ILogger<UnifiedNotificationProcessingService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        // Processing intervals
        private readonly TimeSpan _scheduledNotificationInterval = TimeSpan.FromMinutes(1); // Check every minute

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

                    // 1. Process scheduled notifications (every cycle - 1 minute)
                    await ProcessScheduledNotificationsAsync(notificationService, stoppingToken);

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

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Unified Notification Processing Service is stopping");
            await base.StopAsync(cancellationToken);
        }
    }
}
