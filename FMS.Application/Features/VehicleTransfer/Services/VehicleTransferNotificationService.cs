/**
 * File: VehicleTransferNotificationService.cs
 * Purpose: Sends in-app (SignalR) + email notifications for all vehicle transfer lifecycle events.
 * Dependencies: INotificationService, INotificationRecipientResolver, GpsdataContext
 * Last Modified: 2026-02-27
 *
 * Key Functions:
 * - NotifyApproversAsync: Resolves approvers by role/permission, sends approval request
 * - NotifyCreatorApprovedAsync: Sends approval confirmation to creator
 * - NotifyCreatorRejectedAsync: Sends rejection notice to creator
 * - NotifyReceiverDispatchedAsync: Sends dispatch notification to receiver user
 * - NotifyCreatorReceivedAsync: Sends receipt confirmation to sender/creator
 * - NotifyStakeholdersCancelledAsync: Sends cancellation to all stakeholders
 * - SendInTransitRemindersAsync: Batch daily reminders for InTransit transfers
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.Notification.Services.RecipientResolver;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTransfer.Services;

public class VehicleTransferNotificationService : IVehicleTransferNotificationService
{
    private readonly INotificationService _notificationService;
    private readonly INotificationRecipientResolver _recipientResolver;
    private readonly GpsdataContext _context;
    private readonly ILogger<VehicleTransferNotificationService> _logger;

    private const int CategoryId = (int)WellKnownCategories.VehicleTransfer;
    private const string TriggerSourcePrefix = "VehicleTransfer";

    public VehicleTransferNotificationService(
        INotificationService notificationService,
        INotificationRecipientResolver recipientResolver,
        GpsdataContext context,
        ILogger<VehicleTransferNotificationService> logger)
    {
        _notificationService = notificationService;
        _recipientResolver = recipientResolver;
        _context = context;
        _logger = logger;
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // N1 â€” Submit for Approval
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public async Task<FMSResponse> NotifyApproversAsync(int transferId, string submittedByUserId, CancellationToken ct = default)
    {
        try
        {
            var transfer = await LoadTransferAsync(transferId, ct);
            if (transfer == null)
                return FMSResponse.FailedResponse($"Transfer {transferId} not found");

            // Resolve approvers: users with Workshop Manager role at the from-site
            var approverIds = new List<string>();

            // 1. If a specific approver was assigned, use that
            if (!string.IsNullOrWhiteSpace(transfer.ApproverUserId))
            {
                approverIds.Add(transfer.ApproverUserId);
            }

            // 2. Find users with Workshop / Workshop Manager role at the site
            try
            {
                var workshopUsers = await _recipientResolver.GetUsersByRoleAsync("Workshop Manager", transfer.FromSiteId, ct);
                if (workshopUsers?.Any() == true)
                    approverIds.AddRange(workshopUsers);

                // Also try "Workshop" role
                var workshopUsers2 = await _recipientResolver.GetUsersByRoleAsync("Workshop", transfer.FromSiteId, ct);
                if (workshopUsers2?.Any() == true)
                    approverIds.AddRange(workshopUsers2);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error resolving workshop manager users for site {SiteId}", transfer.FromSiteId);
            }

            // Deduplicate and exclude the submitter
            approverIds = approverIds
                .Where(id => !string.IsNullOrWhiteSpace(id) && !string.Equals(id, submittedByUserId, StringComparison.OrdinalIgnoreCase))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (approverIds.Count == 0)
            {
                _logger.LogWarning("No approvers found for transfer {TransferId} at site {SiteId}. Notification not sent.", transferId, transfer.FromSiteId);
                return FMSResponse.FailedResponse("No approvers found for this site");
            }

            var vehicleLabel = transfer.Vehicle?.HyoungNo ?? $"Vehicle #{transfer.VehicleId}";
            var fromSite = transfer.FromSite?.Name ?? $"Site #{transfer.FromSiteId}";
            var toSite = transfer.ToSite?.Name ?? $"Site #{transfer.ToSiteId}";

            var request = new CreateNotificationRequest
            {
                Type = NotificationType.Alert,
                CategoryId = CategoryId,
                Priority = NotificationPriority.High,
                Title = $"Approval Required: Vehicle Transfer #{transfer.DeliveryNoteNumber ?? transferId.ToString()}",
                Message = $"Vehicle {vehicleLabel} transfer from {fromSite} to {toSite} requires your approval.",
                Data = new
                {
                    TransferId = transferId,
                    VehicleId = transfer.VehicleId,
                    VehicleLabel = vehicleLabel,
                    FromSite = fromSite,
                    ToSite = toSite,
                    TransferDate = transfer.TransferDate,
                    DeliveryNoteNumber = transfer.DeliveryNoteNumber,
                    Action = "ApprovalRequired",
                    Link = $"/vehicles/transfers/{transferId}/review"
                },
                TriggerSource = $"{TriggerSourcePrefix}.SubmitForApproval",
                TriggeredBy = submittedByUserId,
                VehicleId = transfer.VehicleId,
                SiteId = transfer.FromSiteId,
                Recipients = approverIds.Select(id => new NotificationRecipientDto
                {
                    UserId = id,
                    DeliveryMethods = new List<string> { "System", "Email" },
                    ResolvedFrom = "VehicleTransferApprover"
                }).ToList(),
                DisableFallbackAllUsers = true
            };

            var result = await _notificationService.CreateNotificationAsync(request, ct);
            if (result.IsSuccess)
            {
                _logger.LogInformation("Approval notification sent for transfer {TransferId} to {Count} approvers", transferId, approverIds.Count);
            }

            return FMSResponse.SuccessResponse("Approval notification sent");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending approval notification for transfer {TransferId}", transferId);
            return FMSResponse.FailedResponse($"Error sending notification: {ex.Message}");
        }
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // N2 â€” Approved
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public async Task<FMSResponse> NotifyCreatorApprovedAsync(int transferId, string approverUserId, CancellationToken ct = default)
    {
        try
        {
            var transfer = await LoadTransferAsync(transferId, ct);
            if (transfer == null)
                return FMSResponse.FailedResponse($"Transfer {transferId} not found");

            if (string.IsNullOrWhiteSpace(transfer.CreatedBy))
            {
                _logger.LogWarning("Transfer {TransferId} has no CreatedBy â€” cannot notify creator", transferId);
                return FMSResponse.FailedResponse("Transfer creator not found");
            }

            var vehicleLabel = transfer.Vehicle?.HyoungNo ?? $"Vehicle #{transfer.VehicleId}";

            var request = new CreateNotificationRequest
            {
                Type = NotificationType.Info,
                CategoryId = CategoryId,
                Priority = NotificationPriority.High,
                Title = $"Transfer Approved: {vehicleLabel}",
                Message = $"Your vehicle transfer #{transfer.DeliveryNoteNumber ?? transferId.ToString()} has been approved. Please release the vehicle for dispatch.",
                Data = new
                {
                    TransferId = transferId,
                    VehicleId = transfer.VehicleId,
                    VehicleLabel = vehicleLabel,
                    ApprovedBy = transfer.ApprovedBy,
                    Action = "Approved",
                    Link = $"/vehicles/transfers/{transferId}"
                },
                TriggerSource = $"{TriggerSourcePrefix}.Approved",
                TriggeredBy = approverUserId,
                VehicleId = transfer.VehicleId,
                SiteId = transfer.FromSiteId,
                Recipients = new List<NotificationRecipientDto>
                {
                    new()
                    {
                        UserId = transfer.CreatedBy,
                        DeliveryMethods = new List<string> { "System", "Email" },
                        ResolvedFrom = "VehicleTransferCreator"
                    }
                },
                DisableFallbackAllUsers = true
            };

            await _notificationService.CreateNotificationAsync(request, ct);
            _logger.LogInformation("Approval notification sent to creator for transfer {TransferId}", transferId);
            return FMSResponse.SuccessResponse("Creator notified of approval");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending approval notification for transfer {TransferId}", transferId);
            return FMSResponse.FailedResponse($"Error: {ex.Message}");
        }
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // N3 â€” Rejected
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public async Task<FMSResponse> NotifyCreatorRejectedAsync(int transferId, string rejectorUserId, string reason, CancellationToken ct = default)
    {
        try
        {
            var transfer = await LoadTransferAsync(transferId, ct);
            if (transfer == null)
                return FMSResponse.FailedResponse($"Transfer {transferId} not found");

            if (string.IsNullOrWhiteSpace(transfer.CreatedBy))
                return FMSResponse.FailedResponse("Transfer creator not found");

            var vehicleLabel = transfer.Vehicle?.HyoungNo ?? $"Vehicle #{transfer.VehicleId}";

            var request = new CreateNotificationRequest
            {
                Type = NotificationType.Warning,
                CategoryId = CategoryId,
                Priority = NotificationPriority.Medium,
                Title = $"Transfer Rejected: {vehicleLabel}",
                Message = $"Your vehicle transfer #{transfer.DeliveryNoteNumber ?? transferId.ToString()} was rejected. Reason: {reason}",
                Data = new
                {
                    TransferId = transferId,
                    VehicleId = transfer.VehicleId,
                    VehicleLabel = vehicleLabel,
                    RejectionReason = reason,
                    Action = "Rejected",
                    Link = $"/vehicles/transfers/{transferId}"
                },
                TriggerSource = $"{TriggerSourcePrefix}.Rejected",
                TriggeredBy = rejectorUserId,
                VehicleId = transfer.VehicleId,
                SiteId = transfer.FromSiteId,
                Recipients = new List<NotificationRecipientDto>
                {
                    new()
                    {
                        UserId = transfer.CreatedBy,
                        DeliveryMethods = new List<string> { "System", "Email" },
                        ResolvedFrom = "VehicleTransferCreator"
                    }
                },
                DisableFallbackAllUsers = true
            };

            await _notificationService.CreateNotificationAsync(request, ct);
            _logger.LogInformation("Rejection notification sent to creator for transfer {TransferId}", transferId);
            return FMSResponse.SuccessResponse("Creator notified of rejection");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending rejection notification for transfer {TransferId}", transferId);
            return FMSResponse.FailedResponse($"Error: {ex.Message}");
        }
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // N4 â€” Dispatched (InTransit)
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public async Task<FMSResponse> NotifyReceiverDispatchedAsync(int transferId, string senderUserId, CancellationToken ct = default)
    {
        try
        {
            var transfer = await LoadTransferAsync(transferId, ct);
            if (transfer == null)
                return FMSResponse.FailedResponse($"Transfer {transferId} not found");

            if (string.IsNullOrWhiteSpace(transfer.ReceiverUserId))
            {
                _logger.LogWarning("Transfer {TransferId} has no ReceiverUserId â€” cannot notify receiver", transferId);
                return FMSResponse.FailedResponse("Transfer receiver user not assigned");
            }

            var vehicleLabel = transfer.Vehicle?.HyoungNo ?? $"Vehicle #{transfer.VehicleId}";
            var fromSite = transfer.FromSite?.Name ?? $"Site #{transfer.FromSiteId}";
            var toSite = transfer.ToSite?.Name ?? $"Site #{transfer.ToSiteId}";

            var request = new CreateNotificationRequest
            {
                Type = NotificationType.Alert,
                CategoryId = CategoryId,
                Priority = NotificationPriority.High,
                Title = $"Vehicle Dispatched: {vehicleLabel}",
                Message = $"Vehicle {vehicleLabel} has been dispatched from {fromSite} to {toSite}. Please confirm receipt upon arrival.",
                Data = new
                {
                    TransferId = transferId,
                    VehicleId = transfer.VehicleId,
                    VehicleLabel = vehicleLabel,
                    FromSite = fromSite,
                    ToSite = toSite,
                    DispatchedAt = transfer.DispatchedAt,
                    DriverName = transfer.DriverName,
                    DriverPhone = transfer.DriverPhone,
                    Action = "Dispatched",
                    Link = $"/vehicles/transfers/{transferId}/receive"
                },
                TriggerSource = $"{TriggerSourcePrefix}.Dispatched",
                TriggeredBy = senderUserId,
                VehicleId = transfer.VehicleId,
                SiteId = transfer.ToSiteId,
                Recipients = new List<NotificationRecipientDto>
                {
                    new()
                    {
                        UserId = transfer.ReceiverUserId,
                        DeliveryMethods = new List<string> { "System", "Email", "Push" },
                        ResolvedFrom = "VehicleTransferReceiver"
                    }
                },
                DisableFallbackAllUsers = true
            };

            await _notificationService.CreateNotificationAsync(request, ct);
            _logger.LogInformation("Dispatch notification sent to receiver {ReceiverUserId} for transfer {TransferId}", transfer.ReceiverUserId, transferId);
            return FMSResponse.SuccessResponse("Receiver notified of dispatch");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending dispatch notification for transfer {TransferId}", transferId);
            return FMSResponse.FailedResponse($"Error: {ex.Message}");
        }
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // N6 â€” Received (Completed)
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public async Task<FMSResponse> NotifyCreatorReceivedAsync(int transferId, string receiverUserId, CancellationToken ct = default)
    {
        try
        {
            var transfer = await LoadTransferAsync(transferId, ct);
            if (transfer == null)
                return FMSResponse.FailedResponse($"Transfer {transferId} not found");

            if (string.IsNullOrWhiteSpace(transfer.CreatedBy))
                return FMSResponse.FailedResponse("Transfer creator not found");

            var vehicleLabel = transfer.Vehicle?.HyoungNo ?? $"Vehicle #{transfer.VehicleId}";
            var toSite = transfer.ToSite?.Name ?? $"Site #{transfer.ToSiteId}";

            var request = new CreateNotificationRequest
            {
                Type = NotificationType.Info,
                CategoryId = CategoryId,
                Priority = NotificationPriority.High,
                Title = $"Vehicle Received: {vehicleLabel}",
                Message = $"Vehicle {vehicleLabel} has been received at {toSite}. Transfer #{transfer.DeliveryNoteNumber ?? transferId.ToString()} is now complete.",
                Data = new
                {
                    TransferId = transferId,
                    VehicleId = transfer.VehicleId,
                    VehicleLabel = vehicleLabel,
                    ToSite = toSite,
                    ReceivedAt = transfer.ReceivedAt,
                    Action = "Received",
                    Link = $"/vehicles/transfers/{transferId}"
                },
                TriggerSource = $"{TriggerSourcePrefix}.Received",
                TriggeredBy = receiverUserId,
                VehicleId = transfer.VehicleId,
                SiteId = transfer.ToSiteId,
                Recipients = new List<NotificationRecipientDto>
                {
                    new()
                    {
                        UserId = transfer.CreatedBy,
                        DeliveryMethods = new List<string> { "System", "Email" },
                        ResolvedFrom = "VehicleTransferCreator"
                    }
                },
                DisableFallbackAllUsers = true
            };

            await _notificationService.CreateNotificationAsync(request, ct);
            _logger.LogInformation("Receipt notification sent to creator for transfer {TransferId}", transferId);
            return FMSResponse.SuccessResponse("Creator notified of receipt");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending receipt notification for transfer {TransferId}", transferId);
            return FMSResponse.FailedResponse($"Error: {ex.Message}");
        }
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // N7 â€” Cancelled
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public async Task<FMSResponse> NotifyStakeholdersCancelledAsync(int transferId, string cancelledByUserId, CancellationToken ct = default)
    {
        try
        {
            var transfer = await LoadTransferAsync(transferId, ct);
            if (transfer == null)
                return FMSResponse.FailedResponse($"Transfer {transferId} not found");

            var vehicleLabel = transfer.Vehicle?.HyoungNo ?? $"Vehicle #{transfer.VehicleId}";

            // Collect all stakeholders except the person who cancelled
            var recipientIds = new List<string>();
            if (!string.IsNullOrWhiteSpace(transfer.CreatedBy))
                recipientIds.Add(transfer.CreatedBy);
            if (!string.IsNullOrWhiteSpace(transfer.ApproverUserId))
                recipientIds.Add(transfer.ApproverUserId);
            if (!string.IsNullOrWhiteSpace(transfer.ReceiverUserId))
                recipientIds.Add(transfer.ReceiverUserId);

            recipientIds = recipientIds
                .Where(id => !string.Equals(id, cancelledByUserId, StringComparison.OrdinalIgnoreCase))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (recipientIds.Count == 0)
            {
                _logger.LogInformation("No stakeholders to notify for cancelled transfer {TransferId}", transferId);
                return FMSResponse.SuccessResponse("No stakeholders to notify");
            }

            var request = new CreateNotificationRequest
            {
                Type = NotificationType.Warning,
                CategoryId = CategoryId,
                Priority = NotificationPriority.Medium,
                Title = $"Transfer Cancelled: {vehicleLabel}",
                Message = $"Vehicle transfer #{transfer.DeliveryNoteNumber ?? transferId.ToString()} for {vehicleLabel} has been cancelled.",
                Data = new
                {
                    TransferId = transferId,
                    VehicleId = transfer.VehicleId,
                    VehicleLabel = vehicleLabel,
                    Action = "Cancelled",
                    Link = $"/vehicles/transfers/{transferId}"
                },
                TriggerSource = $"{TriggerSourcePrefix}.Cancelled",
                TriggeredBy = cancelledByUserId,
                VehicleId = transfer.VehicleId,
                SiteId = transfer.FromSiteId,
                Recipients = recipientIds.Select(id => new NotificationRecipientDto
                {
                    UserId = id,
                    DeliveryMethods = new List<string> { "System", "Email" },
                    ResolvedFrom = "VehicleTransferStakeholder"
                }).ToList(),
                DisableFallbackAllUsers = true
            };

            await _notificationService.CreateNotificationAsync(request, ct);
            _logger.LogInformation("Cancellation notification sent to {Count} stakeholders for transfer {TransferId}", recipientIds.Count, transferId);
            return FMSResponse.SuccessResponse("Stakeholders notified of cancellation");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending cancellation notification for transfer {TransferId}", transferId);
            return FMSResponse.FailedResponse($"Error: {ex.Message}");
        }
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // N5 â€” Daily InTransit Reminders (Background Job)
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public async Task<FMSResponse<int>> SendInTransitRemindersAsync(CancellationToken ct = default)
    {
        try
        {
            var cutoff = DateTime.UtcNow.AddHours(-24);

            var inTransitTransfers = await _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransfer>()
                .Include(t => t.Vehicle)
                .Include(t => t.FromSite)
                .Include(t => t.ToSite)
                .Where(t => t.Status == "InTransit"
                    && !string.IsNullOrEmpty(t.ReceiverUserId)
                    && (t.LastReminderSentAt == null || t.LastReminderSentAt < cutoff))
                .ToListAsync(ct);

            var sent = 0;

            foreach (var transfer in inTransitTransfers)
            {
                try
                {
                    var vehicleLabel = transfer.Vehicle?.HyoungNo ?? $"Vehicle #{transfer.VehicleId}";
                    var fromSite = transfer.FromSite?.Name ?? $"Site #{transfer.FromSiteId}";
                    var toSite = transfer.ToSite?.Name ?? $"Site #{transfer.ToSiteId}";
                    var daysInTransit = transfer.DispatchedAt.HasValue
                        ? (int)(DateTime.UtcNow - transfer.DispatchedAt.Value).TotalDays
                        : 0;

                    var request = new CreateNotificationRequest
                    {
                        Type = NotificationType.Warning,
                        CategoryId = CategoryId,
                        Priority = NotificationPriority.Medium,
                        Title = $"Reminder: Confirm Receipt of {vehicleLabel}",
                        Message = $"Vehicle {vehicleLabel} was dispatched from {fromSite} to {toSite} {daysInTransit} day(s) ago. Please confirm receipt.",
                        Data = new
                        {
                            TransferId = transfer.TransferId,
                            VehicleId = transfer.VehicleId,
                            VehicleLabel = vehicleLabel,
                            DaysInTransit = daysInTransit,
                            ReminderNumber = transfer.ReminderCount + 1,
                            Action = "InTransitReminder",
                            Link = $"/vehicles/transfers/{transfer.TransferId}/receive"
                        },
                        TriggerSource = $"{TriggerSourcePrefix}.InTransitReminder",
                        TriggeredBy = "System",
                        VehicleId = transfer.VehicleId,
                        SiteId = transfer.ToSiteId,
                        Recipients = new List<NotificationRecipientDto>
                        {
                            new()
                            {
                                UserId = transfer.ReceiverUserId!,
                                DeliveryMethods = new List<string> { "System", "Push" },
                                ResolvedFrom = "VehicleTransferReceiver"
                            }
                        },
                        DisableFallbackAllUsers = true
                    };

                    var result = await _notificationService.CreateNotificationAsync(request, ct);
                    if (result.IsSuccess)
                    {
                        transfer.LastReminderSentAt = DateTime.UtcNow;
                        transfer.ReminderCount += 1;
                        sent++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error sending InTransit reminder for transfer {TransferId}", transfer.TransferId);
                }
            }

            if (sent > 0)
            {
                await _context.SaveChangesAsync(ct);
            }

            _logger.LogInformation("Sent {Count} InTransit reminders out of {Total} eligible transfers", sent, inTransitTransfers.Count);
            return FMSResponse<int>.Success(sent, $"Sent {sent} reminders");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending InTransit reminders");
            return FMSResponse<int>.Failed($"Error: {ex.Message}");
        }
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Helpers
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private async Task<Domain.Entities.Features.VehicleManagement.VehicleTransfer?> LoadTransferAsync(int transferId, CancellationToken ct)
    {
        return await _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransfer>()
            .Include(t => t.Vehicle)
            .Include(t => t.FromSite)
            .Include(t => t.ToSite)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TransferId == transferId, ct);
    }
}
