using System;

namespace FMS.Application.Features.GPSGate.DTOs
{
    /// <summary>
    /// DTO for Refueling Report (Report ID: 212)
    /// Contains vehicle refueling events with fuel levels
    /// </summary>
    public class RefuelingReportDto
    {
        public string Vehicle { get; set; }
        public int? VehicleId { get; set; }
        public DateTime? Date { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? Duration { get; set; }
        public decimal? FuelBefore { get; set; }
        public decimal? FuelAfter { get; set; }
        public decimal? RefillVolume { get; set; }

        /// <summary>
        /// Combined DateTime from Date and StartTime
        /// </summary>
        public DateTime? RefuelingDateTime
        {
            get
            {
                if (Date.HasValue && StartTime.HasValue)
                {
                    return Date.Value.Date.Add(StartTime.Value);
                }
                return Date;
            }
        }
    }
}
