using System.Collections.Generic;
using System.Threading.Tasks;

namespace FMS.Application.CommonInterface
{
    /// <summary>
    /// Service for checking user permissions from database
    /// Reduces JWT token size by fetching permissions on-demand
    /// </summary>
    public interface IPermissionAuthorizationService
    {
        /// <summary>
        /// Check if the current authenticated user has a specific permission
        /// </summary>
        /// <param name="permissionName">Permission name (e.g., "_Read_Vehicle")</param>
        /// <returns>True if user has permission, false otherwise</returns>
        Task<bool> HasPermissionAsync(string permissionName);

        /// <summary>
        /// Check if a specific user has a permission
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="permissionName">Permission name</param>
        /// <returns>True if user has permission, false otherwise</returns>
        Task<bool> UserHasPermissionAsync(string userId, string permissionName);

        /// <summary>
        /// Get all permissions for the current authenticated user (cached)
        /// </summary>
        /// <returns>List of permission names</returns>
        Task<IEnumerable<string>> GetUserPermissionsAsync();

        /// <summary>
        /// Get all permissions for a specific user (cached)
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>List of permission names</returns>
        Task<IEnumerable<string>> GetUserPermissionsAsync(string userId);

        /// <summary>
        /// Check if user has any of the specified permissions (OR logic)
        /// </summary>
        /// <param name="permissionNames">List of permission names</param>
        /// <returns>True if user has at least one permission</returns>
        Task<bool> HasAnyPermissionAsync(params string[] permissionNames);

        /// <summary>
        /// Check if user has all of the specified permissions (AND logic)
        /// </summary>
        /// <param name="permissionNames">List of permission names</param>
        /// <returns>True if user has all permissions</returns>
        Task<bool> HasAllPermissionsAsync(params string[] permissionNames);
    }
}
