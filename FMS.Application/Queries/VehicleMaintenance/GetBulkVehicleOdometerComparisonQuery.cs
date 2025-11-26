using FMS.Application.Common;
using FMS.Application.Dtos;
using MediatR;
using System.Collections.Generic;

namespace FMS.Application.Queries.VehicleMaintenance
{
    /// <summary>
    /// Query to fetch bulk vehicle odometer comparisons between GPS and Database
    /// Used for odometer reconciliation dashboard
    /// </summary>
    public record GetBulkVehicleOdometerComparisonQuery(
        bool OnlyWithDiscrepancies = false,
        double? DiscrepancyThreshold = 100.0
    ) : IRequest<FMSResponse<List<VehicleOdometerComparisonDTO>>>;
}
