using System;
using System.Collections.Generic;
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
/// DTO for effective rules response - contains merged rules from cascade hierarchy
/// </summary>
public class EffectiveRulesDTO
{
    /// <summary>
    /// Vehicle information
    /// </summary>
    public VehicleInfoDTO Vehicle { get; set; } = new();

    /// <summary>
    /// Whether vehicle has any rules configured (directly or through cascade)
    /// </summary>
    public bool HasRules { get; set; }

    /// <summary>
    /// Whether fueling is currently allowed
    /// </summary>
    public bool IsAllowed { get; set; }

    /// <summary>
    /// Maximum fuel allowed for next transaction (in liters)
    /// </summary>
    public decimal MaxFuelAllowed { get; set; }

    /// <summary>
    /// What factor is limiting the fuel allowance
    /// </summary>
    public string? LimitingFactor { get; set; }

    /// <summary>
    /// Human-readable message
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// If blocked, the reason why
    /// </summary>
    public string? BlockedReason { get; set; }

    #region Limits

    /// <summary>
    /// Tank capacity in liters
    /// </summary>
    public decimal TankCapacity { get; set; }

    /// <summary>
    /// Current fuel level (if GPS sensor available)
    /// </summary>
    public decimal? CurrentFuelLevel { get; set; }

    /// <summary>
    /// Whether GPS fuel sensor data is available
    /// </summary>
    public bool HasGpsFuelSensor { get; set; }

    /// <summary>
    /// Hard limit based on tank capacity
    /// </summary>
    public decimal HardLimit { get; set; }

    /// <summary>
    /// Daily limit from rules (liters)
    /// </summary>
    public decimal? DailyLimit { get; set; }

    /// <summary>
    /// Monthly limit from rules (liters)
    /// </summary>
    public decimal? MonthlyLimit { get; set; }

    /// <summary>
    /// Per-transaction limit from rules (liters)
    /// </summary>
    public decimal? PerTransactionLimit { get; set; }

    /// <summary>
    /// Maximum refills allowed per day
    /// </summary>
    public int? MaxRefillsPerDay { get; set; }

    /// <summary>
    /// Maximum refills allowed per week
    /// </summary>
    public int? MaxRefillsPerWeek { get; set; }

    /// <summary>
    /// Maximum refills allowed per month
    /// </summary>
    public int? MaxRefillsPerMonth { get; set; }

    /// <summary>
    /// Time window start (if configured)
    /// </summary>
    public TimeSpan? TimeWindowStart { get; set; }

    /// <summary>
    /// Time window end (if configured)
    /// </summary>
    public TimeSpan? TimeWindowEnd { get; set; }

    #endregion

    #region Usage Statistics

    /// <summary>
    /// Fuel used today (liters)
    /// </summary>
    public decimal FuelUsedToday { get; set; }

    /// <summary>
    /// Fuel used this month (liters)
    /// </summary>
    public decimal FuelUsedThisMonth { get; set; }

    /// <summary>
    /// Daily remaining (liters)
    /// </summary>
    public decimal? DailyRemaining { get; set; }

    /// <summary>
    /// Monthly remaining (liters)
    /// </summary>
    public decimal? MonthlyRemaining { get; set; }

    /// <summary>
    /// Number of refills today
    /// </summary>
    public int RefillsToday { get; set; }

    /// <summary>
    /// Refills remaining today
    /// </summary>
    public int? RefillsRemainingToday { get; set; }

    #endregion

    #region Applied Rules

    /// <summary>
    /// List of rule sets that were applied (ordered by priority)
    /// </summary>
    public List<AppliedRuleSetInfoDTO> AppliedRuleSets { get; set; } = new();

    /// <summary>
    /// Individual soft limits calculated from rules
    /// </summary>
    public Dictionary<string, decimal> SoftLimits { get; set; } = new();

    #endregion
}

/// <summary>
/// Vehicle information for the response
/// </summary>
public class VehicleInfoDTO
{
    public int VehicleId { get; set; }
    public string? VehicleCode { get; set; }
    public string? NumberPlate { get; set; }
    public int? VehicleTypeId { get; set; }
    public string? VehicleTypeName { get; set; }
    public int? WorkingSiteId { get; set; }
    public string? WorkingSiteName { get; set; }
}

/// <summary>
/// Applied rule set information
/// </summary>
public class AppliedRuleSetInfoDTO
{
    public int RuleSetId { get; set; }
    public string RuleSetName { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public string TargetName { get; set; } = string.Empty;
    public int Priority { get; set; }
    public List<string> RulesApplied { get; set; } = new();
}

/// <summary>
/// Query to get effective (merged) rules for a vehicle based on cascade hierarchy
/// </summary>
public record GetEffectiveRulesForVehicleQuery(
    int VehicleId,
    int? SiteId = null,
    int? TagId = null
) : IRequest<FMSResponse<EffectiveRulesDTO>>;

public class GetEffectiveRulesForVehicleQueryHandler
    : IRequestHandler<GetEffectiveRulesForVehicleQuery, FMSResponse<EffectiveRulesDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IFuelingRuleEvaluationService _ruleEvaluationService;
    private readonly ILogger<GetEffectiveRulesForVehicleQueryHandler> _logger;

    public GetEffectiveRulesForVehicleQueryHandler(
        GpsdataContext context,
        IFuelingRuleEvaluationService ruleEvaluationService,
        ILogger<GetEffectiveRulesForVehicleQueryHandler> logger)
    {
        _context = context;
        _ruleEvaluationService = ruleEvaluationService;
        _logger = logger;
    }

    public async Task<FMSResponse<EffectiveRulesDTO>> Handle(
        GetEffectiveRulesForVehicleQuery request,
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
                return FMSResponse<EffectiveRulesDTO>.NotFound(
                    "VEHICLE_NOT_FOUND",
                    $"Vehicle with ID {request.VehicleId} not found");
            }

            var siteId = request.SiteId ?? vehicle.WorkingSiteId ?? 0;

            // Build fueling context
            var fuelingContext = await _ruleEvaluationService.BuildFuelingContextAsync(
                request.VehicleId,
                siteId,
                request.TagId,
                cancellationToken);

            // Calculate fuel allowance (this merges all applicable rules)
            var allowanceResult = await _ruleEvaluationService.CalculateFuelAllowanceAsync(
                fuelingContext,
                cancellationToken);

            // Build response DTO
            var response = new EffectiveRulesDTO
            {
                Vehicle = new VehicleInfoDTO
                {
                    VehicleId = vehicle.VehicleId,
                    VehicleCode = vehicle.VehicleCode,
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
                "Got effective rules for vehicle {VehicleId}: HasRules={HasRules}, MaxFuel={MaxFuel}L, AppliedRuleSets={Count}",
                request.VehicleId, response.HasRules, response.MaxFuelAllowed, response.AppliedRuleSets.Count);

            return FMSResponse<EffectiveRulesDTO>.Success(
                response,
                response.HasRules
                    ? $"Effective rules retrieved. Max fuel: {response.MaxFuelAllowed:F1}L"
                    : "No rules configured. Using tank capacity as limit.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting effective rules for vehicle {VehicleId}", request.VehicleId);
            return FMSResponse<EffectiveRulesDTO>.SystemError(
                "GET_EFFECTIVE_RULES_ERROR",
                "An error occurred while retrieving effective rules");
        }
    }
}
