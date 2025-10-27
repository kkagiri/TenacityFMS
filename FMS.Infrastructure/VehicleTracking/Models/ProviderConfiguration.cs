using System;
using System.Collections.Generic;
using System.Text.Json;

namespace FMS.Infrastructure.VehicleTracking.Models
{
    /// <summary>
    /// Configuration settings for a vehicle tracking provider
    /// </summary>
    public class ProviderConfiguration
    {
        /// <summary>
        /// Unique identifier for the provider configuration
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Unique name identifier for the provider (e.g., "GPSGate", "Geotab")
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Display name for the provider
        /// </summary>
        public string DisplayName { get; set; } = string.Empty;

        /// <summary>
        /// Configuration description
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Provider version
        /// </summary>
        public string Version { get; set; } = "1.0.0";

        /// <summary>
        /// Provider-specific configuration as JSON
        /// </summary>
        public string Settings { get; set; } = "{}";

        /// <summary>
        /// Whether this provider is enabled
        /// </summary>
        public bool IsEnabled { get; set; } = true;

        /// <summary>
        /// Whether this is the default provider
        /// </summary>
        public bool IsDefault { get; set; } = false;

        /// <summary>
        /// Priority for provider selection (1 = highest)
        /// </summary>
        public int Priority { get; set; } = 999;

        /// <summary>
        /// When the configuration was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the configuration was last updated
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// User who created this configuration
        /// </summary>
        public string? CreatedBy { get; set; }

        /// <summary>
        /// User who last updated this configuration
        /// </summary>
        public string? UpdatedBy { get; set; }

        /// <summary>
        /// Get a configuration value by key
        /// </summary>
        public T GetValue<T>(string key, T defaultValue = default)
        {
            try
            {
                var config = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(Settings);
                if (config != null && config.TryGetValue(key, out var value))
                {
                    return JsonSerializer.Deserialize<T>(value.GetRawText()) ?? defaultValue;
                }
            }
            catch (Exception)
            {
                // Return default value if deserialization fails
            }
            return defaultValue;
        }

        /// <summary>
        /// Set a configuration value
        /// </summary>
        public void SetValue<T>(string key, T value)
        {
            var config = JsonSerializer.Deserialize<Dictionary<string, object>>(Settings)
                ?? new Dictionary<string, object>();
            config[key] = value;
            Settings = JsonSerializer.Serialize(config);
        }

        /// <summary>
        /// Get all configuration values as a dictionary
        /// </summary>
        public Dictionary<string, object> GetAllValues()
        {
            return JsonSerializer.Deserialize<Dictionary<string, object>>(Settings)
                ?? new Dictionary<string, object>();
        }
    }
}
