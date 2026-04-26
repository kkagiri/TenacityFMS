using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Application.Features.Geofence.Services;
using FMS.Domain.Entities.Features.LocationValidation;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Geofence.Commands;

/// <summary>
/// Command to enable temporary location validation bypass.
/// Supports system-wide, vehicle-specific, and user-specific bypasses.
/// </summary>
public class EnableTemporaryBypassCommand : IRequest<FMSResponse<TemporaryBypassStatusDTO>>
{
    public int? DurationMinutes { get; set; } = 5;
    public string? Reason { get; set; }
    public string EnabledBy { get; set; } = "system";

    /// <summary>
    /// Type of bypass: 'All', 'Vehicle', 'User'
    /// </summary>
    public string BypassType { get; set; } = "All";

    /// <summary>
    /// Vehicle IDs for vehicle-specific bypass
    /// </summary>
    public List<int>? VehicleIds { get; set; }

    /// <summary>
    /// User IDs for user-specific bypass
    /// </summary>
    public List<string>? UserIds { get; set; }
}

/// <summary>
/// Handler for EnableTemporaryBypassCommand
/// </summary>
public class EnableTemporaryBypassCommandHandler : IRequestHandler<EnableTemporaryBypassCommand, FMSResponse<TemporaryBypassStatusDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<EnableTemporaryBypassCommandHandler> _logger;
    private readonly ILocationBypassNotificationService? _notificationService;

    // Configuration keys for temporary bypass
    private const string BYPASS_ACTIVE_KEY = "FuelingRules.TemporaryBypass.IsActive";
    private const string BYPASS_EXPIRES_KEY = "FuelingRules.TemporaryBypass.ExpiresAt";
    private const string BYPASS_ENABLED_BY_KEY = "FuelingRules.TemporaryBypass.EnabledBy";
    private const string BYPASS_ENABLED_AT_KEY = "FuelingRules.TemporaryBypass.EnabledAt";
    private const string BYPASS_REASON_KEY = "FuelingRules.TemporaryBypass.Reason";

    public EnableTemporaryBypassCommandHandler(
        GpsdataContext context,
        ILogger<EnableTemporaryBypassCommandHandler> logger,
        ILocationBypassNotificationService? notificationService = null)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
    }

    public async Task<FMSResponse<TemporaryBypassStatusDTO>> Handle(EnableTemporaryBypassCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validate duration (1-120 minutes, or null for permanent)
            if (request.DurationMinutes.HasValue && (request.DurationMinutes < 1 || request.DurationMinutes > 120))
            {
                return FMSResponse<TemporaryBypassStatusDTO>.Failed("Duration must be between 1 and 120 minutes");
            }

            var now = DateTime.UtcNow;
            DateTime? expiresAt = request.DurationMinutes.HasValue
                ? now.AddMinutes(request.DurationMinutes.Value)
                : null;

            // Handle based on bypass type
            switch (request.BypassType?.ToLower())
            {
                case "vehicle":
                    return await EnableVehicleBypassAsync(request, now, expiresAt, cancellationToken);

                case "user":
                    return await EnableUserBypassAsync(request, now, expiresAt, cancellationToken);

                case "all":
                default:
                    return await EnableSystemBypassAsync(request, now, expiresAt, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enabling temporary bypass");
            return FMSResponse<TemporaryBypassStatusDTO>.Failed($"Failed to enable temporary bypass: {ex.Message}");
        }
    }

    private async Task<FMSResponse<TemporaryBypassStatusDTO>> EnableSystemBypassAsync(
        EnableTemporaryBypassCommand request,
        DateTime now,
        DateTime? expiresAt,
        CancellationToken cancellationToken)
    {
        // Update or create system configurations
        await UpdateOrCreateConfig(BYPASS_ACTIVE_KEY, "true", cancellationToken);
        await UpdateOrCreateConfig(BYPASS_EXPIRES_KEY, expiresAt?.ToString("O") ?? "", cancellationToken);
        await UpdateOrCreateConfig(BYPASS_ENABLED_BY_KEY, request.EnabledBy, cancellationToken);
        await UpdateOrCreateConfig(BYPASS_ENABLED_AT_KEY, now.ToString("O"), cancellationToken);
        await UpdateOrCreateConfig(BYPASS_REASON_KEY, request.Reason ?? "", cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogWarning(
            "SYSTEM-WIDE location bypass ENABLED by {EnabledBy} for {Duration} minutes. Reason: {Reason}. Expires at: {ExpiresAt}",
            request.EnabledBy,
            request.DurationMinutes ?? -1,
            request.Reason ?? "No reason provided",
            expiresAt?.ToString() ?? "Never");

        var status = new TemporaryBypassStatusDTO
        {
            IsActive = true,
            ExpiresAt = expiresAt,
            EnabledBy = request.EnabledBy,
            EnabledAt = now,
            Reason = request.Reason
        };

        var message = request.DurationMinutes.HasValue
            ? $"System-wide bypass enabled for {request.DurationMinutes} minutes"
            : "System-wide bypass enabled (permanent until cancelled)";

        // Broadcast status update via SignalR
        if (_notificationService != null)
        {
            await _notificationService.BroadcastBypassStatusAsync(status, "enabled", message);
        }

        return FMSResponse<TemporaryBypassStatusDTO>.Success(status, message);
    }

    private async Task<FMSResponse<TemporaryBypassStatusDTO>> EnableVehicleBypassAsync(
        EnableTemporaryBypassCommand request,
        DateTime now,
        DateTime? expiresAt,
        CancellationToken cancellationToken)
    {
        if (request.VehicleIds == null || !request.VehicleIds.Any())
        {
            return FMSResponse<TemporaryBypassStatusDTO>.ValidationFailed(
                new List<string> { "At least one vehicle ID is required for vehicle-specific bypass" });
        }

        var vehicleBypasses = new List<VehicleBypassDTO>();

        foreach (var vehicleId in request.VehicleIds)
        {
            // Check if vehicle exists
            var vehicle = await _context.Vehicles
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.VehicleId == vehicleId, cancellationToken);

            if (vehicle == null)
            {
                _logger.LogWarning("Vehicle {VehicleId} not found for bypass", vehicleId);
                continue;
            }

            // Deactivate any existing active bypass for this vehicle
            var existingBypass = await _context.LocationValidationBypasses
                .FirstOrDefaultAsync(b => b.VehicleId == vehicleId && b.IsActive && b.CancelledAt == null, cancellationToken);

            if (existingBypass != null)
            {
                existingBypass.IsActive = false;
                existingBypass.CancelledAt = now;
                existingBypass.CancelledBy = request.EnabledBy;
            }

            // Create new bypass
            var bypass = new LocationValidationBypass
            {
                BypassType = Domain.Entities.Features.LocationValidation.BypassType.Vehicle,
                VehicleId = vehicleId,
                IsActive = true,
                ExpiresAt = expiresAt,
                Reason = request.Reason,
                EnabledBy = request.EnabledBy,
                EnabledAt = now
            };

            _context.LocationValidationBypasses.Add(bypass);

            vehicleBypasses.Add(new VehicleBypassDTO
            {
                VehicleId = vehicleId,
                VehicleName = vehicle.VehicleCode, // Vehicle entity uses VehicleCode as name
                VehicleCode = vehicle.VehicleCode,
                IsActive = true,
                ExpiresAt = expiresAt,
                Reason = request.Reason,
                EnabledBy = request.EnabledBy,
                EnabledAt = now
            });

            _logger.LogWarning(
                "VEHICLE-SPECIFIC location bypass ENABLED for Vehicle {VehicleId} ({VehicleName}) by {EnabledBy}. Reason: {Reason}. Expires at: {ExpiresAt}",
                vehicleId, vehicle.VehicleCode, request.EnabledBy, request.Reason ?? "No reason provided", expiresAt?.ToString() ?? "Never");
        }

        await _context.SaveChangesAsync(cancellationToken);

        var status = new TemporaryBypassStatusDTO
        {
            IsActive = false, // System bypass not active
            VehicleBypasses = vehicleBypasses
        };

        var message = $"Bypass enabled for {vehicleBypasses.Count} vehicle(s)";

        // Broadcast status update via SignalR
        if (_notificationService != null)
        {
            await _notificationService.BroadcastBypassStatusAsync(status, "enabled", message);
        }

        return FMSResponse<TemporaryBypassStatusDTO>.Success(status, message);
    }

    private async Task<FMSResponse<TemporaryBypassStatusDTO>> EnableUserBypassAsync(
        EnableTemporaryBypassCommand request,
        DateTime now,
        DateTime? expiresAt,
        CancellationToken cancellationToken)
    {
        if (request.UserIds == null || !request.UserIds.Any())
        {
            return FMSResponse<TemporaryBypassStatusDTO>.ValidationFailed(
                new List<string> { "At least one user ID is required for user-specific bypass" });
        }

        var userBypasses = new List<UserBypassDTO>();

        foreach (var userId in request.UserIds)
        {
            // Check if user exists
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user == null)
            {
                _logger.LogWarning("User {UserId} not found for bypass", userId);
                continue;
            }

            // Deactivate any existing active bypass for this user
            var existingBypass = await _context.LocationValidationBypasses
                .FirstOrDefaultAsync(b => b.UserId == userId && b.IsActive && b.CancelledAt == null, cancellationToken);

            if (existingBypass != null)
            {
                existingBypass.IsActive = false;
                existingBypass.CancelledAt = now;
                existingBypass.CancelledBy = request.EnabledBy;
            }

            // Create new bypass
            var bypass = new LocationValidationBypass
            {
                BypassType = Domain.Entities.Features.LocationValidation.BypassType.User,
                UserId = userId,
                IsActive = true,
                ExpiresAt = expiresAt,
                Reason = request.Reason,
                EnabledBy = request.EnabledBy,
                EnabledAt = now
            };

            _context.LocationValidationBypasses.Add(bypass);

            userBypasses.Add(new UserBypassDTO
            {
                UserId = userId,
                UserName = user.UserName,
                FullName = user.UserName, // User entity doesn't have FullName property
                IsActive = true,
                ExpiresAt = expiresAt,
                Reason = request.Reason,
                EnabledBy = request.EnabledBy,
                EnabledAt = now
            });

            _logger.LogWarning(
                "USER-SPECIFIC location bypass ENABLED for User {UserId} ({UserName}) by {EnabledBy}. Reason: {Reason}. Expires at: {ExpiresAt}",
                userId, user.UserName, request.EnabledBy, request.Reason ?? "No reason provided", expiresAt?.ToString() ?? "Never");
        }

        await _context.SaveChangesAsync(cancellationToken);

        var status = new TemporaryBypassStatusDTO
        {
            IsActive = false, // System bypass not active
            UserBypasses = userBypasses
        };

        var message = $"Bypass enabled for {userBypasses.Count} user(s)";

        // Broadcast status update via SignalR
        if (_notificationService != null)
        {
            await _notificationService.BroadcastBypassStatusAsync(status, "enabled", message);
        }

        return FMSResponse<TemporaryBypassStatusDTO>.Success(status, message);
    }

    private async Task UpdateOrCreateConfig(string key, string value, CancellationToken cancellationToken)
    {
        var config = await _context.SystemConfigurations
            .FirstOrDefaultAsync(c => c.ConfigurationKey == key, cancellationToken);

        if (config != null)
        {
            config.ConfigurationValue = value;
            config.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.SystemConfigurations.Add(new global::FMS.Domain.Entities.SystemConfiguration
            {
                ConfigurationKey = key,
                ConfigurationValue = value,
                Category = "FuelingRules",
                Description = key.Contains("IsActive") ? "Whether temporary bypass is active" :
                              key.Contains("ExpiresAt") ? "When the temporary bypass expires" :
                              key.Contains("EnabledBy") ? "Who enabled the temporary bypass" :
                              key.Contains("EnabledAt") ? "When the temporary bypass was enabled" :
                              "Reason for the temporary bypass",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }
    }
}

/// <summary>
/// Command to cancel temporary location validation bypass
/// </summary>
public class CancelTemporaryBypassCommand : IRequest<FMSResponse<bool>>
{
    public string CancelledBy { get; set; } = "system";
}

/// <summary>
/// Handler for CancelTemporaryBypassCommand
/// </summary>
public class CancelTemporaryBypassCommandHandler : IRequestHandler<CancelTemporaryBypassCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CancelTemporaryBypassCommandHandler> _logger;
    private readonly ILocationBypassNotificationService? _notificationService;

    private const string BYPASS_ACTIVE_KEY = "FuelingRules.TemporaryBypass.IsActive";

    public CancelTemporaryBypassCommandHandler(
        GpsdataContext context,
        ILogger<CancelTemporaryBypassCommandHandler> logger,
        ILocationBypassNotificationService? notificationService = null)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
    }

    public async Task<FMSResponse<bool>> Handle(CancelTemporaryBypassCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var config = await _context.SystemConfigurations
                .FirstOrDefaultAsync(c => c.ConfigurationKey == BYPASS_ACTIVE_KEY, cancellationToken);

            if (config != null)
            {
                config.ConfigurationValue = "false";
                config.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
            }

            _logger.LogInformation("Temporary location bypass CANCELLED by {CancelledBy}", request.CancelledBy);

            // Broadcast status update via SignalR
            if (_notificationService != null)
            {
                var status = new TemporaryBypassStatusDTO { IsActive = false };
                await _notificationService.BroadcastBypassStatusAsync(status, "cancelled", "System-wide bypass has been cancelled");
            }

            return FMSResponse<bool>.Success(true, "Temporary bypass has been cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling temporary bypass");
            return FMSResponse<bool>.Failed($"Failed to cancel temporary bypass: {ex.Message}");
        }
    }
}

