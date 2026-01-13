using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Queries.V2.AutoCloseConfig;

/// <summary>
/// Get Auto Close Config by Issue Template ID
/// </summary>
public record GetAutoCloseConfigByTemplateQuery(int IssueTemplateId)
    : IRequest<FMSResponse<IssueAutoCloseConfigDTO>>;

/// <summary>
/// Get all Auto Close Configs
/// </summary>
public record GetAutoCloseConfigsQuery()
    : IRequest<FMSResponse<List<IssueAutoCloseConfigDTO>>>;

/// <summary>
/// Get available Checker Types
/// </summary>
public record GetCheckerTypesQuery()
    : IRequest<FMSResponse<List<string>>>;
