// //Cursor - CQRS Query for retrieving reconciliation discrepancies
// using FMS.Application.Common;
// using FMS.Application.ModelsDTOs.FMS.AutomatedReconciliation;
// using MediatR;
// using System;
// using System.Collections.Generic;
// using System.Threading;
// using System.Threading.Tasks;

// namespace FMS.Application.Features.AutomatedReconciliation.Queries;

// public class GetDiscrepanciesQuery : IRequest<FMSResponse<PagedResult<ReconciliationDiscrepancyDTO>>>
// {
//     public int? SiteId { get; set; }
//     public int? TankId { get; set; }
//     public string? Severity { get; set; }
//     public bool? IsResolved { get; set; }
//     public DateTime? StartDate { get; set; }
//     public DateTime? EndDate { get; set; }
//     public decimal? MinVariance { get; set; }
//     public decimal? MaxVariance { get; set; }
//     public int PageNumber { get; set; } = 1;
//     public int PageSize { get; set; } = 20;
//     public string? SortBy { get; set; } = "DetectedAt";
//     public string? SortOrder { get; set; } = "desc";
// }

// public class GetDiscrepanciesQueryHandler : IRequestHandler<GetDiscrepanciesQuery, FMSResponse<PagedResult<ReconciliationDiscrepancyDTO>>>
// {
//     // TODO: Add dependencies (repository, etc.)

//     public async Task<FMSResponse<PagedResult<ReconciliationDiscrepancyDTO>>> Handle(
//         GetDiscrepanciesQuery request,
//         CancellationToken cancellationToken)
//     {

//         try
//         {
//             // TODO: Implement discrepancies retrieval logic
//             // 1. Apply filters (SiteId, TankId, Severity, IsResolved, DateRange, Variance)
//             // 2. Apply sorting
//             // 3. Apply pagination
//             // 4. Include trend analysis
//             // 5. Map to DTOs
//             // 6. Return paged result

//             // Placeholder implementation
//             var discrepancies = new List<ReconciliationDiscrepancyDTO> {
//                  new ReconciliationDiscrepancyDTO {
//                  Id = 1,
//                  PolicyExecutionId = 1,
//                  TankId = 1,
//                  TankName = "Tank A1",
//                  SiteName = "Main Site",
//                  DetectedAt = DateTime.UtcNow.AddHours (-2),
//                  CurrentStock = 1000.5m,
//                  ExpectedStock = 1005.0m,
//                  AbsoluteVariance = 4.5m,
//                  PercentageVariance = 0.45m,
//                  Severity = Domain.Entities.enums.DiscrepancySeverity.Low,
//                  IsResolved = true,
//                  ResolvedAt = DateTime.UtcNow.AddHours (-1),
//                  ResolutionMethod = "Automated Reconciliation",
//                  BusinessImpactScore = 10.5m
//                  },
//                  new ReconciliationDiscrepancyDTO {
//                  Id = 2,
//                  PolicyExecutionId = 2,
//                  TankId = 2,
//                  TankName = "Tank B2",
//                  SiteName = "Main Site",
//                  DetectedAt = DateTime.UtcNow.AddDays (-1),
//                  CurrentStock = 2500.0m,
//                  ExpectedStock = 2520.0m,
//                  AbsoluteVariance = 20.0m,
//                  PercentageVariance = 0.8m,
//                  Severity = Domain.Entities.enums.DiscrepancySeverity.Medium,
//                  IsResolved = false,
//                  BusinessImpactScore = 45.2m
//                  }
//              };

//             var pagedResult = new PagedResult<ReconciliationDiscrepancyDTO>
//             {
//                 Items = discrepancies,
//                 TotalCount = 2,
//                 PageNumber = request.PageNumber,
//                 PageSize = request.PageSize,
//                 TotalPages = 1
//             };

//             return FMSResponse<PagedResult<ReconciliationDiscrepancyDTO>>.Success(
//                 pagedResult,
//                 "Discrepancies retrieved successfully");

//         }
//         catch (Exception ex)
//         {
//             return FMSResponse<PagedResult<ReconciliationDiscrepancyDTO>>.SystemError(
//                 $"Failed to retrieve discrepancies: {ex.Message}");
//         }
//     }
// }