using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.ExpectedFuelAverage.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.ExpectedFuelAverage.Commands;

#region Expected Fuel Average Template Commands

/// <summary>
/// Command to create a new expected fuel average template
/// </summary>
public record CreateExpectedFuelAverageTemplateCommand(ExpectedFuelAverageTemplateDTO TemplateDTO)
    : IRequest<FMSResponse<ExpectedFuelAverageTemplateDTO>>;

public class CreateExpectedFuelAverageTemplateCommandHandler
    : IRequestHandler<CreateExpectedFuelAverageTemplateCommand, FMSResponse<ExpectedFuelAverageTemplateDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateExpectedFuelAverageTemplateCommandHandler> _logger;

    public CreateExpectedFuelAverageTemplateCommandHandler(
        GpsdataContext context,
        IMapper mapper,
        ILogger<CreateExpectedFuelAverageTemplateCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<ExpectedFuelAverageTemplateDTO>> Handle(
        CreateExpectedFuelAverageTemplateCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var dto = request.TemplateDTO;

            // Validate required fields
            if (dto.VehicleTypeId <= 0)
                return FMSResponse<ExpectedFuelAverageTemplateDTO>.Failed("Vehicle type is required");

            if (dto.ExpectedValue <= 0)
                return FMSResponse<ExpectedFuelAverageTemplateDTO>.Failed("Expected value must be greater than 0");

            // Validate vehicle type exists
            var vehicleTypeExists = await _context.Vehicletypes.AnyAsync(v => v.Id == dto.VehicleTypeId, cancellationToken);
            if (!vehicleTypeExists)
                return FMSResponse<ExpectedFuelAverageTemplateDTO>.Failed("Invalid vehicle type");

            // Check for duplicate template with same criteria
            var existingTemplate = await _context.ExpectedFuelAverageTemplates
                .AnyAsync(t =>
                    t.VehicleTypeId == dto.VehicleTypeId &&
                    t.VehicleManufacturerId == dto.VehicleManufacturerId &&
                    t.VehicleModelId == dto.VehicleModelId &&
                    t.SiteId == dto.SiteId &&
                    t.FuelRouteId == dto.FuelRouteId &&
                    t.LoadClassificationId == dto.LoadClassificationId &&
                    t.UsageIntensityId == dto.UsageIntensityId &&
                    t.IsActive,
                    cancellationToken);

            if (existingTemplate)
                return FMSResponse<ExpectedFuelAverageTemplateDTO>.Failed(
                    "A template with the same criteria already exists");

            // Generate template name if not provided
            var templateName = dto.Name;
            if (string.IsNullOrWhiteSpace(templateName))
            {
                templateName = await GenerateTemplateName(dto, cancellationToken);
            }

            var template = new ExpectedFuelAverageTemplate
            {
                Name = templateName,
                Description = dto.Description,
                VehicleTypeId = dto.VehicleTypeId,
                VehicleManufacturerId = dto.VehicleManufacturerId,
                VehicleModelId = dto.VehicleModelId,
                YearOfManufacture = dto.YearOfManufacture,
                SiteId = dto.SiteId,
                FuelRouteId = dto.FuelRouteId,
                LoadClassificationId = dto.LoadClassificationId,
                UsageIntensityId = dto.UsageIntensityId,
                IsKmPerLiter = dto.IsKmPerLiter,
                ExpectedValue = dto.ExpectedValue,
                MinThreshold = dto.MinThreshold,
                MaxThreshold = dto.MaxThreshold,
                TolerancePercent = dto.TolerancePercent ?? 10,
                Priority = dto.Priority,
                IsActive = true,
                EffectiveFrom = dto.EffectiveFrom,
                EffectiveTo = dto.EffectiveTo,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = dto.CreatedBy
            };

            _context.ExpectedFuelAverageTemplates.Add(template);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created expected fuel average template {TemplateId}: {TemplateName}",
                template.Id, template.Name);

            // Reload with navigation properties
            var result = await _context.ExpectedFuelAverageTemplates
                .Include(t => t.VehicleType)
                .Include(t => t.VehicleManufacturer)
                .Include(t => t.VehicleModel)
                .Include(t => t.Site)
                .Include(t => t.FuelRoute)
                .Include(t => t.LoadClassification)
                .Include(t => t.UsageIntensity)
                .FirstOrDefaultAsync(t => t.Id == template.Id, cancellationToken);

            var resultDto = _mapper.Map<ExpectedFuelAverageTemplateDTO>(result);
            return FMSResponse<ExpectedFuelAverageTemplateDTO>.Success(resultDto,
                "Expected fuel average template created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating expected fuel average template");
            return FMSResponse<ExpectedFuelAverageTemplateDTO>.Failed(
                $"Error creating template: {ex.Message}");
        }
    }

    private async Task<string> GenerateTemplateName(ExpectedFuelAverageTemplateDTO dto, CancellationToken cancellationToken)
    {
        var parts = new List<string>();

        // Vehicle Type
        var vehicleType = await _context.Vehicletypes.FindAsync(new object[] { dto.VehicleTypeId }, cancellationToken);
        parts.Add(vehicleType?.Abbvr ?? vehicleType?.Name ?? $"Type{dto.VehicleTypeId}");

        // Manufacturer
        if (dto.VehicleManufacturerId.HasValue)
        {
            var manufacturer = await _context.Vehiclemanufacturers.FindAsync(new object[] { dto.VehicleManufacturerId.Value }, cancellationToken);
            if (manufacturer != null) parts.Add(manufacturer.Name ?? "");
        }

        // Model
        if (dto.VehicleModelId.HasValue)
        {
            var model = await _context.Vehiclemodels.FindAsync(new object[] { dto.VehicleModelId.Value }, cancellationToken);
            if (model != null) parts.Add(model.Name ?? "");
        }

        // Route or Site
        if (dto.FuelRouteId.HasValue)
        {
            var route = await _context.FuelRoutes.FindAsync(new object[] { dto.FuelRouteId.Value }, cancellationToken);
            if (route != null) parts.Add(route.Name);
        }
        else if (dto.SiteId.HasValue)
        {
            var site = await _context.Sites.FindAsync(new object[] { dto.SiteId.Value }, cancellationToken);
            if (site != null) parts.Add(site.Name);
        }

        // Load or Usage Intensity
        if (dto.LoadClassificationId.HasValue)
        {
            var load = await _context.LoadClassifications.FindAsync(new object[] { dto.LoadClassificationId.Value }, cancellationToken);
            if (load != null) parts.Add(load.Name);
        }
        else if (dto.UsageIntensityId.HasValue)
        {
            var intensity = await _context.UsageIntensities.FindAsync(new object[] { dto.UsageIntensityId.Value }, cancellationToken);
            if (intensity != null) parts.Add(intensity.Name);
        }

        return string.Join(" ", parts.Where(p => !string.IsNullOrWhiteSpace(p)));
    }
}

