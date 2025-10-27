using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.VehicleTracking
{
    /// <summary>
    /// Database entity for mapping vehicles to specific tracking providers
    /// Allows per-vehicle provider assignment (e.g., some vehicles use GPSGate, others use Geotab)
    /// </summary>
    [Table("vehicle_provider_mappings")]
    public class VehicleProviderMappingEntity
    {
        /// <summary>
        /// Primary key
        /// </summary>
        [Key]
        [Column("id")]
        public int Id { get; set; }

        /// <summary>
        /// Vehicle ID from vehicles table
        /// </summary>
        [Column("vehicle_id")]
        public int VehicleId { get; set; }

        /// <summary>
        /// Provider configuration ID
        /// </summary>
        [Column("provider_config_id")]
        public int ProviderConfigId { get; set; }

        /// <summary>
        /// External device ID in the provider's system
        /// </summary>
        [MaxLength(200)]
        [Column("external_device_id")]
        public string? ExternalDeviceId { get; set; }

        /// <summary>
        /// Whether this mapping is active
        /// </summary>
        [Column("is_active")]
        public bool IsActive { get; set; } = true;

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
        /// User who created this mapping
        /// </summary>
        [MaxLength(100)]
        [Column("created_by")]
        public string? CreatedBy { get; set; }

        /// <summary>
        /// User who last updated this mapping
        /// </summary>
        [MaxLength(100)]
        [Column("updated_by")]
        public string? UpdatedBy { get; set; }

        /// <summary>
        /// Navigation property to provider configuration
        /// </summary>
        [ForeignKey("ProviderConfigId")]
        public virtual ProviderConfigurationEntity? ProviderConfiguration { get; set; }
    }
}
