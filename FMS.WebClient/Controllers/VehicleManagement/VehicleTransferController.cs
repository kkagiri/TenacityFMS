/**
 * File: VehicleTransferController.cs
 * Purpose: Manages vehicle transfer workflows, reports, lifecycle actions, and notification-triggering endpoints.
 * Dependencies: MediatR, transfer commands/queries, jsReport, email service, JWT claims.
 * Last Modified: 2026-04-09
 *
 * Key Actions:
 * - CreateTransfer(): Creates transfer records with authenticated user metadata.
 * - UpdateTransferStatus(): Updates transfer lifecycle state.
 * - DownloadTransferReport(): Generates transfer checkup PDFs.
 */
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.Commands;
using FMS.Application.Features.VehicleTransfer.Constants;
using FMS.Application.Features.VehicleTransfer.DTOs;
using FMS.Application.Features.VehicleTransfer.Queries;
using FMS.Application.Features.Notification.Services;
using FMS.WebClient.Services.Reporting;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers.VehicleManagement;

/// <summary>
/// Controller for Vehicle Transfer operations
/// Handles transfer checkup reports and site changes
/// </summary>
[ApiController]
[Route("api/v1/vehicletransfers")]
[Authorize]
[RequirePermission(Permissions.Vehicle.Read)]
public class VehicleTransferController : ControllerBase
{
    private const string LetterheadLogoPath = @"C:\FMSData\reports\branding\letterhead-logo.png";

    private readonly IMediator _mediator;
    private readonly ILogger<VehicleTransferController> _logger;
    private readonly IJsReportService _jsReportService;
    private readonly IEmailService _emailService;

    public VehicleTransferController(
        IMediator mediator,
        ILogger<VehicleTransferController> logger,
        IJsReportService jsReportService,
        IEmailService emailService)
    {
        _mediator = mediator;
        _logger = logger;
        _jsReportService = jsReportService;
        _emailService = emailService;
    }

