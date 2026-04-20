/**
 * File: GetAutoImportSettingsQueryHandler.cs
 * Purpose: Reads fuel auto-import settings (master toggle + profiles JSON) from SystemConfigurations table
 * Dependencies: GpsdataContext, MediatR, FMSResponse, SystemConfiguration constants
 * Last Modified: 2026-04-01
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Configuration;
using FMS.Application.Features.FuelImport.DTOs;
using FMS.Application.Features.FuelImport.Queries;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SysConfig = FMS.Application.Configuration.SystemConfiguration;

namespace FMS.Application.Features.FuelImport.Queries;

/// <summary>
/// Handler that reads FuelAutoImport.Enabled and FuelAutoImport.Profiles from
/// SystemConfigurations and returns a FuelAutoImportSettingsDto with typed profiles.
/// Falls back to compiled defaults when keys are missing.
/// </summary>
public class GetAutoImportSettingsQueryHandler
    : IRequestHandler<GetAutoImportSettingsQuery, FMSResponse<FuelAutoImportSettingsDto>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetAutoImportSettingsQueryHandler> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private static readonly Dictionary<string, string> LegacyScanPathMappings = new(StringComparer.OrdinalIgnoreCase)
    {
        [@"Z:\Heavy Report"] = @"\\10.0.10.150\reports\Heavy Report",
        [@"Z:\Truck Report"] = @"\\10.0.10.150\reports\Truck Report",
    };

    /// <summary>Default profiles when none are stored in the database.</summary>
    private static readonly List<FuelAutoImportProfileDto> DefaultProfiles = new()
    {
        new FuelAutoImportProfileDto
        {
            Id = "heavy_report", Name = "Heavy Report", ScanPath = @"\\10.0.10.150\reports\Heavy Report",
            Enabled = true, IntervalMinutes = 0, ScheduleTime = "", BatchSize = 50,
            IncludeRetries = true, DuplicateHandling = FuelAutoImportProfileDto.DuplicateHandlingSkip,
            NotificationsEnabled = false, NotifyOnSuccess = false, NotifyOnFailure = true
        },
        new FuelAutoImportProfileDto
        {
            Id = "truck_report", Name = "Truck Report", ScanPath = @"\\10.0.10.150\reports\Truck Report",
            Enabled = true, IntervalMinutes = 0, ScheduleTime = "", BatchSize = 50,
            IncludeRetries = true, DuplicateHandling = FuelAutoImportProfileDto.DuplicateHandlingSkip,
            NotificationsEnabled = false, NotifyOnSuccess = false, NotifyOnFailure = true
        }
    };

    public GetAutoImportSettingsQueryHandler(
        GpsdataContext context,
        ILogger<GetAutoImportSettingsQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<FuelAutoImportSettingsDto>> Handle(
        GetAutoImportSettingsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            // Load both config rows in one round-trip
            var configs = await _context.SystemConfigurations
                .AsNoTracking()
                .Where(c => c.IsActive && c.ConfigurationKey.StartsWith("FuelAutoImport."))
                .ToListAsync(cancellationToken);

            var lookup = configs.ToDictionary(
                c => c.ConfigurationKey, c => c.ConfigurationValue, StringComparer.OrdinalIgnoreCase);

            // Master toggle
            var enabled = SysConfig.DEFAULT_FUEL_AUTO_IMPORT_ENABLED;
            if (lookup.TryGetValue(SysConfig.DB_CONFIG_FUEL_AUTO_IMPORT_ENABLED_KEY, out var enabledVal)
                && bool.TryParse(enabledVal, out var parsedEnabled))
            {
                enabled = parsedEnabled;
            }

            // Profiles JSON
            List<FuelAutoImportProfileDto> profiles = DefaultProfiles;
            if (lookup.TryGetValue(SysConfig.DB_CONFIG_FUEL_AUTO_IMPORT_PROFILES_KEY, out var profilesJson)
                && !string.IsNullOrWhiteSpace(profilesJson))
            {
                try
                {
                    var parsed = DeserializeProfiles(profilesJson);
                    if (parsed?.Count > 0) profiles = parsed.Select(NormalizeProfile).ToList();
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Invalid FuelAutoImport.Profiles JSON, using defaults");
                }
            }

            var dto = new FuelAutoImportSettingsDto
            {
                Enabled = enabled,
                Profiles = profiles.Select(NormalizeProfile).ToList()
            };

            return FMSResponse<FuelAutoImportSettingsDto>.Success(dto, "Auto-import settings retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving fuel auto-import settings");
            return FMSResponse<FuelAutoImportSettingsDto>.Failed("Failed to retrieve auto-import settings");
        }
    }

    private static FuelAutoImportProfileDto NormalizeProfile(FuelAutoImportProfileDto profile)
    {
        profile.DuplicateHandling = FuelAutoImportProfileDto.NormalizeDuplicateHandling(profile.DuplicateHandling);
        if (profile.RecentMonthsWindow < 0) profile.RecentMonthsWindow = 0;

        if (string.IsNullOrWhiteSpace(profile.ScanPath))
            return profile;

        var normalized = profile.ScanPath.Trim().TrimEnd('\\', '/');
        if (!LegacyScanPathMappings.TryGetValue(normalized, out var mappedPath))
            return profile;

        profile.ScanPath = mappedPath;
        return profile;
    }

    /// <summary>
    /// Attempts to deserialize the profiles JSON as-is first (handles values saved via
    /// UpdateAutoImportSettings which are properly escaped). Falls back to doubling all
    /// backslashes for legacy values that were manually inserted without JSON escaping.
    /// </summary>
    private static List<FuelAutoImportProfileDto>? DeserializeProfiles(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<FuelAutoImportProfileDto>>(json, JsonOptions);
        }
        catch (JsonException)
        {
            // Legacy DB value with unescaped Windows paths — double all backslashes
            var sanitized = json.Replace("\\", "\\\\");
            return JsonSerializer.Deserialize<List<FuelAutoImportProfileDto>>(sanitized, JsonOptions);
        }
    }
}
