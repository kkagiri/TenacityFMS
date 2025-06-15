// using AutoMapper;
// using FMS.Application.Common;
// using FMS.Application.ModelsDTOs.FMS.AutomatedReconciliation;
// using FMS.Domain.Entities;
// using FMS.Persistence;
// using FMS.Persistence.DataAccess;
// using MediatR;
// using Microsoft.EntityFrameworkCore;
// using Microsoft.Extensions.Logging;
// using System;
// using System.Threading;
// using System.Threading.Tasks;

// namespace FMS.Application.Features.AutomatedReconciliation.Commands;

// //Cursor - UpdatePolicyCommand for automated reconciliation
// public class UpdatePolicyCommand : IRequest<FMSResponse<ReconciliationPolicyDTO>> {
//     public ReconciliationPolicyDTO PolicyData { get; set; }
//     public string ModifiedBy { get; set; }
// }

// //Cursor - UpdatePolicyCommandHandler with DI and validation
// public class UpdatePolicyCommandHandler : IRequestHandler<UpdatePolicyCommand, FMSResponse<ReconciliationPolicyDTO>> {
//     //Cursor - Inject dependencies
//     private readonly GpsdataContext _context;
//     private readonly IMapper _mapper;
//     private readonly ILogger<UpdatePolicyCommandHandler> _logger;

//     public UpdatePolicyCommandHandler (
//         GpsdataContext context,
//         IMapper mapper,
//         ILogger<UpdatePolicyCommandHandler> logger) {
//         _context = context;
//         _mapper = mapper;
//         _logger = logger;
//     }

//     public async Task<FMSResponse<ReconciliationPolicyDTO>> Handle (
//         UpdatePolicyCommand request,
//         CancellationToken cancellationToken) {
//         try {
//             //Cursor - Basic validation checks
//             if (request.PolicyData == null) {
//                 return FMSResponse<ReconciliationPolicyDTO>.Failed ("Policy data cannot be null");
//             }

//             if (request.PolicyData.Id <= 0) {
//                 return FMSResponse<ReconciliationPolicyDTO>.Failed ("Policy ID is required");
//             }

//             if (string.IsNullOrWhiteSpace (request.PolicyData.Name)) {
//                 return FMSResponse<ReconciliationPolicyDTO>.Failed ("Policy name is required");
//             }

//             //Cursor - Fetch entity by ID
//             var entity = await _context.ReconciliationPolicies
//                 .FirstOrDefaultAsync (p => p.Id == request.PolicyData.Id, cancellationToken);

//             if (entity == null) {
//                 return FMSResponse<ReconciliationPolicyDTO>.Failed ("Policy not found");
//             }

//             //Cursor - Guard against deleted policies
//             if (!entity.IsActive) {
//                 return FMSResponse<ReconciliationPolicyDTO>.Failed ("Cannot update deleted policy");
//             }

//             //Cursor - Check name uniqueness (excluding itself)
//             var duplicateExists = await _context.ReconciliationPolicies
//                 .AnyAsync (p => p.Name == request.PolicyData.Name &&
//                     p.SiteId == request.PolicyData.SiteId &&
//                     p.Id != request.PolicyData.Id &&
//                     p.IsActive, cancellationToken);

//             if (duplicateExists) {
//                 return FMSResponse<ReconciliationPolicyDTO>.Failed (
//                     $"A policy named '{request.PolicyData.Name}' already exists for this site");
//             }

//             //Cursor - Map incoming fields to entity
//             _mapper.Map (request.PolicyData, entity);
//             entity.ModifiedBy = request.ModifiedBy;
//             entity.ModifiedOn = DateTime.UtcNow;

//             await _context.SaveChangesAsync (cancellationToken);

//             //Cursor - Map back to DTO for response
//             var policyDto = _mapper.Map<ReconciliationPolicyDTO> (entity);

//             return FMSResponse<ReconciliationPolicyDTO>.Success (
//                 policyDto,
//                 "Policy updated successfully");

//         } catch (Exception ex) {
//             _logger.LogError (ex, "Failed to update reconciliation policy with ID {PolicyId}", request.PolicyData?.Id);
//             return FMSResponse<ReconciliationPolicyDTO>.SystemError (
//                 $"Failed to update policy: {ex.Message}");
//         }
//     }
// }