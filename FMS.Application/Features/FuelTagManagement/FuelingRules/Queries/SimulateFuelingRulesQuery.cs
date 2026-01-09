using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelTagManagement.FuelingRules.Services;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.Queries;

/// <summary>
/// DTO for simulation results - extends EffectiveRulesDTO with simulation info
/// </summary>
public class SimulationResultDTO : EffectiveRulesDTO
{
    /// <summary>
    /// The time used for simulation
    /// </summary>
    public DateTime SimulationTime { get; set; }

    /// <summary>
    /// Whether the simulation time is within any configured time window
    /// </summary>
    public bool IsWithinTimeWindow { get; set; }

    /// <summary>
    /// Human-readable time window status
    /// </summary>
    public string? TimeWindowStatus { get; set; }
}

/// <summary>
/// Query to simulate fueling rules for a vehicle at a specific time.
/// This allows testing how rules would apply at different times of day.
/// </summary>
public record SimulateFuelingRulesQuery(
    int VehicleId,
    int? SiteId = null,
    int? TagId = null,
    DateTime? SimulationTime = null
) : IRequest<FMSResponse<SimulationResultDTO>>;

public class SimulateFuelingRulesQueryHandler
    : IRequestHandler<SimulateFuelingRulesQuery, FMSResponse<SimulationResultDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IFuelingRuleEvaluationService _ruleEvaluationService;
    private readonly ILogger<SimulateFuelingRulesQueryHandler> _logger;

    public SimulateFuelingRulesQueryHandler(
        GpsdataContext context,
        IFuelingRuleEvaluationService ruleEvaluationService,
        ILogger<SimulateFuelingRulesQueryHandler> logger)
    {
        _context = context;
        _ruleEvaluationService = ruleEvaluationService;
        _logger = logger;
    }

    public async Task<FMSResponse<SimulationResultDTO>> Handle(
        SimulateFuelingRulesQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get the vehicle with type and site
            var vehicle = await _context.Vehicles
                .Include(v => v.VehicleType)
                .Include(v => v.WorkingSite)
                .FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId, cancellationToken);

            if (vehicle == null)
            {
                return FMSResponse<SimulationResultDTO>.NotFound(
                    "VEHICLE_NOT_FOUND",
                    $"Vehicle with ID {request.VehicleId} not found");
            }

            var siteId = request.SiteId ?? vehicle.WorkingSiteId ?? 0;
            var simulationTime = request.SimulationTime ?? DateTime.UtcNow;

            _logger.LogInformation(
                "Simulating fueling rules for vehicle {VehicleId} at site {SiteId} for time {SimulationTime}",
                request.VehicleId, siteId, simulationTime);

            // Build fueling context with the simulation time
            var fuelingContext = await _ruleEvaluationService.BuildFuelingContextAsync(
                request.VehicleId,
                siteId,
                request.TagId,
                cancellationToken);

            // Override the current time with the simulation time
            fuelingContext.CurrentTime = simulationTime;

            // Calculate fuel allowance with the simulated time
            var allowanceResult = await _ruleEvaluationService.CalculateFuelAllowanceAsync(
                fuelingContext,
                cancellationToken);

            // Check time window status
            var isWithinTimeWindow = true;
            var timeWindowStatus = "No time window configured";

            if (allowanceResult.TimeWindowStart.HasValue && allowanceResult.TimeWindowEnd.HasValue)
            {
                var simTimeOfDay = simulationTime.TimeOfDay;
                var start = allowanceResult.TimeWindowStart.Value;
                var end = allowanceResult.TimeWindowEnd.Value;

                if (end >= start)
                {
                    // Normal window (e.g., 08:00 - 18:00)
                    isWithinTimeWindow = simTimeOfDay >= start && simTimeOfDay <= end;
                }
                else
                {
                    // Overnight window (e.g., 22:00 - 06:00)
                    isWithinTimeWindow = simTimeOfDay >= start || simTimeOfDay <= end;
                }

                timeWindowStatus = isWithinTimeWindow
                    ? $"Within allowed window ({start:hh\\:mm} - {end:hh\\:mm})"
                    : $"Outside allowed window ({start:hh\\:mm} - {end:hh\\:mm})";
            }

            // Build response DTO
            var response = new SimulationResultDTO
            {
                // Simulation-specific properties
                SimulationTime = simulationTime,
                IsWithinTimeWindow = isWithinTimeWindow,
                TimeWindowStatus = timeWindowStatus,

                // Vehicle info
                Vehicle = new VehicleInfoDTO
                {
                    VehicleId = vehicle.VehicleId,
                    HyoungNo = vehicle.HyoungNo,
                    NumberPlate = vehicle.NumberPlate,
                    VehicleTypeId = vehicle.VehicleTypeId,
                    VehicleTypeName = vehicle.VehicleType?.Name,
                    WorkingSiteId = vehicle.WorkingSiteId,
                    WorkingSiteName = vehicle.WorkingSite?.Name
                },

                // Has rules if any rule sets were applied
                HasRules = allowanceResult.AppliedRuleSets.Count > 0,

                // Allowance result
                IsAllowed = allowanceResult.IsAllowed,
                MaxFuelAllowed = allowanceResult.MaxFuelAllowed,
                LimitingFactor = allowanceResult.LimitingFactor,
                Message = allowanceResult.Message,
                BlockedReason = allowanceResult.BlockedReason,

                // Limits
                TankCapacity = allowanceResult.TankCapacity,
                CurrentFuelLevel = allowanceResult.CurrentFuelInTank,
                HasGpsFuelSensor = allowanceResult.UsedGpsFuelSensor,
                HardLimit = allowanceResult.HardLimit,
                DailyLimit = allowanceResult.DailyLimit,
                MonthlyLimit = allowanceResult.MonthlyLimit,
                PerTransactionLimit = allowanceResult.PerTransactionLimit,
                MaxRefillsPerDay = allowanceResult.MaxRefillsPerDay,
                TimeWindowStart = allowanceResult.TimeWindowStart,
                TimeWindowEnd = allowanceResult.TimeWindowEnd,

                // Usage stats
                FuelUsedToday = allowanceResult.FuelUsedToday,
                FuelUsedThisMonth = allowanceResult.FuelUsedThisMonth,
                DailyRemaining = allowanceResult.DailyRemaining,
                MonthlyRemaining = allowanceResult.MonthlyRemaining,
                RefillsToday = allowanceResult.RefillsToday,
                RefillsRemainingToday = allowanceResult.RefillsRemainingToday,

                // Applied rules
                SoftLimits = allowanceResult.SoftLimits,
                AppliedRuleSets = allowanceResult.AppliedRuleSets.Select(rs => new AppliedRuleSetInfoDTO
                {
                    RuleSetId = rs.RuleSetId,
                    RuleSetName = rs.RuleSetName,
                    TargetType = rs.TargetType,
                    TargetName = rs.TargetName,
                    Priority = rs.Priority,
                    RulesApplied = rs.RulesApplied
                }).ToList()
            };

            _logger.LogInformation(
                "Simulation complete for vehicle {VehicleId} at {SimulationTime}: HasRules={HasRules}, IsAllowed={IsAllowed}, MaxFuel={MaxFuel}L, TimeWindowStatus={TimeWindowStatus}",
                request.VehicleId, simulationTime, response.HasRules, response.IsAllowed,
                response.MaxFuelAllowed, timeWindowStatus);

            return FMSResponse<SimulationResultDTO>.Success(
                response,
                response.HasRules
                    ? $"Simulation complete. At {simulationTime:HH:mm}: {(response.IsAllowed ? "Fueling allowed" : "Fueling blocked")}. Max fuel: {response.MaxFuelAllowed:F1}L"
                    : "No rules configured for this vehicle/site combination.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error simulating fueling rules for vehicle {VehicleId}", request.VehicleId);
            return FMSResponse<SimulationResultDTO>.SystemError(
                "SIMULATION_ERROR",
                "An error occurred while simulating fueling rules");
        }
    }
}
