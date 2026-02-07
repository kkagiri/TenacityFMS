/**
 * File: IScheduledReportDeliveryService.cs
 * Purpose: Resolves scheduled report metadata and builds deliverable email payload at runtime.
 * Dependencies: Notification, ScheduledReportEmailPayload
 * Last Modified: 2026-02-07
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Domain.Entities.Features.Notifications;
using NotificationEntity = FMS.Domain.Entities.Features.Notifications.Notification;

namespace FMS.Application.Features.Notification.Services
{
    public interface IScheduledReportDeliveryService
    {
        Task<ScheduledReportEmailPayload?> BuildEmailPayloadAsync(
            NotificationEntity notification,
            CancellationToken cancellationToken = default);
    }
}
