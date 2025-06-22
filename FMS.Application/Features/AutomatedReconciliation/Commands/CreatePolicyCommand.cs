using AutoMapper;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.AutomatedReconciliation;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.AutomatedReconciliation.Commands;

//Cursor - CreatePolicyCommand for automated reconciliation
public class CreatePolicyCommand : IRequest<FMSResponse<ReconciliationPolicyDTO>> {
    public ReconciliationPolicyDTO PolicyData { get; set; }
    public string CreatedBy { get; set; }
}

//Cursor - add dependencies and constructor
public class CreatePolicyCommandHandler : IRequestHandler<CreatePolicyCommand, FMSResponse<ReconciliationPolicyDTO>> {
    //Cursor - Inject dependencies
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<CreatePolicyCommandHandler> _logger;

    public CreatePolicyCommandHandler (
        GpsdataContext context,
        IMapper mapper,
        ILogger<CreatePolicyCommandHandler> logger) {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<ReconciliationPolicyDTO>> Handle (CreatePolicyCommand request, CancellationToken cancellationToken) {

        try {
            //Cursor - Basic validation checks
            if (request.PolicyData == null) {
                return FMSResponse<ReconciliationPolicyDTO>.Failed ("Policy data cannot be null");
            }
            if (string.IsNullOrWhiteSpace (request.PolicyData.Name)) {
                return FMSResponse<ReconciliationPolicyDTO>.Failed ("Policy name is required");
            }

            //Cursor - Check for duplicate policy name under same site (soft-unique constraint)
            var duplicateExists = await _context.ReconciliationPolicies
                .AnyAsync (p => p.Name == request.PolicyData.Name && p.SiteId == request.PolicyData.SiteId,
                    cancellationToken);
            if (duplicateExists) {
                return FMSResponse<ReconciliationPolicyDTO>.Failed ($"A policy named '{request.PolicyData.Name}' already exists for this site");
            }

            //Cursor - Map DTO to entity and persist
            var entity = _mapper.Map<ReconciliationPolicy> (request.PolicyData);
            entity.CreatedBy = request.CreatedBy;
            entity.CreatedOn = DateTime.UtcNow;
            entity.IsActive = true;

            _context.ReconciliationPolicies.Add (entity);
            await _context.SaveChangesAsync (cancellationToken);

            //Cursor - Map back to DTO for response
            var policyDto = _mapper.Map<ReconciliationPolicyDTO> (entity);

            return FMSResponse<ReconciliationPolicyDTO>.Success (
                policyDto,
                "Policy created successfully");

        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to create reconciliation policy");
            return FMSResponse<ReconciliationPolicyDTO>.SystemError (
                $"Failed to create policy: {ex.Message}");
        }
    }
}