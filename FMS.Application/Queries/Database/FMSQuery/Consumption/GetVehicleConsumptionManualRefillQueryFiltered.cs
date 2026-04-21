/**
 * File: GetVehicleConsumptionManualRefillQueryFiltered.cs
 * Purpose: Retrieves manual-refill consumption results with database-level filters for reporting.
 * Dependencies: GpsdataContext, ManualDispenseConsumptionDTO, MediatR, EF Core
 * Last Modified: 2026-03-11
 *
 * Key Components:
 * - GetVehicleConsumptionManualRefillQueryFiltered: Filter contract for manual-refill consumption queries
 * - GetVehicleConsumptionManualRefillQueryFilteredHandler: Executes filtered vehicle/fuel-refill aggregation
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FMS.Consumption;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.Consumption
{
    public record GetVehicleConsumptionManualRefillQueryFiltered(
        DateTime StartDate,
        DateTime EndDate,
        string? VehicleType = null,
        int? VehicleTypeId = null,
        string? HyoungNo = null,
        int? VehicleId = null,
        int? SiteId = null,
        List<int>? SiteIds = null,
        int? DriverId = null,
        bool? AverageKmL = null
    ) : IRequest<List<ManualDispenseConsumptionDTO>>;

    public class GetVehicleConsumptionManualRefillQueryFilteredHandler : IRequestHandler<GetVehicleConsumptionManualRefillQueryFiltered, List<ManualDispenseConsumptionDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetVehicleConsumptionManualRefillQueryFilteredHandler> _logger;

        public GetVehicleConsumptionManualRefillQueryFilteredHandler(GpsdataContext context, ILogger<GetVehicleConsumptionManualRefillQueryFilteredHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<ManualDispenseConsumptionDTO>> Handle(GetVehicleConsumptionManualRefillQueryFiltered request, CancellationToken cancellationToken)
        {
            try
            {
                var adjustedEndDate = request.EndDate.Date.AddDays(1).AddTicks(-1);

                // Build the vehicles query with filters applied at database level
                var vehiclesQuery = _context.Vehicles
                    .Include(v => v.VehicleType)
                    .Include(v => v.VehicleManufacturer)
                    .Include(v => v.VehicleModel)
                    .Include(v => v.DefaultExptdAvg)
                    .Include(v => v.WorkingSite)
                    .Include(v => v.EmployeeVehicles)
                        .ThenInclude(employeeVehicle => employeeVehicle.Employee)
                    .AsQueryable();

                // Apply vehicle type filter
                if (request.VehicleTypeId.HasValue && request.VehicleTypeId.Value > 0)
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.VehicleTypeId == request.VehicleTypeId.Value);
                }
                else if (!string.IsNullOrEmpty(request.VehicleType))
                {
                    vehiclesQuery = vehiclesQuery.Where(v =>
                        v.VehicleType != null &&
                        EF.Functions.Like(v.VehicleType.Name.ToLower(), $"%{request.VehicleType.ToLower()}%"));
                }

                // Apply vehicle ID filter
                if (request.VehicleId.HasValue && request.VehicleId.Value > 0)
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.VehicleId == request.VehicleId.Value);
                }

                // Apply Hyoung number filter
                if (!string.IsNullOrEmpty(request.HyoungNo))
                {
                    vehiclesQuery = vehiclesQuery.Where(v =>
                        v.HyoungNo != null &&
                        EF.Functions.Like(v.HyoungNo.ToLower(), $"%{request.HyoungNo.ToLower()}%"));
                }

                var siteIds = (request.SiteIds ?? new List<int>())
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();

                if (request.SiteId.HasValue && request.SiteId > 0 && !siteIds.Contains(request.SiteId.Value))
                {
                    siteIds.Add(request.SiteId.Value);
                }

                // Apply site filter
                if (siteIds.Count > 0)
                {
                    vehiclesQuery = vehiclesQuery.Where(v =>
                        v.WorkingSiteId.HasValue &&
                        siteIds.Contains(v.WorkingSiteId.Value));
                }
                else if (request.SiteId.HasValue && request.SiteId > 0)
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.WorkingSiteId == request.SiteId.Value);
                }

                // Apply average mode filter (true = km/L vehicles, false = L/hr equipment)
                if (request.AverageKmL.HasValue)
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.AverageKmL == request.AverageKmL.Value);
                }

                var vehicles = await vehiclesQuery.ToListAsync(cancellationToken);

                // Build the fuel refills query
                var fuelRefillsQuery = _context.FuelRefills
                    .Where(f => f.Date >= request.StartDate.Date && f.Date <= adjustedEndDate)
                    .Include(f => f.Driver)
                    .AsQueryable();

                // Apply driver filter to fuel refills
                if (request.DriverId.HasValue && request.DriverId > 0)
                {
                    fuelRefillsQuery = fuelRefillsQuery.Where(f => f.DriverId == request.DriverId.Value);
                }

                // If we have vehicle filters, we need to limit fuel refills to those vehicles
                if ((request.VehicleTypeId.HasValue && request.VehicleTypeId.Value > 0) ||
                    !string.IsNullOrEmpty(request.VehicleType) ||
                    (request.VehicleId.HasValue && request.VehicleId.Value > 0) ||
                    !string.IsNullOrEmpty(request.HyoungNo) ||
                    siteIds.Count > 0 ||
                    (request.SiteId.HasValue && request.SiteId > 0))
                {
                    var vehicleIds = vehicles.Select(v => v.VehicleId).ToList();
                    fuelRefillsQuery = fuelRefillsQuery.Where(f => vehicleIds.Contains(f.VehicleId));
                }

                var fuelRefills = await fuelRefillsQuery.ToListAsync(cancellationToken);

                // Process the results - same logic as the original query
                var result = new List<ManualDispenseConsumptionDTO>();

                foreach (var vehicle in vehicles)
                {
                    var vehicleRefills = fuelRefills
                        .Where(f => f.VehicleId == vehicle.VehicleId)
                        .OrderBy(f => f.Date)
                        .ToList();

                    if (!vehicleRefills.Any())
                    {
                        continue;
                    }

                    var totalFuelAmount = vehicleRefills.Sum(f => f.ManualFuelrefillAmount ?? 0);
                    var distanceOrEngineHours = vehicle.AverageKmL
                        ? vehicleRefills.Sum(f => (f.CurrentMeterReading ?? 0) - (f.PreviousMeterReading ?? 0))
                        : vehicleRefills.Sum(f => (f.CurrentMeterReading ?? 0) - (f.PreviousMeterReading ?? 0));

                    var consumption = CalculateConsumption(totalFuelAmount, distanceOrEngineHours, vehicle.AverageKmL);
#pragma warning disable CS8601
                    result.Add(new ManualDispenseConsumptionDTO
                    {
                        Id = vehicle.VehicleId,
                        VehicleId = vehicle.VehicleId,
                        HyoungNo = vehicle.HyoungNo ?? string.Empty,
                        DriverName = ResolveAssignedDriverName(vehicle),
                        Passenger = vehicle.Passenger ?? string.Empty,
                        VehicleType = vehicle.VehicleType?.Name ?? "Unknown",
                        WorkingSiteId = vehicle.WorkingSiteId ?? 0,
                        WorkingSiteName = vehicle.WorkingSite?.Name ?? "Unknown",
                        TotalFuelAmount = totalFuelAmount,
                        DistanceOrEngineHours = distanceOrEngineHours,
                        IsKmL = vehicle.AverageKmL,
                        RefillCount = vehicleRefills.Count,
                        Consumption = consumption,
                        ExpectedAverage = vehicle.DefaultExptdAvg?.ExpectedAverageValue ?? 0,
                        VehicleInfo = $"{vehicle.VehicleManufacturer?.Name ?? "Unknown"} {vehicle.VehicleModel?.Name ?? "Unknown"}"
                    });
#pragma warning restore CS8601
                }

                _logger.LogInformation(
                    "Filtered consumption query completed. Date range: {StartDate} to {EndDate}, " +
                    "Filters: VehicleType={VehicleType}, VehicleTypeId={VehicleTypeId}, HyoungNo={HyoungNo}, VehicleId={VehicleId}, " +
                    "SiteId={SiteId}, SiteIds={SiteIds}, DriverId={DriverId}, AverageKmL={AverageKmL}. Results: {ResultCount}",
                    request.StartDate, request.EndDate, request.VehicleType, request.VehicleTypeId, request.HyoungNo, request.VehicleId,
                    request.SiteId, string.Join(",", siteIds), request.DriverId, request.AverageKmL, result.Count);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error fetching filtered vehicle consumption data. " +
                    "Filters: VehicleType={VehicleType}, VehicleTypeId={VehicleTypeId}, HyoungNo={HyoungNo}, VehicleId={VehicleId}, " +
                    "SiteId={SiteId}, SiteIds={SiteIds}, DriverId={DriverId}, AverageKmL={AverageKmL}",
                    request.VehicleType, request.VehicleTypeId, request.HyoungNo, request.VehicleId, request.SiteId,
                    string.Join(",", request.SiteIds ?? new List<int>()), request.DriverId, request.AverageKmL);
                throw;
            }
        }

        private decimal CalculateConsumption(decimal fuelAmount, decimal distanceOrHours, bool isKmL)
        {
            if (fuelAmount > 0 && distanceOrHours > 0)
            {
                return isKmL ?
                    Math.Round(distanceOrHours / fuelAmount, 2) :
                    Math.Round(fuelAmount / distanceOrHours, 2);
            }
            return 0;
        }

        private static string ResolveAssignedDriverName(Vehicle vehicle)
        {
            if (vehicle.EmployeeVehicles == null)
            {
                return string.Empty;
            }

            var assignedDriverName = string.Empty;

            foreach (var employeeVehicle in vehicle.EmployeeVehicles)
            {
                var fullName = employeeVehicle.Employee?.FullName;
                if (string.IsNullOrWhiteSpace(fullName))
                {
                    continue;
                }

                if (string.IsNullOrEmpty(assignedDriverName) || string.CompareOrdinal(fullName, assignedDriverName) < 0)
                {
                    assignedDriverName = fullName;
                }
            }

            return assignedDriverName;
        }
    }
}