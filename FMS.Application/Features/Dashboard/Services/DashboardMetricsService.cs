using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.ModelsDTOs.Dashboard;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.Dashboard {
    public class DashboardMetricsService : IDashboardMetricsService {
        private readonly GpsdataContext _context;
        private readonly ILogger<DashboardMetricsService> _logger;

        public DashboardMetricsService (
            GpsdataContext context,
            ILogger<DashboardMetricsService> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<DashboardMetricResponseDto> GetMetricAsync (DashboardMetricRequestDto request) {
            try {
                return request.MetricType.ToLower () switch {
                    "fuel_dispensed" => await GetFuelDispensedMetricAsync (request),
                        "fuel_used_gps" => await GetFuelUsedGpsMetricAsync (request),
                        "engine_hours" => await GetEngineHoursMetricAsync (request),
                        "km_travel" => await GetDistanceTravelledMetricAsync (request),
                        _ => new DashboardMetricResponseDto {
                            ErrorMessage = $"Unsupported metric type: {request.MetricType}",
                            LastUpdated = DateTime.UtcNow
                            }
                };
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting metric {MetricType} for mode {Mode}", request.MetricType, request.Mode);
                return new DashboardMetricResponseDto {
                    ErrorMessage = "Internal server error occurred while fetching metric data",
                        LastUpdated = DateTime.UtcNow
                };
            }
        }

        public async Task<DashboardMetricResponseDto> GetFuelDispensedMetricAsync (DashboardMetricRequestDto request) {
            try {
                var (startDate, endDate) = GetDateRange (request.DatePreset, request.StartDate, request.EndDate);
                var isLiveMode = request.Mode.ToLower () == "live";

                _logger.LogInformation ("Getting fuel dispensed metric for period {StartDate} to {EndDate}, Mode: {Mode}",
                    startDate, endDate, request.Mode);

                // For live mode with today preset, extend end date to current time
                if (isLiveMode && request.DatePreset.ToLower () == "today") {
                    endDate = DateTime.Now;
                }

                var query = _context.TankVolumeHistories
                    .Where (tvh => tvh.Timestamp >= startDate && tvh.Timestamp <= endDate)
                    .Where (tvh => tvh.ChangeReason == VolumeChangeReasonEnum.Dispensing ||
                        tvh.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing);

                // Apply site filtering if specified
                if (request.SiteIds != null && request.SiteIds.Any ()) {
                    // Filter by tanks that belong to specified sites
                    var tankIds = await _context.Tanks
                        .Where (t => request.SiteIds.Contains (t.SiteId))
                        .Select (t => t.Id)
                        .ToListAsync ();

                    query = query.Where (tvh => tankIds.Contains (tvh.TankId ?? 0));
                }

                // Calculate total fuel dispensed (absolute value since volume changes are negative for dispensing)
                var totalDispensed = await query
                    .SumAsync (tvh => Math.Abs (tvh.VolumeChange ?? 0));

                // Get affected sites count
                var affectedSitesCount = await GetAffectedSitesCount (query);

                // TODO: Future implementation - separate by fuel grade/type
                // TODO: Live mode - integrate with 3rd party real-time systems

                return new DashboardMetricResponseDto {
                    Value = totalDispensed,
                        Unit = "liters",
                        LastUpdated = DateTime.UtcNow,
                        MetricType = request.MetricType,
                        Mode = request.Mode,
                        DateRange = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
                        AffectedSitesCount = affectedSitesCount,
                        IsLiveData = isLiveMode
                };
            } catch (Exception ex) {
                _logger.LogError (ex, "Error calculating fuel dispensed metric");
                return new DashboardMetricResponseDto {
                    ErrorMessage = "Error calculating fuel dispensed data",
                        LastUpdated = DateTime.UtcNow
                };
            }
        }

        public async Task<DashboardMetricResponseDto> GetFuelUsedGpsMetricAsync (DashboardMetricRequestDto request) {
            try {
                var (startDate, endDate) = GetDateRange (request.DatePreset, request.StartDate, request.EndDate);
                var isLiveMode = request.Mode.ToLower () == "live";

                _logger.LogInformation ("Getting fuel used GPS metric for period {StartDate} to {EndDate}, Mode: {Mode}",
                    startDate, endDate, request.Mode);

                // Fuel Used GPS is only available in cumulative mode (from processed reports)
                if (isLiveMode) {
                    return new DashboardMetricResponseDto {
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
                    .Where (vc => vc.Date >= startDate && vc.Date <= endDate)
                    .Where (vc => vc.TotalFuel.HasValue);

                // Apply site filtering
                if (request.SiteIds != null && request.SiteIds.Any ()) {
                    query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
                }

                // Aggregate total fuel used from GPS data by site for the period
                var totalFuelUsed = await query.SumAsync (vc => vc.TotalFuel ?? 0);
                var affectedSitesCount = await query.Select (vc => vc.SiteId).Distinct ().CountAsync ();
                var affectedVehiclesCount = await query.Select (vc => vc.VehicleId).Distinct ().CountAsync ();

                return new DashboardMetricResponseDto {
                    Value = totalFuelUsed,
                        Unit = "liters",
                        LastUpdated = DateTime.UtcNow,
                        MetricType = request.MetricType,
                        Mode = request.Mode,
                        DateRange = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
                        AffectedSitesCount = affectedSitesCount,
                        AffectedVehiclesCount = affectedVehiclesCount,
                        IsLiveData = isLiveMode
                };
            } catch (Exception ex) {
                _logger.LogError (ex, "Error calculating fuel used GPS metric");
                return new DashboardMetricResponseDto {
                    ErrorMessage = "Error calculating fuel used GPS data",
                        LastUpdated = DateTime.UtcNow
                };
            }
        }

        public async Task<DashboardMetricResponseDto> GetEngineHoursMetricAsync (DashboardMetricRequestDto request) {
            try {
                var (startDate, endDate) = GetDateRange (request.DatePreset, request.StartDate, request.EndDate);
                var isLiveMode = request.Mode.ToLower () == "live";

                _logger.LogInformation ("Getting engine hours metric for period {StartDate} to {EndDate}, Mode: {Mode}",
                    startDate, endDate, request.Mode);

                if (isLiveMode) {
                    // TODO: Live mode - integrate with 3rd party API to query real-time vehicle data
                    // For now, return placeholder response
                    return new DashboardMetricResponseDto {
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
                    .Where (vc => vc.Date >= startDate && vc.Date <= endDate)
                    .Where (vc => vc.EngHours.HasValue);

                // Apply site filtering
                if (request.SiteIds != null && request.SiteIds.Any ()) {
                    query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
                }

                // Aggregate engine hours by site for the period
                var totalEngineHours = await query.SumAsync (vc => vc.EngHours ?? 0);
                var affectedSitesCount = await query.Select (vc => vc.SiteId).Distinct ().CountAsync ();
                var affectedVehiclesCount = await query.Select (vc => vc.VehicleId).Distinct ().CountAsync ();

                return new DashboardMetricResponseDto {
                    Value = totalEngineHours,
                        Unit = "hours",
                        LastUpdated = DateTime.UtcNow,
                        MetricType = request.MetricType,
                        Mode = request.Mode,
                        DateRange = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
                        AffectedSitesCount = affectedSitesCount,
                        AffectedVehiclesCount = affectedVehiclesCount,
                        IsLiveData = isLiveMode
                };
            } catch (Exception ex) {
                _logger.LogError (ex, "Error calculating engine hours metric");
                return new DashboardMetricResponseDto {
                    ErrorMessage = "Error calculating engine hours data",
                        LastUpdated = DateTime.UtcNow
                };
            }
        }

        public async Task<DashboardMetricResponseDto> GetDistanceTravelledMetricAsync (DashboardMetricRequestDto request) {
            try {
                var (startDate, endDate) = GetDateRange (request.DatePreset, request.StartDate, request.EndDate);
                var isLiveMode = request.Mode.ToLower () == "live";

                _logger.LogInformation ("Getting distance travelled metric for period {StartDate} to {EndDate}, Mode: {Mode}",
                    startDate, endDate, request.Mode);

                if (isLiveMode) {
                    // For live mode, fall back to latest historical data
                    // This provides better user experience than showing an error
                    _logger.LogInformation ("Live distance data requested - falling back to latest historical data");

                    // Use same query as historical mode but mark as live data
                    var liveQuery = _context.Vehicleconsumptions
                        .Where (vc => vc.Date >= startDate && vc.Date <= endDate)
                        .Where (vc => vc.TotalDistance.HasValue)
                        .Where (vc => vc.IsKmperhr == 1);

                    // Apply site filtering
                    if (request.SiteIds != null && request.SiteIds.Any ()) {
                        liveQuery = liveQuery.Where (vc => request.SiteIds.Contains (vc.SiteId));
                    }

                    var liveTotalDistance = await liveQuery.SumAsync (vc => vc.TotalDistance ?? 0);
                    var liveAffectedSitesCount = await liveQuery.Select (vc => vc.SiteId).Distinct ().CountAsync ();
                    var liveAffectedVehiclesCount = await liveQuery.Select (vc => vc.VehicleId).Distinct ().CountAsync ();

                    return new DashboardMetricResponseDto {
                        Value = liveTotalDistance,
                            Unit = "km",
                            LastUpdated = DateTime.UtcNow,
                            MetricType = request.MetricType,
                            Mode = request.Mode,
                            DateRange = $"Live Data (Historical Fallback) - {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
                            AffectedSitesCount = liveAffectedSitesCount,
                            AffectedVehiclesCount = liveAffectedVehiclesCount,
                            IsLiveData = true
                    };
                }

                var query = _context.Vehicleconsumptions
                    .Where (vc => vc.Date >= startDate && vc.Date <= endDate)
                    .Where (vc => vc.TotalDistance.HasValue)
                    .Where (vc => vc.IsKmperhr == 1); // Only include records marked as km/hr data

                // Apply site filtering
                if (request.SiteIds != null && request.SiteIds.Any ()) {
                    query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
                }

                // Aggregate total distance by site for the period
                var totalDistance = await query.SumAsync (vc => vc.TotalDistance ?? 0);
                var affectedSitesCount = await query.Select (vc => vc.SiteId).Distinct ().CountAsync ();
                var affectedVehiclesCount = await query.Select (vc => vc.VehicleId).Distinct ().CountAsync ();

                return new DashboardMetricResponseDto {
                    Value = totalDistance,
                        Unit = "km",
                        LastUpdated = DateTime.UtcNow,
                        MetricType = request.MetricType,
                        Mode = request.Mode,
                        DateRange = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
                        AffectedSitesCount = affectedSitesCount,
                        AffectedVehiclesCount = affectedVehiclesCount,
                        IsLiveData = isLiveMode
                };
            } catch (Exception ex) {
                _logger.LogError (ex, "Error calculating distance travelled metric");
                return new DashboardMetricResponseDto {
                    ErrorMessage = "Error calculating distance travelled data",
                        LastUpdated = DateTime.UtcNow
                };
            }
        }

        private (DateTime startDate, DateTime endDate) GetDateRange (string datePreset, DateTime? customStart, DateTime? customEnd) {
            // Use custom dates if provided
            if (customStart.HasValue && customEnd.HasValue) {
                return (customStart.Value, customEnd.Value);
            }

            var now = DateTime.Now;
            var today = now.Date;

            return datePreset.ToLower () switch {
                "today" => (today, today.AddDays (1).AddSeconds (-1)),
                "yesterday" => (today.AddDays (-1), today.AddSeconds (-1)),
                "last_week" => GetLastWeekRange (today),
                    "last_month" => GetLastMonthRange (today),
                    "last_year" => GetLastYearRange (today),
                    "this_week" => GetThisWeekRange (today),
                    "this_month" => GetThisMonthRange (today),
                    "this_year" => GetThisYearRange (today),
                    _ => (today, today.AddDays (1).AddSeconds (-1)) // Default to today
            };
        }

        private (DateTime start, DateTime end) GetLastWeekRange (DateTime referenceDate) {
            // Get previous complete week (Monday to Sunday)
            int daysFromMonday = ((int) referenceDate.DayOfWeek - 1 + 7) % 7;
            var thisWeekMonday = referenceDate.AddDays (-daysFromMonday);
            var lastWeekMonday = thisWeekMonday.AddDays (-7);
            var lastWeekSunday = lastWeekMonday.AddDays (6);

            return (lastWeekMonday, lastWeekSunday.AddDays (1).AddSeconds (-1));
        }

        private (DateTime start, DateTime end) GetLastMonthRange (DateTime referenceDate) {
            // Get previous complete month
            var firstDayThisMonth = new DateTime (referenceDate.Year, referenceDate.Month, 1);
            var firstDayLastMonth = firstDayThisMonth.AddMonths (-1);
            var lastDayLastMonth = firstDayThisMonth.AddSeconds (-1);

            return (firstDayLastMonth, lastDayLastMonth);
        }

        private (DateTime start, DateTime end) GetLastYearRange (DateTime referenceDate) {
            var firstDayThisYear = new DateTime (referenceDate.Year, 1, 1);
            var firstDayLastYear = firstDayThisYear.AddYears (-1);
            var lastDayLastYear = firstDayThisYear.AddSeconds (-1);

            return (firstDayLastYear, lastDayLastYear);
        }

        private (DateTime start, DateTime end) GetThisWeekRange (DateTime referenceDate) {
            int daysFromMonday = ((int) referenceDate.DayOfWeek - 1 + 7) % 7;
            var thisWeekMonday = referenceDate.AddDays (-daysFromMonday);
            var thisWeekSunday = thisWeekMonday.AddDays (6);

            return (thisWeekMonday, thisWeekSunday.AddDays (1).AddSeconds (-1));
        }

        private (DateTime start, DateTime end) GetThisMonthRange (DateTime referenceDate) {
            var firstDayThisMonth = new DateTime (referenceDate.Year, referenceDate.Month, 1);
            var firstDayNextMonth = firstDayThisMonth.AddMonths (1);

            return (firstDayThisMonth, firstDayNextMonth.AddSeconds (-1));
        }

        private (DateTime start, DateTime end) GetThisYearRange (DateTime referenceDate) {
            var firstDayThisYear = new DateTime (referenceDate.Year, 1, 1);
            var firstDayNextYear = firstDayThisYear.AddYears (1);

            return (firstDayThisYear, firstDayNextYear.AddSeconds (-1));
        }

        private async Task<int> GetAffectedSitesCount (IQueryable<TankVolumeHistory> query) {
            try {
                return await query
                    .Join (_context.Tanks, tvh => tvh.TankId, t => t.Id, (tvh, t) => t.SiteId)
                    .Distinct ()
                    .CountAsync ();
            } catch {
                return 0;
            }
        }
    }
}