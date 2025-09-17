using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.Rules.Commands.NoOfRefilRules;

public record DeleteNoOfRefillRuleCommand(int RuleId) : IRequest<FMSResponseMessage>;

public class DeleteNoOfRefillRuleCommandHandler : IRequestHandler<DeleteNoOfRefillRuleCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteNoOfRefillRuleCommandHandler> _logger;

    public DeleteNoOfRefillRuleCommandHandler(GpsdataContext context, ILogger<DeleteNoOfRefillRuleCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(DeleteNoOfRefillRuleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var rule = await _context.FuelingRules.FindAsync(new object[] { request.RuleId }, cancellationToken);
            if (rule is not NoOfRefillRule)
                return new FMSResponseMessage(false, "No-of-refill rule not found");

            _context.FuelingRules.Remove(rule);
            await _context.SaveChangesAsync(cancellationToken);

            return new FMSResponseMessage(true, "No-of-refill rule deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting no-of-refill rule");
            return new FMSResponseMessage(false, "Error deleting no-of-refill rule");
        }
    }
}