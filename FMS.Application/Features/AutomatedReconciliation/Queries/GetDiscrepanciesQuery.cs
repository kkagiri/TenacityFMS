//Cursor - CQRS Query for retrieving reconciliation discrepancies
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.FMS.AutomatedReconciliation;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.AutomatedReconciliation.Queries;

public class GetDiscrepanciesQuery : IRequest<FMSResponse<PagedResult<ReconciliationDiscrepancyDTO>>> {
    public int? SiteId { get; set; }
    public int? TankId { get; set; }
    public string? Severity { get; set; }
    public bool? IsResolved { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal? MinVariance { get; set; }
    public decimal? MaxVariance { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; } = "DetectedAt";
    public string? SortOrder { get; set; } = "desc";
}

public class GetDiscrepanciesQueryHandler : IRequestHandler<GetDiscrepanciesQuery, FMSResponse<PagedResult<ReconciliationDiscrepancyDTO>>> {
    //Cursor - Inject required dependencies
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    public GetDiscrepanciesQueryHandler (GpsdataContext context, IMapper mapper) {
        _context = context;
        _mapper = mapper;
    }

    public async Task<FMSResponse<PagedResult<ReconciliationDiscrepancyDTO>>> Handle (
        GetDiscrepanciesQuery request,
        CancellationToken cancellationToken) {
        try {
            //Cursor - Validate pagination parameters
            if (request.PageNumber <= 0) {
                return FMSResponse<PagedResult<ReconciliationDiscrepancyDTO>>.ValidationFailed (
                    new List<string> { "Page number must be greater than 0" });
            }

            if (request.PageSize <= 0 || request.PageSize > 100) {
                return FMSResponse<PagedResult<ReconciliationDiscrepancyDTO>>.ValidationFailed (
                    new List<string> { "Page size must be between 1 and 100" });
            }

            //Cursor - Build query with includes for related data
            var query = _context.ReconciliationDiscrepancies
                .Include (d => d.Tank)
                .ThenInclude (t => t.Site)
                .Include (d => d.PolicyExecution)
                .ThenInclude (pe => pe.Policy)
                .AsQueryable ();

            //Cursor - Apply filters
            if (request.SiteId.HasValue) {
                query = query.Where (d => d.Tank.SiteId == request.SiteId.Value);
            }

            if (request.TankId.HasValue) {
                query = query.Where (d => d.TankId == request.TankId.Value);
            }

            if (!string.IsNullOrEmpty (request.Severity)) {
                if (Enum.TryParse<Domain.Entities.enums.DiscrepancySeverity> (request.Severity, true, out var severityEnum)) {
                    query = query.Where (d => d.Severity == severityEnum);
                }
            }

            if (request.IsResolved.HasValue) {
                query = query.Where (d => d.IsResolved == request.IsResolved.Value);
            }

            if (request.StartDate.HasValue) {
                query = query.Where (d => d.DetectedAt >= request.StartDate.Value);
            }

            if (request.EndDate.HasValue) {
                query = query.Where (d => d.DetectedAt <= request.EndDate.Value);
            }

            if (request.MinVariance.HasValue) {
                query = query.Where (d => Math.Abs (d.AbsoluteVariance) >= request.MinVariance.Value);
            }

            if (request.MaxVariance.HasValue) {
                query = query.Where (d => Math.Abs (d.AbsoluteVariance) <= request.MaxVariance.Value);
            }

            //Cursor - Apply sorting
            switch (request.SortBy?.ToLower ()) {
                case "detectedat":
                    query = request.SortOrder?.ToLower () == "asc" ?
                        query.OrderBy (d => d.DetectedAt) :
                        query.OrderByDescending (d => d.DetectedAt);
                    break;
                case "tankname":
                    query = request.SortOrder?.ToLower () == "asc" ?
                        query.OrderBy (d => d.Tank.Name) :
                        query.OrderByDescending (d => d.Tank.Name);
                    break;
                case "sitename":
                    query = request.SortOrder?.ToLower () == "asc" ?
                        query.OrderBy (d => d.Tank.Site.Name) :
                        query.OrderByDescending (d => d.Tank.Site.Name);
                    break;
                case "severity":
                    query = request.SortOrder?.ToLower () == "asc" ?
                        query.OrderBy (d => d.Severity) :
                        query.OrderByDescending (d => d.Severity);
                    break;
                case "absolutevariance":
                    query = request.SortOrder?.ToLower () == "asc" ?
                        query.OrderBy (d => Math.Abs (d.AbsoluteVariance)) :
                        query.OrderByDescending (d => Math.Abs (d.AbsoluteVariance));
                    break;
                case "businessimpactscore":
                    query = request.SortOrder?.ToLower () == "asc" ?
                        query.OrderBy (d => d.BusinessImpactScore ?? 0) :
                        query.OrderByDescending (d => d.BusinessImpactScore ?? 0);
                    break;
                case "isresolved":
                    query = request.SortOrder?.ToLower () == "asc" ?
                        query.OrderBy (d => d.IsResolved) :
                        query.OrderByDescending (d => d.IsResolved);
                    break;
                default:
                    query = query.OrderByDescending (d => d.DetectedAt);
                    break;
            }

            //Cursor - Get total count before pagination
            var totalCount = await query.CountAsync (cancellationToken);

            //Cursor - Apply pagination
            var discrepancies = await query
                .Skip ((request.PageNumber - 1) * request.PageSize)
                .Take (request.PageSize)
                .ToListAsync (cancellationToken);

            //Cursor - Map to DTOs using AutoMapper
            var discrepancyDtos = new List<ReconciliationDiscrepancyDTO> ();

            foreach (var discrepancy in discrepancies) {
                var discrepancyDto = _mapper.Map<ReconciliationDiscrepancyDTO> (discrepancy);
                discrepancyDto.TankName = discrepancy.Tank?.Name ?? "Unknown Tank";
                discrepancyDto.SiteName = discrepancy.Tank?.Site?.Name ?? "Unknown Site";
                discrepancyDtos.Add (discrepancyDto);
            }

            //Cursor - Create paged result
            var pagedResult = new PagedResult<ReconciliationDiscrepancyDTO> {
                Items = discrepancyDtos,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalPages = (int) Math.Ceiling ((double) totalCount / request.PageSize)
            };

            return FMSResponse<PagedResult<ReconciliationDiscrepancyDTO>>.Success (
                pagedResult,
                $"Retrieved {discrepancyDtos.Count} discrepancies successfully");
        } catch (Exception ex) {
            return FMSResponse<PagedResult<ReconciliationDiscrepancyDTO>>.SystemError (
                $"Failed to retrieve discrepancies: {ex.Message}");
        }
    }
}