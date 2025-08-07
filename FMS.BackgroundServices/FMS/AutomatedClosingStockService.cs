using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankStockCommand;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Notification;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Services;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.FMS {
    public class AutomatedClosingStockService : BackgroundService {
        private readonly ILogger<AutomatedClosingStockService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IConfiguration _configuration;

        public AutomatedClosingStockService (ILogger<AutomatedClosingStockService> logger, IServiceScopeFactory serviceScopeFactory, IConfiguration configuration, IMediator mediator) {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync (CancellationToken stoppingToken) {
            while (!stoppingToken.IsCancellationRequested) {
                _logger.LogInformation ("AutomatedClosingStockService running at: {time}", DateTimeOffset.Now);

                var now = DateTime.Now;
                var endOfShiftTime = TimeSpan.TryParse (_configuration["EndOfShiftTime"], out var parsedTime) ?
                    parsedTime :
                    new TimeSpan (18, 0, 0);
                var timeUntilEndOfShift = ((now.TimeOfDay > endOfShiftTime) ?
                    (endOfShiftTime + TimeSpan.FromDays (1)) :
                    endOfShiftTime) - now.TimeOfDay;

                await Task.Delay (timeUntilEndOfShift, stoppingToken);

                using (var scope = _serviceScopeFactory.CreateScope ()) {
                    var context = scope.ServiceProvider.GetRequiredService<GpsdataContext> ();
                    var mediator = scope.ServiceProvider.GetRequiredService<IMediator> ();
                    var notificationService = scope.ServiceProvider.GetService<INotificationService> ();

                    try {
                        await SendClosingStockExecutionStartNotificationAsync (notificationService, stoppingToken);

                        var tanks = await context.Tanks
                            .Where (t => t.UseBookKeeping == 1)
                            .Where (x => !x.TankVolumeHistories.Any (tvh =>
                                tvh.Timestamp.Date == DateTime.Now.Date &&
                                tvh.ChangeReason == VolumeChangeReasonEnum.ClosingStock))
                            .ToListAsync (stoppingToken);

                        var successCount = 0;
                        var failureCount = 0;

                        foreach (var tank in tanks) {
                            try {
                                var closingStock = await GetClosingStock (context, tank.Id, stoppingToken);
                                if (closingStock.HasValue) {
                                    await mediator.Send (new ClosingStockCommand (tank.Id, closingStock.Value, SystemConstants.SystemUser.UserId), stoppingToken);
                                    _logger.LogInformation ("Closing stock created for tank {TankId}", tank.Id);
                                    successCount++;
                                } else {
                                    _logger.LogWarning ("Unable to determine closing stock for tank {TankId}", tank.Id);
                                    failureCount++;

                                    await SendClosingStockErrorNotificationAsync (notificationService, tank, "Unable to determine closing stock", stoppingToken);
                                }
                            } catch (Exception ex) {
                                _logger.LogError (ex, "Error processing closing stock for tank {TankId}", tank.Id);
                                failureCount++;

                                await SendClosingStockErrorNotificationAsync (notificationService, tank, ex.Message, stoppingToken);
                            }
                        }

                        if (failureCount > 0 || successCount > 0) {
                            await SendClosingStockSummaryNotificationAsync (notificationService, successCount, failureCount, stoppingToken);
                        }
                    } catch (Exception ex) {
                        _logger.LogError (ex, "Critical error in AutomatedClosingStockService");

                        await SendClosingStockCriticalErrorNotificationAsync (notificationService, ex.Message, stoppingToken);
                    }
                }

                await Task.Delay (TimeSpan.FromMinutes (5), stoppingToken);
            }
        }

        private async Task<decimal?> GetClosingStock (GpsdataContext context, int tankId, CancellationToken stoppingToken) {
            var priorityList = _configuration.GetSection ("ClosingStockPriority").Get<List<string>> () ??
                new List<string> { "Sensor", "LastEntry", "CurrentVolume" };

            foreach (var priority in priorityList) {
                switch (priority) {
                    case "Sensor":
                        // Get latest sensor reading from tank measurements
                        var tank = await context.Tanks.FindAsync (new object[] { tankId }, stoppingToken);
                        if (tank?.PtsId != null) {
                            var latestMeasurement = await context.Tankmeasurements
                                .Where (tm => tm.Ptsid == tank.PtsId)
                                .OrderByDescending (tm => tm.DateTime)
                                .FirstOrDefaultAsync (stoppingToken);

                            if (latestMeasurement?.ProductVolume.HasValue == true && latestMeasurement.ProductVolume.Value > 0) {
                                // Use sensor reading if it's recent (within last 24 hours)
                                var measurementAge = DateTime.Now - latestMeasurement.DateTime;
                                if (measurementAge.TotalHours <= 24) {
                                    return (decimal) latestMeasurement.ProductVolume.Value;
                                }
                            }
                        }
                        break;

                    case "LastEntry":
                        var lastEntry = await context.TankVolumeHistories
                            .Where (x => x.TankId == tankId)
                            .OrderByDescending (x => x.Timestamp)
                            .FirstOrDefaultAsync (stoppingToken);

                        if (lastEntry != null) {
                            return lastEntry.NewVolume;
                        }
                        break;

                    case "CurrentVolume":
                        var tank2 = await context.Tanks.FindAsync (new object[] { tankId }, stoppingToken);
                        if (tank2?.CurrentStock.HasValue == true) {
                            return tank2.CurrentStock.Value;
                        }
                        break;
                }
            }

            return null;
        }

        private async Task SendClosingStockExecutionStartNotificationAsync (INotificationService notificationService, CancellationToken cancellationToken) {
            if (notificationService == null) return;

            try {
                var request = new CreateNotificationRequest {
                    Type = NotificationTypes.Info,
                    Category = NotificationCategories.System,
                    Priority = NotificationPriorities.Low,
                    Title = "Closing Stock Process Started",
                    Message = "Daily closing stock process has started",
                    TriggerSource = "AutomatedClosingStock",
                    TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy

                };

                await notificationService.CreateNotificationAsync (request, cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send closing stock execution start notification");
            }
        }

        private async Task SendClosingStockErrorNotificationAsync (INotificationService notificationService, Tank tank, string errorMessage, CancellationToken cancellationToken) {
            if (notificationService == null) return;

            try {
                var request = new CreateNotificationRequest {
                    Type = NotificationTypes.Info,
                    Category = NotificationCategories.ClosingStock,
                    Priority = NotificationPriorities.Medium,
                    Title = "Closing Stock Error",
                    Message = $"Error processing closing stock for tank {tank.Name}: {errorMessage}",
                    TriggerSource = "AutomatedClosingStock",
                    TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                    TankId = tank.Id,
                    SiteId = tank.SiteId

                };

                await notificationService.CreateNotificationAsync (request, cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send closing stock error notification for tank {TankId}", tank.Id);
            }
        }

        private async Task SendClosingStockSummaryNotificationAsync (INotificationService notificationService, int successCount, int failureCount, CancellationToken cancellationToken) {
            if (notificationService == null) return;

            try {
                var priority = failureCount > 0 ? "Medium" : "Low";
                var request = new CreateNotificationRequest {
                    Type = "Info",
                    Category = "ClosingStock",
                    Priority = priority,
                    Title = "Closing Stock Process Summary",
                    Message = $"Closing stock process completed. Success: {successCount}, Failed: {failureCount}",
                    TriggerSource = "AutomatedClosingStock",
                    TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy

                };

                await notificationService.CreateNotificationAsync (request, cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send closing stock summary notification");
            }
        }

        private async Task SendClosingStockCriticalErrorNotificationAsync (INotificationService notificationService, string errorMessage, CancellationToken cancellationToken) {
            if (notificationService == null) return;

            try {
                var request = new CreateNotificationRequest {
                    Type = "Alert",
                    Category = "System",
                    Priority = "Critical",
                    Title = "Critical Closing Stock Service Error",
                    Message = $"Automated Closing Stock Service encountered a critical error: {errorMessage}",
                    TriggerSource = "AutomatedClosingStock",
                    TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy

                };

                await notificationService.CreateNotificationAsync (request, cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send closing stock critical error notification");
            }
        }
    }
}