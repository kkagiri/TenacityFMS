using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.TankStock;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.TankStock;

/// <summary>
/// Query to get filtered tank stock list
/// Supports filtering by date range, site IDs, and tank IDs
/// </summary>
public record GetTankStockListQuery(
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    List<int>? SiteIds = null,
    List<int>? TankIds = null
) : IRequest<List<TankStockDTO>>;

public class GetTankStockListQueryHandler : IRequestHandler<GetTankStockListQuery, List<TankStockDTO>> {
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    private readonly ILogger<GetTankStockListQueryHandler> _logger;

    public GetTankStockListQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetTankStockListQueryHandler> logger) {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<TankStockDTO>> Handle (GetTankStockListQuery request, CancellationToken cancellationToken) {
        try {
            var query = _context.Tankstocks.AsQueryable();

            // Filter by date range
            if (request.StartDate.HasValue)
            {
                query = query.Where(ts => ts.EntryDate >= request.StartDate.Value);
            }

            if (request.EndDate.HasValue)
            {
                // Include the entire end date (up to 23:59:59.999)
                var endDateInclusive = request.EndDate.Value.Date.AddDays(1).AddMilliseconds(-1);
                query = query.Where(ts => ts.EntryDate <= endDateInclusive);
            }

            // Filter by site IDs
            if (request.SiteIds != null && request.SiteIds.Any())
            {
                query = query.Where(ts => request.SiteIds.Contains(ts.SiteId));
            }

            // Filter by tank IDs
            if (request.TankIds != null && request.TankIds.Any())
            {
                query = query.Where(ts => request.TankIds.Contains(ts.TankId));
            }

            // Order by entry date descending (most recent first)
            query = query.OrderByDescending(ts => ts.EntryDate);

            var results = await query.ToListAsync(cancellationToken);

            _logger.LogInformation(
                "Retrieved {Count} tank stock records. Filters - StartDate: {StartDate}, EndDate: {EndDate}, SiteIds: {SiteIds}, TankIds: {TankIds}",
                results.Count,
                request.StartDate,
                request.EndDate,
                request.SiteIds != null ? string.Join(",", request.SiteIds) : "none",
                request.TankIds != null ? string.Join(",", request.TankIds) : "none");

            return _mapper.Map<List<TankStockDTO>>(results);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error getting tank stock list");
            throw;
        }

    }
}