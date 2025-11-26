using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTracking.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTracking.Queries.GetVehicleProviderMappings
{
    /// <summary>
    /// Handler for GetVehicleProviderMappingsQuery
    /// </summary>
    public class GetVehicleProviderMappingsQueryHandler : IRequestHandler<GetVehicleProviderMappingsQuery, FMSResponse<List<VehicleProviderMappingDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetVehicleProviderMappingsQueryHandler> _logger;

        public GetVehicleProviderMappingsQueryHandler(
            GpsdataContext context,
            ILogger<GetVehicleProviderMappingsQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<VehicleProviderMappingDTO>>> Handle(GetVehicleProviderMappingsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Getting vehicle-provider mappings{Filter}",
                    request.VehicleId.HasValue ? $" for vehicle {request.VehicleId}" : "");

                var query = _context.VehicleProviderMappings
                    .Include(m => m.ProviderConfiguration)
                    .Include(m => m.Vehicle)
                    .ThenInclude(v => v.VehicleType)
                    .Where(m => m.IsActive);

                if (request.VehicleId.HasValue)
                {
                    query = query.Where(m => m.VehicleId == request.VehicleId.Value);
                }

                var mappings = await query.ToListAsync(cancellationToken);

                var result = mappings.Select(m => new VehicleProviderMappingDTO
                {
                    VehicleId = m.VehicleId,
                    VehicleName = m.Vehicle?.HyoungNo,
                    NumberPlate = m.Vehicle?.NumberPlate,
                    VehicleType = m.Vehicle?.VehicleType?.Name,
                    ProviderId = m.ProviderConfigId,
                    ProviderName = m.ProviderConfiguration?.Name,
                    ExternalDeviceId = m.ExternalDeviceId,
                    DeviceIMEI = m.DeviceIMEI,
                    DeviceName = m.DeviceName,
                    DeviceType = m.DeviceType,
                    IsActive = m.IsActive,
                    MappedAt = m.CreatedAt,
                    MappedBy = m.CreatedBy
                }).ToList();

                return FMSResponse<List<VehicleProviderMappingDTO>>.Success(result,
                    $"Found {result.Count} mapping(s)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicle-provider mappings");
                return FMSResponse<List<VehicleProviderMappingDTO>>.Failed($"Error getting mappings: {ex.Message}");
            }
        }
    }
}
