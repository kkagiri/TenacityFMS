using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleMaintenance.Queries
{
    /// <summary>
    /// Query to get vehicle accumulators (odometer, engine hours) from GPS provider
    /// </summary>
    public record GetVehicleAccumulatorsQuery(int VehicleId) : IRequest<FMSResponse<List<VehicleAccumulatorDTO>>>;
}
