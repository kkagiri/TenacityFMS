using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.VehicleTracking
{
    /// <summary>
    /// Database entity for storing vehicle tracking provider configurations
    /// </summary>
    [Table("provider_configurations")]
    public class ProviderConfigurationEntity
    {
        /// <summary>
        /// Primary key
        /// </summary>
        [Key]
        [Column("id")]
        public int Id { get; set; }

        /// <summary>
        /// Tenant that owns this provider configuration. <see cref="System.Guid.Empty"/>
        /// is reserved for the system tenant during the tenancy migration.
        /// </summary>
        [Column("tenant_id")]
        public Guid TenantId { get; set; }

        /// <summary>
        /// Top-level device family this provider belongs to (e.g. Tracking, Fueling, Atg).
        /// Mirrors the FMS.Devices.Abstractions.Common.DeviceCategory enum at the database level.
        /// </summary>
        [Required]
        [MaxLength(40)]
        [Column("device_category")]
        public string DeviceCategory { get; set; } = "Tracking";

        /// <summary>
        /// Unique provider name (e.g., "GPSGate", "Geotab", "Traccar")
        /// </summary>
        [Required]
        [MaxLength(100)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Display name for UI
        /// </summary>
        [Required]
        [MaxLength(200)]
        [Column("display_name")]
        public string DisplayName { get; set; } = string.Empty;

        /// <summary>
        /// Configuration description
        /// </summary>
        [MaxLength(1000)]
        [Column("description")]
        public string? Description { get; set; }

        /// <summary>
        /// Whether this provider is enabled
        /// </summary>
        [Column("is_enabled")]
        public bool IsEnabled { get; set; } = true;

        /// <summary>
        /// Whether this is the default provider
        /// </summary>
        [Column("is_default")]
        public bool IsDefault { get; set; } = false;

        /// <summary>
        /// Configuration version
        /// </summary>
        [Required]
        [MaxLength(50)]
        [Column("version")]
        public string Version { get; set; } = "1.0.0";

        /// <summary>
        /// JSON configuration settings (stored as text; encrypted for sensitive data)
        /// </summary>
        [Column("settings", TypeName = "text")]
        public string Settings { get; set; } = "{}";

        /// <summary>
        /// Priority for failover (1 = highest priority)
        /// </summary>
        [Column("priority")]
        public int Priority { get; set; } = 999;

        /// <summary>
        /// Creation timestamp
        /// </summary>
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update timestamp
        /// </summary>
        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// User who created this configuration
        /// </summary>
        [MaxLength(100)]
        [Column("created_by")]
        public string? CreatedBy { get; set; }

        /// <summary>
        /// User who last updated this configuration
        /// </summary>
        [MaxLength(100)]
        [Column("updated_by")]
        public string? UpdatedBy { get; set; }

        /// <summary>
        /// Soft delete flag
        /// </summary>
        [Column("is_deleted")]
        public bool IsDeleted { get; set; } = false;

        /// <summary>
        /// Deletion timestamp
        /// </summary>
        [Column("deleted_at")]
        public DateTime? DeletedAt { get; set; }

        /// <summary>
        /// User who deleted this configuration
        /// </summary>
        [MaxLength(100)]
        [Column("deleted_by")]
        public string? DeletedBy { get; set; }
    }
}
