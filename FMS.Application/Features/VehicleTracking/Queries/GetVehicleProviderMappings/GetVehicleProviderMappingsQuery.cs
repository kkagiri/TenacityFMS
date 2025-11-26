using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTracking.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleTracking.Queries.GetVehicleProviderMappings
{
    /// <summary>
    /// Query to get vehicle-provider mappings
    /// </summary>
    public class GetVehicleProviderMappingsQuery : IRequest<FMSResponse<List<VehicleProviderMappingDTO>>>
    {
        public int? VehicleId { get; set; }
    }
}
