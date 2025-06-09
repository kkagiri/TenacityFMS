
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.FuelRules.Rules.TimeWindowRules;
public record UpdateTimeWindowRuleCommand(int RuleId, string RuleName, bool IsActive, TimeSpan StartTime, TimeSpan EndTime) : IRequest<FMSResponseMessage>;

public class UpdateTimeWindowRuleCommandHandler : IRequestHandler<UpdateTimeWindowRuleCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateTimeWindowRuleCommandHandler> _logger;

    public UpdateTimeWindowRuleCommandHandler(GpsdataContext context, ILogger<UpdateTimeWindowRuleCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(UpdateTimeWindowRuleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var rule = await _context.FuelingRules.FindAsync(new object[] { request.RuleId }, cancellationToken);
            if (rule is not TimeWindowRule timeWindowRule)
                return new FMSResponseMessage(false, "TimeWindowRule not found");

            timeWindowRule.RuleName = request.RuleName;
            timeWindowRule.IsActive = request.IsActive;
            timeWindowRule.StartTime = request.StartTime;
            timeWindowRule.EndTime = request.EndTime;

            await _context.SaveChangesAsync(cancellationToken);

            return new FMSResponseMessage(true, "Time window rule updated");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating time window rule");
            return new FMSResponseMessage(false, "Error updating time window rule");
        }
    }
}
