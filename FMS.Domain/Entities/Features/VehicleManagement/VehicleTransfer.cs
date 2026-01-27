using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.Features.VehicleManagement;

/// <summary>
/// Represents a vehicle transfer between sites with checkup report
/// Plant Equipment Transfer Checkup Report
/// </summary>
public class VehicleTransfer
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int TransferId { get; set; }

    /// <summary>
    /// Foreign key to Vehicle being transferred
    /// </summary>
    [Required]
    public int VehicleId { get; set; }

    /// <summary>
    /// Delivery Note Number (e.g., 757431)
    /// </summary>
    [MaxLength(50)]
    public string? DeliveryNoteNumber { get; set; }

    /// <summary>
    /// Site the vehicle is transferring FROM
    /// </summary>
    [Required]
    public int FromSiteId { get; set; }

    /// <summary>
    /// Site the vehicle is transferring TO
    /// </summary>
    [Required]
    public int ToSiteId { get; set; }

    /// <summary>
    /// Transfer date
    /// </summary>
    [Required]
    public DateTime TransferDate { get; set; }

    /// <summary>
    /// Driver performing the transfer
    /// </summary>
    public int? DriverId { get; set; }

    /// <summary>
    /// Driver name (for when driver is not in system)
    /// </summary>
    [MaxLength(200)]
    public string? DriverName { get; set; }

    /// <summary>
    /// Driver phone number
    /// </summary>
    [MaxLength(50)]
    public string? DriverPhone { get; set; }

    /// <summary>
    /// Job Number reference
    /// </summary>
    [MaxLength(50)]
    public string? JobNumber { get; set; }

    /// <summary>
    /// Equipment/Vehicle current reading (hrs/km)
    /// </summary>
    [Column(TypeName = "decimal(12,2)")]
    public decimal? CurrentReading { get; set; }

    /// <summary>
    /// Reading unit (hrs, km, miles)
    /// </summary>
    [MaxLength(20)]
    public string? ReadingUnit { get; set; } = "hrs";

    /// <summary>
    /// Next service reading
    /// </summary>
    [Column(TypeName = "decimal(12,2)")]
    public decimal? NextServiceReading { get; set; }

    /// <summary>
    /// Battery number/reference
    /// </summary>
    [MaxLength(100)]
    public string? BatteryNumber { get; set; }

    /// <summary>
    /// Make and Model (e.g., KOMATSU PC 350-8MO)
    /// </summary>
    [MaxLength(200)]
    public string? MakeModel { get; set; }

    /// <summary>
    /// Fuel amount in tank at transfer
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal? FuelInTank { get; set; }

    /// <summary>
    /// Seal number used
    /// </summary>
    [MaxLength(50)]
    public string? SealNumber { get; set; }

    /// <summary>
    /// Hour of departure
    /// </summary>
    public DateTime? DepartureTime { get; set; }

    /// <summary>
    /// Hour of arrival
    /// </summary>
    public DateTime? ArrivalTime { get; set; }

    /// <summary>
    /// Anti-theft checked (departure)
    /// </summary>
    public bool AntiTheftCheckedDeparture { get; set; }

    /// <summary>
    /// Anti-theft checked (arrival)
    /// </summary>
    public bool AntiTheftCheckedArrival { get; set; }

    /// <summary>
    /// Keys in envelope checked
    /// </summary>
    public bool KeysInEnvelopeChecked { get; set; }

    /// <summary>
    /// Transfer status (Pending, InTransit, Completed, Cancelled)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Pending";

    /// <summary>
    /// Overall remarks about the transfer
    /// </summary>
    [MaxLength(2000)]
    public string? Remarks { get; set; }

    /// <summary>
    /// Service filter part numbers (JSON or comma-separated)
    /// </summary>
    [MaxLength(2000)]
    public string? ServiceFilterParts { get; set; }

    /// <summary>
    /// Sender name who verified equipment
    /// </summary>
    [MaxLength(200)]
    public string? SenderName { get; set; }

    /// <summary>
    /// Sender function/role
    /// </summary>
    [MaxLength(200)]
    public string? SenderFunction { get; set; }

    /// <summary>
    /// Receiver name who confirmed receipt
    /// </summary>
    [MaxLength(200)]
    public string? ReceiverName { get; set; }

    /// <summary>
    /// Receiver function/role
    /// </summary>
    [MaxLength(200)]
    public string? ReceiverFunction { get; set; }

    /// <summary>
    /// Manager who approved the transfer
    /// </summary>
    [MaxLength(200)]
    public string? ApprovedBy { get; set; }

    /// <summary>
    /// Workshop manager/supervisor who signed
    /// </summary>
    [MaxLength(200)]
    public string? WorkshopManagerSign { get; set; }

    /// <summary>
    /// Transfer document file URL
    /// </summary>
    [MaxLength(500)]
    public string? DocumentUrl { get; set; }

    /// <summary>
    /// Transfer document file name
    /// </summary>
    [MaxLength(255)]
    public string? DocumentFileName { get; set; }

    /// <summary>
    /// Email notification sent
    /// </summary>
    public bool EmailSent { get; set; }

    /// <summary>
    /// Date email was sent
    /// </summary>
    public DateTime? EmailSentDate { get; set; }

    /// <summary>
    /// User who created the record
    /// </summary>
    [MaxLength(255)]
    public string? CreatedBy { get; set; }

    /// <summary>
    /// User who last modified the record
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

    // =============================================
    // GPS Equipment Checkup Section
    // =============================================

    /// <summary>
    /// GPS Device ID/Serial Number
    /// </summary>
    [MaxLength(100)]
    public string? GpsDeviceId { get; set; }

    /// <summary>
    /// GPS Device condition (Good, Fair, Damaged, Not Working)
    /// </summary>
    [MaxLength(50)]
    public string? GpsDeviceCondition { get; set; }

    /// <summary>
    /// GPS Device working status
    /// </summary>
    public bool GpsDeviceWorking { get; set; } = true;

    /// <summary>
    /// GPS Device remarks
    /// </summary>
    [MaxLength(500)]
    public string? GpsDeviceRemarks { get; set; }

    /// <summary>
    /// Fuel Sensor ID/Serial Number
    /// </summary>
    [MaxLength(100)]
    public string? FuelSensorId { get; set; }

    /// <summary>
    /// Fuel Sensor condition (Good, Fair, Damaged, Not Working)
    /// </summary>
    [MaxLength(50)]
    public string? FuelSensorCondition { get; set; }

    /// <summary>
    /// Fuel Sensor working status
    /// </summary>
    public bool FuelSensorWorking { get; set; } = true;

    /// <summary>
    /// Fuel Sensor remarks
    /// </summary>
    [MaxLength(500)]
    public string? FuelSensorRemarks { get; set; }

    /// <summary>
    /// Vehicle Manufacturer name (from vehicle details)
    /// </summary>
    [MaxLength(200)]
    public string? VehicleManufacturer { get; set; }

    /// <summary>
    /// Vehicle Model name (from vehicle details)
    /// </summary>
    [MaxLength(200)]
    public string? VehicleModelName { get; set; }

    // Navigation properties
    public virtual Vehicle? Vehicle { get; set; }
    public virtual Site? FromSite { get; set; }
    public virtual Site? ToSite { get; set; }
    public virtual Employee? Driver { get; set; }

    // Related checkup items
    public virtual ICollection<VehicleTransferCheckupItem> CheckupItems { get; set; } = new List<VehicleTransferCheckupItem>();

    // Tyre details (could be many)
    public virtual ICollection<VehicleTransferTyreDetail> TyreDetails { get; set; } = new List<VehicleTransferTyreDetail>();

    // Battery details (could be many)
    public virtual ICollection<VehicleTransferBatteryDetail> BatteryDetails { get; set; } = new List<VehicleTransferBatteryDetail>();
}

