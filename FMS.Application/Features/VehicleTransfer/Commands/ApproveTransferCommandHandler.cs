/**
 * File: ApproveTransferCommandHandler.cs
 * Purpose: Handles workshop manager approval transition for vehicle transfers.
 * Dependencies: EF Core, AutoMapper, email service
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - Handle(): Changes PendingApproval -> Approved and sends creator notification email.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.VehicleTransfer.DTOs;
using FMS.Application.Features.VehicleTransfer.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public class ApproveTransferCommandHandler : IRequestHandler<ApproveTransferCommand, FMSResponse<VehicleTransferDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly IEmailService _emailService;
    private readonly IVehicleTransferNotificationService _transferNotificationService;
    private readonly ILogger<ApproveTransferCommandHandler> _logger;

    public ApproveTransferCommandHandler(
        GpsdataContext context,
        IMapper mapper,
        IEmailService emailService,
        IVehicleTransferNotificationService transferNotificationService,
        ILogger<ApproveTransferCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _emailService = emailService;
        _transferNotificationService = transferNotificationService;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTransferDTO>> Handle(ApproveTransferCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var transfer = await _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransfer>()
                .Include(t => t.Vehicle)
                .Include(t => t.FromSite)
                .Include(t => t.ToSite)
                .FirstOrDefaultAsync(t => t.TransferId == request.TransferId, cancellationToken);

            if (transfer == null)
            {
                return FMSResponse<VehicleTransferDTO>.Failed($"Transfer with ID {request.TransferId} not found", "NOT_FOUND");
            }

            if (!string.Equals(transfer.Status, "PendingApproval", StringComparison.OrdinalIgnoreCase))
            {
                return FMSResponse<VehicleTransferDTO>.Failed("Only PendingApproval transfers can be approved", "VALIDATION_ERROR");
            }

            var approver = !string.IsNullOrWhiteSpace(request.ApproverName)
                ? request.ApproverName
                : request.UserId;

            transfer.Status = "Approved";
            transfer.ApprovedBy = approver;
            transfer.WorkshopManagerSign = approver;
            transfer.ModifiedBy = request.UserId;
            transfer.DateModified = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(request.CreatorEmail))
            {
                try
                {
                    var subject = $"Transfer Approved: #{transfer.DeliveryNoteNumber ?? transfer.TransferId.ToString()}";
                    var body = BuildApprovalResultEmailBody(transfer, approved: true, reason: null);
                    await _emailService.SendEmailAsync(request.CreatorEmail, subject, body, isHtml: true, cancellationToken: cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Transfer {TransferId} approved but creator email failed", transfer.TransferId);
                }
            }

            // Send in-app/SignalR notification to creator
            try
            {
                await _transferNotificationService.NotifyCreatorApprovedAsync(
                    transfer.TransferId,
                    request.UserId ?? "System",
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Transfer {TransferId} approved but in-app notification to creator failed", transfer.TransferId);
            }

            var response = _mapper.Map<VehicleTransferDTO>(transfer);
            return FMSResponse<VehicleTransferDTO>.Success(response, "Transfer approved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving transfer {TransferId}", request.TransferId);
            return FMSResponse<VehicleTransferDTO>.Failed($"Error approving transfer: {ex.Message}");
        }
    }

    private static string BuildApprovalResultEmailBody(
        Domain.Entities.Features.VehicleManagement.VehicleTransfer transfer,
        bool approved,
        string? reason)
    {
        var outcome = approved ? "approved" : "rejected";
        var reasonLine = string.IsNullOrWhiteSpace(reason)
            ? string.Empty
            : $"<p><strong>Reason:</strong> {reason}</p>";

        return $@"
<html><body style='font-family: Arial, sans-serif;'>
  <h3>Vehicle Transfer {outcome}</h3>
  <p>Transfer #{transfer.DeliveryNoteNumber ?? transfer.TransferId.ToString()} has been {outcome}.</p>
  <p><strong>Vehicle:</strong> {transfer.Vehicle?.HyoungNo}</p>
  <p><strong>From:</strong> {transfer.FromSite?.Name} <strong>To:</strong> {transfer.ToSite?.Name}</p>
  {reasonLine}
</body></html>";
    }
}
