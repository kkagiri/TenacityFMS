
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.FuelRules.Rules;


public record DeleteDailyMonthlyLimitRuleCommand(int RuleId) : IRequest<FMSResponseMessage>;

public class DeleteDailyMonthlyLimitRuleCommandHandler : IRequestHandler<DeleteDailyMonthlyLimitRuleCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteDailyMonthlyLimitRuleCommandHandler> _logger;

    public DeleteDailyMonthlyLimitRuleCommandHandler(GpsdataContext context, ILogger<DeleteDailyMonthlyLimitRuleCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(DeleteDailyMonthlyLimitRuleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var rule = await _context.FuelingRules.FindAsync(new object[] { request.RuleId }, cancellationToken);
            if (rule is not DailyMonthlyLimitRule)
                return new FMSResponseMessage(false, "Daily/Monthly limit rule not found");

            _context.FuelingRules.Remove(rule);
            await _context.SaveChangesAsync(cancellationToken);

            return new FMSResponseMessage(true, "Daily/Monthly limit rule deleted");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting daily/monthly limit rule");
            return new FMSResponseMessage(false, "Error deleting daily/monthly limit rule");
        }
    }
}
