using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.FMS
{
    /// <summary>
    /// Background service for processing scheduled notifications and alarm monitoring
    /// </summary>
    public class NotificationBackgroundService : BackgroundService
    {
        private readonly ILogger<NotificationBackgroundService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly TimeSpan _scheduledNotificationInterval = TimeSpan.FromMinutes(1); // Check every minute
        private readonly TimeSpan _alarmCheckInterval = TimeSpan.FromMinutes(5); // Check alarms every 5 minutes
        private DateTime _lastAlarmCheck = DateTime.MinValue;

        public NotificationBackgroundService(
            ILogger<NotificationBackgroundService> logger,
            IServiceScopeFactory serviceScopeFactory)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Notification Background Service starting");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                    var alarmHandlerService = scope.ServiceProvider.GetRequiredService<IAlarmHandlerService>();

                    // Process scheduled notifications
                    await ProcessScheduledNotificationsAsync(notificationService, stoppingToken);

                    // Process scheduled alarm checks (less frequent)
                    if (DateTime.UtcNow - _lastAlarmCheck >= _alarmCheckInterval)
                    {
                        await ProcessScheduledAlarmChecksAsync(alarmHandlerService, stoppingToken);
                        _lastAlarmCheck = DateTime.UtcNow;
                    }

                    // Wait for the next cycle
                    await Task.Delay(_scheduledNotificationInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Notification Background Service is stopping due to cancellation");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Notification Background Service cycle");

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

            _logger.LogInformation("Notification Background Service has stopped");
        }

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

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Notification Background Service stopping");
            await base.StopAsync(cancellationToken);
        }
    }
}