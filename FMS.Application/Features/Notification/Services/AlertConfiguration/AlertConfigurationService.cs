/**
 * File: AlertConfigurationService.cs
 * Purpose: Implementation of IAlertConfigurationService. Provides cached, typed access to alert thresholds
 *          stored in the SystemConfiguration database table.
 * Dependencies: GpsdataContext, IMemoryCache, AlertConfigurationConstants
 * Last Modified: 2026-02-07
 *
 * Key Functions:
 * - GetDecimalAsync: Typed decimal getter with caching
 * - GetIntAsync: Typed integer getter with caching
 * - IsAlertEnabledAsync: Check if alert type is on/off
 * - GetAllAlertConfigurationsAsync: Returns grouped configs for management UI
 * - InvalidateCache: Clears in-memory cache
 */

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Services.AlertConfiguration
{
    public class AlertConfigurationService : IAlertConfigurationService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<AlertConfigurationService> _logger;

        // In-memory cache: key → value
        private readonly ConcurrentDictionary<string, CacheEntry> _cache = new();
        private DateTime _lastFullLoad = DateTime.MinValue;
        private Dictionary<string, string>? _fullConfigSnapshot;
        private readonly object _fullLoadLock = new();

        private const int CacheTtlMinutes = 5;

        public AlertConfigurationService(GpsdataContext context, ILogger<AlertConfigurationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<decimal> GetDecimalAsync(string alertType, string parameter, decimal defaultValue, CancellationToken cancellationToken = default)
        {
            var key = AlertConfigurationConstants.BuildConfigKey(alertType, parameter);
            var value = await GetCachedValueAsync(key, cancellationToken);

            if (value != null && decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var result))
                return result;

            return defaultValue;
        }

        public async Task<int> GetIntAsync(string alertType, string parameter, int defaultValue, CancellationToken cancellationToken = default)
        {
            var key = AlertConfigurationConstants.BuildConfigKey(alertType, parameter);
            var value = await GetCachedValueAsync(key, cancellationToken);

            if (value != null && int.TryParse(value, out var result))
                return result;

            return defaultValue;
        }

        public async Task<bool> GetBoolAsync(string alertType, string parameter, bool defaultValue, CancellationToken cancellationToken = default)
        {
            var key = AlertConfigurationConstants.BuildConfigKey(alertType, parameter);
            var value = await GetCachedValueAsync(key, cancellationToken);

            if (value != null && bool.TryParse(value, out var result))
                return result;

            return defaultValue;
        }

        public async Task<bool> IsAlertEnabledAsync(string alertType, CancellationToken cancellationToken = default)
        {
            var key = AlertConfigurationConstants.BuildEnabledKey(alertType);
            var value = await GetCachedValueAsync(key, cancellationToken);

            if (value != null && bool.TryParse(value, out var result))
                return result;

            // Default to enabled if not configured
            return true;
        }

        public async Task<Dictionary<string, string>> GetAlertConfigAsync(string alertType, CancellationToken cancellationToken = default)
        {
            var allTypes = AlertConfigurationConstants.GetAllAlertTypes();
            if (!allTypes.TryGetValue(alertType, out var typeDef))
                return new Dictionary<string, string>();

            var result = new Dictionary<string, string>();

            foreach (var param in typeDef.Parameters)
            {
                var key = AlertConfigurationConstants.BuildConfigKey(alertType, param.Name);
                var value = await GetCachedValueAsync(key, cancellationToken);
                result[param.Name] = value ?? param.DefaultValue?.ToString() ?? string.Empty;
            }

            return result;
        }

        public async Task<List<AlertTypeConfigResult>> GetAllAlertConfigurationsAsync(CancellationToken cancellationToken = default)
        {
            // Bulk-load all alert config values from DB
            var allDbConfigs = await LoadAllAlertConfigsFromDbAsync(cancellationToken);
            var allTypes = AlertConfigurationConstants.GetAllAlertTypes();
            var results = new List<AlertTypeConfigResult>();

            foreach (var (typeKey, typeDef) in allTypes)
            {
                var enabledKey = AlertConfigurationConstants.BuildEnabledKey(typeKey);
                var isEnabled = true;
                if (allDbConfigs.TryGetValue(enabledKey, out var enabledValue))
                {
                    bool.TryParse(enabledValue, out isEnabled);
                }

                var parameters = new List<AlertParameterConfigResult>();
                foreach (var param in typeDef.Parameters)
                {
                    var configKey = AlertConfigurationConstants.BuildConfigKey(typeKey, param.Name);
                    allDbConfigs.TryGetValue(configKey, out var currentValue);

                    parameters.Add(new AlertParameterConfigResult
                    {
                        Name = param.Name,
                        DisplayName = param.DisplayName,
                        DataType = param.DataType,
                        Unit = param.Unit,
                        Required = param.Required,
                        CurrentValue = currentValue,
                        DefaultValue = param.DefaultValue?.ToString(),
                        Description = param.Description
                    });
                }

                results.Add(new AlertTypeConfigResult
                {
                    Key = typeKey,
                    DisplayName = typeDef.DisplayName,
                    Description = typeDef.Description,
                    Group = typeDef.Group,
                    Enabled = isEnabled,
                    Parameters = parameters
                });
            }

            return results;
        }

        public void InvalidateCache()
        {
            _cache.Clear();
            _fullConfigSnapshot = null;
            _lastFullLoad = DateTime.MinValue;
            _logger.LogInformation("Alert configuration cache invalidated");
        }

        #region Private Methods

        private async Task<string?> GetCachedValueAsync(string key, CancellationToken cancellationToken)
        {
            // Check cache first
            if (_cache.TryGetValue(key, out var cached) && cached.ExpiresAt > DateTime.UtcNow)
            {
                return cached.Value;
            }

            // Try bulk load if stale
            var snapshot = await EnsureFullLoadAsync(cancellationToken);
            if (snapshot.TryGetValue(key, out var value))
            {
                _cache[key] = new CacheEntry(value, DateTime.UtcNow.AddMinutes(CacheTtlMinutes));
                return value;
            }

            // Not found in DB — cache the miss
            _cache[key] = new CacheEntry(null, DateTime.UtcNow.AddMinutes(CacheTtlMinutes));
            return null;
        }

        private async Task<Dictionary<string, string>> EnsureFullLoadAsync(CancellationToken cancellationToken)
        {
            if (_fullConfigSnapshot != null && _lastFullLoad.AddMinutes(CacheTtlMinutes) > DateTime.UtcNow)
                return _fullConfigSnapshot;

            var snapshot = await LoadAllAlertConfigsFromDbAsync(cancellationToken);

            lock (_fullLoadLock)
            {
                _fullConfigSnapshot = snapshot;
                _lastFullLoad = DateTime.UtcNow;
            }

            return snapshot;
        }

        private async Task<Dictionary<string, string>> LoadAllAlertConfigsFromDbAsync(CancellationToken cancellationToken)
        {
            try
            {
                var prefix = AlertConfigurationConstants.ConfigKeyPrefix + ".";

                var configs = await _context.SystemConfigurations
                    .Where(sc => sc.ConfigurationKey.StartsWith(prefix) && sc.IsActive)
                    .Select(sc => new { Key = sc.ConfigurationKey, Value = sc.ConfigurationValue })
                    .ToListAsync(cancellationToken);

                return configs.ToDictionary(c => c.Key, c => c.Value ?? string.Empty);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load alert configurations from database");
                return new Dictionary<string, string>();
            }
        }

        #endregion

        private record CacheEntry(string? Value, DateTime ExpiresAt);
    }
}
