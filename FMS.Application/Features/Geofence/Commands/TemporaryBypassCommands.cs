using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Geofence.Commands;

/// <summary>
/// Command to enable temporary location validation bypass
/// </summary>
public class EnableTemporaryBypassCommand : IRequest<FMSResponse<TemporaryBypassStatusDTO>>
{
    public int DurationMinutes { get; set; } = 5;
    public string? Reason { get; set; }
    public string EnabledBy { get; set; } = "system";
}

/// <summary>
/// Handler for EnableTemporaryBypassCommand
/// </summary>
public class EnableTemporaryBypassCommandHandler : IRequestHandler<EnableTemporaryBypassCommand, FMSResponse<TemporaryBypassStatusDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<EnableTemporaryBypassCommandHandler> _logger;

    // Configuration keys for temporary bypass
    private const string BYPASS_ACTIVE_KEY = "FuelingRules.TemporaryBypass.IsActive";
    private const string BYPASS_EXPIRES_KEY = "FuelingRules.TemporaryBypass.ExpiresAt";
    private const string BYPASS_ENABLED_BY_KEY = "FuelingRules.TemporaryBypass.EnabledBy";
    private const string BYPASS_ENABLED_AT_KEY = "FuelingRules.TemporaryBypass.EnabledAt";
    private const string BYPASS_REASON_KEY = "FuelingRules.TemporaryBypass.Reason";

    public EnableTemporaryBypassCommandHandler(GpsdataContext context, ILogger<EnableTemporaryBypassCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<TemporaryBypassStatusDTO>> Handle(EnableTemporaryBypassCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validate duration (1-120 minutes)
            if (request.DurationMinutes < 1 || request.DurationMinutes > 120)
            {
                return FMSResponse<TemporaryBypassStatusDTO>.Failed("Duration must be between 1 and 120 minutes");
            }

            var now = DateTime.UtcNow;
            var expiresAt = now.AddMinutes(request.DurationMinutes);

            // Update or create system configurations
            await UpdateOrCreateConfig(BYPASS_ACTIVE_KEY, "true", cancellationToken);
            await UpdateOrCreateConfig(BYPASS_EXPIRES_KEY, expiresAt.ToString("O"), cancellationToken);
            await UpdateOrCreateConfig(BYPASS_ENABLED_BY_KEY, request.EnabledBy, cancellationToken);
            await UpdateOrCreateConfig(BYPASS_ENABLED_AT_KEY, now.ToString("O"), cancellationToken);
            await UpdateOrCreateConfig(BYPASS_REASON_KEY, request.Reason ?? "", cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogWarning(
                "Temporary location bypass ENABLED by {EnabledBy} for {Duration} minutes. Reason: {Reason}. Expires at: {ExpiresAt}",
                request.EnabledBy, request.DurationMinutes, request.Reason ?? "No reason provided", expiresAt);

            var status = new TemporaryBypassStatusDTO
            {
                IsActive = true,
                ExpiresAt = expiresAt,
                EnabledBy = request.EnabledBy,
                EnabledAt = now,
                Reason = request.Reason
            };

            return FMSResponse<TemporaryBypassStatusDTO>.Success(status, $"Temporary bypass enabled for {request.DurationMinutes} minutes");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enabling temporary bypass");
            return FMSResponse<TemporaryBypassStatusDTO>.Failed($"Failed to enable temporary bypass: {ex.Message}");
        }
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

    private const string BYPASS_ACTIVE_KEY = "FuelingRules.TemporaryBypass.IsActive";

    public CancelTemporaryBypassCommandHandler(GpsdataContext context, ILogger<CancelTemporaryBypassCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
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

            return FMSResponse<bool>.Success(true, "Temporary bypass has been cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling temporary bypass");
            return FMSResponse<bool>.Failed($"Failed to cancel temporary bypass: {ex.Message}");
        }
    }
}
