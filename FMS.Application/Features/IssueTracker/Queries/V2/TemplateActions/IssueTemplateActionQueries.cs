/**
 * File: IssueTemplateActionQueries.cs
 * Purpose: MediatR queries for IssueTemplateAction read operations
 * Dependencies: MediatR, FMSResponse, IssueTemplateActionDTOs
 * Last Modified: 2026-02-21
 */
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using MediatR;
using System.Collections.Generic;

namespace FMS.Application.Features.IssueTracker.Queries.V2.TemplateActions;

/// <summary>
/// Get all template actions (optionally filtered by template ID)
/// </summary>
public record GetTemplateActionsQuery(int? IssueTemplateId = null, bool ActiveOnly = false)
    : IRequest<FMSResponse<List<IssueTemplateActionDTO>>>;

/// <summary>
/// Get a specific template action by ID
/// </summary>
public record GetTemplateActionByIdQuery(int Id)
    : IRequest<FMSResponse<IssueTemplateActionDTO>>;

/// <summary>
/// Get all active template actions for a specific template (used by the completion form)
/// </summary>
public record GetTemplateActionsForCompletionQuery(int IssueTemplateId)
    : IRequest<FMSResponse<List<IssueTemplateActionDTO>>>;
