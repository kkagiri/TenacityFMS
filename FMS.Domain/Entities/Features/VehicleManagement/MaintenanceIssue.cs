using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.Features.VehicleManagement;

/// <summary>
/// Represents an issue or note related to a specific maintenance record
/// Tracks who reported issues and their details
/// </summary>
public class MaintenanceIssue
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int IssueId { get; set; }

    /// <summary>
    /// Foreign key to VehicleMaintenance
    /// </summary>
    [Required]
    public int MaintenanceId { get; set; }

    /// <summary>
    /// Issue type (Problem Found, Quality Issue, Delay, Additional Work Required, etc.)
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string IssueType { get; set; } = null!;

    /// <summary>
    /// Severity (Low, Medium, High, Critical)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Severity { get; set; } = "Medium";

    /// <summary>
    /// Detailed description of the issue
    /// </summary>
    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = null!;

    /// <summary>
    /// Current status (Open, In Progress, Resolved, Closed)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Open";

    /// <summary>
    /// Person responsible for the issue (who was at fault or needs to fix it)
    /// </summary>
    [MaxLength(255)]
    public string? ResponsiblePerson { get; set; }

    /// <summary>
    /// User who reported the issue
    /// </summary>
    [MaxLength(255)]
    public string? ReportedBy { get; set; }

    /// <summary>
    /// When was this issue reported
    /// </summary>
    public DateTime DateReported { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When was this issue resolved
    /// </summary>
    public DateTime? DateResolved { get; set; }

    /// <summary>
    /// Resolution notes
    /// </summary>
    [MaxLength(2000)]
    public string? ResolutionNotes { get; set; }

    /// <summary>
    /// Additional cost incurred due to this issue
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal? AdditionalCost { get; set; }

    /// <summary>
    /// User who created the issue record
    /// </summary>
    [MaxLength(255)]
    public string? CreatedBy { get; set; }

    /// <summary>
    /// User who last updated the issue record
    /// </summary>
    [MaxLength(255)]
    public string? ModifiedBy { get; set; }

    /// <summary>
    /// Timestamp when record was created
    /// </summary>
    public DateTime DateCreated { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when record was last modified
    /// </summary>
    public DateTime? DateModified { get; set; }

    // Navigation properties
    public virtual VehicleMaintenance? Maintenance { get; set; }
    public virtual User? CreatedByNavigation { get; set; }
    public virtual User? ModifiedByNavigation { get; set; }
}
