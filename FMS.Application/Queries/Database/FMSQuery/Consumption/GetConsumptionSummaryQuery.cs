using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.Consumption
{
    /// <summary>
    /// Query to get consumption summary grouped by site and vehicle model
    /// </summary>
    public class GetConsumptionSummaryQuery : IRequest<ConsumptionReportSummaryDTO>
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? SiteId { get; set; }
        public string? VehicleType { get; set; }
        public string? GroupBy { get; set; } // week, month, quarter, year
    }

    public class GetConsumptionSummaryQueryHandler : IRequestHandler<GetConsumptionSummaryQuery, ConsumptionReportSummaryDTO>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetConsumptionSummaryQueryHandler> _logger;

        public GetConsumptionSummaryQueryHandler(GpsdataContext context, ILogger<GetConsumptionSummaryQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ConsumptionReportSummaryDTO> Handle(GetConsumptionSummaryQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var adjustedEndDate = request.EndDate.Date.AddDays(1).AddTicks(-1);

                // Get vehicles with related data
                var vehiclesQuery = _context.Vehicles
                    .Include(v => v.VehicleType)
                    .Include(v => v.VehicleManufacturer)
                    .Include(v => v.VehicleModel)
                    .Include(v => v.WorkingSite)
                    .Include(v => v.DefaultExptdAvg)
                    .AsQueryable();

                if (request.SiteId.HasValue)
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.WorkingSiteId == request.SiteId.Value);
                }

                if (!string.IsNullOrEmpty(request.VehicleType))
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.VehicleType != null && v.VehicleType.Name == request.VehicleType);
                }

                var vehicles = await vehiclesQuery.ToListAsync(cancellationToken);

                // Get fuel refills for the period
                var fuelRefillsQuery = _context.FuelRefills
                    .Where(f => f.Date >= request.StartDate.Date && f.Date <= adjustedEndDate);

                if (request.SiteId.HasValue)
                {
                    fuelRefillsQuery = fuelRefillsQuery.Where(f => f.SiteId == request.SiteId.Value);
                }

                var fuelRefills = await fuelRefillsQuery
                    .Include(f => f.Driver)
                    .Include(f => f.Site)
                    .ToListAsync(cancellationToken);

                // Build overall summary
                var overallSummary = new ConsumptionOverallSummaryDTO
                {
                    PeriodStart = request.StartDate,
                    PeriodEnd = request.EndDate,
                    TotalVehicles = 0,
                    TotalSites = 0,
                    TotalRefills = fuelRefills.Count,
                    TotalFuelConsumed = fuelRefills.Sum(f => f.ManualFuelrefillAmount ?? 0),
                    TotalDistance = 0,
                    TotalEngineHours = 0,
                    AverageConsumption = 0,
                    AverageEfficiency = 0
                };

                // Build site summaries
                var siteSummaries = new List<ConsumptionSummaryBySiteDTO>();
                var siteGroups = vehicles.GroupBy(v => new { v.WorkingSiteId, SiteName = v.WorkingSite?.Name ?? "Unknown" });

                foreach (var siteGroup in siteGroups)
                {
                    var siteVehicles = siteGroup.ToList();
                    var siteRefills = fuelRefills.Where(f => siteVehicles.Any(v => v.VehicleId == f.VehicleId)).ToList();

                    if (!siteRefills.Any()) continue;

                    var siteSummary = new ConsumptionSummaryBySiteDTO
                    {
                        SiteId = siteGroup.Key.WorkingSiteId ?? 0,
                        SiteName = siteGroup.Key.SiteName,
                        VehicleCount = siteVehicles.Count(v => siteRefills.Any(r => r.VehicleId == v.VehicleId)),
                        TotalFuelConsumed = siteRefills.Sum(f => f.ManualFuelrefillAmount ?? 0),
                        RefillCount = siteRefills.Count,
                        Vehicles = new List<ConsumptionByVehicleDTO>()
                    };

                    // Calculate vehicle-level data for this site
                    foreach (var vehicle in siteVehicles)
                    {
                        var vehicleRefills = siteRefills.Where(f => f.VehicleId == vehicle.VehicleId).OrderBy(f => f.Date).ToList();
                        if (!vehicleRefills.Any()) continue;

                        var totalFuel = vehicleRefills.Sum(f => f.ManualFuelrefillAmount ?? 0);
                        var distanceOrHours = vehicleRefills.Sum(f => (f.CurrentMeterReading ?? 0) - (f.PreviousMeterReading ?? 0));
                        var consumption = CalculateConsumption(totalFuel, distanceOrHours, vehicle.AverageKmL);

                        // Get expected average from vehicle's expected consumption setting
                        var expectedAvg = vehicle.DefaultExptdAvg?.ExpectedAverageValue ?? 0;
                        var efficiencyVariance = expectedAvg > 0 ? consumption - expectedAvg : 0;

                        siteSummary.Vehicles.Add(new ConsumptionByVehicleDTO
                        {
                            VehicleId = vehicle.VehicleId,
                            VehicleCode = vehicle.VehicleCode ?? string.Empty,
                            VehicleType = vehicle.VehicleType?.Name ?? "Unknown",
                            VehicleModel = vehicle.VehicleModel?.Name ?? "Unknown",
                            Manufacturer = vehicle.VehicleManufacturer?.Name ?? "Unknown",
                            TotalFuelConsumed = totalFuel,
                            TotalDistance = vehicle.AverageKmL ? distanceOrHours : 0,
                            TotalEngineHours = !vehicle.AverageKmL ? distanceOrHours : 0,
                            AverageConsumption = consumption,
                            FuelEfficiency = consumption,
                            ExpectedAverage = expectedAvg,
                            EfficiencyVariance = Math.Round(efficiencyVariance, 2),
                            RefillCount = vehicleRefills.Count,
                            IsKmPerLiter = vehicle.AverageKmL,
                            LastRefillDate = vehicleRefills.LastOrDefault()?.Date
                        });

                        // Add to overall totals
                        if (vehicle.AverageKmL)
                            overallSummary.TotalDistance += distanceOrHours;
                        else
                            overallSummary.TotalEngineHours += distanceOrHours;
                    }

                    // Calculate site averages
                    if (siteSummary.Vehicles.Any())
                    {
                        siteSummary.TotalDistance = siteSummary.Vehicles.Sum(v => v.TotalDistance);
                        siteSummary.TotalEngineHours = siteSummary.Vehicles.Sum(v => v.TotalEngineHours);
                        siteSummary.AverageConsumption = siteSummary.Vehicles.Average(v => v.AverageConsumption);
                        siteSummary.AverageEfficiency = siteSummary.Vehicles.Average(v => v.FuelEfficiency);
                    }

                    siteSummaries.Add(siteSummary);
                }

                // Build vehicle model summaries (for charts)
                var modelSummaries = new List<ConsumptionByVehicleModelDTO>();
                var allVehicleData = siteSummaries.SelectMany(s => s.Vehicles).ToList();
                var modelGroups = allVehicleData.GroupBy(v => new { v.VehicleModel, v.VehicleType, v.Manufacturer });

                foreach (var modelGroup in modelGroups)
                {
                    var avgExpected = modelGroup.Where(v => v.ExpectedAverage > 0).Select(v => v.ExpectedAverage).DefaultIfEmpty(0).Average();
                    var avgConsumption = modelGroup.Average(v => v.AverageConsumption);

                    modelSummaries.Add(new ConsumptionByVehicleModelDTO
                    {
                        VehicleModel = modelGroup.Key.VehicleModel,
                        VehicleType = modelGroup.Key.VehicleType,
                        Manufacturer = modelGroup.Key.Manufacturer,
                        VehicleCount = modelGroup.Count(),
                        TotalFuelConsumed = modelGroup.Sum(v => v.TotalFuelConsumed),
                        AverageConsumption = Math.Round(avgConsumption, 2),
                        AverageEfficiency = Math.Round(modelGroup.Average(v => v.FuelEfficiency), 2),
                        TotalDistance = modelGroup.Sum(v => v.TotalDistance),
                        TotalEngineHours = modelGroup.Sum(v => v.TotalEngineHours),
                        ExpectedAverage = Math.Round(avgExpected, 2),
                        EfficiencyVariance = avgExpected > 0 ? Math.Round(avgConsumption - avgExpected, 2) : 0,
                        RefillCount = modelGroup.Sum(v => v.RefillCount)
                    });
                }

                // Build vehicle type summaries (for comparison charts)
                var typeSummaries = new List<ConsumptionByVehicleTypeDTO>();
                var typeGroups = allVehicleData.GroupBy(v => v.VehicleType);

                foreach (var typeGroup in typeGroups)
                {
                    var avgExpected = typeGroup.Where(v => v.ExpectedAverage > 0).Select(v => v.ExpectedAverage).DefaultIfEmpty(0).Average();
                    var avgConsumption = typeGroup.Average(v => v.AverageConsumption);
                    var distinctModels = typeGroup.Select(v => v.VehicleModel).Distinct().Count();

                    typeSummaries.Add(new ConsumptionByVehicleTypeDTO
                    {
                        VehicleType = typeGroup.Key,
                        VehicleCount = typeGroup.Count(),
                        ModelCount = distinctModels,
                        TotalFuelConsumed = typeGroup.Sum(v => v.TotalFuelConsumed),
                        TotalDistance = typeGroup.Sum(v => v.TotalDistance),
                        TotalEngineHours = typeGroup.Sum(v => v.TotalEngineHours),
                        AverageConsumption = Math.Round(avgConsumption, 2),
                        AverageEfficiency = Math.Round(typeGroup.Average(v => v.FuelEfficiency), 2),
                        ExpectedAverage = Math.Round(avgExpected, 2),
                        EfficiencyVariance = avgExpected > 0 ? Math.Round(avgConsumption - avgExpected, 2) : 0,
                        RefillCount = typeGroup.Sum(v => v.RefillCount)
                    });
                }

                // Build vehicle comparison list (for individual vehicle comparison)
                var vehicleComparisons = allVehicleData
                    .Select(v => new VehicleComparisonDTO
                    {
                        VehicleId = v.VehicleId,
                        VehicleCode = v.VehicleCode,
                        VehicleType = v.VehicleType,
                        VehicleModel = v.VehicleModel,
                        Manufacturer = v.Manufacturer,
                        SiteName = siteSummaries.FirstOrDefault(s => s.Vehicles.Any(sv => sv.VehicleId == v.VehicleId))?.SiteName ?? "Unknown",
                        TotalFuelConsumed = v.TotalFuelConsumed,
                        TotalDistance = v.TotalDistance,
                        TotalEngineHours = v.TotalEngineHours,
                        AverageConsumption = v.AverageConsumption,
                        FuelEfficiency = v.FuelEfficiency,
                        ExpectedAverage = v.ExpectedAverage,
                        EfficiencyVariance = v.EfficiencyVariance,
                        RefillCount = v.RefillCount,
                        IsKmPerLiter = v.IsKmPerLiter
                    })
                    .OrderByDescending(v => v.TotalFuelConsumed)
                    .ToList();

                // Build trend data
                var trendData = BuildTrendData(fuelRefills, vehicles, request.GroupBy ?? "week");

                // Update overall summary counts
                overallSummary.TotalVehicles = allVehicleData.Select(v => v.VehicleId).Distinct().Count();
                overallSummary.TotalSites = siteSummaries.Count;
                if (allVehicleData.Any())
                {
                    overallSummary.AverageConsumption = Math.Round(allVehicleData.Average(v => v.AverageConsumption), 2);
                    overallSummary.AverageEfficiency = Math.Round(allVehicleData.Average(v => v.FuelEfficiency), 2);
                }

                return new ConsumptionReportSummaryDTO
                {
                    OverallSummary = overallSummary,
                    SiteSummaries = siteSummaries.OrderBy(s => s.SiteName).ToList(),
                    ModelSummaries = modelSummaries.OrderByDescending(m => m.TotalFuelConsumed).ToList(),
                    TypeSummaries = typeSummaries.OrderByDescending(t => t.TotalFuelConsumed).ToList(),
                    TrendData = trendData,
                    VehicleComparisons = vehicleComparisons
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching consumption summary data");
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

        private List<ConsumptionTrendDataDTO> BuildTrendData(
            List<Domain.Entities.FuelRefill> fuelRefills,
            List<Domain.Entities.Vehicle> vehicles,
            string groupBy)
        {
            var result = new List<ConsumptionTrendDataDTO>();

            if (!fuelRefills.Any()) return result;

            IEnumerable<IGrouping<DateTime, Domain.Entities.FuelRefill>> groupedRefills;

            switch (groupBy.ToLower())
            {
                case "week":
                    groupedRefills = fuelRefills.GroupBy(f => StartOfWeek(f.Date ?? DateTime.MinValue));
                    break;
                case "month":
                    groupedRefills = fuelRefills.GroupBy(f => new DateTime((f.Date ?? DateTime.MinValue).Year, (f.Date ?? DateTime.MinValue).Month, 1));
                    break;
                case "quarter":
                    groupedRefills = fuelRefills.GroupBy(f =>
                    {
                        var date = f.Date ?? DateTime.MinValue;
                        var quarter = (date.Month - 1) / 3;
                        return new DateTime(date.Year, quarter * 3 + 1, 1);
                    });
                    break;
                case "year":
                    groupedRefills = fuelRefills.GroupBy(f => new DateTime((f.Date ?? DateTime.MinValue).Year, 1, 1));
                    break;
                default:
                    groupedRefills = fuelRefills.GroupBy(f => StartOfWeek(f.Date ?? DateTime.MinValue));
                    break;
            }

            foreach (var group in groupedRefills.OrderBy(g => g.Key))
            {
                var totalFuel = group.Sum(f => f.ManualFuelrefillAmount ?? 0);
                var vehicleIds = group.Select(f => f.VehicleId).Distinct().ToList();
                var vehicleCount = vehicleIds.Count;

                // Calculate average consumption for vehicles in this period
                decimal avgConsumption = 0;
                if (vehicleCount > 0)
                {
                    var consumptions = new List<decimal>();
                    foreach (var vehicleId in vehicleIds)
                    {
                        var vehicle = vehicles.FirstOrDefault(v => v.VehicleId == vehicleId);
                        if (vehicle == null) continue;

                        var vehicleRefills = group.Where(f => f.VehicleId == vehicleId).ToList();
                        var fuel = vehicleRefills.Sum(f => f.ManualFuelrefillAmount ?? 0);
                        var distOrHrs = vehicleRefills.Sum(f => (f.CurrentMeterReading ?? 0) - (f.PreviousMeterReading ?? 0));
                        var consumption = CalculateConsumption(fuel, distOrHrs, vehicle.AverageKmL);
                        if (consumption > 0)
                            consumptions.Add(consumption);
                    }
                    if (consumptions.Any())
                        avgConsumption = consumptions.Average();
                }

                result.Add(new ConsumptionTrendDataDTO
                {
                    Date = group.Key,
                    Period = groupBy,
                    TotalFuelConsumed = totalFuel,
                    AverageConsumption = Math.Round(avgConsumption, 2),
                    VehicleCount = vehicleCount,
                    RefillCount = group.Count()
                });
            }

            return result;
        }

        private DateTime StartOfWeek(DateTime date)
        {
            int diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
            return date.AddDays(-diff).Date;
        }
    }
}
