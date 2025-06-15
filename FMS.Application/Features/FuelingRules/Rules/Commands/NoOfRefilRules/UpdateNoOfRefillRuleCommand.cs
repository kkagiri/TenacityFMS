using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.FuelRules.Rules;

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
            var rule = await _context.FuelingRules.FindAsync(new object[] { request.RuleId }, cancellationToken);
            if (rule is not NoOfRefillRule noOfRefillRule)
                return new FMSResponseMessage(false, "No-of-refill rule not found");

            noOfRefillRule.RuleName = request.RuleName;
            noOfRefillRule.IsActive = request.IsActive;
            noOfRefillRule.MaxRefillsPerDay = request.MaxRefillsPerDay;
            noOfRefillRule.MaxRefillsPerWeek = request.MaxRefillsPerWeek;
            noOfRefillRule.MaxRefillsPerMonth = request.MaxRefillsPerMonth;

            await _context.SaveChangesAsync(cancellationToken);

            return new FMSResponseMessage(true, "No-of-refill rule updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating no-of-refill rule");
            return new FMSResponseMessage(false, "Error updating no-of-refill rule");
        }
    }
}