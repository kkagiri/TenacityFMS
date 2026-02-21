/**
 * File: IScheduledReportDeliveryService.cs
 * Purpose: Resolves scheduled report metadata and builds deliverable email payload at runtime.
 * Dependencies: Notification, ScheduledReportEmailPayload
 * Last Modified: 2026-02-07
 */
using System;
using System.Collections.Generic;
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

        /// <summary>
        /// Generates a PDF report attachment for an event-triggered notification.
        /// Returns a list of attachments (empty if generation fails).
        /// </summary>
        Task<List<EmailAttachmentDto>> BuildReportAttachmentAsync(
            string reportType,
            string templateName,
            int? tankId,
            int? siteId,
            DateTime startDate,
            DateTime endDate,
            string fileNamePrefix,
            CancellationToken cancellationToken = default);
    }
}
