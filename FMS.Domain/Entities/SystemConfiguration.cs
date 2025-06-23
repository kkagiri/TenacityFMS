using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities
{
    //Cursor on changes to code
    /// <summary>
    /// System-wide configuration entity for storing editable settings in database
    /// These settings override defaults and appsettings.json values
    /// </summary>
    [Table("SystemConfigurations")]
    public class SystemConfiguration
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Configuration key (e.g., "System.WebSocketTimeout")
        /// </summary>
        [Required]
        [MaxLength(255)]
        public string ConfigurationKey { get; set; } = null!;

        /// <summary>
        /// Configuration value as string (will be parsed to appropriate type)
        /// </summary>
        [Required]
        [MaxLength(1000)]
        public string ConfigurationValue { get; set; } = null!;

        /// <summary>
        /// Description of what this configuration does
        /// </summary>
        [MaxLength(500)]
        public string? Description { get; set; }

        /// <summary>
        /// Data type of the configuration value (Int, String, Bool, TimeSpan, etc.)
        /// </summary>
        [MaxLength(50)]
        public string? DataType { get; set; }

        /// <summary>
        /// Whether this configuration is currently active
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Whether this configuration is editable by users
        /// </summary>
        public bool IsEditable { get; set; } = true;

        /// <summary>
        /// Category for grouping related configurations
        /// </summary>
        [MaxLength(100)]
        public string? Category { get; set; }

        /// <summary>
        /// When this configuration was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When this configuration was last updated
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Who created this configuration
        /// </summary>
        [MaxLength(100)]
        public string? CreatedBy { get; set; }

        /// <summary>
        /// Who last updated this configuration
        /// </summary>
        [MaxLength(100)]
        public string? UpdatedBy { get; set; }

        /// <summary>
        /// Validation regex pattern for the value (optional)
        /// </summary>
        [MaxLength(255)]
        public string? ValidationPattern { get; set; }

        /// <summary>
        /// Minimum allowed value (for numeric types)
        /// </summary>
        public double? MinValue { get; set; }

        /// <summary>
        /// Maximum allowed value (for numeric types)
        /// </summary>
        public double? MaxValue { get; set; }

        /// <summary>
        /// Default value for this configuration
        /// </summary>
        [MaxLength(1000)]
        public string? DefaultValue { get; set; }
    }
}