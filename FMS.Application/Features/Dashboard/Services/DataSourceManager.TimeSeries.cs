using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities.enums;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Services.Dashboard {
    // Partial: Time-series generators (stub implementation)
    public partial class DataSourceManager {
        private async Task<object> GetTimeSeriesDataAsync (string dataSource, DashboardMetricRequestDto request) {
            try {
                var (start, end) = GetDateRange (request.DatePreset, request.StartDate, request.EndDate);
                var granularity = ResolveGranularity (request, dataSource);

                switch ((request.MetricType ?? dataSource ?? "").ToLower ()) {
                    case "fuel_dispensed":
                    case "fuel_dispense":
                    case "fuel_dispensed_total":
                        return await GetFuelDispensedSeries (start, end, granularity, request);

                    case "fuel_used_gps":
                        return await GetVehicleConsumptionSeries (start, end, granularity, request, metric: "fuel");

                    case "engine_hours":
                    case "engine_hours_gps":
                        return await GetVehicleConsumptionSeries (start, end, granularity, request, metric: "engine_hours");

                    case "km_travel":
                    case "distance_travel":
                    case "distance_travel_gps":
                        return await GetVehicleConsumptionSeries (start, end, granularity, request, metric: "distance");

                    default:
                        // Unknown series; return empty array
                        return Array.Empty<object> ();
                }
            } catch {
                return Array.Empty<object> ();
            }
        }

        private async Task<object> GetFuelDispensedSeries (DateTime start, DateTime end, string granularity, DashboardMetricRequestDto request) {
            // Base query for dispensing-related changes
            var tvh = _context.TankVolumeHistories
                .Where (t => t.Timestamp >= start && t.Timestamp <= end)
                .Where (t => t.ChangeReason == VolumeChangeReasonEnum.Dispensing || t.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing);

            // Apply site filters by resolving site -> tank ids
            if (request.SiteIds != null && request.SiteIds.Any ()) {
                var tankIds = await _context.Tanks
                    .Where (t => request.SiteIds.Contains (t.SiteId))
                    .Select (t => t.Id)
                    .ToListAsync ();
                tvh = tvh.Where (t => t.TankId.HasValue && tankIds.Contains (t.TankId.Value));
            }

            // Materialize grouped sums then project to points
            if (granularity == "hour") {
                var grouped = await tvh
                    .GroupBy (t => new { t.Timestamp.Year, t.Timestamp.Month, t.Timestamp.Day, t.Timestamp.Hour })
                    .Select (g => new { g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Hour, Sum = g.Sum (x => Math.Abs (x.VolumeChange ?? 0)) })
                    .ToListAsync ();

                var points = grouped
                    .Select (g => new { timestamp = new DateTime (g.Year, g.Month, g.Day, g.Hour, 0, 0, DateTimeKind.Local), value = (decimal) g.Sum })
                    .OrderBy (p => p.timestamp)
                    .ToList ();
                return points;
            } else // day
            {
                var grouped = await tvh
                    .GroupBy (t => new { t.Timestamp.Year, t.Timestamp.Month, t.Timestamp.Day })
                    .Select (g => new { g.Key.Year, g.Key.Month, g.Key.Day, Sum = g.Sum (x => Math.Abs (x.VolumeChange ?? 0)) })
                    .ToListAsync ();

                var points = grouped
                    .Select (g => new { timestamp = new DateTime (g.Year, g.Month, g.Day, 0, 0, 0, DateTimeKind.Local), value = (decimal) g.Sum })
                    .OrderBy (p => p.timestamp)
                    .ToList ();
                return points;
            }
        }

        private async Task<object> GetVehicleConsumptionSeries (DateTime start, DateTime end, string granularity, DashboardMetricRequestDto request, string metric) {
            var vc = _context.Vehicleconsumptions
                .Where (v => v.Date >= start && v.Date <= end);

            if (request.SiteIds != null && request.SiteIds.Any ()) {
                vc = vc.Where (v => request.SiteIds.Contains (v.SiteId));
            }

            // metric mapping
            Func<dynamic, decimal?> selector = metric
            switch {
                "fuel" => (Func<dynamic, decimal?>) (x => (decimal?) x.TotalFuel),
                "engine_hours" => (x => (decimal?) x.EngHours),
                "distance" => (x => (decimal?) x.TotalDistance),
                _ => (x => (decimal?) null)
            };

            // Distance only when IsKmperhr == 1 (as per metrics service)
            if (metric == "distance") {
                vc = vc.Where (v => v.IsKmperhr == 1);
            }

            if (granularity == "hour") {
                var grouped = await vc
                    .GroupBy (v => new { v.Date.Year, v.Date.Month, v.Date.Day, v.Date.Hour })
                    .Select (g => new { g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Hour, Sum = g.Sum (x => selector (x) ?? 0) })
                    .ToListAsync ();

                var points = grouped
                    .Select (g => new { timestamp = new DateTime (g.Year, g.Month, g.Day, g.Hour, 0, 0, DateTimeKind.Local), value = (decimal) g.Sum })
                    .OrderBy (p => p.timestamp)
                    .ToList ();
                return points;
            } else // day
            {
                var grouped = await vc
                    .GroupBy (v => new { v.Date.Year, v.Date.Month, v.Date.Day })
                    .Select (g => new { g.Key.Year, g.Key.Month, g.Key.Day, Sum = g.Sum (x => selector (x) ?? 0) })
                    .ToListAsync ();

                var points = grouped
                    .Select (g => new { timestamp = new DateTime (g.Year, g.Month, g.Day, 0, 0, 0, DateTimeKind.Local), value = (decimal) g.Sum })
                    .OrderBy (p => p.timestamp)
                    .ToList ();
                return points;
            }
        }

        // ---- helpers
        private (DateTime start, DateTime end) GetDateRange (string datePreset, DateTime? customStart, DateTime? customEnd) {
            if (customStart.HasValue && customEnd.HasValue)
                return (customStart.Value, customEnd.Value);

            var now = DateTime.Now;
            var today = now.Date;
            switch ((datePreset ?? "").ToLower ()) {
                case "today":
                    return (today, today.AddDays (1).AddSeconds (-1));
                case "yesterday":
                    return (today.AddDays (-1), today.AddSeconds (-1));
                case "last_7_days":
                    return (today.AddDays (-7), today.AddDays (1).AddSeconds (-1));
                case "last_30_days":
                    return (today.AddDays (-30), today.AddDays (1).AddSeconds (-1));
                case "this_week":
                    return GetThisWeekRange (today);
                case "last_week":
                    return GetLastWeekRange (today);
                case "this_month":
                    return GetThisMonthRange (today);
                case "last_month":
                    return GetLastMonthRange (today);
                default:
                    return (today, today.AddDays (1).AddSeconds (-1));
            }
        }

        private (DateTime start, DateTime end) GetLastWeekRange (DateTime referenceDate) {
            int daysFromMonday = ((int) referenceDate.DayOfWeek - 1 + 7) % 7;
            var thisWeekMonday = referenceDate.AddDays (-daysFromMonday);
            var lastWeekMonday = thisWeekMonday.AddDays (-7);
            var lastWeekSunday = lastWeekMonday.AddDays (6);
            return (lastWeekMonday, lastWeekSunday.AddDays (1).AddSeconds (-1));
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

        private (DateTime start, DateTime end) GetLastMonthRange (DateTime referenceDate) {
            var firstDayThisMonth = new DateTime (referenceDate.Year, referenceDate.Month, 1);
            var firstDayLastMonth = firstDayThisMonth.AddMonths (-1);
            var lastDayLastMonth = firstDayThisMonth.AddSeconds (-1);
            return (firstDayLastMonth, lastDayLastMonth);
        }

        private string ResolveGranularity (DashboardMetricRequestDto request, string dataSource) {
            // If IntervalHours is set to 1, prefer hourly; otherwise fallback to metadata default
            if (request.IntervalHours.HasValue && request.IntervalHours.Value <= 1)
                return "hour";

            var meta = GetDataSourceMetadata (dataSource ?? request.MetricType);
            return string.Equals (meta.DefaultGranularity, "hour", StringComparison.OrdinalIgnoreCase) ? "hour" : "day";
        }
    }
}