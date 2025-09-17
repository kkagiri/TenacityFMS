
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
namespace FMS.Application.Features.FuelTagManagement.FuelingRules.Rules.Commands.NoOfRefilRules;

public record CreateNoOfRefillRuleCommand(int RuleSetId, string RuleName, bool IsActive, int? MaxRefillsPerDay, int? MaxRefillsPerWeek, int? MaxRefillsPerMonth) : IRequest<FMSResponseMessage>;

public class CreateNoOfRefillRuleCommandHandler : IRequestHandler<CreateNoOfRefillRuleCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateNoOfRefillRuleCommandHandler> _logger;

    public CreateNoOfRefillRuleCommandHandler(GpsdataContext context, ILogger<CreateNoOfRefillRuleCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(CreateNoOfRefillRuleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var ruleSet = await _context.FuelingRuleSets.FindAsync(new object[] { request.RuleSetId }, cancellationToken);
            if (ruleSet == null) return new FMSResponseMessage(false, "Rule set not found");

            var rule = new NoOfRefillRule
            {
                RuleName = request.RuleName,
                IsActive = request.IsActive,
                MaxRefillsPerDay = request.MaxRefillsPerDay,
                MaxRefillsPerWeek = request.MaxRefillsPerWeek,
                MaxRefillsPerMonth = request.MaxRefillsPerMonth
            };

            ruleSet.Rules.Add(rule);
            await _context.SaveChangesAsync(cancellationToken);

            return new FMSResponseMessage(true, "No-of-refill rule created");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating no-of-refill rule");
            return new FMSResponseMessage(false, "Error creating no-of-refill rule");
        }
    }
}
