using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.Commands.V2.AutoCloseConfig;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using FMS.Application.Features.IssueTracker.Queries.V2.AutoCloseConfig;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.V2;

/// <summary>
/// API Controller for Auto Close Config management (Issue Tracker V2)
/// </summary>
[ApiController]
[Route("api/v1/issuetracker/auto-close-configs")]
[Authorize]
public class AutoCloseConfigsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AutoCloseConfigsController> _logger;

    public AutoCloseConfigsController(IMediator mediator, ILogger<AutoCloseConfigsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all auto close configs
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _mediator.Send(new GetAutoCloseConfigsQuery());
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get auto close config by template ID
    /// </summary>
    [HttpGet("by-template/{templateId}")]
    public async Task<IActionResult> GetByTemplate(int templateId)
    {
        var result = await _mediator.Send(new GetAutoCloseConfigByTemplateQuery(templateId));
        return result.IsSuccess ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get available checker types
    /// </summary>
    [HttpGet("checker-types")]
    public async Task<IActionResult> GetCheckerTypes()
    {
        var result = await _mediator.Send(new GetCheckerTypesQuery());
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create or update auto close config for a template
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] CreateAutoCloseConfigDTO dto)
    {
        var result = await _mediator.Send(new UpsertAutoCloseConfigCommand(dto));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update an existing auto close config
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAutoCloseConfigDTO dto)
    {
        if (id != dto.Id)
        {
            return BadRequest(FMSResponse<IssueAutoCloseConfigDTO>.Failed("ID mismatch between URL and body"));
        }

        var result = await _mediator.Send(new UpdateAutoCloseConfigCommand(dto));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete auto close config for a template
    /// </summary>
    [HttpDelete("by-template/{templateId}")]
    public async Task<IActionResult> Delete(int templateId)
    {
        var result = await _mediator.Send(new DeleteAutoCloseConfigCommand(templateId));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Toggle auto close config enabled status
    /// </summary>
    [HttpPatch("by-template/{templateId}/toggle")]
    public async Task<IActionResult> Toggle(int templateId)
    {
        var result = await _mediator.Send(new ToggleAutoCloseConfigCommand(templateId));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
}
