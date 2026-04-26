using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.ExpectedFuelAverage.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.ExpectedFuelAverage.Queries;

#region Fuel Route Queries

/// <summary>
/// Query to get all fuel routes
/// </summary>
public record GetFuelRoutesQuery(bool IncludeInactive = false) : IRequest<FMSResponse<List<FuelRouteDTO>>>;

public class GetFuelRoutesQueryHandler : IRequestHandler<GetFuelRoutesQuery, FMSResponse<List<FuelRouteDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    public GetFuelRoutesQueryHandler(GpsdataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<FMSResponse<List<FuelRouteDTO>>> Handle(GetFuelRoutesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.FuelRoutes
            .Include(r => r.Site)
            .AsQueryable();

        if (!request.IncludeInactive)
            query = query.Where(r => r.IsActive);

        var routes = await query
            .OrderBy(r => r.Name)
            .Select(r => new FuelRouteDTO
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                FromLocation = r.FromLocation,
                ToLocation = r.ToLocation,
                DistanceKm = r.DistanceKm,
                ElevationChange = r.ElevationChange,
                RouteType = r.RouteType,
                SiteId = r.SiteId,
                SiteName = r.Site != null ? r.Site.Name : null,
                IsActive = r.IsActive
            })
            .ToListAsync(cancellationToken);

        return FMSResponse<List<FuelRouteDTO>>.Success(routes);
    }
}

/// <summary>
/// Query to get fuel routes by site
/// </summary>
public record GetFuelRoutesBySiteQuery(int SiteId) : IRequest<FMSResponse<List<FuelRouteDTO>>>;

public class GetFuelRoutesBySiteQueryHandler : IRequestHandler<GetFuelRoutesBySiteQuery, FMSResponse<List<FuelRouteDTO>>>
{
    private readonly GpsdataContext _context;

    public GetFuelRoutesBySiteQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<List<FuelRouteDTO>>> Handle(GetFuelRoutesBySiteQuery request, CancellationToken cancellationToken)
    {
        var routes = await _context.FuelRoutes
            .Include(r => r.Site)
            .Where(r => r.SiteId == request.SiteId && r.IsActive)
            .OrderBy(r => r.Name)
            .Select(r => new FuelRouteDTO
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                FromLocation = r.FromLocation,
                ToLocation = r.ToLocation,
                DistanceKm = r.DistanceKm,
                ElevationChange = r.ElevationChange,
                RouteType = r.RouteType,
                SiteId = r.SiteId,
                SiteName = r.Site != null ? r.Site.Name : null,
                IsActive = r.IsActive
            })
            .ToListAsync(cancellationToken);

        return FMSResponse<List<FuelRouteDTO>>.Success(routes);
    }
}

#endregion

#region Load Classification Queries

/// <summary>
/// Query to get all load classifications
/// </summary>
public record GetLoadClassificationsQuery(bool IncludeInactive = false)
    : IRequest<FMSResponse<List<LoadClassificationDTO>>>;

public class GetLoadClassificationsQueryHandler
    : IRequestHandler<GetLoadClassificationsQuery, FMSResponse<List<LoadClassificationDTO>>>
{
    private readonly GpsdataContext _context;

    public GetLoadClassificationsQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<List<LoadClassificationDTO>>> Handle(
        GetLoadClassificationsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.LoadClassifications.AsQueryable();

        if (!request.IncludeInactive)
            query = query.Where(c => c.IsActive);

        var classifications = await query
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new LoadClassificationDTO
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                MinWeightTonnes = c.MinWeightTonnes,
                MaxWeightTonnes = c.MaxWeightTonnes,
                SortOrder = c.SortOrder,
                IsActive = c.IsActive
            })
            .ToListAsync(cancellationToken);

        return FMSResponse<List<LoadClassificationDTO>>.Success(classifications);
    }
}

#endregion

#region Usage Intensity Queries

/// <summary>
/// Query to get all usage intensities
/// </summary>
public record GetUsageIntensitiesQuery(bool IncludeInactive = false)
    : IRequest<FMSResponse<List<UsageIntensityDTO>>>;

