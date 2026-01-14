using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Commands.V2.AutoCloseConfig;

/// <summary>
/// Create or update Auto Close Config for an Issue Template
/// </summary>
public record UpsertAutoCloseConfigCommand(CreateAutoCloseConfigDTO Config)
    : IRequest<FMSResponse<IssueAutoCloseConfigDTO>>;

/// <summary>
/// Update existing Auto Close Config
/// </summary>
public record UpdateAutoCloseConfigCommand(UpdateAutoCloseConfigDTO Config)
    : IRequest<FMSResponse<IssueAutoCloseConfigDTO>>;

/// <summary>
/// Delete Auto Close Config
/// </summary>
public record DeleteAutoCloseConfigCommand(int IssueTemplateId)
    : IRequest<FMSResponse<bool>>;

/// <summary>
/// Toggle Auto Close Config enabled status
/// </summary>
public record ToggleAutoCloseConfigCommand(int IssueTemplateId)
    : IRequest<FMSResponse<IssueAutoCloseConfigDTO>>;
