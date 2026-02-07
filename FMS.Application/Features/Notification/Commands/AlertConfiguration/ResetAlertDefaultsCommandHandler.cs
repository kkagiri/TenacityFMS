/**
 * File: ResetAlertDefaultsCommandHandler.cs
 * Purpose: Handles ResetAlertDefaultsCommand — deletes custom values so defaults are used
 * Dependencies: GpsdataContext, IAlertConfigurationService, AlertConfigurationConstants
 * Last Modified: 2026-02-07
 */

using System;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.Services.AlertConfiguration;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Commands.AlertConfiguration
{
    public class ResetAlertDefaultsCommandHandler
        : IRequestHandler<ResetAlertDefaultsCommand, FMSResponse<string>>
    {
        private readonly GpsdataContext _context;
        private readonly IAlertConfigurationService _alertConfigService;
        private readonly ILogger<ResetAlertDefaultsCommandHandler> _logger;

        public ResetAlertDefaultsCommandHandler(
            GpsdataContext context,
            IAlertConfigurationService alertConfigService,
            ILogger<ResetAlertDefaultsCommandHandler> logger)
        {
            _context = context;
            _alertConfigService = alertConfigService;
            _logger = logger;
        }

        public async Task<FMSResponse<string>> Handle(ResetAlertDefaultsCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var allTypes = AlertConfigurationConstants.GetAllAlertTypes();
                if (!allTypes.TryGetValue(request.AlertType, out var typeDef))
                {
                    return FMSResponse<string>.Failed($"Unknown alert type: {request.AlertType}");
                }

                var prefix = $"{AlertConfigurationConstants.ConfigKeyPrefix}.{request.AlertType}.";

                // Find all config entries for this alert type
                var configs = await _context.SystemConfigurations
                    .Where(sc => sc.ConfigurationKey.StartsWith(prefix))
                    .ToListAsync(cancellationToken);

                if (configs.Any())
                {
                    // Reset to defaults by updating values
                    foreach (var config in configs)
                    {
                        var paramName = config.ConfigurationKey.Replace(prefix, "");

                        if (paramName == "Enabled")
                        {
                            config.ConfigurationValue = typeDef.DefaultEnabled.ToString();
                        }
                        else
                        {
                            var paramDef = typeDef.Parameters.FirstOrDefault(p => p.Name == paramName);
                            if (paramDef != null)
                            {
                                config.ConfigurationValue = Convert.ToString(paramDef.DefaultValue, CultureInfo.InvariantCulture) ?? string.Empty;
                            }
                        }

                        config.UpdatedAt = DateTime.UtcNow;
                    }

                    await _context.SaveChangesAsync(cancellationToken);
                }

                _alertConfigService.InvalidateCache();

                _logger.LogInformation("Reset alert configuration defaults for {AlertType}", request.AlertType);

                return FMSResponse<string>.Success($"{typeDef.DisplayName} has been reset to factory defaults");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to reset alert defaults for {AlertType}", request.AlertType);
                return FMSResponse<string>.Failed("Failed to reset alert defaults");
            }
        }
    }
}
