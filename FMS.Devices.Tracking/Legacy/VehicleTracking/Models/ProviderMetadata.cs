using System;
using System.Collections.Generic;

namespace FMS.Infrastructure.VehicleTracking.Models
{
    /// <summary>
    /// Metadata information about a vehicle tracking provider
    /// </summary>
    public class ProviderMetadata
    {
        /// <summary>
        /// Provider name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Provider display name
        /// </summary>
        public string DisplayName { get; set; } = string.Empty;

        /// <summary>
        /// Provider version
        /// </summary>
        public string Version { get; set; } = string.Empty;

        /// <summary>
        /// Provider description
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Provider vendor/manufacturer
        /// </summary>
        public string Vendor { get; set; } = string.Empty;

        /// <summary>
        /// Provider documentation URL
        /// </summary>
        public string? DocumentationUrl { get; set; }

        /// <summary>
        /// Provider support URL
        /// </summary>
        public string? SupportUrl { get; set; }

        /// <summary>
        /// Provider license information
        /// </summary>
        public string? LicenseType { get; set; }

        /// <summary>
        /// Date when the provider was developed
        /// </summary>
        public DateTime? DevelopedDate { get; set; }

        /// <summary>
        /// Provider capabilities
        /// </summary>
        public ProviderCapabilities Capabilities { get; set; } = new();

        /// <summary>
        /// Configuration requirements
        /// </summary>
        public List<ConfigurationRequirement> ConfigurationRequirements { get; set; } = new();

        /// <summary>
        /// Additional metadata as key-value pairs
        /// </summary>
        public Dictionary<string, string> AdditionalMetadata { get; set; } = new();
    }

    /// <summary>
    /// Configuration requirement for a provider
    /// </summary>
    public class ConfigurationRequirement
    {
        /// <summary>
        /// Configuration key name
        /// </summary>
        public string Key { get; set; } = string.Empty;

        /// <summary>
        /// Display name for the configuration
        /// </summary>
        public string DisplayName { get; set; } = string.Empty;

        /// <summary>
        /// Description of what this configuration does
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Whether this configuration is required
        /// </summary>
        public bool IsRequired { get; set; }

        /// <summary>
        /// Data type of the configuration value
        /// </summary>
        public string DataType { get; set; } = "string";

        /// <summary>
        /// Default value (if any)
        /// </summary>
        public string? DefaultValue { get; set; }

        /// <summary>
        /// Example value
        /// </summary>
        public string? ExampleValue { get; set; }

        /// <summary>
        /// Validation regex pattern (if applicable)
        /// </summary>
        public string? ValidationPattern { get; set; }

        /// <summary>
        /// Whether this value should be encrypted/secured
        /// </summary>
        public bool IsSecure { get; set; }
    }
}
