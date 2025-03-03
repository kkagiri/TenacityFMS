


using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.Database.FuelRulesQueries.RuleQueries;
public record GetTimeWindowRulesQuery : IRequest<List<TimeWindowRule>>;
public record GetTimeWindowRulesByRuleSetIdQuery(int RuleSetId) : IRequest<List<TimeWindowRule>>;


public class GetTimeWindowRulesQueryHandler : IRequestHandler<GetTimeWindowRulesQuery, List<TimeWindowRule>>
{
    private readonly GpsdataContext _context;

    public GetTimeWindowRulesQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<List<TimeWindowRule>> Handle(GetTimeWindowRulesQuery request, CancellationToken cancellationToken)
    {
        // Returns all TimeWindowRules
        var rules = await _context.FuelingRules
            .OfType<TimeWindowRule>()
            .ToListAsync(cancellationToken);

        return rules;
    }
}


public class GetTimeWindowRulesByRuleSetIdQueryHandler : IRequestHandler<GetTimeWindowRulesByRuleSetIdQuery, List<TimeWindowRule>>
{
    private readonly GpsdataContext _context;

    public GetTimeWindowRulesByRuleSetIdQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<List<TimeWindowRule>> Handle(GetTimeWindowRulesByRuleSetIdQuery request, CancellationToken cancellationToken)
    {
        var rules = await _context.FuelingRules
            .OfType<TimeWindowRule>()
            .Where(r => r.FuelingRuleSetId == request.RuleSetId)
            .ToListAsync(cancellationToken);

        return rules;
    }
}
