using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.AutomatedReconciliation.Services;
using FMS.Application.Services;
using FMS.Application.Common.Constants;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.FMS
{
    /// <summary>
    /// Enhanced background service that runs automated reconciliation cycles on a configurable schedule
    /// with notification integration and error handling
    /// </summary>
    public class AutomatedReconciliationBackgroundService : BackgroundService
    {
        private readonly ILogger<AutomatedReconciliationBackgroundService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IConfiguration _configuration;

        // Default execution interval (can be overridden in configuration)
        private readonly TimeSpan _defaultExecutionInterval = TimeSpan.FromMinutes(15);

        public AutomatedReconciliationBackgroundService(
            ILogger<AutomatedReconciliationBackgroundService> logger,
            IServiceScopeFactory serviceScopeFactory,
            IConfiguration configuration)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Automated Reconciliation Background Service starting");

            // Get execution interval from configuration or use default
            var executionInterval = GetExecutionInterval();
            _logger.LogInformation("Automated reconciliation will run every {Interval}", executionInterval);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogDebug("Starting automated reconciliation cycle");

                    using (var scope = _serviceScopeFactory.CreateScope())
                    {
                        var automatedReconciliationService = scope.ServiceProvider
                            .GetRequiredService<AutomatedReconciliationService>();

                        var notificationService = scope.ServiceProvider
                            .GetRequiredService<INotificationService>();

                        var cycleResult = await automatedReconciliationService
                            .ExecuteReconciliationCycleAsync(stoppingToken);

                        LogCycleResults(cycleResult);

                        //Cursor - Send system health notification for significant issues
                        await SendSystemHealthNotificationIfNeeded(cycleResult, notificationService, stoppingToken);
                    }

                    _logger.LogDebug("Automated reconciliation cycle completed. Next cycle in {Interval}", executionInterval);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Automated reconciliation service is stopping due to cancellation");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during automated reconciliation cycle");

                    //Cursor - Send critical system error notification
                    await SendCriticalSystemErrorNotificationAsync(ex, stoppingToken);

                    // Continue running even if a cycle fails
                    // Wait a shorter interval before retrying after an error
                    var retryInterval = TimeSpan.FromMinutes(5);
                    _logger.LogInformation("Will retry automated reconciliation in {RetryInterval}", retryInterval);

                    try
                    {
                        await Task.Delay(retryInterval, stoppingToken);
                        continue;
                    }
                    catch (OperationCanceledException)
                    {
                        break;
                    }
                }

                try
                {
                    await Task.Delay(executionInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Automated reconciliation service stopping");
                    break;
                }
            }

            _logger.LogInformation("Automated Reconciliation Background Service stopped");
        }

        /// <summary>
        /// Gets the execution interval from configuration with enhanced configuration support
        /// </summary>
        private TimeSpan GetExecutionInterval()
        {
            var configValue = _configuration["AutomatedReconciliation:ExecutionIntervalMinutes"];

            if (string.IsNullOrEmpty(configValue))
            {
                _logger.LogDebug("No execution interval configured, using default: {DefaultInterval}", _defaultExecutionInterval);
                return _defaultExecutionInterval;
            }

            if (int.TryParse(configValue, out var intervalMinutes) && intervalMinutes > 0)
            {
                var interval = TimeSpan.FromMinutes(intervalMinutes);
                _logger.LogInformation("Using configured execution interval: {Interval}", interval);
                return interval;
            }

            _logger.LogWarning("Invalid execution interval configuration '{ConfigValue}', using default: {DefaultInterval}",
                configValue, _defaultExecutionInterval);
            return _defaultExecutionInterval;
        }

        /// <summary>
        /// Enhanced logging of reconciliation cycle results with detailed metrics
        /// </summary>
        private void LogCycleResults(ReconciliationCycleResult result)
        {
            if (result.ProcessedPolicies == 0)
            {
                _logger.LogDebug("Cycle completed - no policies required execution");
                return;
            }

            var logLevel = result.FailedPolicies > 0 ? LogLevel.Warning : LogLevel.Information;

            _logger.Log(logLevel,
                "Reconciliation cycle summary: " +
                "Duration: {Duration}ms, " +
                "Processed Policies: {ProcessedPolicies}, " +
                "Successful: {SuccessfulPolicies}, " +
                "Failed: {FailedPolicies}, " +
                "Success Rate: {SuccessRate:F1}%",
                result.Duration.TotalMilliseconds,
                result.ProcessedPolicies,
                result.SuccessfulPolicies,
                result.FailedPolicies,
                result.ProcessedPolicies > 0 ? (result.SuccessfulPolicies * 100.0 / result.ProcessedPolicies) : 0);

            // Log individual policy results if there were failures
            if (result.FailedPolicies > 0)
            {
                foreach (var policyResult in result.PolicyResults)
                {
                    if (!policyResult.Success)
                    {
                        _logger.LogWarning("Policy {PolicyId} execution failed: {Error}",
                            policyResult.PolicyId,
                            policyResult.ErrorMessage);
                    }
                }
            }

            // Log summary of discrepancies if any were found
            var totalDiscrepanciesFound = result.PolicyResults.Sum(p => p.DiscrepanciesFound);
            var totalDiscrepanciesResolved = result.PolicyResults.Sum(p => p.DiscrepanciesResolved);

            if (totalDiscrepanciesFound > 0)
            {
                _logger.LogInformation("Total discrepancies found: {Found}, resolved: {Resolved}",
                    totalDiscrepanciesFound, totalDiscrepanciesResolved);
            }
        }

        /// <summary>
        /// Send system health notification if there are significant issues
        /// </summary>
        private async Task SendSystemHealthNotificationIfNeeded(ReconciliationCycleResult result, INotificationService notificationService, CancellationToken cancellationToken)
        {
            try
            {
                // Send notification if failure rate is high or if there are critical issues
                var failureRate = result.ProcessedPolicies > 0 ? (double)result.FailedPolicies / result.ProcessedPolicies : 0;

                if (failureRate >= 0.5 && result.ProcessedPolicies > 0) // 50% or more failures
                {
                    var request = new CreateNotificationRequest
                    {
                        Type = "Alert",
                        Category = "System",
                        Priority = "High",
                        Title = "Reconciliation System Health Alert",
                                            Message = $"High failure rate detected: {result.FailedPolicies}/{result.ProcessedPolicies} policies failed ({failureRate:P0})",
                    TriggerSource = "AutomatedReconciliationBackground",
                    TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                    Recipients = new List<CreateNotificationRecipientRequest>
                        {
                            new CreateNotificationRecipientRequest
                            {
                                                            UserId = SystemConstants.SystemAdministrator.UserId,
                            DeliveryMethods = new List<string> { SystemConstants.Notifications.SystemDeliveryMethod, "Email" }
                            },
                            new CreateNotificationRecipientRequest
                            {
                                UserId = "fuel-operations",
                                DeliveryMethods = new List<string> { SystemConstants.Notifications.SystemDeliveryMethod }
                            }
                        }
                    };

                    await notificationService.CreateNotificationAsync(request, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send system health notification");
            }
        }

        /// <summary>
        /// Send critical error notification when the background service encounters errors
        /// </summary>
        private async Task SendCriticalSystemErrorNotificationAsync(Exception exception, CancellationToken cancellationToken)
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                var request = new CreateNotificationRequest
                {
                    Type = "Alert",
                    Category = "System",
                    Priority = "Critical",
                    Title = "Critical Reconciliation System Error",
                    Message = $"Automated Reconciliation Background Service encountered a critical error: {exception.Message}",
                    TriggerSource = "AutomatedReconciliationBackground",
                    TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                    Recipients = new List<CreateNotificationRecipientRequest>
                    {
                        new CreateNotificationRecipientRequest
                        {
                            UserId = SystemConstants.SystemAdministrator.UserId,
                            DeliveryMethods = new List<string> { SystemConstants.Notifications.SystemDeliveryMethod, "Email", "SMS" }
                        }
                    }
                };

                await notificationService.CreateNotificationAsync(request, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send critical system error notification");
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Automated Reconciliation Background Service is stopping");

            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                var request = new CreateNotificationRequest
                {
                    Type = "Info",
                    Category = "System",
                    Priority = "Medium",
                    Title = "Reconciliation Service Stopped",
                    Message = "Automated Reconciliation Background Service has been stopped",
                    TriggerSource = "AutomatedReconciliationBackground",
                    TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                    Recipients = new List<CreateNotificationRecipientRequest>
                    {
                        new CreateNotificationRecipientRequest
                        {
                            UserId = SystemConstants.SystemAdministrator.UserId,
                            DeliveryMethods = new List<string> { SystemConstants.Notifications.SystemDeliveryMethod }
                        }
                    }
                };

                await notificationService.CreateNotificationAsync(request, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send service stopped notification");
            }

            await base.StopAsync(cancellationToken);
        }
    }
}