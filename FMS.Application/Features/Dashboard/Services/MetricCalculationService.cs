using System;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Dashboard;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.Dashboard
{
    public class MetricCalculationService : IMetricCalculationService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<MetricCalculationService> _logger;

        public MetricCalculationService(GpsdataContext context, ILogger<MetricCalculationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<DashboardMetricResponseDto> ComputeMetricAsync(DashboardMetricRequestDto request)
        {
            try
            {
                var metric = IdentifierNormalizer.NormalizeDataSource(request.MetricType);
                switch (metric)
                {
                    case WidgetTypeDefinitions.DataSources.FUEL_DISPENSE:
                        return await ComputeFuelDispensedAsync(request);
                    case WidgetTypeDefinitions.DataSources.FUEL_USED_GPS:
                        return await ComputeFuelUsedGpsAsync(request);
                    case WidgetTypeDefinitions.DataSources.ENGINE_HOURS:
                        return await ComputeEngineHoursAsync(request);
                    case WidgetTypeDefinitions.DataSources.DISTANCE_TRAVEL:
                        return await ComputeDistanceTravelledAsync(request);
                    case WidgetTypeDefinitions.DataSources.TANK_LEVEL:
                        return new DashboardMetricResponseDto { ErrorMessage = "Tank level metric not yet implemented", LastUpdated = DateTime.UtcNow };
                    default:
                        return new DashboardMetricResponseDto { ErrorMessage = $"Unsupported metric type: {request.MetricType}", LastUpdated = DateTime.UtcNow };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error computing metric {MetricType}", request.MetricType);
                return new DashboardMetricResponseDto { ErrorMessage = "Internal server error occurred while fetching metric data", LastUpdated = DateTime.UtcNow };
            }
        }


        public async Task<object> CalculateChangeAsync(DashboardMetricResponseDto response)
        {
            try
            {
                var range = ParseDateRange(response.DateRange);
                if (range == null) return new { value = 0m, percentage = 0m, direction = "stable" };

                var (start, end) = range.Value;
                var prevDuration = end - start;
                var prevStart = start - prevDuration;
                var prevEnd = start - TimeSpan.FromSeconds(1);

                var previousRequest = new DashboardMetricRequestDto
                {
                    MetricType = response.MetricType,
                    Mode = string.Equals(response.Mode, "live", StringComparison.OrdinalIgnoreCase) ? "historical_snapshot" : response.Mode,
                    DatePreset = "custom",
                    StartDate = prevStart,
                    EndDate = prevEnd
                };

                var prev = await ComputeMetricAsync(previousRequest);
                var prevValue = prev?.Value ?? 0m;
                var curValue = response.Value;
                var delta = curValue - prevValue;
                var pct = prevValue == 0 ? (curValue == 0 ? 0 : 100) : Math.Round((delta / prevValue) * 100m, 2);
                var dir = delta == 0 ? "stable" : (delta > 0 ? "up" : "down");
                return new { value = delta, percentage = pct, direction = dir };
            }
            catch
            {
                return new { value = 0m, percentage = 0m, direction = "stable" };
            }
        }

        private (DateTime start, DateTime end)? ParseDateRange(string dateRange)
        {
            if (string.IsNullOrWhiteSpace(dateRange)) return null;
            var parts = dateRange.Split(new[] { " to ", "-", "–" }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 2)
            {
                if (DateTime.TryParse(parts[0].Trim(), out var s) && DateTime.TryParse(parts[1].Trim(), out var e))
                {
                    return (s, e);
                }
            }
            return null;
        }

        private async Task<DashboardMetricResponseDto> ComputeFuelDispensedAsync(DashboardMetricRequestDto request)
        {
            var (startDate, endDate) = GetDateRange(request.DatePreset, request.StartDate, request.EndDate);
            var isLiveMode = string.Equals(request.Mode, "live", StringComparison.OrdinalIgnoreCase);
            if (isLiveMode && string.Equals(request.DatePreset, "today", StringComparison.OrdinalIgnoreCase)) endDate = DateTime.Now;

            var query = _context.TankVolumeHistories
                .Where(tvh => tvh.Timestamp >= startDate && tvh.Timestamp <= endDate)
                .Where(tvh => tvh.ChangeReason == VolumeChangeReasonEnum.Dispensing || tvh.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing);

            if (request.SiteIds != null && request.SiteIds.Any())
            {
                var tankIds = await _context.Tanks.Where(t => request.SiteIds.Contains(t.SiteId)).Select(t => t.Id).ToListAsync();
                query = query.Where(tvh => tvh.TankId.HasValue && tankIds.Contains(tvh.TankId.Value));
            }

            var totalDispensed = await query.SumAsync(tvh => Math.Abs(tvh.VolumeChange ?? 0));
            var affectedSitesCount = await GetAffectedSitesCount(query);

            return new DashboardMetricResponseDto
            {
                Value = (decimal)totalDispensed,
                Unit = "liters",
                LastUpdated = DateTime.UtcNow,
                MetricType = request.MetricType,
                Mode = request.Mode,
                DateRange = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
                AffectedSitesCount = affectedSitesCount,
                IsLiveData = isLiveMode
            };
        }

        private async Task<DashboardMetricResponseDto> ComputeFuelUsedGpsAsync(DashboardMetricRequestDto request)
        {
            var (startDate, endDate) = GetDateRange(request.DatePreset, request.StartDate, request.EndDate);
            var isLiveMode = string.Equals(request.Mode, "live", StringComparison.OrdinalIgnoreCase);
            if (isLiveMode)
            {
                return new DashboardMetricResponseDto
                {
                    Value = 0,
                    Unit = "liters",
                    LastUpdated = DateTime.UtcNow,
                    MetricType = request.MetricType,
                    Mode = request.Mode,
                    DateRange = "Live Data",
                    IsLiveData = true,
                    ErrorMessage = "Live fuel used GPS data not available - only historical processed data from GPS reports"
                };
            }

            var query = _context.Vehicleconsumptions
                .Where(vc => vc.Date >= startDate && vc.Date <= endDate)
                .Where(vc => vc.TotalFuel.HasValue);
            if (request.SiteIds != null && request.SiteIds.Any()) query = query.Where(vc => request.SiteIds.Contains(vc.SiteId));

            var total = await query.SumAsync(vc => vc.TotalFuel ?? 0);
            var affectedSitesCount = await query.Select(vc => vc.SiteId).Distinct().CountAsync();
            var affectedVehiclesCount = await query.Select(vc => vc.VehicleId).Distinct().CountAsync();
            return new DashboardMetricResponseDto
            {
                Value = (decimal)total,
                Unit = "liters",
                LastUpdated = DateTime.UtcNow,
                MetricType = request.MetricType,
                Mode = request.Mode,
                DateRange = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
                AffectedSitesCount = affectedSitesCount,
                AffectedVehiclesCount = affectedVehiclesCount,
                IsLiveData = isLiveMode
            };
        }

        private async Task<DashboardMetricResponseDto> ComputeEngineHoursAsync(DashboardMetricRequestDto request)
        {
            var (startDate, endDate) = GetDateRange(request.DatePreset, request.StartDate, request.EndDate);
            var isLiveMode = string.Equals(request.Mode, "live", StringComparison.OrdinalIgnoreCase);
            if (isLiveMode)
            {
                return new DashboardMetricResponseDto
                {
                    Value = 0,
                    Unit = "hours",
                    LastUpdated = DateTime.UtcNow,
                    MetricType = request.MetricType,
                    Mode = request.Mode,
                    DateRange = "Live Data",
                    IsLiveData = true,
                    ErrorMessage = "Live engine hours data not yet implemented - requires 3rd party integration"
                };
            }

            var query = _context.Vehicleconsumptions
                .Where(vc => vc.Date >= startDate && vc.Date <= endDate)
                .Where(vc => vc.EngHours.HasValue);
            if (request.SiteIds != null && request.SiteIds.Any()) query = query.Where(vc => request.SiteIds.Contains(vc.SiteId));

            var total = await query.SumAsync(vc => vc.EngHours ?? 0);
            var affectedSitesCount = await query.Select(vc => vc.SiteId).Distinct().CountAsync();
            var affectedVehiclesCount = await query.Select(vc => vc.VehicleId).Distinct().CountAsync();
            return new DashboardMetricResponseDto
            {
                Value = (decimal)total,
                Unit = "hours",
                LastUpdated = DateTime.UtcNow,
                MetricType = request.MetricType,
                Mode = request.Mode,
                DateRange = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
                AffectedSitesCount = affectedSitesCount,
                AffectedVehiclesCount = affectedVehiclesCount,
                IsLiveData = isLiveMode
            };
        }

        private async Task<DashboardMetricResponseDto> ComputeDistanceTravelledAsync(DashboardMetricRequestDto request)
        {
            var (startDate, endDate) = GetDateRange(request.DatePreset, request.StartDate, request.EndDate);
            var isLiveMode = string.Equals(request.Mode, "live", StringComparison.OrdinalIgnoreCase);

            var query = _context.Vehicleconsumptions
                .Where(vc => vc.Date >= startDate && vc.Date <= endDate)
                .Where(vc => vc.TotalDistance.HasValue)
                .Where(vc => vc.IsKmperhr == 1);
            if (request.SiteIds != null && request.SiteIds.Any()) query = query.Where(vc => request.SiteIds.Contains(vc.SiteId));

            var total = await query.SumAsync(vc => vc.TotalDistance ?? 0);
            var affectedSitesCount = await query.Select(vc => vc.SiteId).Distinct().CountAsync();
            var affectedVehiclesCount = await query.Select(vc => vc.VehicleId).Distinct().CountAsync();
            return new DashboardMetricResponseDto
            {
                Value = (decimal)total,
                Unit = "km",
                LastUpdated = DateTime.UtcNow,
                MetricType = request.MetricType,
                Mode = request.Mode,
                DateRange = isLiveMode ? $"Live Data (Historical Fallback) - {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}" : $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
                AffectedSitesCount = affectedSitesCount,
                AffectedVehiclesCount = affectedVehiclesCount,
                IsLiveData = isLiveMode
            };
        }

        private (DateTime start, DateTime end) GetDateRange(string preset, DateTime? customStart, DateTime? customEnd)
        {
            if (customStart.HasValue && customEnd.HasValue) return (customStart.Value, customEnd.Value);
            var now = DateTime.Now;
            var today = now.Date;
            return (preset ?? "").ToLower() switch
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
            int daysFromMonday = ((int)referenceDate.DayOfWeek - 1 + 7) % 7;
            var thisWeekMonday = referenceDate.AddDays(-daysFromMonday);
            var lastWeekMonday = thisWeekMonday.AddDays(-7);
            var lastWeekSunday = lastWeekMonday.AddDays(6);
            return (lastWeekMonday, lastWeekSunday.AddDays(1).AddSeconds(-1));
        }

        private (DateTime start, DateTime end) GetThisWeekRange(DateTime referenceDate)
        {
            int daysFromMonday = ((int)referenceDate.DayOfWeek - 1 + 7) % 7;
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

        private async Task<int> GetAffectedSitesCount(IQueryable<TankVolumeHistory> query)
        {
            try
            {
                return await query.Join(_context.Tanks, tvh => tvh.TankId, t => t.Id, (tvh, t) => t.SiteId).Distinct().CountAsync();
            }
            catch { return 0; }
        }
    }
}