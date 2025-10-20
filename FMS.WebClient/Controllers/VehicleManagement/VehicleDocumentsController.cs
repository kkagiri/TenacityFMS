using FMS.Application.Common;
using FMS.Application.Features.VehicleDocumentManagement.Commands;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Application.Features.VehicleDocumentManagement.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FMS.WebClient.Controllers.VehicleManagement;

[ApiController]
[Route("api/v1/vehicledocuments")]
public class VehicleDocumentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public VehicleDocumentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<FMSResponse<List<VehicleDocumentDto>>>> GetVehicleDocuments([FromQuery] GetVehicleDocumentsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FMSResponse<VehicleDocumentDto>>> GetVehicleDocumentById(Guid id)
    {
        var result = await _mediator.Send(new GetVehicleDocumentByIdQuery(id));
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<FMSResponse<VehicleDocumentDto>>> CreateVehicleDocument([FromForm] CreateVehicleDocumentDto createVehicleDocumentDto)
    {
        var result = await _mediator.Send(new CreateVehicleDocumentCommand(createVehicleDocumentDto));
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<FMSResponse<bool>>> UpdateVehicleDocument(Guid id, [FromForm] UpdateVehicleDocumentDto updateVehicleDocumentDto)
    {
        if (id != updateVehicleDocumentDto.Id)
        {
            return BadRequest("ID mismatch");
        }
        var result = await _mediator.Send(new UpdateVehicleDocumentCommand(updateVehicleDocumentDto));
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<FMSResponse<bool>>> DeleteVehicleDocument(Guid id)
    {
        var result = await _mediator.Send(new DeleteVehicleDocumentCommand(id));
        return Ok(result);
    }

    [HttpGet("expiring")]
    public async Task<ActionResult<FMSResponse<List<VehicleDocumentDto>>>> GetExpiringDocuments([FromQuery] GetExpiringDocumentsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}
