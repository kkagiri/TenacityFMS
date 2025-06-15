


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
    public record DeleteFuelRuleCommand(int Id) : IRequest<FMSResponseMessage>;

    public class DeleteFuelRuleCommandHandler : IRequestHandler<DeleteFuelRuleCommand, FMSResponseMessage>
    {

        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteFuelRuleCommandHandler> _logger;

        public DeleteFuelRuleCommandHandler(GpsdataContext context, ILogger<DeleteFuelRuleCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage> Handle(DeleteFuelRuleCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var rule = await _context.FuelingRules.FindAsync(request.Id);

                if (rule == null) return new FMSResponseMessage(false, "Rule Not Found");

                _context.FuelingRules.Remove(rule);

                await _context.SaveChangesAsync(cancellationToken);

                return new FMSResponseMessage(true, "Rule Deleted SuccessFully");


            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error Deleting Rule");
                return new FMSResponseMessage(false, "Error Deleting Rule");
            }
        }
    }


}