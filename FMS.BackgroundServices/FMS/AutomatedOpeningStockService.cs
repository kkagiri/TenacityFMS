using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankStockCommand;
using FMS.Application.Common.Constants;
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
    public class AutomatedOpeningStockService : BackgroundService {
        private readonly ILogger<AutomatedOpeningStockService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IConfiguration _configuration;

        public AutomatedOpeningStockService (ILogger<AutomatedOpeningStockService> logger, IServiceScopeFactory serviceScopeFactory, IConfiguration configuration) {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync (CancellationToken stoppingToken) {
            while (!stoppingToken.IsCancellationRequested) {
                _logger.LogInformation ("AutomatedOpeningStockService running at: {time}", DateTimeOffset.Now);

                var now = DateTime.Now;
                var startOfShiftTime = TimeSpan.TryParse (_configuration["StartOfShiftTime"], out var parsedTime) ?
                    parsedTime :
                    new TimeSpan (6, 0, 0); // Default to 6:00 AM if not specified
                var timeUntilStartOfShift = ((now.TimeOfDay > startOfShiftTime) ?
                    (startOfShiftTime + TimeSpan.FromDays (1)) :
                    startOfShiftTime) - now.TimeOfDay;

                await Task.Delay (timeUntilStartOfShift, stoppingToken);

                using (var scope = _serviceScopeFactory.CreateScope ()) {
                    var context = scope.ServiceProvider.GetRequiredService<GpsdataContext> ();
                    var mediator = scope.ServiceProvider.GetRequiredService<IMediator> ();
                    var notificationService = scope.ServiceProvider.GetService<INotificationService> ();

                    try {
                        var tanks = await context.Tanks.Where (t => t.UseBookKeeping == 1).ToListAsync (stoppingToken);

                        var successCount = 0;
                        var failureCount = 0;

                        foreach (var tank in tanks) {
                            try {
                                var openingStock = await GetOpeningStock (context, tank.Id, stoppingToken);
                                if (openingStock.HasValue) {
                                    await mediator.Send (new OpeningStockCommand (tank.Id, openingStock.Value, SystemConstants.SystemUser.UserId), stoppingToken);
                                    _logger.LogInformation ("Opening stock created for tank {TankId}", tank.Id);
                                    successCount++;
                                } else {
                                    _logger.LogWarning ("Unable to determine opening stock for tank {TankId}", tank.Id);
                                    failureCount++;

                                    await SendOpeningStockErrorNotificationAsync (notificationService, tank, "Unable to determine opening stock", stoppingToken);
                                }
                            } catch (Exception ex) {
                                _logger.LogError (ex, "Error processing opening stock for tank {TankId}", tank.Id);
                                failureCount++;

                                await SendOpeningStockErrorNotificationAsync (notificationService, tank, ex.Message, stoppingToken);
                            }
                        }

                        if (failureCount > 0 || successCount > 0) {
                            await SendOpeningStockSummaryNotificationAsync (notificationService, successCount, failureCount, stoppingToken);
                        }
                    } catch (Exception ex) {
                        _logger.LogError (ex, "Critical error in AutomatedOpeningStockService");

                        await SendOpeningStockCriticalErrorNotificationAsync (notificationService, ex.Message, stoppingToken);
                    }
                }
            }
        }

        private async Task<decimal?> GetOpeningStock (GpsdataContext context, int tankId, CancellationToken stoppingToken) {
            var priorityList = _configuration.GetSection ("OpeningStockPriority").Get<List<string>> () ??
                new List<string> { "Sensor", "ClosingStock", "CurrentVolume" };

            foreach (var priority in priorityList) {
                switch (priority) {
                    case "Sensor":
                        // Implement sensor reading logic here
                        // For now, we'll skip this as it's not implemented
                        break;

                    case "ClosingStock":
                        var lastClosingStock = await context.TankVolumeHistories
                            .Where (x => x.TankId == tankId &&
                                x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                            .OrderByDescending (x => x.Timestamp)
                            .FirstOrDefaultAsync (stoppingToken);

                        if (lastClosingStock != null) {
                            return lastClosingStock.NewVolume;
                        }
                        break;

                    case "CurrentVolume":
                        var tank = await context.Tanks.FindAsync (new object[] { tankId }, stoppingToken);
                        if (tank?.CurrentStock.HasValue == true) {
                            return tank.CurrentStock.Value;
                        }
                        break;
                }
            }

            return null;
        }

        private async Task SendOpeningStockErrorNotificationAsync (INotificationService notificationService, Tank tank, string errorMessage, CancellationToken cancellationToken) {
            if (notificationService == null) return;

            try {
                var request = new CreateNotificationRequest {
                    Type = "Alert",
                    Category = "OpeningStock",
                    Priority = "Medium",
                    Title = "Opening Stock Error",
                    Message = $"Error processing opening stock for tank {tank.Name}: {errorMessage}",
                    TriggerSource = "AutomatedOpeningStock",
                    TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                    TankId = tank.Id,
                    SiteId = tank.SiteId,
                    Recipients = new List<CreateNotificationRecipientRequest> {
                    new CreateNotificationRecipientRequest {
                    UserId = "fuel-operations",
                    DeliveryMethods = new List<string> { SystemConstants.Notifications.SystemDeliveryMethod, "Email" }
                    }
                    }
                };

                await notificationService.CreateNotificationAsync (request, cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send opening stock error notification for tank {TankId}", tank.Id);
            }
        }

        private async Task SendOpeningStockSummaryNotificationAsync (INotificationService notificationService, int successCount, int failureCount, CancellationToken cancellationToken) {
            if (notificationService == null) return;

            try {
                var priority = failureCount > 0 ? "Medium" : "Low";
                var request = new CreateNotificationRequest {
                    Type = "Info",
                    Category = "OpeningStock",
                    Priority = priority,
                    Title = "Opening Stock Process Summary",
                    Message = $"Opening stock process completed. Success: {successCount}, Failed: {failureCount}",
                    TriggerSource = "AutomatedOpeningStock",
                    TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                    Recipients = new List<CreateNotificationRecipientRequest> {
                    new CreateNotificationRecipientRequest {
                    UserId = "fuel-operations",
                    DeliveryMethods = new List<string> { SystemConstants.Notifications.SystemDeliveryMethod }
                    }
                    }
                };

                await notificationService.CreateNotificationAsync (request, cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send opening stock summary notification");
            }
        }

        private async Task SendOpeningStockCriticalErrorNotificationAsync (INotificationService notificationService, string errorMessage, CancellationToken cancellationToken) {
            if (notificationService == null) return;

            try {
                var request = new CreateNotificationRequest {
                    Type = "Alert",
                    Category = "System",
                    Priority = "Critical",
                    Title = "Critical Opening Stock Service Error",
                    Message = $"Automated Opening Stock Service encountered a critical error: {errorMessage}",
                    TriggerSource = "AutomatedOpeningStock",
                    TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                    Recipients = new List<CreateNotificationRecipientRequest> {
                    new CreateNotificationRecipientRequest {
                    UserId = SystemConstants.SystemAdministrator.UserId,
                    DeliveryMethods = new List<string> { SystemConstants.Notifications.SystemDeliveryMethod, "Email", "SMS" }
                    }
                    }
                };

                await notificationService.CreateNotificationAsync (request, cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send opening stock critical error notification");
            }
        }
    }
}