public class GetUsageIntensitiesQueryHandler
    : IRequestHandler<GetUsageIntensitiesQuery, FMSResponse<List<UsageIntensityDTO>>>
{
    private readonly GpsdataContext _context;

    public GetUsageIntensitiesQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<List<UsageIntensityDTO>>> Handle(
        GetUsageIntensitiesQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.UsageIntensities.AsQueryable();

        if (!request.IncludeInactive)
            query = query.Where(i => i.IsActive);

        var intensities = await query
            .OrderBy(i => i.SortOrder)
            .ThenBy(i => i.Name)
            .Select(i => new UsageIntensityDTO
            {
                Id = i.Id,
                Name = i.Name,
                Description = i.Description,
                TypicalHoursPerDay = i.TypicalHoursPerDay,
                SortOrder = i.SortOrder,
                IsActive = i.IsActive
            })
            .ToListAsync(cancellationToken);

        return FMSResponse<List<UsageIntensityDTO>>.Success(intensities);
    }
}

#endregion

#region Expected Fuel Average Template Queries

/// <summary>
/// Query to get all expected fuel average templates
/// </summary>
public record GetExpectedFuelAverageTemplatesQuery(
    int? VehicleTypeId = null,
    int? VehicleManufacturerId = null,
    int? VehicleModelId = null,
    int? SiteId = null,
    bool? IsKmPerLiter = null,
    bool IncludeInactive = false
) : IRequest<FMSResponse<List<ExpectedFuelAverageTemplateDTO>>>;

