using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Domain.Entities.Features.LocationValidation;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Geofence.Queries;

/// <summary>
/// Query to get the current temporary bypass status (including vehicle and user-specific bypasses)
/// </summary>
public class GetTemporaryBypassStatusQuery : IRequest<FMSResponse<TemporaryBypassStatusDTO>>
{
}

/// <summary>
/// Handler for GetTemporaryBypassStatusQuery
/// </summary>
public class GetTemporaryBypassStatusQueryHandler : IRequestHandler<GetTemporaryBypassStatusQuery, FMSResponse<TemporaryBypassStatusDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetTemporaryBypassStatusQueryHandler> _logger;

    // Configuration keys for temporary bypass
    private const string BYPASS_ACTIVE_KEY = "FuelingRules.TemporaryBypass.IsActive";
    private const string BYPASS_EXPIRES_KEY = "FuelingRules.TemporaryBypass.ExpiresAt";
    private const string BYPASS_ENABLED_BY_KEY = "FuelingRules.TemporaryBypass.EnabledBy";
    private const string BYPASS_ENABLED_AT_KEY = "FuelingRules.TemporaryBypass.EnabledAt";
    private const string BYPASS_REASON_KEY = "FuelingRules.TemporaryBypass.Reason";

    public GetTemporaryBypassStatusQueryHandler(GpsdataContext context, ILogger<GetTemporaryBypassStatusQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<TemporaryBypassStatusDTO>> Handle(GetTemporaryBypassStatusQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var status = new TemporaryBypassStatusDTO
            {
                IsActive = false,
                ExpiresAt = null,
                EnabledBy = null,
                EnabledAt = null,
                Reason = null,
                VehicleBypasses = new List<VehicleBypassDTO>(),
                UserBypasses = new List<UserBypassDTO>()
            };

            // Get system-wide bypass status
            await GetSystemBypassStatusAsync(status, cancellationToken);

            // Get vehicle-specific bypasses
            await GetVehicleBypassesAsync(status, cancellationToken);

            // Get user-specific bypasses
            await GetUserBypassesAsync(status, cancellationToken);

            return FMSResponse<TemporaryBypassStatusDTO>.Success(status, "Bypass status retrieved");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting temporary bypass status");
            return FMSResponse<TemporaryBypassStatusDTO>.Failed($"Failed to get bypass status: {ex.Message}");
        }
    }

    private async Task GetSystemBypassStatusAsync(TemporaryBypassStatusDTO status, CancellationToken cancellationToken)
    {
        var configs = await _context.SystemConfigurations
            .Where(c => c.ConfigurationKey.StartsWith("FuelingRules.TemporaryBypass."))
            .ToListAsync(cancellationToken);

        var isActiveConfig = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_ACTIVE_KEY);
        if (isActiveConfig?.ConfigurationValue?.ToLower() == "true")
        {
            var expiresAtConfig = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_EXPIRES_KEY);

            // Check for permanent bypass (no expiration)
            if (string.IsNullOrEmpty(expiresAtConfig?.ConfigurationValue))
            {
                status.IsActive = true;
                status.ExpiresAt = null; // Permanent

                var enabledByConfig = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_ENABLED_BY_KEY);
                status.EnabledBy = enabledByConfig?.ConfigurationValue;

                var enabledAtConfig = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_ENABLED_AT_KEY);
                if (enabledAtConfig != null && DateTime.TryParse(enabledAtConfig.ConfigurationValue, out var enabledAt))
                {
                    status.EnabledAt = enabledAt;
                }

                var reasonConfig = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_REASON_KEY);
                status.Reason = reasonConfig?.ConfigurationValue;
            }
            else if (DateTime.TryParse(expiresAtConfig.ConfigurationValue, out var expiresAt))
            {
                // Check if bypass has expired
                if (expiresAt > DateTime.UtcNow)
                {
                    status.IsActive = true;
                    status.ExpiresAt = expiresAt;

                    var enabledByConfig = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_ENABLED_BY_KEY);
                    status.EnabledBy = enabledByConfig?.ConfigurationValue;

                    var enabledAtConfig = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_ENABLED_AT_KEY);
                    if (enabledAtConfig != null && DateTime.TryParse(enabledAtConfig.ConfigurationValue, out var enabledAt))
                    {
                        status.EnabledAt = enabledAt;
                    }

                    var reasonConfig = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_REASON_KEY);
                    status.Reason = reasonConfig?.ConfigurationValue;
                }
                else
                {
                    // Bypass has expired, update the config
                    isActiveConfig.ConfigurationValue = "false";
                    isActiveConfig.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync(cancellationToken);

                    _logger.LogInformation("Temporary bypass has automatically expired at {ExpiresAt}", expiresAt);
                }
            }
        }
    }

    private async Task GetVehicleBypassesAsync(TemporaryBypassStatusDTO status, CancellationToken cancellationToken)
    {
        try
        {
            var now = DateTime.UtcNow;

            // Get active vehicle bypasses
            var vehicleBypasses = await _context.LocationValidationBypasses
                .Include(b => b.Vehicle)
                .Where(b => b.BypassType == BypassType.Vehicle &&
                            b.IsActive &&
                            b.CancelledAt == null &&
                            (b.ExpiresAt == null || b.ExpiresAt > now))
                .ToListAsync(cancellationToken);

            // Clean up expired bypasses
            var expiredBypasses = await _context.LocationValidationBypasses
                .Where(b => b.IsActive &&
                            b.CancelledAt == null &&
                            b.ExpiresAt != null &&
                            b.ExpiresAt <= now)
                .ToListAsync(cancellationToken);

            if (expiredBypasses.Any())
            {
                foreach (var expired in expiredBypasses)
                {
                    expired.IsActive = false;
                }
                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Auto-expired {Count} location validation bypasses", expiredBypasses.Count);
            }

            status.VehicleBypasses = vehicleBypasses.Select(b => new VehicleBypassDTO
            {
                Id = b.Id,
                VehicleId = b.VehicleId ?? 0,
                VehicleName = b.Vehicle?.VehicleCode, // Vehicle entity uses VehicleCode as name
                VehicleCode = b.Vehicle?.VehicleCode,
                IsActive = true,
                ExpiresAt = b.ExpiresAt,
                Reason = b.Reason,
                EnabledBy = b.EnabledBy,
                EnabledAt = b.EnabledAt
            }).ToList();
        }
        catch (Exception ex)
        {
            // Table might not exist yet - log and continue with empty list
            _logger.LogWarning(ex, "Could not retrieve vehicle bypasses - table may not exist yet");
            status.VehicleBypasses = new List<VehicleBypassDTO>();
        }
    }

    private async Task GetUserBypassesAsync(TemporaryBypassStatusDTO status, CancellationToken cancellationToken)
    {
        try
        {
            var now = DateTime.UtcNow;

            // Get active user bypasses
            var userBypasses = await _context.LocationValidationBypasses
                .Where(b => b.BypassType == BypassType.User &&
                            b.IsActive &&
                            b.CancelledAt == null &&
                            (b.ExpiresAt == null || b.ExpiresAt > now))
                .ToListAsync(cancellationToken);

            // Get user info for the bypasses
            var userIds = userBypasses.Select(b => b.UserId).Where(id => id != null).ToList();
            var users = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, cancellationToken);

            status.UserBypasses = userBypasses.Select(b => new UserBypassDTO
            {
                Id = b.Id,
                UserId = b.UserId ?? "",
                UserName = b.UserId != null && users.TryGetValue(b.UserId, out var user) ? user.UserName : null,
                FullName = b.UserId != null && users.TryGetValue(b.UserId, out var u) ? u.UserName : null, // User entity doesn't have FullName
                IsActive = true,
                ExpiresAt = b.ExpiresAt,
                Reason = b.Reason,
                EnabledBy = b.EnabledBy,
                EnabledAt = b.EnabledAt
            }).ToList();
        }
        catch (Exception ex)
        {
            // Table might not exist yet - log and continue with empty list
            _logger.LogWarning(ex, "Could not retrieve user bypasses - table may not exist yet");
            status.UserBypasses = new List<UserBypassDTO>();
        }
    }
}
