using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Fuelrefil {

    public int Id { get; set; }

    public int VehicleId { get; set; }

    public decimal? ManualFuelrefilAmount { get; set; }

    public DateTime? Date { get; set; }

    public decimal? PreviousMeterReading { get; set; }

    public decimal? CurrentMeterReading { get; set; }

    public int SiteId { get; set; }

    public string? Comment { get; set; }

    public string FuelBy { get; set; } = null!;

    public int? PumpTranscationId { get; set; }

    public int? DriverId { get; set; }
    /// <summary>
    /// TagId is the name of the tag example : 123ABC1234
    /// </summary>
    /// <value>123ABC1234</value>
    //TODO: make a foreign key to the Tag table
    public string? TagId { get; set; }
    public int? TankId { get; set; }
    public DateTime DateCreated { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? DateModified { get; set; }
    public string? ModifiedBy { get; set; }

    public sbyte? IsModified { get; set; }

    public virtual Tank? Tank { get; set; }

    public virtual Employee? Driver { get; set; }

    public virtual User FuelByNavigation { get; set; } = null!;

    public virtual Pumptransaction? PumpTranscation { get; set; }

    public virtual Site Site { get; set; } = null!;

    public virtual Tag TagNavigation { get; set; } = null!;
    public virtual Vehicle Vehicle { get; set; } = null!;
}