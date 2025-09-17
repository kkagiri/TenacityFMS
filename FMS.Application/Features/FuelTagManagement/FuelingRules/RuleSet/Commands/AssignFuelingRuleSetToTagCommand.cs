using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.RuleSet.Commands;

public record AssignFuelingRuleSetToTagCommand (int TagId, int RuleSetId) : IRequest<FMSResponseMessage>;

public class AssignFuelingRuleSetToTagCommandHandler : IRequestHandler<AssignFuelingRuleSetToTagCommand, FMSResponseMessage> {
    private readonly GpsdataContext _context;
    private readonly ILogger<AssignFuelingRuleSetToTagCommandHandler> _logger;

    public AssignFuelingRuleSetToTagCommandHandler (GpsdataContext context, ILogger<AssignFuelingRuleSetToTagCommandHandler> logger) {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle (AssignFuelingRuleSetToTagCommand request, CancellationToken cancellationToken) {
        try {
            var tag = await _context.FuelTags.FindAsync (new object[] { request.TagId }, cancellationToken);
            if (tag == null) return new FMSResponseMessage (false, "Tag not found");

            var ruleSet = await _context.FuelingRuleSets.FindAsync (new object[] { request.RuleSetId }, cancellationToken);
            if (ruleSet == null) return new FMSResponseMessage (false, "Rule set not found");

            tag.FuelRuleSetId = request.RuleSetId;
            await _context.SaveChangesAsync (cancellationToken);

            return new FMSResponseMessage (true, "Rule set assigned to tag successfully");
        } catch (Exception ex) {
            _logger.LogError (ex, "Error assigning rule set to tag");
            return new FMSResponseMessage (false, "Error assigning rule set to tag");
        }
    }
}