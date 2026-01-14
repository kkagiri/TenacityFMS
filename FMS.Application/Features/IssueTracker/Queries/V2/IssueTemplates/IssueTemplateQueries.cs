using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Queries.V2.IssueTemplates;

/// <summary>
/// Get all Issue Templates
/// </summary>
public record GetIssueTemplatesQuery() : IRequest<FMSResponse<List<IssueTemplateDTO>>>;

/// <summary>
/// Get Issue Templates by Device Type ID
/// </summary>
public record GetIssueTemplatesByDeviceTypeQuery(int DeviceTypeId, bool ActiveOnly = true)
    : IRequest<FMSResponse<List<IssueTemplateDTO>>>;

/// <summary>
/// Get Issue Template by ID
/// </summary>
public record GetIssueTemplateByIdQuery(int Id) : IRequest<FMSResponse<IssueTemplateDTO>>;
