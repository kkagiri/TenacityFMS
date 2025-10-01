using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TagMonitoringConfigCmd;
using FMS.Application.Common;
using FMS.Application.Queries.Database.FMSQuery.TagMonitoringConfigQuery;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route ("api/v1/[controller]")]
public class GPSGateTagMonitoringController : ControllerBase {
    private readonly IMediator _mediator;
    private readonly GpsdataContext _context;
    public GPSGateTagMonitoringController (IMediator mediator, GpsdataContext context) {
        _mediator = mediator;
        _context = context;
    }

    [HttpGet ("config")]
    public async Task<IActionResult> GetConfigs () {
        var result = await _mediator.Send (new GetTagMonitoringConfigsQuery ());
        return Ok (result);
    }

    [HttpGet ("config/{id}")]
    public async Task<IActionResult> GetConfig (int id) {
        var result = await _mediator.Send (new GetTagMonitoringConfigByIdQuery (id));
        return Ok (result);
    }

    [HttpPost ("config")]
    public async Task<IActionResult> CreateConfig ([FromBody] FMS.Domain.Entities.VehicleLocationTagMonitoringConfig config) {
        var result = await _mediator.Send (new CreateTagMonitoringConfigCommand (config));
        return Ok (result);
    }

    [HttpPut ("config/{id}")]
    public async Task<IActionResult> UpdateConfig (int id, [FromBody] FMS.Domain.Entities.VehicleLocationTagMonitoringConfig config) {
        if (id != config.Id) return BadRequest ();
        var result = await _mediator.Send (new UpdateTagMonitoringConfigCommand (config));
        return Ok (result);
    }

    [HttpDelete ("config/{id}")]
    public async Task<IActionResult> DeleteConfig (int id) {
        var result = await _mediator.Send (new DeleteTagMonitoringConfigCommand (id));
        return Ok (result);
    }

    [HttpGet ("logs")]
    public async Task<IActionResult> GetLogs () =>
        Ok (await _context.TagChangeLogs
            .Include (x => x.Vehicle)
            .OrderByDescending (x => x.Timestamp)
            .Take (500)
            .ToListAsync ());
}
