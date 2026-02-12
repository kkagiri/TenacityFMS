using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Queries.V2.IssueTemplates;

public class GetIssueTemplatesQueryHandler : IRequestHandler<GetIssueTemplatesQuery, FMSResponse<List<IssueTemplateDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetIssueTemplatesQueryHandler> _logger;

    public GetIssueTemplatesQueryHandler(GpsdataContext context, ILogger<GetIssueTemplatesQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<IssueTemplateDTO>>> Handle(GetIssueTemplatesQuery request, CancellationToken cancellationToken)
    {
        try
        {
            // Pre-load user names for DefaultAssignee resolution (supports comma-separated IDs)
            var rawAssigneeValues = await _context.Issuetemplates
                .Where(t => t.DefaultAssignee != null)
                .Select(t => t.DefaultAssignee!)
                .Distinct()
                .ToListAsync(cancellationToken);

            // Flatten comma-separated IDs into a single set
            var allAssigneeIds = rawAssigneeValues
                .SelectMany(v => v.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                .Distinct()
                .ToList();

            var userNameMap = allAssigneeIds.Any()
                ? await _context.Users
                    .AsNoTracking()
                    .Where(u => allAssigneeIds.Contains(u.Id))
                    .ToDictionaryAsync(u => u.Id, u => u.UserName ?? u.Id, cancellationToken)
                : new Dictionary<string, string>();

            var templates = await _context.Issuetemplates
                .Include(t => t.DeviceType)
                .Include(t => t.DefaultPriority)
                .Include(t => t.DefaultStatus)
                .Include(t => t.AutoCloseConfig)
                .OrderBy(t => t.DeviceType!.Name)
                .ThenBy(t => t.Name)
                .Select(t => new IssueTemplateDTO
                {
                    Id = t.Id,
                    DeviceTypeId = t.DeviceTypeId,
                    DeviceTypeName = t.DeviceType != null ? t.DeviceType.Name : "",
                    Name = t.Name,
                    TitleTemplate = t.TitleTemplate,
                    DescriptionTemplate = t.DescriptionTemplate,
                    DefaultPriorityId = t.DefaultPriorityId,
                    DefaultPriorityName = t.DefaultPriority != null ? t.DefaultPriority.Name : null,
                    DefaultStatusId = t.DefaultStatusId,
                    DefaultStatusName = t.DefaultStatus != null ? t.DefaultStatus.Status : null,
                    IsActive = t.IsActive,
                    CanAutoCreate = t.CanAutoCreate,
                    OfflineThresholdMinutes = t.OfflineThresholdMinutes,
                    DefaultAssignee = t.DefaultAssignee,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    HasAutoCloseConfig = t.AutoCloseConfig != null,
                    AutoCloseEnabled = t.AutoCloseConfig != null && t.AutoCloseConfig.IsEnabled
                })
                .ToListAsync(cancellationToken);

            // Resolve assignee names post-query (supports comma-separated IDs)
            foreach (var t in templates)
            {
                if (!string.IsNullOrEmpty(t.DefaultAssignee))
                {
                    var ids = t.DefaultAssignee.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                    var names = ids
                        .Where(id => userNameMap.ContainsKey(id))
                        .Select(id => userNameMap[id])
                        .ToList();
                    if (names.Any())
                        t.DefaultAssigneeName = string.Join(", ", names);
                }
            }

            return FMSResponse<List<IssueTemplateDTO>>.Success(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Issue Templates");
            return FMSResponse<List<IssueTemplateDTO>>.Failed($"Error getting Issue Templates: {ex.Message}");
        }
    }
}

public class GetIssueTemplatesByDeviceTypeQueryHandler : IRequestHandler<GetIssueTemplatesByDeviceTypeQuery, FMSResponse<List<IssueTemplateDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetIssueTemplatesByDeviceTypeQueryHandler> _logger;

    public GetIssueTemplatesByDeviceTypeQueryHandler(GpsdataContext context, ILogger<GetIssueTemplatesByDeviceTypeQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<IssueTemplateDTO>>> Handle(GetIssueTemplatesByDeviceTypeQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.Issuetemplates
                .Include(t => t.DeviceType)
                .Include(t => t.DefaultPriority)
                .Include(t => t.DefaultStatus)
                .Include(t => t.AutoCloseConfig)
                .Include(t => t.Categories)
                .Where(t => t.DeviceTypeId == request.DeviceTypeId);

            if (request.ActiveOnly)
            {
                query = query.Where(t => t.IsActive);
            }

            var templates = await query
                .OrderBy(t => t.Name)
                .Select(t => new IssueTemplateDTO
                {
                    Id = t.Id,
                    DeviceTypeId = t.DeviceTypeId,
                    DeviceTypeName = t.DeviceType != null ? t.DeviceType.Name : "",
                    Name = t.Name,
                    TitleTemplate = t.TitleTemplate,
                    DescriptionTemplate = t.DescriptionTemplate,
                    DefaultPriorityId = t.DefaultPriorityId,
                    DefaultPriorityName = t.DefaultPriority != null ? t.DefaultPriority.Name : null,
                    DefaultStatusId = t.DefaultStatusId,
                    DefaultStatusName = t.DefaultStatus != null ? t.DefaultStatus.Status : null,
                    IsActive = t.IsActive,
                    CanAutoCreate = t.CanAutoCreate,
                    OfflineThresholdMinutes = t.OfflineThresholdMinutes,
                    DefaultAssignee = t.DefaultAssignee,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    HasAutoCloseConfig = t.AutoCloseConfig != null,
                    AutoCloseEnabled = t.AutoCloseConfig != null && t.AutoCloseConfig.IsEnabled,
                    CategoryIds = t.Categories.Select(c => c.Id).ToList(),
                    Categories = t.Categories.Select(c => new CategorySummaryDTO
                    {
                        Id = c.Id,
                        Name = c.Name ?? "",
                        Description = c.Description
                    }).ToList()
                })
                .ToListAsync(cancellationToken);

            return FMSResponse<List<IssueTemplateDTO>>.Success(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Issue Templates for Device Type {DeviceTypeId}", request.DeviceTypeId);
            return FMSResponse<List<IssueTemplateDTO>>.Failed($"Error getting Issue Templates: {ex.Message}");
        }
    }
}

public class GetIssueTemplateByIdQueryHandler : IRequestHandler<GetIssueTemplateByIdQuery, FMSResponse<IssueTemplateDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetIssueTemplateByIdQueryHandler> _logger;

    public GetIssueTemplateByIdQueryHandler(GpsdataContext context, ILogger<GetIssueTemplateByIdQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueTemplateDTO>> Handle(GetIssueTemplateByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var template = await _context.Issuetemplates
                .Include(t => t.DeviceType)
                .Include(t => t.DefaultPriority)
                .Include(t => t.DefaultStatus)
                .Include(t => t.AutoCloseConfig)
                .Include(t => t.Categories)
                .Where(t => t.Id == request.Id)
                .Select(t => new IssueTemplateDTO
                {
                    Id = t.Id,
                    DeviceTypeId = t.DeviceTypeId,
                    DeviceTypeName = t.DeviceType != null ? t.DeviceType.Name : "",
                    Name = t.Name,
                    TitleTemplate = t.TitleTemplate,
                    DescriptionTemplate = t.DescriptionTemplate,
                    DefaultPriorityId = t.DefaultPriorityId,
                    DefaultPriorityName = t.DefaultPriority != null ? t.DefaultPriority.Name : null,
                    DefaultStatusId = t.DefaultStatusId,
                    DefaultStatusName = t.DefaultStatus != null ? t.DefaultStatus.Status : null,
                    IsActive = t.IsActive,
                    CanAutoCreate = t.CanAutoCreate,
                    OfflineThresholdMinutes = t.OfflineThresholdMinutes,
                    DefaultAssignee = t.DefaultAssignee,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    HasAutoCloseConfig = t.AutoCloseConfig != null,
                    AutoCloseEnabled = t.AutoCloseConfig != null && t.AutoCloseConfig.IsEnabled,
                    CategoryIds = t.Categories.Select(c => c.Id).ToList(),
                    Categories = t.Categories.Select(c => new CategorySummaryDTO
                    {
                        Id = c.Id,
                        Name = c.Name ?? "",
                        Description = c.Description
                    }).ToList()
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (template == null)
            {
                return FMSResponse<IssueTemplateDTO>.Failed($"Issue Template with ID {request.Id} not found.");
            }

            // Resolve assignee names (supports comma-separated IDs)
            if (!string.IsNullOrEmpty(template.DefaultAssignee))
            {
                var ids = template.DefaultAssignee.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                var names = await _context.Users
                    .AsNoTracking()
                    .Where(u => ids.Contains(u.Id))
                    .Select(u => u.UserName)
                    .ToListAsync(cancellationToken);
                if (names.Any())
                    template.DefaultAssigneeName = string.Join(", ", names);
            }

            return FMSResponse<IssueTemplateDTO>.Success(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Issue Template {Id}", request.Id);
            return FMSResponse<IssueTemplateDTO>.Failed($"Error getting Issue Template: {ex.Message}");
        }
    }
}