/// <summary>
/// Command to cancel a specific bypass by ID
/// </summary>
public class CancelBypassByIdCommand : IRequest<FMSResponse<bool>>
{
    public int BypassId { get; set; }
    public string CancelledBy { get; set; } = "system";
}

/// <summary>
/// Handler for CancelBypassByIdCommand
/// </summary>
public class CancelBypassByIdCommandHandler : IRequestHandler<CancelBypassByIdCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CancelBypassByIdCommandHandler> _logger;
    private readonly ILocationBypassNotificationService? _notificationService;

    public CancelBypassByIdCommandHandler(
        GpsdataContext context,
        ILogger<CancelBypassByIdCommandHandler> logger,
        ILocationBypassNotificationService? notificationService = null)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
    }

    public async Task<FMSResponse<bool>> Handle(CancelBypassByIdCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var bypass = await _context.LocationValidationBypasses
                .FirstOrDefaultAsync(b => b.Id == request.BypassId, cancellationToken);

            if (bypass == null)
            {
                return FMSResponse<bool>.Failed($"Bypass with ID {request.BypassId} not found");
            }

            var bypassType = bypass.BypassType;
            var targetId = bypass.VehicleId?.ToString() ?? bypass.UserId ?? "unknown";

            // Remove the bypass
            _context.LocationValidationBypasses.Remove(bypass);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Bypass ID {BypassId} ({BypassType} for {TargetId}) CANCELLED by {CancelledBy}",
                request.BypassId, bypassType, targetId, request.CancelledBy);

            // Broadcast status update via SignalR
            if (_notificationService != null)
            {
                var status = new TemporaryBypassStatusDTO { IsActive = false };
                await _notificationService.BroadcastBypassStatusAsync(status, "cancelled", $"Bypass for {bypassType} {targetId} has been cancelled");
            }

            return FMSResponse<bool>.Success(true, "Bypass has been cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling bypass ID {BypassId}", request.BypassId);
            return FMSResponse<bool>.Failed($"Failed to cancel bypass: {ex.Message}");
        }
    }
}
