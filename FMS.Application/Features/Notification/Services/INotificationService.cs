using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;

namespace FMS.Application.Features.Notification.Services
{
    /// <summary>
    /// Core notification service for creating, sending, and managing notifications
    /// </summary>
    public interface INotificationService
    {
        Task<FMSResponse<int>> CreateNotificationAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default);
        Task<FMSResponse> SendNotificationAsync(int notificationId, CancellationToken cancellationToken = default);
        Task<FMSResponse> SendScheduledNotificationsAsync(CancellationToken cancellationToken = default);
        Task<FMSResponse> MarkAsReadAsync(int notificationId, string userId, CancellationToken cancellationToken = default);
        Task<FMSResponse<int>> MarkAllAsReadAsync(string userId, CancellationToken cancellationToken = default);
        Task<FMSResponse> AcknowledgeNotificationAsync(int notificationId, string userId, CancellationToken cancellationToken = default);
        Task<FMSResponse<List<NotificationDto>>> GetNotificationsAsync(GetNotificationsRequest request, CancellationToken cancellationToken = default);
        Task<FMSResponse> CreateAlarmNotificationAsync(CreateAlarmNotificationRequest request, CancellationToken cancellationToken = default);
        Task<FMSResponse> CreateIssueTrackerNotificationAsync(int issueTrackerId, string triggeredBy, CancellationToken cancellationToken = default);
        Task<FMSResponse<NotificationStatisticsDto>> GetNotificationStatisticsAsync(GetNotificationStatisticsRequest request, CancellationToken cancellationToken = default);
        Task<FMSResponse<List<NotificationPolicyDto>>> GetNotificationPoliciesAsync(CancellationToken cancellationToken = default);
        Task<FMSResponse<NotificationPolicyDto>> GetNotificationPolicyAsync(int policyId, CancellationToken cancellationToken = default);
        Task<FMSResponse<int>> CreateNotificationPolicyAsync(CreateNotificationPolicyRequestDTO request, CancellationToken cancellationToken = default);
        Task<FMSResponse> UpdateNotificationPolicyAsync(int policyId, UpdateNotificationPolicyRequestDTO request, CancellationToken cancellationToken = default);
        Task<FMSResponse<List<object>>> GetAlertRecordsAsync(DateTime? fromDate, DateTime? toDate, int skip, int take, CancellationToken cancellationToken = default);
        Task<FMSResponse> SendTestNotificationAsync(TestNotificationRequest request, CancellationToken cancellationToken = default);

        // Convenience wrappers for device-specific alarm notifications (delegate to CreateAlarmNotificationAsync)
        Task<FMSResponse> CreatePTSAlarmNotificationAsync(CreateAlarmNotificationRequest request, CancellationToken cancellationToken = default);
        Task<FMSResponse> CreatePumpAlarmNotificationAsync(CreateAlarmNotificationRequest request, CancellationToken cancellationToken = default);
        Task<FMSResponse> CreateProbeAlarmNotificationAsync(CreateAlarmNotificationRequest request, CancellationToken cancellationToken = default);
    }
}