/// <summary>
/// Command to update an expected fuel average template
/// </summary>
public record UpdateExpectedFuelAverageTemplateCommand(int Id, ExpectedFuelAverageTemplateDTO TemplateDTO)
    : IRequest<FMSResponse<ExpectedFuelAverageTemplateDTO>>;

public class UpdateExpectedFuelAverageTemplateCommandHandler
    : IRequestHandler<UpdateExpectedFuelAverageTemplateCommand, FMSResponse<ExpectedFuelAverageTemplateDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateExpectedFuelAverageTemplateCommandHandler> _logger;

    public UpdateExpectedFuelAverageTemplateCommandHandler(
        GpsdataContext context,
        IMapper mapper,
        ILogger<UpdateExpectedFuelAverageTemplateCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<ExpectedFuelAverageTemplateDTO>> Handle(
        UpdateExpectedFuelAverageTemplateCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var template = await _context.ExpectedFuelAverageTemplates
                .Include(t => t.VehicleType)
                .Include(t => t.VehicleManufacturer)
                .Include(t => t.VehicleModel)
                .Include(t => t.Site)
                .Include(t => t.FuelRoute)
                .Include(t => t.LoadClassification)
                .Include(t => t.UsageIntensity)
                .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

            if (template == null)
                return FMSResponse<ExpectedFuelAverageTemplateDTO>.NotFound("Template not found");

            var dto = request.TemplateDTO;

            // Update fields
            template.Name = dto.Name ?? template.Name;
            template.Description = dto.Description;
            template.VehicleTypeId = dto.VehicleTypeId;
            template.VehicleManufacturerId = dto.VehicleManufacturerId;
            template.VehicleModelId = dto.VehicleModelId;
            template.YearOfManufacture = dto.YearOfManufacture;
            template.SiteId = dto.SiteId;
            template.FuelRouteId = dto.FuelRouteId;
            template.LoadClassificationId = dto.LoadClassificationId;
            template.UsageIntensityId = dto.UsageIntensityId;
            template.IsKmPerLiter = dto.IsKmPerLiter;
            template.ExpectedValue = dto.ExpectedValue;
            template.MinThreshold = dto.MinThreshold;
            template.MaxThreshold = dto.MaxThreshold;
            template.TolerancePercent = dto.TolerancePercent;
            template.Priority = dto.Priority;
            template.IsActive = dto.IsActive;
            template.EffectiveFrom = dto.EffectiveFrom;
            template.EffectiveTo = dto.EffectiveTo;
            template.ModifiedAt = DateTime.UtcNow;
            template.ModifiedBy = dto.CreatedBy;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated expected fuel average template {TemplateId}", template.Id);

            var resultDto = _mapper.Map<ExpectedFuelAverageTemplateDTO>(template);
            return FMSResponse<ExpectedFuelAverageTemplateDTO>.Success(resultDto,
                "Template updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating expected fuel average template {TemplateId}", request.Id);
            return FMSResponse<ExpectedFuelAverageTemplateDTO>.Failed(
                $"Error updating template: {ex.Message}");
        }
    }
}

