using FMS.Domain.Entities.enums;
using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

/// <summary>
/// Represents the tank's stock levels at specific points in time, typically at the start and end of a day or shift.
/// </summary>
public partial class Tankstock
{
    public int EntryId { get; set; }

    public int TankId { get; set; }

    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public DateTime EntryDate { get; set; }

    public decimal? ManualOpeningLevel { get; set; }

    public decimal? ManualClosingLevel { get; set; }

    /// <summary>
    /// Physical meter reading at the time of opening stock.
    /// Only applicable when EntryType is OpeningStock.
    /// </summary>
    public decimal? OpeningMeter { get; set; }

    /// <summary>
    /// Physical meter reading at the time of closing stock.
    /// Only applicable when EntryType is ClosingStock.
    /// </summary>
    public decimal? ClosingMeter { get; set; }

    public decimal? ManualAmount { get; set; }

    public decimal? ManualCalculatedUsage { get; set; }

    public decimal? SensorOpeningLevel { get; set; }

    public decimal? ExpectedClosingLevel { get; set; }
    public decimal? Discrepancy { get; set; }

    public decimal? SensorClosingLevel { get; set; }

    public string RecordedBy { get; set; } = null!;

    public int SiteId { get; set; }

    public decimal? SensorCalculatedUsage { get; set; }

    public string? Comment { get; set; }

    public VolumeChangeReasonEnum EntryType { get; set; }

    public decimal? SensorDiscrepancy { get; set; }

    /// <summary>
    /// Total delivery amount for this tank on this day.
    /// Cumulative if multiple deliveries happen (though typically only one per day).
    /// </summary>
    public decimal? DeliveryAmount { get; set; }

    /// <summary>
    /// Reference to the Delivery record if delivery occurred.
    /// </summary>
    public int? DeliveryId { get; set; }

    /// <summary>
    /// Total fuel transferred INTO this tank from other tanks on this day.
    /// </summary>
    public decimal? TransferInAmount { get; set; }

    /// <summary>
    /// Total fuel transferred OUT of this tank to other tanks on this day.
    /// </summary>
    public decimal? TransferOutAmount { get; set; }

    /// <summary>
    /// Reference to the TankTransfer record if transfer occurred.
    /// For multiple transfers, stores the most recent one.
    /// </summary>
    public int? TransferRecordId { get; set; }

    /// <summary>
    /// Unique identifier for the import batch (GUID format).
    /// Links multiple tankstock entries that were imported together.
    /// </summary>
    public string? ImportBatchId { get; set; }

    /// <summary>
    /// Timestamp when the record was imported via bulk import.
    /// Null for manually created or API-created records.
    /// </summary>
    public DateTime? ImportedAt { get; set; }

    /// <summary>
    /// Source of the tankstock entry: 'BulkImport', 'Manual', 'API', 'PTS'
    /// </summary>
    public string? ImportSource { get; set; }

    /// <summary>
    /// Soft delete flag - indicates if the record has been deleted.
    /// </summary>
    public bool IsDeleted { get; set; } = false;

    /// <summary>
    /// Timestamp when the record was soft deleted.
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    /// <summary>
    /// User ID who deleted the record.
    /// </summary>
    public string? DeletedBy { get; set; }

    /// <summary>
    /// Unique key for active entries only (used for unique constraint).
    /// Format: "{TankId}-{EntryDate}" when IsDeleted = false, NULL when IsDeleted = true.
    /// This allows multiple soft-deleted entries but only one active entry per tank-date.
    /// </summary>
    public string? ActiveEntryKey { get; set; }

    public virtual User RecordedByNavigation { get; set; } = null!;

    public virtual Site Site { get; set; } = null!;

    public virtual Tank Tank { get; set; } = null!;
}
