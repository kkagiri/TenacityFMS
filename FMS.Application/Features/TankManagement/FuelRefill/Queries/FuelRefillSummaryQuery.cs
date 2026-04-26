using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.FuelRefil;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
namespace FMS.Application.Queries.Database.FMSQuery.FuelRefilQueries;

public record FuelRefillSummaryQuery (DateTime StartDate, DateTime EndDate, int? SiteId) : IRequest<List<RefillSummaryDTO>>;

public class FuelRefillSummaryQueryHandler : IRequestHandler<FuelRefillSummaryQuery, List<RefillSummaryDTO>> {
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    private readonly ILogger<FuelRefillSummaryQueryHandler> _logger;

    public FuelRefillSummaryQueryHandler (GpsdataContext context, IMapper mapper, ILogger<FuelRefillSummaryQueryHandler> logger) {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<RefillSummaryDTO>> Handle (FuelRefillSummaryQuery request, CancellationToken cancellationToken) {
        try {
            var query = from fr in _context.FuelRefills
            join v in _context.Vehicles on fr.VehicleId equals v.VehicleId
            join vt in _context.Vehicletypes on v.VehicleTypeId equals vt.Id
            join s in _context.Sites on fr.SiteId equals s.Id
            where fr.Date >= request.StartDate && fr.Date <= request.EndDate
            select new { fr, v, vt, s };

            if (request.SiteId.HasValue) {
                query = query.Where (x => x.s.Id == request.SiteId.Value);
            }

            var result = await query
                .GroupBy (x => new { VehicleTypeName = x.vt.Name, VehicleCode = x.v.VehicleCode, SiteName = x.s.Name })
                .Select (g => new RefillSummaryDTO {
                    VehicleType = g.Key.VehicleTypeName,
                        VehicleName = g.Key.VehicleCode,
                        SiteName = g.Key.SiteName,
                        RefillCount = g.Count (),
                        TotalRefillAmount = g.Sum (x => x.fr.ManualFuelrefillAmount ?? 0),
                        DistanceOrEngineHours = g.Sum (x => x.fr.CurrentMeterReading ?? 0) - g.Sum (x => x.fr.PreviousMeterReading ?? 0)
                })
                .ToListAsync (cancellationToken);

            return result;
        } catch (Exception ex) {
            _logger.LogError (ex, "Error in FuelRefillSummaryQueryHandler");
            throw;
        }
    }
}