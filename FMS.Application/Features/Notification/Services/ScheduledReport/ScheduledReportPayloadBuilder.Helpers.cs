/**
 * File: ScheduledReportPayloadBuilder.Helpers.cs
 * Purpose: Houses static helper methods used by ScheduledReportPayloadBuilder for
 *          payload shaping, report envelope creation, formatting, and source inference.
 * Dependencies: Vehicle trip DTOs, Newtonsoft.Json tokens, domain enums
 * Last Modified: 2026-04-16
 *
 * Key Functions:
 * - BuildPayload(): Creates the shared scheduled-report envelope
 * - BuildLiveTripOperationsPayload(): Shapes live-trip DTOs into template-ready objects
 * - ResolveSourceId helpers: Infer supported report source IDs from metadata
 */
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using FMS.Application.Features.FMS.Consumption;
using FMS.Domain.Entities;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Features.Notification.Services
{
    public partial class ScheduledReportPayloadBuilder
    {
        private static object BuildPayload(
            string reportTitle,
            DateTime startLocal,
            DateTime endLocal,
            object records,
            object summary)
        {
            return new
            {
                reportTitle,
                generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                generatedBy = "System (Scheduled)",
                reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                dateFrom = startLocal.ToString("yyyy-MM-dd"),
                dateTo = endLocal.ToString("yyyy-MM-dd"),
                startDate = startLocal.ToString("yyyy-MM-dd"),
                endDate = endLocal.ToString("yyyy-MM-dd"),
                records,
                data = records,
                items = records,
                transactions = records,
                summary,
            };
        }

        private static object BuildConsumptionPayload(
            string reportTitle,
            DateTime startLocal,
            DateTime endLocal,
            object records,
            object summary,
            string distanceHeader,
            string consumptionHeader,
            string distanceSummaryLabel,
            string avgConsumptionLabel,
            string consumptionModeLabel,
            bool includeDriverColumn,
            bool includePassengerColumn,
            object? siteGroups = null)
        {
            return new
            {
                reportTitle,
                generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                generatedBy = "System (Scheduled)",
                reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                dateFrom = startLocal.ToString("yyyy-MM-dd"),
                dateTo = endLocal.ToString("yyyy-MM-dd"),
                startDate = startLocal.ToString("yyyy-MM-dd"),
                endDate = endLocal.ToString("yyyy-MM-dd"),
                distanceHeader,
                consumptionHeader,
                distanceSummaryLabel,
                avgConsumptionLabel,
                consumptionModeLabel,
                includeDriverColumn,
                includePassengerColumn,
                siteGroups,
                records,
                data = records,
                items = records,
                transactions = records,
                summary,
            };
        }

        private static object BuildVehicleConsumptionUnitGroup(IEnumerable<object> rows, bool isKmL)
        {
            var rowList = rows.Cast<dynamic>().ToList();
            var totalVolume = rowList.Sum(row => (decimal)row.volumeRaw);
            var totalDistance = rowList.Sum(row => (decimal)row.distanceRaw);
            var totalCost = rowList.Sum(row => (decimal)row.costRaw);
            var avgConsumption = rowList.Count > 0 ? rowList.Average(row => (decimal)row.consumptionRaw) : 0m;
            var (distanceHeader, consumptionHeader, distanceSummaryLabel, avgConsumptionLabel, consumptionModeLabel, distanceUnit, consumptionUnit) =
                BuildConsumptionLabels(isKmL, new[] { isKmL });

            return new
            {
                unitKey = isKmL ? "km" : "hr",
                unitLabel = consumptionModeLabel,
                distanceHeader,
                consumptionHeader,
                distanceSummaryLabel,
                avgConsumptionLabel,
                distanceUnit,
                consumptionUnit,
                records = rowList.Select((row, index) => new
                {
                    rowNumber = index + 1,
                    row.vehicleName,
                    row.numberPlate,
                    row.vehicleType,
                    row.siteName,
                    row.refillCount,
                    row.volume,
                    row.totalVolume,
                    row.distance,
                    row.totalDistance,
                    row.distanceDisplay,
                    row.consumption,
                    row.consumptionDisplay,
                    row.expectedAverage,
                    row.expectedAverageDisplay,
                    row.distanceUnit,
                    row.consumptionUnit,
                    row.isKmL,
                    row.cost,
                }).ToList(),
                summary = new
                {
                    totalVehicles = rowList.Count,
                    totalVolume = Fmt(totalVolume),
                    totalDistance = Fmt(totalDistance),
                    totalDistanceDisplay = $"{Fmt(totalDistance)} {distanceUnit}",
                    totalCost = Fmt(totalCost),
                    avgConsumption = Fmt(avgConsumption),
                    avgConsumptionDisplay = $"{Fmt(avgConsumption)} {consumptionUnit}",
                }
            };
        }

        private static object BuildVehicleConsumptionSiteGroups(IEnumerable<object> mappedRows)
        {
            return mappedRows
                .Cast<dynamic>()
                .GroupBy(row => (string?)row.siteName ?? "-")
                .OrderBy(group => group.Key)
                .Select(group =>
                {
                    var siteRows = group.ToList();
                    var unitGroups = new List<object>();
                    var kmRows = siteRows.Where(row => (bool)row.isKmL).Cast<object>().ToList();
                    var hrRows = siteRows.Where(row => !(bool)row.isKmL).Cast<object>().ToList();

                    if (kmRows.Count > 0)
                    {
                        unitGroups.Add(BuildVehicleConsumptionUnitGroup(kmRows, true));
                    }

                    if (hrRows.Count > 0)
                    {
                        unitGroups.Add(BuildVehicleConsumptionUnitGroup(hrRows, false));
                    }

                    return new
                    {
                        siteName = group.Key,
                        summary = new
                        {
                            totalVehicles = siteRows.Count,
                            totalVolume = Fmt(siteRows.Sum(row => (decimal)row.volumeRaw)),
                            totalCost = Fmt(siteRows.Sum(row => (decimal)row.costRaw)),
                        },
                        unitGroups,
                    };
                })
                .ToList();
        }

        private static object BuildEmptyPayload(
            string reportTitle,
            DateTime startLocal,
            DateTime endLocal,
            string fallbackTitle)
        {
            var title = string.IsNullOrWhiteSpace(reportTitle) ? fallbackTitle : reportTitle;
            return BuildPayload(
                title,
                startLocal,
                endLocal,
                Array.Empty<object>(),
                new { totalRecords = 0 });
        }

        private static int? GetIntParam(JObject metadata, string key)
        {
            if (!metadata.TryGetValue(key, StringComparison.OrdinalIgnoreCase, out var token) || token == null)
            {
                return null;
            }

            return ExtractPositiveInt(token);
        }

        private static int? ExtractPositiveInt(JToken token)
        {
            switch (token.Type)
            {
                case JTokenType.Integer:
                    {
                        var value = token.Value<int>();
                        return value > 0 ? value : null;
                    }

                case JTokenType.Float:
                    {
                        var value = Convert.ToInt32(token.Value<double>());
                        return value > 0 ? value : null;
                    }

                case JTokenType.String:
                    {
                        var raw = token.ToString().Trim();
                        return int.TryParse(raw, out var parsed) && parsed > 0 ? parsed : null;
                    }

                case JTokenType.Array:
                    return token.Children()
                        .Select(ExtractPositiveInt)
                        .FirstOrDefault(value => value.HasValue);

                case JTokenType.Object:
                    {
                        var objectToken = (JObject)token;
                        foreach (var propertyName in new[] { "id", "value", "key" })
                        {
                            if (objectToken.TryGetValue(propertyName, StringComparison.OrdinalIgnoreCase, out var nestedToken)
                                && nestedToken != null)
                            {
                                var nestedValue = ExtractPositiveInt(nestedToken);
                                if (nestedValue.HasValue)
                                {
                                    return nestedValue;
                                }
                            }
                        }

                        return objectToken.Properties()
                            .Select(property => ExtractPositiveInt(property.Value))
                            .FirstOrDefault(value => value.HasValue);
                    }

                default:
                    {
                        var raw = token.ToString().Trim();
                        return int.TryParse(raw, out var parsed) && parsed > 0 ? parsed : null;
                    }
            }
        }

        private static bool? GetBoolParam(JObject metadata, string key)
        {
            if (!metadata.TryGetValue(key, StringComparison.OrdinalIgnoreCase, out var token) || token == null)
            {
                return null;
            }

            if (token.Type == JTokenType.Boolean)
            {
                return token.Value<bool>();
            }

            if (bool.TryParse(token.ToString(), out var parsed))
            {
                return parsed;
            }

            if (int.TryParse(token.ToString(), out var numeric))
            {
                return numeric != 0;
            }

            return null;
        }

        private static string? GetStringParam(JObject metadata, string key)
        {
            if (!metadata.TryGetValue(key, StringComparison.OrdinalIgnoreCase, out var token) || token == null)
            {
                return null;
            }

            var value = token.ToString().Trim();
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }

        private static List<ManualDispenseConsumptionDTO> SortVehicleConsumptionRecords(
            IEnumerable<ManualDispenseConsumptionDTO> records,
            string? sortBy,
            string? sortDirection)
        {
            var normalizedSortBy = (sortBy ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(normalizedSortBy))
            {
                return records.ToList();
            }

            var descending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
            Func<ManualDispenseConsumptionDTO, object> keySelector = normalizedSortBy switch
            {
                "vehiclename" => record => record.VehicleCode ?? record.VehicleInfo ?? string.Empty,
                "numberplate" => record => record.VehicleCode ?? string.Empty,
                "sitename" => record => record.WorkingSiteName ?? string.Empty,
                "drivername" => record => record.DriverName ?? string.Empty,
                "passenger" => record => record.Passenger ?? string.Empty,
                "refillcount" => record => record.RefillCount,
                "volumeraw" or "totalvolume" => record => record.TotalFuelAmount,
                "distanceraw" or "totaldistance" => record => record.DistanceOrEngineHours,
                "consumptionraw" or "consumption" => record => record.Consumption,
                _ => record => record.VehicleCode ?? record.VehicleInfo ?? string.Empty,
            };

            var ordered = descending
                ? records.OrderByDescending(keySelector)
                : records.OrderBy(keySelector);

            return ordered
                .ThenBy(record => record.VehicleCode ?? record.VehicleInfo ?? string.Empty)
                .ToList();
        }

        private static (string DistanceHeader, string ConsumptionHeader, string DistanceSummaryLabel, string AvgConsumptionLabel, string ConsumptionModeLabel, string DistanceUnit, string ConsumptionUnit)
            BuildConsumptionLabels(bool? requestedAverageKmL, IEnumerable<bool>? rowModes)
        {
            var resolvedMode = requestedAverageKmL switch
            {
                true => "km",
                false => "hr",
                null => ResolveConsumptionMode(rowModes),
            };

            return resolvedMode switch
            {
                "km" => (
                    "Distance (km)",
                    "km/L",
                    "Total Distance",
                    "Avg km/L",
                    "KM/L Vehicles",
                    "km",
                    "km/L"),
                "hr" => (
                    "Engine Hours (hr)",
                    "L/hr",
                    "Total Engine Hours",
                    "Avg L/hr",
                    "L/hr Equipment",
                    "hr",
                    "L/hr"),
                _ => (
                    "Distance / Engine Hours",
                    "Consumption",
                    "Total Distance / Engine Hours",
                    "Avg Consumption",
                    "All Vehicles",
                    string.Empty,
                    string.Empty),
            };
        }

        private static string ResolveConsumptionMode(IEnumerable<bool>? rowModes)
        {
            if (rowModes == null)
            {
                return "mixed";
            }

            var modes = rowModes.ToList();
            if (modes.Count == 0)
            {
                return "mixed";
            }

            if (modes.All(mode => mode))
            {
                return "km";
            }

            if (modes.All(mode => !mode))
            {
                return "hr";
            }

            return "mixed";
        }

        private static List<int> ParseIntList(JToken? token)
        {
            if (token == null)
            {
                return new List<int>();
            }

            if (token is JArray arr)
            {
                return arr
                    .Select(value => int.TryParse(value?.ToString(), out var parsed) && parsed > 0 ? parsed : 0)
                    .Where(value => value > 0)
                    .ToList();
            }

            var raw = token.ToString();
            return raw.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(value => int.TryParse(value.Trim(), out var parsed) && parsed > 0 ? parsed : 0)
                .Where(value => value > 0)
                .ToList();
        }

        private static string Fmt(decimal? value)
        {
            return value?.ToString("#,##0.00", CultureInfo.InvariantCulture) ?? "0.00";
        }

        private static string FormatDate(DateTime? value)
        {
            return value?.ToString("yyyy-MM-dd") ?? "-";
        }

        private static string FormatDateTime(DateTime? value)
        {
            return value?.ToString("yyyy-MM-dd HH:mm:ss") ?? "-";
        }

        private static string FormatDuration(int totalSeconds)
        {
            var seconds = Math.Max(0, totalSeconds);
            var hours = seconds / 3600;
            var minutes = (seconds % 3600) / 60;
            var secs = seconds % 60;

            if (hours > 0)
            {
                return $"{hours}h {minutes}m {secs}s";
            }

            if (minutes > 0)
            {
                return $"{minutes}m {secs}s";
            }

            return $"{secs}s";
        }

        private static string? InferSourceIdFromTemplate(string templateName)
        {
            var name = templateName.Trim().ToLowerInvariant();
            if (name.EndsWith("-report"))
            {
                var candidate = name[..^7];
                if (_supportedSourceIds.Contains(candidate))
                {
                    return candidate;
                }
            }

            return name switch
            {
                "fuel-refill-report" => "fuel-refill",
                "vehicle-consumption-report" => "vehicle-consumption",
                "consumption-by-refills-report" => "consumption-by-refills",
                "fuel-delivery-report" => "delivery",
                "pump-transaction-report" => "pump-transaction",
                "device-offline-report" => "device-offline",
                "pts-device-status-report" => "pts-device",
                "issue-tracker-report" => "issue-tracker",
                "live-trip-operations-report" => "live-trip-operations",
                "alarm-report" => "alarm-report",
                _ => null,
            };
        }

        private static string? InferSourceIdFromReportType(string reportType)
        {
            return reportType.Trim().ToLowerInvariant() switch
            {
                "fuelrefill" or "fuel-refill" => "fuel-refill",
                "vehicleconsumption" or "vehicle-consumption" => "vehicle-consumption",
                "consumptionbyrefill" or "consumptionbyrefills" or "consumption-by-refills" => "consumption-by-refills",
                "delivery" or "fueldelivery" or "fuel-delivery" => "delivery",
                "pumptransaction" or "pump-transaction" => "pump-transaction",
                "ptsdeviceoffline" or "deviceoffline" or "device-offline" => "device-offline",
                "ptsdevice" or "ptsdevicestatus" or "pts-device" => "pts-device",
                "issuetracker" or "issue-tracker" => "issue-tracker",
                "livetripoperations" or "live-trip-operations" => "live-trip-operations",
                "tankleveldetail" or "tank-level-detail" => "tank-level-detail",
                "storagereceivedvsdispensed" or "storage-received-vs-dispensed" => "storage-received-vs-dispensed",
                "alarmreport" or "alarm-report" => "alarm-report",
                _ => null,
            };
        }

        private static string FormatMovementProfile(VehicleMovementProfile movementProfile)
        {
            return movementProfile switch
            {
                VehicleMovementProfile.Cluster => "Cluster",
                VehicleMovementProfile.Geofence => "Geofence",
                _ => movementProfile.ToString(),
            };
        }

    }
}
