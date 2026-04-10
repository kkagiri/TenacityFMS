/**
 * File: VehicleDocumentIssuingAuthoritySettings.cs
 * Purpose: Persists and reads vehicle document issuing authority defaults by compliance category.
 * Dependencies: GpsdataContext, SystemConfiguration entity, System.Text.Json.
 * Last Modified: 2026-04-09
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using SystemConfigurationEntity = FMS.Domain.Entities.SystemConfiguration;

namespace FMS.Application.Features.VehicleDocumentManagement.Services;

internal sealed class VehicleDocumentIssuingAuthoritySettingItem
{
    public int ComplianceCategory { get; set; }
    public string AuthorityName { get; set; } = string.Empty;
}

internal static class VehicleDocumentIssuingAuthoritySettings
{
    public const string ConfigKey = "VehicleDocuments.IssuingAuthorityCategoryDefaults";

    private const string ConfigCategory = "VehicleDocumentManagement";
    private const string DefaultSerializedValue = "[]";
    private const string ConfigDescription = "Default issuing authority mapped to each vehicle document compliance category.";

    public static async Task<Dictionary<int, string>> LoadMappingsAsync(GpsdataContext context, CancellationToken cancellationToken)
    {
        var serializedValue = await context.SystemConfigurations
            .AsNoTracking()
            .Where(configuration => configuration.ConfigurationKey == ConfigKey && configuration.IsActive)
            .Select(configuration => configuration.ConfigurationValue)
            .FirstOrDefaultAsync(cancellationToken);

        return DeserializeMappings(serializedValue);
    }

    public static async Task SaveMappingsAsync(
        GpsdataContext context,
        Dictionary<int, string> mappings,
        string? updatedBy,
        CancellationToken cancellationToken)
    {
        var configuration = await context.SystemConfigurations
            .FirstOrDefaultAsync(item => item.ConfigurationKey == ConfigKey, cancellationToken);

        var utcNow = DateTime.UtcNow;
        if (configuration == null)
        {
            configuration = new SystemConfigurationEntity
            {
                ConfigurationKey = ConfigKey,
                CreatedAt = utcNow,
                CreatedBy = string.IsNullOrWhiteSpace(updatedBy) ? "System" : updatedBy,
            };

            context.SystemConfigurations.Add(configuration);
        }

        ApplyMetadata(configuration);
        configuration.ConfigurationValue = SerializeMappings(mappings);
        configuration.UpdatedAt = utcNow;
        configuration.UpdatedBy = string.IsNullOrWhiteSpace(updatedBy) ? "System" : updatedBy;

        await context.SaveChangesAsync(cancellationToken);
    }

    public static int ReplaceAuthorityName(Dictionary<int, string> mappings, string oldName, string newName)
    {
        var updatedCount = 0;

        foreach (var complianceCategory in mappings.Keys.ToList())
        {
            if (!string.Equals(mappings[complianceCategory], oldName, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            mappings[complianceCategory] = newName;
            updatedCount++;
        }

        return updatedCount;
    }

    public static int RemoveAuthority(Dictionary<int, string> mappings, string authorityName)
    {
        var categoriesToRemove = mappings
            .Where(item => string.Equals(item.Value, authorityName, StringComparison.OrdinalIgnoreCase))
            .Select(item => item.Key)
            .ToList();

        foreach (var complianceCategory in categoriesToRemove)
        {
            mappings.Remove(complianceCategory);
        }

        return categoriesToRemove.Count;
    }

    public static List<int> GetAssociatedComplianceCategories(IReadOnlyDictionary<int, string> mappings, string authorityName)
    {
        return mappings
            .Where(item => string.Equals(item.Value, authorityName, StringComparison.OrdinalIgnoreCase))
            .Select(item => item.Key)
            .OrderBy(value => value)
            .ToList();
    }

    public static string NormalizeAuthorityName(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : string.Join(" ", value.Split(' ', StringSplitOptions.RemoveEmptyEntries)).Trim();
    }

    private static Dictionary<int, string> DeserializeMappings(string? serializedValue)
    {
        if (string.IsNullOrWhiteSpace(serializedValue))
        {
            return new Dictionary<int, string>();
        }

        try
        {
            var items = JsonSerializer.Deserialize<List<VehicleDocumentIssuingAuthoritySettingItem>>(serializedValue);
            if (items != null)
            {
                return items
                    .Where(item => item != null)
                    .Select(item => new
                    {
                        ComplianceCategory = item.ComplianceCategory,
                        AuthorityName = NormalizeAuthorityName(item.AuthorityName),
                    })
                    .Where(item => item.ComplianceCategory > 0 && !string.IsNullOrWhiteSpace(item.AuthorityName))
                    .GroupBy(item => item.ComplianceCategory)
                    .ToDictionary(group => group.Key, group => group.Last().AuthorityName);
            }
        }
        catch (JsonException)
        {
        }

        try
        {
            var dictionary = JsonSerializer.Deserialize<Dictionary<string, string>>(serializedValue);
            if (dictionary != null)
            {
                return dictionary
                    .Select(item => new
                    {
                        ComplianceCategory = int.TryParse(item.Key, out var category) ? category : 0,
                        AuthorityName = NormalizeAuthorityName(item.Value),
                    })
                    .Where(item => item.ComplianceCategory > 0 && !string.IsNullOrWhiteSpace(item.AuthorityName))
                    .ToDictionary(item => item.ComplianceCategory, item => item.AuthorityName);
            }
        }
        catch (JsonException)
        {
        }

        return new Dictionary<int, string>();
    }

    private static string SerializeMappings(IReadOnlyDictionary<int, string> mappings)
    {
        var items = mappings
            .Where(item => item.Key > 0 && !string.IsNullOrWhiteSpace(item.Value))
            .OrderBy(item => item.Key)
            .Select(item => new VehicleDocumentIssuingAuthoritySettingItem
            {
                ComplianceCategory = item.Key,
                AuthorityName = NormalizeAuthorityName(item.Value),
            })
            .ToList();

        return items.Count == 0
            ? DefaultSerializedValue
            : JsonSerializer.Serialize(items);
    }

    private static void ApplyMetadata(SystemConfigurationEntity configuration)
    {
        configuration.Description = ConfigDescription;
        configuration.Category = ConfigCategory;
        configuration.DataType = "json";
        configuration.DefaultValue = DefaultSerializedValue;
        configuration.IsActive = true;
        configuration.IsEditable = true;
    }
}