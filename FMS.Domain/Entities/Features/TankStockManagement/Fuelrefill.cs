using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class FuelRefill {

    public int Id { get; set; }

    public int VehicleId { get; set; }

    public decimal? ManualFuelrefillAmount { get; set; }

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
    // public string? CreatedBy { get; set; }
    public DateTime? DateModified { get; set; }
    public string? ModifiedBy { get; set; }

    public sbyte? IsModified { get; set; }

    // Soft delete properties
    /// <summary>
    /// Indicates if this record has been soft deleted
    /// </summary>
    public bool IsDeleted { get; set; } = false;

    /// <summary>
    /// When this record was soft deleted
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    /// <summary>
    /// User who soft deleted this record
    /// </summary>
    public string? DeletedBy { get; set; }

    // Correction tracking properties
    /// <summary>
    /// Indicates if this record is a correction entry
    /// </summary>
    public bool IsCorrection { get; set; } = false;

    /// <summary>
    /// Reference to the original record ID that this entry corrects (if this is a correction)
    /// </summary>
    public int? CorrectsRecordId { get; set; }

    /// <summary>
    /// Reason for the correction
    /// </summary>
    public string? CorrectionReason { get; set; }

    public virtual Tank? Tank { get; set; }

    public virtual Employee? Driver { get; set; }

    public virtual User FuelByNavigation { get; set; } = null!;
    public virtual User? DeletedByNavigation { get; set; }

    public virtual Pumptransaction? PumpTranscation { get; set; }

    public virtual Site Site { get; set; } = null!;

    public virtual FuelTag TagNavigation { get; set; } = null!;
    public virtual Vehicle Vehicle { get; set; } = null!;

    // Self-referencing relationship for corrections
    public virtual FuelRefill? CorrectsRecord { get; set; }
    public virtual ICollection<FuelRefill> CorrectionRecords { get; set; } = [];
}