using FMS.Application.Common.Constants;
using FMS.Application.Features.IssueTracker.Commands.V2.Workflows;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using FMS.Application.Features.IssueTracker.Queries.V2.Workflows;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.V2;

[ApiController]
[Route("api/v1/issuetracker/templates/{templateId}/workflow")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class IssueTemplateWorkflowsController : ControllerBase
{
    private readonly IMediator _mediator;

    public IssueTemplateWorkflowsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [RequirePermission(Permissions.Admin.Issues)]
    public async Task<IActionResult> Get(int templateId)
    {
        var result = await _mediator.Send(new GetIssueTemplateWorkflowQuery(templateId));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpPut]
    [RequirePermission(Permissions.Admin.Issues)]
    public async Task<IActionResult> Save(int templateId, [FromBody] SaveIssueTemplateWorkflowRequestDTO dto)
    {
        if (dto == null)
        {
            return BadRequest(FMS.Application.Common.FMSResponse.FailedResponse("Workflow payload is required."));
        }

        var result = await _mediator.Send(new SaveIssueTemplateWorkflowCommand(templateId, dto));
        if (result.IsSuccess)
        {
            return Ok(result);
        }

        return result.StatusCode == 409 ? Conflict(result) : BadRequest(result);
    }

    [HttpPut("stages/reorder")]
    [RequirePermission(Permissions.Admin.Issues)]
    public async Task<IActionResult> ReorderStages(int templateId, [FromBody] ReorderIssueTemplateWorkflowStagesRequestDTO dto)
    {
        if (dto == null)
        {
            return BadRequest(FMS.Application.Common.FMSResponse.FailedResponse("Stage reorder payload is required."));
        }

        var result = await _mediator.Send(new ReorderIssueTemplateWorkflowStagesCommand(templateId, dto));
        if (result.IsSuccess)
        {
            return Ok(result);
        }

        return result.StatusCode == 409 ? Conflict(result) : BadRequest(result);
    }

    [HttpGet("for-completion")]
    [RequirePermission(Permissions.IssueTracker.Edit)]
    public async Task<IActionResult> GetForCompletion(int templateId)
    {
        var result = await _mediator.Send(new GetIssueTemplateWorkflowForCompletionQuery(templateId));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
}