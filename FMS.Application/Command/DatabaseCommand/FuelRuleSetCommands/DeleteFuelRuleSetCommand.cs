using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;

namespace FMS.Application.Commands.FuelRuleSetCommands
{
    public class DeleteFuelRuleSetCommand : IRequest<bool>
    {
        public int Id { get; set; }
    }

    public class DeleteFuelRuleSetCommandHandler : IRequestHandler<DeleteFuelRuleSetCommand, bool>
    {
        private readonly GpsdataContext _context;

        public DeleteFuelRuleSetCommandHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(DeleteFuelRuleSetCommand request, CancellationToken cancellationToken)
        {
            var ruleSet = await _context.FuelingRuleSets
                .FindAsync(new object[] { request.Id }, cancellationToken);

            if (ruleSet == null)
                return false;

            _context.FuelingRuleSets.Remove(ruleSet);
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }


    }
}