// //Cursor - CQRS Query for retrieving reconciliation policy executions
// using System;
// using System.Collections.Generic;
// using System.Threading;
// using System.Threading.Tasks;
// using FMS.Application.Common;
// using FMS.Application.ModelsDTOs.FMS.AutomatedReconciliation;
// using MediatR;

// namespace FMS.Application.Features.AutomatedReconciliation.Queries;

// public class GetExecutionsQuery : IRequest<FMSResponse<PagedResult<ReconciliationPolicyExecutionDTO>>> {
//     public int? PolicyId { get; set; }
//     public string? Status { get; set; }
//     public DateTime? StartDate { get; set; }
//     public DateTime? EndDate { get; set; }
//     public int? SiteId { get; set; }
//     public int PageNumber { get; set; } = 1;
//     public int PageSize { get; set; } = 20;
//     public string? SortBy { get; set; } = "ExecutionStartTime";
//     public string? SortOrder { get; set; } = "desc";
// }

// public class GetExecutionsQueryHandler : IRequestHandler<GetExecutionsQuery, FMSResponse<PagedResult<ReconciliationPolicyExecutionDTO>>> {
//     // TODO: Add dependencies (repository, etc.)

//     public async Task<FMSResponse<PagedResult<ReconciliationPolicyExecutionDTO>>> Handle (
//         GetExecutionsQuery request,
//         CancellationToken cancellationToken) {

//         try {
//             // TODO: Implement executions retrieval logic
//             // 1. Apply filters (PolicyId, Status, DateRange, SiteId)
//             // 2. Apply sorting
//             // 3. Apply pagination
//             // 4. Map to DTOs
//             // 5. Return paged result

//             // Placeholder implementation
//             var executions = new List<ReconciliationPolicyExecutionDTO> {
//                 new ReconciliationPolicyExecutionDTO {
//                 Id = 1,
//                 PolicyId = 1,
//                 PolicyName = "Daily Reconciliation",
//                 ExecutionStartTime = DateTime.UtcNow.AddHours (-2),
//                 ExecutionEndTime = DateTime.UtcNow.AddHours (-1).AddMinutes (-45),
//                 Status = Domain.Entities.enums.ReconciliationExecutionStatus.Completed,
//                 TanksEvaluated = 15,
//                 DiscrepanciesDetected = 2,
//                 TanksReconciled = 2,
//                 ReconciliationFailures = 0,
//                 ExecutionDurationMs = 900000
//                 },
//                 new ReconciliationPolicyExecutionDTO {
//                 Id = 2,
//                 PolicyId = 1,
//                 PolicyName = "Daily Reconciliation",
//                 ExecutionStartTime = DateTime.UtcNow.AddDays (-1).AddHours (-2),
//                 ExecutionEndTime = DateTime.UtcNow.AddDays (-1).AddHours (-1).AddMinutes (-50),
//                 Status = Domain.Entities.enums.ReconciliationExecutionStatus.Completed,
//                 TanksEvaluated = 15,
//                 DiscrepanciesDetected = 1,
//                 TanksReconciled = 1,
//                 ReconciliationFailures = 0,
//                 ExecutionDurationMs = 600000
//                 }
//             };

//             var pagedResult = new PagedResult<ReconciliationPolicyExecutionDTO> {
//                 Items = executions,
//                 TotalCount = 2,
//                 PageNumber = request.PageNumber,
//                 PageSize = request.PageSize,
//                 TotalPages = 1
//             };

//             return FMSResponse<PagedResult<ReconciliationPolicyExecutionDTO>>.Success (
//                 pagedResult,
//                 "Executions retrieved successfully");

//         } catch (Exception ex) {
//             return FMSResponse<PagedResult<ReconciliationPolicyExecutionDTO>>.SystemError (
//                 $"Failed to retrieve executions: {ex.Message}");
//         }
//     }
// }