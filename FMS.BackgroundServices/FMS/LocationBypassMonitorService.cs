using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Communication.SignalR;
using FMS.Domain.Entities.Features.LocationValidation;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.FMS;

/// <summary>
/// Background service that monitors location validation bypasses for expiration.
/// When a bypass expires, it automatically deactivates it and notifies connected clients via SignalR.
/// This eliminates the need for clients to poll for bypass status.
/// </summary>
public class LocationBypassMonitorService : BackgroundService
{
    private readonly ILogger<LocationBypassMonitorService> _logger;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly IHubContext<DashboardHub> _hubContext;

    // Check every 10 seconds for expired bypasses
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(10);

    // Track last known state to avoid unnecessary broadcasts
    private bool _lastSystemBypassState = false;
    private DateTime? _lastSystemBypassExpiry = null;

    public LocationBypassMonitorService(
        ILogger<LocationBypassMonitorService> logger,
        IServiceScopeFactory serviceScopeFactory,
        IHubContext<DashboardHub> hubContext)
    {
        _logger = logger;
        _serviceScopeFactory = serviceScopeFactory;
        _hubContext = hubContext;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Location Bypass Monitor Service starting");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndExpireBypassesAsync(stoppingToken);
                await Task.Delay(_checkInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Location Bypass Monitor Service is stopping due to cancellation");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Location Bypass Monitor Service cycle");

                // Wait a bit before retrying on error
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        _logger.LogInformation("Location Bypass Monitor Service has stopped");
    }

    private async Task CheckAndExpireBypassesAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

        var now = DateTime.UtcNow;
        var statusChanged = false;
        var expiredBypasses = new List<ExpiredBypassInfo>();

        // 1. Check system-wide bypass (stored in SystemConfigurations)
        var systemBypassExpired = await CheckSystemBypassAsync(context, now, stoppingToken);
        if (systemBypassExpired)
        {
            statusChanged = true;
            expiredBypasses.Add(new ExpiredBypassInfo
            {
                Type = "All",
                Label = "System-wide bypass"
            });
        }

        // 2. Check vehicle-specific bypasses
        try
        {
            var expiredVehicleBypasses = await context.LocationValidationBypasses
                .Include(b => b.Vehicle)
                .Where(b => b.BypassType == BypassType.Vehicle &&
                            b.IsActive &&
                            b.CancelledAt == null &&
                            b.ExpiresAt != null &&
                            b.ExpiresAt <= now)
                .ToListAsync(stoppingToken);

            foreach (var bypass in expiredVehicleBypasses)
            {
                bypass.IsActive = false;
                bypass.CancelledAt = now;
                bypass.CancelledBy = "System (Expired)";

                expiredBypasses.Add(new ExpiredBypassInfo
                {
                    Type = "Vehicle",
                    Id = bypass.VehicleId ?? 0,
                    Label = bypass.Vehicle?.VehicleCode ?? $"Vehicle {bypass.VehicleId}"
                });

                _logger.LogInformation(
                    "Vehicle bypass expired for Vehicle {VehicleId} ({VehicleName})",
                    bypass.VehicleId, bypass.Vehicle?.VehicleCode);

                statusChanged = true;
            }
        }
        catch (Exception ex)
        {
            // Table might not exist yet
            _logger.LogDebug(ex, "Could not check vehicle bypasses - table may not exist");
        }

        // 3. Check user-specific bypasses
        try
        {
            var expiredUserBypasses = await context.LocationValidationBypasses
                .Where(b => b.BypassType == BypassType.User &&
                            b.IsActive &&
                            b.CancelledAt == null &&
                            b.ExpiresAt != null &&
                            b.ExpiresAt <= now)
                .ToListAsync(stoppingToken);

            foreach (var bypass in expiredUserBypasses)
            {
                bypass.IsActive = false;
                bypass.CancelledAt = now;
                bypass.CancelledBy = "System (Expired)";

                expiredBypasses.Add(new ExpiredBypassInfo
                {
                    Type = "User",
                    UserId = bypass.UserId ?? "",
                    Label = $"User {bypass.UserId}"
                });

                _logger.LogInformation(
                    "User bypass expired for User {UserId}",
                    bypass.UserId);

                statusChanged = true;
            }
        }
        catch (Exception ex)
        {
            // Table might not exist yet
            _logger.LogDebug(ex, "Could not check user bypasses - table may not exist");
        }

