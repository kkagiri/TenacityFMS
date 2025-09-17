//Cursor - CQRS Query for retrieving a specific execution by ID
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

public class GetExecutionByIdQuery : IRequest<FMSResponse<ReconciliationPolicyExecutionDTO>> {
    public int ExecutionId { get; set; }
}

public class GetExecutionByIdQueryHandler : IRequestHandler<GetExecutionByIdQuery, FMSResponse<ReconciliationPolicyExecutionDTO>> {
    //Cursor - Inject required dependencies
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    public GetExecutionByIdQueryHandler (GpsdataContext context, IMapper mapper) {
        _context = context;
        _mapper = mapper;
    }

    public async Task<FMSResponse<ReconciliationPolicyExecutionDTO>> Handle (
        GetExecutionByIdQuery request,
        CancellationToken cancellationToken) {
        try {
            //Cursor - Validate execution ID
            if (request.ExecutionId <= 0) {
                return FMSResponse<ReconciliationPolicyExecutionDTO>.ValidationFailed (
                    new List<string> { "Invalid execution ID" });
            }

            //Cursor - Retrieve execution from database with all related data
            var execution = await _context.ReconciliationPolicyExecutions
                .Include (e => e.Policy)
                .ThenInclude (p => p.Site)
                .Include (e => e.Discrepancies)
                .ThenInclude (d => d.Tank)
                .ThenInclude (t => t.Site)
                .FirstOrDefaultAsync (e => e.Id == request.ExecutionId, cancellationToken);

            if (execution == null) {
                return FMSResponse<ReconciliationPolicyExecutionDTO>.Failed (
                    $"Execution with ID {request.ExecutionId} not found");
            }

            //Cursor - Map to DTO using AutoMapper
            var executionDto = _mapper.Map<ReconciliationPolicyExecutionDTO> (execution);

            //Cursor - Map discrepancies with tank and site information
            if (execution.Discrepancies?.Any () == true) {
                var discrepancyDtos = new List<ReconciliationDiscrepancyDTO> ();

                foreach (var discrepancy in execution.Discrepancies) {
                    var discrepancyDto = _mapper.Map<ReconciliationDiscrepancyDTO> (discrepancy);
                    discrepancyDto.TankName = discrepancy.Tank?.Name ?? "Unknown Tank";
                    discrepancyDto.SiteName = discrepancy.Tank?.Site?.Name ?? "Unknown Site";
                    discrepancyDtos.Add (discrepancyDto);
                }

                executionDto.Discrepancies = discrepancyDtos;
            }

            return FMSResponse<ReconciliationPolicyExecutionDTO>.Success (
                executionDto,
                "Execution details retrieved successfully");
        } catch (Exception ex) {
            return FMSResponse<ReconciliationPolicyExecutionDTO>.SystemError (
                $"Failed to retrieve execution: {ex.Message}");
        }
    }
}