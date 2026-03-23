using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Vehicle.DTOs
{
    /// <summary>
    /// Represents complete track history for a vehicle
    /// </summary>
    public class VehicleTrackHistoryDTO
    {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;
        public string NumberPlate { get; set; } = string.Empty;
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public List<TrackPointDTO> TrackPoints { get; set; } = new();
        public List<DailyTrackSummaryDTO> DailySummaries { get; set; } = new();
        public decimal TotalDistance { get; set; } // in kilometers
        public TimeSpan TotalDuration { get; set; }
        public decimal AverageSpeed { get; set; }
        public decimal MaxSpeed { get; set; }
        public int StopCount { get; set; }
        public List<StopInfo> Stops { get; set; } = new();
    }

    public class StopInfo
    {
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? Address { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public TimeSpan Duration { get; set; }
    }

    public class DailyTrackSummaryDTO
    {
        public string Date { get; set; } = string.Empty;
        public DateTime? StartTime { get; set; }
        public DateTime? StopTime { get; set; }
        public decimal DistanceKm { get; set; }
        public int PointCount { get; set; }
    }
}
