using System.Collections.Generic;
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.VehicleTracking.Commands.BulkUnassignVehiclesFromProvider
{
    /// <summary>
    /// Command for bulk unassigning vehicles from their providers
    /// Returns a job ID for tracking progress via SignalR
    /// </summary>
    public record BulkUnassignVehiclesFromProviderCommand(
        List<int> VehicleIds,
        string UserId) : IRequest<FMSResponse<string>>;
}
