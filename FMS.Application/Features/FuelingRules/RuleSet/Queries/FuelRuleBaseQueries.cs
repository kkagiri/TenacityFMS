using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRuleSet;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FuelRulesQueries
{
    public record GetFuelRuleSetByIDQuery(int Id) : IRequest<FuelingRuleSet>;
    public record GetAllFuelRuleSetsQuery : IRequest<IEnumerable<FuelingRuleSet>>;
    public record GetFuelRuleQuery(int Id) : IRequest<FuelingRule>;

    public record GetFuelRuleByVehicleType(int VehicleTypeID) : IRequest<IEnumerable<FuelingRuleSet>>;
}

#region Base Queries
namespace FMS.Application.Queries.Database.FuelRulesQueries
{
    public class GetFuelRuleSetQueryByIdHandler : IRequestHandler<GetFuelRuleSetByIDQuery, FuelingRuleSet>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetFuelRuleSetQueryByIdHandler> _logger;

        public GetFuelRuleSetQueryByIdHandler(GpsdataContext context, ILogger<GetFuelRuleSetQueryByIdHandler> logger)
        {
            _logger = logger;
            _context = context;
        }

        public async Task<FuelingRuleSet> Handle(GetFuelRuleSetByIDQuery request, CancellationToken cancellationToken)
        {
            return await _context.FuelingRuleSets
                .Include(rs => rs.Rules)
                .FirstOrDefaultAsync(rs => rs.Id == request.Id, cancellationToken);
        }
    }

    public class GetAllFuelRuleSetsHandler : IRequestHandler<GetAllFuelRuleSetsQuery, IEnumerable<FuelingRuleSet>>
    {
        private readonly GpsdataContext _context;

        public GetAllFuelRuleSetsHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<FuelingRuleSet>> Handle(GetAllFuelRuleSetsQuery request, CancellationToken cancellationToken)
        {
            return await _context.FuelingRuleSets
                .Include(rs => rs.Rules)
                .ToListAsync(cancellationToken);
        }
    }
}
#endregion

