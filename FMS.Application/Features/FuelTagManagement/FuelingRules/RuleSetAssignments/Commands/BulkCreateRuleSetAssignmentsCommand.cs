using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelTagManagement.FuelingRules.RuleSetAssignments.DTOs;
using FMS.Domain.Entities.Features.FuelRuleSet;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.RuleSetAssignments.Commands;

/// <summary>
/// Command to create multiple assignments at once.
/// Useful for assigning a rule set to all vehicles of a type, all tags, etc.
/// </summary>
public record BulkCreateRuleSetAssignmentsCommand(BulkAssignmentDTO BulkAssignment)
    : IRequest<FMSResponse<BulkAssignmentResultDTO>>;

/// <summary>
/// Result of bulk assignment operation
/// </summary>
public class BulkAssignmentResultDTO
{
    public int TotalRequested { get; set; }
    public int SuccessCount { get; set; }
    public int SkippedCount { get; set; }
    public int FailedCount { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<int> CreatedAssignmentIds { get; set; } = new();
}

public class BulkCreateRuleSetAssignmentsCommandHandler
    : IRequestHandler<BulkCreateRuleSetAssignmentsCommand, FMSResponse<BulkAssignmentResultDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<BulkCreateRuleSetAssignmentsCommandHandler> _logger;

    public BulkCreateRuleSetAssignmentsCommandHandler(
        GpsdataContext context,
        ILogger<BulkCreateRuleSetAssignmentsCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<BulkAssignmentResultDTO>> Handle(
        BulkCreateRuleSetAssignmentsCommand request,
        CancellationToken cancellationToken)
    {
        var dto = request.BulkAssignment;
        var result = new BulkAssignmentResultDTO
        {
            TotalRequested = dto.TargetIds.Count
        };

        try
        {
            // Validate RuleSet exists
            var ruleSet = await _context.FuelingRuleSets
                .FirstOrDefaultAsync(rs => rs.Id == dto.FuelingRuleSetId, cancellationToken);

            if (ruleSet == null)
            {
                return FMSResponse<BulkAssignmentResultDTO>.NotFound(
                    "RULESET_NOT_FOUND",
                    $"Rule set with ID {dto.FuelingRuleSetId} not found");
            }

            // Get existing assignments to check for duplicates
            var existingAssignments = await _context.FuelingRuleSetAssignments
                .Where(a => a.FuelingRuleSetId == dto.FuelingRuleSetId
                    && a.TargetType == dto.TargetType
                    && a.IsActive)
                .ToListAsync(cancellationToken);

            var existingTargetIds = dto.TargetType switch
            {
                AssignmentTargetType.Site => existingAssignments.Where(a => a.SiteId.HasValue).Select(a => a.SiteId!.Value).ToHashSet(),
                AssignmentTargetType.VehicleType => existingAssignments.Where(a => a.VehicleTypeId.HasValue).Select(a => a.VehicleTypeId!.Value).ToHashSet(),
                AssignmentTargetType.Vehicle => existingAssignments.Where(a => a.VehicleId.HasValue).Select(a => a.VehicleId!.Value).ToHashSet(),
                AssignmentTargetType.Tag => existingAssignments.Where(a => a.TagId.HasValue).Select(a => a.TagId!.Value).ToHashSet(),
                _ => new HashSet<int>()
            };

            // Validate all target IDs exist
            var validTargetIds = await GetValidTargetIdsAsync(dto.TargetType, dto.TargetIds, cancellationToken);
            var invalidIds = dto.TargetIds.Except(validTargetIds).ToList();

            foreach (var invalidId in invalidIds)
            {
                result.Errors.Add($"{dto.TargetType} with ID {invalidId} not found");
                result.FailedCount++;
            }

            var priority = dto.Priority ?? dto.TargetType.GetDefaultPriority();
            var currentTime = DateTime.UtcNow;
            var assignmentsToCreate = new List<FuelingRuleSetAssignment>();

            foreach (var targetId in validTargetIds)
            {
                // Skip if already exists
                if (existingTargetIds.Contains(targetId))
                {
                    result.SkippedCount++;
                    continue;
                }

                var assignment = new FuelingRuleSetAssignment
                {
                    FuelingRuleSetId = dto.FuelingRuleSetId,
                    TargetType = dto.TargetType,
                    Priority = priority,
                    IsActive = true,
                    CreatedAt = currentTime
                };

                // Set the appropriate target ID
                switch (dto.TargetType)
                {
                    case AssignmentTargetType.Site:
                        assignment.SiteId = targetId;
                        break;
                    case AssignmentTargetType.VehicleType:
                        assignment.VehicleTypeId = targetId;
                        break;
                    case AssignmentTargetType.Vehicle:
                        assignment.VehicleId = targetId;
                        break;
                    case AssignmentTargetType.Tag:
                        assignment.TagId = targetId;
                        break;
                }

                assignmentsToCreate.Add(assignment);
            }

            if (assignmentsToCreate.Any())
            {
                _context.FuelingRuleSetAssignments.AddRange(assignmentsToCreate);
                await _context.SaveChangesAsync(cancellationToken);

                result.SuccessCount = assignmentsToCreate.Count;
                result.CreatedAssignmentIds = assignmentsToCreate.Select(a => a.Id).ToList();
            }

            _logger.LogInformation(
                "Bulk created {SuccessCount} assignments for RuleSet {RuleSetId}, skipped {SkippedCount}, failed {FailedCount}",
                result.SuccessCount,
                dto.FuelingRuleSetId,
                result.SkippedCount,
                result.FailedCount);

            return FMSResponse<BulkAssignmentResultDTO>.Success(
                result,
                $"Created {result.SuccessCount} assignments, skipped {result.SkippedCount} duplicates");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in bulk create assignments for RuleSet {RuleSetId}", dto.FuelingRuleSetId);
            return FMSResponse<BulkAssignmentResultDTO>.SystemError(
                "BULK_CREATE_ERROR",
                "An error occurred during bulk assignment creation");
        }
    }

    private async Task<HashSet<int>> GetValidTargetIdsAsync(
        AssignmentTargetType targetType,
        List<int> targetIds,
        CancellationToken cancellationToken)
    {
        IQueryable<int> query = targetType switch
        {
            AssignmentTargetType.Site => _context.Sites.Where(s => targetIds.Contains(s.Id)).Select(s => s.Id),
            AssignmentTargetType.VehicleType => _context.Vehicletypes.Where(v => targetIds.Contains(v.Id)).Select(v => v.Id),
            AssignmentTargetType.Vehicle => _context.Vehicles.Where(v => targetIds.Contains(v.VehicleId)).Select(v => v.VehicleId),
            AssignmentTargetType.Tag => _context.FuelTags.Where(t => targetIds.Contains(t.Id)).Select(t => t.Id),
            _ => throw new ArgumentException($"Invalid target type: {targetType}")
        };

        return (await query.ToListAsync(cancellationToken)).ToHashSet();
    }
}
