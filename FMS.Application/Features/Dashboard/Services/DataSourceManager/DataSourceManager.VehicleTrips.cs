/**
 * File: DataSourceManager.VehicleTrips.cs
 * Purpose: Provides dashboard data sources for persisted vehicle-trip operations, site occupancy, and cycle metrics.
 * Dependencies: GpsdataContext, VehicleTripGroup, Vehicle, Site, DataSourceMetadata
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - BuildTripInTransitSnapshotAsync(): Produces active in-transit vehicle rows and counts.
 * - BuildVehiclesAtSiteSnapshotAsync(): Produces site occupancy counts derived from persisted trips.
 * - BuildTripCountVsExpectedSnapshotAsync(): Produces actual-vs-baseline trip counts per vehicle.
 * - BuildAverageTripDurationSnapshotAsync(): Produces average trip-duration KPIs and per-vehicle details.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private const string TripManagementCategory = "trip_management";
        private const int BaselinePeriodCount = 4;

        private async Task<object> BuildTripInTransitSnapshotAsync(DashboardMetricRequestDto request)
        {
            var groups = await ApplyTripGroupFilters(
                    _context.VehicleTripGroups
                        .AsNoTracking()
                        .Include(group => group.Vehicle)
                            .ThenInclude(vehicle => vehicle.WorkingSite)
                        .Include(group => group.OriginSite)
                        .Include(group => group.DestinationSite)
                        .Where(group => group.Status == (int)VehicleTripStatus.InProgress),
                    request)
                .OrderByDescending(group => group.StartTimeUtc)
                .ToListAsync();

            var rows = groups
                .Select(group => new
                {
                    vehicleId = group.VehicleId,
                    vehicleName = BuildVehicleDisplayName(group.Vehicle),
                    originSite = group.OriginSite?.Name ?? "Unknown origin",
                    estimatedDestination = group.DestinationSite?.Name ?? group.Vehicle.WorkingSite?.Name ?? "Pending destination",
                    startedAtUtc = group.StartTimeUtc,
                    durationMinutes = Math.Round((decimal)Math.Max(0d, (DateTime.UtcNow - group.StartTimeUtc).TotalMinutes), 2),
                    distanceKm = Math.Round(group.TotalDistanceKm, 2),
                    groupingType = ResolveGroupingTypeLabel(group.GroupingType),
                    status = "In Transit"
                })
                .ToList();

            var categories = rows
                .GroupBy(row => row.originSite)
                .Select(group => (object)new
                {
                    key = group.Key,
                    value = group.Count(),
                    label = group.Key
                })
                .OrderByDescending(item => TryDecimal(item.GetType().GetProperty("value")?.GetValue(item)) ?? 0m)
                .ToList();

            return new
            {
                current = new
                {
                    value = (decimal)rows.Count,
                    unit = "count",
                    timestamp = DateTime.UtcNow,
                    label = "Vehicles In Transit"
                },
                total = rows.Count,
                rows = rows.Take(25).ToList(),
                categories,
                additionalInfo = new
                {
                    activeRoutes = rows
                        .Select(row => $"{row.originSite} → {row.estimatedDestination}")
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .Count()
                },
                metadata = GetDataSourceMetadata(TripInTransitDataSource)
            };
        }

        private async Task<object> BuildVehiclesAtSiteSnapshotAsync(DashboardMetricRequestDto request)
        {
            var vehiclesQuery = _context.Vehicles
                .AsNoTracking()
                .Include(vehicle => vehicle.WorkingSite)
                .AsQueryable();

            if (request.VehicleIds != null && request.VehicleIds.Any())
            {
                vehiclesQuery = vehiclesQuery.Where(vehicle => request.VehicleIds.Contains(vehicle.VehicleId));
            }

            if (request.VehicleType != null && request.VehicleType.Any())
            {
                vehiclesQuery = vehiclesQuery.Where(vehicle => vehicle.VehicleTypeId.HasValue && request.VehicleType.Contains(vehicle.VehicleTypeId.Value));
            }

            var vehicles = await vehiclesQuery.ToListAsync();
            var vehicleIds = vehicles.Select(vehicle => vehicle.VehicleId).ToList();

            var tripGroups = vehicleIds.Count == 0
                ? new List<VehicleTripGroup>()
                : await _context.VehicleTripGroups
                    .AsNoTracking()
                    .Include(group => group.OriginSite)
                    .Include(group => group.DestinationSite)
                    .Where(group => vehicleIds.Contains(group.VehicleId))
                    .OrderByDescending(group => group.EndTimeUtc)
                    .ThenByDescending(group => group.StartTimeUtc)
                    .ToListAsync();

            var latestGroupByVehicle = tripGroups
                .GroupBy(group => group.VehicleId)
                .ToDictionary(group => group.Key, group => group.First());

            var siteAssignments = new List<object>();
            var inTransitVehicles = 0;
            var unassignedVehicles = 0;

            foreach (var vehicle in vehicles)
            {
                latestGroupByVehicle.TryGetValue(vehicle.VehicleId, out var latestGroup);

                if (latestGroup?.Status == (int)VehicleTripStatus.InProgress)
                {
                    inTransitVehicles++;
                    continue;
                }

                var currentSiteId = latestGroup?.DestinationSiteId ?? latestGroup?.OriginSiteId ?? vehicle.WorkingSiteId;
                var currentSiteName = latestGroup?.DestinationSite?.Name
                    ?? latestGroup?.OriginSite?.Name
                    ?? vehicle.WorkingSite?.Name
                    ?? "Unassigned";

                if (!currentSiteId.HasValue)
                {
                    unassignedVehicles++;
                    continue;
                }

                if (request.SiteIds != null && request.SiteIds.Any() && !request.SiteIds.Contains(currentSiteId.Value))
                {
                    continue;
                }

                siteAssignments.Add(new
                {
                    siteId = currentSiteId.Value,
                    siteName = currentSiteName,
                    vehicleId = vehicle.VehicleId,
                    vehicleName = BuildVehicleDisplayName(vehicle)
                });
            }

            var totalAssignedVehicles = siteAssignments.Count;
            var rows = siteAssignments
                .GroupBy(item => new
                {
                    SiteId = (int)item.GetType().GetProperty("siteId")!.GetValue(item)!,
                    SiteName = (string)item.GetType().GetProperty("siteName")!.GetValue(item)!
                })
                .Select(group => new
                {
                    siteId = group.Key.SiteId,
                    siteName = group.Key.SiteName,
                    vehicleCount = group.Count(),
                    progress = totalAssignedVehicles > 0
                        ? Math.Round((decimal)group.Count() / totalAssignedVehicles * 100m, 2)
                        : 0m,
                    vehicles = group
                        .Select(item => item.GetType().GetProperty("vehicleName")?.GetValue(item)?.ToString())
                        .Where(name => !string.IsNullOrWhiteSpace(name))
                        .ToList()
                })
                .OrderByDescending(item => item.vehicleCount)
                .ThenBy(item => item.siteName)
                .ToList();

            return new
            {
                current = new
                {
                    value = (decimal)totalAssignedVehicles,
                    unit = "count",
                    timestamp = DateTime.UtcNow,
                    label = "Vehicles Assigned To Sites"
                },
                total = totalAssignedVehicles,
                rows,
                categories = rows.Select(item => (object)new
                {
                    key = item.siteName,
                    value = item.vehicleCount,
                    percent = item.progress
                }).ToList(),
                additionalInfo = new
                {
                    inTransitVehicles,
                    unassignedVehicles,
                    sitesCovered = rows.Count
                },
                metadata = GetDataSourceMetadata(VehiclesAtSiteDataSource)
            };
        }

        private async Task<object> BuildTripCountVsExpectedSnapshotAsync(DashboardMetricRequestDto request)
        {
            var (startDate, endDate) = ResolveDashboardDateRange(request);
            var periodLengthDays = Math.Max(1, (endDate.Date - startDate.Date).Days + 1);
            var baselineStartDate = startDate.AddDays(-(periodLengthDays * BaselinePeriodCount));
            var baselineEndDate = startDate.AddDays(-1);

            var currentCounts = await BuildTripGroupQuery(request, startDate, endDate)
                .GroupBy(group => group.VehicleId)
                .Select(group => new
                {
                    VehicleId = group.Key,
                    TripCount = group.Sum(item => item.TripCount)
                })
                .ToListAsync();

            var baselineCounts = await BuildTripGroupQuery(request, baselineStartDate, baselineEndDate)
                .GroupBy(group => group.VehicleId)
                .Select(group => new
                {
                    VehicleId = group.Key,
                    TripCount = group.Sum(item => item.TripCount)
                })
                .ToListAsync();

            var vehicleIds = currentCounts
                .Select(item => item.VehicleId)
                .Concat(baselineCounts.Select(item => item.VehicleId))
                .Distinct()
                .ToList();

            var vehicleLookup = vehicleIds.Count == 0
                ? new Dictionary<int, string>()
                : await _context.Vehicles
                    .AsNoTracking()
                    .Where(vehicle => vehicleIds.Contains(vehicle.VehicleId))
                    .ToDictionaryAsync(
                        vehicle => vehicle.VehicleId,
                        vehicle => BuildVehicleDisplayName(vehicle.HyoungNo, vehicle.NumberPlate, vehicle.VehicleId));

            var currentLookup = currentCounts.ToDictionary(item => item.VehicleId, item => item.TripCount);
            var baselineLookup = baselineCounts.ToDictionary(item => item.VehicleId, item => item.TripCount);

            var rows = vehicleIds
                .Select(vehicleId =>
                {
                    currentLookup.TryGetValue(vehicleId, out var actualTrips);
                    baselineLookup.TryGetValue(vehicleId, out var baselineTrips);
                    var expectedTrips = Math.Round((decimal)baselineTrips / BaselinePeriodCount, 2);
                    var variance = actualTrips - expectedTrips;
                    var progress = expectedTrips > 0m
                        ? Math.Round((decimal)actualTrips / expectedTrips * 100m, 2)
                        : actualTrips > 0 ? 100m : 0m;

                    return new
                    {
                        vehicleId,
                        vehicleName = vehicleLookup.TryGetValue(vehicleId, out var name) ? name : $"Vehicle {vehicleId}",
                        actualTrips,
                        expectedTrips,
                        variance,
                        progress
                    };
                })
                .OrderByDescending(item => item.actualTrips)
                .ThenBy(item => item.vehicleName)
                .ToList();

            var totalActual = rows.Sum(item => item.actualTrips);
            var totalExpected = rows.Sum(item => item.expectedTrips);

            return new
            {
                current = new
                {
                    value = (decimal)totalActual,
                    unit = "trips",
                    timestamp = DateTime.UtcNow,
                    label = "Trip Count"
                },
                change = BuildChangePayload((decimal)totalActual, totalExpected),
                total = totalActual,
                rows,
                categories = rows.Select(item => (object)new
                {
                    key = item.vehicleName,
                    value = item.actualTrips,
                    target = item.expectedTrips,
                    percent = item.progress
                }).ToList(),
                additionalInfo = new
                {
                    expectedTrips = totalExpected,
                    vehiclesTracked = rows.Count
                },
                metadata = GetDataSourceMetadata(TripCountVsExpectedDataSource)
            };
        }

        private async Task<object> BuildTipperCycleSnapshotAsync(DashboardMetricRequestDto request)
        {
            var (startDate, endDate) = ResolveDashboardDateRange(request);
            var previousStartDate = startDate.AddDays(-((endDate.Date - startDate.Date).Days + 1));
            var previousEndDate = startDate.AddDays(-1);

            var currentCycles = await BuildTripGroupQuery(request, startDate, endDate)
                .Where(group => group.GroupingType == (int)VehicleTripGroupingType.LoadCycle)
                .GroupBy(group => group.VehicleId)
                .Select(group => new
                {
                    VehicleId = group.Key,
                    CycleCount = group.Count()
                })
                .ToListAsync();

            var previousCycleCount = await BuildTripGroupQuery(request, previousStartDate, previousEndDate)
                .Where(group => group.GroupingType == (int)VehicleTripGroupingType.LoadCycle)
                .CountAsync();

            var vehicleIds = currentCycles.Select(item => item.VehicleId).Distinct().ToList();
            var vehicleLookup = vehicleIds.Count == 0
                ? new Dictionary<int, string>()
                : await _context.Vehicles
                    .AsNoTracking()
                    .Where(vehicle => vehicleIds.Contains(vehicle.VehicleId))
                    .ToDictionaryAsync(
                        vehicle => vehicle.VehicleId,
                        vehicle => BuildVehicleDisplayName(vehicle.HyoungNo, vehicle.NumberPlate, vehicle.VehicleId));

            var rows = currentCycles
                .Select(item => new
                {
                    vehicleId = item.VehicleId,
                    vehicleName = vehicleLookup.TryGetValue(item.VehicleId, out var name) ? name : $"Vehicle {item.VehicleId}",
                    cycleCount = item.CycleCount,
                    progress = item.CycleCount > 0 ? 100m : 0m
                })
                .OrderByDescending(item => item.cycleCount)
                .ThenBy(item => item.vehicleName)
                .ToList();

            var totalCycles = rows.Sum(item => item.cycleCount);

            return new
            {
                current = new
                {
                    value = (decimal)totalCycles,
                    unit = "cycles",
                    timestamp = DateTime.UtcNow,
                    label = "Tipper Load Cycles"
                },
                change = BuildChangePayload((decimal)totalCycles, previousCycleCount),
                total = totalCycles,
                rows,
                categories = rows.Select(item => (object)new
                {
                    key = item.vehicleName,
                    value = item.cycleCount,
                    percent = item.progress
                }).ToList(),
                additionalInfo = new
                {
                    activeVehicles = rows.Count(item => item.cycleCount > 0)
                },
                metadata = GetDataSourceMetadata(TipperCycleCountDataSource)
            };
        }

        private IQueryable<VehicleTripGroup> BuildTripGroupQuery(
            DashboardMetricRequestDto request,
            DateTime startDate,
            DateTime endDate)
        {
            var query = _context.VehicleTripGroups
                .AsNoTracking()
                .Where(group => group.TripDate >= startDate.Date && group.TripDate <= endDate.Date);

            return ApplyTripGroupFilters(query, request);
        }

        private IQueryable<VehicleTripGroup> ApplyTripGroupFilters(
            IQueryable<VehicleTripGroup> query,
            DashboardMetricRequestDto request)
        {
            if (request.VehicleIds != null && request.VehicleIds.Any())
            {
                query = query.Where(group => request.VehicleIds.Contains(group.VehicleId));
            }

            if (request.SiteIds != null && request.SiteIds.Any())
            {
                query = query.Where(group =>
                    (group.OriginSiteId.HasValue && request.SiteIds.Contains(group.OriginSiteId.Value)) ||
                    (group.DestinationSiteId.HasValue && request.SiteIds.Contains(group.DestinationSiteId.Value)) ||
                    (group.Vehicle.WorkingSiteId.HasValue && request.SiteIds.Contains(group.Vehicle.WorkingSiteId.Value)));
            }

            if (request.VehicleType != null && request.VehicleType.Any())
            {
                query = query.Where(group => group.Vehicle.VehicleTypeId.HasValue && request.VehicleType.Contains(group.Vehicle.VehicleTypeId.Value));
            }

            return query;
        }

        private static string ResolveGroupingTypeLabel(int groupingType)
        {
            return groupingType switch
            {
                (int)VehicleTripGroupingType.LoadCycle => "Load Cycle",
                (int)VehicleTripGroupingType.RoundTrip => "Round Trip",
                _ => "Single Leg"
            };
        }

        private static string BuildVehicleDisplayName(Vehicle vehicle)
        {
            return BuildVehicleDisplayName(vehicle.HyoungNo, vehicle.NumberPlate, vehicle.VehicleId);
        }

        private static string BuildVehicleDisplayName(string? hyoungNo, string? numberPlate, int vehicleId)
        {
            if (!string.IsNullOrWhiteSpace(hyoungNo) && !string.IsNullOrWhiteSpace(numberPlate))
            {
                return $"{hyoungNo} ({numberPlate})";
            }

            if (!string.IsNullOrWhiteSpace(hyoungNo))
            {
                return hyoungNo;
            }

            if (!string.IsNullOrWhiteSpace(numberPlate))
            {
                return numberPlate;
            }

            return $"Vehicle {vehicleId}";
        }

    }
}
