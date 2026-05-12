using System;

namespace FMS.Domain.Entities.Devices
{
    /// <summary>
    /// Tracks vehicle health and offline status history
    /// </summary>
    public class VehicleHealthMonitorEntity
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public DateTime CheckedAt { get; set; }
        public bool IsOnline { get; set; }
        public DateTime? LastOnlineAt { get; set; }
        public DateTime? LastOfflineAt { get; set; }
        public TimeSpan? OfflineDuration { get; set; }

        /// <summary>
        /// Offline reason: Workshop, Yard, ToBeReviewed, Unknown
        /// </summary>
        public string? OfflineReason { get; set; }

        /// <summary>
        /// Permanent/semi-permanent location description
        /// </summary>
        public string? PermanentLocation { get; set; }

        /// <summary>
        /// Working site ID (links to vehicle.WorkingSite)
        /// </summary>
        public int? WorkingSiteId { get; set; }

        public decimal? LastKnownLatitude { get; set; }
        public decimal? LastKnownLongitude { get; set; }
        public string? LastKnownAddress { get; set; }

        /// <summary>
        /// Link to issue tracking for investigation
        /// </summary>
        public int? IssueTrackingId { get; set; }

        public string? Notes { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public enum VehicleOfflineReason
    {
        Unknown = 0,
        Workshop = 1,
        Yard = 2,
        ToBeReviewed = 3,
        Maintenance = 4,
        Repair = 5,
        Decommissioned = 6,
        GPSIssue = 7,
        PowerIssue = 8
    }
}
