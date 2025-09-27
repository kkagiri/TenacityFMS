using System;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Services.Dashboard {
    // Partial: Metric computation helpers (implemented locally; no delegation)
    public partial class DataSourceManager {
        private async Task<DashboardMetricResponseDto> ComputeMetricAsync (DashboardMetricRequestDto request) {
            try {
                switch ((request.MetricType ?? string.Empty).ToLower ()) {
                    case "fuel_dispensed":
                    case "fuel_dispense":
                    case "fuel_dispensed_total":
                        return await ComputeFuelDispensedAsync (request);

                    case "fuel_used_gps":
                        return await ComputeFuelUsedGpsAsync (request);

                    case "engine_hours":
                    case "engine_hours_gps":
                        return await ComputeEngineHoursAsync (request);

                    case "km_travel":
                    case "distance_travel":
                    case "distance_travel_gps":
                        return await ComputeDistanceTravelledAsync (request);

                    default:
                        return new DashboardMetricResponseDto {
                            ErrorMessage = $"Unsupported metric type: {request.MetricType}",
                                LastUpdated = DateTime.UtcNow
                        };
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error computing metric {MetricType}", request.MetricType);
                return new DashboardMetricResponseDto {
                    ErrorMessage = "Internal server error occurred while fetching metric data",
                        LastUpdated = DateTime.UtcNow
                };
            }
        }

        private object CalculateChange (DashboardMetricResponseDto response) {
            try {
                // Compare with previous equivalent period based on DateRange when possible
                // If DateRange is not a parseable range, return stable 0
                var range = ParseDateRange (response.DateRange);
                if (range == null) return new { value = 0, percentage = 0, direction = "stable" };

                var (start, end) = range.Value;
                var prevDuration = end - start;
                var prevStart = start - prevDuration;
                var prevEnd = start - TimeSpan.FromSeconds (1);

                var previousRequest = new DashboardMetricRequestDto {
                    MetricType = response.MetricType,
                    Mode = string.Equals (response.Mode, "live", StringComparison.OrdinalIgnoreCase) ? "historical_snapshot" : response.Mode,
                    DatePreset = "custom",
                    StartDate = prevStart,
                    EndDate = prevEnd
                };

                var prev = ComputeMetricAsync (previousRequest).GetAwaiter ().GetResult ();
                var prevValue = prev?.Value ?? 0m;
                var curValue = response.Value;
                var delta = curValue - prevValue;
                var pct = prevValue == 0 ? (curValue == 0 ? 0 : 100) : Math.Round ((delta / prevValue) * 100m, 2);
                var dir = delta == 0 ? "stable" : (delta > 0 ? "up" : "down");
                return new { value = delta, percentage = pct, direction = dir };
            } catch {
                return new { value = 0, percentage = 0, direction = "stable" };
            }
        }

        private (DateTime start, DateTime end) ? ParseDateRange (string dateRange) {
            if (string.IsNullOrWhiteSpace (dateRange)) return null;
            // Expect formats like "yyyy-MM-dd to yyyy-MM-dd" or similar; try to split by 'to'
            var parts = dateRange.Split (new [] { " to ", "-", "–" }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 2) {
                if (DateTime.TryParse (parts[0].Trim (), out var s) && DateTime.TryParse (parts[1].Trim (), out var e)) {
                    return (s, e);
                }
            }
            return null;
        }

        // ---- concrete metric calculators
        private async Task<DashboardMetricResponseDto> ComputeFuelDispensedAsync (DashboardMetricRequestDto request) {
            var (startDate, endDate) = GetDateRange (request.DatePreset, request.StartDate, request.EndDate);
            var isLiveMode = string.Equals (request.Mode, "live", StringComparison.OrdinalIgnoreCase);

            if (isLiveMode && string.Equals (request.DatePreset, "today", StringComparison.OrdinalIgnoreCase)) {
                endDate = DateTime.Now;
            }

            var query = _context.TankVolumeHistories
                .Where (tvh => tvh.Timestamp >= startDate && tvh.Timestamp <= endDate)
                .Where (tvh => tvh.ChangeReason == VolumeChangeReasonEnum.Dispensing || tvh.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing);

            if (request.SiteIds != null && request.SiteIds.Any ()) {
                var tankIds = await _context.Tanks
                    .Where (t => request.SiteIds.Contains (t.SiteId))
                    .Select (t => t.Id)
                    .ToListAsync ();
                query = query.Where (tvh => tvh.TankId.HasValue && tankIds.Contains (tvh.TankId.Value));
            }

            var totalDispensed = await query.SumAsync (tvh => Math.Abs (tvh.VolumeChange ?? 0));
            var affectedSitesCount = await GetAffectedSitesCount (query);

            return new DashboardMetricResponseDto {
                Value = (decimal) totalDispensed,
                    Unit = "liters",
                    LastUpdated = DateTime.UtcNow,
                    MetricType = request.MetricType,
                    Mode = request.Mode,
                    DateRange = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
                    AffectedSitesCount = affectedSitesCount,
                    IsLiveData = isLiveMode
            };
        }

        private async Task<DashboardMetricResponseDto> ComputeFuelUsedGpsAsync (DashboardMetricRequestDto request) {
            var (startDate, endDate) = GetDateRange (request.DatePreset, request.StartDate, request.EndDate);
            var isLiveMode = string.Equals (request.Mode, "live", StringComparison.OrdinalIgnoreCase);

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

            if (request.SiteIds != null && request.SiteIds.Any ()) {
                query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
            }

            var totalFuelUsed = await query.SumAsync (vc => vc.TotalFuel ?? 0);
            var affectedSitesCount = await query.Select (vc => vc.SiteId).Distinct ().CountAsync ();
            var affectedVehiclesCount = await query.Select (vc => vc.VehicleId).Distinct ().CountAsync ();

            return new DashboardMetricResponseDto {
                Value = (decimal) totalFuelUsed,
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

        private async Task<DashboardMetricResponseDto> ComputeEngineHoursAsync (DashboardMetricRequestDto request) {
            var (startDate, endDate) = GetDateRange (request.DatePreset, request.StartDate, request.EndDate);
            var isLiveMode = string.Equals (request.Mode, "live", StringComparison.OrdinalIgnoreCase);

            if (isLiveMode) {
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

            if (request.SiteIds != null && request.SiteIds.Any ()) {
                query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
            }

            var totalEngineHours = await query.SumAsync (vc => vc.EngHours ?? 0);
            var affectedSitesCount = await query.Select (vc => vc.SiteId).Distinct ().CountAsync ();
            var affectedVehiclesCount = await query.Select (vc => vc.VehicleId).Distinct ().CountAsync ();

            return new DashboardMetricResponseDto {
                Value = (decimal) totalEngineHours,
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

        private async Task<DashboardMetricResponseDto> ComputeDistanceTravelledAsync (DashboardMetricRequestDto request) {
            var (startDate, endDate) = GetDateRange (request.DatePreset, request.StartDate, request.EndDate);
            var isLiveMode = string.Equals (request.Mode, "live", StringComparison.OrdinalIgnoreCase);

            var query = _context.Vehicleconsumptions
                .Where (vc => vc.Date >= startDate && vc.Date <= endDate)
                .Where (vc => vc.TotalDistance.HasValue)
                .Where (vc => vc.IsKmperhr == 1);

            if (request.SiteIds != null && request.SiteIds.Any ()) {
                query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
            }

            var totalDistance = await query.SumAsync (vc => vc.TotalDistance ?? 0);
            var affectedSitesCount = await query.Select (vc => vc.SiteId).Distinct ().CountAsync ();
            var affectedVehiclesCount = await query.Select (vc => vc.VehicleId).Distinct ().CountAsync ();

            return new DashboardMetricResponseDto {
                Value = (decimal) totalDistance,
                    Unit = "km",
                    LastUpdated = DateTime.UtcNow,
                    MetricType = request.MetricType,
                    Mode = request.Mode,
                    DateRange = isLiveMode ?
                    $"Live Data (Historical Fallback) - {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}" :
                    $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
                    AffectedSitesCount = affectedSitesCount,
                    AffectedVehiclesCount = affectedVehiclesCount,
                    IsLiveData = isLiveMode
            };
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