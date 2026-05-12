using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using Noti = FMS.Domain.Entities.Features.Notifications;

namespace FMS.Application.Features.Notification.Services.Businessfunction {
    /// <summary>
    /// Service for managing business function notification groups
    /// Allows internal business functions to target specific groups without requiring NotificationPolicy
    /// </summary>
    public interface IBusinessFunctionNotificationService {
        /// <summary>
        /// Get notification groups for a specific business function trigger source
        /// </summary>
        Task<List<Noti.NotificationGroup>> GetGroupsForTriggerSourceAsync (
            string triggerSource,
            int? siteId = null,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Resolve recipients from business function groups
        /// </summary>
        Task<List<NotificationRecipientDto>> ResolveRecipientsFromTriggerSourceAsync (
            string triggerSource,
            int? siteId = null,
            string? minimumSeverity = null,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Create default business function groups for a site
        /// </summary>
        Task<FMSResponse> CreateDefaultGroupsForSiteAsync (
            int siteId,
            string createdBy,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Map a trigger source to a notification group
        /// </summary>
        Task<FMSResponse> MapTriggerSourceToGroupAsync (
            string triggerSource,
            int groupId,
            int? siteId = null,
            string? allowedDeliveryMethods = null,
            string? minimumSeverity = null,
            string createdBy = "System",
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Remove mapping between trigger source and group
        /// </summary>
        Task<FMSResponse> UnmapTriggerSourceFromGroupAsync (
            string triggerSource,
            int groupId,
            int? siteId = null,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Get all business function mappings for management
        /// </summary>
        Task<FMSResponse<List<BusinessFunctionGroupMappingDto>>> GetBusinessFunctionMappingsAsync (
            int? siteId = null,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Seed default business function mappings for the system
        /// </summary>
        Task<FMSResponse> SeedDefaultBusinessFunctionMappingsAsync (
            string createdBy = "System",
            CancellationToken cancellationToken = default);
    }
}