/// <summary>
/// Command to delete an expected fuel average template
/// </summary>
public record DeleteExpectedFuelAverageTemplateCommand(int Id) : IRequest<FMSResponse<bool>>;

public class DeleteExpectedFuelAverageTemplateCommandHandler
    : IRequestHandler<DeleteExpectedFuelAverageTemplateCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteExpectedFuelAverageTemplateCommandHandler> _logger;

    public DeleteExpectedFuelAverageTemplateCommandHandler(
        GpsdataContext context,
        ILogger<DeleteExpectedFuelAverageTemplateCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(
        DeleteExpectedFuelAverageTemplateCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var template = await _context.ExpectedFuelAverageTemplates.FindAsync(
                new object[] { request.Id }, cancellationToken);

            if (template == null)
                return FMSResponse<bool>.NotFound("Template not found");

            // Check if template is assigned to any vehicles
            var hasAssignments = await _context.VehicleExpectedAverageAssignments
                .AnyAsync(a => a.ExpectedFuelAverageTemplateId == request.Id, cancellationToken);

            if (hasAssignments)
            {
                // Soft delete
                template.IsActive = false;
                template.ModifiedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
                return FMSResponse<bool>.Success(true,
                    "Template deactivated (assigned to vehicles)");
            }

            _context.ExpectedFuelAverageTemplates.Remove(template);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted expected fuel average template {TemplateId}", request.Id);
            return FMSResponse<bool>.Success(true, "Template deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting expected fuel average template {TemplateId}", request.Id);
            return FMSResponse<bool>.Failed($"Error deleting template: {ex.Message}");
        }
    }
}

#endregion

#region Vehicle Assignment Commands

/// <summary>
/// Command to assign an expected fuel average template to a vehicle
/// </summary>
public record AssignExpectedAverageToVehicleCommand(VehicleExpectedAverageAssignmentDTO AssignmentDTO)
    : IRequest<FMSResponse<VehicleExpectedAverageAssignmentDTO>>;

public class AssignExpectedAverageToVehicleCommandHandler
    : IRequestHandler<AssignExpectedAverageToVehicleCommand, FMSResponse<VehicleExpectedAverageAssignmentDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<AssignExpectedAverageToVehicleCommandHandler> _logger;

    public AssignExpectedAverageToVehicleCommandHandler(
        GpsdataContext context,
        IMapper mapper,
        ILogger<AssignExpectedAverageToVehicleCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleExpectedAverageAssignmentDTO>> Handle(
        AssignExpectedAverageToVehicleCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var dto = request.AssignmentDTO;

            // Validate vehicle exists
            var vehicleExists = await _context.Vehicles.AnyAsync(v => v.VehicleId == dto.VehicleId, cancellationToken);
            if (!vehicleExists)
                return FMSResponse<VehicleExpectedAverageAssignmentDTO>.Failed("Vehicle not found");

            // Validate template exists
            var templateExists = await _context.ExpectedFuelAverageTemplates
                .AnyAsync(t => t.Id == dto.ExpectedFuelAverageTemplateId && t.IsActive, cancellationToken);
            if (!templateExists)
                return FMSResponse<VehicleExpectedAverageAssignmentDTO>.Failed("Template not found or inactive");

            // Check if assignment already exists
            var existingAssignment = await _context.VehicleExpectedAverageAssignments
                .FirstOrDefaultAsync(a =>
                    a.VehicleId == dto.VehicleId &&
                    a.ExpectedFuelAverageTemplateId == dto.ExpectedFuelAverageTemplateId,
                    cancellationToken);

            if (existingAssignment != null)
            {
                // Update existing assignment
                existingAssignment.IsDefault = dto.IsDefault;
                existingAssignment.OverrideExpectedValue = dto.OverrideExpectedValue;
                existingAssignment.OverrideTolerancePercent = dto.OverrideTolerancePercent;
                existingAssignment.Notes = dto.Notes;
                existingAssignment.IsActive = dto.IsActive;
                existingAssignment.ModifiedAt = DateTime.UtcNow;
                existingAssignment.ModifiedBy = dto.Notes; // Could be a user ID passed through
            }
            else
            {
                // Create new assignment
                existingAssignment = new VehicleExpectedAverageAssignment
                {
                    VehicleId = dto.VehicleId,
                    ExpectedFuelAverageTemplateId = dto.ExpectedFuelAverageTemplateId,
                    IsDefault = dto.IsDefault,
                    OverrideExpectedValue = dto.OverrideExpectedValue,
                    OverrideTolerancePercent = dto.OverrideTolerancePercent,
                    Notes = dto.Notes,
                    IsActive = dto.IsActive,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = dto.Notes
                };
                _context.VehicleExpectedAverageAssignments.Add(existingAssignment);
            }

            // If this is marked as default, unset other defaults for this vehicle
            if (dto.IsDefault)
            {
                var otherDefaults = await _context.VehicleExpectedAverageAssignments
                    .Where(a => a.VehicleId == dto.VehicleId && a.IsDefault && a.Id != existingAssignment.Id)
                    .ToListAsync(cancellationToken);

                foreach (var other in otherDefaults)
                {
                    other.IsDefault = false;
                    other.ModifiedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Assigned template {TemplateId} to vehicle {VehicleId}",
                dto.ExpectedFuelAverageTemplateId, dto.VehicleId);

            // Reload with navigation properties
            var result = await _context.VehicleExpectedAverageAssignments
                .Include(a => a.Vehicle)
                .Include(a => a.ExpectedFuelAverageTemplate)
                    .ThenInclude(t => t.VehicleType)
                .Include(a => a.ExpectedFuelAverageTemplate)
                    .ThenInclude(t => t.FuelRoute)
                .Include(a => a.ExpectedFuelAverageTemplate)
                    .ThenInclude(t => t.LoadClassification)
                .FirstOrDefaultAsync(a => a.Id == existingAssignment.Id, cancellationToken);

            var resultDto = _mapper.Map<VehicleExpectedAverageAssignmentDTO>(result);
            return FMSResponse<VehicleExpectedAverageAssignmentDTO>.Success(resultDto,
                "Assignment saved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning expected average to vehicle");
            return FMSResponse<VehicleExpectedAverageAssignmentDTO>.Failed(
                $"Error creating assignment: {ex.Message}");
        }
    }
}

