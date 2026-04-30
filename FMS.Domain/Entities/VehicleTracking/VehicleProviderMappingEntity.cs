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
        /// Tenant that owns this mapping. <see cref="System.Guid.Empty"/> is reserved for
        /// the system tenant during the tenancy migration.
        /// </summary>
        [Column("tenant_id")]
        public Guid TenantId { get; set; }

        /// <summary>
        /// Top-level device family this mapping belongs to (Tracking, Fueling, Atg).
        /// </summary>
        [Required]
        [MaxLength(40)]
        [Column("device_category")]
        public string DeviceCategory { get; set; } = "Tracking";

        /// <summary>
        /// Vehicle ID from vehicles table. Nullable to allow fueling device mappings that have
        /// no vehicle counterpart (T1.9 widening).
        /// </summary>
        [Column("vehicle_id")]
        public int? VehicleId { get; set; }

        /// <summary>
        /// Fueling device ID (e.g. PTS device id) when <see cref="DeviceCategory"/> is Fueling.
        /// Nullable; populated only for fueling mappings.
        /// </summary>
        [Column("fueling_device_id")]
        public int? FuelingDeviceId { get; set; }

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
        /// Device IMEI number
        /// </summary>
        [MaxLength(50)]
        [Column("device_imei")]
        public string? DeviceIMEI { get; set; }

        /// <summary>
        /// Device name from provider
        /// </summary>
        [MaxLength(200)]
        [Column("device_name")]
        public string? DeviceName { get; set; }

        /// <summary>
        /// Device type/model
        /// </summary>
        [MaxLength(100)]
        [Column("device_type")]
        public string? DeviceType { get; set; }

        /// <summary>
        /// Whether the device has a fuel sensor installed.
        /// This is cached from GPSGate API to avoid repeated lookups.
        /// </summary>
        [Column("has_fuel_sensor")]
        public bool? HasFuelSensor { get; set; }

        /// <summary>
        /// Type of fuel sensor if installed (e.g., "CapacitiveFuelSensor", "FlowMeter")
        /// </summary>
        [MaxLength(100)]
        [Column("fuel_sensor_type")]
        public string? FuelSensorType { get; set; }

        /// <summary>
        /// Last time the fuel sensor status was verified/updated
        /// </summary>
        [Column("fuel_sensor_verified_at")]
        public DateTime? FuelSensorVerifiedAt { get; set; }

        /// <summary>
        /// Additional device metadata (JSON)
        /// </summary>
        [Column("metadata", TypeName = "text")]
        public string? Metadata { get; set; }

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

        /// <summary>
        /// Navigation property to vehicle
        /// </summary>
        [ForeignKey("VehicleId")]
        public virtual Vehicle? Vehicle { get; set; }
    }
}
