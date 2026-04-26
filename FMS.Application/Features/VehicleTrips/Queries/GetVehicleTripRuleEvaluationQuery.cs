/**
 * File: GetVehicleTripRuleEvaluationQuery.cs
 * Purpose: Query contract for evaluating persisted trips against trip-based operational rules.
 * Dependencies: MediatR, FMSResponse, VehicleTripRuleEvaluationDTO.
 * Last Modified: 2026-03-11
 */
using System;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using MediatR;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;

namespace FMS.Application.Features.VehicleTrips.Queries;

public record GetVehicleTripRuleEvaluationQuery : IRequest<FMSResponse<VehicleTripRuleEvaluationDTO>>
{
    public int? VehicleId { get; init; }
    public DateTime? FromUtc { get; init; }
    public DateTime? ToUtc { get; init; }
}

public class GetVehicleTripRuleEvaluationQueryHandler : IRequestHandler<GetVehicleTripRuleEvaluationQuery, FMSResponse<VehicleTripRuleEvaluationDTO>>
{
    private const decimal DefaultMaxTripsPerDay = 12m;
    private const decimal DefaultMaxDistancePerTripKm = 150m;
    private const decimal DefaultMinimumTipperCyclesPerDay = 3m;
    private const decimal MinimumRouteBenchmarkSamples = 3m;
    private const decimal DurationVarianceToleranceRatio = 0.40m;
    private const decimal FuelVarianceToleranceRatio = 0.35m;

    private readonly GpsdataContext _context;
    private readonly ILogger<GetVehicleTripRuleEvaluationQueryHandler> _logger;