public class GetExpectedFuelAverageTemplatesQueryHandler
    : IRequestHandler<GetExpectedFuelAverageTemplatesQuery, FMSResponse<List<ExpectedFuelAverageTemplateDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    public GetExpectedFuelAverageTemplatesQueryHandler(GpsdataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<FMSResponse<List<ExpectedFuelAverageTemplateDTO>>> Handle(
        GetExpectedFuelAverageTemplatesQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.ExpectedFuelAverageTemplates
            .Include(t => t.VehicleType)
            .Include(t => t.VehicleManufacturer)
            .Include(t => t.VehicleModel)
            .Include(t => t.Site)
            .Include(t => t.FuelRoute)
            .Include(t => t.LoadClassification)
            .Include(t => t.UsageIntensity)
            .AsQueryable();

        if (!request.IncludeInactive)
            query = query.Where(t => t.IsActive);

        if (request.VehicleTypeId.HasValue)
            query = query.Where(t => t.VehicleTypeId == request.VehicleTypeId.Value);

        if (request.VehicleManufacturerId.HasValue)
            query = query.Where(t => t.VehicleManufacturerId == request.VehicleManufacturerId.Value);

        if (request.VehicleModelId.HasValue)
            query = query.Where(t => t.VehicleModelId == request.VehicleModelId.Value);

        if (request.SiteId.HasValue)
            query = query.Where(t => t.SiteId == request.SiteId.Value || t.SiteId == null);

        if (request.IsKmPerLiter.HasValue)
            query = query.Where(t => t.IsKmPerLiter == request.IsKmPerLiter.Value);

        var templates = await query
            .OrderBy(t => t.VehicleType.Name)
            .ThenBy(t => t.VehicleManufacturer != null ? t.VehicleManufacturer.Name : "")
            .ThenBy(t => t.Name)
            .Select(t => new ExpectedFuelAverageTemplateDTO
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                VehicleTypeId = t.VehicleTypeId,
                VehicleTypeName = t.VehicleType != null ? t.VehicleType.Name : null,
                VehicleManufacturerId = t.VehicleManufacturerId,
                VehicleManufacturerName = t.VehicleManufacturer != null ? t.VehicleManufacturer.Name : null,
                VehicleModelId = t.VehicleModelId,
                VehicleModelName = t.VehicleModel != null ? t.VehicleModel.Name : null,
                YearOfManufacture = t.YearOfManufacture,
                SiteId = t.SiteId,
                SiteName = t.Site != null ? t.Site.Name : null,
                FuelRouteId = t.FuelRouteId,
                FuelRouteName = t.FuelRoute != null ? t.FuelRoute.Name : null,
                LoadClassificationId = t.LoadClassificationId,
                LoadClassificationName = t.LoadClassification != null ? t.LoadClassification.Name : null,
                UsageIntensityId = t.UsageIntensityId,
                UsageIntensityName = t.UsageIntensity != null ? t.UsageIntensity.Name : null,
                IsKmPerLiter = t.IsKmPerLiter,
                ExpectedValue = t.ExpectedValue,
                MinThreshold = t.MinThreshold,
                MaxThreshold = t.MaxThreshold,
                TolerancePercent = t.TolerancePercent,
                Priority = t.Priority,
                IsActive = t.IsActive,
                EffectiveFrom = t.EffectiveFrom,
                EffectiveTo = t.EffectiveTo,
                CreatedAt = t.CreatedAt,
                CreatedBy = t.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return FMSResponse<List<ExpectedFuelAverageTemplateDTO>>.Success(templates);
    }
}

/// <summary>
/// Query to get a specific template by ID
/// </summary>
public record GetExpectedFuelAverageTemplateByIdQuery(int Id)
    : IRequest<FMSResponse<ExpectedFuelAverageTemplateDTO>>;

public class GetExpectedFuelAverageTemplateByIdQueryHandler
    : IRequestHandler<GetExpectedFuelAverageTemplateByIdQuery, FMSResponse<ExpectedFuelAverageTemplateDTO>>
{
    private readonly GpsdataContext _context;

    public GetExpectedFuelAverageTemplateByIdQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<ExpectedFuelAverageTemplateDTO>> Handle(
        GetExpectedFuelAverageTemplateByIdQuery request,
        CancellationToken cancellationToken)
    {
        var template = await _context.ExpectedFuelAverageTemplates
            .Include(t => t.VehicleType)
            .Include(t => t.VehicleManufacturer)
            .Include(t => t.VehicleModel)
            .Include(t => t.Site)
            .Include(t => t.FuelRoute)
            .Include(t => t.LoadClassification)
            .Include(t => t.UsageIntensity)
            .Where(t => t.Id == request.Id)
            .Select(t => new ExpectedFuelAverageTemplateDTO
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                VehicleTypeId = t.VehicleTypeId,
                VehicleTypeName = t.VehicleType != null ? t.VehicleType.Name : null,
                VehicleManufacturerId = t.VehicleManufacturerId,
                VehicleManufacturerName = t.VehicleManufacturer != null ? t.VehicleManufacturer.Name : null,
                VehicleModelId = t.VehicleModelId,
                VehicleModelName = t.VehicleModel != null ? t.VehicleModel.Name : null,
                YearOfManufacture = t.YearOfManufacture,
                SiteId = t.SiteId,
                SiteName = t.Site != null ? t.Site.Name : null,
                FuelRouteId = t.FuelRouteId,
                FuelRouteName = t.FuelRoute != null ? t.FuelRoute.Name : null,
                LoadClassificationId = t.LoadClassificationId,
                LoadClassificationName = t.LoadClassification != null ? t.LoadClassification.Name : null,
                UsageIntensityId = t.UsageIntensityId,
                UsageIntensityName = t.UsageIntensity != null ? t.UsageIntensity.Name : null,
                IsKmPerLiter = t.IsKmPerLiter,
                ExpectedValue = t.ExpectedValue,
                MinThreshold = t.MinThreshold,
                MaxThreshold = t.MaxThreshold,
                TolerancePercent = t.TolerancePercent,
                Priority = t.Priority,
                IsActive = t.IsActive,
                EffectiveFrom = t.EffectiveFrom,
                EffectiveTo = t.EffectiveTo,
                CreatedAt = t.CreatedAt,
                CreatedBy = t.CreatedBy
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (template == null)
            return FMSResponse<ExpectedFuelAverageTemplateDTO>.NotFound("Template not found");

        return FMSResponse<ExpectedFuelAverageTemplateDTO>.Success(template);
    }
}

/// <summary>
/// Query to find matching templates for a vehicle
/// </summary>
public record GetMatchingTemplatesForVehicleQuery(int VehicleId)
    : IRequest<FMSResponse<List<ExpectedFuelAverageTemplateDTO>>>;

public class GetMatchingTemplatesForVehicleQueryHandler
    : IRequestHandler<GetMatchingTemplatesForVehicleQuery, FMSResponse<List<ExpectedFuelAverageTemplateDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetMatchingTemplatesForVehicleQueryHandler> _logger;

    public GetMatchingTemplatesForVehicleQueryHandler(GpsdataContext context, ILogger<GetMatchingTemplatesForVehicleQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<ExpectedFuelAverageTemplateDTO>>> Handle(
        GetMatchingTemplatesForVehicleQuery request,
        CancellationToken cancellationToken)
    {
        // Get the vehicle details
        var vehicle = await _context.Vehicles
            .Include(v => v.VehicleType)
            .Include(v => v.VehicleManufacturer)
            .Include(v => v.VehicleModel)
            .FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId, cancellationToken);

        if (vehicle == null)
            return FMSResponse<List<ExpectedFuelAverageTemplateDTO>>.NotFound("Vehicle not found");

        // Find matching templates with progressive specificity
        var now = DateTime.UtcNow;
        var templates = await _context.ExpectedFuelAverageTemplates
            .Include(t => t.VehicleType)
            .Include(t => t.VehicleManufacturer)
            .Include(t => t.VehicleModel)
            .Include(t => t.Site)
            .Include(t => t.FuelRoute)
            .Include(t => t.LoadClassification)
            .Include(t => t.UsageIntensity)
            .Where(t => t.IsActive && t.VehicleTypeId == vehicle.VehicleTypeId)
            .Where(t =>
                // Exclude templates not yet effective
                !t.EffectiveFrom.HasValue || t.EffectiveFrom.Value <= now)
            .Where(t =>
                // Exclude expired templates
                !t.EffectiveTo.HasValue || t.EffectiveTo.Value >= now)
            .Where(t =>
                // Match manufacturer (or null for any manufacturer)
                t.VehicleManufacturerId == null || t.VehicleManufacturerId == vehicle.VehicleManufacturerId)
            .Where(t =>
                // Match model (or null for any model)
                t.VehicleModelId == null || t.VehicleModelId == vehicle.VehicleModelId)
            .Where(t =>
                // Match site (or null for company-wide)
                t.SiteId == null || t.SiteId == vehicle.WorkingSiteId)
            .OrderByDescending(t => t.Priority)
            .ThenByDescending(t => t.VehicleModelId != null ? 1 : 0) // More specific first
            .ThenByDescending(t => t.VehicleManufacturerId != null ? 1 : 0)
            .ThenByDescending(t => t.SiteId != null ? 1 : 0)
            .Select(t => new ExpectedFuelAverageTemplateDTO
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                VehicleTypeId = t.VehicleTypeId,
                VehicleTypeName = t.VehicleType != null ? t.VehicleType.Name : null,
                VehicleManufacturerId = t.VehicleManufacturerId,
                VehicleManufacturerName = t.VehicleManufacturer != null ? t.VehicleManufacturer.Name : null,
                VehicleModelId = t.VehicleModelId,
                VehicleModelName = t.VehicleModel != null ? t.VehicleModel.Name : null,
                YearOfManufacture = t.YearOfManufacture,
                SiteId = t.SiteId,
                SiteName = t.Site != null ? t.Site.Name : null,
                FuelRouteId = t.FuelRouteId,
                FuelRouteName = t.FuelRoute != null ? t.FuelRoute.Name : null,
                LoadClassificationId = t.LoadClassificationId,
                LoadClassificationName = t.LoadClassification != null ? t.LoadClassification.Name : null,
                UsageIntensityId = t.UsageIntensityId,
                UsageIntensityName = t.UsageIntensity != null ? t.UsageIntensity.Name : null,
                IsKmPerLiter = t.IsKmPerLiter,
                ExpectedValue = t.ExpectedValue,
                MinThreshold = t.MinThreshold,
                MaxThreshold = t.MaxThreshold,
                TolerancePercent = t.TolerancePercent,
                Priority = t.Priority,
                IsActive = t.IsActive,
                EffectiveFrom = t.EffectiveFrom,
                EffectiveTo = t.EffectiveTo,
                CreatedAt = t.CreatedAt,
                CreatedBy = t.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return FMSResponse<List<ExpectedFuelAverageTemplateDTO>>.Success(templates);
    }
}

#endregion

#region Vehicle Assignment Queries

/// <summary>
/// Query to get all expected average assignments for a vehicle
/// </summary>
public record GetVehicleExpectedAverageAssignmentsQuery(int VehicleId)
    : IRequest<FMSResponse<VehicleExpectedAverageSummaryDTO>>;

public class GetVehicleExpectedAverageAssignmentsQueryHandler
    : IRequestHandler<GetVehicleExpectedAverageAssignmentsQuery, FMSResponse<VehicleExpectedAverageSummaryDTO>>
{
    private readonly GpsdataContext _context;

    public GetVehicleExpectedAverageAssignmentsQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<VehicleExpectedAverageSummaryDTO>> Handle(
        GetVehicleExpectedAverageAssignmentsQuery request,
        CancellationToken cancellationToken)
    {
        var vehicle = await _context.Vehicles
            .Include(v => v.VehicleType)
            .FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId, cancellationToken);

        if (vehicle == null)
            return FMSResponse<VehicleExpectedAverageSummaryDTO>.NotFound("Vehicle not found");

        var assignments = await _context.VehicleExpectedAverageAssignments
            .Include(a => a.ExpectedFuelAverageTemplate)
                .ThenInclude(t => t.VehicleType)
            .Include(a => a.ExpectedFuelAverageTemplate)
                .ThenInclude(t => t.VehicleManufacturer)
            .Include(a => a.ExpectedFuelAverageTemplate)
                .ThenInclude(t => t.VehicleModel)
            .Include(a => a.ExpectedFuelAverageTemplate)
                .ThenInclude(t => t.Site)
            .Include(a => a.ExpectedFuelAverageTemplate)
                .ThenInclude(t => t.FuelRoute)
            .Include(a => a.ExpectedFuelAverageTemplate)
                .ThenInclude(t => t.LoadClassification)
            .Include(a => a.ExpectedFuelAverageTemplate)
                .ThenInclude(t => t.UsageIntensity)
            .Where(a => a.VehicleId == request.VehicleId && a.IsActive)
            .OrderByDescending(a => a.IsDefault)
            .ThenBy(a => a.ExpectedFuelAverageTemplate.Name)
            .ToListAsync(cancellationToken);

        var assignmentDtos = assignments.Select(a => new VehicleExpectedAverageAssignmentDTO
        {
            Id = a.Id,
            VehicleId = a.VehicleId,
            VehicleCode = vehicle.VehicleCode,
            VehicleNumberPlate = vehicle.NumberPlate,
            ExpectedFuelAverageTemplateId = a.ExpectedFuelAverageTemplateId,
            TemplateName = a.ExpectedFuelAverageTemplate.Name,
            IsDefault = a.IsDefault,
            OverrideExpectedValue = a.OverrideExpectedValue,
            OverrideTolerancePercent = a.OverrideTolerancePercent,
            Notes = a.Notes,
            IsActive = a.IsActive,
            Template = new ExpectedFuelAverageTemplateDTO
            {
                Id = a.ExpectedFuelAverageTemplate.Id,
                Name = a.ExpectedFuelAverageTemplate.Name,
                VehicleTypeId = a.ExpectedFuelAverageTemplate.VehicleTypeId,
                VehicleTypeName = a.ExpectedFuelAverageTemplate.VehicleType?.Name,
                VehicleManufacturerId = a.ExpectedFuelAverageTemplate.VehicleManufacturerId,
                VehicleManufacturerName = a.ExpectedFuelAverageTemplate.VehicleManufacturer?.Name,
                VehicleModelId = a.ExpectedFuelAverageTemplate.VehicleModelId,
                VehicleModelName = a.ExpectedFuelAverageTemplate.VehicleModel?.Name,
                SiteId = a.ExpectedFuelAverageTemplate.SiteId,
                SiteName = a.ExpectedFuelAverageTemplate.Site?.Name,
                FuelRouteId = a.ExpectedFuelAverageTemplate.FuelRouteId,
                FuelRouteName = a.ExpectedFuelAverageTemplate.FuelRoute?.Name,
                LoadClassificationId = a.ExpectedFuelAverageTemplate.LoadClassificationId,
                LoadClassificationName = a.ExpectedFuelAverageTemplate.LoadClassification?.Name,
                UsageIntensityId = a.ExpectedFuelAverageTemplate.UsageIntensityId,
                UsageIntensityName = a.ExpectedFuelAverageTemplate.UsageIntensity?.Name,
                IsKmPerLiter = a.ExpectedFuelAverageTemplate.IsKmPerLiter,
                ExpectedValue = a.ExpectedFuelAverageTemplate.ExpectedValue,
                MinThreshold = a.ExpectedFuelAverageTemplate.MinThreshold,
                MaxThreshold = a.ExpectedFuelAverageTemplate.MaxThreshold,
                TolerancePercent = a.ExpectedFuelAverageTemplate.TolerancePercent,
                Priority = a.ExpectedFuelAverageTemplate.Priority,
                IsActive = a.ExpectedFuelAverageTemplate.IsActive
            }
        }).ToList();

        var summary = new VehicleExpectedAverageSummaryDTO
        {
            VehicleId = vehicle.VehicleId,
            VehicleCode = vehicle.VehicleCode,
            VehicleTypeName = vehicle.VehicleType?.Name,
            IsKmPerLiter = vehicle.AverageKmL,
            DefaultAssignment = assignmentDtos.FirstOrDefault(a => a.IsDefault),
            AllAssignments = assignmentDtos,
            TotalAssignments = assignmentDtos.Count
        };

        return FMSResponse<VehicleExpectedAverageSummaryDTO>.Success(summary);
    }
}

/// <summary>
/// Query to get all vehicles with their expected average assignments (for admin grid view)
/// </summary>
public record GetAllVehicleExpectedAveragesQuery(
    int? SiteId = null,
    int? VehicleTypeId = null,
    bool OnlyWithoutAssignment = false
) : IRequest<FMSResponse<List<VehicleExpectedAverageSummaryDTO>>>;

public class GetAllVehicleExpectedAveragesQueryHandler
    : IRequestHandler<GetAllVehicleExpectedAveragesQuery, FMSResponse<List<VehicleExpectedAverageSummaryDTO>>>
{
    private readonly GpsdataContext _context;

    public GetAllVehicleExpectedAveragesQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<List<VehicleExpectedAverageSummaryDTO>>> Handle(
        GetAllVehicleExpectedAveragesQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Vehicles
            .Include(v => v.VehicleType)
            .Include(v => v.ExpectedAverageAssignments)
                .ThenInclude(a => a.ExpectedFuelAverageTemplate)
            .Where(v => v.IsActive == 1)
            .AsQueryable();

        if (request.SiteId.HasValue)
            query = query.Where(v => v.WorkingSiteId == request.SiteId.Value);

        if (request.VehicleTypeId.HasValue)
            query = query.Where(v => v.VehicleTypeId == request.VehicleTypeId.Value);

        if (request.OnlyWithoutAssignment)
            query = query.Where(v => !v.ExpectedAverageAssignments.Any(a => a.IsActive));

        var vehicles = await query
            .OrderBy(v => v.VehicleCode)
            .ToListAsync(cancellationToken);

        var summaries = vehicles.Select(v =>
        {
            var activeAssignments = v.ExpectedAverageAssignments
                .Where(a => a.IsActive)
                .OrderByDescending(a => a.IsDefault)
                .Select(a => new VehicleExpectedAverageAssignmentDTO
                {
                    Id = a.Id,
                    VehicleId = a.VehicleId,
                    VehicleCode = v.VehicleCode,
                    VehicleNumberPlate = v.NumberPlate,
                    ExpectedFuelAverageTemplateId = a.ExpectedFuelAverageTemplateId,
                    TemplateName = a.ExpectedFuelAverageTemplate?.Name,
                    IsDefault = a.IsDefault,
                    OverrideExpectedValue = a.OverrideExpectedValue,
                    OverrideTolerancePercent = a.OverrideTolerancePercent,
                    Notes = a.Notes,
                    IsActive = a.IsActive,
                    Template = a.ExpectedFuelAverageTemplate != null ? new ExpectedFuelAverageTemplateDTO
                    {
                        Id = a.ExpectedFuelAverageTemplate.Id,
                        Name = a.ExpectedFuelAverageTemplate.Name,
                        IsKmPerLiter = a.ExpectedFuelAverageTemplate.IsKmPerLiter,
                        ExpectedValue = a.ExpectedFuelAverageTemplate.ExpectedValue
                    } : null
                })
                .ToList();

            return new VehicleExpectedAverageSummaryDTO
            {
                VehicleId = v.VehicleId,
                VehicleCode = v.VehicleCode,
                VehicleTypeName = v.VehicleType?.Name,
                IsKmPerLiter = v.AverageKmL,
                DefaultAssignment = activeAssignments.FirstOrDefault(a => a.IsDefault),
                AllAssignments = activeAssignments,
                TotalAssignments = activeAssignments.Count
            };
        }).ToList();

        return FMSResponse<List<VehicleExpectedAverageSummaryDTO>>.Success(summaries);
    }
}

#endregion
