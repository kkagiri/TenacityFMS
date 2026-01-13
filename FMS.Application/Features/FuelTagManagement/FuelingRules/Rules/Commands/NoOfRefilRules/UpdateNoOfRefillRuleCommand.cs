using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.Rules.Commands.NoOfRefilRules;

public record UpdateNoOfRefillRuleCommand(
    int RuleId,
    string RuleName,
    bool IsActive,
    int? MaxRefillsPerDay,
    int? MaxRefillsPerWeek,
    int? MaxRefillsPerMonth
) : IRequest<FMSResponseMessage>;

public class UpdateNoOfRefillRuleCommandHandler : IRequestHandler<UpdateNoOfRefillRuleCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateNoOfRefillRuleCommandHandler> _logger;

    public UpdateNoOfRefillRuleCommandHandler(GpsdataContext context, ILogger<UpdateNoOfRefillRuleCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(UpdateNoOfRefillRuleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("UpdateNoOfRefillRule: Starting update for RuleId={RuleId}, " +
                "MaxRefillsPerDay={MaxRefillsPerDay}, MaxRefillsPerWeek={MaxRefillsPerWeek}, MaxRefillsPerMonth={MaxRefillsPerMonth}",
                request.RuleId, request.MaxRefillsPerDay, request.MaxRefillsPerWeek, request.MaxRefillsPerMonth);

            var rule = await _context.FuelingRules.FindAsync(new object[] { request.RuleId }, cancellationToken);

            _logger.LogInformation("UpdateNoOfRefillRule: Found rule type={RuleType}, IsNoOfRefillRule={IsNoOfRefillRule}",
                rule?.GetType().Name ?? "null", rule is NoOfRefillRule);

            if (rule is not NoOfRefillRule noOfRefillRule)
                return new FMSResponseMessage(false, "No-of-refill rule not found");

            _logger.LogInformation("UpdateNoOfRefillRule: Before update - MaxRefillsPerDay={MaxRefillsPerDay}, MaxRefillsPerWeek={MaxRefillsPerWeek}, MaxRefillsPerMonth={MaxRefillsPerMonth}",
                noOfRefillRule.MaxRefillsPerDay, noOfRefillRule.MaxRefillsPerWeek, noOfRefillRule.MaxRefillsPerMonth);

            noOfRefillRule.RuleName = request.RuleName;
            noOfRefillRule.IsActive = request.IsActive;
            noOfRefillRule.MaxRefillsPerDay = request.MaxRefillsPerDay;
            noOfRefillRule.MaxRefillsPerWeek = request.MaxRefillsPerWeek;
            noOfRefillRule.MaxRefillsPerMonth = request.MaxRefillsPerMonth;

            _logger.LogInformation("UpdateNoOfRefillRule: After assignment - MaxRefillsPerDay={MaxRefillsPerDay}, MaxRefillsPerWeek={MaxRefillsPerWeek}, MaxRefillsPerMonth={MaxRefillsPerMonth}",
                noOfRefillRule.MaxRefillsPerDay, noOfRefillRule.MaxRefillsPerWeek, noOfRefillRule.MaxRefillsPerMonth);

            var saveResult = await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("UpdateNoOfRefillRule: SaveChangesAsync returned {SaveResult} rows affected", saveResult);

            return new FMSResponseMessage(true, "No-of-refill rule updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating no-of-refill rule");
            return new FMSResponseMessage(false, "Error updating no-of-refill rule");
        }
    }
}