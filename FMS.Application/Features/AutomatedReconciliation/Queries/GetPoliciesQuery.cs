// //Cursor - CQRS Query for retrieving reconciliation policies
// using FMS.Application.Common;
// using FMS.Application.ModelsDTOs.FMS.AutomatedReconciliation;
// using MediatR;
// using System;
// using System.Collections.Generic;
// using System.Threading;
// using System.Threading.Tasks;

// namespace FMS.Application.Features.AutomatedReconciliation.Queries;

// public class GetPoliciesQuery : IRequest<FMSResponse<PagedResult<ReconciliationPolicyDTO>>>
// {
//     public bool? IsActive { get; set; }
//     public int? SiteId { get; set; }
//     public string? PolicyType { get; set; }
//     public int PageNumber { get; set; } = 1;
//     public int PageSize { get; set; } = 20;
// }

// public class GetPoliciesQueryHandler : IRequestHandler<GetPoliciesQuery, FMSResponse<PagedResult<ReconciliationPolicyDTO>>>
// {
//     // TODO: Add dependencies (repository, etc.)

//     public async Task<FMSResponse<PagedResult<ReconciliationPolicyDTO>>> Handle(
//         GetPoliciesQuery request,
//         CancellationToken cancellationToken)
//     {

//         try
//         {
//             // TODO: Implement policies retrieval logic
//             // 1. Apply filters
//             // 2. Apply pagination
//             // 3. Map to DTOs
//             // 4. Return paged result

//             // Placeholder implementation
//             var policies = new List<ReconciliationPolicyDTO> {
//                 new ReconciliationPolicyDTO {
//                 Id = 1,
//                 Name = "Daily Reconciliation",
//                 Description = "Daily tank reconciliation policy",
//                 IsActive = true,
//                 CreatedBy = "system",
//                 CreatedOn = DateTime.UtcNow.AddDays (-10),
//                 TotalExecutions = 10,
//                 SuccessfulExecutions = 9
//                 }
//             };

//             var pagedResult = new PagedResult<ReconciliationPolicyDTO>
//             {
//                 Items = policies,
//                 TotalCount = 1,
//                 PageNumber = request.PageNumber,
//                 PageSize = request.PageSize,
//                 TotalPages = 1
//             };

//             return FMSResponse<PagedResult<ReconciliationPolicyDTO>>.Success(
//                 pagedResult,
//                 "Policies retrieved successfully");

//         }
//         catch (Exception ex)
//         {
//             return FMSResponse<PagedResult<ReconciliationPolicyDTO>>.SystemError(
//                 $"Failed to retrieve policies: {ex.Message}");
//         }
//     }
// }

// // Paged result helper class
// public class PagedResult<T>
// {
//     public List<T> Items { get; set; } = new List<T>();
//     public int TotalCount { get; set; }
//     public int PageNumber { get; set; }
//     public int PageSize { get; set; }
//     public int TotalPages { get; set; }
//     public bool HasPreviousPage => PageNumber > 1;
//     public bool HasNextPage => PageNumber < TotalPages;
// }