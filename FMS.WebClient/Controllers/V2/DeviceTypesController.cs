using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.Commands.V2.DeviceTypes;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using FMS.Application.Features.IssueTracker.Queries.V2.DeviceTypes;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers.V2;

/// <summary>
/// API Controller for Device Type management (Issue Tracker V2)
/// </summary>
[ApiController]
[Route("api/v1/issuetracker/device-types")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[RequirePermission(Permissions.Admin.Issues)]
public class DeviceTypesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<DeviceTypesController> _logger;

    public DeviceTypesController(IMediator mediator, ILogger<DeviceTypesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all device types
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _mediator.Send(new GetDeviceTypesQuery());
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get device type by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _mediator.Send(new GetDeviceTypeByIdQuery(id));
        return result.IsSuccess ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Create a new device type
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDeviceTypeDTO dto)
    {
        var result = await _mediator.Send(new CreateDeviceTypeCommand(dto));
        return result.IsSuccess ? CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result) : BadRequest(result);
    }

    /// <summary>
    /// Update an existing device type
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDeviceTypeDTO dto)
    {
        if (id != dto.Id)
        {
            return BadRequest(FMSResponse<DeviceTypeDTO>.Failed("ID mismatch between URL and body"));
        }

        var result = await _mediator.Send(new UpdateDeviceTypeCommand(dto));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a device type
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _mediator.Send(new DeleteDeviceTypeCommand(id));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
}
