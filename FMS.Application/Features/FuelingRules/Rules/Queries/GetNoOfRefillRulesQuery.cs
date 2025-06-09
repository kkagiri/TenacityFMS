

using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.Database.FuelRulesQueries.RuleQueries;

public record GetNoOfRefillRulesQuery : IRequest<List<NoOfRefillRule>>;

public record GetNoOfRefillRulesByRuleSetIdQuery(int RuleSetId) : IRequest<List<NoOfRefillRule>>;


public class GetNoOfRefillRulesQueryHandler : IRequestHandler<GetNoOfRefillRulesQuery, List<NoOfRefillRule>>
{
    private readonly GpsdataContext _context;

    public GetNoOfRefillRulesQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<List<NoOfRefillRule>> Handle(GetNoOfRefillRulesQuery request, CancellationToken cancellationToken)
    {
        var rules = await _context.FuelingRules
            .OfType<NoOfRefillRule>()
            .ToListAsync(cancellationToken);

        return rules;
    }
}


public class GetNoOfRefillRulesByRuleSetIdQueryHandler : IRequestHandler<GetNoOfRefillRulesByRuleSetIdQuery, List<NoOfRefillRule>>
{
    private readonly GpsdataContext _context;

    public GetNoOfRefillRulesByRuleSetIdQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<List<NoOfRefillRule>> Handle(GetNoOfRefillRulesByRuleSetIdQuery request, CancellationToken cancellationToken)
    {
        var rules = await _context.FuelingRules
            .OfType<NoOfRefillRule>()
            .Where(r => r.FuelingRuleSetId == request.RuleSetId)
            .ToListAsync(cancellationToken);

        return rules;
    }
}
