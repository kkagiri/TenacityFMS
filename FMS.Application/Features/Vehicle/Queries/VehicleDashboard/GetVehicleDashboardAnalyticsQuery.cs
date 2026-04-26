using System.Threading;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using System.Linq;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Vehicle.Queries.VehicleDashboard
{
    public class GetVehicleDashboardAnalyticsQuery : IRequest<FMSResponse<VehicleDashboardAnalyticsDTO>>
    {
        /// <summary>
        /// Number of days for analytics period (default: 30)
        /// </summary>
        public int AnalyticsDays { get; set; } = 30;

        public GetVehicleDashboardAnalyticsQuery() { }
    }

    public class GetVehicleDashboardAnalyticsQueryHandler : IRequestHandler<GetVehicleDashboardAnalyticsQuery, FMSResponse<VehicleDashboardAnalyticsDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly IMediator _mediator;
        private readonly ILogger<GetVehicleDashboardAnalyticsQueryHandler> _logger;

        public GetVehicleDashboardAnalyticsQueryHandler(
            GpsdataContext context,
            IMediator mediator,
            ILogger<GetVehicleDashboardAnalyticsQueryHandler> logger)
        {
            _context = context;
            _mediator = mediator;
            _logger = logger;
        }

        public async Task<FMSResponse<VehicleDashboardAnalyticsDTO>> Handle(GetVehicleDashboardAnalyticsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Get metrics using the metrics query (reuse logic)
                var metricsResponse = await _mediator.Send(new GetVehicleDashboardMetricsQuery
                {
                    UtilizationDays = request.AnalyticsDays
                }, cancellationToken);

                var metrics = metricsResponse.Data ?? new VehicleDashboardMetricsDTO();

                // Calculate status distribution from actual metrics
                var statusDistribution = CalculateStatusDistribution(metrics);

                // Get fleet utilization data
                var fleetUtilization = await GetFleetUtilizationAsync(request.AnalyticsDays, cancellationToken);

                // Get maintenance alerts
                var maintenanceAlerts = await GetMaintenanceAlertsAsync(cancellationToken);

                // Get recent activities
                var recentActivities = await GetRecentActivitiesAsync(cancellationToken);

                // Get performance metrics
                var performanceMetrics = await GetPerformanceMetricsAsync(request.AnalyticsDays, cancellationToken);

                var analytics = new VehicleDashboardAnalyticsDTO
                {
                    Metrics = metrics,
                    StatusDistribution = statusDistribution,
                    FleetUtilization = fleetUtilization,
                    MaintenanceAlerts = maintenanceAlerts,
                    RecentActivities = recentActivities,
                    PerformanceMetrics = performanceMetrics,
                    LastUpdated = DateTime.Now
                };

                return FMSResponse<VehicleDashboardAnalyticsDTO>.Success(analytics, "Vehicle dashboard analytics retrieved successfully");

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle dashboard analytics");
                return FMSResponse<VehicleDashboardAnalyticsDTO>.Failed("Error retrieving vehicle dashboard analytics: " + ex.Message);
            }
        }

        private List<VehicleStatusDistributionDTO> CalculateStatusDistribution(VehicleDashboardMetricsDTO metrics)
        {
            var total = metrics.TotalVehicles > 0 ? metrics.TotalVehicles : 1;
            return new List<VehicleStatusDistributionDTO> {
                new VehicleStatusDistributionDTO {
                    Status = "Active",
                    Count = metrics.ActiveVehicles,
                    Percentage = Math.Round ((metrics.ActiveVehicles / (double) total) * 100, 1),
                    Color = "#4CAF50",
                    Description = "Vehicles currently in use"
                },
                new VehicleStatusDistributionDTO {
                    Status = "Online",
                    Count = metrics.OnlineVehicles,
                    Percentage = Math.Round ((metrics.OnlineVehicles / (double) total) * 100, 1),
                    Color = "#2196F3",
                    Description = "Vehicles with active GPS signal"
                },
                new VehicleStatusDistributionDTO {
                    Status = "In Transit",
                    Count = metrics.InTransit,
                    Percentage = Math.Round ((metrics.InTransit / (double) total) * 100, 1),
                    Color = "#9C27B0",
                    Description = "Vehicles currently moving"
                },
                new VehicleStatusDistributionDTO {
                    Status = "Idle",
                    Count = metrics.Idle,
                    Percentage = Math.Round ((metrics.Idle / (double) total) * 100, 1),
                    Color = "#FF9800",
                    Description = "Vehicles online but stationary"
                },
                new VehicleStatusDistributionDTO {
                    Status = "Offline",
                    Count = metrics.OfflineVehicles,
                    Percentage = Math.Round ((metrics.OfflineVehicles / (double) total) * 100, 1),
                    Color = "#9E9E9E",
                    Description = "Vehicles without GPS signal"
                },
                new VehicleStatusDistributionDTO {
                    Status = "Maintenance Due",
                    Count = metrics.MaintenanceDue,
                    Percentage = Math.Round ((metrics.MaintenanceDue / (double) total) * 100, 1),
                    Color = "#F44336",
                    Description = "Vehicles requiring maintenance"
                }
            };
        }

        private async Task<FleetUtilizationDTO> GetFleetUtilizationAsync(int days, CancellationToken cancellationToken)
        {
            var startDate = DateTime.Today.AddDays(-days);

            // Get daily consumption data
            var dailyData = await _context.Vehicleconsumptions
                .Where(vc => vc.Date >= startDate)
                .GroupBy(vc => vc.Date.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    TotalHours = g.Sum(x => x.EngHours ?? 0),
                    ActiveVehicles = g.Select(x => x.VehicleId).Distinct().Count()
                })
                .OrderBy(d => d.Date)
                .ToListAsync(cancellationToken);

            var totalGpsVehicles = await _context.VehicleProviderMappings
                .Where(m => m.IsActive)
                .Select(m => m.VehicleId)
                .Distinct()
                .CountAsync(cancellationToken);

            if (totalGpsVehicles == 0) totalGpsVehicles = 1; // Prevent division by zero

            var totalOperatingHours = dailyData.Sum(d => (double)d.TotalHours);
            var avgHoursPerDay = days > 0 ? totalOperatingHours / days : 0;

            return new FleetUtilizationDTO
            {
                OverallUtilization = Math.Round((totalOperatingHours / (totalGpsVehicles * 8.0 * days)) * 100, 1),
                AverageHoursPerDay = Math.Round(avgHoursPerDay, 1),
                PeakUtilizationHour = 14.0, // TODO: Calculate from actual hourly data
                TotalOperatingHours = (int)totalOperatingHours,
                DailyUtilization = dailyData.Select(d => new DailyUtilizationDTO
                {
                    Date = d.Date,
                    TotalHours = (double)d.TotalHours,
                    ActiveVehicles = d.ActiveVehicles,
                    UtilizationRate = Math.Round((double)d.TotalHours / (totalGpsVehicles * 8.0) * 100, 1)
                }).ToList(),
                VehicleUtilization = new List<VehicleUtilizationDTO>() // Could be expanded
            };
        }

        private async Task<List<MaintenanceAlertDTO>> GetMaintenanceAlertsAsync(CancellationToken cancellationToken)
        {
            await Task.CompletedTask;
            return new List<MaintenanceAlertDTO>();
        }

        private async Task<List<VehicleActivityDTO>> GetRecentActivitiesAsync(CancellationToken cancellationToken)
        {
            // Get recent fuel transactions as activities
            var recentTransactions = await _context.Pumptransactions
                .Where(pt => pt.DateTime >= DateTime.Today.AddDays(-7))
                .OrderByDescending(pt => pt.DateTime)
                .Take(10)
                .Include(pt => pt.Vehicle)
                .Select(pt => new VehicleActivityDTO
                {
                    ActivityId = pt.Id,
                    VehicleId = pt.VehicleId ?? 0,
                    VehicleName = pt.Vehicle != null ? pt.Vehicle.VehicleCode : "Unknown",
                    PlateNumber = pt.Vehicle != null ? pt.Vehicle.NumberPlate : "",
                    ActivityType = "Fuel Transaction",
                    Description = $"Dispensed {pt.Volume:F2} liters",
                    Timestamp = pt.DateTime,
                    ActivityDate = pt.DateTime,
                    Status = "Completed",
                    CreatedBy = "System",
                    AdditionalData = new Dictionary<string, object>()
                })
                .ToListAsync(cancellationToken);

            return recentTransactions;
        }

        private async Task<VehiclePerformanceMetricsDTO> GetPerformanceMetricsAsync(int days, CancellationToken cancellationToken)
        {
            var startDate = DateTime.Today.AddDays(-days);

            var consumption = await _context.Vehicleconsumptions
                .Where(vc => vc.Date >= startDate)
                .ToListAsync(cancellationToken);

            var avgFuelEfficiency = consumption.Any() ?
                consumption.Where(c => c.FuelEfficiency > 0).Average(c => (double?)c.FuelEfficiency) ?? 0 : 0;
            var totalDistance = consumption.Sum(c => (double?)c.TotalDistance) ?? 0;
            var avgSpeed = consumption.Any() ?
                consumption.Where(c => c.AvgSpeed > 0).Average(c => (double?)c.AvgSpeed) ?? 0 : 0;

            return new VehiclePerformanceMetricsDTO
            {
                AverageFuelEfficiency = Math.Round(avgFuelEfficiency, 2),
                TotalDistanceTraveled = Math.Round(totalDistance, 1),
                AverageSpeed = Math.Round(avgSpeed, 1),
                TotalTrips = consumption.Count,
                AverageTripDistance = consumption.Count > 0 ? Math.Round(totalDistance / consumption.Count, 1) : 0,
                AverageTripDuration = 0, // Would need trip data
                IdleTimePercentage = 0, // Would need engine idle data
                HarshBrakingEvents = 0, // Would need telematics data
                HarshAccelerationEvents = 0, // Would need telematics data
                SpeedingViolations = 0, // Would need speed violation data
                VehicleDetails = new List<VehiclePerformanceDetailDTO>(),
                DailyPerformance = new List<DailyPerformanceDTO>()
            };
        }
    }
}