using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.VehicleTracking.Commands.UnassignVehicleFromProvider
{
    /// <summary>
    /// Command to unassign a vehicle from its provider
    /// </summary>
    public class UnassignVehicleFromProviderCommand : IRequest<FMSResponse<bool>>
    {
        public int VehicleId { get; set; }
        public string UserId { get; set; } = string.Empty;
    }
}
