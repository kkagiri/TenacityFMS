
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.FuelRules.Rules;
public record UpdateDailyMonthlyLimitRuleCommand(
    int RuleId,
    string RuleName,
    bool IsActive,
    int? DailyLimitLiter,
    int? MonthlyLimitLiter
) : IRequest<FMSResponseMessage>;

public class UpdateDailyMonthlyLimitRuleCommandHandler : IRequestHandler<UpdateDailyMonthlyLimitRuleCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateDailyMonthlyLimitRuleCommandHandler> _logger;

    public UpdateDailyMonthlyLimitRuleCommandHandler(GpsdataContext context, ILogger<UpdateDailyMonthlyLimitRuleCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(UpdateDailyMonthlyLimitRuleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var rule = await _context.FuelingRules.FindAsync(new object[] { request.RuleId }, cancellationToken);
            if (rule is not DailyMonthlyLimitRule dailyMonthlyRule)
                return new FMSResponseMessage(false, "Daily/Monthly limit rule not found");

            dailyMonthlyRule.RuleName = request.RuleName;
            dailyMonthlyRule.IsActive = request.IsActive;
            dailyMonthlyRule.DailyLimitLiter = request.DailyLimitLiter;
            dailyMonthlyRule.MonthlyLimitLiter = request.MonthlyLimitLiter;

            await _context.SaveChangesAsync(cancellationToken);

            return new FMSResponseMessage(true, "Daily/Monthly limit rule updated");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating daily/monthly limit rule");
            return new FMSResponseMessage(false, "Error updating daily/monthly limit rule");
        }
    }
}
