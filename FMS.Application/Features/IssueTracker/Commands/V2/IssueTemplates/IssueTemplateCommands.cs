using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Commands.V2.IssueTemplates;

/// <summary>
/// Create a new Issue Template
/// </summary>
public record CreateIssueTemplateCommand(CreateIssueTemplateDTO Template)
    : IRequest<FMSResponse<IssueTemplateDTO>>;

/// <summary>
/// Update an existing Issue Template
/// </summary>
public record UpdateIssueTemplateCommand(UpdateIssueTemplateDTO Template)
    : IRequest<FMSResponse<IssueTemplateDTO>>;

/// <summary>
/// Delete an Issue Template
/// </summary>
public record DeleteIssueTemplateCommand(int Id)
    : IRequest<FMSResponse<bool>>;

/// <summary>
/// Toggle Issue Template active status
/// </summary>
public record ToggleIssueTemplateActiveCommand(int Id)
    : IRequest<FMSResponse<IssueTemplateDTO>>;
