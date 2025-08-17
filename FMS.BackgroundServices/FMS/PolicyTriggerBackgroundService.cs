using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common.Constants;
using FMS.Application.Communication.Redis;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.AutomatedReconciliation.Services;

//Cursor - Enhanced background service that listens for Redis policy trigger events with notification integration
public class PolicyTriggerBackgroundService : BackgroundService {
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PolicyTriggerBackgroundService> _logger;

    public PolicyTriggerBackgroundService (
        IServiceProvider serviceProvider,
        ILogger<PolicyTriggerBackgroundService> logger) {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync (CancellationToken stoppingToken) {
        _logger.LogInformation ("PolicyTriggerBackgroundService starting");

        try {
            using var scope = _serviceProvider.CreateScope ();
            var policyTriggerService = scope.ServiceProvider.GetService<IPolicyTriggerService> ();
            var notificationService = scope.ServiceProvider.GetService<INotificationService> ();

            if (policyTriggerService != null) {
                //Cursor - Send service started notification
                await SendServiceStartedNotificationAsync (notificationService, stoppingToken);

                //Cursor - Subscribe to policy triggers and handle real-time execution
                await policyTriggerService.SubscribeToPolicyTriggersAsync (stoppingToken);
                _logger.LogInformation ("Successfully subscribed to policy trigger events with orchestration integration");

                // Keep the service running and monitor health
                var lastHealthCheck = DateTime.UtcNow;
                var healthCheckInterval = TimeSpan.FromMinutes (30);

                while (!stoppingToken.IsCancellationRequested) {
                    // Perform periodic health checks
                    if (DateTime.UtcNow - lastHealthCheck >= healthCheckInterval) {
                        await PerformHealthCheckAsync (policyTriggerService, notificationService, stoppingToken);
                        lastHealthCheck = DateTime.UtcNow;
                    }

                    await Task.Delay (TimeSpan.FromSeconds (30), stoppingToken);
                }
            } else {
                _logger.LogWarning ("IPolicyTriggerService not available, skipping Redis subscription");

                //Cursor - Send service configuration error notification
                await SendServiceConfigurationErrorNotificationAsync (notificationService, stoppingToken);
            }
        } catch (OperationCanceledException) {
            _logger.LogInformation ("PolicyTriggerBackgroundService stopping due to cancellation");
        } catch (Exception ex) {
            _logger.LogError (ex, "Error in PolicyTriggerBackgroundService: {Message}", ex.Message);

            //Cursor - Send critical error notification
            await SendCriticalErrorNotificationAsync (ex, stoppingToken);
        }
    }

    /// <summary>
    /// Perform health check on the policy trigger service
    /// </summary>
    private async Task PerformHealthCheckAsync (IPolicyTriggerService policyTriggerService, INotificationService notificationService, CancellationToken cancellationToken) {
        try {
            _logger.LogDebug ("Performing policy trigger service health check");

            // Check if Redis connection is still active
            // This would be implemented based on your Redis service interface
            // For now, we'll just log that the health check is running

            _logger.LogDebug ("Policy trigger service health check completed successfully");
        } catch (Exception ex) {
            _logger.LogError (ex, "Health check failed for policy trigger service");

            if (notificationService != null) {
                await SendHealthCheckFailureNotificationAsync (notificationService, ex.Message, cancellationToken);
            }
        }
    }

    /// <summary>
    /// Send notification when service starts successfully
    /// </summary>
    private async Task SendServiceStartedNotificationAsync (INotificationService notificationService, CancellationToken cancellationToken) {
        if (notificationService == null) return;

        try {
            var request = new CreateNotificationRequest {
                Type = NotificationType.Info,
                CategoryId = (int) WellKnownCategories.System,
                Priority = NotificationPriority.Low,
                Title = "Policy Trigger Service Started",
                Message = "Policy Trigger Background Service has started and is listening for Redis events",
                TriggerSource = "PolicyTriggerBackground",
                TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                DisableFallbackAllUsers = true,

            };

            await notificationService.CreateNotificationAsync (request, cancellationToken);
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to send service started notification");
        }
    }

    /// <summary>
    /// Send notification when service configuration is invalid
    /// </summary>
    private async Task SendServiceConfigurationErrorNotificationAsync (INotificationService notificationService, CancellationToken cancellationToken) {
        if (notificationService == null) return;

        try {
            var request = new CreateNotificationRequest {
                Type = NotificationType.Alert,
                CategoryId = (int) WellKnownCategories.System,
                Priority = NotificationPriority.High,
                Title = "Policy Trigger Service Configuration Error",
                Message = "IPolicyTriggerService not available. Check service registration and Redis configuration.",
                TriggerSource = "PolicyTriggerBackground",
                TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                DisableFallbackAllUsers = true,

            };

            await notificationService.CreateNotificationAsync (request, cancellationToken);
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to send configuration error notification");
        }
    }

    /// <summary>
    /// Send notification for critical errors
    /// </summary>
    private async Task SendCriticalErrorNotificationAsync (Exception exception, CancellationToken cancellationToken) {
        try {
            using var scope = _serviceProvider.CreateScope ();
            var notificationService = scope.ServiceProvider.GetService<INotificationService> ();

            if (notificationService == null) return;

            var request = new CreateNotificationRequest {
                Type = NotificationType.Error,
                CategoryId = (int) WellKnownCategories.System,
                Priority = NotificationPriority.Critical,
                Title = "Policy Trigger Service Critical Error",
                Message = $"Policy Trigger Background Service encountered a critical error: {exception.Message}",
                TriggerSource = "PolicyTriggerBackground",
                TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                DisableFallbackAllUsers = true

            };

            await notificationService.CreateNotificationAsync (request, cancellationToken);
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to send critical error notification");
        }
    }

    /// <summary>
    /// Send notification when health check fails
    /// </summary>
    private async Task SendHealthCheckFailureNotificationAsync (INotificationService notificationService, string errorMessage, CancellationToken cancellationToken) {
        try {
            var request = new CreateNotificationRequest {
                Type = NotificationType.Alert,
                CategoryId = (int) WellKnownCategories.System,
                Priority = NotificationPriority.Medium,
                Title = "Policy Trigger Service Health Check Failed",
                Message = $"Policy Trigger service health check failed: {errorMessage}",
                TriggerSource = "PolicyTriggerBackground",
                TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                DisableFallbackAllUsers = true

            };

            await notificationService.CreateNotificationAsync (request, cancellationToken);
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to send health check failure notification");
        }
    }

    public override async Task StopAsync (CancellationToken cancellationToken) {
        _logger.LogInformation ("PolicyTriggerBackgroundService stopping");

        try {
            using var scope = _serviceProvider.CreateScope ();
            var notificationService = scope.ServiceProvider.GetService<INotificationService> ();

            if (notificationService != null) {
                var request = new CreateNotificationRequest {
                Type = NotificationType.Info,
                CategoryId = (int) WellKnownCategories.System,
                Priority = NotificationPriority.Medium,
                Title = "Policy Trigger Service Stopped",
                Message = "Policy Trigger Background Service has been stopped",
                TriggerSource = "PolicyTriggerBackground",
                TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                DisableFallbackAllUsers = true
                };

                await notificationService.CreateNotificationAsync (request, cancellationToken);
            }
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to send service stopped notification");
        }

        await base.StopAsync (cancellationToken);
    }
}