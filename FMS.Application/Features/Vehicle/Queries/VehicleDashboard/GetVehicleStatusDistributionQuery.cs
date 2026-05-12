using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Vehicle.Queries.VehicleDashboard {
    /// <summary>
    /// Query to get vehicle status distribution for dashboard
    /// </summary>
    public class GetVehicleStatusDistributionQuery : IRequest<FMSResponse<List<VehicleStatusDistributionDTO>>> {
        public GetVehicleStatusDistributionQuery () { }
    }

    public class GetVehicleStatusDistributionQueryHandler : IRequestHandler<GetVehicleStatusDistributionQuery, FMSResponse<List<VehicleStatusDistributionDTO>>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetVehicleStatusDistributionQueryHandler> _logger;

        public GetVehicleStatusDistributionQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetVehicleStatusDistributionQueryHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponse<List<VehicleStatusDistributionDTO>>> Handle (GetVehicleStatusDistributionQuery request, CancellationToken cancellationToken) {
            try {
                // Validation
                if (_context?.Vehicles == null) {
                    return FMSResponse<List<VehicleStatusDistributionDTO>>.Failed ("Database context is not available");
                }

                // TODO: Implement actual data retrieval logic from database
                // Sample implementation - replace with actual database queries
                var statusDistribution = new List<VehicleStatusDistributionDTO> {
                    new VehicleStatusDistributionDTO {
                    Status = "Active",
                    Count = await _context.Vehicles.CountAsync (v => v.IsActive == 1, cancellationToken),
                    Percentage = 75.0
                    },
                    new VehicleStatusDistributionDTO {
                    Status = "Inactive",
                    Count = await _context.Vehicles.CountAsync (v => v.IsActive != 1, cancellationToken),
                    Percentage = 15.0
                    },
                    new VehicleStatusDistributionDTO {
                    Status = "Maintenance",
                    Count = 12, // TODO: Implement based on maintenance status
                    Percentage = 8.0
                    },
                    new VehicleStatusDistributionDTO {
                    Status = "Out of Service",
                    Count = 3, // TODO: Implement based on service status
                    Percentage = 2.0
                    }
                };

                // Recalculate percentages based on actual totals
                var totalCount = statusDistribution.Sum (s => s.Count);
                if (totalCount > 0) {
                    foreach (var item in statusDistribution) {
                        item.Percentage = Math.Round ((double) item.Count / totalCount * 100, 1);
                    }
                }

                return FMSResponse<List<VehicleStatusDistributionDTO>>.Success (statusDistribution, "Vehicle status distribution retrieved successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving vehicle status distribution");
                return FMSResponse<List<VehicleStatusDistributionDTO>>.Failed ($"Error retrieving vehicle status distribution: {ex.Message}");
            }
        }
    }
}