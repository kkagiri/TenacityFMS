/**
 * File: ErrorManagementController.cs
 * Purpose: Captures and retrieves frontend error telemetry for diagnostics.
 * Dependencies: MediatR, error log commands/queries, BaseApiController helpers.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - GetErrorLogs(log): Persists frontend error reports with user context.
 * - GetErrorLogs(list): Returns paged error logs with date filters.
 */
using System;
using FMS.Application.Features.ErrorHandling.Commands;
using FMS.Application.Features.ErrorHandling.Dtos;
using FMS.Application.Features.ErrorHandling.Queries;
using FMS.WebClient.Controllers.Base;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.Webclient.Contollers;

[ApiController]
[Route("api/v1/errors")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[RequirePermission(Permissions.Admin.Users)]
public class ErrorManagementController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly ILogger<ErrorManagementController> _logger;

    public ErrorManagementController(IMediator mediator, ILogger<ErrorManagementController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [HttpPost("log")]
    public async Task<IActionResult> GetErrorLogs([FromBody] ErrorLogReportDto errorLogReportDto)
    {
        try
        {
            string? userId = TryGetCurrentUserId(out var currentUserId) ? currentUserId : null;

            _logger.LogError("Frontend Error Reported by User {UserId}, Message : {ErrorMessage} ,UserAgent: {UserAgent}, URL: {Url}",
                userId, errorLogReportDto.Message, errorLogReportDto.UserAgent, errorLogReportDto.Url);
            var command = new CreateLogErrorCommand
            {
                UserId = userId,
                Message = errorLogReportDto.Message,
                ComponentStack = errorLogReportDto.ComponentStack,
                UserAgent = errorLogReportDto.UserAgent,
                Url = errorLogReportDto.Url,
                Stack = errorLogReportDto.Stack

            };
            var result = await _mediator.Send(command);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while reporting frontend error");
            return StatusCode(500, "Internal server error");
        }
    }
    [HttpGet("logs")]
    public async Task<ActionResult<List<ErrorLogDto>>> GetErrorLogs(
        [FromQuery] int pageSize = 50, [FromQuery] int pageNumber = 1,
        [FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null
    )
    {
        try
        {
            var query = new GetErrorLogQuery
            {
                PageSize = pageSize,
                PageNumber = pageNumber,
                FromDate = fromDate,
                ToDate = toDate
            };
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving error logs");
            return StatusCode(500, "Internal server error");
        }
    }
}