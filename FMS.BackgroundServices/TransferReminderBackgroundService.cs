/**
 * File: TransferReminderBackgroundService.cs
 * Purpose: Background hosted service that sends daily reminders for InTransit vehicle transfers.
 * Dependencies: IVehicleTransferNotificationService, IServiceScopeFactory
 * Last Modified: 2026-02-27
 *
 * Key Components:
 * - ExecuteAsync(): Runs every 6 hours, calls SendInTransitRemindersAsync.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTransfer.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices;

public class TransferReminderBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TransferReminderBackgroundService> _logger;

    /// <summary>
    /// Interval between reminder checks (6 hours).
    /// The notification service itself enforces the 24-hour per-transfer cooldown.
    /// </summary>
    private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(6);

    public TransferReminderBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<TransferReminderBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TransferReminderBackgroundService started. Check interval: {Interval}", CheckInterval);

        // Initial delay to let the app fully start up
        await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<IVehicleTransferNotificationService>();

                _logger.LogDebug("Running InTransit transfer reminder check...");
                var result = await notificationService.SendInTransitRemindersAsync(stoppingToken);

                if (result.IsSuccess)
                {
                    _logger.LogInformation("InTransit reminder check complete. {Count} reminders sent.", result.Data);
                }
                else
                {
                    _logger.LogWarning("InTransit reminder check failed: {Message}", result.Message);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Normal shutdown
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in TransferReminderBackgroundService");
            }

            try
            {
                await Task.Delay(CheckInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("TransferReminderBackgroundService stopped.");
    }
}
