

using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.Rules.Commands.DailyMonthlyRules;

public record CreateDailyMonthlyLimitRuleCommand(
    int RuleSetId,
    string RuleName,
    bool IsActive,
    int? DailyLimitLiter,
    int? MonthlyLimitLiter
) : IRequest<FMSResponseMessage>;

public class CreateDailyMonthlyLimitRuleCommandHandler : IRequestHandler<CreateDailyMonthlyLimitRuleCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateDailyMonthlyLimitRuleCommandHandler> _logger;

    public CreateDailyMonthlyLimitRuleCommandHandler(GpsdataContext context, ILogger<CreateDailyMonthlyLimitRuleCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(CreateDailyMonthlyLimitRuleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Verify rule set exists
            var ruleSetExists = await _context.FuelingRuleSets.AnyAsync(rs => rs.Id == request.RuleSetId, cancellationToken);
            if (!ruleSetExists) return new FMSResponseMessage(false, "Rule set not found");

            // Create rule with foreign key set directly
            var rule = new DailyMonthlyLimitRule
            {
                FuelingRuleSetId = request.RuleSetId,
                RuleName = request.RuleName,
                IsActive = request.IsActive,
                DailyLimitLiter = request.DailyLimitLiter,
                MonthlyLimitLiter = request.MonthlyLimitLiter
            };

            // Add directly to DbSet to ensure proper tracking
            _context.FuelingRules.Add(rule);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created DailyMonthlyLimitRule {RuleId} for RuleSet {RuleSetId}", rule.Id, request.RuleSetId);
            return new FMSResponseMessage(true, "Daily/Monthly limit rule created");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating daily/monthly limit rule");
            return new FMSResponseMessage(false, "Error creating daily/monthly limit rule");
        }
    }
}