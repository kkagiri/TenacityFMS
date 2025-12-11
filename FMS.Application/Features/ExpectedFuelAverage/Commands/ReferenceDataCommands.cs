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

#region Fuel Route Commands

/// <summary>
/// Command to create a new fuel route
/// </summary>
public record CreateFuelRouteCommand(FuelRouteDTO RouteDTO) : IRequest<FMSResponse<FuelRouteDTO>>;

public class CreateFuelRouteCommandHandler : IRequestHandler<CreateFuelRouteCommand, FMSResponse<FuelRouteDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateFuelRouteCommandHandler> _logger;

    public CreateFuelRouteCommandHandler(GpsdataContext context, IMapper mapper, ILogger<CreateFuelRouteCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<FuelRouteDTO>> Handle(CreateFuelRouteCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(request.RouteDTO.Name))
                return FMSResponse<FuelRouteDTO>.Failed("Route name is required");

            if (string.IsNullOrWhiteSpace(request.RouteDTO.FromLocation))
                return FMSResponse<FuelRouteDTO>.Failed("From location is required");

            if (string.IsNullOrWhiteSpace(request.RouteDTO.ToLocation))
                return FMSResponse<FuelRouteDTO>.Failed("To location is required");

            // Check for duplicate
            var exists = await _context.FuelRoutes.AnyAsync(r =>
                r.Name == request.RouteDTO.Name ||
                (r.FromLocation == request.RouteDTO.FromLocation && r.ToLocation == request.RouteDTO.ToLocation),
                cancellationToken);

            if (exists)
                return FMSResponse<FuelRouteDTO>.Failed("A route with this name or from/to locations already exists");

            var route = new FuelRoute
            {
                Name = request.RouteDTO.Name,
                Description = request.RouteDTO.Description,
                FromLocation = request.RouteDTO.FromLocation,
                ToLocation = request.RouteDTO.ToLocation,
                DistanceKm = request.RouteDTO.DistanceKm,
                ElevationChange = request.RouteDTO.ElevationChange,
                RouteType = request.RouteDTO.RouteType,
                SiteId = request.RouteDTO.SiteId,
                IsActive = request.RouteDTO.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.FuelRoutes.Add(route);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created fuel route {RouteId}: {RouteName}", route.Id, route.Name);

            var resultDto = _mapper.Map<FuelRouteDTO>(route);
            return FMSResponse<FuelRouteDTO>.Success(resultDto, "Fuel route created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating fuel route");
            return FMSResponse<FuelRouteDTO>.Failed($"Error creating fuel route: {ex.Message}");
        }
    }
}

/// <summary>
/// Command to update a fuel route
/// </summary>
public record UpdateFuelRouteCommand(int Id, FuelRouteDTO RouteDTO) : IRequest<FMSResponse<FuelRouteDTO>>;

public class UpdateFuelRouteCommandHandler : IRequestHandler<UpdateFuelRouteCommand, FMSResponse<FuelRouteDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateFuelRouteCommandHandler> _logger;

    public UpdateFuelRouteCommandHandler(GpsdataContext context, IMapper mapper, ILogger<UpdateFuelRouteCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<FuelRouteDTO>> Handle(UpdateFuelRouteCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var route = await _context.FuelRoutes.FindAsync(new object[] { request.Id }, cancellationToken);
            if (route == null)
                return FMSResponse<FuelRouteDTO>.NotFound("Fuel route not found");

            route.Name = request.RouteDTO.Name;
            route.Description = request.RouteDTO.Description;
            route.FromLocation = request.RouteDTO.FromLocation;
            route.ToLocation = request.RouteDTO.ToLocation;
            route.DistanceKm = request.RouteDTO.DistanceKm;
            route.ElevationChange = request.RouteDTO.ElevationChange;
            route.RouteType = request.RouteDTO.RouteType;
            route.SiteId = request.RouteDTO.SiteId;
            route.IsActive = request.RouteDTO.IsActive;
            route.ModifiedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated fuel route {RouteId}", route.Id);

            var resultDto = _mapper.Map<FuelRouteDTO>(route);
            return FMSResponse<FuelRouteDTO>.Success(resultDto, "Fuel route updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating fuel route {RouteId}", request.Id);
            return FMSResponse<FuelRouteDTO>.Failed($"Error updating fuel route: {ex.Message}");
        }
    }
}

/// <summary>
/// Command to delete a fuel route
/// </summary>
public record DeleteFuelRouteCommand(int Id) : IRequest<FMSResponse<bool>>;

public class DeleteFuelRouteCommandHandler : IRequestHandler<DeleteFuelRouteCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteFuelRouteCommandHandler> _logger;

    public DeleteFuelRouteCommandHandler(GpsdataContext context, ILogger<DeleteFuelRouteCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteFuelRouteCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var route = await _context.FuelRoutes.FindAsync(new object[] { request.Id }, cancellationToken);
            if (route == null)
                return FMSResponse<bool>.NotFound("Fuel route not found");

            // Check if route is being used by any templates
            var isUsed = await _context.ExpectedFuelAverageTemplates.AnyAsync(t => t.FuelRouteId == request.Id, cancellationToken);
            if (isUsed)
            {
                // Soft delete instead
                route.IsActive = false;
                route.ModifiedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
                return FMSResponse<bool>.Success(true, "Fuel route deactivated (in use by templates)");
            }

            _context.FuelRoutes.Remove(route);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted fuel route {RouteId}", request.Id);
            return FMSResponse<bool>.Success(true, "Fuel route deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting fuel route {RouteId}", request.Id);
            return FMSResponse<bool>.Failed($"Error deleting fuel route: {ex.Message}");
        }
    }
}

