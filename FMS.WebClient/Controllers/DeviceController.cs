using System.Text.RegularExpressions;
using FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceCommands;
using FMS.Application.Queries.Database.FMSQuery.DeviceManager.DeviceQueries;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DeviceController : ControllerBase
{
    private readonly IMediator _mediator;

    public DeviceController(IMediator mediator)
    {
        _mediator = mediator;
    }

    //api/Devices
    [HttpGet]
    [Route("getlist")]
    public async Task<IActionResult> GetDeviceList()
    {
        var query = new GetDeviceListQuery();
        var devices = await _mediator.Send(query);

        return Ok(devices);
    }


    [HttpGet("{imei}")]
    public async Task<ActionResult<Device>> GetDevice(string imei)
    {
        string imeiPattern = @"^\d{12,16}$";
        if (string.IsNullOrEmpty(imei) || !Regex.IsMatch(imei, imeiPattern)) return BadRequest("Invalid IMEI number");
        var query = new GetDeviceByIdQuery(int.Parse(imei));
        var result = await _mediator.Send(query);
        if (result == null)
            return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<int>> CreateDevice(CreateDeviceCommand command)
    {
        if (!ModelState.IsValid) return BadRequest();
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetDevice), new { imei = result }, result);
    }

    [HttpPut("{imei}")]
    public async Task<IActionResult> UpdateDevice(string imei, UpdateDeviceCommand command)
    {
        string imeiPattern = @"^\d{12,16}$";
        if (string.IsNullOrEmpty(imei) || !Regex.IsMatch(imei, imeiPattern)) return BadRequest("Invalid IMEI number");
        if (!ModelState.IsValid) return BadRequest();

        if (imei != command.Device.DeviceImei.ToString())
            return BadRequest();
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{imei}")]
    public async Task<IActionResult> DeleteDevice(string imei)
    {
        string imeiPattern = @"^\d{12,16}$";
        if (string.IsNullOrEmpty(imei) || !Regex.IsMatch(imei, imeiPattern)) return BadRequest("Invalid IMEI number");
        var command = new DeleteDeviceCommand(int.Parse(imei));
        await _mediator.Send(command);
        return NoContent();
    }
}
