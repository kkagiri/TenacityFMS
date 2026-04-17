/**
 * File: GetVehicleConsumptionGpsQueryFiltered.cs
 * Purpose: Retrieves GPS-tracked consumption results from the vehicleconsumption table with database-level filters.
 * Dependencies: GpsdataContext, GpsConsumptionDTO, MediatR, EF Core
 * Last Modified: 2026-06-12
 *
 * Key Components:
 * - GetVehicleConsumptionGpsQueryFiltered: Filter contract for GPS consumption queries
 * - GetVehicleConsumptionGpsQueryFilteredHandler: Executes filtered GPS consumption aggregation
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FMS.Consumption;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.Consumption
{
    public record GetVehicleConsumptionGpsQueryFiltered(
        DateTime StartDate,
        DateTime EndDate,
        int? VehicleTypeId = null,
        int? VehicleId = null,
        int? SiteId = null,
        List<int>? SiteIds = null,
        bool? AverageKmL = null
    ) : IRequest<List<GpsConsumptionDTO>>;

    public class GetVehicleConsumptionGpsQueryFilteredHandler
        : IRequestHandler<GetVehicleConsumptionGpsQueryFiltered, List<GpsConsumptionDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetVehicleConsumptionGpsQueryFilteredHandler> _logger;

        public GetVehicleConsumptionGpsQueryFilteredHandler(
            GpsdataContext context,
            ILogger<GetVehicleConsumptionGpsQueryFilteredHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<GpsConsumptionDTO>> Handle(
            GetVehicleConsumptionGpsQueryFiltered request,
            CancellationToken cancellationToken)
        {
            try
            {
                var adjustedEndDate = request.EndDate.Date.AddDays(1).AddTicks(-1);

                var query = _context.Vehicleconsumptions
                    .Include(vc => vc.Vehicle)
                        .ThenInclude(v => v.VehicleType)
                    .Include(vc => vc.Vehicle)
                        .ThenInclude(v => v.VehicleManufacturer)
                    .Include(vc => vc.Vehicle)
                        .ThenInclude(v => v.VehicleModel)
                    .Include(vc => vc.Vehicle)
                        .ThenInclude(v => v.DefaultExptdAvg)
                    .Include(vc => vc.Site)
                    .Where(vc => vc.Date >= request.StartDate.Date && vc.Date <= adjustedEndDate)
                    .AsQueryable();

                // Normalize site IDs
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
                    query = query.Where(vc => siteIds.Contains(vc.SiteId));
                }

                // Apply vehicle type filter
                if (request.VehicleTypeId.HasValue && request.VehicleTypeId.Value > 0)
                {
                    query = query.Where(vc => vc.Vehicle.VehicleTypeId == request.VehicleTypeId.Value);
                }

                // Apply vehicle ID filter
                if (request.VehicleId.HasValue && request.VehicleId.Value > 0)
                {
                    query = query.Where(vc => vc.VehicleId == request.VehicleId.Value);
                }

                // Apply average mode filter (IsKmperLiter: 1 = km/L, 0 = L/hr)
                if (request.AverageKmL.HasValue)
                {
                    var isKmPerLiterValue = request.AverageKmL.Value ? (ulong)1 : (ulong)0;
                    query = query.Where(vc => vc.IsKmperLiter == isKmPerLiterValue);
                }

                var records = await query.ToListAsync(cancellationToken);

                // Group by VehicleId and aggregate
                var result = records
                    .GroupBy(vc => vc.VehicleId)
                    .Select(g =>
                    {
                        var vehicle = g.First().Vehicle;
                        var site = g.First().Site;
                        var isKmL = g.First().IsKmperLiter == 1;

                        var totalFuel = g.Sum(r => r.TotalFuel ?? 0m);
                        var totalDistance = g.Sum(r => r.TotalDistance ?? 0m);
                        var totalEngHours = g.Sum(r => r.EngHours ?? 0m);
                        var distanceOrEngineHours = isKmL ? totalDistance : totalEngHours;

                        var consumption = CalculateConsumption(totalFuel, distanceOrEngineHours, isKmL);

                        return new GpsConsumptionDTO
                        {
                            Id = vehicle.VehicleId,
                            VehicleId = vehicle.VehicleId,
                            HyoungNo = vehicle.HyoungNo ?? string.Empty,
                            VehicleType = vehicle.VehicleType?.Name ?? "Unknown",
                            WorkingSiteId = site?.Id ?? 0,
                            WorkingSiteName = site?.Name ?? "Unknown",
                            TotalFuelAmount = totalFuel,
                            DistanceOrEngineHours = distanceOrEngineHours,
                            IsKmL = isKmL,
                            RecordCount = g.Count(),
                            Consumption = consumption,
                            ExpectedAverage = vehicle.DefaultExptdAvg?.ExpectedAverageValue ?? 0,
                            VehicleInfo = $"{vehicle.VehicleManufacturer?.Name ?? "Unknown"} {vehicle.VehicleModel?.Name ?? "Unknown"}",
                            MaxSpeed = g.Max(r => r.MaxSpeed ?? 0m),
                            AvgSpeed = g.Count() > 0 ? g.Average(r => r.AvgSpeed ?? 0m) : 0m,
                            EngHours = totalEngHours,
                            FuelLost = g.Sum(r => r.FuelLost ?? 0m),
                        };
                    })
                    .ToList();

                _logger.LogInformation(
                    "GPS consumption query completed. Date range: {StartDate} to {EndDate}, " +
                    "Filters: VehicleTypeId={VehicleTypeId}, VehicleId={VehicleId}, " +
                    "SiteId={SiteId}, SiteIds={SiteIds}, AverageKmL={AverageKmL}. Results: {ResultCount}",
                    request.StartDate, request.EndDate, request.VehicleTypeId, request.VehicleId,
                    request.SiteId, string.Join(",", siteIds), request.AverageKmL, result.Count);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error fetching GPS vehicle consumption data. " +
                    "Filters: VehicleTypeId={VehicleTypeId}, VehicleId={VehicleId}, " +
                    "SiteId={SiteId}, SiteIds={SiteIds}, AverageKmL={AverageKmL}",
                    request.VehicleTypeId, request.VehicleId, request.SiteId,
                    string.Join(",", request.SiteIds ?? new List<int>()), request.AverageKmL);
                throw;
            }
        }

        private decimal CalculateConsumption(decimal fuelAmount, decimal distanceOrHours, bool isKmL)
        {
            if (fuelAmount > 0 && distanceOrHours > 0)
            {
                return isKmL
                    ? Math.Round(distanceOrHours / fuelAmount, 2)
                    : Math.Round(fuelAmount / distanceOrHours, 2);
            }
            return 0;
        }
    }
}
