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
/// Command to create a new FuelingRuleSetAssignment.
/// Links a rule set template to a target (Site, VehicleType, Vehicle, or Tag).
/// </summary>
public record CreateRuleSetAssignmentCommand(FuelingRuleSetAssignmentDTO Assignment)
    : IRequest<FMSResponse<FuelingRuleSetAssignmentResponseDTO>>;

public class CreateRuleSetAssignmentCommandHandler
    : IRequestHandler<CreateRuleSetAssignmentCommand, FMSResponse<FuelingRuleSetAssignmentResponseDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateRuleSetAssignmentCommandHandler> _logger;

    public CreateRuleSetAssignmentCommandHandler(
        GpsdataContext context,
        ILogger<CreateRuleSetAssignmentCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<FuelingRuleSetAssignmentResponseDTO>> Handle(
        CreateRuleSetAssignmentCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var dto = request.Assignment;

            // Validate RuleSet exists
            var ruleSet = await _context.FuelingRuleSets
                .FirstOrDefaultAsync(rs => rs.Id == dto.FuelingRuleSetId, cancellationToken);

            if (ruleSet == null)
            {
                return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.NotFound(
                    "RULESET_NOT_FOUND",
                    $"Rule set with ID {dto.FuelingRuleSetId} not found");
            }

            // Validate target exists based on TargetType
            var validationResult = await ValidateTargetAsync(dto, cancellationToken);
            if (!validationResult.IsSuccess)
            {
                return validationResult;
            }

            // Check for duplicate assignment
            var existingAssignment = await _context.FuelingRuleSetAssignments
                .Where(a => a.FuelingRuleSetId == dto.FuelingRuleSetId
                    && a.TargetType == dto.TargetType
                    && a.SiteId == dto.SiteId
                    && a.VehicleTypeId == dto.VehicleTypeId
                    && a.VehicleId == dto.VehicleId
                    && a.TagId == dto.TagId
                    && a.IsActive)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingAssignment != null)
            {
                return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.Failed(
                    "An active assignment already exists for this rule set and target combination",
                    "DUPLICATE_ASSIGNMENT");
            }

            // Create the assignment
            var assignment = new FuelingRuleSetAssignment
            {
                FuelingRuleSetId = dto.FuelingRuleSetId,
                TargetType = dto.TargetType,
                SiteId = dto.TargetType == AssignmentTargetType.Site ? dto.SiteId : null,
                VehicleTypeId = dto.TargetType == AssignmentTargetType.VehicleType ? dto.VehicleTypeId : null,
                VehicleId = dto.TargetType == AssignmentTargetType.Vehicle ? dto.VehicleId : null,
                TagId = dto.TargetType == AssignmentTargetType.Tag ? dto.TagId : null,
                Priority = dto.Priority ?? dto.TargetType.GetDefaultPriority(),
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            // Validate the assignment
            if (!assignment.IsValid())
            {
                return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.Failed(
                    "Assignment must have exactly one target ID matching the target type",
                    "INVALID_ASSIGNMENT");
            }

            _context.FuelingRuleSetAssignments.Add(assignment);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Created rule set assignment {AssignmentId}: RuleSet {RuleSetId} -> {TargetType} {TargetId}",
                assignment.Id,
                assignment.FuelingRuleSetId,
                assignment.TargetType,
                assignment.GetTargetDisplayName());

            // Build response
            var response = await BuildResponseDTOAsync(assignment, ruleSet.Name, cancellationToken);

            return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.Success(
                response,
                "Assignment created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating rule set assignment");
            return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.SystemError(
                "CREATE_ASSIGNMENT_ERROR",
                "An error occurred while creating the assignment");
        }
    }

    private async Task<FMSResponse<FuelingRuleSetAssignmentResponseDTO>> ValidateTargetAsync(
        FuelingRuleSetAssignmentDTO dto,
        CancellationToken cancellationToken)
    {
        switch (dto.TargetType)
        {
            case AssignmentTargetType.Site:
                if (!dto.SiteId.HasValue)
                    return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.Failed(
                        "Site ID is required for Site assignment", "SITE_ID_REQUIRED");

                var site = await _context.Sites.FindAsync(new object[] { dto.SiteId.Value }, cancellationToken);
                if (site == null)
                    return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.NotFound(
                        "SITE_NOT_FOUND", $"Site with ID {dto.SiteId} not found");
                break;

            case AssignmentTargetType.VehicleType:
                if (!dto.VehicleTypeId.HasValue)
                    return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.Failed(
                        "Vehicle Type ID is required for VehicleType assignment", "VEHICLE_TYPE_ID_REQUIRED");

                var vehicleType = await _context.Vehicletypes.FindAsync(new object[] { dto.VehicleTypeId.Value }, cancellationToken);
                if (vehicleType == null)
                    return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.NotFound(
                        "VEHICLE_TYPE_NOT_FOUND", $"Vehicle Type with ID {dto.VehicleTypeId} not found");
                break;

            case AssignmentTargetType.Vehicle:
                if (!dto.VehicleId.HasValue)
                    return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.Failed(
                        "Vehicle ID is required for Vehicle assignment", "VEHICLE_ID_REQUIRED");

                var vehicle = await _context.Vehicles.FindAsync(new object[] { dto.VehicleId.Value }, cancellationToken);
                if (vehicle == null)
                    return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.NotFound(
                        "VEHICLE_NOT_FOUND", $"Vehicle with ID {dto.VehicleId} not found");
                break;

            case AssignmentTargetType.Tag:
                if (!dto.TagId.HasValue)
                    return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.Failed(
                        "Tag ID is required for Tag assignment", "TAG_ID_REQUIRED");

                var tag = await _context.FuelTags.FindAsync(new object[] { dto.TagId.Value }, cancellationToken);
                if (tag == null)
                    return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.NotFound(
                        "TAG_NOT_FOUND", $"Tag with ID {dto.TagId} not found");
                break;

            default:
                return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.Failed(
                    $"Invalid target type: {dto.TargetType}", "INVALID_TARGET_TYPE");
        }

        return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.Success(null!, "Valid");
    }

    private async Task<FuelingRuleSetAssignmentResponseDTO> BuildResponseDTOAsync(
        FuelingRuleSetAssignment assignment,
        string ruleSetName,
        CancellationToken cancellationToken)
    {
        var response = new FuelingRuleSetAssignmentResponseDTO
        {
            Id = assignment.Id,
            FuelingRuleSetId = assignment.FuelingRuleSetId,
            RuleSetName = ruleSetName,
            TargetType = assignment.TargetType,
            SiteId = assignment.SiteId,
            VehicleTypeId = assignment.VehicleTypeId,
            VehicleId = assignment.VehicleId,
            TagId = assignment.TagId,
            Priority = assignment.Priority,
            IsActive = assignment.IsActive,
            CreatedAt = assignment.CreatedAt,
            UpdatedAt = assignment.UpdatedAt,
            CreatedByUserId = assignment.CreatedByUserId,
            UpdatedByUserId = assignment.UpdatedByUserId,
            TargetDisplayName = assignment.GetTargetDisplayName()
        };

        // Populate target names
        switch (assignment.TargetType)
        {
            case AssignmentTargetType.Site:
                var site = await _context.Sites.FindAsync(new object[] { assignment.SiteId!.Value }, cancellationToken);
                response.SiteName = site?.Name;
                break;
            case AssignmentTargetType.VehicleType:
                var vt = await _context.Vehicletypes.FindAsync(new object[] { assignment.VehicleTypeId!.Value }, cancellationToken);
                response.VehicleTypeName = vt?.Name;
                break;
            case AssignmentTargetType.Vehicle:
                var v = await _context.Vehicles.FindAsync(new object[] { assignment.VehicleId!.Value }, cancellationToken);
                response.VehicleCode = v?.VehicleCode;
                break;
            case AssignmentTargetType.Tag:
                var tag = await _context.FuelTags.FindAsync(new object[] { assignment.TagId!.Value }, cancellationToken);
                response.TagName = tag?.Name;
                break;
        }

        return response;
    }
}
