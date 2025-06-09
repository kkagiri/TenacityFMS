using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRuleSet;
using FMS.Persistence.DataAccess;
using MediatR;

namespace FMS.Application.Commands.FuelRuleSetCommands {
    public class CreateFuelRuleSetCommand : IRequest<FMSResponseMessage> {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class CreateFuelRuleSetCommandHandler : IRequestHandler<CreateFuelRuleSetCommand, FMSResponseMessage> {
        private readonly GpsdataContext _context;

        public CreateFuelRuleSetCommandHandler (GpsdataContext context) {
            _context = context;
        }

        public async Task<FMSResponseMessage> Handle (CreateFuelRuleSetCommand request, CancellationToken cancellationToken) {
            try {

                if (string.IsNullOrEmpty (request.Name) || string.IsNullOrEmpty (request.Description)) {
                    return new FMSResponseMessage (false, "Name and Description are required");
                }

                var ruleSet = new FuelingRuleSet {
                    Name = request.Name,
                    Description = request.Description

                };

                _context.FuelingRuleSets.Add (ruleSet);
                await _context.SaveChangesAsync (cancellationToken);
                return new FMSResponseMessage (true, "Fuel Rule Set created successfully");
            } catch (Exception ex) {
                return new FMSResponseMessage (false, ex.Message);
            }

        }
    }
}