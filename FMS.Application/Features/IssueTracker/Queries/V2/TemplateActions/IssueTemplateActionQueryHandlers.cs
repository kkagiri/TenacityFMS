/**
 * File: IssueTemplateActionQueryHandlers.cs
 * Purpose: Query handlers for IssueTemplateAction read operations
 * Dependencies: MediatR, EF Core, GpsdataContext, FMSResponse
 * Last Modified: 2026-02-21
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Queries.V2.TemplateActions;

public class GetTemplateActionsQueryHandler : IRequestHandler<GetTemplateActionsQuery, FMSResponse<List<IssueTemplateActionDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetTemplateActionsQueryHandler> _logger;

    public GetTemplateActionsQueryHandler(GpsdataContext context, ILogger<GetTemplateActionsQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<IssueTemplateActionDTO>>> Handle(GetTemplateActionsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.IssueTemplateActions
                .Include(a => a.IssueTemplate)
                .AsQueryable();

            if (request.IssueTemplateId.HasValue)
            {
                query = query.Where(a => a.IssueTemplateId == request.IssueTemplateId.Value);
            }

            if (request.ActiveOnly)
            {
                query = query.Where(a => a.IsActive);
            }

            var actions = await query
                .OrderBy(a => a.IssueTemplateId)
                .ThenBy(a => a.SortOrder)
                .ThenBy(a => a.Name)
                .Select(a => new IssueTemplateActionDTO
                {
                    Id = a.Id,
                    IssueTemplateId = a.IssueTemplateId,
                    IssueTemplateName = a.IssueTemplate.Name,
                    Name = a.Name,
                    ActionType = a.ActionType,
                    Description = a.Description,
                    RequiresDeviceDetails = a.RequiresDeviceDetails,
                    RequiresSourceVehicle = a.RequiresSourceVehicle,
                    RequiresCameraDetails = a.RequiresCameraDetails,
                    SortOrder = a.SortOrder,
                    IsActive = a.IsActive,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt
                })
                .ToListAsync(cancellationToken);

            return FMSResponse<List<IssueTemplateActionDTO>>.Success(actions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching template actions");
            return FMSResponse<List<IssueTemplateActionDTO>>.Failed($"Error fetching template actions: {ex.Message}");
        }
    }
}

public class GetTemplateActionByIdQueryHandler : IRequestHandler<GetTemplateActionByIdQuery, FMSResponse<IssueTemplateActionDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetTemplateActionByIdQueryHandler> _logger;

    public GetTemplateActionByIdQueryHandler(GpsdataContext context, ILogger<GetTemplateActionByIdQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueTemplateActionDTO>> Handle(GetTemplateActionByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var action = await _context.IssueTemplateActions
                .Include(a => a.IssueTemplate)
                .Where(a => a.Id == request.Id)
                .Select(a => new IssueTemplateActionDTO
                {
                    Id = a.Id,
                    IssueTemplateId = a.IssueTemplateId,
                    IssueTemplateName = a.IssueTemplate.Name,
                    Name = a.Name,
                    ActionType = a.ActionType,
                    Description = a.Description,
                    RequiresDeviceDetails = a.RequiresDeviceDetails,
                    RequiresSourceVehicle = a.RequiresSourceVehicle,
                    RequiresCameraDetails = a.RequiresCameraDetails,
                    SortOrder = a.SortOrder,
                    IsActive = a.IsActive,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (action == null)
            {
                return FMSResponse<IssueTemplateActionDTO>.Failed($"Template action with ID {request.Id} not found.");
            }

            return FMSResponse<IssueTemplateActionDTO>.Success(action);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching template action {ActionId}", request.Id);
            return FMSResponse<IssueTemplateActionDTO>.Failed($"Error fetching template action: {ex.Message}");
        }
    }
}

public class GetTemplateActionsForCompletionQueryHandler : IRequestHandler<GetTemplateActionsForCompletionQuery, FMSResponse<List<IssueTemplateActionDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetTemplateActionsForCompletionQueryHandler> _logger;

    public GetTemplateActionsForCompletionQueryHandler(GpsdataContext context, ILogger<GetTemplateActionsForCompletionQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<IssueTemplateActionDTO>>> Handle(GetTemplateActionsForCompletionQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var actions = await _context.IssueTemplateActions
                .Where(a => a.IssueTemplateId == request.IssueTemplateId && a.IsActive)
                .OrderBy(a => a.SortOrder)
                .ThenBy(a => a.Name)
                .Select(a => new IssueTemplateActionDTO
                {
                    Id = a.Id,
                    IssueTemplateId = a.IssueTemplateId,
                    Name = a.Name,
                    ActionType = a.ActionType,
                    Description = a.Description,
                    RequiresDeviceDetails = a.RequiresDeviceDetails,
                    RequiresSourceVehicle = a.RequiresSourceVehicle,
                    RequiresCameraDetails = a.RequiresCameraDetails,
                    SortOrder = a.SortOrder,
                    IsActive = a.IsActive
                })
                .ToListAsync(cancellationToken);

            return FMSResponse<List<IssueTemplateActionDTO>>.Success(actions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching completion actions for template {TemplateId}", request.IssueTemplateId);
            return FMSResponse<List<IssueTemplateActionDTO>>.Failed($"Error fetching completion actions: {ex.Message}");
        }
    }
}