    public GetVehicleTripRuleEvaluationQueryHandler(
        GpsdataContext context,
        ILogger<GetVehicleTripRuleEvaluationQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTripRuleEvaluationDTO>> Handle(GetVehicleTripRuleEvaluationQuery request, CancellationToken cancellationToken)
    {
        var fromUtc = request.FromUtc?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-7);
        var toUtc = request.ToUtc?.ToUniversalTime() ?? DateTime.UtcNow;

        if (request.VehicleId.HasValue && request.VehicleId.Value <= 0)
        {
            return FMSResponse<VehicleTripRuleEvaluationDTO>.ValidationFailed(new List<string> { "VehicleId must be greater than zero." });
        }

        if (fromUtc >= toUtc)
        {
            return FMSResponse<VehicleTripRuleEvaluationDTO>.ValidationFailed(new List<string> { "FromUtc must be earlier than ToUtc." });
        }

        try
        {
            var groupsQuery = _context.VehicleTripGroups
                .AsNoTracking()
                .Include(group => group.Vehicle)
                .Include(group => group.OriginSite)
                .Include(group => group.DestinationSite)
                .Include(group => group.Trips)
                .Where(group => group.StartTimeUtc <= toUtc && group.EndTimeUtc >= fromUtc);

            if (request.VehicleId.HasValue)
            {
                groupsQuery = groupsQuery.Where(group => group.VehicleId == request.VehicleId.Value);
            }

            var groups = await groupsQuery.ToListAsync(cancellationToken);
            var trips = groups.SelectMany(group => group.Trips.Select(trip => new { Group = group, Trip = trip })).ToList();
            var violations = new List<VehicleTripRuleViolationDTO>();

            foreach (var perVehicleDay in groups.GroupBy(group => new { group.VehicleId, group.TripDate.Date }))
            {
                var tripCount = perVehicleDay.Sum(group => Math.Max(group.TripCount, group.Trips.Count));
                if (tripCount > DefaultMaxTripsPerDay)
                {
                    var sample = perVehicleDay.OrderBy(group => group.StartTimeUtc).First();
                    violations.Add(new VehicleTripRuleViolationDTO
                    {
                        RuleCode = "MAX_TRIPS_PER_DAY",
                        RuleName = "Max trips per day per vehicle",
                        Severity = "Warning",
                        VehicleId = sample.VehicleId,
                        VehicleLabel = BuildVehicleLabel(sample.Vehicle.VehicleCode, sample.Vehicle.NumberPlate),
                        TripDate = perVehicleDay.Key.Date,
                        CurrentValue = tripCount,
                        ThresholdValue = DefaultMaxTripsPerDay,
                        Unit = "trips/day",
                        Message = $"Vehicle exceeded the configured daily trip threshold with {tripCount} trips.",
                    });
                }
            }

            foreach (var item in trips.Where(item => item.Trip.DistanceKm > DefaultMaxDistancePerTripKm))
            {
                violations.Add(new VehicleTripRuleViolationDTO
                {
                    RuleCode = "MAX_DISTANCE_PER_TRIP",
                    RuleName = "Max distance per trip",
                    Severity = "Warning",
                    VehicleId = item.Group.VehicleId,
                    VehicleLabel = BuildVehicleLabel(item.Group.Vehicle.VehicleCode, item.Group.Vehicle.NumberPlate),
                    TripDate = item.Group.TripDate,
                    VehicleTripGroupId = item.Group.VehicleTripGroupId,
                    VehicleTripId = item.Trip.VehicleTripId,
                    OriginDisplayName = item.Group.OriginSite?.Name,
                    DestinationDisplayName = item.Group.DestinationSite?.Name,
                    CurrentValue = item.Trip.DistanceKm,
                    ThresholdValue = DefaultMaxDistancePerTripKm,
                    Unit = "km",
                    Message = $"Trip distance {item.Trip.DistanceKm:F2} km exceeded the threshold of {DefaultMaxDistancePerTripKm:F2} km.",
                });
            }

            var routeBenchmarks = trips
                .Where(item => item.Trip.Status == (int)VehicleTripStatus.Completed
                    && item.Trip.OriginSiteId.HasValue
                    && item.Trip.DestinationSiteId.HasValue
                    && item.Trip.DurationMinutes > 0)
                .GroupBy(item => new { item.Trip.OriginSiteId, item.Trip.DestinationSiteId })
                .Where(group => group.Count() >= (int)MinimumRouteBenchmarkSamples)
                .ToDictionary(
                    group => $"{group.Key.OriginSiteId}:{group.Key.DestinationSiteId}",
                    group => new
                    {
                        AverageDuration = group.Average(item => item.Trip.DurationMinutes),
                        AverageFuelRate = group.Where(item => item.Trip.FuelConsumed.HasValue && item.Trip.DistanceKm > 0)
                            .Select(item => item.Trip.FuelConsumed!.Value / item.Trip.DistanceKm)
                            .DefaultIfEmpty()
                            .Average(),
                    });

            foreach (var item in trips.Where(item => item.Trip.OriginSiteId.HasValue && item.Trip.DestinationSiteId.HasValue))
            {
                var routeKey = $"{item.Trip.OriginSiteId}:{item.Trip.DestinationSiteId}";
                if (routeBenchmarks.TryGetValue(routeKey, out var benchmark) && benchmark.AverageDuration > 0)
                {
                    var lowerBound = benchmark.AverageDuration * (1m - DurationVarianceToleranceRatio);
                    var upperBound = benchmark.AverageDuration * (1m + DurationVarianceToleranceRatio);
                    if (item.Trip.DurationMinutes < lowerBound || item.Trip.DurationMinutes > upperBound)
                    {
                        violations.Add(new VehicleTripRuleViolationDTO
                        {
                            RuleCode = "EXPECTED_DURATION_ROUTE",
                            RuleName = "Expected trip duration between two sites",
                            Severity = "Warning",
                            VehicleId = item.Group.VehicleId,
                            VehicleLabel = BuildVehicleLabel(item.Group.Vehicle.VehicleCode, item.Group.Vehicle.NumberPlate),
                            TripDate = item.Group.TripDate,
                            VehicleTripGroupId = item.Group.VehicleTripGroupId,
                            VehicleTripId = item.Trip.VehicleTripId,
                            OriginDisplayName = item.Group.OriginSite?.Name,
                            DestinationDisplayName = item.Group.DestinationSite?.Name,
                            CurrentValue = item.Trip.DurationMinutes,
                            ThresholdValue = Math.Round(Convert.ToDecimal(benchmark.AverageDuration), 2),
                            Unit = "minutes",
                            Message = $"Trip duration {item.Trip.DurationMinutes:F2} minutes is outside the expected route duration range.",
                        });
                    }
                }

                if (item.Trip.FuelConsumed.HasValue && item.Trip.DistanceKm > 0 && routeBenchmarks.TryGetValue(routeKey, out benchmark) && benchmark.AverageFuelRate > 0)
                {
                    var currentFuelRate = item.Trip.FuelConsumed.Value / item.Trip.DistanceKm;
                    var lowerFuelBound = Convert.ToDecimal(benchmark.AverageFuelRate) * (1m - FuelVarianceToleranceRatio);
                    var upperFuelBound = Convert.ToDecimal(benchmark.AverageFuelRate) * (1m + FuelVarianceToleranceRatio);
                    if (currentFuelRate < lowerFuelBound || currentFuelRate > upperFuelBound)
                    {
                        violations.Add(new VehicleTripRuleViolationDTO
                        {
                            RuleCode = "FUEL_RATE_ROUTE",
                            RuleName = "Fuel consumption rate thresholds per route",
                            Severity = "Critical",
                            VehicleId = item.Group.VehicleId,
                            VehicleLabel = BuildVehicleLabel(item.Group.Vehicle.VehicleCode, item.Group.Vehicle.NumberPlate),
                            TripDate = item.Group.TripDate,
                            VehicleTripGroupId = item.Group.VehicleTripGroupId,
                            VehicleTripId = item.Trip.VehicleTripId,
                            OriginDisplayName = item.Group.OriginSite?.Name,
                            DestinationDisplayName = item.Group.DestinationSite?.Name,
                            CurrentValue = Math.Round(currentFuelRate, 2),
                            ThresholdValue = Math.Round(Convert.ToDecimal(benchmark.AverageFuelRate), 2),
                            Unit = "L/km",
                            Message = $"Fuel consumption rate {currentFuelRate:F2} L/km deviates from the expected route benchmark.",
                        });
                    }
                }
            }

            foreach (var perVehicleDay in groups
                .Where(group => group.MovementProfile == VehicleMovementProfile.Cluster)
                .GroupBy(group => new { group.VehicleId, group.TripDate.Date }))
            {
                var cycleCount = perVehicleDay.Count(group => group.GroupingType == (int)VehicleTripGroupingType.LoadCycle);
                if (cycleCount < DefaultMinimumTipperCyclesPerDay)
                {
                    var sample = perVehicleDay.OrderBy(group => group.StartTimeUtc).First();
                    violations.Add(new VehicleTripRuleViolationDTO
                    {
                        RuleCode = "MIN_TIPPER_CYCLES",
                        RuleName = "Tipper minimum cycles per day",
                        Severity = "Warning",
                        VehicleId = sample.VehicleId,
                        VehicleLabel = BuildVehicleLabel(sample.Vehicle.VehicleCode, sample.Vehicle.NumberPlate),
                        TripDate = perVehicleDay.Key.Date,
                        CurrentValue = cycleCount,
                        ThresholdValue = DefaultMinimumTipperCyclesPerDay,
                        Unit = "cycles/day",
                        Message = $"Tipper completed only {cycleCount} load cycles for the day.",
                    });
                }
            }

            var result = new VehicleTripRuleEvaluationDTO
            {
                FromUtc = fromUtc,
                ToUtc = toUtc,
                EvaluatedVehicles = groups.Select(group => group.VehicleId).Distinct().Count(),
                TripGroupsReviewed = groups.Count,
                TripLegsReviewed = trips.Count,
                ViolationsDetected = violations.Count,
                Violations = violations.OrderByDescending(violation => violation.TripDate).ThenBy(violation => violation.RuleCode).ToList(),
            };

            return FMSResponse<VehicleTripRuleEvaluationDTO>.Success(result, "Vehicle trip rule evaluation completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating vehicle trip rules");
            return FMSResponse<VehicleTripRuleEvaluationDTO>.SystemError($"Failed to evaluate trip rules: {ex.Message}");
        }
    }

    private static string BuildVehicleLabel(string? vehicleCode, string? numberPlate)
    {
        return !string.IsNullOrWhiteSpace(numberPlate)
            ? $"{vehicleCode} / {numberPlate}"
            : vehicleCode ?? string.Empty;
    }
}
