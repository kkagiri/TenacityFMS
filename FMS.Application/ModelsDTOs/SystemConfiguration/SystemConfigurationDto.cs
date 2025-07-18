using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.ModelsDTOs.SystemConfiguration {
    /// <summary>
    /// DTO for System Configuration display and transfer
    /// </summary>
    public class SystemConfigurationDto {
        public int Id { get; set; }

        [Required]
        [MaxLength (255)]
        public string ConfigurationKey { get; set; } = null!;

        [Required]
        [MaxLength (1000)]
        public string ConfigurationValue { get; set; } = null!;

        [MaxLength (500)]
        public string? Description { get; set; }

        [MaxLength (50)]
        public string? DataType { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsEditable { get; set; } = true;

        [MaxLength (100)]
        public string? Category { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        [MaxLength (100)]
        public string? CreatedBy { get; set; }

        [MaxLength (100)]
        public string? UpdatedBy { get; set; }

        [MaxLength (255)]
        public string? ValidationPattern { get; set; }

        public double? MinValue { get; set; }

        public double? MaxValue { get; set; }

        [MaxLength (1000)]
        public string? DefaultValue { get; set; }
    }

    /// <summary>
    /// DTO for creating a new System Configuration
    /// </summary>
    public class CreateSystemConfigurationDto {
        [Required]
        [MaxLength (255)]
        public string ConfigurationKey { get; set; } = null!;

        [Required]
        [MaxLength (1000)]
        public string ConfigurationValue { get; set; } = null!;

        [MaxLength (500)]
        public string? Description { get; set; }

        [MaxLength (50)]
        public string? DataType { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsEditable { get; set; } = true;

        [MaxLength (100)]
        public string? Category { get; set; }

        [MaxLength (255)]
        public string? ValidationPattern { get; set; }

        public double? MinValue { get; set; }

        public double? MaxValue { get; set; }

        [MaxLength (1000)]
        public string? DefaultValue { get; set; }
    }

    /// <summary>
    /// DTO for updating an existing System Configuration
    /// </summary>
    public class UpdateSystemConfigurationDto {
        public int Id { get; set; }

        [Required]
        [MaxLength (255)]
        public string ConfigurationKey { get; set; } = null!;

        [Required]
        [MaxLength (1000)]
        public string ConfigurationValue { get; set; } = null!;

        [MaxLength (500)]
        public string? Description { get; set; }

        [MaxLength (50)]
        public string? DataType { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsEditable { get; set; } = true;

        [MaxLength (100)]
        public string? Category { get; set; }

        [MaxLength (255)]
        public string? ValidationPattern { get; set; }

        public double? MinValue { get; set; }

        public double? MaxValue { get; set; }

        [MaxLength (1000)]
        public string? DefaultValue { get; set; }
    }
}