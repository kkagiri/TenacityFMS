using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.Rules.Commands.TimeWIndowLimitRule;

public record CreateTimeWindowRuleCommand(
        int RuleSetId,
        string RuleName,
        bool IsActive,
        TimeSpan StartTime,
        TimeSpan EndTime
    ) : IRequest<FMSResponseMessage>;

public class CreateTimeWindowRuleCommandHandler : IRequestHandler<CreateTimeWindowRuleCommand, FMSResponseMessage>
{

    private readonly GpsdataContext _context;
    private readonly ILogger<CreateTimeWindowRuleCommandHandler> _logger;


    public CreateTimeWindowRuleCommandHandler(ILogger<CreateTimeWindowRuleCommandHandler> logger, GpsdataContext context)
    {


        _context = context;
        _logger = logger;
    }


    public async Task<FMSResponseMessage> Handle(CreateTimeWindowRuleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var ruleSet = await _context.FuelingRuleSets.FindAsync(request.RuleSetId);

            if (ruleSet == null) return new FMSResponseMessage(false, "Rule set Not Found");

            var rule = new TimeWindowRule
            {
                RuleName = request.RuleName,
                IsActive = request.IsActive,
                StartTime = request.StartTime,
                EndTime = request.EndTime
            };
            ruleSet.Rules.Add(rule);

            await _context.SaveChangesAsync(cancellationToken);
            return new FMSResponseMessage(true, "Time rule Created");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating time window rule");
            return new FMSResponseMessage(false, "Error creating time window rule");

        }
    }
}