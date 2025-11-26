using FMS.Application.Common;
using MediatR;
using System.Collections.Generic;

namespace FMS.Application.Command.VehicleMaintenance
{
    /// <summary>
    /// Command to bulk update vehicle odometers from GPS readings
    /// </summary>
    public record BulkUpdateVehicleOdometersCommand(
        List<VehicleOdometerUpdateRequest> Updates
    ) : IRequest<FMSResponse<BulkUpdateResult>>;

    public class VehicleOdometerUpdateRequest
    {
        public int VehicleId { get; set; }
        public double GpsOdometer { get; set; }
        public string UpdateSource { get; set; } = "GPS";
    }

    public class BulkUpdateResult
    {
        public int TotalRequested { get; set; }
        public int SuccessCount { get; set; }
        public int FailCount { get; set; }
        public List<string> Errors { get; set; } = new();
    }
}
