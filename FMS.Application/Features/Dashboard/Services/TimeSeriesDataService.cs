using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities.Dashboard;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.Dashboard
{
    public class TimeSeriesDataService : ITimeSeriesDataService
    {
        private readonly GpsdataContext _context;
        private readonly IDataSourceMetadataService _metadataService;
        private readonly ILogger<TimeSeriesDataService> _logger;

        public TimeSeriesDataService(
            GpsdataContext context,
            IDataSourceMetadataService metadataService,
            ILogger<TimeSeriesDataService> logger)
        {
            _context = context;
            _metadataService = metadataService;
            _logger = logger;
        }

        public async Task<object> GetTimeSeriesAsync(string dataSource, DashboardMetricRequestDto request)
        {
            try
            {
                var canonicalSource = IdentifierNormalizer.NormalizeDataSource(dataSource ?? request.MetricType);
                var (start, end) = GetDateRange(request.DatePreset, request.StartDate, request.EndDate);
                var granularity = ResolveGranularity(request, canonicalSource);

                switch (canonicalSource)
                {
                    case WidgetTypeDefinitions.DataSources.FUEL_DISPENSE:
                        return await GetFuelDispensedSeries(start, end, granularity, request);

                    case WidgetTypeDefinitions.DataSources.FUEL_USED_GPS:
                        return await GetVehicleConsumptionSeries(start, end, granularity, request, TimeSeriesMetric.FuelUsed);

                    case WidgetTypeDefinitions.DataSources.ENGINE_HOURS:
                    case WidgetTypeDefinitions.DataSources.ENGINE_HOURS_GPS:
                        return await GetVehicleConsumptionSeries(start, end, granularity, request, TimeSeriesMetric.EngineHours);

                    case WidgetTypeDefinitions.DataSources.KM_TRAVEL:
                    case WidgetTypeDefinitions.DataSources.DISTANCE_TRAVEL:
                        return await GetVehicleConsumptionSeries(start, end, granularity, request, TimeSeriesMetric.Distance);

                    default:
                        return Array.Empty<object>();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating time series for data source {DataSource}", dataSource);
                return Array.Empty<object>();
            }
        }

        private async Task<object> GetFuelDispensedSeries(DateTime start, DateTime end, string granularity, DashboardMetricRequestDto request)
        {
            var tvh = _context.TankVolumeHistories
                .Where(t => t.Timestamp >= start && t.Timestamp <= end)
                .Where(t => t.ChangeReason == VolumeChangeReasonEnum.Dispensing || t.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing);

            if (request.SiteIds != null && request.SiteIds.Any())
            {
                var tankIds = await _context.Tanks
                    .Where(t => request.SiteIds.Contains(t.SiteId))
                    .Select(t => t.Id)
                    .ToListAsync();

                tvh = tvh.Where(t => t.TankId.HasValue && tankIds.Contains(t.TankId.Value));
            }

            if (string.Equals(granularity, "hour", StringComparison.OrdinalIgnoreCase))
            {
                var grouped = await tvh
                    .GroupBy(t => new { t.Timestamp.Year, t.Timestamp.Month, t.Timestamp.Day, t.Timestamp.Hour })
                    .Select(g => new { g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Hour, Sum = g.Sum(x => Math.Abs(x.VolumeChange ?? 0)) })
                    .ToListAsync();

                return grouped
                    .Select(g => new { timestamp = new DateTime(g.Year, g.Month, g.Day, g.Hour, 0, 0, DateTimeKind.Local), value = (decimal)g.Sum })
                    .OrderBy(p => p.timestamp)
                    .ToList();
            }

            var groupedDaily = await tvh
                .GroupBy(t => new { t.Timestamp.Year, t.Timestamp.Month, t.Timestamp.Day })
                .Select(g => new { g.Key.Year, g.Key.Month, g.Key.Day, Sum = g.Sum(x => Math.Abs(x.VolumeChange ?? 0)) })
                .ToListAsync();

            return groupedDaily
                .Select(g => new { timestamp = new DateTime(g.Year, g.Month, g.Day, 0, 0, 0, DateTimeKind.Local), value = (decimal)g.Sum })
                .OrderBy(p => p.timestamp)
                .ToList();
        }

        private async Task<object> GetVehicleConsumptionSeries(DateTime start, DateTime end, string granularity, DashboardMetricRequestDto request, TimeSeriesMetric metric)
        {
            var vc = _context.Vehicleconsumptions.Where(v => v.Date >= start && v.Date <= end);

            if (request.SiteIds != null && request.SiteIds.Any())
            {
                vc = vc.Where(v => request.SiteIds.Contains(v.SiteId));
            }

            if (metric == TimeSeriesMetric.Distance)
            {
                vc = vc.Where(v => v.IsKmperLiter == 1);
            }

            // Use separate query paths for each metric to ensure EF Core can translate to SQL
            if (string.Equals(granularity, "hour", StringComparison.OrdinalIgnoreCase))
            {
                return metric switch
                {
                    TimeSeriesMetric.FuelUsed => await GetHourlyFuelUsedAsync(vc),
                    TimeSeriesMetric.EngineHours => await GetHourlyEngineHoursAsync(vc),
                    TimeSeriesMetric.Distance => await GetHourlyDistanceAsync(vc),
                    _ => new List<object>()
                };
            }

            return metric switch
            {
                TimeSeriesMetric.FuelUsed => await GetDailyFuelUsedAsync(vc),
                TimeSeriesMetric.EngineHours => await GetDailyEngineHoursAsync(vc),
                TimeSeriesMetric.Distance => await GetDailyDistanceAsync(vc),
                _ => new List<object>()
            };
        }

        private async Task<object> GetHourlyFuelUsedAsync(IQueryable<FMS.Domain.Entities.Vehicleconsumption> vc)
        {
            var grouped = await vc
                .GroupBy(v => new { v.Date.Year, v.Date.Month, v.Date.Day, v.Date.Hour })
                .Select(g => new { g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Hour, Sum = g.Sum(x => x.TotalFuel ?? 0m) })
                .ToListAsync();

            return grouped
                .Select(g => new { timestamp = new DateTime(g.Year, g.Month, g.Day, g.Hour, 0, 0, DateTimeKind.Local), value = g.Sum })
                .OrderBy(p => p.timestamp)
                .ToList();
        }

        private async Task<object> GetHourlyEngineHoursAsync(IQueryable<FMS.Domain.Entities.Vehicleconsumption> vc)
        {
            var grouped = await vc
                .GroupBy(v => new { v.Date.Year, v.Date.Month, v.Date.Day, v.Date.Hour })
                .Select(g => new { g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Hour, Sum = g.Sum(x => x.EngHours ?? 0m) })
                .ToListAsync();

            return grouped
                .Select(g => new { timestamp = new DateTime(g.Year, g.Month, g.Day, g.Hour, 0, 0, DateTimeKind.Local), value = (decimal)g.Sum })
                .OrderBy(p => p.timestamp)
                .ToList();
        }

        private async Task<object> GetHourlyDistanceAsync(IQueryable<FMS.Domain.Entities.Vehicleconsumption> vc)
        {
            var grouped = await vc
                .GroupBy(v => new { v.Date.Year, v.Date.Month, v.Date.Day, v.Date.Hour })
                .Select(g => new { g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Hour, Sum = g.Sum(x => x.TotalDistance ?? 0m) })
                .ToListAsync();

            return grouped
                .Select(g => new { timestamp = new DateTime(g.Year, g.Month, g.Day, g.Hour, 0, 0, DateTimeKind.Local), value = (decimal)g.Sum })
                .OrderBy(p => p.timestamp)
                .ToList();
        }

        private async Task<object> GetDailyFuelUsedAsync(IQueryable<FMS.Domain.Entities.Vehicleconsumption> vc)
        {
            var grouped = await vc
                .GroupBy(v => new { v.Date.Year, v.Date.Month, v.Date.Day })
                .Select(g => new { g.Key.Year, g.Key.Month, g.Key.Day, Sum = g.Sum(x => x.TotalFuel ?? 0m) })
                .ToListAsync();

            return grouped
                .Select(g => new { timestamp = new DateTime(g.Year, g.Month, g.Day, 0, 0, 0, DateTimeKind.Local), value = g.Sum })
                .OrderBy(p => p.timestamp)
                .ToList();
        }

        private async Task<object> GetDailyEngineHoursAsync(IQueryable<FMS.Domain.Entities.Vehicleconsumption> vc)
        {
            var grouped = await vc
                .GroupBy(v => new { v.Date.Year, v.Date.Month, v.Date.Day })
                .Select(g => new { g.Key.Year, g.Key.Month, g.Key.Day, Sum = g.Sum(x => x.EngHours ?? 0m) })
                .ToListAsync();

            return grouped
                .Select(g => new { timestamp = new DateTime(g.Year, g.Month, g.Day, 0, 0, 0, DateTimeKind.Local), value = (decimal)g.Sum })
                .OrderBy(p => p.timestamp)
                .ToList();
        }

        private async Task<object> GetDailyDistanceAsync(IQueryable<FMS.Domain.Entities.Vehicleconsumption> vc)
        {
            var grouped = await vc
                .GroupBy(v => new { v.Date.Year, v.Date.Month, v.Date.Day })
                .Select(g => new { g.Key.Year, g.Key.Month, g.Key.Day, Sum = g.Sum(x => x.TotalDistance ?? 0m) })
                .ToListAsync();

            return grouped
                .Select(g => new { timestamp = new DateTime(g.Year, g.Month, g.Day, 0, 0, 0, DateTimeKind.Local), value = (decimal)g.Sum })
                .OrderBy(p => p.timestamp)
                .ToList();
        }

        private (DateTime start, DateTime end) GetDateRange(string datePreset, DateTime? customStart, DateTime? customEnd)
        {
            if (customStart.HasValue && customEnd.HasValue)
            {
                return (customStart.Value, customEnd.Value);
            }

            var now = DateTime.Now;
            var today = now.Date;

            return (datePreset ?? string.Empty).ToLowerInvariant() switch
            {
                "today" => (today, today.AddDays(1).AddSeconds(-1)),
                "yesterday" => (today.AddDays(-1), today.AddSeconds(-1)),
                "last_7_days" => (today.AddDays(-7), today.AddDays(1).AddSeconds(-1)),
                "last_30_days" => (today.AddDays(-30), today.AddDays(1).AddSeconds(-1)),
                "this_week" => GetThisWeekRange(today),
                "last_week" => GetLastWeekRange(today),
                "this_month" => GetThisMonthRange(today),
                "last_month" => GetLastMonthRange(today),
                _ => (today, today.AddDays(1).AddSeconds(-1))
            };
        }

        private (DateTime start, DateTime end) GetLastWeekRange(DateTime referenceDate)
        {
            var daysFromMonday = ((int)referenceDate.DayOfWeek - 1 + 7) % 7;
            var thisWeekMonday = referenceDate.AddDays(-daysFromMonday);
            var lastWeekMonday = thisWeekMonday.AddDays(-7);
            var lastWeekSunday = lastWeekMonday.AddDays(6);
            return (lastWeekMonday, lastWeekSunday.AddDays(1).AddSeconds(-1));
        }

        private (DateTime start, DateTime end) GetThisWeekRange(DateTime referenceDate)
        {
            var daysFromMonday = ((int)referenceDate.DayOfWeek - 1 + 7) % 7;
            var thisWeekMonday = referenceDate.AddDays(-daysFromMonday);
            var thisWeekSunday = thisWeekMonday.AddDays(6);
            return (thisWeekMonday, thisWeekSunday.AddDays(1).AddSeconds(-1));
        }

        private (DateTime start, DateTime end) GetThisMonthRange(DateTime referenceDate)
        {
            var firstDayThisMonth = new DateTime(referenceDate.Year, referenceDate.Month, 1);
            var firstDayNextMonth = firstDayThisMonth.AddMonths(1);
            return (firstDayThisMonth, firstDayNextMonth.AddSeconds(-1));
        }

        private (DateTime start, DateTime end) GetLastMonthRange(DateTime referenceDate)
        {
            var firstDayThisMonth = new DateTime(referenceDate.Year, referenceDate.Month, 1);
            var firstDayLastMonth = firstDayThisMonth.AddMonths(-1);
            var lastDayLastMonth = firstDayThisMonth.AddSeconds(-1);
            return (firstDayLastMonth, lastDayLastMonth);
        }

        private string ResolveGranularity(DashboardMetricRequestDto request, string canonicalSource)
        {
            if (request.IntervalHours.HasValue && request.IntervalHours.Value <= 1)
            {
                return "hour";
            }

            var metadata = _metadataService.GetMetadata(canonicalSource);
            string defaultGranularity = metadata?.DefaultGranularity ?? "day";
            return string.Equals(defaultGranularity, "hour", StringComparison.OrdinalIgnoreCase) ? "hour" : "day";
        }

        private enum TimeSeriesMetric
        {
            FuelUsed,
            EngineHours,
            Distance
        }
    }
}