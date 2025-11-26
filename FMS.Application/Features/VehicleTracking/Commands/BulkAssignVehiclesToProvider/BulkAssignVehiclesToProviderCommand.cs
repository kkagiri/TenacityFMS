using System.Collections.Generic;
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.VehicleTracking.Commands.BulkAssignVehiclesToProvider
{
    /// <summary>
    /// Command to bulk assign multiple vehicles to a provider
    /// </summary>
    public class BulkAssignVehiclesToProviderCommand : IRequest<FMSResponse<string>>
    {
        public int ProviderId { get; set; }
        public List<int> VehicleIds { get; set; } = new();
        public string UserId { get; set; } = string.Empty;
    }
}
