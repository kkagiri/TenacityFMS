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

namespace FMS.Application.Features.IssueTracker.Queries.V2.AutoCloseConfig;

public class GetAutoCloseConfigByTemplateQueryHandler : IRequestHandler<GetAutoCloseConfigByTemplateQuery, FMSResponse<IssueAutoCloseConfigDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetAutoCloseConfigByTemplateQueryHandler> _logger;

    public GetAutoCloseConfigByTemplateQueryHandler(GpsdataContext context, ILogger<GetAutoCloseConfigByTemplateQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueAutoCloseConfigDTO>> Handle(GetAutoCloseConfigByTemplateQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var config = await _context.Issueautocloseconfigs
                .Include(c => c.IssueTemplate)
                .Where(c => c.IssueTemplateId == request.IssueTemplateId)
                .Select(c => new IssueAutoCloseConfigDTO
                {
                    Id = c.Id,
                    IssueTemplateId = c.IssueTemplateId,
                    IssueTemplateName = c.IssueTemplate != null ? c.IssueTemplate.Name : "",
                    IsEnabled = c.IsEnabled,
                    CheckerType = c.CheckerType,
                    CheckIntervalSeconds = c.CheckIntervalSeconds,
                    CheckerConfigJson = c.CheckerConfigJson,
                    AutoCloseWhenSatisfied = c.AutoCloseWhenSatisfied,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (config == null)
            {
                return FMSResponse<IssueAutoCloseConfigDTO>.Failed($"Auto Close Config for Template {request.IssueTemplateId} not found.");
            }

            return FMSResponse<IssueAutoCloseConfigDTO>.Success(config);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Auto Close Config for Template {TemplateId}", request.IssueTemplateId);
            return FMSResponse<IssueAutoCloseConfigDTO>.Failed($"Error getting Auto Close Config: {ex.Message}");
        }
    }
}

public class GetAutoCloseConfigsQueryHandler : IRequestHandler<GetAutoCloseConfigsQuery, FMSResponse<List<IssueAutoCloseConfigDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetAutoCloseConfigsQueryHandler> _logger;

    public GetAutoCloseConfigsQueryHandler(GpsdataContext context, ILogger<GetAutoCloseConfigsQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<IssueAutoCloseConfigDTO>>> Handle(GetAutoCloseConfigsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var configs = await _context.Issueautocloseconfigs
                .Include(c => c.IssueTemplate)
                .OrderBy(c => c.IssueTemplate!.Name)
                .Select(c => new IssueAutoCloseConfigDTO
                {
                    Id = c.Id,
                    IssueTemplateId = c.IssueTemplateId,
                    IssueTemplateName = c.IssueTemplate != null ? c.IssueTemplate.Name : "",
                    IsEnabled = c.IsEnabled,
                    CheckerType = c.CheckerType,
                    CheckIntervalSeconds = c.CheckIntervalSeconds,
                    CheckerConfigJson = c.CheckerConfigJson,
                    AutoCloseWhenSatisfied = c.AutoCloseWhenSatisfied,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync(cancellationToken);

            return FMSResponse<List<IssueAutoCloseConfigDTO>>.Success(configs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Auto Close Configs");
            return FMSResponse<List<IssueAutoCloseConfigDTO>>.Failed($"Error getting Auto Close Configs: {ex.Message}");
        }
    }
}

public class GetCheckerTypesQueryHandler : IRequestHandler<GetCheckerTypesQuery, FMSResponse<List<string>>>
{
    public Task<FMSResponse<List<string>>> Handle(GetCheckerTypesQuery request, CancellationToken cancellationToken)
    {
        return Task.FromResult(FMSResponse<List<string>>.Success(AutoCloseCheckerTypes.All.ToList()));
    }
}
