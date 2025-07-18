using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Notification.DTOs;
using FMS.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services {
    /// <summary>
    /// Static helper class for system user operations
    /// </summary>
    public static class SystemUserHelper {
        /// <summary>
        /// Gets the system user ID, using constants as fallback
        /// </summary>
        public static string GetSystemUserId () {
            return SystemConstants.SystemUser.UserId;
        }

        /// <summary>
        /// Gets the system administrator ID, using constants as fallback
        /// </summary>
        public static string GetSystemAdministratorId () {
            return SystemConstants.SystemAdministrator.UserId;
        }

        /// <summary>
        /// Gets the system user ID with service provider for database lookup
        /// </summary>
        public static async Task<string> GetSystemUserIdAsync (IServiceProvider serviceProvider, CancellationToken cancellationToken = default) {
            try {
                var systemUserService = serviceProvider.GetService<ISystemUserService> ();
                if (systemUserService != null) {
                    var result = await systemUserService.GetSystemUserIdAsync (cancellationToken);
                    if (result.IsSuccess) {
                        return result.Data;
                    }
                }
            } catch {
                // Fall back to constant if service is not available
            }

            return GetSystemUserId ();
        }

        /// <summary>
        /// Gets the system administrator ID with service provider for database lookup
        /// </summary>
        public static async Task<string> GetSystemAdministratorIdAsync (IServiceProvider serviceProvider, CancellationToken cancellationToken = default) {
            try {
                var systemUserService = serviceProvider.GetService<ISystemUserService> ();
                if (systemUserService != null) {
                    var result = await systemUserService.GetSystemAdministratorIdAsync (cancellationToken);
                    if (result.IsSuccess) {
                        return result.Data;
                    }
                }
            } catch {
                // Fall back to constant if service is not available
            }

            return GetSystemAdministratorId ();
        }

        /// <summary>
        /// Creates system user notification recipients
        /// </summary>
        public static List<CreateNotificationRecipientRequest> CreateSystemNotificationRecipients (
            bool includeSystemAdmin = true,
            bool includeEmail = true,
            bool includeSms = false) {
            var recipients = new List<CreateNotificationRecipientRequest> ();

            // Add system user
            var deliveryMethods = new List<string> { SystemConstants.Notifications.SystemDeliveryMethod };
            if (includeEmail) deliveryMethods.Add ("Email");
            if (includeSms) deliveryMethods.Add ("SMS");

            recipients.Add (new CreateNotificationRecipientRequest {
                UserId = GetSystemUserId (),
                    DeliveryMethods = deliveryMethods
            });

            // Add system administrator if requested
            if (includeSystemAdmin) {
                recipients.Add (new CreateNotificationRecipientRequest {
                    UserId = GetSystemAdministratorId (),
                        DeliveryMethods = deliveryMethods
                });
            }

            return recipients;
        }
    }

    /// <summary>
    /// Extension methods for system user operations
    /// </summary>
    public static class SystemUserExtensions {
        /// <summary>
        /// Ensures system users exist in the database
        /// </summary>
        public static async Task<bool> EnsureSystemUsersExistAsync (this IServiceProvider serviceProvider) {
            try {
                var systemUserService = serviceProvider.GetService<ISystemUserService> ();
                if (systemUserService == null) {
                    return false;
                }

                var systemUserResult = await systemUserService.EnsureSystemUserExistsAsync ();
                var systemAdminResult = await systemUserService.EnsureSystemAdministratorExistsAsync ();

                return systemUserResult.IsSuccess && systemAdminResult.IsSuccess;
            } catch {
                return false;
            }
        }
    }
}