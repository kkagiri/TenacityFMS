/**
 * File: SubmitForApprovalCommand.cs
 * Purpose: Command contract for moving a draft transfer to pending approval stage.
 * Dependencies: FMSResponse, VehicleTransferDTO
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - SubmitForApprovalCommand: Carries transfer id, caller metadata, and approval recipient details.
 */
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using MediatR;
using AutoMapper;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.VehicleTransfer.Services;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System.Threading;
using System;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record SubmitForApprovalCommand(
    int TransferId,
    string? UserId,
    string WorkshopManagerEmail,
    string? WorkshopManagerName,
    string? ApprovalBaseUrl
) : IRequest<FMSResponse<VehicleTransferDTO>>;

public class SubmitForApprovalCommandHandler : IRequestHandler<SubmitForApprovalCommand, FMSResponse<VehicleTransferDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly IEmailService _emailService;
    private readonly IVehicleTransferNotificationService _transferNotificationService;
    private readonly ILogger<SubmitForApprovalCommandHandler> _logger;

    public SubmitForApprovalCommandHandler(
        GpsdataContext context,
        IMapper mapper,
        IEmailService emailService,
        IVehicleTransferNotificationService transferNotificationService,
        ILogger<SubmitForApprovalCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _emailService = emailService;
        _transferNotificationService = transferNotificationService;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTransferDTO>> Handle(SubmitForApprovalCommand request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.WorkshopManagerEmail))
            {
                return FMSResponse<VehicleTransferDTO>.Failed("Workshop manager email is required", "VALIDATION_ERROR");
            }

            var transfer = await _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransfer>()
                .Include(t => t.Vehicle)
                .Include(t => t.FromSite)
                .Include(t => t.ToSite)
                .FirstOrDefaultAsync(t => t.TransferId == request.TransferId, cancellationToken);

            if (transfer == null)
            {
                return FMSResponse<VehicleTransferDTO>.Failed($"Transfer with ID {request.TransferId} not found", "NOT_FOUND");
            }

            if (!string.Equals(transfer.Status, "Draft", StringComparison.OrdinalIgnoreCase))
            {
                return FMSResponse<VehicleTransferDTO>.Failed("Only Draft transfers can be submitted for approval", "VALIDATION_ERROR");
            }

            transfer.Status = "PendingApproval";
            transfer.WorkshopManagerSign = !string.IsNullOrWhiteSpace(request.WorkshopManagerName)
                ? request.WorkshopManagerName
                : request.WorkshopManagerEmail;
            transfer.ModifiedBy = request.UserId;
            transfer.DateModified = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var approvalLink = BuildApprovalLink(request.ApprovalBaseUrl, transfer.TransferId);
            var subject = $"Approval Required: Vehicle Transfer #{transfer.DeliveryNoteNumber ?? transfer.TransferId.ToString()}";
            var body = BuildApprovalEmailBody(transfer, approvalLink);

            try
            {
                await _emailService.SendEmailAsync(
                    request.WorkshopManagerEmail,
                    subject,
                    body,
                    isHtml: true,
                    cancellationToken: cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Transfer {TransferId} moved to PendingApproval but approval email failed", transfer.TransferId);
            }

            // Send in-app/SignalR notifications to approvers
            try
            {
                await _transferNotificationService.NotifyApproversAsync(
                    transfer.TransferId,
                    request.UserId ?? "System",
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Transfer {TransferId} submitted but in-app notification to approvers failed", transfer.TransferId);
            }

            var response = _mapper.Map<VehicleTransferDTO>(transfer);
            return FMSResponse<VehicleTransferDTO>.Success(response, "Transfer submitted for approval");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting transfer {TransferId} for approval", request.TransferId);
            return FMSResponse<VehicleTransferDTO>.Failed($"Error submitting for approval: {ex.Message}");
        }
    }

    private static string BuildApprovalLink(string? baseUrl, int transferId)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return $"/vehicles/transfers/{transferId}/review";
        }

        return $"{baseUrl.TrimEnd('/')}/vehicles/transfers/{transferId}/review";
    }

    private static string BuildApprovalEmailBody(Domain.Entities.Features.VehicleManagement.VehicleTransfer transfer, string approvalLink)
    {
        return $@"
<html><body style='font-family: Arial, sans-serif;'>
  <h3>Vehicle Transfer Approval Request</h3>
  <p>A transfer has been submitted and requires your approval.</p>
  <table style='border-collapse: collapse;'>
    <tr><td style='padding:4px 8px;'><strong>Transfer ID:</strong></td><td style='padding:4px 8px;'>{transfer.TransferId}</td></tr>
    <tr><td style='padding:4px 8px;'><strong>Delivery Note:</strong></td><td style='padding:4px 8px;'>{transfer.DeliveryNoteNumber}</td></tr>
    <tr><td style='padding:4px 8px;'><strong>Vehicle:</strong></td><td style='padding:4px 8px;'>{transfer.Vehicle?.HyoungNo}</td></tr>
    <tr><td style='padding:4px 8px;'><strong>From Site:</strong></td><td style='padding:4px 8px;'>{transfer.FromSite?.Name}</td></tr>
    <tr><td style='padding:4px 8px;'><strong>To Site:</strong></td><td style='padding:4px 8px;'>{transfer.ToSite?.Name}</td></tr>
    <tr><td style='padding:4px 8px;'><strong>Date:</strong></td><td style='padding:4px 8px;'>{transfer.TransferDate:yyyy-MM-dd HH:mm}</td></tr>
  </table>
  <p style='margin-top:16px;'>
    <a href='{approvalLink}' style='background:#2563eb;color:white;padding:10px 14px;text-decoration:none;border-radius:4px;'>Review Transfer</a>
  </p>
  <p>Please sign in before approving.</p>
</body></html>";
    }
}
