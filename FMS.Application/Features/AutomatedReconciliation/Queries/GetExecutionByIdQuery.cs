// //Cursor - CQRS Query for retrieving a specific execution by ID
// using FMS.Application.Common;
// using FMS.Application.ModelsDTOs.FMS.AutomatedReconciliation;
// using MediatR;
// using System;
// using System.Collections.Generic;
// using System.Threading;
// using System.Threading.Tasks;

// namespace FMS.Application.Features.AutomatedReconciliation.Queries;

// public class GetExecutionByIdQuery : IRequest<FMSResponse<ReconciliationPolicyExecutionDTO>>
// {
//     public int ExecutionId { get; set; }
// }

// public class GetExecutionByIdQueryHandler : IRequestHandler<GetExecutionByIdQuery, FMSResponse<ReconciliationPolicyExecutionDTO>>
// {
//     // TODO: Add dependencies (repository, etc.)

//     public async Task<FMSResponse<ReconciliationPolicyExecutionDTO>> Handle(
//         GetExecutionByIdQuery request,
//         CancellationToken cancellationToken)
//     {

//         try
//         {
//             if (request.ExecutionId <= 0)
//             {
//                 return FMSResponse<ReconciliationPolicyExecutionDTO>.ValidationFailed(
//                     new List<string> { "Invalid execution ID" });
//             }

//             // TODO: Implement execution retrieval logic
//             // 1. Retrieve execution from database
//             // 2. Include related discrepancies
//             // 3. Map to DTO with full details
//             // 4. Return result

//             // Placeholder implementation
//             var execution = new ReconciliationPolicyExecutionDTO
//             {
//                 Id = request.ExecutionId,
//                 PolicyId = 1,
//                 PolicyName = "Sample Policy",
//                 ExecutionStartTime = DateTime.UtcNow.AddHours(-2),
//                 ExecutionEndTime = DateTime.UtcNow.AddHours(-1).AddMinutes(-45),
//                 Status = Domain.Entities.enums.ReconciliationExecutionStatus.Completed,
//                 TanksEvaluated = 15,
//                 DiscrepanciesDetected = 2,
//                 TanksReconciled = 2,
//                 ReconciliationFailures = 0,
//                 ExecutionDurationMs = 900000,
//                 ExecutionResults = "Successfully reconciled 2 tanks with minor discrepancies",
//                 Discrepancies = new List<ReconciliationDiscrepancyDTO> {
//                  new ReconciliationDiscrepancyDTO {
//                  Id = 1,
//                  TankName = "Tank A1",
//                  SiteName = "Main Site",
//                  CurrentStock = 1000.5m,
//                  ExpectedStock = 1005.0m,
//                  AbsoluteVariance = 4.5m,
//                  PercentageVariance = 0.45m,
//                  Severity = Domain.Entities.enums.DiscrepancySeverity.Low,
//                  IsResolved = true,
//                  DetectedAt = DateTime.UtcNow.AddHours (-1).AddMinutes (-50)
//                  }
//                  }
//             };

//             return FMSResponse<ReconciliationPolicyExecutionDTO>.Success(
//                 execution,
//                 "Execution details retrieved successfully");

//         }
//         catch (Exception ex)
//         {
//             return FMSResponse<ReconciliationPolicyExecutionDTO>.SystemError(
//                 $"Failed to retrieve execution: {ex.Message}");
//         }
//     }
// }