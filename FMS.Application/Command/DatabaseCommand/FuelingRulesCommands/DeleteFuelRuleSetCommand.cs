using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.FuelingRulesCommands
{
    public record DeleteFuelRuleSetCommand(int Id) : IRequest<FMSResponseMessage>;

    public class DeleteFuelRuleSetCommandHandler : IRequestHandler<DeleteFuelRuleSetCommand, FMSResponseMessage>
    {

        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteFuelRuleSetCommandHandler> _logger;

        public DeleteFuelRuleSetCommandHandler(GpsdataContext context, ILogger<DeleteFuelRuleSetCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage> Handle(DeleteFuelRuleSetCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var rule = await _context.FuelingRuleSets.FindAsync(request.Id);

                if (rule == null) return new FMSResponseMessage(false, "RuleSet Not Found");

                _context.FuelingRuleSets.Remove(rule);

                await _context.SaveChangesAsync(cancellationToken);

                return new FMSResponseMessage(true, "RuleSet Deleted SuccessFully");


            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error Deleting RuleSet");
                return new FMSResponseMessage(false, "Error Deleting RuleSet");
            }
        }
    }


}