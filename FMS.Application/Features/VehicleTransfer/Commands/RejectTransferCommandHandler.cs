/**
 * File: RejectTransferCommandHandler.cs
 * Purpose: Handles rejection transition for pending vehicle transfer approvals.
 * Dependencies: EF Core, AutoMapper, email service
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - Handle(): Changes PendingApproval -> Draft, stores rejection reason, emails creator.
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

public class RejectTransferCommandHandler : IRequestHandler<RejectTransferCommand, FMSResponse<VehicleTransferDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly IEmailService _emailService;
    private readonly IVehicleTransferNotificationService _transferNotificationService;
    private readonly ILogger<RejectTransferCommandHandler> _logger;

    public RejectTransferCommandHandler(
        GpsdataContext context,
        IMapper mapper,
        IEmailService emailService,
        IVehicleTransferNotificationService transferNotificationService,
        ILogger<RejectTransferCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _emailService = emailService;
        _transferNotificationService = transferNotificationService;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTransferDTO>> Handle(RejectTransferCommand request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.RejectionReason))
            {
                return FMSResponse<VehicleTransferDTO>.Failed("Rejection reason is required", "VALIDATION_ERROR");
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

            if (!string.Equals(transfer.Status, "PendingApproval", StringComparison.OrdinalIgnoreCase))
            {
                return FMSResponse<VehicleTransferDTO>.Failed("Only PendingApproval transfers can be rejected", "VALIDATION_ERROR");
            }

            transfer.Status = "Draft";
            transfer.Remarks = AppendRejectionNote(transfer.Remarks, request.RejectionReason, request.UserId);
            transfer.ModifiedBy = request.UserId;
            transfer.DateModified = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(request.CreatorEmail))
            {
                try
                {
                    var subject = $"Transfer Rejected: #{transfer.DeliveryNoteNumber ?? transfer.TransferId.ToString()}";
                    var body = BuildRejectionEmailBody(transfer, request.RejectionReason);
                    await _emailService.SendEmailAsync(request.CreatorEmail, subject, body, isHtml: true, cancellationToken: cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Transfer {TransferId} rejected but creator email failed", transfer.TransferId);
                }
            }

            // Send in-app/SignalR notification to creator
            try
            {
                await _transferNotificationService.NotifyCreatorRejectedAsync(
                    transfer.TransferId,
                    request.UserId ?? "System",
                    request.RejectionReason,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Transfer {TransferId} rejected but in-app notification to creator failed", transfer.TransferId);
            }

            var response = _mapper.Map<VehicleTransferDTO>(transfer);
            return FMSResponse<VehicleTransferDTO>.Success(response, "Transfer rejected and returned to draft");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting transfer {TransferId}", request.TransferId);
            return FMSResponse<VehicleTransferDTO>.Failed($"Error rejecting transfer: {ex.Message}");
        }
    }

    private static string AppendRejectionNote(string? existingRemarks, string reason, string? userId)
    {
        var actor = string.IsNullOrWhiteSpace(userId) ? "Reviewer" : userId;
        var note = $"[Rejected {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC by {actor}] {reason}";
        if (string.IsNullOrWhiteSpace(existingRemarks))
        {
            return note;
        }

        return $"{existingRemarks}{Environment.NewLine}{note}";
    }

    private static string BuildRejectionEmailBody(
        Domain.Entities.Features.VehicleManagement.VehicleTransfer transfer,
        string reason)
    {
        return $@"
<html><body style='font-family: Arial, sans-serif;'>
  <h3>Vehicle Transfer Rejected</h3>
  <p>Transfer #{transfer.DeliveryNoteNumber ?? transfer.TransferId.ToString()} was rejected and moved back to Draft.</p>
  <p><strong>Reason:</strong> {reason}</p>
  <p><strong>Vehicle:</strong> {transfer.Vehicle?.HyoungNo}</p>
  <p><strong>From:</strong> {transfer.FromSite?.Name} <strong>To:</strong> {transfer.ToSite?.Name}</p>
</body></html>";
    }
}
