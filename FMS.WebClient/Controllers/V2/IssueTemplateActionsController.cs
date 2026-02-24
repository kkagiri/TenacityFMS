/**
 * File: IssueTemplateActionsController.cs
 * Purpose: API Controller for managing admin-configurable completion actions per issue template
 * Dependencies: MediatR, IssueTemplateAction commands/queries, JWT auth
 * Last Modified: 2026-02-21
 *
 * Key Actions:
 * - GetByTemplate: Lists actions for a template (optionally active-only)
 * - GetForCompletion: Lists active actions for technician completion form
 * - GetById: Single action by ID
 * - Create: Creates a new template action
 * - Update: Updates an existing template action
 * - Delete: Deletes a template action
 * - ToggleActive: Activates/deactivates a template action
 */
using FMS.Application.Common.Constants;
using FMS.Application.Features.IssueTracker.Commands.V2.TemplateActions;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using FMS.Application.Features.IssueTracker.Queries.V2.TemplateActions;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.V2
{
    /// <summary>
    /// Manages completion actions per issue template (admin configuration)
    /// </summary>
    [ApiController]
    [Route("api/v1/issuetracker/templates/{templateId}/actions")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class IssueTemplateActionsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public IssueTemplateActionsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Get all actions for a template (admin: includes inactive)
        /// </summary>
        [HttpGet]
        [RequirePermission(Permissions.Admin.Issues)]
        public async Task<IActionResult> GetByTemplate(int templateId, [FromQuery] bool? activeOnly = null)
        {
            var result = await _mediator.Send(
                new GetTemplateActionsQuery(templateId, activeOnly ?? false));
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get active actions for the technician completion form
        /// </summary>
        [HttpGet("for-completion")]
        [RequirePermission(Permissions.IssueTracker.Edit)]
        public async Task<IActionResult> GetForCompletion(int templateId)
        {
            var result = await _mediator.Send(
                new GetTemplateActionsForCompletionQuery(templateId));
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get a single action by ID
        /// </summary>
        [HttpGet("{actionId}")]
        [RequirePermission(Permissions.Admin.Issues)]
        public async Task<IActionResult> GetById(int templateId, int actionId)
        {
            var result = await _mediator.Send(
                new GetTemplateActionByIdQuery(actionId));

            if (!result.IsSuccess)
                return NotFound(result);

            // Verify action belongs to this template
            if (result.Data?.IssueTemplateId != templateId)
                return NotFound(new { message = "Action not found for this template" });

            return Ok(result);
        }

        /// <summary>
        /// Create a new action for the template
        /// </summary>
        [HttpPost]
        [RequirePermission(Permissions.Admin.Issues)]
        public async Task<IActionResult> Create(
            int templateId,
            [FromBody] CreateIssueTemplateActionDTO dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Action data is required" });

            dto.IssueTemplateId = templateId;

            var result = await _mediator.Send(new CreateTemplateActionCommand(dto));
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Update an existing action
        /// </summary>
        [HttpPut("{actionId}")]
        [RequirePermission(Permissions.Admin.Issues)]
        public async Task<IActionResult> Update(
            int templateId,
            int actionId,
            [FromBody] UpdateIssueTemplateActionDTO dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Action data is required" });

            dto.Id = actionId;
            dto.IssueTemplateId = templateId;

            var result = await _mediator.Send(new UpdateTemplateActionCommand(dto));
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Delete an action
        /// </summary>
        [HttpDelete("{actionId}")]
        [RequirePermission(Permissions.Admin.Issues)]
        public async Task<IActionResult> Delete(int templateId, int actionId)
        {
            // Verify the action belongs to this template before deleting
            var checkResult = await _mediator.Send(new GetTemplateActionByIdQuery(actionId));
            if (!checkResult.IsSuccess || checkResult.Data?.IssueTemplateId != templateId)
                return NotFound(new { message = "Action not found for this template" });

            var result = await _mediator.Send(new DeleteTemplateActionCommand(actionId));
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Toggle active/inactive status
        /// </summary>
        [HttpPatch("{actionId}/toggle-active")]
        [RequirePermission(Permissions.Admin.Issues)]
        public async Task<IActionResult> ToggleActive(int templateId, int actionId)
        {
            var checkResult = await _mediator.Send(new GetTemplateActionByIdQuery(actionId));
            if (!checkResult.IsSuccess || checkResult.Data?.IssueTemplateId != templateId)
                return NotFound(new { message = "Action not found for this template" });

            var result = await _mediator.Send(new ToggleTemplateActionActiveCommand(actionId));
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}
