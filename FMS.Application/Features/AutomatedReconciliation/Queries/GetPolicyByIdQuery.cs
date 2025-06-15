// //Cursor - CQRS Query for retrieving a specific reconciliation policy
// using FMS.Application.Common;
// using FMS.Application.ModelsDTOs.FMS.AutomatedReconciliation;
// using MediatR;
// using System;
// using System.Collections.Generic;
// using System.Threading;
// using System.Threading.Tasks;

// namespace FMS.Application.Features.AutomatedReconciliation.Queries;

// public class GetPolicyByIdQuery : IRequest<FMSResponse<ReconciliationPolicyDTO>>
// {
//     public int PolicyId { get; set; }
// }

// public class GetPolicyByIdQueryHandler : IRequestHandler<GetPolicyByIdQuery, FMSResponse<ReconciliationPolicyDTO>>
// {
//     // TODO: Add dependencies (repository, etc.)

//     public async Task<FMSResponse<ReconciliationPolicyDTO>> Handle(
//         GetPolicyByIdQuery request,
//         CancellationToken cancellationToken)
//     {

//         try
//         {
//             // TODO: Implement policy retrieval logic
//             // 1. Validate policy ID
//             // 2. Retrieve policy from database
//             // 3. Map to DTO
//             // 4. Return result

//             if (request.PolicyId <= 0)
//             {
//                 return FMSResponse<ReconciliationPolicyDTO>.ValidationFailed(
//                     new List<string> { "Invalid policy ID" });
//             }

//             // Placeholder implementation
//             var policy = new ReconciliationPolicyDTO
//             {
//                 Id = request.PolicyId,
//                 Name = "Sample Policy",
//                 Description = "Sample reconciliation policy",
//                 IsActive = true,
//                 CreatedBy = "system",
//                 CreatedOn = DateTime.UtcNow.AddDays(-5),
//                 TotalExecutions = 5,
//                 SuccessfulExecutions = 4,
//                 LastExecuted = DateTime.UtcNow.AddHours(-2),
//                 NextExecution = DateTime.UtcNow.AddHours(22)
//             };

//             return FMSResponse<ReconciliationPolicyDTO>.Success(
//                 policy,
//                 "Policy retrieved successfully");

//         }
//         catch (Exception ex)
//         {
//             return FMSResponse<ReconciliationPolicyDTO>.SystemError(
//                 $"Failed to retrieve policy: {ex.Message}");
//         }
//     }
// }