        // Save changes if any bypasses were deactivated
        if (statusChanged)
        {
            await context.SaveChangesAsync(stoppingToken);

            // Broadcast the updated status to all connected clients
            await BroadcastBypassStatusUpdateAsync(context, expiredBypasses, stoppingToken);
        }
    }

    private async Task<bool> CheckSystemBypassAsync(GpsdataContext context, DateTime now, CancellationToken stoppingToken)
    {
        const string BYPASS_ACTIVE_KEY = "FuelingRules.TemporaryBypass.IsActive";
        const string BYPASS_EXPIRES_KEY = "FuelingRules.TemporaryBypass.ExpiresAt";

        var configs = await context.SystemConfigurations
            .Where(c => c.ConfigurationKey.StartsWith("FuelingRules.TemporaryBypass."))
            .ToListAsync(stoppingToken);

        var isActiveConfig = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_ACTIVE_KEY);
        var expiresAtConfig = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_EXPIRES_KEY);

        if (isActiveConfig?.ConfigurationValue?.ToLower() != "true")
        {
            return false; // Not active, nothing to expire
        }

        // Check if there's an expiration time
        if (string.IsNullOrEmpty(expiresAtConfig?.ConfigurationValue))
        {
            return false; // Permanent bypass, no expiration
        }

        if (DateTime.TryParse(expiresAtConfig.ConfigurationValue, out var expiresAt))
        {
            if (expiresAt <= now)
            {
                // Bypass has expired - deactivate it
                isActiveConfig.ConfigurationValue = "false";
                isActiveConfig.UpdatedAt = now;

                _logger.LogInformation(
                    "System-wide location bypass has expired. Was set to expire at {ExpiresAt}",
                    expiresAt);

                return true;
            }
        }

        return false;
    }

    private async Task BroadcastBypassStatusUpdateAsync(
        GpsdataContext context,
        List<ExpiredBypassInfo> expiredBypasses,
        CancellationToken stoppingToken)
    {
        try
        {
            // Build the current status to broadcast
            var status = await BuildCurrentBypassStatusAsync(context, stoppingToken);

            // Broadcast to all connected clients
            await _hubContext.Clients.All.SendAsync(
                "LocationBypassStatusUpdate",
                new
                {
                    status,
                    expiredBypasses,
                    timestamp = DateTime.UtcNow,
                    message = expiredBypasses.Count == 1
                        ? $"{expiredBypasses[0].Label} has expired"
                        : $"{expiredBypasses.Count} bypasses have expired"
                },
                stoppingToken);

            _logger.LogInformation(
                "Broadcasted bypass status update to all clients. {Count} bypass(es) expired.",
                expiredBypasses.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting bypass status update");
        }
    }

    private async Task<object> BuildCurrentBypassStatusAsync(GpsdataContext context, CancellationToken stoppingToken)
    {
        const string BYPASS_ACTIVE_KEY = "FuelingRules.TemporaryBypass.IsActive";
        const string BYPASS_EXPIRES_KEY = "FuelingRules.TemporaryBypass.ExpiresAt";
        const string BYPASS_ENABLED_BY_KEY = "FuelingRules.TemporaryBypass.EnabledBy";
        const string BYPASS_REASON_KEY = "FuelingRules.TemporaryBypass.Reason";

        var now = DateTime.UtcNow;

        // Get system bypass status
        var configs = await context.SystemConfigurations
            .Where(c => c.ConfigurationKey.StartsWith("FuelingRules.TemporaryBypass."))
            .ToListAsync(stoppingToken);

        var isActive = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_ACTIVE_KEY)?.ConfigurationValue?.ToLower() == "true";
        var expiresAtStr = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_EXPIRES_KEY)?.ConfigurationValue;
        var enabledBy = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_ENABLED_BY_KEY)?.ConfigurationValue;
        var reason = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_REASON_KEY)?.ConfigurationValue;

        DateTime? expiresAt = null;
        if (!string.IsNullOrEmpty(expiresAtStr) && DateTime.TryParse(expiresAtStr, out var parsed))
        {
            expiresAt = parsed;
            // If expired, mark as not active
            if (expiresAt <= now) isActive = false;
        }

        // Get vehicle bypasses
        var vehicleBypasses = new List<object>();
        try
        {
            var activeBypasses = await context.LocationValidationBypasses
                .Include(b => b.Vehicle)
                .Where(b => b.BypassType == BypassType.Vehicle &&
                            b.IsActive &&
                            b.CancelledAt == null &&
                            (b.ExpiresAt == null || b.ExpiresAt > now))
                .ToListAsync(stoppingToken);

            vehicleBypasses = activeBypasses.Select(b => new
            {
                id = b.Id,
                vehicleId = b.VehicleId,
                vehicleName = b.Vehicle?.VehicleCode,
                vehicleCode = b.Vehicle?.VehicleCode,
                isActive = true,
                expiresAt = b.ExpiresAt,
                reason = b.Reason,
                enabledBy = b.EnabledBy,
                enabledAt = b.EnabledAt
            }).Cast<object>().ToList();
        }
        catch { /* Table may not exist */ }

        // Get user bypasses
        var userBypasses = new List<object>();
        try
        {
            var activeUserBypasses = await context.LocationValidationBypasses
                .Where(b => b.BypassType == BypassType.User &&
                            b.IsActive &&
                            b.CancelledAt == null &&
                            (b.ExpiresAt == null || b.ExpiresAt > now))
                .ToListAsync(stoppingToken);

            var userIds = activeUserBypasses.Select(b => b.UserId).Where(id => id != null).ToList();
            var users = await context.Users
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, stoppingToken);

            userBypasses = activeUserBypasses.Select(b => new
            {
                id = b.Id,
                userId = b.UserId,
                userName = b.UserId != null && users.TryGetValue(b.UserId, out var user) ? user.UserName : null,
                isActive = true,
                expiresAt = b.ExpiresAt,
                reason = b.Reason,
                enabledBy = b.EnabledBy,
                enabledAt = b.EnabledAt
            }).Cast<object>().ToList();
        }
        catch { /* Table may not exist */ }

        return new
        {
            isActive,
            expiresAt,
            enabledBy,
            reason,
            vehicleBypasses,
            userBypasses
        };
    }

    private class ExpiredBypassInfo
    {
        public string Type { get; set; } = "";
        public int Id { get; set; }
        public string UserId { get; set; } = "";
        public string Label { get; set; } = "";
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Location Bypass Monitor Service stopping");
        await base.StopAsync(cancellationToken);
    }
}
