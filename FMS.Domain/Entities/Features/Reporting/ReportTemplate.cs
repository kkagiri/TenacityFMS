using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.Features.Reporting
{
    [Table("report_templates")]
    public class ReportTemplate
    {
        [Key]
        [Column("ReportTemplateId")]
        public int ReportTemplateId { get; set; }

        [Required]
        [Column("TemplateId")]
        [StringLength(36)]
        public string TemplateId { get; set; } = Guid.NewGuid().ToString();

        [Column("ReportDefinitionId")]
        public int ReportDefinitionId { get; set; }

        [Required]
        [Column("TemplateName")]
        [StringLength(200)]
        public string TemplateName { get; set; } = string.Empty;

        [Column("Description")]
        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        [Column("Configuration", TypeName = "TEXT")]
        public string Configuration { get; set; } = string.Empty; // JSON configuration

        [Column("IsDefault")]
        public bool IsDefault { get; set; } = false;

        [Column("IsShared")]
        public bool IsShared { get; set; } = false;

        [Required]
        [Column("CreatedBy")]
        [StringLength(100)]
        public string CreatedBy { get; set; } = string.Empty;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("ModifiedAt")]
        public DateTime? ModifiedAt { get; set; }

        [Column("ModifiedBy")]
        [StringLength(100)]
        public string? ModifiedBy { get; set; }

        [Column("DeletedAt")]
        public DateTime? DeletedAt { get; set; }

        [Column("DeletedBy")]
        [StringLength(100)]
        public string? DeletedBy { get; set; }

        [Column("IsDeleted")]
        public bool IsDeleted { get; set; } = false;

        // Navigation property
        [ForeignKey("ReportDefinitionId")]
        public virtual ReportDefinition? ReportDefinition { get; set; }
    }
}
