using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.Features.Reporting
{
    [Table("report_definitions")]
    public class ReportDefinition
    {
        [Key]
        [Column("ReportDefinitionId")]
        public int ReportDefinitionId { get; set; }

        [Required]
        [Column("ReportId")]
        [StringLength(100)]
        public string ReportId { get; set; } = string.Empty;

        [Required]
        [Column("ReportName")]
        [StringLength(200)]
        public string ReportName { get; set; } = string.Empty;

        [Column("Description")]
        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        [Column("Category")]
        [StringLength(100)]
        public string Category { get; set; } = string.Empty;

        [Column("ReportType")]
        public int ReportType { get; set; } // 0=DataGrid, 1=PivotGrid, 2=Chart, 3=Dashboard

        [Column("Icon")]
        [StringLength(100)]
        public string? Icon { get; set; } = "fa-light fa-file-chart-column";

        [Required]
        [Column("DataSourceEndpoint")]
        [StringLength(500)]
        public string DataSourceEndpoint { get; set; } = string.Empty;

        [Column("RequiredPermission")]
        [StringLength(100)]
        public string? RequiredPermission { get; set; }

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("IsPublic")]
        public bool IsPublic { get; set; } = true;

        [Column("IsBuiltIn")]
        public bool IsBuiltIn { get; set; } = false;

        [Column("Configuration", TypeName = "TEXT")]
        public string? Configuration { get; set; } // JSON configuration

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("CreatedBy")]
        [StringLength(100)]
        public string? CreatedBy { get; set; }

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
    }
}
