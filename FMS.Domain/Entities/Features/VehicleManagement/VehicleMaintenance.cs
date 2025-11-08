using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.Features.VehicleManagement;

/// <summary>
/// Represents a vehicle maintenance record with odometer tracking and issue management
/// </summary>
public class VehicleMaintenance
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int MaintenanceId { get; set; }

    /// <summary>
    /// Foreign key to Vehicle
    /// </summary>
    [Required]
    public int VehicleId { get; set; }

    /// <summary>
    /// Type of maintenance (Oil Change, Tire Rotation, Brake Service, etc.)
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string MaintenanceType { get; set; } = null!;

    /// <summary>
    /// Current status (Scheduled, In Progress, Completed, Cancelled)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Scheduled";

    /// <summary>
    /// Scheduled date for maintenance
    /// </summary>
    public DateTime? ScheduledDate { get; set; }

    /// <summary>
    /// Actual date when maintenance was performed
    /// </summary>
    public DateTime? CompletedDate { get; set; }

    /// <summary>
    /// Odometer reading when maintenance was scheduled
    /// </summary>
    public decimal? OdometerAtSchedule { get; set; }

    /// <summary>
    /// Actual odometer reading when maintenance was performed (can be from GPS)
    /// </summary>
    public decimal? OdometerAtCompletion { get; set; }

    /// <summary>
    /// Next scheduled odometer reading for this type of maintenance
    /// </summary>
    public decimal? NextDueOdometer { get; set; }

    /// <summary>
    /// Next scheduled date for this type of maintenance
    /// </summary>
    public DateTime? NextDueDate { get; set; }

    /// <summary>
    /// Cost of the maintenance
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal? Cost { get; set; }

    /// <summary>
    /// Service provider or mechanic name
    /// </summary>
    [MaxLength(200)]
    public string? ServiceProvider { get; set; }

    /// <summary>
    /// Description of work performed
    /// </summary>
    [MaxLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Additional notes about the maintenance
    /// </summary>
    [MaxLength(2000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Issue note - specific notes about any issues encountered during maintenance
    /// </summary>
    [MaxLength(2000)]
    public string? IssueNote { get; set; }

    /// <summary>
    /// Priority level (1=Low, 2=Normal, 3=High, 4=Critical)
    /// </summary>
    public int Priority { get; set; } = 2;

    /// <summary>
    /// Is this maintenance overdue?
    /// </summary>
    public bool IsOverdue { get; set; } = false;

    /// <summary>
    /// User who created the maintenance record
    /// </summary>
    [MaxLength(255)]
    public string? CreatedBy { get; set; }

    /// <summary>
    /// User who last updated the maintenance record
    /// </summary>
    [MaxLength(255)]
    public string? ModifiedBy { get; set; }

    /// <summary>
    /// User responsible for the maintenance work
    /// </summary>
    [MaxLength(255)]
    public string? ResponsiblePerson { get; set; }

    /// <summary>
    /// Timestamp when record was created
    /// </summary>
    public DateTime DateCreated { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when record was last modified
    /// </summary>
    public DateTime? DateModified { get; set; }

    /// <summary>
    /// Foreign key to MaintenanceSchedule (optional link to schedule configuration)
    /// </summary>
    public int? MaintenanceScheduleId { get; set; }

    // Navigation properties
    public virtual Vehicle? Vehicle { get; set; }
    public virtual MaintenanceSchedule? MaintenanceSchedule { get; set; }
    public virtual ICollection<MaintenanceIssue> Issues { get; set; } = new List<MaintenanceIssue>();
    public virtual User? CreatedByNavigation { get; set; }
    public virtual User? ModifiedByNavigation { get; set; }
}
