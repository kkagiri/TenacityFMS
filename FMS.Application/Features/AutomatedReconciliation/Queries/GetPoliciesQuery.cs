//Cursor - CQRS Query for retrieving reconciliation policies
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.AutomatedReconciliation;
using FMS.Persistence.DataAccess;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.AutomatedReconciliation.Queries;

public class GetPoliciesQuery : IRequest<FMSResponse<PagedResult<ReconciliationPolicyDTO>>>
{
    public bool? IsActive { get; set; }
    public int? SiteId { get; set; }
    public string? PolicyType { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetPoliciesQueryHandler : IRequestHandler<GetPoliciesQuery, FMSResponse<PagedResult<ReconciliationPolicyDTO>>>
{
    //Cursor - Inject required dependencies
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    public GetPoliciesQueryHandler(GpsdataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<FMSResponse<PagedResult<ReconciliationPolicyDTO>>> Handle(
        GetPoliciesQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            //Cursor - Validate pagination parameters
            if (request.PageNumber <= 0)
            {
                return FMSResponse<PagedResult<ReconciliationPolicyDTO>>.ValidationFailed(
                    new List<string> { "Page number must be greater than 0" });
            }

            if (request.PageSize <= 0 || request.PageSize > 100)
            {
                return FMSResponse<PagedResult<ReconciliationPolicyDTO>>.ValidationFailed(
                    new List<string> { "Page size must be between 1 and 100" });
            }

            //Cursor - Build query with filters
            var query = _context.ReconciliationPolicies
                .Include(p => p.Site)
                .AsQueryable();

            //Cursor - Apply filters
            if (request.IsActive.HasValue)
            {
                query = query.Where(p => p.IsActive == request.IsActive.Value);
            }

            if (request.SiteId.HasValue)
            {
                query = query.Where(p => p.SiteId == request.SiteId.Value);
            }

            if (!string.IsNullOrEmpty(request.PolicyType))
            {
                if (Enum.TryParse<Domain.Entities.enums.ReconciliationPolicyType>(request.PolicyType, true, out var policyTypeEnum))
                {
                    query = query.Where(p => p.PolicyType == policyTypeEnum);
                }
            }

            //Cursor - Get total count before pagination
            var totalCount = await query.CountAsync(cancellationToken);

            //Cursor - Apply pagination and ordering
            var policies = await query
                .OrderBy(p => p.Name)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            //Cursor - Get execution statistics for all policies in the current page
            var policyIds = policies.Select(p => p.Id).ToList();
            var executionStats = await _context.ReconciliationPolicyExecutions
                .Where(e => policyIds.Contains(e.PolicyId))
                .GroupBy(e => e.PolicyId)
                .Select(g => new
                {
                    PolicyId = g.Key,
                    TotalExecutions = g.Count(),
                    SuccessfulExecutions = g.Count(e => e.Status == Domain.Entities.enums.ReconciliationExecutionStatus.Completed),
                    AverageExecutionDurationMs = g.Where(e => e.ExecutionDurationMs.HasValue).Average(e => (decimal?)e.ExecutionDurationMs),
                    TotalTanksReconciled = g.Sum(e => e.TanksReconciled),
                    LastExecuted = g.Max(e => (DateTime?)e.ExecutionStartTime)
                })
                .ToListAsync(cancellationToken);

            //Cursor - Map to DTOs using AutoMapper
            var policyDtos = _mapper.Map<List<ReconciliationPolicyDTO>>(policies);

            //Cursor - Apply execution statistics
            foreach (var dto in policyDtos)
            {
                var stats = executionStats.FirstOrDefault(s => s.PolicyId == dto.Id);
                if (stats != null)
                {
                    dto.TotalExecutions = stats.TotalExecutions;
                    dto.SuccessfulExecutions = stats.SuccessfulExecutions;
                    dto.AverageExecutionDurationMs = stats.AverageExecutionDurationMs;
                    dto.TotalTanksReconciled = stats.TotalTanksReconciled;
                    dto.LastExecuted = stats.LastExecuted;
                }

                //Cursor - Calculate next execution for scheduled policies
                var policy = policies.FirstOrDefault(p => p.Id == dto.Id);
                if (policy?.PolicyType == Domain.Entities.enums.ReconciliationPolicyType.Scheduled
                    && policy.ScheduleFrequencyHours.HasValue
                    && dto.LastExecuted.HasValue)
                {
                    dto.NextExecution = dto.LastExecuted.Value.AddHours(policy.ScheduleFrequencyHours.Value);
                }
            }

            //Cursor - Create paged result
            var pagedResult = new PagedResult<ReconciliationPolicyDTO>
            {
                Items = policyDtos,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize)
            };

            return FMSResponse<PagedResult<ReconciliationPolicyDTO>>.Success(
                pagedResult,
                $"Retrieved {policyDtos.Count} policies successfully");
        }
        catch (Exception ex)
        {
            return FMSResponse<PagedResult<ReconciliationPolicyDTO>>.SystemError(
                $"Failed to retrieve policies: {ex.Message}");
        }
    }
}

// Paged result helper class
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}