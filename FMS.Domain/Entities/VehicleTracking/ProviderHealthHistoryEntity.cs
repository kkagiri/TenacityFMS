using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.VehicleTracking
{
    /// <summary>
    /// Database entity for tracking provider health history
    /// </summary>
    [Table("provider_health_history")]
    public class ProviderHealthHistoryEntity
    {
        /// <summary>
        /// Primary key
        /// </summary>
        [Key]
        [Column("id")]
        public int Id { get; set; }

        /// <summary>
        /// Foreign key to provider configuration
        /// </summary>
        [Column("provider_config_id")]
        public int ProviderConfigId { get; set; }

        /// <summary>
        /// Provider name (denormalized for query performance)
        /// </summary>
        [Required]
        [MaxLength(100)]
        [Column("provider_name")]
        public string ProviderName { get; set; } = string.Empty;

        /// <summary>
        /// Health status: Healthy, Degraded, Unhealthy, Unknown
        /// </summary>
        [Required]
        [MaxLength(50)]
        [Column("status")]
        public string Status { get; set; } = "Unknown";

        /// <summary>
        /// Status message or error details
        /// </summary>
        [Column("message", TypeName = "text")]
        public string? Message { get; set; }

        /// <summary>
        /// Response time in milliseconds
        /// </summary>
        [Column("response_time_ms")]
        public int? ResponseTimeMs { get; set; }

        /// <summary>
        /// Success rate (0-100)
        /// </summary>
        [Column("success_rate")]
        public decimal? SuccessRate { get; set; }

        /// <summary>
        /// Number of errors encountered
        /// </summary>
        [Column("error_count")]
        public int ErrorCount { get; set; } = 0;

        /// <summary>
        /// Additional metrics as JSON
        /// </summary>
        [Column("additional_metrics", TypeName = "json")]
        public string? AdditionalMetrics { get; set; }

        /// <summary>
        /// Timestamp when health check was performed
        /// </summary>
        [Column("checked_at")]
        public DateTime CheckedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Navigation property to provider configuration
        /// </summary>
        [ForeignKey("ProviderConfigId")]
        public virtual ProviderConfigurationEntity? ProviderConfiguration { get; set; }
    }
}