    private string? GetCurrentUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        return string.IsNullOrWhiteSpace(userId) ? null : userId;
    }

    private static string ResolveEquipmentIdentifier(string? storedIdentifier, string? remarks)
    {
        var imei = ExtractRemarkValue(remarks, "IMEI");
        if (!string.IsNullOrWhiteSpace(imei))
        {
            return imei;
        }

        return string.IsNullOrWhiteSpace(storedIdentifier) ? "-" : storedIdentifier;
    }

    private static string? ExtractRemarkValue(string? remarks, string label)
    {
        if (string.IsNullOrWhiteSpace(remarks) || string.IsNullOrWhiteSpace(label))
        {
            return null;
        }

        var matchedLine = remarks
            .Split(new[] { "\r\n", "\n" }, System.StringSplitOptions.RemoveEmptyEntries)
            .Select(line => line.Trim())
            .FirstOrDefault(line => line.StartsWith(label + ":", System.StringComparison.OrdinalIgnoreCase));

        if (string.IsNullOrWhiteSpace(matchedLine))
        {
            return null;
        }

        var separatorIndex = matchedLine.IndexOf(':');
        if (separatorIndex < 0 || separatorIndex == matchedLine.Length - 1)
        {
            return null;
        }

        var value = matchedLine[(separatorIndex + 1)..].Trim();
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    private static string? LoadLetterheadLogoDataUri()
    {
        var logoPath = ResolveLetterheadLogoPath();
        if (string.IsNullOrWhiteSpace(logoPath) || !System.IO.File.Exists(logoPath))
        {
            return null;
        }

        var bytes = System.IO.File.ReadAllBytes(logoPath);
        if (bytes.Length == 0)
        {
            return null;
        }

        var mimeType = ResolveImageMimeType(System.IO.Path.GetExtension(logoPath));
        return $"data:{mimeType};base64,{System.Convert.ToBase64String(bytes)}";
    }

    private static string? ResolveLetterheadLogoPath()
    {
        if (System.IO.File.Exists(LetterheadLogoPath))
        {
            return LetterheadLogoPath;
        }

        var directory = System.IO.Path.GetDirectoryName(LetterheadLogoPath);
        var fileNameWithoutExtension = System.IO.Path.GetFileNameWithoutExtension(LetterheadLogoPath);

        if (string.IsNullOrWhiteSpace(directory) || !System.IO.Directory.Exists(directory))
        {
            return null;
        }

        var matchingFiles = System.IO.Directory.GetFiles(directory, $"{fileNameWithoutExtension}*", System.IO.SearchOption.TopDirectoryOnly);
        return matchingFiles.Length > 0 ? matchingFiles[0] : null;
    }

    private static string ResolveImageMimeType(string extension)
    {
        return extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".svg" => "image/svg+xml",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "image/png"
        };
    }

    /// <summary>
    /// Get all vehicle transfers with optional filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<FMSResponse<List<VehicleTransferDTO>>>> GetTransfers(
        [FromQuery] int? vehicleId,
        [FromQuery] int? fromSiteId,
        [FromQuery] int? toSiteId,
        [FromQuery] string? status,
        [FromQuery] System.DateTime? fromDate,
        [FromQuery] System.DateTime? toDate,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
    {
        var query = new GetVehicleTransfersQuery(vehicleId, fromSiteId, toSiteId, status, fromDate, toDate, skip, take);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get a specific vehicle transfer by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<FMSResponse<VehicleTransferDTO>>> GetTransferById(int id)
    {
        var result = await _mediator.Send(new GetVehicleTransferByIdQuery(id));
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Get transfers for a specific vehicle
    /// </summary>
    [HttpGet("vehicle/{vehicleId}")]
    public async Task<ActionResult<FMSResponse<List<VehicleTransferDTO>>>> GetTransfersByVehicle(int vehicleId)
    {
        var query = new GetVehicleTransfersQuery(VehicleId: vehicleId);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Create a new vehicle transfer with checkup report
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<FMSResponse<VehicleTransferDTO>>> CreateTransfer([FromForm] CreateVehicleTransferDTO createTransferDto)
    {
        createTransferDto.EnsureJsonCollectionsParsed();

        // Set user ID from claims
        var userId = GetCurrentUserId();
        createTransferDto.UserId = userId;

        var result = await _mediator.Send(new CreateVehicleTransferCommand(createTransferDto));
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        // Draft creation should not trigger approval email directly.
        if (createTransferDto.SendEmail
            && !string.IsNullOrEmpty(createTransferDto.EmailRecipients)
            && result.Data != null
            && !string.Equals(result.Data.Status, "Draft", System.StringComparison.OrdinalIgnoreCase))
        {
            await SendTransferEmailNotification(result.Data, createTransferDto.EmailRecipients);
        }

        return CreatedAtAction(nameof(GetTransferById), new { id = result.Data?.TransferId }, result);
    }

    /// <summary>
    /// Save or update transfer draft.
    /// </summary>
    [HttpPost("draft")]
    public async Task<ActionResult<FMSResponse<VehicleTransferDTO>>> SaveTransferDraft([FromForm] SaveTransferDraftDTO draftDto)
    {
        draftDto.EnsureJsonCollectionsParsed();

        draftDto.UserId = GetCurrentUserId();
        var result = await _mediator.Send(new SaveTransferDraftCommand(draftDto));

        if (!result.IsSuccess && string.Equals(result.ErrorCode, "NOT_FOUND", System.StringComparison.OrdinalIgnoreCase))
        {
            return NotFound(result);
        }

        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Submit draft transfer for workshop manager approval.
    /// </summary>
    [HttpPost("{id}/submit-approval")]
    public async Task<ActionResult<FMSResponse<VehicleTransferDTO>>> SubmitForApproval(int id, [FromBody] SubmitForApprovalRequest request)
    {
        var result = await _mediator.Send(new SubmitForApprovalCommand(
            id,
            GetCurrentUserId(),
            request.WorkshopManagerEmail,
            request.WorkshopManagerName,
            request.ApprovalBaseUrl));

        if (!result.IsSuccess && string.Equals(result.ErrorCode, "NOT_FOUND", System.StringComparison.OrdinalIgnoreCase))
        {
            return NotFound(result);
        }

        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Approve transfer as workshop manager.
    /// </summary>
    [HttpPost("{id}/approve")]
    public async Task<ActionResult<FMSResponse<VehicleTransferDTO>>> ApproveTransfer(int id, [FromBody] ApproveTransferRequest request)
    {
        var result = await _mediator.Send(new ApproveTransferCommand(
            id,
            GetCurrentUserId(),
            request.ApproverName,
            request.CreatorEmail));

        if (!result.IsSuccess && string.Equals(result.ErrorCode, "NOT_FOUND", System.StringComparison.OrdinalIgnoreCase))
        {
            return NotFound(result);
        }

        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Reject transfer approval request and return to draft.
    /// </summary>
    [HttpPost("{id}/reject")]
    public async Task<ActionResult<FMSResponse<VehicleTransferDTO>>> RejectTransfer(int id, [FromBody] RejectTransferRequest request)
    {
        var result = await _mediator.Send(new RejectTransferCommand(
            id,
            GetCurrentUserId(),
            request.Reason,
            request.CreatorEmail));

        if (!result.IsSuccess && string.Equals(result.ErrorCode, "NOT_FOUND", System.StringComparison.OrdinalIgnoreCase))
        {
            return NotFound(result);
        }

        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update transfer status (Draft, PendingApproval, Approved, InTransit, Completed, Cancelled)
    /// </summary>
    [HttpPut("{id}/status")]
    public async Task<ActionResult<FMSResponse<bool>>> UpdateTransferStatus(int id, [FromBody] UpdateTransferStatusRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _mediator.Send(new UpdateVehicleTransferStatusCommand(id, request.Status, userId));
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Dispatch an approved transfer (Approved → InTransit). Sends notification to receiver.
    /// </summary>
    [HttpPost("{id}/dispatch")]
    [RequirePermission(Permissions.Vehicle.Edit)]
    public async Task<ActionResult<FMSResponse<VehicleTransferDTO>>> DispatchTransfer(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _mediator.Send(new DispatchTransferCommand(id, userId));
        if (!result.IsSuccess && string.Equals(result.ErrorCode, "NOT_FOUND", System.StringComparison.OrdinalIgnoreCase))
        {
            return NotFound(result);
        }
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Confirm vehicle receipt at destination (InTransit → Completed). Updates vehicle site.
    /// </summary>
    [HttpPost("{id}/confirm-receipt")]
    [RequirePermission(Permissions.Vehicle.Edit)]
    public async Task<ActionResult<FMSResponse<VehicleTransferDTO>>> ConfirmReceipt(int id, [FromBody] ConfirmReceiptRequest? request)
    {
        var userId = GetCurrentUserId();
        var result = await _mediator.Send(new ConfirmReceiptCommand(id, userId, request?.Remarks));
        if (!result.IsSuccess && string.Equals(result.ErrorCode, "NOT_FOUND", System.StringComparison.OrdinalIgnoreCase))
        {
            return NotFound(result);
        }
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a pending transfer
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<FMSResponse<bool>>> DeleteTransfer(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _mediator.Send(new DeleteVehicleTransferCommand(id, userId));
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Generate and download transfer checkup report as PDF
    /// </summary>
    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> DownloadTransferReport(int id)
    {
        try
        {
            var result = await _mediator.Send(new GetVehicleTransferByIdQuery(id));
            if (!result.IsSuccess || result.Data == null)
            {
                return NotFound(FMSResponse<byte[]>.NotFound($"Transfer with ID {id} not found"));
            }

            var reportData = BuildReportData(result.Data);
            var pdfBytes = await _jsReportService.RenderInlinePdfAsync(GetTransferReportTemplate(), reportData);

            return File(pdfBytes, "application/pdf", $"Transfer_Checkup_Report_{result.Data.DeliveryNoteNumber ?? id.ToString()}.pdf");
        }
        catch (System.Exception ex)
        {
            _logger.LogError(ex, "Error generating PDF report for transfer {TransferId}", id);
            return StatusCode(500, FMSResponse<byte[]>.Failed($"Error generating report: {ex.Message}"));
        }
    }

    /// <summary>
    /// Send transfer report email
    /// </summary>
    [HttpPost("{id}/send-email")]
    public async Task<ActionResult<FMSResponse<bool>>> SendTransferEmail(int id, [FromBody] SendEmailRequest request)
    {
        try
        {
            var result = await _mediator.Send(new GetVehicleTransferByIdQuery(id));
            if (!result.IsSuccess || result.Data == null)
            {
                return NotFound(FMSResponse<bool>.NotFound($"Transfer with ID {id} not found"));
            }

            var success = await SendTransferEmailNotification(result.Data, request.Recipients);
            if (success)
            {
                return Ok(FMSResponse<bool>.Success(true, "Email sent successfully"));
            }

            return BadRequest(FMSResponse<bool>.Failed("Failed to send email"));
        }
        catch (System.Exception ex)
        {
            _logger.LogError(ex, "Error sending email for transfer {TransferId}", id);
            return StatusCode(500, FMSResponse<bool>.Failed($"Error sending email: {ex.Message}"));
        }
    }

    private async Task<bool> SendTransferEmailNotification(VehicleTransferDTO transfer, string recipients)
    {
        try
        {
            var subject = $"Vehicle Transfer: {transfer.VehicleHyoungNo} from {transfer.FromSiteName} to {transfer.ToSiteName}";
            var body = BuildTransferEmailBody(transfer);

            var success = await _emailService.SendEmailAsync(recipients, subject, body, isHtml: true);
            if (success)
            {
                _logger.LogInformation("Transfer email sent successfully for Transfer {TransferId} to {Recipients}",
                    transfer.TransferId, recipients);
            }
            return success;
        }
        catch (System.Exception ex)
        {
            _logger.LogError(ex, "Failed to send transfer email notification");
            return false;
        }
    }

    private static string BuildTransferEmailBody(VehicleTransferDTO transfer)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("<html><body style='font-family: Arial, sans-serif;'>");
        sb.AppendLine("<h2 style='color: #333;'>Plant Equipment Transfer Checkup Report</h2>");
        sb.AppendLine("<hr/>");

        // Transport Details
        sb.AppendLine("<h3>Transport Details</h3>");
        sb.AppendLine("<table style='border-collapse: collapse; width: 100%;'>");
        sb.AppendLine($"<tr><td style='padding: 5px; font-weight: bold;'>Delivery Note #:</td><td style='padding: 5px;'>{transfer.DeliveryNoteNumber}</td></tr>");
        sb.AppendLine($"<tr><td style='padding: 5px; font-weight: bold;'>Transfer Date:</td><td style='padding: 5px;'>{transfer.TransferDate:dd-MMM-yyyy}</td></tr>");
        sb.AppendLine($"<tr><td style='padding: 5px; font-weight: bold;'>From Site:</td><td style='padding: 5px;'>{transfer.FromSiteName}</td></tr>");
        sb.AppendLine($"<tr><td style='padding: 5px; font-weight: bold;'>To Site:</td><td style='padding: 5px;'>{transfer.ToSiteName}</td></tr>");
        sb.AppendLine($"<tr><td style='padding: 5px; font-weight: bold;'>Driver:</td><td style='padding: 5px;'>{transfer.DriverName}</td></tr>");
        sb.AppendLine($"<tr><td style='padding: 5px; font-weight: bold;'>Driver Phone:</td><td style='padding: 5px;'>{transfer.DriverPhone}</td></tr>");
        sb.AppendLine("</table>");

        // Machine/Service Details
        sb.AppendLine("<h3>Machine/Service Details</h3>");
        sb.AppendLine("<table style='border-collapse: collapse; width: 100%;'>");
        sb.AppendLine($"<tr><td style='padding: 5px; font-weight: bold;'>Vehicle/Hyoung No:</td><td style='padding: 5px;'>{transfer.VehicleHyoungNo}</td></tr>");
        sb.AppendLine($"<tr><td style='padding: 5px; font-weight: bold;'>Make/Model:</td><td style='padding: 5px;'>{transfer.MakeModel}</td></tr>");
        sb.AppendLine($"<tr><td style='padding: 5px; font-weight: bold;'>Job Number:</td><td style='padding: 5px;'>{transfer.JobNumber}</td></tr>");
        sb.AppendLine($"<tr><td style='padding: 5px; font-weight: bold;'>Current Reading:</td><td style='padding: 5px;'>{transfer.CurrentReading} {transfer.ReadingUnit}</td></tr>");
        sb.AppendLine($"<tr><td style='padding: 5px; font-weight: bold;'>Next Service:</td><td style='padding: 5px;'>{transfer.NextServiceReading} {transfer.ReadingUnit}</td></tr>");
        sb.AppendLine($"<tr><td style='padding: 5px; font-weight: bold;'>Fuel in Tank:</td><td style='padding: 5px;'>{transfer.FuelInTank} Ltr</td></tr>");
        sb.AppendLine("</table>");

        // Checkup Items Summary
        if (transfer.CheckupItems?.Count > 0)
        {
            sb.AppendLine("<h3>Checkup Items</h3>");
            sb.AppendLine("<table style='border-collapse: collapse; width: 100%; border: 1px solid #ddd;'>");
            sb.AppendLine("<tr style='background-color: #f2f2f2;'><th style='padding: 8px; border: 1px solid #ddd;'>Item</th><th style='padding: 8px; border: 1px solid #ddd;'>Status</th><th style='padding: 8px; border: 1px solid #ddd;'>Remarks</th></tr>");
            foreach (var item in transfer.CheckupItems)
            {
                var status = item.IsGood == true ? "Good" : item.IsFair == true ? "Fair" : item.IsDamaged == true ? "Damaged" : item.IsWorn == true ? $"Worn ({item.WornPercentage}%)" : "-";
                sb.AppendLine($"<tr><td style='padding: 8px; border: 1px solid #ddd;'>{item.Description}</td><td style='padding: 8px; border: 1px solid #ddd;'>{status}</td><td style='padding: 8px; border: 1px solid #ddd;'>{item.Remarks ?? ""}</td></tr>");
            }
            sb.AppendLine("</table>");
        }

        if (!string.IsNullOrWhiteSpace(transfer.GpsDeviceId) ||
            !string.IsNullOrWhiteSpace(transfer.GpsDeviceRemarks) ||
            !string.IsNullOrWhiteSpace(transfer.FuelSensorId) ||
            !string.IsNullOrWhiteSpace(transfer.FuelSensorRemarks))
        {
            var gpsEquipmentIdentifier = ResolveEquipmentIdentifier(transfer.GpsDeviceId, transfer.GpsDeviceRemarks);
            sb.AppendLine("<h3>GPS Equipment Checkup</h3>");
            sb.AppendLine("<table style='border-collapse: collapse; width: 100%; border: 1px solid #ddd;'>");
            sb.AppendLine("<tr style='background-color: #f2f2f2;'><th style='padding: 8px; border: 1px solid #ddd;'>Equipment</th><th style='padding: 8px; border: 1px solid #ddd;'>Identifier</th><th style='padding: 8px; border: 1px solid #ddd;'>Condition</th><th style='padding: 8px; border: 1px solid #ddd;'>Working</th><th style='padding: 8px; border: 1px solid #ddd;'>Remarks</th></tr>");
            sb.AppendLine($"<tr><td style='padding: 8px; border: 1px solid #ddd;'>GPS Device</td><td style='padding: 8px; border: 1px solid #ddd;'>{gpsEquipmentIdentifier}</td><td style='padding: 8px; border: 1px solid #ddd;'>{transfer.GpsDeviceCondition ?? "-"}</td><td style='padding: 8px; border: 1px solid #ddd;'>{(transfer.GpsDeviceWorking ? "Yes" : "No")}</td><td style='padding: 8px; border: 1px solid #ddd;'>{transfer.GpsDeviceRemarks ?? ""}</td></tr>");
            sb.AppendLine($"<tr><td style='padding: 8px; border: 1px solid #ddd;'>Sensor Variables</td><td style='padding: 8px; border: 1px solid #ddd;'>{transfer.FuelSensorId ?? "-"}</td><td style='padding: 8px; border: 1px solid #ddd;'>{transfer.FuelSensorCondition ?? "-"}</td><td style='padding: 8px; border: 1px solid #ddd;'>{(transfer.FuelSensorWorking ? "Yes" : "No")}</td><td style='padding: 8px; border: 1px solid #ddd;'>{transfer.FuelSensorRemarks ?? ""}</td></tr>");
            sb.AppendLine("</table>");
        }

        if (transfer.ServiceFilterPartsList?.Count > 0)
        {
            sb.AppendLine("<h3>Service Filter Parts</h3>");
            sb.AppendLine("<table style='border-collapse: collapse; width: 100%; border: 1px solid #ddd;'>");
            sb.AppendLine("<tr style='background-color: #f2f2f2;'><th style='padding: 8px; border: 1px solid #ddd;'>#</th><th style='padding: 8px; border: 1px solid #ddd;'>Description</th><th style='padding: 8px; border: 1px solid #ddd;'>Part Number</th><th style='padding: 8px; border: 1px solid #ddd;'>Qty</th></tr>");
            foreach (var part in transfer.ServiceFilterPartsList)
            {
                sb.AppendLine($"<tr><td style='padding: 8px; border: 1px solid #ddd;'>{part.Number}</td><td style='padding: 8px; border: 1px solid #ddd;'>{part.Description ?? "-"}</td><td style='padding: 8px; border: 1px solid #ddd;'>{part.PartNumber ?? "-"}</td><td style='padding: 8px; border: 1px solid #ddd;'>{part.Quantity}</td></tr>");
            }
            sb.AppendLine("</table>");
        }

        sb.AppendLine("<hr/>");
        sb.AppendLine($"<p style='color: #666;'>Status: <strong>{transfer.Status}</strong></p>");
        sb.AppendLine($"<p style='color: #666;'>Generated on: {System.DateTime.Now:dd-MMM-yyyy HH:mm}</p>");
        sb.AppendLine("</body></html>");

        return sb.ToString();
    }

    private static object BuildReportData(VehicleTransferDTO transfer)
    {
        return new
        {
            transfer.TransferId,
            transfer.DeliveryNoteNumber,
            TransferDate = transfer.TransferDate.ToString("dd-MMM-yyyy"),
            transfer.FromSiteName,
            transfer.ToSiteName,
            transfer.DriverName,
            transfer.DriverPhone,
            transfer.VehicleHyoungNo,
            transfer.MakeModel,
            transfer.JobNumber,
            transfer.CurrentReading,
            transfer.NextServiceReading,
            transfer.ReadingUnit,
            transfer.FuelInTank,
            transfer.BatteryNumber,
            transfer.SealNumber,
            transfer.Remarks,
            transfer.SenderName,
            transfer.SenderFunction,
            transfer.ReceiverName,
            transfer.ReceiverFunction,
            transfer.ApprovedBy,
            transfer.WorkshopManagerSign,
            transfer.Status,
            CheckupItems = transfer.CheckupItems,
            TyreDetails = transfer.TyreDetails,
            BatteryDetails = transfer.BatteryDetails,
            transfer.GpsDeviceId,
            GpsDeviceIdentifier = ResolveEquipmentIdentifier(transfer.GpsDeviceId, transfer.GpsDeviceRemarks),
            transfer.GpsDeviceCondition,
            transfer.GpsDeviceWorking,
            transfer.GpsDeviceRemarks,
            transfer.FuelSensorId,
            transfer.FuelSensorCondition,
            transfer.FuelSensorWorking,
            transfer.FuelSensorRemarks,
            LogoDataUri = LoadLetterheadLogoDataUri(),
            ServiceFilterParts = transfer.ServiceFilterPartsList,
            GeneratedDate = System.DateTime.Now.ToString("dd-MMM-yyyy HH:mm")
        };
    }

    private static string GetTransferReportTemplate()
    {
        return @"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8' />
    <style>
        @page { size: A4; margin: 11mm 13mm 12mm 13mm; }
        body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; padding: 0; line-height: 1.2; font-size: 10.2pt; }

        .letterhead { border-top: 1px solid #7d89a6; padding: 12px 0 10px; margin: 10px 0 8px; }
        .letterhead-table { width: 100%; border-collapse: collapse; }
        .letterhead-table td { vertical-align: top; padding: 0 4px; border: none; }
        .lh-brand { width: 62%; text-align: left; vertical-align: middle; }
        .lh-disciplines { width: 38%; font-size: 6.8pt; line-height: 1.08; color: #6a6a6a; text-align: right; }
        .brand-wrap { display: inline-flex; flex-wrap: nowrap; align-items: center; justify-content: flex-start; gap: 4px; padding-top: 2px; white-space: nowrap; }
        .brand-logo { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; flex: 0 0 42px; }
        .brand-logo img { display: block; max-width: 38px; max-height: 38px; object-fit: contain; }
        .company-name { font-family: 'Bookman Old Style', 'Times New Roman', serif; font-size: 40px; font-weight: 700; color: #0047B9; letter-spacing: 0.5px; line-height: 0.84; text-transform: uppercase; white-space: nowrap; }
        .company-side { text-align: left; color: #7d7d7d; line-height: 0.96; padding-top: 2px; white-space: nowrap; }
        .company-side-top { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; font-weight: 700; text-transform: uppercase; }
        .company-side-bottom { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
        .header-divider-row td { padding: 0 4px 6px; border: none; }
        .header-divider-line { border-top: 1px solid #7d89a6; height: 0; }
        .report-title { text-align: center; font-size: 11.2pt; font-weight: 700; color: #6f6f6f; margin: 6px 0 4px; text-transform: uppercase; letter-spacing: 0.04em; }
        .project-line { text-align: center; font-size: 9.8pt; font-weight: 700; color: #7a7a7a; margin: 2px 0 6px; text-transform: uppercase; }
        .divider { border-top: 1px solid #8f8f8f; margin: 0 0 10px; }
        .report-status { margin: 0 0 10px; font-size: 9pt; color: #4f4f4f; text-align: left; }
        .report-status strong { font-weight: 700; color: #000; }

        .section { margin-bottom: 15px; }
        .section-title { font-weight: bold; background-color: #f0f0f0; padding: 5px; margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #f2f2f2; }
        .info-table td { border: none; padding: 3px 10px 3px 0; }
        .status-good { color: green; }
        .status-fair { color: orange; }
        .status-damaged { color: red; }
        .signature-section { margin-top: 30px; }
        .signature-box { display: inline-block; width: 45%; margin-right: 5%; }
    </style>
</head>
<body data-skip-fms-letterhead='true'>
    <div class='letterhead'>
        <table class='letterhead-table'>
            <tr>
                <td class='lh-brand'>
                    <div class='brand-wrap'>
                        {{#if LogoDataUri}}<div class='brand-logo'><img src='{{LogoDataUri}}' alt='H Young logo' /></div>{{/if}}
                        <div class='company-name'>HYOUNG</div>
                        <div class='company-side'>
                            <div class='company-side-top'>&amp; Co</div>
                            <div class='company-side-bottom'>(EA) Ltd.</div>
                        </div>
                    </div>
                </td>
                <td class='lh-disciplines'>
                    <div>Road Contractors</div>
                    <div>Civil Engineers</div>
                    <div>Mechanical Engineers</div>
                    <div>Piping and Process</div>
                    <div>Structural Steel</div>
                </td>
            </tr>
            <tr class='header-divider-row'>
                <td colspan='2'><div class='header-divider-line'></div></td>
            </tr>
        </table>
        <div class='report-title'>Plant Equipment Transfer Checkup Report</div>
        <div class='project-line'>{{FromSiteName}} to {{ToSiteName}}</div>
        <div class='divider'></div>
    </div>

    <div class='report-status'><strong>Status:</strong> {{Status}}</div>

    <div class='section'>
        <div class='section-title'>Transport Details</div>
        <table class='info-table'>
            <tr><td><strong>Delivery Note #:</strong></td><td>{{DeliveryNoteNumber}}</td><td><strong>Transfer Date:</strong></td><td>{{TransferDate}}</td></tr>
            <tr><td><strong>From Site:</strong></td><td>{{FromSiteName}}</td><td><strong>To Site:</strong></td><td>{{ToSiteName}}</td></tr>
            <tr><td><strong>Driver:</strong></td><td>{{DriverName}}</td><td><strong>Phone:</strong></td><td>{{DriverPhone}}</td></tr>
        </table>
    </div>

    <div class='section'>
        <div class='section-title'>Machine/Service Details</div>
        <table class='info-table'>
            <tr><td><strong>Hyoung No:</strong></td><td>{{VehicleHyoungNo}}</td><td><strong>Make/Model:</strong></td><td>{{MakeModel}}</td></tr>
            <tr><td><strong>Job Number:</strong></td><td>{{JobNumber}}</td><td><strong>Battery No:</strong></td><td>{{BatteryNumber}}</td></tr>
            <tr><td><strong>Current Reading:</strong></td><td>{{CurrentReading}} {{ReadingUnit}}</td><td><strong>Next Service:</strong></td><td>{{NextServiceReading}} {{ReadingUnit}}</td></tr>
            <tr><td><strong>Fuel in Tank:</strong></td><td>{{FuelInTank}} Ltr</td><td><strong>Seal Number:</strong></td><td>{{SealNumber}}</td></tr>
        </table>
    </div>

    <div class='section'>
        <div class='section-title'>Checkup Items</div>
        <table>
            <tr>
                <th>No</th>
                <th>Description</th>
                <th>Check Type</th>
                <th>Good</th>
                <th>Fair</th>
                <th>Damaged</th>
                <th>Worn %</th>
                <th>Remarks</th>
            </tr>
            {{#each CheckupItems}}
            <tr>
                <td>{{SerialNo}}</td>
                <td>{{Description}}</td>
                <td>{{CheckType}}</td>
                <td>{{#if IsGood}}✓{{/if}}</td>
                <td>{{#if IsFair}}✓{{/if}}</td>
                <td>{{#if IsDamaged}}✓{{/if}}</td>
                <td>{{#if IsWorn}}{{WornPercentage}}%{{/if}}</td>
                <td>{{Remarks}}</td>
            </tr>
            {{/each}}
        </table>
    </div>

    <div class='section'>
        <div class='section-title'>GPS Equipment Checkup</div>
        <table>
            <tr>
                <th>Equipment</th>
                <th>Identifier</th>
                <th>Condition</th>
                <th>Working</th>
                <th>Remarks</th>
            </tr>
            <tr>
                <td>GPS Device</td>
                <td>{{GpsDeviceIdentifier}}</td>
                <td>{{GpsDeviceCondition}}</td>
                <td>{{#if GpsDeviceWorking}}Yes{{else}}No{{/if}}</td>
                <td>{{GpsDeviceRemarks}}</td>
            </tr>
            <tr>
                <td>Sensor Variables</td>
                <td>{{FuelSensorId}}</td>
                <td>{{FuelSensorCondition}}</td>
                <td>{{#if FuelSensorWorking}}Yes{{else}}No{{/if}}</td>
                <td>{{FuelSensorRemarks}}</td>
            </tr>
        </table>
    </div>

    <div class='section'>
        <div class='section-title'>Service Filter Parts</div>
        <table>
            <tr>
                <th>#</th>
                <th>Description</th>
                <th>Part Number</th>
                <th>Qty</th>
            </tr>
            {{#each ServiceFilterParts}}
            <tr>
                <td>{{Number}}</td>
                <td>{{Description}}</td>
                <td>{{PartNumber}}</td>
                <td>{{Quantity}}</td>
            </tr>
            {{/each}}
        </table>
    </div>

    <div class='section'>
        <div class='section-title'>Remarks</div>
        <p>{{Remarks}}</p>
    </div>

    <div class='signature-section'>
        <div class='signature-box'>
            <p><strong>Sender:</strong> {{SenderName}}</p>
            <p><strong>Function:</strong> {{SenderFunction}}</p>
            <p>Signature: _________________</p>
        </div>
        <div class='signature-box'>
            <p><strong>Receiver:</strong> {{ReceiverName}}</p>
            <p><strong>Function:</strong> {{ReceiverFunction}}</p>
            <p>Signature: _________________</p>
        </div>
    </div>

    <div style='margin-top: 20px;'>
        <p><strong>Approved By:</strong> {{ApprovedBy}}</p>
        <p><strong>Workshop Manager:</strong> {{WorkshopManagerSign}}</p>
    </div>

    <div style='text-align: center; margin-top: 30px; color: #666;'>
        <p>Status: <strong>{{Status}}</strong> | Generated: {{GeneratedDate}}</p>
    </div>
</body>
</html>";
    }

    /// <summary>
    /// Returns the list of valid CheckType values for checkup templates.
    /// </summary>
    [HttpGet("checkup-template/check-types")]
    public ActionResult<FMSResponse<IReadOnlyList<string>>> GetCheckTypes()
    {
        return Ok(FMSResponse<IReadOnlyList<string>>.Success(CheckTypeConstants.All, "Check types fetched successfully"));
    }

    /// <summary>
    /// Get checkup items template (optionally matched to vehicle criteria).
    /// </summary>
    [HttpGet("checkup-template")]
    public async Task<ActionResult<FMSResponse<List<CreateCheckupItemDTO>>>> GetCheckupTemplate(
        [FromQuery] int? vehicleTypeId = null,
        [FromQuery] int? vehicleModelId = null,
        [FromQuery] bool? hasGps = null)
    {
        var result = await _mediator.Send(new GetVehicleTransferCheckupTemplatesQuery(
            vehicleTypeId,
            vehicleModelId,
            hasGps,
            IncludeInactive: false,
            ApplyVehicleMatching: true));

        if (result.IsSuccess && result.Data != null && result.Data.Count > 0)
        {
            var mappedTemplate = result.Data
                .Select(item => new CreateCheckupItemDTO
                {
                    SerialNo = item.SerialNo,
                    Description = item.Description,
                    CheckType = item.CheckType
                })
                .ToList();

            return Ok(FMSResponse<List<CreateCheckupItemDTO>>.Success(mappedTemplate, "Checkup template fetched successfully"));
        }

        // Backward-compatible fallback for environments where DB migration is pending
        if (!result.IsSuccess)
        {
            _logger.LogWarning("Falling back to default checkup template. Reason: {Reason}", result.Message);
        }

        var fallbackTemplate = BuildDefaultCheckupTemplate();
        return Ok(FMSResponse<List<CreateCheckupItemDTO>>.Success(fallbackTemplate, "Using default checkup template"));
    }

    /// <summary>
    /// Get checkup template rows for admin management.
    /// </summary>
    [HttpGet("checkup-template/admin")]
    [RequirePermission(Permissions.Vehicle.Edit)]
    public async Task<ActionResult<FMSResponse<List<VehicleTransferCheckupTemplateItemDTO>>>> GetCheckupTemplateAdmin(
        [FromQuery] int? vehicleTypeId = null,
        [FromQuery] int? vehicleModelId = null,
        [FromQuery] bool includeInactive = true)
    {
        var result = await _mediator.Send(new GetVehicleTransferCheckupTemplatesQuery(
            vehicleTypeId,
            vehicleModelId,
            HasGps: null,
            IncludeInactive: includeInactive,
            ApplyVehicleMatching: false));

        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create new checkup template row.
    /// </summary>
    [HttpPost("checkup-template")]
    [RequirePermission(Permissions.Vehicle.Edit)]
    public async Task<ActionResult<FMSResponse<VehicleTransferCheckupTemplateItemDTO>>> CreateCheckupTemplateItem([FromBody] UpsertVehicleTransferCheckupTemplateDTO dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(FMSResponse<VehicleTransferCheckupTemplateItemDTO>.Failed("Invalid model state"));
        }

        var result = await _mediator.Send(new CreateVehicleTransferCheckupTemplateCommand(dto, GetCurrentUserId()));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update existing checkup template row.
    /// </summary>
    [HttpPut("checkup-template/{id}")]
    [RequirePermission(Permissions.Vehicle.Edit)]
    public async Task<ActionResult<FMSResponse<VehicleTransferCheckupTemplateItemDTO>>> UpdateCheckupTemplateItem(int id, [FromBody] UpsertVehicleTransferCheckupTemplateDTO dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(FMSResponse<VehicleTransferCheckupTemplateItemDTO>.Failed("Invalid model state"));
        }

        var result = await _mediator.Send(new UpdateVehicleTransferCheckupTemplateCommand(id, dto, GetCurrentUserId()));
        if (!result.IsSuccess && string.Equals(result.ErrorCode, "NOT_FOUND", System.StringComparison.OrdinalIgnoreCase))
        {
            return NotFound(result);
        }

        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Remove checkup template row (soft-delete).
    /// </summary>
    [HttpDelete("checkup-template/{id}")]
    [RequirePermission(Permissions.Vehicle.Edit)]
    public async Task<ActionResult<FMSResponse<bool>>> DeleteCheckupTemplateItem(int id)
    {
        var result = await _mediator.Send(new DeleteVehicleTransferCheckupTemplateCommand(id, GetCurrentUserId()));
        if (!result.IsSuccess && string.Equals(result.ErrorCode, "NOT_FOUND", System.StringComparison.OrdinalIgnoreCase))
        {
            return NotFound(result);
        }

        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    private static List<CreateCheckupItemDTO> BuildDefaultCheckupTemplate()
    {
        return new List<CreateCheckupItemDTO>
        {
            new() { SerialNo = 1, Description = "SUSPENSION", CheckType = "CHECK" },
            new() { SerialNo = 2, Description = "BRAKES, INDICATORS, GAUGES & FAN BELT", CheckType = "CHECK & TEST" },
            new() { SerialNo = 3, Description = "COOLING SYSTEM, COOLANT LEVEL & LEAKS", CheckType = "CHECK" },
            new() { SerialNo = 4, Description = "ENGINE OIL LEVEL & LEAKS", CheckType = "CHECK" },
            new() { SerialNo = 5, Description = "FUEL SYSTEM WATER SEPARATOR LEAKS BLOCKAGE", CheckType = "CHECK" },
            new() { SerialNo = 6, Description = "FUEL TANK WATER & SEDIMENT", CheckType = "DRAIN" },
            new() { SerialNo = 7, Description = "HOIST STEERING & BRAKE SYSTEM OIL LEVEL LEAKS", CheckType = "CHECK" },
            new() { SerialNo = 8, Description = "TYRES CONDITION (PERCENTAGE) & INFLATION", CheckType = "CHECK %" },
            new() { SerialNo = 9, Description = "ELECTRICAL SYSTEM, STARTER & ALTERNATOR", CheckType = "TEST & CHECK" },
            new() { SerialNo = 10, Description = "GEARBOX & TRANSMISSION OIL LEVEL LEAKS & NOISE", CheckType = "TEST & CHECK" },
            new() { SerialNo = 11, Description = "DIFFERENTIAL, REAR & FRONT AXLES NOISE, OIL LEVEL", CheckType = "TEST & CHECK" },
            new() { SerialNo = 12, Description = "WHEEL NUTS & STUDS TIGHTEN", CheckType = "CHECK" },
            new() { SerialNo = 13, Description = "STEERING CYLINDERS", CheckType = "CHECK & LUBRICATE" },
            new() { SerialNo = 14, Description = "BODY CRACKS OR DAMAGES", CheckType = "CHECK" },
            new() { SerialNo = 15, Description = "ENGINE CRANKCASE, BREATHER BLOWING", CheckType = "CHECK" },
            new() { SerialNo = 16, Description = "AIR PRE-CLEANERS & AIR CLEANERS ELEMENTS", CheckType = "CHECK & CLEAN" },
            new() { SerialNo = 17, Description = "FUEL & OIL CUPS", CheckType = "CHECK" },
            new() { SerialNo = 18, Description = "TOOLS & ACCESSORIES (JACK) WHEEL SPANNER", CheckType = "CHECK" },
            new() { SerialNo = 19, Description = "BUCKETS, PINS, BUSHES, CUTTING EDGES & END BITS WEARING", CheckType = "CHECK %" },
            new() { SerialNo = 20, Description = "UNDER CARRIAGE WEARING (CHAIN LINKS, BUSHES, ROLLER IDLER, SPROCKET, SIGMENT)", CheckType = "CHECK %" },
            new() { SerialNo = 21, Description = "WINDSCREEN & MIRRORS CONDITION", CheckType = "CHECK" },
            new() { SerialNo = 22, Description = "HYDRAULIC PISTON & HOSES LEAKS OR DAMAGES", CheckType = "TEST & CHECK" },
            new() { SerialNo = 23, Description = "RADIATOR BLOCKAGE OR LEAKS", CheckType = "CHECK" },
            new() { SerialNo = 24, Description = "HITCH, CHASSIS & FRAMES WORN", CheckType = "CHECK" },
            new() { SerialNo = 25, Description = "BATTERIES & POLARITY CONDITION", CheckType = "TEST & CHECK" },
            new() { SerialNo = 26, Description = "UPHOLSTERY & CAB ACCESSORIES CONDITION", CheckType = "CHECK" }
        };
    }
}

/// <summary>
/// Request model for updating transfer status
/// </summary>
public class UpdateTransferStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Request model for sending transfer email
/// </summary>
public class SendEmailRequest
{
    public string Recipients { get; set; } = string.Empty;
}

/// <summary>
/// Request model for confirming vehicle receipt at destination
/// </summary>
public class ConfirmReceiptRequest
{
    public string? Remarks { get; set; }
}
