 using System.ComponentModel.DataAnnotations;
 using System;

 namespace FMS.Domain.Entities {
     /// <summary>
     /// Represents a generated stock report stored in the database
     /// This entity tracks generated reports with metadata about generation, status, and file information
     /// </summary>
     //Cursor - Added StockReport entity for real data implementation
     public partial class StockReport {
         public int Id { get; set; }

         /// <summary>
         /// Type of stock report (summary, variance, utilization, movements)
         /// </summary>
         [StringLength (50)]
         public string ReportType { get; set; } = null!;

         /// <summary>
         /// Date and time when the report was generated
         /// </summary>
         public DateTime GeneratedDate { get; set; }

         /// <summary>
         /// User who generated the report
         /// </summary>
         [StringLength (450)]
         public string GeneratedBy { get; set; } = null!;

         /// <summary>
         /// Status of the report: 0=Generating, 1=Completed, 2=Failed
         /// </summary>
         public int Status { get; set; } = 1;

         /// <summary>
         /// Start date for the report data range
         /// </summary>
         public DateTime? StartDate { get; set; }

         /// <summary>
         /// End date for the report data range
         /// </summary>
         public DateTime? EndDate { get; set; }

         /// <summary>
         /// Site ID if report is site-specific
         /// </summary>
         public int? SiteId { get; set; }

         /// <summary>
         /// File path where the report is stored (optional)
         /// </summary>
         [StringLength (500)]
         public string? FilePath { get; set; }

         /// <summary>
         /// File name of the generated report
         /// </summary>
         [StringLength (255)]
         public string? FileName { get; set; }

         /// <summary>
         /// MIME type of the report file (e.g., application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
         /// </summary>
         [StringLength (100)]
         public string? ContentType { get; set; }

         /// <summary>
         /// Size of the report file in bytes
         /// </summary>
         public long? FileSize { get; set; }

         /// <summary>
         /// Additional parameters used for report generation (stored as JSON)
         /// </summary>
         [StringLength (1000)]
         public string? Parameters { get; set; }

         /// <summary>
         /// Error message if report generation failed
         /// </summary>
         [StringLength (500)]
         public string? ErrorMessage { get; set; }

         /// <summary>
         /// When the report record was created
         /// </summary>
         public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

         /// <summary>
         /// When the report record was last updated
         /// </summary>
         public DateTime? UpdatedOn { get; set; }

         // Navigation properties
         public virtual User GeneratedByNavigation { get; set; } = null!;
         public virtual Site? Site { get; set; }
     }
 }