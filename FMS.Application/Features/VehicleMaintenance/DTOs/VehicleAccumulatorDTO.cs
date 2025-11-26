using System;

namespace FMS.Application.Features.VehicleMaintenance.DTOs
{
    /// <summary>
    /// Vehicle accumulator data from GPS provider (odometer, engine hours, etc.)
    /// </summary>
    public class VehicleAccumulatorDTO
    {
        public int AccumulatorId { get; set; }
        public int UserId { get; set; }
        public int AccumulatorTypeId { get; set; }
        public string AccumulatorTypeName { get; set; } = string.Empty;
        public string AccumulatorTypeDescription { get; set; } = string.Empty;
        public double Value { get; set; }
        public string Unit { get; set; } = string.Empty;
        public DateTime? Timestamp { get; set; }
    }
}
