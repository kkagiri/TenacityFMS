using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;

namespace FMS.Application.Commands.FuelRuleSetCommands
{
    public class UpdateFuelRuleSetCommand : IRequest<bool>
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
    }

    public class UpdateFuelRuleSetCommandHandler : IRequestHandler<UpdateFuelRuleSetCommand, bool>
    {
        private readonly GpsdataContext _context;

        public UpdateFuelRuleSetCommandHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(UpdateFuelRuleSetCommand request, CancellationToken cancellationToken)
        {
            var ruleSet = await _context.FuelingRuleSets
                .FindAsync(new object[] { request.Id }, cancellationToken);

            if (ruleSet == null)
                return false;

            ruleSet.Name = request.Name;
            ruleSet.Description = request.Description;
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}