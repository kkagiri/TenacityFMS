using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.RuleSetAssignments.Commands;

/// <summary>
/// Command to delete (soft delete) a FuelingRuleSetAssignment.
/// </summary>
public record DeleteRuleSetAssignmentCommand(int Id) : IRequest<FMSResponse>;

public class DeleteRuleSetAssignmentCommandHandler : IRequestHandler<DeleteRuleSetAssignmentCommand, FMSResponse>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteRuleSetAssignmentCommandHandler> _logger;

    public DeleteRuleSetAssignmentCommandHandler(
        GpsdataContext context,
        ILogger<DeleteRuleSetAssignmentCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse> Handle(
        DeleteRuleSetAssignmentCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var assignment = await _context.FuelingRuleSetAssignments
                .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

            if (assignment == null)
            {
                return FMSResponse.NotFound(
                    "ASSIGNMENT_NOT_FOUND",
                    $"Assignment with ID {request.Id} not found");
            }

            // Soft delete by deactivating
            assignment.IsActive = false;
            assignment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Deleted (deactivated) rule set assignment {AssignmentId}: RuleSet {RuleSetId} -> {TargetType}",
                assignment.Id,
                assignment.FuelingRuleSetId,
                assignment.TargetType);

            return FMSResponse.SuccessResponse("Assignment deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting rule set assignment {Id}", request.Id);
            return FMSResponse.SystemError(
                "DELETE_ASSIGNMENT_ERROR",
                "An error occurred while deleting the assignment");
        }
    }
}

/// <summary>
/// Command to permanently delete a FuelingRuleSetAssignment (hard delete).
/// Use with caution - this cannot be undone.
/// </summary>
public record HardDeleteRuleSetAssignmentCommand(int Id) : IRequest<FMSResponse>;

public class HardDeleteRuleSetAssignmentCommandHandler : IRequestHandler<HardDeleteRuleSetAssignmentCommand, FMSResponse>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<HardDeleteRuleSetAssignmentCommandHandler> _logger;

    public HardDeleteRuleSetAssignmentCommandHandler(
        GpsdataContext context,
        ILogger<HardDeleteRuleSetAssignmentCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse> Handle(
        HardDeleteRuleSetAssignmentCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var assignment = await _context.FuelingRuleSetAssignments
                .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

            if (assignment == null)
            {
                return FMSResponse.NotFound(
                    "ASSIGNMENT_NOT_FOUND",
                    $"Assignment with ID {request.Id} not found");
            }

            _context.FuelingRuleSetAssignments.Remove(assignment);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogWarning(
                "Hard deleted rule set assignment {AssignmentId}: RuleSet {RuleSetId} -> {TargetType}",
                assignment.Id,
                assignment.FuelingRuleSetId,
                assignment.TargetType);

            return FMSResponse.SuccessResponse("Assignment permanently deleted");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error hard deleting rule set assignment {Id}", request.Id);
            return FMSResponse.SystemError(
                "HARD_DELETE_ASSIGNMENT_ERROR",
                "An error occurred while permanently deleting the assignment");
        }
    }
}
