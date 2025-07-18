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
    /// Query to get vehicle maintenance alerts for dashboard
    /// </summary>
    public class GetVehicleMaintenanceAlertsQuery : IRequest<FMSResponse<List<MaintenanceAlertDTO>>> {
        public int Limit { get; set; }

        public GetVehicleMaintenanceAlertsQuery (int limit = 20) {
            Limit = limit;
        }
    }

    public class GetVehicleMaintenanceAlertsQueryHandler : IRequestHandler<GetVehicleMaintenanceAlertsQuery, FMSResponse<List<MaintenanceAlertDTO>>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetVehicleMaintenanceAlertsQueryHandler> _logger;

        public GetVehicleMaintenanceAlertsQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetVehicleMaintenanceAlertsQueryHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponse<List<MaintenanceAlertDTO>>> Handle (GetVehicleMaintenanceAlertsQuery request, CancellationToken cancellationToken) {
            try {
                // Validation
                if (request.Limit <= 0 || request.Limit > 100) {
                    var validationErrors = new List<string> { "Limit must be between 1 and 100" };
                    return FMSResponse<List<MaintenanceAlertDTO>>.ValidationFailed (validationErrors);
                }

                if (_context?.Vehicles == null) {
                    return FMSResponse<List<MaintenanceAlertDTO>>.Failed ("Database context is not available");
                }

                // TODO: Implement actual data retrieval logic from database
                // This should query maintenance schedules, vehicle mileage, and other factors
                var alerts = await GenerateSampleMaintenanceAlerts (request.Limit, cancellationToken);

                return FMSResponse<List<MaintenanceAlertDTO>>.Success (alerts, $"Retrieved {alerts.Count} maintenance alerts successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving vehicle maintenance alerts with limit {Limit}", request.Limit);
                return FMSResponse<List<MaintenanceAlertDTO>>.Failed ($"Error retrieving maintenance alerts: {ex.Message}");
            }
        }

        private async Task<List<MaintenanceAlertDTO>> GenerateSampleMaintenanceAlerts (int limit, CancellationToken cancellationToken) {
            // TODO: Replace with actual database query based on:
            // - Vehicle maintenance schedules
            // - Current mileage vs maintenance intervals
            // - Last maintenance dates
            // - Vehicle condition reports

            var vehicles = await _context.Vehicles
                .Where (v => v.IsActive == 1)
                .Take (limit)
                .ToListAsync (cancellationToken);

            var alerts = new List<MaintenanceAlertDTO> ();
            var random = new Random ();
            var alertTypes = new [] { "Oil Change", "Brake Service", "Tire Rotation", "Engine Service", "General Inspection" };
            var priorities = new [] { "High", "Medium", "Low" };

            foreach (var vehicle in vehicles) {
                // Simulate some vehicles having maintenance alerts
                if (random.NextDouble () < 0.3) // 30% chance of having an alert
                {
                    var daysOverdue = random.Next (-7, 15); // -7 to 15 days (negative means due soon)
                    var alertType = alertTypes[random.Next (alertTypes.Length)];
                    var priority = daysOverdue > 0 ? "High" : (daysOverdue > -3 ? "Medium" : "Low");

                    alerts.Add (new MaintenanceAlertDTO {
                        VehicleId = vehicle.VehicleId,
                            VehicleNumber = vehicle.HyoungNo,
                            AlertType = alertType,
                            Priority = priority,
                            DueDate = DateTime.UtcNow.AddDays (-daysOverdue),
                            DaysOverdue = Math.Max (0, daysOverdue),
                            Description = $"{alertType} due for {vehicle.HyoungNo}",
                            EstimatedCost = random.Next (100, 1000), // TODO: Get from maintenance cost database
                            LastMaintenanceDate = DateTime.UtcNow.AddDays (-random.Next (30, 180))
                    });
                }
            }

            return alerts.OrderByDescending (a => a.Priority == "High" ? 3 : a.Priority == "Medium" ? 2 : 1)
                .ThenBy (a => a.DueDate)
                .Take (limit)
                .ToList ();
        }
    }
}