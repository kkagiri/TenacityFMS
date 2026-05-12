using System;

namespace FMS.Application.Features.Vehicle.DTOs
{
    public class VehicleHealthMonitorDTO
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;
        public string NumberPlate { get; set; } = string.Empty;
        public bool IsOnline { get; set; }
        public DateTime? LastOnlineAt { get; set; }
        public DateTime? LastOfflineAt { get; set; }
        public TimeSpan? OfflineDuration { get; set; }
        public string? OfflineReason { get; set; }
        public string? PermanentLocation { get; set; }
        public int? WorkingSiteId { get; set; }
        public string? WorkingSiteName { get; set; }
        public decimal? LastKnownLatitude { get; set; }
        public decimal? LastKnownLongitude { get; set; }
        public string? LastKnownAddress { get; set; }
        public int? IssueTrackingId { get; set; }
        public string? Notes { get; set; }
        public DateTime CheckedAt { get; set; }
    }

    public class UpdateVehicleOfflineStatusRequest
    {
        public int VehicleId { get; set; }
        public string OfflineReason { get; set; } = string.Empty; // Workshop, Yard, ToBeReviewed
        public string? PermanentLocation { get; set; }
        public int? WorkingSiteId { get; set; }
        public string? Notes { get; set; }
        public int? IssueTrackingId { get; set; }
    }
}
