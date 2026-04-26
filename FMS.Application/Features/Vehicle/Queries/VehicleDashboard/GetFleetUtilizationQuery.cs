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
    /// Query to get fleet utilization data for dashboard
    /// </summary>
    public class GetFleetUtilizationQuery : IRequest<FMSResponse<FleetUtilizationDTO>> {
        public int Days { get; set; }

        public GetFleetUtilizationQuery (int days = 30) {
            Days = days;
        }
    }

    public class GetFleetUtilizationQueryHandler : IRequestHandler<GetFleetUtilizationQuery, FMSResponse<FleetUtilizationDTO>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetFleetUtilizationQueryHandler> _logger;

        public GetFleetUtilizationQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetFleetUtilizationQueryHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponse<FleetUtilizationDTO>> Handle (GetFleetUtilizationQuery request, CancellationToken cancellationToken) {
            try {
                // Validation
                if (request.Days <= 0 || request.Days > 365) {
                    var validationErrors = new List<string> { "Days must be between 1 and 365" };
                    return FMSResponse<FleetUtilizationDTO>.ValidationFailed (validationErrors);
                }

                if (_context?.Vehicles == null) {
                    return FMSResponse<FleetUtilizationDTO>.Failed ("Database context is not available");
                }

                // TODO: Implement actual data retrieval logic from database
                // Sample implementation - replace with actual database queries
                var endDate = DateTime.UtcNow.Date;
                var startDate = endDate.AddDays (-request.Days);

                var utilization = new FleetUtilizationDTO {
                    OverallUtilization = 78.5, // TODO: Calculate from actual usage data
                    AverageHoursPerDay = 8.2, // TODO: Calculate from trip/operation data
                    DailyUtilization = GenerateSampleDailyUtilization (startDate, endDate), // TODO: Replace with actual data
                    VehicleUtilization = await GenerateSampleVehicleUtilization (cancellationToken) // TODO: Replace with actual data
                };

                return FMSResponse<FleetUtilizationDTO>.Success (utilization, "Fleet utilization data retrieved successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving fleet utilization data for {Days} days", request.Days);
                return FMSResponse<FleetUtilizationDTO>.Failed ($"Error retrieving fleet utilization data: {ex.Message}");
            }
        }

        private List<DailyUtilizationDTO> GenerateSampleDailyUtilization (DateTime startDate, DateTime endDate) {
            // TODO: Replace with actual database query
            var dailyData = new List<DailyUtilizationDTO> ();
            var random = new Random ();

            for (var date = startDate; date <= endDate; date = date.AddDays (1)) {
                dailyData.Add (new DailyUtilizationDTO {
                    Date = date,
                        UtilizationRate = Math.Round (60 + random.NextDouble () * 40, 1), // 60-100%
                        ActiveVehicles = random.Next (80, 120),
                        TotalHours = Math.Round (6 + random.NextDouble () * 4, 1) // 6-10 hours
                });
            }

            return dailyData;
        }

        private async Task<List<VehicleUtilizationDTO>> GenerateSampleVehicleUtilization (CancellationToken cancellationToken) {
            // TODO: Replace with actual database query
            var vehicles = await _context.Vehicles
                .Where (v => v.IsActive == 1)
                .Take (10)
                .Select (v => new VehicleUtilizationDTO {
                    VehicleId = v.VehicleId,
                        VehicleNumber = v.VehicleCode,
                        UtilizationRate = 75.0, // TODO: Calculate from actual usage
                        HoursOperated = 8.5, // TODO: Calculate from trip data
                        LastUsed = DateTime.UtcNow.AddHours (-2) // TODO: Get from actual trip data
                })
                .ToListAsync (cancellationToken);

            return vehicles;
        }
    }
}