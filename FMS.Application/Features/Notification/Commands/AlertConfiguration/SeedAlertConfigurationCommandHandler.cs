/**
 * File: SeedAlertConfigurationCommandHandler.cs
 * Purpose: Handles SeedAlertConfigurationCommand — seeds default values into SystemConfiguration table
 * Dependencies: GpsdataContext, AlertConfigurationConstants, IAlertConfigurationService
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
    public class SeedAlertConfigurationCommandHandler
        : IRequestHandler<SeedAlertConfigurationCommand, FMSResponse<string>>
    {
        private readonly GpsdataContext _context;
        private readonly IAlertConfigurationService _alertConfigService;
        private readonly ILogger<SeedAlertConfigurationCommandHandler> _logger;

        public SeedAlertConfigurationCommandHandler(
            GpsdataContext context,
            IAlertConfigurationService alertConfigService,
            ILogger<SeedAlertConfigurationCommandHandler> logger)
        {
            _context = context;
            _alertConfigService = alertConfigService;
            _logger = logger;
        }

        public async Task<FMSResponse<string>> Handle(SeedAlertConfigurationCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var allTypes = AlertConfigurationConstants.GetAllAlertTypes();

                // Load all existing alert config keys in one query
                var prefix = AlertConfigurationConstants.ConfigKeyPrefix + ".";
                var existingKeysList = await _context.SystemConfigurations
                    .Where(sc => sc.ConfigurationKey.StartsWith(prefix))
                    .Select(sc => sc.ConfigurationKey)
                    .ToListAsync(cancellationToken);
                var existingKeys = new System.Collections.Generic.HashSet<string>(existingKeysList);

                int createdCount = 0;
                int skippedCount = 0;

                foreach (var (typeKey, typeDef) in allTypes)
                {
                    var category = AlertConfigurationConstants.BuildCategory(typeDef.Group);

                    // Seed enabled flag
                    var enabledKey = AlertConfigurationConstants.BuildEnabledKey(typeKey);
                    if (!existingKeys.Contains(enabledKey))
                    {
                        _context.SystemConfigurations.Add(new Domain.Entities.SystemConfiguration
                        {
                            ConfigurationKey = enabledKey,
                            ConfigurationValue = typeDef.DefaultEnabled.ToString(),
                            DataType = "Bool",
                            Category = category,
                            Description = $"Enable/disable {typeDef.DisplayName} alerts",
                            IsActive = true,
                            IsEditable = true,
                            DefaultValue = typeDef.DefaultEnabled.ToString(),
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        });
                        createdCount++;
                    }
                    else
                    {
                        skippedCount++;
                    }

                    // Seed each parameter
                    foreach (var param in typeDef.Parameters)
                    {
                        var configKey = AlertConfigurationConstants.BuildConfigKey(typeKey, param.Name);
                        if (!existingKeys.Contains(configKey))
                        {
                            var defaultStr = Convert.ToString(param.DefaultValue, CultureInfo.InvariantCulture) ?? string.Empty;
                            var dataType = param.DataType switch
                            {
                                "int" => "Int",
                                "decimal" => "Decimal",
                                "bool" => "Bool",
                                _ => "String"
                            };

                            _context.SystemConfigurations.Add(new Domain.Entities.SystemConfiguration
                            {
                                ConfigurationKey = configKey,
                                ConfigurationValue = defaultStr,
                                DataType = dataType,
                                Category = category,
                                Description = $"{typeDef.DisplayName} - {param.DisplayName}",
                                IsActive = true,
                                IsEditable = true,
                                DefaultValue = defaultStr,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            });
                            createdCount++;
                        }
                        else
                        {
                            skippedCount++;
                        }
                    }
                }

                if (createdCount > 0)
                {
                    await _context.SaveChangesAsync(cancellationToken);
                    _alertConfigService.InvalidateCache();
                }

                var message = $"Alert configuration seeding complete: {createdCount} created, {skippedCount} already existed";
                _logger.LogInformation(message);

                return FMSResponse<string>.Success(message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to seed alert configurations");
                return FMSResponse<string>.Failed("Failed to seed alert configurations");
            }
        }
    }
}