#endregion

#region Load Classification Commands

/// <summary>
/// Command to create a new load classification
/// </summary>
public record CreateLoadClassificationCommand(LoadClassificationDTO ClassificationDTO) : IRequest<FMSResponse<LoadClassificationDTO>>;

public class CreateLoadClassificationCommandHandler : IRequestHandler<CreateLoadClassificationCommand, FMSResponse<LoadClassificationDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateLoadClassificationCommandHandler> _logger;

    public CreateLoadClassificationCommandHandler(GpsdataContext context, IMapper mapper, ILogger<CreateLoadClassificationCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<LoadClassificationDTO>> Handle(CreateLoadClassificationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.ClassificationDTO.Name))
                return FMSResponse<LoadClassificationDTO>.Failed("Classification name is required");

            var exists = await _context.LoadClassifications.AnyAsync(c => c.Name == request.ClassificationDTO.Name, cancellationToken);
            if (exists)
                return FMSResponse<LoadClassificationDTO>.Failed("A load classification with this name already exists");

            var classification = new LoadClassification
            {
                Name = request.ClassificationDTO.Name,
                Description = request.ClassificationDTO.Description,
                MinWeightTonnes = request.ClassificationDTO.MinWeightTonnes,
                MaxWeightTonnes = request.ClassificationDTO.MaxWeightTonnes,
                SortOrder = request.ClassificationDTO.SortOrder,
                IsActive = request.ClassificationDTO.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.LoadClassifications.Add(classification);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created load classification {Id}: {Name}", classification.Id, classification.Name);

            var resultDto = _mapper.Map<LoadClassificationDTO>(classification);
            return FMSResponse<LoadClassificationDTO>.Success(resultDto, "Load classification created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating load classification");
            return FMSResponse<LoadClassificationDTO>.Failed($"Error creating load classification: {ex.Message}");
        }
    }
}

/// <summary>
/// Command to update a load classification
/// </summary>
public record UpdateLoadClassificationCommand(int Id, LoadClassificationDTO ClassificationDTO) : IRequest<FMSResponse<LoadClassificationDTO>>;

public class UpdateLoadClassificationCommandHandler : IRequestHandler<UpdateLoadClassificationCommand, FMSResponse<LoadClassificationDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateLoadClassificationCommandHandler> _logger;

    public UpdateLoadClassificationCommandHandler(GpsdataContext context, IMapper mapper, ILogger<UpdateLoadClassificationCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<LoadClassificationDTO>> Handle(UpdateLoadClassificationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var classification = await _context.LoadClassifications.FindAsync(new object[] { request.Id }, cancellationToken);
            if (classification == null)
                return FMSResponse<LoadClassificationDTO>.NotFound("Load classification not found");

            classification.Name = request.ClassificationDTO.Name;
            classification.Description = request.ClassificationDTO.Description;
            classification.MinWeightTonnes = request.ClassificationDTO.MinWeightTonnes;
            classification.MaxWeightTonnes = request.ClassificationDTO.MaxWeightTonnes;
            classification.SortOrder = request.ClassificationDTO.SortOrder;
            classification.IsActive = request.ClassificationDTO.IsActive;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated load classification {Id}", classification.Id);

            var resultDto = _mapper.Map<LoadClassificationDTO>(classification);
            return FMSResponse<LoadClassificationDTO>.Success(resultDto, "Load classification updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating load classification {Id}", request.Id);
            return FMSResponse<LoadClassificationDTO>.Failed($"Error updating load classification: {ex.Message}");
        }
    }
}

/// <summary>
/// Command to delete a load classification
/// </summary>
public record DeleteLoadClassificationCommand(int Id) : IRequest<FMSResponse<bool>>;

public class DeleteLoadClassificationCommandHandler : IRequestHandler<DeleteLoadClassificationCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteLoadClassificationCommandHandler> _logger;

    public DeleteLoadClassificationCommandHandler(GpsdataContext context, ILogger<DeleteLoadClassificationCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteLoadClassificationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var classification = await _context.LoadClassifications.FindAsync(new object[] { request.Id }, cancellationToken);
            if (classification == null)
                return FMSResponse<bool>.NotFound("Load classification not found");

            var isUsed = await _context.ExpectedFuelAverageTemplates.AnyAsync(t => t.LoadClassificationId == request.Id, cancellationToken);
            if (isUsed)
            {
                classification.IsActive = false;
                await _context.SaveChangesAsync(cancellationToken);
                return FMSResponse<bool>.Success(true, "Load classification deactivated (in use by templates)");
            }

            _context.LoadClassifications.Remove(classification);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted load classification {Id}", request.Id);
            return FMSResponse<bool>.Success(true, "Load classification deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting load classification {Id}", request.Id);
            return FMSResponse<bool>.Failed($"Error deleting load classification: {ex.Message}");
        }
    }
}

