using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.RuleSet.Commands;

public record AssignFuelingRuleSetToVehicleCommand(int VehicleId, int RuleSetId) : IRequest<FMSResponse>;

public class AssignFuelingRuleSetToVehicleCommandHandler : IRequestHandler<AssignFuelingRuleSetToVehicleCommand, FMSResponse>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<AssignFuelingRuleSetToVehicleCommandHandler> _logger;

    public AssignFuelingRuleSetToVehicleCommandHandler(GpsdataContext context, ILogger<AssignFuelingRuleSetToVehicleCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse> Handle(AssignFuelingRuleSetToVehicleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validate vehicle exists
            var vehicle = await _context.Vehicles.FindAsync(new object[] { request.VehicleId }, cancellationToken);
            if (vehicle == null)
            {
                _logger.LogWarning("Vehicle with ID {VehicleId} not found", request.VehicleId);
                return FMSResponse.NotFound("VEHICLE_NOT_FOUND", "Vehicle not found");
            }

            // Validate rule set exists and load its rules
            var ruleSet = await _context.FuelingRuleSets
                .Include(rs => rs.Rules)
                .FirstOrDefaultAsync(rs => rs.Id == request.RuleSetId, cancellationToken);

            if (ruleSet == null)
            {
                _logger.LogWarning("Rule set with ID {RuleSetId} not found", request.RuleSetId);
                return FMSResponse.NotFound("RULESET_NOT_FOUND", "Rule set not found");
            }

            // Deactivate existing rules for this vehicle
            var existingRules = await _context.FuelingRules
                .Where(r => r.VehicleId == request.VehicleId && r.IsActive)
                .ToListAsync(cancellationToken);

            foreach (var rule in existingRules)
            {
                rule.IsActive = false;
                rule.UpdatedAt = DateTime.UtcNow;
            }

            _logger.LogInformation("Deactivated {Count} existing rules for vehicle {VehicleId}", existingRules.Count, request.VehicleId);

            // Create new rules from rule set
            var currentTime = DateTime.UtcNow;
            int rulesCreated = 0;

            // Get DailyMonthlyLimitRule from the Rules collection
            var dailyMonthlyRuleTemplate = ruleSet.Rules.OfType<DailyMonthlyLimitRule>().FirstOrDefault();
            if (dailyMonthlyRuleTemplate != null)
            {
                var dailyMonthlyRule = new DailyMonthlyLimitRule
                {
                    RuleName = $"Daily/Monthly Limit - {ruleSet.Name}",
                    IsActive = true,
                    CreatedAt = currentTime,
                    UpdatedAt = currentTime,
                    VehicleId = request.VehicleId,
                    FuelingRuleSetId = request.RuleSetId,
                    DailyLimitLiter = dailyMonthlyRuleTemplate.DailyLimitLiter,
                    MonthlyLimitLiter = dailyMonthlyRuleTemplate.MonthlyLimitLiter
                };

                await _context.FuelingRules.AddAsync(dailyMonthlyRule, cancellationToken);
                rulesCreated++;
                _logger.LogInformation("Created DailyMonthlyLimitRule for vehicle {VehicleId} with daily limit {DailyLimit}L and monthly limit {MonthlyLimit}L",
                    request.VehicleId, dailyMonthlyRule.DailyLimitLiter, dailyMonthlyRule.MonthlyLimitLiter);
            }

            // Get NoOfRefillRule from the Rules collection
            var noOfRefillRuleTemplate = ruleSet.Rules.OfType<NoOfRefillRule>().FirstOrDefault();
            if (noOfRefillRuleTemplate != null)
            {
                var noOfRefillRule = new NoOfRefillRule
                {
                    RuleName = $"Refill Limit - {ruleSet.Name}",
                    IsActive = true,
                    CreatedAt = currentTime,
                    UpdatedAt = currentTime,
                    VehicleId = request.VehicleId,
                    FuelingRuleSetId = request.RuleSetId,
                    MaxRefillsPerDay = noOfRefillRuleTemplate.MaxRefillsPerDay,
                    MaxRefillsPerWeek = noOfRefillRuleTemplate.MaxRefillsPerWeek,
                    MaxRefillsPerMonth = noOfRefillRuleTemplate.MaxRefillsPerMonth
                };

                await _context.FuelingRules.AddAsync(noOfRefillRule, cancellationToken);
                rulesCreated++;
                _logger.LogInformation("Created NoOfRefillRule for vehicle {VehicleId}", request.VehicleId);
            }

            if (rulesCreated == 0)
            {
                _logger.LogWarning("Rule set {RuleSetId} has no rules to assign", request.RuleSetId);
                return FMSResponse.FailedResponse("Rule set contains no rules to assign", "NO_RULES_IN_RULESET");
            }

            // Save changes
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Successfully assigned rule set {RuleSetId} ({RuleSetName}) to vehicle {VehicleId}, created {RulesCount} rules",
                request.RuleSetId, ruleSet.Name, request.VehicleId, rulesCreated);

            return FMSResponse.SuccessResponse($"Fuel rule set '{ruleSet.Name}' assigned to vehicle successfully ({rulesCreated} rules created)");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning rule set {RuleSetId} to vehicle {VehicleId}", request.RuleSetId, request.VehicleId);
            return FMSResponse.FailedResponse("ASSIGN_RULESET_ERROR", $"Error assigning rule set to vehicle: {ex.Message}");
        }
    }
}
