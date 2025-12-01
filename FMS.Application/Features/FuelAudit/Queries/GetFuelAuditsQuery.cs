using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelAudit.Queries
{
    /// <summary>
    /// Query to get list of fuel audits with filtering
    /// </summary>
    public record GetFuelAuditsQuery(FuelAuditFilterDTO Filter)
        : IRequest<FMSResponse<PagedResult<FuelAuditListItemDTO>>>;

    /// <summary>
    /// Handler for GetFuelAuditsQuery
    /// </summary>
    public class GetFuelAuditsQueryHandler
        : IRequestHandler<GetFuelAuditsQuery, FMSResponse<PagedResult<FuelAuditListItemDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetFuelAuditsQueryHandler> _logger;

        public GetFuelAuditsQueryHandler(
            GpsdataContext context,
            ILogger<GetFuelAuditsQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<PagedResult<FuelAuditListItemDTO>>> Handle(
            GetFuelAuditsQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var filter = request.Filter;
                var query = _context.FuelAudits.AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(filter.Status))
                {
                    query = query.Where(a => a.Status == filter.Status);
                }

                if (filter.StartDateFrom.HasValue)
                {
                    query = query.Where(a => a.StartDate >= filter.StartDateFrom.Value);
                }

                if (filter.StartDateTo.HasValue)
                {
                    query = query.Where(a => a.StartDate <= filter.StartDateTo.Value);
                }

                if (filter.EndDateFrom.HasValue)
                {
                    query = query.Where(a => a.EndDate >= filter.EndDateFrom.Value);
                }

                if (filter.EndDateTo.HasValue)
                {
                    query = query.Where(a => a.EndDate <= filter.EndDateTo.Value);
                }

                if (!string.IsNullOrEmpty(filter.AuditNumber))
                {
                    query = query.Where(a => a.AuditNumber.Contains(filter.AuditNumber));
                }

                if (filter.HasUnresolvedFlags.HasValue)
                {
                    if (filter.HasUnresolvedFlags.Value)
                    {
                        query = query.Where(a => a.UnresolvedFlagCount > 0);
                    }
                    else
                    {
                        query = query.Where(a => a.UnresolvedFlagCount == 0);
                    }
                }

                // Get total count before pagination
                var totalCount = await query.CountAsync(cancellationToken);

                // Apply sorting
                query = filter.SortBy?.ToLower() switch
                {
                    "auditumber" => filter.SortDescending
                        ? query.OrderByDescending(a => a.AuditNumber)
                        : query.OrderBy(a => a.AuditNumber),
                    "startdate" => filter.SortDescending
                        ? query.OrderByDescending(a => a.StartDate)
                        : query.OrderBy(a => a.StartDate),
                    "enddate" => filter.SortDescending
                        ? query.OrderByDescending(a => a.EndDate)
                        : query.OrderBy(a => a.EndDate),
                    "status" => filter.SortDescending
                        ? query.OrderByDescending(a => a.Status)
                        : query.OrderBy(a => a.Status),
                    "variance" => filter.SortDescending
                        ? query.OrderByDescending(a => a.SystemVariance)
                        : query.OrderBy(a => a.SystemVariance),
                    _ => query.OrderByDescending(a => a.CreatedAt)
                };

                // Apply pagination
                var pageSize = filter.PageSize > 0 ? filter.PageSize : 20;
                var page = filter.Page > 0 ? filter.Page : 1;
                var skip = (page - 1) * pageSize;

                var audits = await query
                    .Skip(skip)
                    .Take(pageSize)
                    .Select(a => new FuelAuditListItemDTO
                    {
                        Id = a.Id,
                        AuditNumber = a.AuditNumber,
                        StartDate = a.StartDate,
                        EndDate = a.EndDate,
                        Status = a.Status,
                        SystemVariance = a.SystemVariance,
                        SystemVariancePercent = a.SystemVariancePercent,
                        FlagCount = a.FlagCount,
                        UnresolvedFlagCount = a.UnresolvedFlagCount,
                        DataConfidence = a.DataConfidence,
                        CreatedAt = a.CreatedAt,
                        CreatedBy = a.CreatedBy.HasValue ? a.CreatedBy.Value.ToString() : null
                    })
                    .ToListAsync(cancellationToken);

                var result = new PagedResult<FuelAuditListItemDTO>
                {
                    Items = audits,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

                return FMSResponse<PagedResult<FuelAuditListItemDTO>>.Success(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting fuel audits");
                return FMSResponse<PagedResult<FuelAuditListItemDTO>>.Failed($"Error: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Paged result wrapper
    /// </summary>
    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasPreviousPage => Page > 1;
        public bool HasNextPage => Page < TotalPages;
    }
}
