using FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Issues;
using FMS.Application.ModelsDTOs.FMS.Issuetracker;
using FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using ControllerBase = Microsoft.AspNetCore.Mvc.ControllerBase;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IssueTrackerController : ControllerBase
{

    private readonly IMediator _mediator;

    public IssueTrackerController(IMediator mediator)
    {
        _mediator = mediator;
    }

    //Api: Get all issue tracker
    [HttpGet]
    public async Task<IActionResult> GetIssueTracker()
    {
        var query = new GetIssueListQuery();
        var issueTrackers = await _mediator.Send(query);
        return Ok(issueTrackers);
    }

    //Api: Get issue tracker by id
    [HttpGet("{id}")]
    public async Task<IActionResult> GetIssueTrackerById(GetIssueListByIdQuery query)
    {
        if (query is null)
        {
            throw new ArgumentNullException(nameof(query));
        }

        var issueTracker = await _mediator.Send(query);
        return Ok(issueTracker);
    }

    //Api: Create issue tracker
    [HttpPost]
    public async Task<IActionResult> PostIssueTracker([FromBody] Issuetracker command)
    {
        if (command is null)
        {
            throw new ArgumentNullException(nameof(command));
        }

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    //Api: Update issue tracker
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateIssueTracker([FromBody] UpdateIssueCommand command)
    {
        if (command is null)
        {
            throw new ArgumentNullException(nameof(command));
        }

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    //Api: Delete issue tracker
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteIssueTracker(DeleteIssueCommand command)
    {
        if (command is null)
        {
            throw new ArgumentNullException(nameof(command));
        }

        var result = await _mediator.Send(command);
        return Ok(result);
    }



}