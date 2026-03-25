using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.VehicleDocumentManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleDocumentManagement.Commands;

public record BulkCreateVehicleComplianceRequirementsCommand(VehicleComplianceBulkAssignmentDto BulkAssignment)
    : IRequest<FMSResponse<VehicleComplianceBulkAssignmentResultDto>>;

public class BulkCreateVehicleComplianceRequirementsCommandHandler
    : IRequestHandler<BulkCreateVehicleComplianceRequirementsCommand, FMSResponse<VehicleComplianceBulkAssignmentResultDto>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<BulkCreateVehicleComplianceRequirementsCommandHandler> _logger;

    public BulkCreateVehicleComplianceRequirementsCommandHandler(
        GpsdataContext context,
        ILogger<BulkCreateVehicleComplianceRequirementsCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleComplianceBulkAssignmentResultDto>> Handle(
        BulkCreateVehicleComplianceRequirementsCommand request,
        CancellationToken cancellationToken)
    {
        var dto = request.BulkAssignment;
        var result = new VehicleComplianceBulkAssignmentResultDto
        {
            TotalRequested = dto.TargetIds.Count
        };

        try
        {
            var existingRequirements = await _context.VehicleComplianceRequirements
                .Where(requirement => requirement.IsActive
                    && requirement.TargetType == dto.TargetType
                    && requirement.ComplianceCategory == dto.ComplianceCategory)
                .ToListAsync(cancellationToken);

            var existingTargetIds = dto.TargetType switch
            {
                VehicleComplianceTargetType.Site => existingRequirements.Where(requirement => requirement.SiteId.HasValue).Select(requirement => requirement.SiteId!.Value).ToHashSet(),
                VehicleComplianceTargetType.VehicleType => existingRequirements.Where(requirement => requirement.VehicleTypeId.HasValue).Select(requirement => requirement.VehicleTypeId!.Value).ToHashSet(),
                _ => new HashSet<int>()
            };

            var validTargetIds = await GetValidTargetIdsAsync(dto.TargetType, dto.TargetIds, cancellationToken);
            foreach (var invalidTargetId in dto.TargetIds.Except(validTargetIds))
            {
                result.Errors.Add($"{dto.TargetType} with ID {invalidTargetId} was not found.");
                result.FailedCount++;
            }

            var requirementsToCreate = new List<VehicleComplianceRequirement>();
            foreach (var targetId in validTargetIds)
            {
                if (existingTargetIds.Contains(targetId))
                {
                    result.SkippedCount++;
                    continue;
                }

                requirementsToCreate.Add(new VehicleComplianceRequirement(
                    dto.Name,
                    dto.ComplianceCategory,
                    dto.DocumentType,
                    dto.TargetType,
                    dto.TargetType == VehicleComplianceTargetType.Site ? targetId : null,
                    dto.TargetType == VehicleComplianceTargetType.VehicleType ? targetId : null,
                    dto.AlertLeadDays,
                    dto.DefaultIssuingAuthority ?? string.Empty,
                    dto.Notes ?? string.Empty,
                    dto.UserId ?? string.Empty));
            }

            if (requirementsToCreate.Count > 0)
            {
                await _context.VehicleComplianceRequirements.AddRangeAsync(requirementsToCreate, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                result.SuccessCount = requirementsToCreate.Count;
                result.CreatedRequirementIds = requirementsToCreate.Select(requirement => requirement.Id.ToString()).ToList();
            }

            return FMSResponse<VehicleComplianceBulkAssignmentResultDto>.Success(
                result,
                $"Created {result.SuccessCount} compliance requirements, skipped {result.SkippedCount} duplicates.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk-creating vehicle compliance requirements.");
            return FMSResponse<VehicleComplianceBulkAssignmentResultDto>.Failed("Error bulk-creating vehicle compliance requirements.");
        }
    }

    private async Task<HashSet<int>> GetValidTargetIdsAsync(
        VehicleComplianceTargetType targetType,
        IReadOnlyCollection<int> targetIds,
        CancellationToken cancellationToken)
    {
        IQueryable<int> query = targetType switch
        {
            VehicleComplianceTargetType.Site => _context.Sites.Where(site => targetIds.Contains(site.Id)).Select(site => site.Id),
            VehicleComplianceTargetType.VehicleType => _context.Vehicletypes.Where(vehicleType => targetIds.Contains(vehicleType.Id)).Select(vehicleType => vehicleType.Id),
            _ => throw new ArgumentOutOfRangeException(nameof(targetType), targetType, "Unsupported vehicle compliance target type.")
        };

        return (await query.ToListAsync(cancellationToken)).ToHashSet();
    }
}