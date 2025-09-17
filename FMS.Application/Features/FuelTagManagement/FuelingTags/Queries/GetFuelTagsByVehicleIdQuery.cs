using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingTags.Queries
{
    public record GetFuelTagsByVehicleIdQuery (int VehicleId) : IRequest<IEnumerable<FuelTag>>;

    public class GetTagsByVehicleIdQueryHandler : IRequestHandler<GetFuelTagsByVehicleIdQuery, IEnumerable<FuelTag>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetTagsByVehicleIdQueryHandler> _logger;

        public GetTagsByVehicleIdQueryHandler (GpsdataContext context, ILogger<GetTagsByVehicleIdQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<FuelTag>> Handle (GetFuelTagsByVehicleIdQuery request, CancellationToken cancellationToken) {
            try {
                return await _context.FuelTags
                    .Where (t => t.VehicleId == request.VehicleId)
                    .Include (t => t.FuelRuleSet)
                    .Include (t => t.Vehicle)
                    .ThenInclude (v => v.VehicleType)
                    .ToListAsync (cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving tags for vehicle with ID {VehicleId}", request.VehicleId);
                throw;
            }
        }
    }
}