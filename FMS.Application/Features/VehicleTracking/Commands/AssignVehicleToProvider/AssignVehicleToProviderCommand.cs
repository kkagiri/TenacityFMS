using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.VehicleTracking.Commands.AssignVehicleToProvider
{
    /// <summary>
    /// Command to assign a vehicle to a provider
    /// </summary>
    public class AssignVehicleToProviderCommand : IRequest<FMSResponse<bool>>
    {
        public int VehicleId { get; set; }
        public int ProviderId { get; set; }
        public string UserId { get; set; } = string.Empty;
    }
}