/// <summary>
/// Individual checkup item in the transfer report
/// </summary>
public class VehicleTransferCheckupItem
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int TransferId { get; set; }

    /// <summary>
    /// Serial number in checkup list
    /// </summary>
    public int SerialNo { get; set; }

    /// <summary>
    /// Check-up description (e.g., "SUSPENSION", "BRAKES, INDICATORS, GAUGES")
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Check or test type (CHECK, TEST, DRAIN, CHECK & CLEAN, etc.)
    /// </summary>
    [MaxLength(50)]
    public string? CheckType { get; set; }

    /// <summary>
    /// Is this item verified as GOOD
    /// </summary>
    public bool? IsGood { get; set; }

    /// <summary>
    /// Is this item FAIR condition
    /// </summary>
    public bool? IsFair { get; set; }

    /// <summary>
    /// Is this item DAMAGED
    /// </summary>
    public bool? IsDamaged { get; set; }

    /// <summary>
    /// Is this item WORN
    /// </summary>
    public bool? IsWorn { get; set; }

    /// <summary>
    /// Wear percentage (for tyres, etc.)
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal? WornPercentage { get; set; }

    /// <summary>
    /// Remarks for this checkup item
    /// </summary>
    [MaxLength(500)]
    public string? Remarks { get; set; }

    // Navigation
    public virtual VehicleTransfer? Transfer { get; set; }
}

/// <summary>
/// Tyre details for transfer checkup
/// </summary>
public class VehicleTransferTyreDetail
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int TransferId { get; set; }

    /// <summary>
    /// Tyre position (e.g., Front Left, Front Right, Rear Left, Rear Right)
    /// </summary>
    [MaxLength(50)]
    public string? Position { get; set; }

    /// <summary>
    /// Tyre brand/make
    /// </summary>
    [MaxLength(100)]
    public string? Brand { get; set; }

    /// <summary>
    /// Tyre size
    /// </summary>
    [MaxLength(50)]
    public string? Size { get; set; }

    /// <summary>
    /// Tread depth or condition percentage
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal? Condition { get; set; }

    /// <summary>
    /// Remarks
    /// </summary>
    [MaxLength(200)]
    public string? Remarks { get; set; }

    // Navigation
    public virtual VehicleTransfer? Transfer { get; set; }
}

/// <summary>
/// Battery details for transfer checkup
/// </summary>
public class VehicleTransferBatteryDetail
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int TransferId { get; set; }

    /// <summary>
    /// Battery number/serial
    /// </summary>
    [MaxLength(100)]
    public string? BatteryNumber { get; set; }

    /// <summary>
    /// Battery condition
    /// </summary>
    [MaxLength(50)]
    public string? Condition { get; set; }

    /// <summary>
    /// Voltage reading
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal? Voltage { get; set; }

    /// <summary>
    /// Remarks
    /// </summary>
    [MaxLength(200)]
    public string? Remarks { get; set; }

    // Navigation
    public virtual VehicleTransfer? Transfer { get; set; }
}
