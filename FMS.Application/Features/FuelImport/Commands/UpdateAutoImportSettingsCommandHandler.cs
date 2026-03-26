/**
 * File: UpdateAutoImportSettingsCommandHandler.cs
 * Purpose: Upserts fuel auto-import settings (master toggle + profiles JSON) into SystemConfigurations table
 * Dependencies: GpsdataContext, MediatR, FMSResponse, SystemConfiguration constants
 * Last Modified: 2026-03-03
 *
 * Key Functions:
 * - Handle: Upserts FuelAutoImport.Enabled and FuelAutoImport.Profiles rows
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelImport.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SysConfig = FMS.Application.Configuration.SystemConfiguration;
using SystemConfigurationEntity = FMS.Domain.Entities.SystemConfiguration;

namespace FMS.Application.Features.FuelImport.Commands;

/// <summary>
/// Handler that upserts FuelAutoImport.Enabled and FuelAutoImport.Profiles
/// into the SystemConfigurations table.
/// </summary>
public class UpdateAutoImportSettingsCommandHandler
    : IRequestHandler<UpdateAutoImportSettingsCommand, FMSResponse<FuelAutoImportSettingsDto>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateAutoImportSettingsCommandHandler> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static readonly Dictionary<string, string> LegacyScanPathMappings = new(StringComparer.OrdinalIgnoreCase)
    {
        [@"Z:\Heavy Report"] = @"\\10.0.10.150\reports\Heavy Report",
        [@"Z:\Truck Report"] = @"\\10.0.10.150\reports\Truck Report",
    };

    public UpdateAutoImportSettingsCommandHandler(
        GpsdataContext context,
        ILogger<UpdateAutoImportSettingsCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<FuelAutoImportSettingsDto>> Handle(
        UpdateAutoImportSettingsCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var settings = request.Settings;
            var now = DateTime.UtcNow;

            settings.Profiles = (settings.Profiles ?? new List<FuelAutoImportProfileDto>())
                .Select(NormalizeProfile)
                .ToList();

            // Serialize profiles to JSON
            var profilesJson = JsonSerializer.Serialize(settings.Profiles ?? new List<FuelAutoImportProfileDto>(), JsonOptions);

            // Build the key→value map (only 2 entries)
            var entries = new Dictionary<string, (string Value, string Description, string DataType)>
            {
                [SysConfig.DB_CONFIG_FUEL_AUTO_IMPORT_ENABLED_KEY] =
                    (settings.Enabled.ToString(), "Master switch to enable/disable fuel auto-import", "Bool"),
                [SysConfig.DB_CONFIG_FUEL_AUTO_IMPORT_PROFILES_KEY] =
                    (profilesJson, "JSON array of import profiles with independent settings per scan path", "Json"),
            };

            // Load existing rows for these keys
            var keys = entries.Keys.ToList();
            var existing = await _context.SystemConfigurations
                .Where(c => keys.Contains(c.ConfigurationKey))
                .ToListAsync(cancellationToken);

            var existingLookup = existing.ToDictionary(c => c.ConfigurationKey, StringComparer.OrdinalIgnoreCase);

            foreach (var (key, (value, description, dataType)) in entries)
            {
                if (existingLookup.TryGetValue(key, out var row))
                {
                    // Update existing
                    row.ConfigurationValue = value;
                    row.Description = description;
                    row.UpdatedAt = now;
                    row.UpdatedBy = request.ModifiedBy;
                }
                else
                {
                    // Create new
                    _context.SystemConfigurations.Add(new SystemConfigurationEntity
                    {
                        ConfigurationKey = key,
                        ConfigurationValue = value,
                        Description = description,
                        DataType = dataType,
                        Category = "FuelAutoImport",
                        IsActive = true,
                        IsEditable = true,
                        CreatedAt = now,
                        UpdatedAt = now,
                        CreatedBy = request.ModifiedBy,
                        UpdatedBy = request.ModifiedBy,
                    });
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Fuel auto-import settings updated by {User} ({ProfileCount} profiles)",
                request.ModifiedBy, settings.Profiles?.Count ?? 0);

            return FMSResponse<FuelAutoImportSettingsDto>.Success(settings, "Auto-import settings saved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating fuel auto-import settings");
            return FMSResponse<FuelAutoImportSettingsDto>.Failed("Failed to save auto-import settings");
        }
    }

    private static FuelAutoImportProfileDto NormalizeProfile(FuelAutoImportProfileDto profile)
    {
        if (string.IsNullOrWhiteSpace(profile.ScanPath))
            return profile;

        var normalized = profile.ScanPath.Trim().TrimEnd('\\', '/');
        if (!LegacyScanPathMappings.TryGetValue(normalized, out var mappedPath))
            return profile;

        profile.ScanPath = mappedPath;
        return profile;
    }
}
