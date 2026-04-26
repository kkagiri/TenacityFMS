using System;
using FMS.Domain.Entities.GPSGate;

namespace FMS.Domain.Entities
{
    /// <summary>
    /// Stores processed GPSGate Report 212 (Fuel Refill) entries.
    /// Allows editing and soft deletion of GPS-reported refueling events.
    /// Used by FuelAudit for variance analysis between GPS-reported and tank-measured fuel.
    /// </summary>
    public class GpsGateReportEntry
    {
        public int Id { get; set; }
        public int ReportId { get; set; }
        public int VehicleId { get; set; }
        public DateTime DispenseDate { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? Duration { get; set; }
        public decimal? FuelBefore { get; set; }
        public decimal? FuelAfter { get; set; }
        public decimal RefillVolume { get; set; }

        // Modification tracking
        public decimal? OriginalVolume { get; set; }
        public decimal? ModifiedVolume { get; set; }
        public string? ModificationReason { get; set; }
        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedAt { get; set; }

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public string? DeletedBy { get; set; }
        public DateTime? DeletedAt { get; set; }
        public string? DeletionReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual GPSGateReport Report { get; set; } = null!;
        public virtual Vehicle Vehicle { get; set; } = null!;
        public virtual User? ModifiedByNavigation { get; set; }
        public virtual User? DeletedByNavigation { get; set; }

        // Computed
        public decimal EffectiveVolume => ModifiedVolume ?? RefillVolume;
        public bool IsModified => ModifiedVolume.HasValue;
    }
}
