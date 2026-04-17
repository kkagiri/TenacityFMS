/**
 * File:          GetGpsConsumptionAnalyticsQuery.cs
 * Purpose:       Retrieves GPS consumption analytics — daily aggregates and vehicle-type breakdowns from vehicleconsumption table.
 * Dependencies:  GpsdataContext, GpsConsumptionAnalyticsDTO, MediatR, EF Core
 * Last Modified: 2026-04-16
 *
 * Key Components:
 * - GetGpsConsumptionAnalyticsQuery: Filter contract
 * - GetGpsConsumptionAnalyticsQueryHandler: Executes analytics aggregation
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
    public record GetGpsConsumptionAnalyticsQuery(
        DateTime StartDate,
        DateTime EndDate,
        int? VehicleTypeId = null,
        int? VehicleId = null,
        int? SiteId = null,
        List<int>? SiteIds = null
    ) : IRequest<GpsConsumptionAnalyticsDTO>;

    public class GetGpsConsumptionAnalyticsQueryHandler
        : IRequestHandler<GetGpsConsumptionAnalyticsQuery, GpsConsumptionAnalyticsDTO>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetGpsConsumptionAnalyticsQueryHandler> _logger;

        public GetGpsConsumptionAnalyticsQueryHandler(
            GpsdataContext context,
            ILogger<GetGpsConsumptionAnalyticsQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<GpsConsumptionAnalyticsDTO> Handle(
            GetGpsConsumptionAnalyticsQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var adjustedEndDate = request.EndDate.Date.AddDays(1).AddTicks(-1);

                var query = _context.Vehicleconsumptions
                    .Include(vc => vc.Vehicle)
                        .ThenInclude(v => v.VehicleType)
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

                if (siteIds.Count > 0)
                {
                    query = query.Where(vc => siteIds.Contains(vc.SiteId));
                }

                if (request.VehicleTypeId.HasValue && request.VehicleTypeId.Value > 0)
                {
                    query = query.Where(vc => vc.Vehicle.VehicleTypeId == request.VehicleTypeId.Value);
                }

                if (request.VehicleId.HasValue && request.VehicleId.Value > 0)
                {
                    query = query.Where(vc => vc.VehicleId == request.VehicleId.Value);
                }

                var records = await query.ToListAsync(cancellationToken);

                if (records.Count == 0)
                {
                    return new GpsConsumptionAnalyticsDTO();
                }

                // Daily aggregation
                var dailyData = records
                    .GroupBy(r => r.Date.Date)
                    .OrderBy(g => g.Key)
                    .Select(g => new GpsConsumptionDailyDTO
                    {
                        Date = g.Key,
                        TotalFuel = g.Sum(r => r.TotalFuel ?? 0m),
                        TotalDistance = g.Sum(r => r.TotalDistance ?? 0m),
                        TotalEngHours = g.Sum(r => r.EngHours ?? 0m),
                        AvgSpeed = g.Count() > 0 ? g.Average(r => r.AvgSpeed ?? 0m) : 0m,
                        MaxSpeed = g.Max(r => r.MaxSpeed ?? 0m),
                        FuelLost = g.Sum(r => r.FuelLost ?? 0m),
                        RecordCount = g.Count(),
                        VehicleCount = g.Select(r => r.VehicleId).Distinct().Count()
                    })
                    .ToList();

                // By vehicle type aggregation
                var byVehicleType = records
                    .GroupBy(r => r.Vehicle?.VehicleType?.Name ?? "Unknown")
                    .Select(g => new GpsConsumptionByVehicleTypeDTO
                    {
                        VehicleType = g.Key,
                        TotalFuel = g.Sum(r => r.TotalFuel ?? 0m),
                        TotalDistance = g.Sum(r => r.TotalDistance ?? 0m),
                        TotalEngHours = g.Sum(r => r.EngHours ?? 0m),
                        VehicleCount = g.Select(r => r.VehicleId).Distinct().Count(),
                        RecordCount = g.Count()
                    })
                    .OrderByDescending(x => x.TotalFuel)
                    .ToList();

                var totalFuel = records.Sum(r => r.TotalFuel ?? 0m);
                var totalDistance = records.Sum(r => r.TotalDistance ?? 0m);
                var totalEngHours = records.Sum(r => r.EngHours ?? 0m);
                var totalFuelLost = records.Sum(r => r.FuelLost ?? 0m);
                var avgSpeed = records.Count > 0 ? records.Average(r => r.AvgSpeed ?? 0m) : 0m;

                // Average consumption across all records
                var validRecords = records.Where(r => (r.TotalFuel ?? 0m) > 0).ToList();
                decimal avgConsumption = 0m;
                if (validRecords.Count > 0)
                {
                    var kmRecords = validRecords.Where(r => r.IsKmperLiter == 1 && (r.TotalDistance ?? 0m) > 0).ToList();
                    if (kmRecords.Count > 0)
                    {
                        avgConsumption = kmRecords.Average(r => (r.TotalDistance ?? 0m) / (r.TotalFuel ?? 1m));
                    }
                }

                var result = new GpsConsumptionAnalyticsDTO
                {
                    TotalFuel = Math.Round(totalFuel, 2),
                    TotalDistance = Math.Round(totalDistance, 2),
                    TotalEngHours = Math.Round(totalEngHours, 2),
                    TotalFuelLost = Math.Round(totalFuelLost, 2),
                    AvgSpeed = Math.Round(avgSpeed, 2),
                    AvgConsumption = Math.Round(avgConsumption, 2),
                    TotalRecords = records.Count,
                    TotalVehicles = records.Select(r => r.VehicleId).Distinct().Count(),
                    DailyData = dailyData,
                    ByVehicleType = byVehicleType
                };

                _logger.LogInformation(
                    "GPS consumption analytics completed. Date range: {StartDate} to {EndDate}, " +
                    "Records: {RecordCount}, Vehicles: {VehicleCount}",
                    request.StartDate, request.EndDate, records.Count, result.TotalVehicles);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error fetching GPS consumption analytics. " +
                    "Filters: VehicleTypeId={VehicleTypeId}, VehicleId={VehicleId}, SiteId={SiteId}",
                    request.VehicleTypeId, request.VehicleId, request.SiteId);
                throw;
            }
        }
    }
}
