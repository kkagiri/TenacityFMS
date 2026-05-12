
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
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
            // Verify rule set exists
            var ruleSetExists = await _context.FuelingRuleSets.AnyAsync(rs => rs.Id == request.RuleSetId, cancellationToken);
            if (!ruleSetExists) return new FMSResponseMessage(false, "Rule set not found");

            // Create rule with foreign key set directly
            var rule = new NoOfRefillRule
            {
                FuelingRuleSetId = request.RuleSetId,
                RuleName = request.RuleName,
                IsActive = request.IsActive,
                MaxRefillsPerDay = request.MaxRefillsPerDay,
                MaxRefillsPerWeek = request.MaxRefillsPerWeek,
                MaxRefillsPerMonth = request.MaxRefillsPerMonth
            };

            // Add directly to DbSet to ensure proper tracking
            _context.FuelingRules.Add(rule);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created NoOfRefillRule {RuleId} for RuleSet {RuleSetId}", rule.Id, request.RuleSetId);
            return new FMSResponseMessage(true, "No-of-refill rule created");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating no-of-refill rule");
            return new FMSResponseMessage(false, "Error creating no-of-refill rule");
        }
    }
}
