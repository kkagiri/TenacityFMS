using FMS.Domain.Entities.GPSGate;
using System;

namespace FMS.Domain.Entities
{
    /// <summary>
    /// Stores processed GPSGate Report 212 (Fuel Refill) entries
    /// Allows editing and soft deletion of GPS-reported refueling events
    /// </summary>
    public class GpsGateReportEntry
    {
        /// <summary>
        /// Primary key
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Foreign key to GPSGate report
        /// </summary>
        public int ReportId { get; set; }

        /// <summary>
        /// Foreign key to Vehicle
        /// </summary>
        public int VehicleId { get; set; }

        /// <summary>
        /// Date and time of the reported refueling event
        /// </summary>
        public DateTime DispenseDate { get; set; }

        /// <summary>
        /// Start time of refueling (from GPS report)
        /// </summary>
        public TimeSpan? StartTime { get; set; }

        /// <summary>
        /// Duration of refueling event
        /// </summary>
        public TimeSpan? Duration { get; set; }

        /// <summary>
        /// Fuel level before refueling (liters)
        /// </summary>
        public decimal? FuelBefore { get; set; }

        /// <summary>
        /// Fuel level after refueling (liters)
        /// </summary>
        public decimal? FuelAfter { get; set; }

        /// <summary>
        /// Refill volume reported by GPS (liters)
        /// This is the primary value used for comparison
        /// </summary>
        public decimal RefillVolume { get; set; }

        #region Modification Tracking

        /// <summary>
        /// Original volume as reported by GPSGate (preserved on edit)
        /// </summary>
        public decimal? OriginalVolume { get; set; }

        /// <summary>
        /// Modified volume (if user edited the GPS data)
        /// </summary>
        public decimal? ModifiedVolume { get; set; }

        /// <summary>
        /// Reason for modifying the GPS volume
        /// </summary>
        public string? ModificationReason { get; set; }

        /// <summary>
        /// User who modified the entry
        /// </summary>
        public string? ModifiedBy { get; set; }

        /// <summary>
        /// When the entry was modified
        /// </summary>
        public DateTime? ModifiedAt { get; set; }

        #endregion

        #region Soft Delete

        /// <summary>
        /// Indicates if this GPS entry is marked as deleted (false positive)
        /// </summary>
        public bool IsDeleted { get; set; } = false;

        /// <summary>
        /// User who deleted the entry
        /// </summary>
        public string? DeletedBy { get; set; }

        /// <summary>
        /// When the entry was deleted
        /// </summary>
        public DateTime? DeletedAt { get; set; }

        /// <summary>
        /// Reason for deleting (e.g., "False positive - no actual refueling")
        /// </summary>
        public string? DeletionReason { get; set; }

        #endregion

        /// <summary>
        /// When this entry was created in the system
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        #region Navigation Properties

        /// <summary>
        /// Navigation to the source GPSGate report
        /// </summary>
        public virtual GPSGateReport Report { get; set; } = null!;

        /// <summary>
        /// Navigation to the vehicle
        /// </summary>
        public virtual Vehicle Vehicle { get; set; } = null!;

        /// <summary>
        /// Navigation to user who modified (if applicable)
        /// </summary>
        public virtual User? ModifiedByNavigation { get; set; }

        /// <summary>
        /// Navigation to user who deleted (if applicable)
        /// </summary>
        public virtual User? DeletedByNavigation { get; set; }

        #endregion

        #region Computed Properties

        /// <summary>
        /// Gets the effective volume (modified if edited, otherwise original)
        /// </summary>
        public decimal EffectiveVolume => ModifiedVolume ?? RefillVolume;

        /// <summary>
        /// Indicates if this entry has been modified from original GPS data
        /// </summary>
        public bool IsModified => ModifiedVolume.HasValue;

        #endregion
    }
}
