using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRuleSet;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.FuelRules;

public record CreateFuelRuleSetCommand(string RuleName) : IRequest<FMSResponseMessage>;


public class CreateFuelRuleSetCommandHandler : IRequestHandler<CreateFuelRuleSetCommand, FMSResponseMessage>
{

    private readonly GpsdataContext _context;
    private readonly ILogger<CreateFuelRuleSetCommandHandler> _logger;
    private readonly IMediator _mediator;


    public CreateFuelRuleSetCommandHandler(GpsdataContext context, ILogger<CreateFuelRuleSetCommandHandler> logger, IMediator mediator)
    {
        _context = context;
        _logger = logger;
        _mediator = mediator;
    }


    public async Task<FMSResponseMessage> Handle(CreateFuelRuleSetCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var ruleSet = new FuelingRuleSet
            {
                Name = request.RuleName
            };

            await _context.FuelingRuleSets.AddAsync(ruleSet, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new FMSResponseMessage(true, "Fuel rule created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating fuel rule");
            return new FMSResponseMessage(false, "Error creating fuel rule");
        }
    }
}
