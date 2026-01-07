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
    /// Vehicle odometer reading at time of fueling (in kilometers or miles)
    /// Captured during pump authorization and stored with transaction
    /// </summary>
    public decimal? Odometer { get; set; }

    /// <summary>
    /// Indicates whether this transaction has been processed by business logic
    /// </summary>
    public bool HasBeenProcessed { get; set; } = false; //Cursor

    public virtual ICollection<FuelRefill> Fuelrefils { get; set; } = new List<FuelRefill>();

    public virtual Ptsdevice Pts { get; set; } = null!;

    // Navigation properties to Tank and Vehicle
    public virtual Tank? Tank { get; set; }

    public virtual Vehicle? Vehicle { get; set; }
}