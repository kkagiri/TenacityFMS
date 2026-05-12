//Cursor - CQRS Query for retrieving reconciliation policy executions
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

public class GetExecutionsQuery : IRequest<FMSResponse<PagedResult<ReconciliationPolicyExecutionDTO>>> {
    public int? PolicyId { get; set; }
    public string? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? SiteId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; } = "ExecutionStartTime";
    public string? SortOrder { get; set; } = "desc";
}

public class GetExecutionsQueryHandler : IRequestHandler<GetExecutionsQuery, FMSResponse<PagedResult<ReconciliationPolicyExecutionDTO>>> {
    //Cursor - Inject required dependencies
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    public GetExecutionsQueryHandler (GpsdataContext context, IMapper mapper) {
        _context = context;
        _mapper = mapper;
    }

    public async Task<FMSResponse<PagedResult<ReconciliationPolicyExecutionDTO>>> Handle (
        GetExecutionsQuery request,
        CancellationToken cancellationToken) {

        try {
            //Cursor - Validate pagination parameters
            if (request.PageNumber <= 0) {
                return FMSResponse<PagedResult<ReconciliationPolicyExecutionDTO>>.ValidationFailed (
                    new List<string> { "Page number must be greater than 0" });
            }

            if (request.PageSize <= 0 || request.PageSize > 100) {
                return FMSResponse<PagedResult<ReconciliationPolicyExecutionDTO>>.ValidationFailed (
                    new List<string> { "Page size must be between 1 and 100" });
            }

            //Cursor - Build query with includes
            var query = _context.ReconciliationPolicyExecutions
                .Include (e => e.Policy)
                .ThenInclude (p => p.Site)
                .Include (e => e.Discrepancies)
                .AsQueryable ();

            //Cursor - Apply filters
            if (request.PolicyId.HasValue) {
                query = query.Where (e => e.PolicyId == request.PolicyId.Value);
            }

            if (!string.IsNullOrEmpty (request.Status)) {
                if (Enum.TryParse<Domain.Entities.enums.ReconciliationExecutionStatus> (request.Status, true, out var statusEnum)) {
                    query = query.Where (e => e.Status == statusEnum);
                }
            }

            if (request.StartDate.HasValue) {
                query = query.Where (e => e.ExecutionStartTime >= request.StartDate.Value);
            }

            if (request.EndDate.HasValue) {
                query = query.Where (e => e.ExecutionStartTime <= request.EndDate.Value);
            }

            if (request.SiteId.HasValue) {
                query = query.Where (e => e.Policy.SiteId == request.SiteId.Value);
            }

            //Cursor - Apply sorting
            switch (request.SortBy?.ToLower ()) {
                case "executionstarttime":
                    query = request.SortOrder?.ToLower () == "asc" ?
                        query.OrderBy (e => e.ExecutionStartTime) :
                        query.OrderByDescending (e => e.ExecutionStartTime);
                    break;
                case "policyname":
                    query = request.SortOrder?.ToLower () == "asc" ?
                        query.OrderBy (e => e.Policy.Name) :
                        query.OrderByDescending (e => e.Policy.Name);
                    break;
                case "status":
                    query = request.SortOrder?.ToLower () == "asc" ?
                        query.OrderBy (e => e.Status) :
                        query.OrderByDescending (e => e.Status);
                    break;
                case "tanksreconciled":
                    query = request.SortOrder?.ToLower () == "asc" ?
                        query.OrderBy (e => e.TanksReconciled) :
                        query.OrderByDescending (e => e.TanksReconciled);
                    break;
                default:
                    query = query.OrderByDescending (e => e.ExecutionStartTime);
                    break;
            }

            //Cursor - Get total count before pagination
            var totalCount = await query.CountAsync (cancellationToken);

            //Cursor - Apply pagination
            var executions = await query
                .Skip ((request.PageNumber - 1) * request.PageSize)
                .Take (request.PageSize)
                .ToListAsync (cancellationToken);

            //Cursor - Map to DTOs using AutoMapper
            var executionDtos = _mapper.Map<List<ReconciliationPolicyExecutionDTO>> (executions);

            //Cursor - Create paged result
            var pagedResult = new PagedResult<ReconciliationPolicyExecutionDTO> {
                Items = executionDtos,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalPages = (int) Math.Ceiling ((double) totalCount / request.PageSize)
            };

            return FMSResponse<PagedResult<ReconciliationPolicyExecutionDTO>>.Success (
                pagedResult,
                $"Retrieved {executionDtos.Count} executions successfully");

        } catch (Exception ex) {
            return FMSResponse<PagedResult<ReconciliationPolicyExecutionDTO>>.SystemError (
                $"Failed to retrieve executions: {ex.Message}");
        }
    }
}