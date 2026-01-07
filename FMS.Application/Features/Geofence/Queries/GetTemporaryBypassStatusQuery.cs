using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Geofence.Queries;

/// <summary>
/// Query to get the current temporary bypass status
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
            var configs = await _context.SystemConfigurations
                .Where(c => c.ConfigurationKey.StartsWith("FuelingRules.TemporaryBypass."))
                .ToListAsync(cancellationToken);

            var status = new TemporaryBypassStatusDTO
            {
                IsActive = false,
                ExpiresAt = null,
                EnabledBy = null,
                EnabledAt = null,
                Reason = null
            };

            var isActiveConfig = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_ACTIVE_KEY);
            if (isActiveConfig?.ConfigurationValue?.ToLower() == "true")
            {
                var expiresAtConfig = configs.FirstOrDefault(c => c.ConfigurationKey == BYPASS_EXPIRES_KEY);
                if (expiresAtConfig != null && DateTime.TryParse(expiresAtConfig.ConfigurationValue, out var expiresAt))
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

            return FMSResponse<TemporaryBypassStatusDTO>.Success(status, "Bypass status retrieved");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting temporary bypass status");
            return FMSResponse<TemporaryBypassStatusDTO>.Failed($"Failed to get bypass status: {ex.Message}");
        }
    }
}
