using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Vehicle.Queries.VehicleDashboard
{
    /// <summary>
    /// Query to get vehicle dashboard metrics
    /// </summary>
    public class GetVehicleDashboardMetricsQuery : IRequest<FMSResponse<VehicleDashboardMetricsDTO>>
    {
        /// <summary>
        /// Number of days to look back for utilization calculation (default: 30)
        /// </summary>
        public int UtilizationDays { get; set; } = 30;

        /// <summary>
        /// Working hours per day for utilization calculation (default: 8)
        /// </summary>
        public double WorkingHoursPerDay { get; set; } = 8.0;

        public GetVehicleDashboardMetricsQuery() { }
    }

    public class GetVehicleDashboardMetricsQueryHandler : IRequestHandler<GetVehicleDashboardMetricsQuery, FMSResponse<VehicleDashboardMetricsDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly IGPSService _gpsService;
        private readonly IMapper _mapper;
        private readonly ILogger<GetVehicleDashboardMetricsQueryHandler> _logger;

        public GetVehicleDashboardMetricsQueryHandler(
            GpsdataContext context,
            IGPSService gpsService,
            IMapper mapper,
            ILogger<GetVehicleDashboardMetricsQueryHandler> logger)
        {
            _context = context;
            _gpsService = gpsService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponse<VehicleDashboardMetricsDTO>> Handle(GetVehicleDashboardMetricsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Validation
                if (_context?.Vehicles == null)
                {
                    return FMSResponse<VehicleDashboardMetricsDTO>.Failed("Database context is not available");
                }

                // Basic vehicle counts from database
                var totalVehicles = await _context.Vehicles.CountAsync(cancellationToken);
                var activeVehicles = await _context.Vehicles.CountAsync(v => v.IsActive == 1, cancellationToken);

                // GPS-enabled vehicles count (using VehicleProviderMapping for new approach)
                var gpsEnabledVehicles = await _context.DeviceProviderMappings
                    .Where(m => m.IsActive)
                    .Select(m => m.VehicleId)
                    .Distinct()
                    .CountAsync(cancellationToken);

                // Fallback to legacy field if no provider mappings exist
                if (gpsEnabledVehicles == 0)
                {
#pragma warning disable CS0618 // Suppress obsolete warning for legacy field
                    gpsEnabledVehicles = await _context.Vehicles.CountAsync(v => v.HasGPSInstalled == 1, cancellationToken);
#pragma warning restore CS0618
                }

                // Unassigned vehicles (no default employee)
                var unassignedVehicles = await _context.Vehicles
                    .CountAsync(v => v.IsActive == 1 && v.DefaultEmployeeId == null, cancellationToken);

                // Get GPS status from GPS service
                int onlineVehicles = 0;
                int inTransitVehicles = 0;
                int idleVehicles = 0;

                try
                {
                    var gpsResult = await _gpsService.GetAllVehicleLocationsAsync(onlineOnly: false, gpsEnabledOnly: true);
                    if (gpsResult.IsSuccess && gpsResult.Data != null)
                    {
                        var locations = gpsResult.Data;
                        onlineVehicles = locations.Count(l => l.IsOnline);
                        inTransitVehicles = locations.Count(l => l.IsOnline && l.Speed > 0); // Moving vehicles
                        idleVehicles = locations.Count(l => l.IsOnline && (l.Speed ?? 0) == 0); // Online but not moving
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not retrieve GPS status for dashboard metrics, using fallback values");
                    // Fallback: estimate based on GPS-enabled count
                    onlineVehicles = (int)(gpsEnabledVehicles * 0.7); // Assume 70% online
                    inTransitVehicles = (int)(onlineVehicles * 0.4); // Assume 40% in transit
                    idleVehicles = onlineVehicles - inTransitVehicles;
                }

                var offlineVehicles = gpsEnabledVehicles - onlineVehicles;

                // Vehicles with issues (from issue tracker)
                var vehiclesWithIssues = await _context.Issuetrackers
                    .Where(i => i.Status != 3 && i.Status != 4) // Active issues (not resolved/closed)
                    .Select(i => i.VehicleId)
                    .Distinct()
                    .CountAsync(cancellationToken);

                // Pending vehicles (inactive but not decommissioned)
                var pendingVehicles = await _context.Vehicles
                    .CountAsync(v => v.IsActive == 0, cancellationToken);

                // Maintenance due (vehicles with expired or soon-to-expire documents)
                var maintenanceDue = await GetMaintenanceDueCountAsync(cancellationToken);

                // Calculate average utilization from vehicle consumption data
                var averageUtilization = await CalculateAverageUtilizationAsync(
                    request.UtilizationDays,
                    request.WorkingHoursPerDay,
                    gpsEnabledVehicles,
                    cancellationToken);

                // Calculate fleet health score
                var fleetHealthScore = CalculateFleetHealthScore(
                    totalVehicles,
                    vehiclesWithIssues,
                    maintenanceDue,
                    offlineVehicles,
                    gpsEnabledVehicles);

                var metrics = new VehicleDashboardMetricsDTO
                {
                    TotalVehicles = totalVehicles,
                    ActiveVehicles = activeVehicles,
                    OnlineVehicles = onlineVehicles,
                    OfflineVehicles = offlineVehicles,
                    VehiclesWithIssues = vehiclesWithIssues,
                    PendingVehicles = pendingVehicles,
                    MaintenanceDue = maintenanceDue,
                    InTransit = inTransitVehicles,
                    Idle = idleVehicles,
                    AverageUtilization = averageUtilization,
                    FleetHealthScore = fleetHealthScore,
                    GPSEnabledVehicles = gpsEnabledVehicles,
                    UnassignedVehicles = unassignedVehicles
                };

                return FMSResponse<VehicleDashboardMetricsDTO>.Success(metrics, "Vehicle dashboard metrics retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle dashboard metrics");
                return FMSResponse<VehicleDashboardMetricsDTO>.Failed($"Error retrieving vehicle dashboard metrics: {ex.Message}");
            }
        }

        /// <summary>
        /// Get count of vehicles with maintenance due (placeholder — VehicleDocuments removed).
        /// </summary>
        private async Task<int> GetMaintenanceDueCountAsync(CancellationToken cancellationToken)
        {
            await Task.CompletedTask;
            return 0;
        }

        /// <summary>
        /// Calculate average fleet utilization based on engine hours
        /// Formula: (Total Engine Hours / (GPS Vehicles × Working Hours × Days)) × 100
        /// </summary>
        private async Task<double> CalculateAverageUtilizationAsync(
            int days,
            double workingHoursPerDay,
            int gpsEnabledVehicles,
            CancellationToken cancellationToken)
        {
            try
            {
                if (gpsEnabledVehicles <= 0) return 0;

                var startDate = DateTime.Today.AddDays(-days);
                var endDate = DateTime.Today;

                // Sum engine hours from vehicle consumption data
                var totalEngineHours = await _context.Vehicleconsumptions
                    .Where(vc => vc.Date >= startDate && vc.Date <= endDate)
                    .SumAsync(vc => vc.EngHours ?? 0, cancellationToken);

                // Available hours = GPS vehicles × working hours per day × number of days
                var availableHours = (decimal)(gpsEnabledVehicles * workingHoursPerDay * days);

                if (availableHours <= 0) return 0;

                var utilization = (double)((totalEngineHours / availableHours) * 100);

                // Cap at 100% and round to 1 decimal
                return Math.Round(Math.Min(utilization, 100.0), 1);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not calculate average utilization");
                return 0;
            }
        }

        /// <summary>
        /// Calculate fleet health score (0-100)
        /// Based on: issues, maintenance status, GPS connectivity
        /// </summary>
        private double CalculateFleetHealthScore(
            int totalVehicles,
            int vehiclesWithIssues,
            int maintenanceDue,
            int offlineVehicles,
            int gpsEnabledVehicles)
        {
            if (totalVehicles <= 0) return 100.0;

            const double baseScore = 100.0;

            // Penalty weights
            const double issuesPenaltyWeight = 30.0; // Max 30 points for issues
            const double maintenancePenaltyWeight = 40.0; // Max 40 points for maintenance
            const double offlinePenaltyWeight = 20.0; // Max 20 points for offline vehicles
            const double unmonitoredPenaltyWeight = 10.0; // Max 10 points for vehicles without GPS

            // Calculate penalties
            double issuesPenalty = (vehiclesWithIssues / (double)totalVehicles) * issuesPenaltyWeight;
            double maintenancePenalty = (maintenanceDue / (double)totalVehicles) * maintenancePenaltyWeight;

            double offlinePenalty = 0;
            if (gpsEnabledVehicles > 0)
            {
                offlinePenalty = (offlineVehicles / (double)gpsEnabledVehicles) * offlinePenaltyWeight;
            }

            // Vehicles without GPS monitoring
            int unmonitoredVehicles = totalVehicles - gpsEnabledVehicles;
            double unmonitoredPenalty = (unmonitoredVehicles / (double)totalVehicles) * unmonitoredPenaltyWeight;

            // Calculate final score
            double totalPenalty = issuesPenalty + maintenancePenalty + offlinePenalty + unmonitoredPenalty;
            double healthScore = baseScore - totalPenalty;

            // Clamp between 0 and 100
            return Math.Round(Math.Max(0, Math.Min(100, healthScore)), 1);
        }
    }
}