/**
 * File: IssueTemplateActionCommands.cs
 * Purpose: MediatR commands for IssueTemplateAction CRUD operations
 * Dependencies: MediatR, FMSResponse, IssueTemplateActionDTOs
 * Last Modified: 2026-02-21
 */
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Commands.V2.TemplateActions;

/// <summary>
/// Create a new template action
/// </summary>
public record CreateTemplateActionCommand(CreateIssueTemplateActionDTO Action)
    : IRequest<FMSResponse<IssueTemplateActionDTO>>;

/// <summary>
/// Update an existing template action
/// </summary>
public record UpdateTemplateActionCommand(UpdateIssueTemplateActionDTO Action)
    : IRequest<FMSResponse<IssueTemplateActionDTO>>;

/// <summary>
/// Delete a template action
/// </summary>
public record DeleteTemplateActionCommand(int Id)
    : IRequest<FMSResponse<bool>>;

/// <summary>
/// Toggle a template action's active status
/// </summary>
public record ToggleTemplateActionActiveCommand(int Id)
    : IRequest<FMSResponse<IssueTemplateActionDTO>>;
