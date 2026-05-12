using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.Features.Reporting
{
    [Table("report_schedules")]
    public class ReportSchedule
    {
        [Key]
        [Column("ReportScheduleId")]
        public long ReportScheduleId { get; set; }

        [Required]
        [Column("ScheduleName")]
        [StringLength(200)]
        public string ScheduleName { get; set; } = string.Empty;

        [Column("Description")]
        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        [Column("ReportSourceId")]
        [StringLength(100)]
        public string ReportSourceId { get; set; } = string.Empty;

        [Column("Filters", TypeName = "TEXT")]
        public string? Filters { get; set; } // JSON — parameter values

        [Required]
        [Column("OutputFormat")]
        [StringLength(20)]
        public string OutputFormat { get; set; } = "pdf"; // html, pdf, excel, csv

        [Required]
        [Column("Frequency")]
        [StringLength(50)]
        public string Frequency { get; set; } = "once"; // once, daily, weekly, monthly

        [Column("RepeatCount")]
        public int RepeatCount { get; set; } = 1; // 0 = unlimited

        [Column("ExecutedCount")]
        public int ExecutedCount { get; set; } = 0;

        [Column("Recipients", TypeName = "TEXT")]
        public string? Recipients { get; set; } // JSON array of email addresses

        [Column("ScheduleConfig", TypeName = "TEXT")]
        public string? ScheduleConfig { get; set; } // JSON — periodType, days, weeks, time, timeZone

        [Column("ScheduledAt")]
        public DateTime ScheduledAt { get; set; }

        [Column("LastExecutedAt")]
        public DateTime? LastExecutedAt { get; set; }

        [Column("NextExecutionAt")]
        public DateTime? NextExecutionAt { get; set; }

        [Required]
        [Column("Status")]
        [StringLength(20)]
        public string Status { get; set; } = "active"; // active, paused, completed, cancelled, failed

        [Column("ErrorMessage", TypeName = "TEXT")]
        public string? ErrorMessage { get; set; }

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

        [Column("CancelledAt")]
        public DateTime? CancelledAt { get; set; }

        [Column("CancelledBy")]
        [StringLength(100)]
        public string? CancelledBy { get; set; }
    }
}
