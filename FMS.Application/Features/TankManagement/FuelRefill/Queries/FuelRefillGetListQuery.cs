using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.FuelRefil;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.FuelRefilQueries;

//Cursor - Enhanced FuelRefillGetListQuery with filtering support
public record FuelRefillGetListQuery (
    int Take = 100,
    int Skip = 0,
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    int? SiteId = null
) : IRequest<List<FuelRefilDTO>>;

public class FuelRefillGetListQueryHandler : IRequestHandler<FuelRefillGetListQuery, List<FuelRefilDTO>> {

    private readonly GpsdataContext _context;
    private readonly ILogger<FuelRefillGetListQueryHandler> _logger;
    private readonly IMapper _mapper;

    public FuelRefillGetListQueryHandler (GpsdataContext context, ILogger<FuelRefillGetListQueryHandler> logger, IMapper mapper) {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    //Cursor - Enhanced Handle method with filtering support
    public async Task<List<FuelRefilDTO>> Handle (FuelRefillGetListQuery request, CancellationToken cancellationToken) {
        try {
            var query = _context.FuelRefills.AsQueryable ();

            // Apply date range filter
            if (request.StartDate.HasValue) {
                query = query.Where (f => f.Date >= request.StartDate.Value);
            }

            if (request.EndDate.HasValue) {
                // Add one day to include records from the end date
                var endDate = request.EndDate.Value.AddDays (1);
                query = query.Where (f => f.Date < endDate);
            }

            // Apply site filter
            if (request.SiteId.HasValue) {
                query = query.Where (f => f.SiteId == request.SiteId.Value);
            }

            var fuelRefils = await query
                .OrderByDescending (x => x.Date)
                .Skip (request.Skip)
                .Take (request.Take)
                .ToListAsync (cancellationToken);

            var fuelRefilDTOs = _mapper.Map<List<FuelRefilDTO>> (fuelRefils);
            return fuelRefilDTOs;
        } catch (Exception ex) {
            _logger.LogError (ex, "Error fetching fuel refil data with filters. StartDate: {StartDate}, EndDate: {EndDate}, SiteId: {SiteId}",
                request.StartDate, request.EndDate, request.SiteId);
            throw new Exception (ex.Message);
        }
    }
}