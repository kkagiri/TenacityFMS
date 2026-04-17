/**
 * File: WarningLettersController.cs
 * Purpose: Exposes warning letter CRUD and filtered list endpoints.
 * Dependencies: MediatR, BaseApiController, warning letter commands/queries, permission attributes
 * Last Modified: 2026-04-11
 */
using System;
using FMS.Application.Common.Constants;
using FMS.Application.Features.WarningLetter;
using FMS.Application.Features.WarningLetter.Commands;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Application.Features.WarningLetter.Queries;
using FMS.Application.Features.WarningLetter.Services;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.WebClient.Attributes;
using FMS.WebClient.Controllers.Base;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/v1/warning-letters")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[RequirePermission(Permissions.WarningLetter.Read)]
public class WarningLettersController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IWarningLetterService _warningLetterService;

    public WarningLettersController(IMediator mediator, IWarningLetterService warningLetterService)
    {
        _mediator = mediator;
        _warningLetterService = warningLetterService;
    }

    [HttpGet]
    public async Task<IActionResult> GetWarningLetters(
        [FromQuery] int? siteId,
        [FromQuery] int? employeeId,
        [FromQuery] int? vehicleId,
        [FromQuery] WarningLetterType? letterType,
        [FromQuery] WarningLetterStatus? status,
        [FromQuery] WarningLetterWorkflowStage? workflowStage,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new GetWarningLettersQuery
        {
            SiteId = siteId,
            EmployeeId = employeeId,
            VehicleId = vehicleId,
            LetterType = letterType,
            Status = status,
            WorkflowStage = workflowStage,
            StartDate = startDate,
            EndDate = endDate
        });

        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetWarningLetter(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid warning letter ID");
        }

        var result = await _mediator.Send(new GetWarningLetterByIdQuery(id));
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("employee/{employeeId:int}")]
    public async Task<IActionResult> GetWarningLettersByEmployee(int employeeId)
    {
        if (employeeId <= 0)
        {
            return BadRequest("Invalid employee ID");
        }

        var result = await _mediator.Send(new GetWarningLettersQuery { EmployeeId = employeeId });
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("vehicle/{vehicleId:int}")]
    public async Task<IActionResult> GetWarningLettersByVehicle(int vehicleId)
    {
        if (vehicleId <= 0)
        {
            return BadRequest("Invalid vehicle ID");
        }

        var result = await _mediator.Send(new GetWarningLettersQuery { VehicleId = vehicleId });
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("site-recipients")]
    public async Task<IActionResult> GetSiteRecipients([FromQuery] int siteId)
    {
        if (siteId <= 0)
        {
            return BadRequest("Invalid site ID");
        }

        var result = await _mediator.Send(new GetWarningLetterSiteRecipientsQuery(siteId));
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("{id:int}/signature-recipients")]
    public async Task<IActionResult> GetSignatureRecipients(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid warning letter ID");
        }

        var result = await _mediator.Send(new GetWarningLetterSignatureRecipientsQuery(id));
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost]
    [RequirePermission(Permissions.WarningLetter.Create)]
    public async Task<IActionResult> CreateWarningLetter([FromBody] CreateWarningLetterDto warningLetterDto)
    {
        var validationResult = ValidateModelState();
        if (validationResult != null)
        {
            return validationResult;
        }

        if (!TryGetCurrentUserId(out var userId))
        {
            return BadRequest("Invalid user ID");
        }

        var result = await _mediator.Send(new CreateWarningLetterCommand
        {
            WarningLetter = warningLetterDto,
            CreatedBy = userId
        });

        return StatusCode(result.StatusCode, result);
    }

    [HttpPut("{id:int}")]
    [RequirePermission(Permissions.WarningLetter.Update)]
    public async Task<IActionResult> UpdateWarningLetter(int id, [FromBody] UpdateWarningLetterDto warningLetterDto)
    {
        var validationResult = ValidateModelState();
        if (validationResult != null)
        {
            return validationResult;
        }

        if (id <= 0 || id != warningLetterDto.Id)
        {
            return BadRequest("Warning letter ID mismatch.");
        }

        if (!TryGetCurrentUserId(out var userId))
        {
            return BadRequest("Invalid user ID");
        }

        var result = await _mediator.Send(new UpdateWarningLetterCommand
        {
            WarningLetter = warningLetterDto,
            ModifiedBy = userId
        });

        return StatusCode(result.StatusCode, result);
    }

    [HttpDelete("{id:int}")]
    [RequirePermission(Permissions.WarningLetter.Delete)]
    public async Task<IActionResult> DeleteWarningLetter(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid warning letter ID");
        }

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
        var canDeleteAny = User.HasClaim("permissions", Permissions.WarningLetter.DeleteAny);
        var result = await _mediator.Send(new DeleteWarningLetterCommand(id, userId, canDeleteAny));
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("reset-workflow-artifacts")]
    [RequirePermission(Permissions.WarningLetter.Delete)]
    public async Task<IActionResult> ResetWorkflowArtifacts()
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return BadRequest("Invalid user ID");
        }

        var result = await _mediator.Send(new ResetWarningLetterWorkflowArtifactsCommand(userId));
        return StatusCode(result.StatusCode, result);
    }

    [HttpPut("{id:int}/finalize")]
    [RequirePermission(Permissions.WarningLetter.Finalize)]
    public async Task<IActionResult> FinalizeWarningLetter(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid warning letter ID");
        }

        if (!TryGetCurrentUserId(out var userId))
        {
            return BadRequest("Invalid user ID");
        }

        var result = await _mediator.Send(new FinalizeWarningLetterCommand(id, userId));
        return StatusCode(result.StatusCode, result);
    }

    [HttpPut("{id:int}/acknowledge")]
    [RequirePermission(Permissions.WarningLetter.Update)]
    public async Task<IActionResult> AcknowledgeWarningLetter(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid warning letter ID");
        }

        if (!TryGetCurrentUserId(out var userId))
        {
            return BadRequest("Invalid user ID");
        }

        var result = await _mediator.Send(new AcknowledgeWarningLetterCommand(id, userId));
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetWarningLetterSettings()
    {
        var result = await _mediator.Send(new GetWarningLetterSettingsQuery());
        return StatusCode(result.StatusCode, result);
    }

    [HttpPut("settings")]
    [RequirePermission(Permissions.WarningLetter.Update)]
    public async Task<IActionResult> UpdateWarningLetterSettings([FromBody] WarningLetterSettingsDto settings)
    {
        var validationResult = ValidateModelState();
        if (validationResult != null)
        {
            return validationResult;
        }

        var result = await _mediator.Send(new UpdateWarningLetterSettingsCommand
        {
            Settings = settings
        });
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("consumption-candidates")]
    public async Task<IActionResult> GetConsumptionCandidates(
        [FromQuery] WarningLetterType letterType,
        [FromQuery] int? siteId,
        [FromQuery] int? employeeId,
        [FromQuery] int? vehicleId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new GetWarningLetterConsumptionCandidatesQuery
        {
            LetterType = letterType,
            SiteId = siteId,
            EmployeeId = employeeId,
            VehicleId = vehicleId,
            StartDate = startDate,
            EndDate = endDate
        });

        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("preview")]
    [RequirePermission(Permissions.WarningLetter.Create)]
    public async Task<IActionResult> PreviewWarningLetter([FromBody] CreateWarningLetterDto warningLetterDto)
    {
        var validationResult = ValidateModelState();
        if (validationResult != null)
        {
            return validationResult;
        }

        var result = await _warningLetterService.PreviewHtmlAsync(warningLetterDto);
        if (!result.IsSuccess || string.IsNullOrWhiteSpace(result.Data))
        {
            return StatusCode(result.StatusCode, result);
        }

        return Content(result.Data, "text/html");
    }

    [HttpGet("{id:int}/html")]
    public async Task<IActionResult> GetWarningLetterHtml(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid warning letter ID");
        }

        var result = await _warningLetterService.GetHtmlAsync(id);
        if (!result.IsSuccess || string.IsNullOrWhiteSpace(result.Data))
        {
            return StatusCode(result.StatusCode, result);
        }

        return Content(result.Data, "text/html");
    }

    [HttpPost("{id:int}/generate-pdf")]
    [RequirePermission(Permissions.WarningLetter.GeneratePdf)]
    public async Task<IActionResult> GenerateWarningLetterPdf(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid warning letter ID");
        }

        if (!TryGetCurrentUserId(out var userId))
        {
            return BadRequest("Invalid user ID");
        }

        var result = await _warningLetterService.GeneratePdfAsync(id, userId);
        if (!result.IsSuccess || result.Data == null)
        {
            return StatusCode(result.StatusCode, result);
        }

        return File(result.Data.Content, result.Data.ContentType, result.Data.FileName);
    }

    [HttpGet("{id:int}/pdf")]
    [RequirePermission(Permissions.WarningLetter.GeneratePdf)]
    public async Task<IActionResult> DownloadWarningLetterPdf(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid warning letter ID");
        }

        var result = await _warningLetterService.GetPdfAsync(id);
        if (!result.IsSuccess || result.Data == null)
        {
            return StatusCode(result.StatusCode, result);
        }

        return File(result.Data.Content, result.Data.ContentType, result.Data.FileName);
    }

    [HttpPost("{id:int}/send-email")]
    [RequirePermission(Permissions.WarningLetter.Send)]
    public async Task<IActionResult> SendWarningLetterEmail(int id, [FromBody] SendWarningLetterEmailRequestDto? request)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid warning letter ID");
        }

        if (!TryGetCurrentUserId(out var userId))
        {
            return BadRequest("Invalid user ID");
        }

        var result = await _mediator.Send(new SendWarningLetterEmailCommand(id, userId, request?.EmailRecipient));
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("{id:int}/request-signature")]
    [RequirePermission(Permissions.WarningLetter.Send)]
    public async Task<IActionResult> RequestWarningLetterSignature(int id, [FromBody] RequestWarningLetterSignatureDto? request)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid warning letter ID");
        }

        if (!TryGetCurrentUserId(out var userId))
        {
            return BadRequest("Invalid user ID");
        }

        var result = await _warningLetterService.RequestSignatureAsync(id, userId, request ?? new RequestWarningLetterSignatureDto());
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("site-signature-recipients")]
    [RequirePermission(Permissions.WarningLetter.Send)]
    public async Task<IActionResult> GetSiteSignatureRecipients([FromQuery] int siteId)
    {
        if (siteId <= 0)
        {
            return BadRequest("Invalid site ID");
        }

        var result = await _mediator.Send(new GetSiteSignatureRecipientsQuery(siteId));
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("bulk-request-signature")]
    [RequirePermission(Permissions.WarningLetter.Send)]
    public async Task<IActionResult> BulkRequestSignature([FromBody] BulkRequestWarningLetterSignatureDto? request)
    {
        if (request == null || request.WarningLetterIds == null || request.WarningLetterIds.Count == 0)
        {
            return BadRequest("At least one warning letter must be selected.");
        }

        if (!TryGetCurrentUserId(out var userId))
        {
            return BadRequest("Invalid user ID");
        }

        var result = await _warningLetterService.BulkRequestSignatureAsync(userId, request);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("{id:int}/signed-copy")]
    [RequirePermission(Permissions.WarningLetter.UploadSignedCopy)]
    public async Task<IActionResult> UploadSignedCopy(int id, [FromForm] IFormFile file)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid warning letter ID");
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest("No file provided.");
        }

        if (!TryGetCurrentUserId(out var userId))
        {
            return BadRequest("Invalid user ID");
        }

        var result = await _warningLetterService.UploadSignedCopyAsync(id, file, userId);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("{id:int}/approve-letter")]
    [RequirePermission(Permissions.WarningLetter.UploadApproveLetter)]
    public async Task<IActionResult> UploadApproveLetter(int id, [FromForm] IFormFile file)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid warning letter ID");
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest("No file provided.");
        }

        if (!TryGetCurrentUserId(out var userId))
        {
            return BadRequest("Invalid user ID");
        }

        var result = await _warningLetterService.UploadApproveLetterAsync(id, file, userId);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("{id:int}/signed-copy")]
    public async Task<IActionResult> DownloadSignedCopy(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid warning letter ID");
        }

        var result = await _warningLetterService.GetSignedCopyAsync(id);
        if (!result.IsSuccess || result.Data == null)
        {
            return StatusCode(result.StatusCode, result);
        }

        return File(result.Data.Content, result.Data.ContentType, result.Data.FileName);
    }

    [HttpGet("{id:int}/approve-letter")]
    public async Task<IActionResult> DownloadApproveLetter(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid warning letter ID");
        }

        var result = await _warningLetterService.GetApproveLetterAsync(id);
        if (!result.IsSuccess || result.Data == null)
        {
            return StatusCode(result.StatusCode, result);
        }

        return File(result.Data.Content, result.Data.ContentType, result.Data.FileName);
    }

    /// <summary>
    /// Returns warning letter analytics report data with server-side aggregations.
    /// </summary>
    [HttpGet("report/data")]
    public async Task<IActionResult> GetReportData(
        [FromQuery] int? siteId,
        [FromQuery] int[]? vehicleId,
        [FromQuery] int? vehicleTypeId,
        [FromQuery] int[]? employeeId,
        [FromQuery] WarningLetterType? letterType,
        [FromQuery] WarningLetterWorkflowStage? workflowStage,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new GetWarningLetterReportQuery
        {
            SiteId = siteId,
            VehicleIds = vehicleId?.Where(id => id > 0).Distinct().ToList(),
            VehicleTypeId = vehicleTypeId,
            EmployeeIds = employeeId?.Where(id => id > 0).Distinct().ToList(),
            LetterType = letterType,
            WorkflowStage = workflowStage,
            StartDate = startDate,
            EndDate = endDate,
        });
        return StatusCode(result.StatusCode, result);
    }

    /// <summary>
    /// Returns warning letter candidates (not generated) report data.
    /// </summary>
    [HttpGet("report/candidates-data")]
    public async Task<IActionResult> GetCandidatesReportData(
        [FromQuery] int? siteId,
        [FromQuery] int[]? vehicleId,
        [FromQuery] int? vehicleTypeId,
        [FromQuery] int[]? employeeId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new GetWarningLetterCandidatesReportQuery
        {
            SiteId = siteId,
            VehicleIds = vehicleId?.Where(id => id > 0).Distinct().ToList(),
            VehicleTypeId = vehicleTypeId,
            EmployeeIds = employeeId?.Where(id => id > 0).Distinct().ToList(),
            StartDate = startDate,
            EndDate = endDate,
        });
        return StatusCode(result.StatusCode, result);
    }
}