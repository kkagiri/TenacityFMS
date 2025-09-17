

using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
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
            var ruleSet = await _context.FuelingRuleSets.FindAsync(new object[] { request.RuleSetId }, cancellationToken);
            if (ruleSet == null) return new FMSResponseMessage(false, "Rule set not found");

            var rule = new DailyMonthlyLimitRule
            {
                RuleName = request.RuleName,
                IsActive = request.IsActive,
                DailyLimitLiter = request.DailyLimitLiter,
                MonthlyLimitLiter = request.MonthlyLimitLiter
            };

            ruleSet.Rules.Add(rule);
            await _context.SaveChangesAsync(cancellationToken);

            return new FMSResponseMessage(true, "Daily/Monthly limit rule created");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating daily/monthly limit rule");
            return new FMSResponseMessage(false, "Error creating daily/monthly limit rule");
        }
    }
}