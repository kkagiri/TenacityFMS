using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.AutomatedReconciliation.Commands;

//Cursor - DeletePolicyCommand for soft delete of reconciliation policies
public class DeletePolicyCommand : IRequest<FMSResponse<string>> {
    public int PolicyId { get; set; }
    public string ModifiedBy { get; set; }
}

//Cursor - DeletePolicyCommandHandler with soft delete logic
public class DeletePolicyCommandHandler : IRequestHandler<DeletePolicyCommand, FMSResponse<string>> {
    //Cursor - Inject dependencies
    private readonly GpsdataContext _context;
    private readonly ILogger<DeletePolicyCommandHandler> _logger;

    public DeletePolicyCommandHandler (
        GpsdataContext context,
        ILogger<DeletePolicyCommandHandler> logger) {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<string>> Handle (
        DeletePolicyCommand request,
        CancellationToken cancellationToken) {
        try {
            //Cursor - Basic validation
            if (request.PolicyId <= 0) {
                return FMSResponse<string>.Failed ("Policy ID is required");
            }

            //Cursor - Fetch policy
            var policy = await _context.ReconciliationPolicies
                .FirstOrDefaultAsync (p => p.Id == request.PolicyId, cancellationToken);

            if (policy == null) {
                return FMSResponse<string>.Failed ("Policy not found");
            }

            //Cursor - Check for active executions
            var hasActiveExecutions = await _context.ReconciliationPolicyExecutions
                .AnyAsync (e => e.PolicyId == request.PolicyId && e.Status == ReconciliationExecutionStatus.InProgress, cancellationToken);

            if (hasActiveExecutions) {
                return FMSResponse<string>.Failed ("Cannot delete policy with running executions");
            }

            //Cursor - Soft delete
            policy.IsActive = false;
            policy.ModifiedBy = request.ModifiedBy;
            policy.ModifiedOn = DateTime.UtcNow;

            await _context.SaveChangesAsync (cancellationToken);

            return FMSResponse<string>.Success (
                "Policy deactivated successfully",
                "Policy deactivated successfully");

        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to delete reconciliation policy with ID {PolicyId}", request.PolicyId);
            return FMSResponse<string>.SystemError (
                $"Failed to delete policy: {ex.Message}");
        }
    }
}