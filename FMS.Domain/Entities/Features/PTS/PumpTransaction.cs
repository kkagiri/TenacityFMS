using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Pumptransaction
{
    public int Id { get; set; }

    public string PtsId { get; set; } = null!;

    public int PacketId { get; set; }

    public DateTime? DateTimeStart { get; set; }

    public DateTime DateTime { get; set; }

    public int? Pump { get; set; }

    public int? Nozzle { get; set; }

    public int? FuelGradeId { get; set; }

    public string? FuelGradeName { get; set; }

    public int? Transaction { get; set; }

    public decimal? Volume { get; set; }

    public decimal? Tcvolume { get; set; }

    public decimal? Price { get; set; }

    public decimal? Amount { get; set; }

    public decimal? TotalVolume { get; set; }

    public decimal? TotalAmount { get; set; }

    public string? Tag { get; set; }

    /// <summary>
    /// PTS User Id not to be confused with the UserId in the User table
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// PTS Configuration Id
    /// </summary>
    public string? ConfigurationId { get; set; }

    /// <summary>
    /// FK to Tank table - identifies which tank supplied the fuel
    /// </summary>
    public int? TankId { get; set; }

    /// <summary>
    /// FK to Vehicle table - identifies which vehicle received the fuel
    /// </summary>
    public int? VehicleId { get; set; }

    /// <summary>
    /// FK to Tank table - identifies destination tank for tank-to-tank transfers.
    /// This is only populated when IsTransferMode is true.
    /// For vehicle fueling, use VehicleId instead.
    /// </summary>
    public int? DestinationTankId { get; set; }

    /// <summary>
    /// FK to Employee table - identifies the driver/operator who performed the fueling.
    /// This is captured during pump authorization from mobile app.
    /// </summary>
    public int? EmployeeId { get; set; }

    /// <summary>
    /// Indicates whether this is a tank-to-tank transfer (true) or vehicle fueling (false).
    /// When true, TankId is source and DestinationTankId is destination.
    /// When false, TankId is source and VehicleId is the receiving vehicle.
    /// </summary>
    public bool IsTransferMode { get; set; } = false;

    /// <summary>
    /// Vehicle odometer reading at time of fueling (in kilometers or miles)
    /// Captured during pump authorization and stored with transaction
    /// </summary>
    public decimal? Odometer { get; set; }

    /// <summary>
    /// Mobile app GPS latitude at time of fueling authorization.
    /// Captured from mobile device during pump authorization.
    /// </summary>
    public decimal? MobileLatitude { get; set; }

    /// <summary>
    /// Mobile app GPS longitude at time of fueling authorization.
    /// Captured from mobile device during pump authorization.
    /// </summary>
    public decimal? MobileLongitude { get; set; }

    /// <summary>
    /// Mobile app GPS accuracy in meters at time of fueling.
    /// </summary>
    public decimal? MobileAccuracy { get; set; }

    /// <summary>
    /// Indicates whether this transaction has been processed by business logic
    /// </summary>
    public bool HasBeenProcessed { get; set; } = false; //Cursor

    public virtual ICollection<FuelRefill> Fuelrefils { get; set; } = new List<FuelRefill>();

    public virtual Ptsdevice Pts { get; set; } = null!;

    // Navigation properties to Tank and Vehicle
    public virtual Tank? Tank { get; set; }

    public virtual Vehicle? Vehicle { get; set; }

    /// <summary>
    /// Navigation property to destination tank (only for tank-to-tank transfers)
    /// </summary>
    public virtual Tank? DestinationTank { get; set; }

    /// <summary>
    /// Navigation property to employee (driver/operator)
    /// </summary>
    public virtual Employee? Employee { get; set; }
}