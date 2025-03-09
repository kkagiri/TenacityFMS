
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.Database.FuelRulesQueries.RuleQueries;

public record GetDailyMonthlyLimitRulesQuery : IRequest<List<DailyMonthlyLimitRule>>;

public class GetDailyMonthlyLimitRulesQueryHandler : IRequestHandler<GetDailyMonthlyLimitRulesQuery, List<DailyMonthlyLimitRule>>
{
    private readonly GpsdataContext _context;

    public GetDailyMonthlyLimitRulesQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<List<DailyMonthlyLimitRule>> Handle(GetDailyMonthlyLimitRulesQuery request, CancellationToken cancellationToken)
    {
        // Returns all DailyMonthlyLimitRules
        var rules = await _context.FuelingRules
            .OfType<DailyMonthlyLimitRule>()
            .ToListAsync(cancellationToken);

        return rules;
    }
}
