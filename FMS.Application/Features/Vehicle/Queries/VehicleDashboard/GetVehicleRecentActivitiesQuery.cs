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
    /// Query to get recent vehicle activities for dashboard
    /// </summary>
    public class GetVehicleRecentActivitiesQuery : IRequest<FMSResponse<List<VehicleActivityDTO>>> {
        public int Limit { get; set; }

        public GetVehicleRecentActivitiesQuery (int limit = 10) {
            Limit = limit;
        }
    }

    public class GetVehicleRecentActivitiesQueryHandler : IRequestHandler<GetVehicleRecentActivitiesQuery, FMSResponse<List<VehicleActivityDTO>>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetVehicleRecentActivitiesQueryHandler> _logger;

        public GetVehicleRecentActivitiesQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetVehicleRecentActivitiesQueryHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponse<List<VehicleActivityDTO>>> Handle (GetVehicleRecentActivitiesQuery request, CancellationToken cancellationToken) {
            try {
                // Validation
                if (request.Limit <= 0 || request.Limit > 100) {
                    var validationErrors = new List<string> { "Limit must be between 1 and 100" };
                    return FMSResponse<List<VehicleActivityDTO>>.ValidationFailed (validationErrors);
                }

                if (_context?.Vehicles == null) {
                    return FMSResponse<List<VehicleActivityDTO>>.Failed ("Database context is not available");
                }

                // TODO: Implement actual data retrieval logic from database
                // This should query recent activities like:
                // - Fuel transactions
                // - Trip completions
                // - Maintenance activities
                // - Alert events
                // - Status changes
                var activities = await GenerateSampleRecentActivities (request.Limit, cancellationToken);

                return FMSResponse<List<VehicleActivityDTO>>.Success (activities, $"Retrieved {activities.Count} recent activities successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving recent vehicle activities with limit {Limit}", request.Limit);
                return FMSResponse<List<VehicleActivityDTO>>.Failed ($"Error retrieving recent activities: {ex.Message}");
            }
        }

        private async Task<List<VehicleActivityDTO>> GenerateSampleRecentActivities (int limit, CancellationToken cancellationToken) {
            // TODO: Replace with actual database queries from:
            // - FuelTransactions table
            // - VehicleTrips table
            // - MaintenanceRecords table
            // - VehicleAlerts table
            // - VehicleStatusHistory table

            var vehicles = await _context.Vehicles
                .Where (v => v.IsActive == 1)
                .Take (20)
                .ToListAsync (cancellationToken);

            var activities = new List<VehicleActivityDTO> ();
            var random = new Random ();
            var activityTypes = new [] {
                "Fuel Transaction",
                "Trip Completed",
                "Maintenance Scheduled",
                "Alert Generated",
                "Status Changed",
                "GPS Update",
                "Driver Assignment"
            };

            for (int i = 0; i < limit && i < vehicles.Count * 3; i++) {
                var vehicle = vehicles[random.Next (vehicles.Count)];
                var activityType = activityTypes[random.Next (activityTypes.Length)];
                var hoursAgo = random.Next (1, 72); // Last 3 days

                activities.Add (new VehicleActivityDTO {
                    ActivityId = i + 1,
                        VehicleId = vehicle.VehicleId,
                        VehicleNumber = vehicle.VehicleCode,
                        ActivityType = activityType,
                        Description = GenerateActivityDescription (activityType, vehicle.VehicleCode),
                        ActivityDate = DateTime.UtcNow.AddHours (-hoursAgo),
                        UserId = random.Next (1, 10), // TODO: Get from actual user data
                        UserName = $"User{random.Next(1, 10)}", // TODO: Get from actual user data
                        Location = GenerateLocation (),
                        Status = random.NextDouble () < 0.9 ? "Completed" : "In Progress"
                });
            }

            return activities.OrderByDescending (a => a.ActivityDate)
                .Take (limit)
                .ToList ();
        }

        private string GenerateActivityDescription (string activityType, string vehicleNumber) {
            return activityType
            switch {
                "Fuel Transaction" => $"Fuel dispensed to {vehicleNumber} - 45.2L",
                "Trip Completed" => $"{vehicleNumber} completed trip from Station A to Station B",
                "Maintenance Scheduled" => $"Oil change scheduled for {vehicleNumber}",
                "Alert Generated" => $"Low fuel alert for {vehicleNumber}",
                "Status Changed" => $"{vehicleNumber} status changed to Active",
                "GPS Update" => $"GPS position updated for {vehicleNumber}",
                "Driver Assignment" => $"Driver assigned to {vehicleNumber}",
                _ => $"Activity recorded for {vehicleNumber}"
            };
        }

        private string GenerateLocation () {
            var locations = new [] { "Main Station", "Station A", "Station B", "Depot", "Workshop", "Fuel Station" };
            var random = new Random ();
            return locations[random.Next (locations.Length)];
        }
    }
}