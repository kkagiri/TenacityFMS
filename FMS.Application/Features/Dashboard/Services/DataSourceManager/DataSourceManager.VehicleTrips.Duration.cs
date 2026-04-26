/**
 * File: DataSourceManager.VehicleTrips.Duration.cs
 * Purpose: Provides average trip-duration snapshot and trend builders for trip-management dashboard widgets.
 * Dependencies: GpsdataContext, VehicleTripGroup, DataSourceMetadata
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - BuildAverageTripDurationSnapshotAsync(): Produces average-duration KPIs and per-vehicle rankings.
 * - BuildAverageTripDurationAggregatedAsync(): Produces day-level duration trends for charts.
 * - BuildAverageTripDurationSeriesAsync(): Produces normalized daily duration series.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private async Task<object> BuildAverageTripDurationSnapshotAsync(DashboardMetricRequestDto request)
        {
            var (startDate, endDate) = ResolveDashboardDateRange(request);
            var previousStartDate = startDate.AddDays(-((endDate.Date - startDate.Date).Days + 1));
            var previousEndDate = startDate.AddDays(-1);

            var currentSummary = await BuildTripGroupQuery(request, startDate, endDate)
                .GroupBy(_ => 1)
                .Select(group => new
                {
                    TotalDurationMinutes = group.Sum(item => item.TotalDurationMinutes),
                    TotalTrips = group.Sum(item => item.TripCount)
                })
                .FirstOrDefaultAsync();

            var previousSummary = await BuildTripGroupQuery(request, previousStartDate, previousEndDate)
                .GroupBy(_ => 1)
                .Select(group => new
                {
                    TotalDurationMinutes = group.Sum(item => item.TotalDurationMinutes),
                    TotalTrips = group.Sum(item => item.TripCount)
                })
                .FirstOrDefaultAsync();

            var vehicleAverages = await BuildTripGroupQuery(request, startDate, endDate)
                .GroupBy(group => group.VehicleId)
                .Select(group => new
                {
                    VehicleId = group.Key,
                    TotalDurationMinutes = group.Sum(item => item.TotalDurationMinutes),
                    TotalTrips = group.Sum(item => item.TripCount)
                })
                .ToListAsync();

            var vehicleIds = vehicleAverages.Select(item => item.VehicleId).Distinct().ToList();
            var vehicleLookup = vehicleIds.Count == 0
                ? new Dictionary<int, string>()
                : await _context.Vehicles
                    .AsNoTracking()
                    .Where(vehicle => vehicleIds.Contains(vehicle.VehicleId))
                    .ToDictionaryAsync(
                        vehicle => vehicle.VehicleId,
                        vehicle => BuildVehicleDisplayName(vehicle.VehicleCode, vehicle.NumberPlate, vehicle.VehicleId));

            var rows = vehicleAverages
                .Select(item =>
                {
                    var averageDuration = item.TotalTrips > 0
                        ? Math.Round(item.TotalDurationMinutes / item.TotalTrips, 2)
                        : 0m;

                    return new
                    {
                        vehicleId = item.VehicleId,
                        vehicleName = vehicleLookup.TryGetValue(item.VehicleId, out var name) ? name : $"Vehicle {item.VehicleId}",
                        averageDurationMinutes = averageDuration,
                        tripCount = item.TotalTrips
                    };
                })
                .OrderByDescending(item => item.averageDurationMinutes)
                .ThenBy(item => item.vehicleName)
                .ToList();

            var currentAverage = currentSummary != null && currentSummary.TotalTrips > 0
                ? Math.Round(currentSummary.TotalDurationMinutes / currentSummary.TotalTrips, 2)
                : 0m;
            var previousAverage = previousSummary != null && previousSummary.TotalTrips > 0
                ? Math.Round(previousSummary.TotalDurationMinutes / previousSummary.TotalTrips, 2)
                : 0m;
            var timeSeries = await BuildAverageTripDurationSeriesAsync(BuildTripGroupQuery(request, startDate, endDate));

            return new
            {
                current = new
                {
                    value = currentAverage,
                    unit = "minutes",
                    timestamp = DateTime.UtcNow,
                    label = "Average Trip Duration"
                },
                change = BuildChangePayload(currentAverage, previousAverage),
                total = currentAverage,
                timeSeries,
                rows,
                additionalInfo = new
                {
                    tripCount = currentSummary?.TotalTrips ?? 0
                },
                metadata = GetDataSourceMetadata(AverageTripDurationDataSource)
            };
        }

        private async Task<object> BuildAverageTripDurationAggregatedAsync(
            DashboardMetricRequestDto request,
            string aggregationInterval)
        {
            var (startDate, endDate) = ResolveDashboardDateRange(request);
            var dataPoints = await BuildAverageTripDurationSeriesAsync(BuildTripGroupQuery(request, startDate, endDate));
            var values = dataPoints
                .Select(point => TryDecimal(point.GetType().GetProperty("value")?.GetValue(point)) ?? 0m)
                .ToList();

            var total = values.Sum();
            var count = values.Count;

            return new
            {
                aggregationType = aggregationInterval,
                granularity = "day",
                dataPoints,
                summary = new
                {
                    total = Math.Round(total, 2),
                    average = count > 0 ? Math.Round(total / count, 2) : 0m,
                    min = count > 0 ? values.Min() : 0m,
                    max = count > 0 ? values.Max() : 0m,
                    count
                },
                metadata = GetDataSourceMetadata(AverageTripDurationDataSource)
            };
        }

        private async Task<List<object>> BuildAverageTripDurationSeriesAsync(IQueryable<VehicleTripGroup> query)
        {
            var grouped = await query
                .GroupBy(group => group.TripDate.Date)
                .Select(group => new
                {
                    TripDate = group.Key,
                    TotalDurationMinutes = group.Sum(item => item.TotalDurationMinutes),
                    TotalTrips = group.Sum(item => item.TripCount)
                })
                .OrderBy(item => item.TripDate)
                .ToListAsync();

            return grouped
                .Select(item => (object)new
                {
                    timestamp = item.TripDate,
                    value = item.TotalTrips > 0 ? Math.Round(item.TotalDurationMinutes / item.TotalTrips, 2) : 0m
                })
                .ToList();
        }
    }
}
