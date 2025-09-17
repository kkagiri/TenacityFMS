using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.Rules.Commands.TimeWIndowLimitRule;

public record DeleteTimeWindowRuleCommand(int RuleId) : IRequest<FMSResponseMessage>;

public class DeleteTimeWindowRuleCommandHandler : IRequestHandler<DeleteTimeWindowRuleCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteTimeWindowRuleCommandHandler> _logger;

    public DeleteTimeWindowRuleCommandHandler(GpsdataContext context, ILogger<DeleteTimeWindowRuleCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(DeleteTimeWindowRuleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var rule = await _context.FuelingRules.FindAsync(new object[] { request.RuleId }, cancellationToken);
            if (rule is not TimeWindowRule)
                return new FMSResponseMessage(false, "Time window rule not found");

            _context.FuelingRules.Remove(rule);
            await _context.SaveChangesAsync(cancellationToken);

            return new FMSResponseMessage(true, "Time window rule deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting time window rule");
            return new FMSResponseMessage(false, "Error deleting time window rule");
        }
    }
}