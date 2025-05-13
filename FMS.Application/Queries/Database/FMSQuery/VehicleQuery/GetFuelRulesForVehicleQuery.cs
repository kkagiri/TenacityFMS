using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.Database.FMSQuery.VehicleQuery {
    public record GetFuelRulesForVehicleQuery (int VehicleId) : IRequest<List<FuelingRule>>;

    public class GetFuelRulesForVehicleQueryHandler : IRequestHandler<GetFuelRulesForVehicleQuery, List<FuelingRule>> {
        private readonly GpsdataContext _context;

        public GetFuelRulesForVehicleQueryHandler (GpsdataContext context) {
            _context = context;
        }

        public async Task<List<FuelingRule>> Handle (GetFuelRulesForVehicleQuery request, CancellationToken cancellationToken) {
            try {
                var rules = await _context.FuelingRules
                    .Where (r => r.VehicleId == request.VehicleId && r.IsActive)
                    .ToListAsync (cancellationToken);

                return rules;
            } catch (Exception ex) {
                throw new Exception ($"Error fetching fuel rules for vehicle {request.VehicleId}: {ex.Message}", ex);
            }
        }
    }
}