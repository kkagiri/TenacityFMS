using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.Features.FuelRuleSet;
using FMS.Persistence.DataAccess;
using MediatR;

namespace FMS.Application.Commands.FuelRuleSetCommands
{
    public class CreateFuelRuleSetCommand : IRequest<int>
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class CreateFuelRuleSetCommandHandler : IRequestHandler<CreateFuelRuleSetCommand, int>
    {
        private readonly GpsdataContext _context;

        public CreateFuelRuleSetCommandHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<int> Handle(CreateFuelRuleSetCommand request, CancellationToken cancellationToken)
        {
            var ruleSet = new FuelingRuleSet
            {
                Name = request.Name,
                Description = request.Description

            };

            _context.FuelingRuleSets.Add(ruleSet);
            await _context.SaveChangesAsync(cancellationToken);

            return ruleSet.Id;
        }
    }
}