#endregion

#region Usage Intensity Commands

/// <summary>
/// Command to create a new usage intensity
/// </summary>
public record CreateUsageIntensityCommand(UsageIntensityDTO IntensityDTO) : IRequest<FMSResponse<UsageIntensityDTO>>;

public class CreateUsageIntensityCommandHandler : IRequestHandler<CreateUsageIntensityCommand, FMSResponse<UsageIntensityDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateUsageIntensityCommandHandler> _logger;

    public CreateUsageIntensityCommandHandler(GpsdataContext context, IMapper mapper, ILogger<CreateUsageIntensityCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<UsageIntensityDTO>> Handle(CreateUsageIntensityCommand request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.IntensityDTO.Name))
                return FMSResponse<UsageIntensityDTO>.Failed("Usage intensity name is required");

            var exists = await _context.UsageIntensities.AnyAsync(i => i.Name == request.IntensityDTO.Name, cancellationToken);
            if (exists)
                return FMSResponse<UsageIntensityDTO>.Failed("A usage intensity with this name already exists");

            var intensity = new UsageIntensity
            {
                Name = request.IntensityDTO.Name,
                Description = request.IntensityDTO.Description,
                TypicalHoursPerDay = request.IntensityDTO.TypicalHoursPerDay,
                SortOrder = request.IntensityDTO.SortOrder,
                IsActive = request.IntensityDTO.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.UsageIntensities.Add(intensity);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created usage intensity {Id}: {Name}", intensity.Id, intensity.Name);

            var resultDto = _mapper.Map<UsageIntensityDTO>(intensity);
            return FMSResponse<UsageIntensityDTO>.Success(resultDto, "Usage intensity created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating usage intensity");
            return FMSResponse<UsageIntensityDTO>.Failed($"Error creating usage intensity: {ex.Message}");
        }
    }
}

/// <summary>
/// Command to update a usage intensity
/// </summary>
public record UpdateUsageIntensityCommand(int Id, UsageIntensityDTO IntensityDTO) : IRequest<FMSResponse<UsageIntensityDTO>>;

public class UpdateUsageIntensityCommandHandler : IRequestHandler<UpdateUsageIntensityCommand, FMSResponse<UsageIntensityDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateUsageIntensityCommandHandler> _logger;

    public UpdateUsageIntensityCommandHandler(GpsdataContext context, IMapper mapper, ILogger<UpdateUsageIntensityCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<UsageIntensityDTO>> Handle(UpdateUsageIntensityCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var intensity = await _context.UsageIntensities.FindAsync(new object[] { request.Id }, cancellationToken);
            if (intensity == null)
                return FMSResponse<UsageIntensityDTO>.NotFound("Usage intensity not found");

            intensity.Name = request.IntensityDTO.Name;
            intensity.Description = request.IntensityDTO.Description;
            intensity.TypicalHoursPerDay = request.IntensityDTO.TypicalHoursPerDay;
            intensity.SortOrder = request.IntensityDTO.SortOrder;
            intensity.IsActive = request.IntensityDTO.IsActive;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated usage intensity {Id}", intensity.Id);

            var resultDto = _mapper.Map<UsageIntensityDTO>(intensity);
            return FMSResponse<UsageIntensityDTO>.Success(resultDto, "Usage intensity updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating usage intensity {Id}", request.Id);
            return FMSResponse<UsageIntensityDTO>.Failed($"Error updating usage intensity: {ex.Message}");
        }
    }
}

/// <summary>
/// Command to delete a usage intensity
/// </summary>
public record DeleteUsageIntensityCommand(int Id) : IRequest<FMSResponse<bool>>;

public class DeleteUsageIntensityCommandHandler : IRequestHandler<DeleteUsageIntensityCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteUsageIntensityCommandHandler> _logger;

    public DeleteUsageIntensityCommandHandler(GpsdataContext context, ILogger<DeleteUsageIntensityCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteUsageIntensityCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var intensity = await _context.UsageIntensities.FindAsync(new object[] { request.Id }, cancellationToken);
            if (intensity == null)
                return FMSResponse<bool>.NotFound("Usage intensity not found");

            var isUsed = await _context.ExpectedFuelAverageTemplates.AnyAsync(t => t.UsageIntensityId == request.Id, cancellationToken);
            if (isUsed)
            {
                intensity.IsActive = false;
                await _context.SaveChangesAsync(cancellationToken);
                return FMSResponse<bool>.Success(true, "Usage intensity deactivated (in use by templates)");
            }

            _context.UsageIntensities.Remove(intensity);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted usage intensity {Id}", request.Id);
            return FMSResponse<bool>.Success(true, "Usage intensity deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting usage intensity {Id}", request.Id);
            return FMSResponse<bool>.Failed($"Error deleting usage intensity: {ex.Message}");
        }
    }
}

#endregion
