// using System;
// using System.Threading;
// using System.Threading.Tasks;
// using FMS.Application.Features.AutomatedReconciliation.Services;
// using Microsoft.Extensions.Configuration;
// using Microsoft.Extensions.DependencyInjection;
// using Microsoft.Extensions.Hosting;
// using Microsoft.Extensions.Logging;

// namespace FMS.BackgroundServices.FMS {
//     /// <summary>
//     /// Background service that runs automated reconciliation cycles on a configurable schedule
//     /// </summary>
//     public class AutomatedReconciliationBackgroundService : BackgroundService {
//         private readonly ILogger<AutomatedReconciliationBackgroundService> _logger;
//         private readonly IServiceScopeFactory _serviceScopeFactory;
//         private readonly IConfiguration _configuration;

//         // Default execution interval (can be overridden in configuration)
//         private readonly TimeSpan _defaultExecutionInterval = TimeSpan.FromMinutes (15);

//         public AutomatedReconciliationBackgroundService (
//             ILogger<AutomatedReconciliationBackgroundService> logger,
//             IServiceScopeFactory serviceScopeFactory,
//             IConfiguration configuration) {
//             _logger = logger;
//             _serviceScopeFactory = serviceScopeFactory;
//             _configuration = configuration;
//         }

//         protected override async Task ExecuteAsync (CancellationToken stoppingToken) {
//             _logger.LogInformation ("Automated Reconciliation Background Service starting");

//             // Get execution interval from configuration or use default
//             var executionInterval = GetExecutionInterval ();
//             _logger.LogInformation ("Automated reconciliation will run every {Interval}", executionInterval);

//             while (!stoppingToken.IsCancellationRequested) {
//                 try {
//                     _logger.LogDebug ("Starting automated reconciliation cycle");

//                     using (var scope = _serviceScopeFactory.CreateScope ()) {
//                         var automatedReconciliationService = scope.ServiceProvider
//                             .GetRequiredService<AutomatedReconciliationService> ();

//                         var cycleResult = await automatedReconciliationService
//                             .ExecuteReconciliationCycleAsync (stoppingToken);

//                         LogCycleResults (cycleResult);
//                     }

//                     _logger.LogDebug ("Automated reconciliation cycle completed. Next cycle in {Interval}", executionInterval);
//                 } catch (OperationCanceledException) {
//                     _logger.LogInformation ("Automated reconciliation service is stopping due to cancellation");
//                     break;
//                 } catch (Exception ex) {
//                     _logger.LogError (ex, "Error during automated reconciliation cycle");

//                     // Continue running even if a cycle fails
//                     // Wait a shorter interval before retrying after an error
//                     var retryInterval = TimeSpan.FromMinutes (5);
//                     _logger.LogInformation ("Will retry automated reconciliation in {RetryInterval}", retryInterval);

//                     try {
//                         await Task.Delay (retryInterval, stoppingToken);
//                         continue;
//                     } catch (OperationCanceledException) {
//                         break;
//                     }
//                 }

//                 try {
//                     await Task.Delay (executionInterval, stoppingToken);
//                 } catch (OperationCanceledException) {
//                     _logger.LogInformation ("Automated reconciliation service stopping");
//                     break;
//                 }
//             }

//             _logger.LogInformation ("Automated Reconciliation Background Service stopped");
//         }

//         /// <summary>
//         /// Gets the execution interval from configuration
//         /// </summary>
//         private TimeSpan GetExecutionInterval () {
//             var configValue = _configuration["AutomatedReconciliation:ExecutionIntervalMinutes"];

//             if (string.IsNullOrEmpty (configValue)) {
//                 _logger.LogDebug ("No execution interval configured, using default: {DefaultInterval}", _defaultExecutionInterval);
//                 return _defaultExecutionInterval;
//             }

//             if (int.TryParse (configValue, out var intervalMinutes) && intervalMinutes > 0) {
//                 var interval = TimeSpan.FromMinutes (intervalMinutes);
//                 _logger.LogInformation ("Using configured execution interval: {Interval}", interval);
//                 return interval;
//             }

//             _logger.LogWarning ("Invalid execution interval configuration '{ConfigValue}', using default: {DefaultInterval}",
//                 configValue, _defaultExecutionInterval);
//             return _defaultExecutionInterval;
//         }

//         /// <summary>
//         /// Logs the results of a reconciliation cycle
//         /// </summary>
//         private void LogCycleResults (ReconciliationCycleResult result) {
//             if (result.ProcessedPolicies == 0)
//             {
//                 _logger.LogDebug("Cycle completed - no policies required execution");
//                 return;
//             }

//             var logLevel = result.FailedPolicies > 0 ? LogLevel.Warning : LogLevel.Information;

//             _logger.Log(logLevel,
//                 "Reconciliation cycle summary: " +
//                 "Duration: {Duration}ms, " +
//                 "Processed Policies: {ProcessedPolicies}, " +
//                 "Successful: {SuccessfulPolicies}, " +
//                 "Failed: {FailedPolicies}, " +
//                 "Success Rate: {SuccessRate:F1}%",
//                 result.Duration.TotalMilliseconds,
//                 result.ProcessedPolicies,
//                 result.SuccessfulPolicies,
//                 result.FailedPolicies,
//                 result.ProcessedPolicies > 0 ? (result.SuccessfulPolicies * 100.0 / result.ProcessedPolicies) : 0);

//             // Log individual policy results if there were failures
//             if (result.FailedPolicies > 0)
//             {
//                 foreach (var policyResult in result.PolicyResults)
//                 {
//                     if (!policyResult.Success)
//                     {
//                         _logger.LogWarning("Policy {PolicyId} execution failed: {Error}",
//                             policyResult.PolicyId,
//                             policyResult.ErrorMessage);
//                     }
//                 }
//             }

//             // Log summary of discrepancies if any were found
//             var totalDiscrepanciesFound = result.PolicyResults.Sum(p => p.DiscrepanciesFound);
//             var totalDiscrepanciesResolved = result.PolicyResults.Sum(p => p.DiscrepanciesResolved);

//             if (totalDiscrepanciesFound > 0)
//             {
//                 _logger.LogInformation("Total discrepancies found: {Found}, resolved: {Resolved}",
//                     totalDiscrepanciesFound, totalDiscrepanciesResolved);
//             }
//         }

//         public override async Task StopAsync (CancellationToken cancellationToken) {
//             _logger.LogInformation ("Automated Reconciliation Background Service is stopping");
//             await base.StopAsync (cancellationToken);
//         }
//     }
// }