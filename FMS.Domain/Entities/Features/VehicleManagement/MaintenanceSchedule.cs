using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.Features.VehicleManagement;

/// <summary>
/// Represents a maintenance schedule configuration for specific maintenance types
/// Defines when maintenance should be performed (odometer or time-based)
/// </summary>
public class MaintenanceSchedule
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ScheduleId { get; set; }

    /// <summary>
    /// Name of the maintenance type (Oil Change, Tire Rotation, etc.)
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string MaintenanceType { get; set; } = null!;

    /// <summary>
    /// Description of what this maintenance involves
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Interval in kilometers (e.g., 5000 for every 5000 km)
    /// </summary>
    public decimal? IntervalKilometers { get; set; }

    /// <summary>
    /// Interval in days (e.g., 180 for every 6 months)
    /// </summary>
    public int? IntervalDays { get; set; }

    /// <summary>
    /// Warning threshold in kilometers before due (e.g., 500 km before)
    /// </summary>
    public decimal? WarningThresholdKm { get; set; }

    /// <summary>
    /// Warning threshold in days before due (e.g., 14 days before)
    /// </summary>
    public int? WarningThresholdDays { get; set; }

    /// <summary>
    /// Estimated cost for this maintenance
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal? EstimatedCost { get; set; }

    /// <summary>
    /// Applies to specific vehicle type (optional filter)
    /// </summary>
    public int? VehicleTypeId { get; set; }

    /// <summary>
    /// Is this schedule active?
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Can apply to all vehicles or specific vehicle
    /// </summary>
    public bool ApplyToAllVehicles { get; set; } = true;

    /// <summary>
    /// If ApplyToAllVehicles is false, this specifies which vehicle
    /// </summary>
    public int? VehicleId { get; set; }

    /// <summary>
    /// Priority level (1=Low, 2=Normal, 3=High, 4=Critical)
    /// </summary>
    public int DefaultPriority { get; set; } = 2;

    /// <summary>
    /// User who created the schedule
    /// </summary>
    [MaxLength(255)]
    public string? CreatedBy { get; set; }

    /// <summary>
    /// User who last updated the schedule
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
    public virtual Vehicle? Vehicle { get; set; }
    public virtual Vehicletype? VehicleType { get; set; }
    public virtual ICollection<VehicleMaintenance> MaintenanceRecords { get; set; } = new List<VehicleMaintenance>();
    public virtual User? CreatedByNavigation { get; set; }
    public virtual User? ModifiedByNavigation { get; set; }
}
