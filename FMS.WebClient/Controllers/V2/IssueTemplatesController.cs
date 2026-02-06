using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.Commands.V2.IssueTemplates;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using FMS.Application.Features.IssueTracker.Queries.V2.IssueTemplates;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers.V2;

/// <summary>
/// API Controller for Issue Template management (Issue Tracker V2)
/// </summary>
[ApiController]
[Route("api/v1/issuetracker/templates")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[RequirePermission(Permissions.Admin.Issues)]
public class IssueTemplatesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<IssueTemplatesController> _logger;

    public IssueTemplatesController(IMediator mediator, ILogger<IssueTemplatesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all issue templates
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _mediator.Send(new GetIssueTemplatesQuery());
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get issue templates by device type ID
    /// </summary>
    [HttpGet("by-device-type/{deviceTypeId}")]
    public async Task<IActionResult> GetByDeviceType(int deviceTypeId, [FromQuery] bool activeOnly = true)
    {
        var result = await _mediator.Send(new GetIssueTemplatesByDeviceTypeQuery(deviceTypeId, activeOnly));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get issue template by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _mediator.Send(new GetIssueTemplateByIdQuery(id));
        return result.IsSuccess ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Create a new issue template
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateIssueTemplateDTO dto)
    {
        var result = await _mediator.Send(new CreateIssueTemplateCommand(dto));
        return result.IsSuccess ? CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result) : BadRequest(result);
    }

    /// <summary>
    /// Update an existing issue template
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateIssueTemplateDTO dto)
    {
        if (id != dto.Id)
        {
            return BadRequest(FMSResponse<IssueTemplateDTO>.Failed("ID mismatch between URL and body"));
        }

        var result = await _mediator.Send(new UpdateIssueTemplateCommand(dto));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete an issue template
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _mediator.Send(new DeleteIssueTemplateCommand(id));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Toggle issue template active status
    /// </summary>
    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var result = await _mediator.Send(new ToggleIssueTemplateActiveCommand(id));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
}
