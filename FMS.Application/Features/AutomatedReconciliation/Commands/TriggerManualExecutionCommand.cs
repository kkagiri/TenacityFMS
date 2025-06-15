// using AutoMapper;
// using FMS.Application.Common;
// using FMS.Application.Features.AutomatedReconciliation.Services;
// using FMS.Application.ModelsDTOs.FMS.AutomatedReconciliation;
// using FMS.Domain.Entities.enums;
// using FMS.Persistence;
// using FMS.Persistence.DataAccess;
// using MediatR;
// using Microsoft.EntityFrameworkCore;
// using Microsoft.Extensions.Logging;
// using System;
// using System.Threading;
// using System.Threading.Tasks;

// namespace FMS.Application.Features.AutomatedReconciliation.Commands;

// //Cursor - TriggerManualExecutionCommand for manual policy execution
// public class TriggerManualExecutionCommand : IRequest<FMSResponse<ReconciliationPolicyExecutionDTO>> {
//     public int PolicyId { get; set; }
//     public string TriggeredBy { get; set; }
// }

// //Cursor - TriggerManualExecutionCommandHandler with validation and execution
// public class TriggerManualExecutionCommandHandler : IRequestHandler<TriggerManualExecutionCommand, FMSResponse<ReconciliationPolicyExecutionDTO>> {
//     //Cursor - Inject dependencies
//     private readonly AutomatedReconciliationService _automatedReconciliationService;
//     private readonly GpsdataContext _context;
//     private readonly IMapper _mapper;
//     private readonly ILogger<TriggerManualExecutionCommandHandler> _logger;

//     public TriggerManualExecutionCommandHandler (
//         AutomatedReconciliationService automatedReconciliationService,
//         GpsdataContext context,
//         IMapper mapper,
//         ILogger<TriggerManualExecutionCommandHandler> logger) {
//         _automatedReconciliationService = automatedReconciliationService;
//         _context = context;
//         _mapper = mapper;
//         _logger = logger;
//     }

//     public async Task<FMSResponse<ReconciliationPolicyExecutionDTO>> Handle (
//         TriggerManualExecutionCommand request,
//         CancellationToken cancellationToken) {
//         try {
//             //Cursor - Basic validation
//             if (request.PolicyId <= 0) {
//                 return FMSResponse<ReconciliationPolicyExecutionDTO>.Failed ("Policy ID is required");
//             }

//             //Cursor - Validation - Policy exists and active
//             var policy = await _context.ReconciliationPolicies
//                 .FirstOrDefaultAsync (p => p.Id == request.PolicyId && p.IsActive, cancellationToken);

//             if (policy == null) {
//                 return FMSResponse<ReconciliationPolicyExecutionDTO>.Failed ("Policy not found or inactive");
//             }

//             //Cursor - Verify no current execution in progress for same policy
//             var hasInProgressExecution = await _context.ReconciliationPolicyExecutions
//                 .AnyAsync (e => e.PolicyId == request.PolicyId &&
//                     e.Status == ReconciliationExecutionStatus.InProgress, cancellationToken);

//             if (hasInProgressExecution) {
//                 return FMSResponse<ReconciliationPolicyExecutionDTO>.Failed (
//                     "Another execution is already in progress for this policy");
//             }

//             //Cursor - Kick-off manual execution
//             var execResult = await _automatedReconciliationService.ExecuteSinglePolicyAsync (
//                 request.PolicyId, cancellationToken);

//             //Cursor - Map execution result to DTO
//             var executionDto = _mapper.Map<ReconciliationPolicyExecutionDTO> (execResult);

//             return FMSResponse<ReconciliationPolicyExecutionDTO>.Success (
//                 executionDto,
//                 "Manual execution triggered successfully");

//         } catch (Exception ex) {
//             _logger.LogError (ex, "Failed to trigger manual execution for policy {PolicyId}", request.PolicyId);
//             return FMSResponse<ReconciliationPolicyExecutionDTO>.SystemError (
//                 $"Failed to trigger manual execution: {ex.Message}");
//         }
//     }
// }