/// <summary>
/// Command to remove an expected average assignment from a vehicle
/// </summary>
public record RemoveVehicleAssignmentCommand(int AssignmentId) : IRequest<FMSResponse<bool>>;

public class RemoveVehicleAssignmentCommandHandler
    : IRequestHandler<RemoveVehicleAssignmentCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<RemoveVehicleAssignmentCommandHandler> _logger;

    public RemoveVehicleAssignmentCommandHandler(
        GpsdataContext context,
        ILogger<RemoveVehicleAssignmentCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(
        RemoveVehicleAssignmentCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var assignment = await _context.VehicleExpectedAverageAssignments
                .FindAsync(new object[] { request.AssignmentId }, cancellationToken);

            if (assignment == null)
                return FMSResponse<bool>.NotFound("Assignment not found");

            _context.VehicleExpectedAverageAssignments.Remove(assignment);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Removed assignment {AssignmentId}", request.AssignmentId);
            return FMSResponse<bool>.Success(true, "Assignment removed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing assignment {AssignmentId}", request.AssignmentId);
            return FMSResponse<bool>.Failed($"Error removing assignment: {ex.Message}");
        }
    }
}

/// <summary>
/// Command to set the default expected average for a vehicle
/// </summary>
public record SetDefaultVehicleAssignmentCommand(int VehicleId, int AssignmentId)
    : IRequest<FMSResponse<bool>>;

public class SetDefaultVehicleAssignmentCommandHandler
    : IRequestHandler<SetDefaultVehicleAssignmentCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<SetDefaultVehicleAssignmentCommandHandler> _logger;

    public SetDefaultVehicleAssignmentCommandHandler(
        GpsdataContext context,
        ILogger<SetDefaultVehicleAssignmentCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(
        SetDefaultVehicleAssignmentCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get all assignments for this vehicle
            var assignments = await _context.VehicleExpectedAverageAssignments
                .Where(a => a.VehicleId == request.VehicleId)
                .ToListAsync(cancellationToken);

            if (!assignments.Any())
                return FMSResponse<bool>.NotFound("No assignments found for this vehicle");

            var targetAssignment = assignments.FirstOrDefault(a => a.Id == request.AssignmentId);
            if (targetAssignment == null)
                return FMSResponse<bool>.NotFound("Assignment not found for this vehicle");

            // Clear all defaults
            foreach (var assignment in assignments)
            {
                assignment.IsDefault = assignment.Id == request.AssignmentId;
                assignment.ModifiedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Set assignment {AssignmentId} as default for vehicle {VehicleId}",
                request.AssignmentId, request.VehicleId);
            return FMSResponse<bool>.Success(true, "Default assignment updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting default assignment");
            return FMSResponse<bool>.Failed($"Error setting default: {ex.Message}");
        }
    }
}

#endregion
