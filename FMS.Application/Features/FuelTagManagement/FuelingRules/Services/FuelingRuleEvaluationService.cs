using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Vehicle.Services;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Domain.Entities.Features.FuelRuleSet;
using FMS.Domain.Entities.VehicleTracking;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.Services
{
    /// <summary>
    /// Interface for fueling rule evaluation service
    /// </summary>
    public interface IFuelingRuleEvaluationService
    {
        /// <summary>
        /// Calculates the maximum fuel allowed for a fueling request based on:
        /// 1. HARD LIMITS (physics): Tank capacity - current fuel level
        /// 2. SOFT LIMITS (rules): Merged rules from Site → VehicleType → Tag → Vehicle cascade
        /// </summary>
        Task<FuelAllowanceResult> CalculateFuelAllowanceAsync(FuelingContext context, CancellationToken cancellationToken = default);

        /// <summary>
        /// Builds a FuelingContext with all necessary information for rule evaluation
        /// </summary>
        Task<FuelingContext> BuildFuelingContextAsync(int vehicleId, int siteId, int? tagId = null, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Service that evaluates fueling rules and calculates maximum fuel allowance.
    ///
    /// Rule Cascade (MERGED - all applicable rules apply):
    ///   Site (Priority 10) → VehicleType (Priority 50) → Tag (Priority 80) → Vehicle (Priority 100)
    ///
    /// Limits are calculated as:
    ///   MaxFuel = MIN(HardLimit, SoftLimit1, SoftLimit2, ...)
    ///
    /// Hard Limit (physics - cannot be overridden):
    ///   - With GPS fuel sensor: TankCapacity - CurrentFuelLevel
    ///   - Without GPS fuel sensor: TankCapacity
    /// </summary>
    public class FuelingRuleEvaluationService : IFuelingRuleEvaluationService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<FuelingRuleEvaluationService> _logger;
        private readonly IGPSService _gpsService;
        private readonly ISystemConfigurationService _systemConfigService;

        public FuelingRuleEvaluationService(
            GpsdataContext context,
            IGPSService gpsService,
            ISystemConfigurationService systemConfigService,
            ILogger<FuelingRuleEvaluationService> logger)
        {
            _context = context;
            _gpsService = gpsService;
            _systemConfigService = systemConfigService;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<FuelAllowanceResult> CalculateFuelAllowanceAsync(
            FuelingContext context,
            CancellationToken cancellationToken = default)
        {
            var result = new FuelAllowanceResult
            {
                FuelUsedToday = context.FuelTakenToday,
                FuelUsedThisMonth = context.FuelTakenThisMonth,
                RefillsToday = context.NoOfRefillToday,
                TankCapacity = context.TankCapacity,
                CurrentFuelInTank = context.CurrentFuelLevel
            };

            try
            {
                // ========================================
                // STEP 1: Calculate HARD LIMIT (Physics)
                // ========================================
                result.HardLimit = context.MaxPhysicalFuelAllowed;
                result.UsedGpsFuelSensor = context.HasFuelSensor && context.CurrentFuelLevel.HasValue;

                if (context.HasFuelSensor && context.CurrentFuelLevel.HasValue)
                {
                    if (context.TankCapacity > 0)
                    {
                        result.HardLimitSource = $"GPS Sensor: {context.TankCapacity}L tank - {context.CurrentFuelLevel.Value:F1}L current = {result.HardLimit:F1}L available";
                        _logger.LogInformation(
                            "Vehicle {VehicleId}: GPS sensor reports {CurrentFuel}L in {TankCapacity}L tank. Hard limit: {HardLimit}L (available space)",
                            context.VehicleId, context.CurrentFuelLevel.Value, context.TankCapacity, result.HardLimit);
                    }
                    else
                    {
                        result.HardLimitSource = $"GPS Sensor (no tank capacity configured): {context.CurrentFuelLevel.Value:F1}L current - using as estimated limit";
                        _logger.LogWarning(
                            "Vehicle {VehicleId}: GPS sensor reports {CurrentFuel}L BUT TANK CAPACITY IS NOT CONFIGURED! Cannot calculate available space accurately. Please set FuelTankCapacity for this vehicle.",
                            context.VehicleId, context.CurrentFuelLevel.Value);
                    }
                }
                else
                {
                    result.HardLimitSource = $"Tank Capacity: {context.TankCapacity}L (no GPS fuel sensor)";
                    _logger.LogInformation(
                        "Vehicle {VehicleId}: No GPS fuel sensor. Using tank capacity as hard limit: {TankCapacity}L",
                        context.VehicleId, context.TankCapacity);
                }

                // If tank is full or capacity not configured, block fueling
                if (result.HardLimit <= 0)
                {
                    // Distinguish between "tank full" and "tank capacity not configured"
                    if (context.TankCapacity <= 0)
                    {
                        _logger.LogWarning(
                            "Vehicle {VehicleId}: Tank capacity not configured (FuelTankCapacity = 0 or null). Cannot calculate fuel allowance.",
                            context.VehicleId);
                        return FuelAllowanceResult.Blocked(
                            "Tank capacity not configured. Please set FuelTankCapacity for this vehicle in Vehicle Management.");
                    }

                    // Tank capacity is set but GPS shows tank is full
                    return FuelAllowanceResult.Blocked("Tank is full - no fuel needed");
                }

                // ========================================
                // STEP 2: Get all applicable rule sets (MERGE)
                // ========================================
                var assignments = await GetApplicableAssignmentsAsync(context, cancellationToken);

                if (!assignments.Any())
                {
                    _logger.LogWarning(
                        "Vehicle {VehicleId}: No rule assignments found. Fueling blocked - rules must be configured.",
                        context.VehicleId);

                    return FuelAllowanceResult.Blocked(
                        "No fueling rules configured for this vehicle. Please contact administrator to assign fuel rules.");
                }

                // ========================================
                // STEP 3: Merge rules and calculate soft limits
                // ========================================
                var mergedRules = MergeRules(assignments, result);

                // Time window check
                if (mergedRules.TimeWindowStart.HasValue && mergedRules.TimeWindowEnd.HasValue)
                {
                    var currentTime = context.CurrentTime.TimeOfDay;
                    result.TimeWindowStart = mergedRules.TimeWindowStart;
                    result.TimeWindowEnd = mergedRules.TimeWindowEnd;
                    result.IsWithinTimeWindow = currentTime >= mergedRules.TimeWindowStart &&
                                                currentTime <= mergedRules.TimeWindowEnd;

                    if (!result.IsWithinTimeWindow)
                    {
                        // Set blocked state but preserve AppliedRuleSets
                        result.IsAllowed = false;
                        result.MaxFuelAllowed = 0;
                        result.BlockedReason = $"Outside allowed fueling hours. Allowed: {mergedRules.TimeWindowStart:hh\\:mm} - {mergedRules.TimeWindowEnd:hh\\:mm}";
                        result.Message = $"Fueling blocked: {result.BlockedReason}";
                        return result;
                    }
                }

                // Refill count check
                if (mergedRules.MaxRefillsPerDay.HasValue)
                {
                    result.MaxRefillsPerDay = mergedRules.MaxRefillsPerDay;
                    if (context.NoOfRefillToday >= mergedRules.MaxRefillsPerDay.Value)
                    {
                        // Set blocked state but preserve AppliedRuleSets
                        result.IsAllowed = false;
                        result.MaxFuelAllowed = 0;
                        result.BlockedReason = $"Maximum refills per day reached ({mergedRules.MaxRefillsPerDay} refills)";
                        result.Message = $"Fueling blocked: {result.BlockedReason}";
                        return result;
                    }
                }

                // Calculate soft limits
                var softLimits = new List<(string Name, decimal Value)>();

                // Daily limit remaining
                if (mergedRules.DailyLimit.HasValue)
                {
                    result.DailyLimit = mergedRules.DailyLimit;
                    var dailyRemaining = mergedRules.DailyLimit.Value - context.FuelTakenToday;
                    softLimits.Add(("DailyLimit", Math.Max(0, dailyRemaining)));
                    result.SoftLimits["DailyLimit"] = Math.Max(0, dailyRemaining);
                }

                // Monthly limit remaining
                if (mergedRules.MonthlyLimit.HasValue)
                {
                    result.MonthlyLimit = mergedRules.MonthlyLimit;
                    var monthlyRemaining = mergedRules.MonthlyLimit.Value - context.FuelTakenThisMonth;
                    softLimits.Add(("MonthlyLimit", Math.Max(0, monthlyRemaining)));
                    result.SoftLimits["MonthlyLimit"] = Math.Max(0, monthlyRemaining);
                }

                // Per-transaction limit
                if (mergedRules.PerTransactionLimit.HasValue)
                {
                    result.PerTransactionLimit = mergedRules.PerTransactionLimit;
                    softLimits.Add(("PerTransaction", mergedRules.PerTransactionLimit.Value));
                    result.SoftLimits["PerTransaction"] = mergedRules.PerTransactionLimit.Value;
                }

                // ========================================
                // STEP 4: Calculate final max fuel (minimum of all limits)
                // ========================================
                var allLimits = new List<(string Name, decimal Value)>
                {
                    ("HardLimit", result.HardLimit)
                };
                allLimits.AddRange(softLimits);

                var minLimit = allLimits.MinBy(x => x.Value);
                result.MaxFuelAllowed = Math.Max(0, minLimit.Value);
                result.LimitingFactor = minLimit.Name;

                if (result.MaxFuelAllowed <= 0)
                {
                    // Find which limit caused the block - preserve AppliedRuleSets
                    var zeroLimit = allLimits.FirstOrDefault(x => x.Value <= 0);
                    result.IsAllowed = false;
                    result.BlockedReason = $"Limit reached: {zeroLimit.Name}";
                    result.Message = $"Fueling blocked: {result.BlockedReason}";
                    return result;
                }

                result.IsAllowed = true;
                result.Message = $"Fueling allowed: up to {result.MaxFuelAllowed:F1}L (limited by {result.LimitingFactor})";

                _logger.LogInformation(
                    "Vehicle {VehicleId}: Fuel allowance calculated. Max: {MaxFuel}L, Limiting factor: {LimitingFactor}",
                    context.VehicleId, result.MaxFuelAllowed, result.LimitingFactor);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating fuel allowance for vehicle {VehicleId}", context.VehicleId);
                throw;
            }
        }

        /// <summary>
        /// Gets the current local time based on the system timezone configuration.
        /// Time window rules are configured in local time by users, so we need to
        /// convert UTC to local time for proper comparison.
        /// </summary>
        private async Task<DateTime> GetLocalTimeAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var timezone = await _systemConfigService.GetTimezoneAsync(cancellationToken);
                var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(timezone);
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZoneInfo);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error getting local time, falling back to server local time");
                return DateTime.Now;
            }
        }

        /// <inheritdoc />
        public async Task<FuelingContext> BuildFuelingContextAsync(
            int vehicleId,
            int siteId,
            int? tagId = null,
            CancellationToken cancellationToken = default)
        {
            // Get vehicle with type
            var vehicle = await _context.Vehicles
                .Include(v => v.VehicleType)
                .FirstOrDefaultAsync(v => v.VehicleId == vehicleId, cancellationToken);

            if (vehicle == null)
            {
                throw new ArgumentException($"Vehicle {vehicleId} not found", nameof(vehicleId));
            }

            // Get local time for time window rule evaluation
            // Time window rules are configured in local time, so we need to compare against local time
            var localTime = await GetLocalTimeAsync(cancellationToken);

            var context = new FuelingContext
            {
                Vehicle = vehicle,
                VehicleId = vehicleId,
                VehicleTypeId = vehicle.VehicleTypeId,
                SiteId = siteId,
                TagId = tagId,
                TankCapacity = vehicle.FuelTankCapacity ?? 0,
                CurrentTime = localTime  // Use local time for time window comparisons
            };

            // Get tag if provided
            if (tagId.HasValue)
            {
                var tag = await _context.FuelTags
                    .FirstOrDefaultAsync(t => t.Id == tagId.Value, cancellationToken);
                context.Tag = tag;
                context.TagName = tag?.Name;
            }

            // Check for GPS fuel sensor
            var providerMapping = await _context.VehicleProviderMappings
                .Include(m => m.ProviderConfiguration)
                .Where(m => m.VehicleId == vehicleId
                    && m.IsActive
                    && m.HasFuelSensor == true)
                .FirstOrDefaultAsync(cancellationToken);

            context.HasFuelSensor = providerMapping?.HasFuelSensor ?? false;

            // Get current fuel level from GPS service if sensor is available
            if (context.HasFuelSensor)
            {
                try
                {
                    var fuelLevelResult = await _gpsService.GetFuelLevelAsync(vehicleId);
                    if (fuelLevelResult.IsSuccess && fuelLevelResult.Data.HasValue)
                    {
                        context.CurrentFuelLevel = fuelLevelResult.Data.Value;
                        context.FuelLevelTimestamp = DateTime.UtcNow;
                        _logger.LogInformation(
                            "Vehicle {VehicleId}: GPS fuel sensor reports {FuelLevel}L in tank (capacity: {TankCapacity}L)",
                            vehicleId, context.CurrentFuelLevel, context.TankCapacity);
                    }
                    else
                    {
                        _logger.LogWarning(
                            "Vehicle {VehicleId}: Has fuel sensor but failed to get reading: {Message}",
                            vehicleId, fuelLevelResult.Message);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Vehicle {VehicleId}: Error fetching GPS fuel level, proceeding without sensor data",
                        vehicleId);
                }
            }

            // Get usage statistics
            var today = DateTime.UtcNow.Date;
            var monthStart = new DateTime(today.Year, today.Month, 1);
            var weekStart = today.AddDays(-(int)today.DayOfWeek);

            // Fuel taken today
            context.FuelTakenToday = await _context.FuelRefills
                .Where(fr => fr.VehicleId == vehicleId && fr.Date >= today)
                .SumAsync(fr => fr.ManualFuelrefillAmount ?? 0, cancellationToken);

            // Fuel taken this month
            context.FuelTakenThisMonth = await _context.FuelRefills
                .Where(fr => fr.VehicleId == vehicleId && fr.Date >= monthStart)
                .SumAsync(fr => fr.ManualFuelrefillAmount ?? 0, cancellationToken);

            // Refill counts
            context.NoOfRefillToday = await _context.FuelRefills
                .CountAsync(fr => fr.VehicleId == vehicleId && fr.Date >= today, cancellationToken);

            context.NoOfRefillThisWeek = await _context.FuelRefills
                .CountAsync(fr => fr.VehicleId == vehicleId && fr.Date >= weekStart, cancellationToken);

            context.NoOfRefillThisMonth = await _context.FuelRefills
                .CountAsync(fr => fr.VehicleId == vehicleId && fr.Date >= monthStart, cancellationToken);

            return context;
        }

        /// <summary>
        /// Gets all applicable rule set assignments for the fueling context.
        /// Returns assignments ordered by priority (lowest first, highest last).
        /// </summary>
        private async Task<List<FuelingRuleSetAssignment>> GetApplicableAssignmentsAsync(
            FuelingContext context,
            CancellationToken cancellationToken)
        {
            return await _context.Set<FuelingRuleSetAssignment>()
                .Include(a => a.FuelingRuleSet)
                    .ThenInclude(rs => rs.Rules)
                .Where(a => a.IsActive && (
                    (a.TargetType == AssignmentTargetType.Site && a.SiteId == context.SiteId) ||
                    (a.TargetType == AssignmentTargetType.VehicleType && a.VehicleTypeId == context.VehicleTypeId) ||
                    (a.TargetType == AssignmentTargetType.Vehicle && a.VehicleId == context.VehicleId) ||
                    (a.TargetType == AssignmentTargetType.Tag && a.TagId == context.TagId)
                ))
                .OrderBy(a => a.Priority)  // Lower priority first, higher overrides
                .ToListAsync(cancellationToken);
        }

        /// <summary>
        /// Merges rules from all applicable assignments.
        /// Higher priority assignments override lower priority ones.
        /// </summary>
        private MergedRuleSet MergeRules(
            List<FuelingRuleSetAssignment> assignments,
            FuelAllowanceResult result)
        {
            var merged = new MergedRuleSet();

            // Process in priority order (lowest first, highest overrides)
            foreach (var assignment in assignments.OrderBy(a => a.Priority))
            {
                var ruleSetInfo = new AppliedRuleSetInfo
                {
                    RuleSetId = assignment.FuelingRuleSetId,
                    RuleSetName = assignment.FuelingRuleSet?.Name ?? "Unknown",
                    TargetType = assignment.TargetType.ToString(),
                    TargetName = assignment.GetTargetDisplayName(),
                    Priority = assignment.Priority
                };

                foreach (var rule in assignment.FuelingRuleSet?.Rules.Where(r => r.IsActive) ?? Enumerable.Empty<FuelingRule>())
                {
                    switch (rule)
                    {
                        case DailyMonthlyLimitRule dml:
                            if (dml.DailyLimitLiter.HasValue)
                            {
                                merged.DailyLimit = dml.DailyLimitLiter;
                                ruleSetInfo.RulesApplied.Add($"DailyLimit: {dml.DailyLimitLiter}L");
                            }
                            if (dml.MonthlyLimitLiter.HasValue)
                            {
                                merged.MonthlyLimit = dml.MonthlyLimitLiter;
                                ruleSetInfo.RulesApplied.Add($"MonthlyLimit: {dml.MonthlyLimitLiter}L");
                            }
                            if (dml.FuelingLimitPerTransaction.HasValue)
                            {
                                merged.PerTransactionLimit = dml.FuelingLimitPerTransaction;
                                ruleSetInfo.RulesApplied.Add($"PerTransaction: {dml.FuelingLimitPerTransaction}L");
                            }
                            break;

                        case NoOfRefillRule nor:
                            if (nor.MaxRefillsPerDay.HasValue)
                            {
                                merged.MaxRefillsPerDay = nor.MaxRefillsPerDay;
                                ruleSetInfo.RulesApplied.Add($"MaxRefills/Day: {nor.MaxRefillsPerDay}");
                            }
                            if (nor.MaxRefillsPerWeek.HasValue)
                            {
                                merged.MaxRefillsPerWeek = nor.MaxRefillsPerWeek;
                                ruleSetInfo.RulesApplied.Add($"MaxRefills/Week: {nor.MaxRefillsPerWeek}");
                            }
                            if (nor.MaxRefillsPerMonth.HasValue)
                            {
                                merged.MaxRefillsPerMonth = nor.MaxRefillsPerMonth;
                                ruleSetInfo.RulesApplied.Add($"MaxRefills/Month: {nor.MaxRefillsPerMonth}");
                            }
                            break;

                        case TimeWindowRule tw:
                            merged.TimeWindowStart = tw.StartTime;
                            merged.TimeWindowEnd = tw.EndTime;
                            ruleSetInfo.RulesApplied.Add($"TimeWindow: {tw.StartTime:hh\\:mm}-{tw.EndTime:hh\\:mm}");
                            break;
                    }
                }

                if (ruleSetInfo.RulesApplied.Any())
                {
                    result.AppliedRuleSets.Add(ruleSetInfo);
                }
            }

            return merged;
        }
    }

    /// <summary>
    /// Internal class to hold merged rule values
    /// </summary>
    internal class MergedRuleSet
    {
        public int? DailyLimit { get; set; }
        public int? MonthlyLimit { get; set; }
        public int? PerTransactionLimit { get; set; }
        public int? MaxRefillsPerDay { get; set; }
        public int? MaxRefillsPerWeek { get; set; }
        public int? MaxRefillsPerMonth { get; set; }
        public TimeSpan? TimeWindowStart { get; set; }
        public TimeSpan? TimeWindowEnd { get; set; }
    }
}
