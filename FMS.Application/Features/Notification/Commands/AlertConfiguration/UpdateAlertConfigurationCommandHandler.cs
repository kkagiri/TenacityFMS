/**
 * File: UpdateAlertConfigurationCommandHandler.cs
 * Purpose: Handles UpdateAlertConfigurationCommand — persists threshold values to SystemConfiguration table
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
    public class UpdateAlertConfigurationCommandHandler
        : IRequestHandler<UpdateAlertConfigurationCommand, FMSResponse<string>>
    {
        private readonly GpsdataContext _context;
        private readonly IAlertConfigurationService _alertConfigService;
        private readonly ILogger<UpdateAlertConfigurationCommandHandler> _logger;

        public UpdateAlertConfigurationCommandHandler(
            GpsdataContext context,
            IAlertConfigurationService alertConfigService,
            ILogger<UpdateAlertConfigurationCommandHandler> logger)
        {
            _context = context;
            _alertConfigService = alertConfigService;
            _logger = logger;
        }

        public async Task<FMSResponse<string>> Handle(
            UpdateAlertConfigurationCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var allTypes = AlertConfigurationConstants.GetAllAlertTypes();
                if (!allTypes.TryGetValue(request.AlertType, out var typeDef))
                {
                    return FMSResponse<string>.Failed($"Unknown alert type: {request.AlertType}");
                }

                var category = AlertConfigurationConstants.BuildCategory(typeDef.Group);
                int updatedCount = 0;

                // Update enabled flag if provided
                if (request.Enabled.HasValue)
                {
                    var enabledKey = AlertConfigurationConstants.BuildEnabledKey(request.AlertType);
                    await UpsertConfigAsync(enabledKey, request.Enabled.Value.ToString(), "Bool", category, $"Enable/disable {typeDef.DisplayName}", cancellationToken);
                    updatedCount++;
                }

                // Update parameters if provided
                if (request.Parameters != null)
                {
                    foreach (var (paramName, paramValue) in request.Parameters)
                    {
                        var paramDef = typeDef.Parameters.FirstOrDefault(p => p.Name == paramName);
                        if (paramDef == null)
                        {
                            _logger.LogWarning("Unknown parameter '{ParamName}' for alert type '{AlertType}'", paramName, request.AlertType);
                            continue;
                        }

                        // Validate value type
                        if (!ValidateParamValue(paramValue, paramDef.DataType))
                        {
                            return FMSResponse<string>.Failed(
                                $"Invalid value '{paramValue}' for parameter '{paramDef.DisplayName}'. Expected type: {paramDef.DataType}");
                        }

                        var configKey = AlertConfigurationConstants.BuildConfigKey(request.AlertType, paramName);
                        var dataType = MapDataType(paramDef.DataType);

                        await UpsertConfigAsync(configKey, paramValue, dataType, category,
                            $"{typeDef.DisplayName} - {paramDef.DisplayName}", cancellationToken);
                        updatedCount++;
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);

                // Invalidate cache so next read picks up new values
                _alertConfigService.InvalidateCache();

                _logger.LogInformation("Updated {Count} alert configuration(s) for {AlertType}", updatedCount, request.AlertType);

                return FMSResponse<string>.Success($"Updated {updatedCount} configuration(s) for {typeDef.DisplayName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update alert configuration for {AlertType}", request.AlertType);
                return FMSResponse<string>.Failed("Failed to update alert configuration");
            }
        }

        private async Task UpsertConfigAsync(string key, string value, string dataType, string category, string description, CancellationToken cancellationToken)
        {
            var existing = await _context.SystemConfigurations
                .FirstOrDefaultAsync(sc => sc.ConfigurationKey == key, cancellationToken);

            if (existing != null)
            {
                existing.ConfigurationValue = value;
                existing.UpdatedAt = DateTime.UtcNow;
                _context.SystemConfigurations.Update(existing);
            }
            else
            {
                var newConfig = new Domain.Entities.SystemConfiguration
                {
                    ConfigurationKey = key,
                    ConfigurationValue = value,
                    DataType = dataType,
                    Category = category,
                    Description = description,
                    IsActive = true,
                    IsEditable = true,
                    DefaultValue = value,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SystemConfigurations.Add(newConfig);
            }
        }

        private static bool ValidateParamValue(string value, string dataType)
        {
            return dataType switch
            {
                "int" => int.TryParse(value, out _),
                "decimal" => decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out _),
                "bool" => bool.TryParse(value, out _),
                _ => true
            };
        }

        private static string MapDataType(string paramDataType)
        {
            return paramDataType switch
            {
                "int" => "Int",
                "decimal" => "Decimal",
                "bool" => "Bool",
                _ => "String"
            };
        }
    }
}
