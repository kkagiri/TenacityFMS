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

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.RuleSetAssignments.Queries;

/// <summary>
/// Query to get all assignments, with optional filtering
/// </summary>
public record GetRuleSetAssignmentsQuery(
    int? RuleSetId = null,
    AssignmentTargetType? TargetType = null,
    int? SiteId = null,
    int? VehicleTypeId = null,
    int? VehicleId = null,
    int? TagId = null,
    bool? IsActive = true
) : IRequest<FMSResponse<List<FuelingRuleSetAssignmentResponseDTO>>>;

public class GetRuleSetAssignmentsQueryHandler
    : IRequestHandler<GetRuleSetAssignmentsQuery, FMSResponse<List<FuelingRuleSetAssignmentResponseDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetRuleSetAssignmentsQueryHandler> _logger;

    public GetRuleSetAssignmentsQueryHandler(
        GpsdataContext context,
        ILogger<GetRuleSetAssignmentsQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<FuelingRuleSetAssignmentResponseDTO>>> Handle(
        GetRuleSetAssignmentsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.FuelingRuleSetAssignments
                .Include(a => a.FuelingRuleSet)
                .Include(a => a.Site)
                .Include(a => a.VehicleType)
                .Include(a => a.Vehicle)
                .Include(a => a.Tag)
                .AsQueryable();

            // Apply filters
            if (request.RuleSetId.HasValue)
                query = query.Where(a => a.FuelingRuleSetId == request.RuleSetId.Value);

            if (request.TargetType.HasValue)
                query = query.Where(a => a.TargetType == request.TargetType.Value);

            if (request.SiteId.HasValue)
                query = query.Where(a => a.SiteId == request.SiteId.Value);

            if (request.VehicleTypeId.HasValue)
                query = query.Where(a => a.VehicleTypeId == request.VehicleTypeId.Value);

            if (request.VehicleId.HasValue)
                query = query.Where(a => a.VehicleId == request.VehicleId.Value);

            if (request.TagId.HasValue)
                query = query.Where(a => a.TagId == request.TagId.Value);

            if (request.IsActive.HasValue)
                query = query.Where(a => a.IsActive == request.IsActive.Value);

            var assignments = await query
                .OrderBy(a => a.Priority)
                .ThenBy(a => a.TargetType)
                .ToListAsync(cancellationToken);

            var results = assignments.Select(a => new FuelingRuleSetAssignmentResponseDTO
            {
                Id = a.Id,
                FuelingRuleSetId = a.FuelingRuleSetId,
                RuleSetName = a.FuelingRuleSet?.Name,
                TargetType = a.TargetType,
                SiteId = a.SiteId,
                SiteName = a.Site?.Name,
                VehicleTypeId = a.VehicleTypeId,
                VehicleTypeName = a.VehicleType?.Name,
                VehicleId = a.VehicleId,
                VehicleHyoungNo = a.Vehicle?.HyoungNo,
                TagId = a.TagId,
                TagName = a.Tag?.Name,
                Priority = a.Priority,
                IsActive = a.IsActive,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CreatedByUserId = a.CreatedByUserId,
                UpdatedByUserId = a.UpdatedByUserId,
                TargetDisplayName = a.GetTargetDisplayName()
            }).ToList();

            return FMSResponse<List<FuelingRuleSetAssignmentResponseDTO>>.Success(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rule set assignments");
            return FMSResponse<List<FuelingRuleSetAssignmentResponseDTO>>.SystemError(
                "GET_ASSIGNMENTS_ERROR",
                "An error occurred while retrieving assignments");
        }
    }
}

/// <summary>
/// Query to get a single assignment by ID
/// </summary>
public record GetRuleSetAssignmentByIdQuery(int Id)
    : IRequest<FMSResponse<FuelingRuleSetAssignmentResponseDTO>>;

public class GetRuleSetAssignmentByIdQueryHandler
    : IRequestHandler<GetRuleSetAssignmentByIdQuery, FMSResponse<FuelingRuleSetAssignmentResponseDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetRuleSetAssignmentByIdQueryHandler> _logger;

    public GetRuleSetAssignmentByIdQueryHandler(
        GpsdataContext context,
        ILogger<GetRuleSetAssignmentByIdQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<FuelingRuleSetAssignmentResponseDTO>> Handle(
        GetRuleSetAssignmentByIdQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var assignment = await _context.FuelingRuleSetAssignments
                .Include(a => a.FuelingRuleSet)
                .Include(a => a.Site)
                .Include(a => a.VehicleType)
                .Include(a => a.Vehicle)
                .Include(a => a.Tag)
                .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

            if (assignment == null)
            {
                return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.NotFound(
                    "ASSIGNMENT_NOT_FOUND",
                    $"Assignment with ID {request.Id} not found");
            }

            var result = new FuelingRuleSetAssignmentResponseDTO
            {
                Id = assignment.Id,
                FuelingRuleSetId = assignment.FuelingRuleSetId,
                RuleSetName = assignment.FuelingRuleSet?.Name,
                TargetType = assignment.TargetType,
                SiteId = assignment.SiteId,
                SiteName = assignment.Site?.Name,
                VehicleTypeId = assignment.VehicleTypeId,
                VehicleTypeName = assignment.VehicleType?.Name,
                VehicleId = assignment.VehicleId,
                VehicleHyoungNo = assignment.Vehicle?.HyoungNo,
                TagId = assignment.TagId,
                TagName = assignment.Tag?.Name,
                Priority = assignment.Priority,
                IsActive = assignment.IsActive,
                CreatedAt = assignment.CreatedAt,
                UpdatedAt = assignment.UpdatedAt,
                CreatedByUserId = assignment.CreatedByUserId,
                UpdatedByUserId = assignment.UpdatedByUserId,
                TargetDisplayName = assignment.GetTargetDisplayName()
            };

            return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rule set assignment {Id}", request.Id);
            return FMSResponse<FuelingRuleSetAssignmentResponseDTO>.SystemError(
                "GET_ASSIGNMENT_ERROR",
                "An error occurred while retrieving the assignment");
        }
    }
}

