// using System;
// using System.Threading;
// using System.Threading.Tasks;
// using FMS.Application.Communication.Redis;
// using Microsoft.Extensions.DependencyInjection;
// using Microsoft.Extensions.Hosting;
// using Microsoft.Extensions.Logging;

// namespace FMS.Application.Features.AutomatedReconciliation.Services;

// //Cursor - Background service that listens for Redis policy trigger events
// public class PolicyTriggerBackgroundService : BackgroundService
// {
//     private readonly IServiceProvider _serviceProvider;
//     private readonly ILogger<PolicyTriggerBackgroundService> _logger;

//     public PolicyTriggerBackgroundService(
//         IServiceProvider serviceProvider,
//         ILogger<PolicyTriggerBackgroundService> logger)
//     {
//         _serviceProvider = serviceProvider;
//         _logger = logger;
//     }

//     protected override async Task ExecuteAsync(CancellationToken stoppingToken)
//     {
//         _logger.LogInformation("PolicyTriggerBackgroundService starting");

//         try
//         {
//             using var scope = _serviceProvider.CreateScope();
//             var policyTriggerService = scope.ServiceProvider.GetService<IPolicyTriggerService>();

//             if (policyTriggerService != null)
//             {
//                 await policyTriggerService.SubscribeToPolicyTriggersAsync(stoppingToken);
//                 _logger.LogInformation("Successfully subscribed to policy trigger events");

//                 // Keep the service running
//                 while (!stoppingToken.IsCancellationRequested)
//                 {
//                     await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
//                 }
//             }
//             else
//             {
//                 _logger.LogWarning("IPolicyTriggerService not available, skipping Redis subscription");
//             }
//         }
//         catch (OperationCanceledException)
//         {
//             _logger.LogInformation("PolicyTriggerBackgroundService stopping due to cancellation");
//         }
//         catch (Exception ex)
//         {
//             _logger.LogError(ex, "Error in PolicyTriggerBackgroundService: {Message}", ex.Message);
//         }
//     }

//     public override async Task StopAsync(CancellationToken cancellationToken)
//     {
//         _logger.LogInformation("PolicyTriggerBackgroundService stopping");
//         await base.StopAsync(cancellationToken);
//     }
// }