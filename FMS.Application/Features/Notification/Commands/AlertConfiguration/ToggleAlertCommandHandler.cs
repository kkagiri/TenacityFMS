/**
 * File: ToggleAlertCommandHandler.cs
 * Purpose: Handles ToggleAlertCommand — enables/disables alert types in SystemConfiguration
 * Dependencies: GpsdataContext, IAlertConfigurationService
 * Last Modified: 2026-02-07
 */

using System;
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
    public class ToggleAlertCommandHandler
        : IRequestHandler<ToggleAlertCommand, FMSResponse<string>>
    {
        private readonly GpsdataContext _context;
        private readonly IAlertConfigurationService _alertConfigService;
        private readonly ILogger<ToggleAlertCommandHandler> _logger;

        public ToggleAlertCommandHandler(
            GpsdataContext context,
            IAlertConfigurationService alertConfigService,
            ILogger<ToggleAlertCommandHandler> logger)
        {
            _context = context;
            _alertConfigService = alertConfigService;
            _logger = logger;
        }

        public async Task<FMSResponse<string>> Handle(ToggleAlertCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var allTypes = AlertConfigurationConstants.GetAllAlertTypes();
                if (!allTypes.TryGetValue(request.AlertType, out var typeDef))
                {
                    return FMSResponse<string>.Failed($"Unknown alert type: {request.AlertType}");
                }

                var enabledKey = AlertConfigurationConstants.BuildEnabledKey(request.AlertType);
                var category = AlertConfigurationConstants.BuildCategory(typeDef.Group);

                var existing = await _context.SystemConfigurations
                    .FirstOrDefaultAsync(sc => sc.ConfigurationKey == enabledKey, cancellationToken);

                if (existing != null)
                {
                    existing.ConfigurationValue = request.Enabled.ToString();
                    existing.UpdatedAt = DateTime.UtcNow;
                    _context.SystemConfigurations.Update(existing);
                }
                else
                {
                    _context.SystemConfigurations.Add(new Domain.Entities.SystemConfiguration
                    {
                        ConfigurationKey = enabledKey,
                        ConfigurationValue = request.Enabled.ToString(),
                        DataType = "Bool",
                        Category = category,
                        Description = $"Enable/disable {typeDef.DisplayName} alerts",
                        IsActive = true,
                        IsEditable = true,
                        DefaultValue = typeDef.DefaultEnabled.ToString(),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync(cancellationToken);
                _alertConfigService.InvalidateCache();

                var state = request.Enabled ? "enabled" : "disabled";
                _logger.LogInformation("Alert type {AlertType} has been {State}", request.AlertType, state);

                return FMSResponse<string>.Success($"{typeDef.DisplayName} has been {state}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to toggle alert type {AlertType}", request.AlertType);
                return FMSResponse<string>.Failed("Failed to toggle alert type");
            }
        }
    }
}