/// <summary>
/// Query to get all applicable assignments for a specific vehicle.
/// Returns assignments from all cascade levels (Site → VehicleType → Tag → Vehicle).
/// </summary>
public record GetAssignmentsForVehicleQuery(
    int VehicleId,
    int? SiteId = null,
    int? TagId = null
) : IRequest<FMSResponse<List<FuelingRuleSetAssignmentResponseDTO>>>;

public class GetAssignmentsForVehicleQueryHandler
    : IRequestHandler<GetAssignmentsForVehicleQuery, FMSResponse<List<FuelingRuleSetAssignmentResponseDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetAssignmentsForVehicleQueryHandler> _logger;

    public GetAssignmentsForVehicleQueryHandler(
        GpsdataContext context,
        ILogger<GetAssignmentsForVehicleQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<FuelingRuleSetAssignmentResponseDTO>>> Handle(
        GetAssignmentsForVehicleQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get the vehicle to find its type and site
            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId, cancellationToken);

            if (vehicle == null)
            {
                return FMSResponse<List<FuelingRuleSetAssignmentResponseDTO>>.NotFound(
                    "VEHICLE_NOT_FOUND",
                    $"Vehicle with ID {request.VehicleId} not found");
            }

            var siteId = request.SiteId ?? vehicle.WorkingSiteId;
            var vehicleTypeId = vehicle.VehicleTypeId;

            // Build query to get all applicable assignments
            var query = _context.FuelingRuleSetAssignments
                .Include(a => a.FuelingRuleSet)
                .Include(a => a.Site)
                .Include(a => a.VehicleType)
                .Include(a => a.Vehicle)
                .Include(a => a.Tag)
                .Where(a => a.IsActive)
                .Where(a =>
                    // Site-level assignments for the vehicle's site
                    (a.TargetType == AssignmentTargetType.Site && a.SiteId == siteId)
                    // VehicleType-level assignments for the vehicle's type
                    || (a.TargetType == AssignmentTargetType.VehicleType && a.VehicleTypeId == vehicleTypeId)
                    // Vehicle-specific assignments
                    || (a.TargetType == AssignmentTargetType.Vehicle && a.VehicleId == request.VehicleId)
                    // Tag-specific assignments (if tag provided)
                    || (request.TagId.HasValue && a.TargetType == AssignmentTargetType.Tag && a.TagId == request.TagId.Value)
                );

            var assignments = await query
                .OrderBy(a => a.Priority)
                .ToListAsync(cancellationToken);

            var results = assignments.Select(a => new FuelingRuleSetAssignmentResponseDTO
            {
                Id = a.Id,
                FuelingRuleSetId = a.FuelingRuleSetId,
                RuleSetName = a.FuelingRuleSet?.Name,
                TargetType = a.TargetType,
                SiteId = a.SiteId,
                SiteName = a.Site?.Name,
                VehicleTypeId = a.VehicleTypeId,
                VehicleTypeName = a.VehicleType?.Name,
                VehicleId = a.VehicleId,
                VehicleHyoungNo = a.Vehicle?.HyoungNo,
                TagId = a.TagId,
                TagName = a.Tag?.Name,
                Priority = a.Priority,
                IsActive = a.IsActive,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CreatedByUserId = a.CreatedByUserId,
                UpdatedByUserId = a.UpdatedByUserId,
                TargetDisplayName = a.GetTargetDisplayName()
            }).ToList();

            return FMSResponse<List<FuelingRuleSetAssignmentResponseDTO>>.Success(
                results,
                $"Found {results.Count} applicable assignments for vehicle {vehicle.HyoungNo}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting assignments for vehicle {VehicleId}", request.VehicleId);
            return FMSResponse<List<FuelingRuleSetAssignmentResponseDTO>>.SystemError(
                "GET_VEHICLE_ASSIGNMENTS_ERROR",
                "An error occurred while retrieving vehicle assignments");
        }
    }
}
