/**
 * File: IVehicleTransferNotificationService.cs
 * Purpose: Contract for vehicle transfer lifecycle notification operations.
 * Dependencies: FMSResponse, VehicleTransfer entity
 * Last Modified: 2026-02-27
 *
 * Key Functions:
 * - NotifyApproversAsync: Notify workshop managers / approvers when transfer is submitted
 * - NotifyCreatorApprovedAsync: Notify creator that transfer was approved
 * - NotifyCreatorRejectedAsync: Notify creator that transfer was rejected
 * - NotifyReceiverDispatchedAsync: Notify receiver that vehicle is dispatched
 * - NotifyCreatorReceivedAsync: Notify creator/sender that vehicle was received
 * - NotifyStakeholdersCancelledAsync: Notify all stakeholders that transfer was cancelled
 * - SendInTransitRemindersAsync: Daily reminder for receivers of InTransit transfers
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;

namespace FMS.Application.Features.VehicleTransfer.Services;

public interface IVehicleTransferNotificationService
{
    /// <summary>
    /// N1: Notify approvers (Workshop Manager role / _Approve_VehicleTransfer permission) that a transfer needs approval.
    /// </summary>
    Task<FMSResponse> NotifyApproversAsync(int transferId, string submittedByUserId, CancellationToken ct = default);

    /// <summary>
    /// N2: Notify the transfer creator that the transfer has been approved.
    /// </summary>
    Task<FMSResponse> NotifyCreatorApprovedAsync(int transferId, string approverUserId, CancellationToken ct = default);

    /// <summary>
    /// N3: Notify the transfer creator that the transfer has been rejected.
    /// </summary>
    Task<FMSResponse> NotifyCreatorRejectedAsync(int transferId, string rejectorUserId, string reason, CancellationToken ct = default);

    /// <summary>
    /// N4: Notify the receiver that the vehicle has been dispatched (InTransit).
    /// </summary>
    Task<FMSResponse> NotifyReceiverDispatchedAsync(int transferId, string senderUserId, CancellationToken ct = default);

    /// <summary>
    /// N6: Notify the creator/sender that the vehicle has been received at destination.
    /// </summary>
    Task<FMSResponse> NotifyCreatorReceivedAsync(int transferId, string receiverUserId, CancellationToken ct = default);

    /// <summary>
    /// N7: Notify all stakeholders that the transfer has been cancelled.
    /// </summary>
    Task<FMSResponse> NotifyStakeholdersCancelledAsync(int transferId, string cancelledByUserId, CancellationToken ct = default);

    /// <summary>
    /// N5: Send daily reminders to receivers of all InTransit transfers.
    /// Called by background service.
    /// </summary>
    Task<FMSResponse<int>> SendInTransitRemindersAsync(CancellationToken ct = default);
}
