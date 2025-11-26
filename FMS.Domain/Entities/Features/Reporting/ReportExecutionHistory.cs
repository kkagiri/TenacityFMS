using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.Features.Reporting
{
    [Table("report_execution_history")]
    public class ReportExecutionHistory
    {
        [Key]
        [Column("ReportExecutionId")]
        public long ReportExecutionId { get; set; }

        [Column("ReportDefinitionId")]
        public int ReportDefinitionId { get; set; }

        [Required]
        [Column("ExecutedBy")]
        [StringLength(100)]
        public string ExecutedBy { get; set; } = string.Empty;

        [Column("ExecutedAt")]
        public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;

        [Column("Filters", TypeName = "TEXT")]
        public string? Filters { get; set; } // JSON filters

        [Column("ExportFormat")]
        [StringLength(50)]
        public string? ExportFormat { get; set; } // json, excel, pdf, csv

        [Column("RecordCount")]
        public int? RecordCount { get; set; }

        [Column("ExecutionTimeMs")]
        public int? ExecutionTimeMs { get; set; }

        [Column("Success")]
        public bool Success { get; set; } = true;

        [Column("ErrorMessage", TypeName = "TEXT")]
        public string? ErrorMessage { get; set; }

        [Column("IpAddress")]
        [StringLength(50)]
        public string? IpAddress { get; set; }

        [Column("UserAgent")]
        [StringLength(500)]
        public string? UserAgent { get; set; }

        // Navigation property
        [ForeignKey("ReportDefinitionId")]
        public virtual ReportDefinition? ReportDefinition { get; set; }
    }
}
