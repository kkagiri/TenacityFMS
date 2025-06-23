//Cursor - CQRS Query for retrieving a specific reconciliation policy
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

public class GetPolicyByIdQuery : IRequest<FMSResponse<ReconciliationPolicyDTO>>
{
    public int PolicyId { get; set; }
}

public class GetPolicyByIdQueryHandler : IRequestHandler<GetPolicyByIdQuery, FMSResponse<ReconciliationPolicyDTO>>
{
    //Cursor - Inject required dependencies
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    public GetPolicyByIdQueryHandler(GpsdataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<FMSResponse<ReconciliationPolicyDTO>> Handle(
        GetPolicyByIdQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            //Cursor - Validate policy ID
            if (request.PolicyId <= 0)
            {
                return FMSResponse<ReconciliationPolicyDTO>.ValidationFailed(
                    new List<string> { "Invalid policy ID" });
            }

            //Cursor - Retrieve policy from database with related data
            var policy = await _context.ReconciliationPolicies
                .Include(p => p.Site)
                .FirstOrDefaultAsync(p => p.Id == request.PolicyId, cancellationToken);

            if (policy == null)
            {
                return FMSResponse<ReconciliationPolicyDTO>.Failed(
                    $"Policy with ID {request.PolicyId} not found");
            }

            //Cursor - Get execution statistics
            var executionStats = await _context.ReconciliationPolicyExecutions
                .Where(e => e.PolicyId == request.PolicyId)
                .GroupBy(e => e.PolicyId)
                .Select(g => new
                {
                    TotalExecutions = g.Count(),
                    SuccessfulExecutions = g.Count(e => e.Status == Domain.Entities.enums.ReconciliationExecutionStatus.Completed),
                    AverageExecutionDurationMs = g.Where(e => e.ExecutionDurationMs.HasValue).Average(e => (decimal?)e.ExecutionDurationMs),
                    TotalTanksReconciled = g.Sum(e => e.TanksReconciled),
                    LastExecuted = g.Max(e => (DateTime?)e.ExecutionStartTime),
                    NextExecution = (DateTime?)null // Will be calculated based on policy configuration
                })
                .FirstOrDefaultAsync(cancellationToken);

            //Cursor - Map to DTO using AutoMapper
            var policyDto = _mapper.Map<ReconciliationPolicyDTO>(policy);

            //Cursor - Set execution statistics
            if (executionStats != null)
            {
                policyDto.TotalExecutions = executionStats.TotalExecutions;
                policyDto.SuccessfulExecutions = executionStats.SuccessfulExecutions;
                policyDto.AverageExecutionDurationMs = executionStats.AverageExecutionDurationMs;
                policyDto.TotalTanksReconciled = executionStats.TotalTanksReconciled;
                policyDto.LastExecuted = executionStats.LastExecuted;
            }

            //Cursor - Calculate next execution time for scheduled policies
            if (policy.PolicyType == Domain.Entities.enums.ReconciliationPolicyType.Scheduled
                && policy.ScheduleFrequencyHours.HasValue
                && policyDto.LastExecuted.HasValue)
            {
                policyDto.NextExecution = policyDto.LastExecuted.Value.AddHours(policy.ScheduleFrequencyHours.Value);
            }

            return FMSResponse<ReconciliationPolicyDTO>.Success(
                policyDto,
                "Policy retrieved successfully");
        }
        catch (Exception ex)
        {
            return FMSResponse<ReconciliationPolicyDTO>.SystemError(
                $"Failed to retrieve policy: {ex.Message}");
        }
    }
}