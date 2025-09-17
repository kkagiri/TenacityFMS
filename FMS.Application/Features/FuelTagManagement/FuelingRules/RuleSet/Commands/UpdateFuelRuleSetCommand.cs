using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.RuleSet.Commands
{

    public record UpdateFuelRuleSetCommand(
     int Id,
     string Name
 ) : IRequest<FMSResponseMessage>;


    public class UpdateFuelRuleSetHandler : IRequestHandler<UpdateFuelRuleSetCommand, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<UpdateFuelRuleSetHandler> _logger;

        public UpdateFuelRuleSetHandler(GpsdataContext context, ILogger<UpdateFuelRuleSetHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage> Handle(UpdateFuelRuleSetCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var ruleSet = await _context.FuelingRuleSets.FindAsync(request.Id);
                if (ruleSet == null)
                    return new FMSResponseMessage(false, "Rule set not found");

                ruleSet.Name = request.Name;
                await _context.SaveChangesAsync(cancellationToken);

                return new FMSResponseMessage(true, "Rule set updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating rule set");
                return new FMSResponseMessage(false, "Error updating rule set");
            }
        }
    }
}
