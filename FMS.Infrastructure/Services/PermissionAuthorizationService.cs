using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FMS.Application.CommonInterface;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.Services
{
    /// <summary>
    /// Service for database-driven permission checks with caching
    /// Implements IPermissionAuthorizationService
    /// </summary>
    public class PermissionAuthorizationService : IPermissionAuthorizationService
    {
        private readonly GpsdataContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMemoryCache _cache;
        private readonly ILogger<PermissionAuthorizationService> _logger;
        private const int CACHE_DURATION_MINUTES = 2; // Cache permissions for 15 minutes

        public PermissionAuthorizationService(
            GpsdataContext context,
            IHttpContextAccessor httpContextAccessor,
            IMemoryCache cache,
            ILogger<PermissionAuthorizationService> logger)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _cache = cache;
            _logger = logger;
        }

        public async Task<bool> HasPermissionAsync(string permissionName)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("No authenticated user found for permission check: {PermissionName}", permissionName);
                return false;
            }

            return await UserHasPermissionAsync(userId, permissionName);
        }

        public async Task<bool> UserHasPermissionAsync(string userId, string permissionName)
        {
            try
            {
                var permissions = await GetUserPermissionsAsync(userId);
                return permissions.Contains(permissionName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking permission {PermissionName} for user {UserId}", permissionName, userId);
                return false;
            }
        }

        public async Task<IEnumerable<string>> GetUserPermissionsAsync()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("No authenticated user found for GetUserPermissionsAsync");
                return Enumerable.Empty<string>();
            }

            return await GetUserPermissionsAsync(userId);
        }

        public async Task<IEnumerable<string>> GetUserPermissionsAsync(string userId)
        {
            // Check cache first
            var cacheKey = $"UserPermissions_{userId}";

            if (_cache.TryGetValue(cacheKey, out var cachedPermissionsObject)
                && cachedPermissionsObject is List<string> cachedPermissions)
            {
                _logger.LogDebug("Retrieved permissions from cache for user {UserId}", userId);
                return cachedPermissions;
            }

            try
            {
                // Fetch from database
                var permissions = await _context.Users
                    .Where(u => u.Id == userId)
                    .SelectMany(u => u.UserRoles)
                    .SelectMany(ur => ur.Role.RolePermissions)
                    .Select(rp => rp.Permission.Name)
                    .Distinct()
                    .ToListAsync();

                // Cache the results
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(CACHE_DURATION_MINUTES))
                    .SetPriority(CacheItemPriority.Normal);

                _cache.Set(cacheKey, permissions, cacheOptions);

                _logger.LogInformation("Loaded {Count} permissions for user {UserId}", permissions.Count, userId);
                return permissions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading permissions for user {UserId}", userId);
                return Enumerable.Empty<string>();
            }
        }

        public async Task<bool> HasAnyPermissionAsync(params string[] permissionNames)
        {
            if (permissionNames == null || permissionNames.Length == 0)
            {
                return false;
            }

            var userPermissions = await GetUserPermissionsAsync();
            return permissionNames.Any(p => userPermissions.Contains(p));
        }

        public async Task<bool> HasAllPermissionsAsync(params string[] permissionNames)
        {
            if (permissionNames == null || permissionNames.Length == 0)
            {
                return false;
            }

            var userPermissions = await GetUserPermissionsAsync();
            return permissionNames.All(p => userPermissions.Contains(p));
        }

        public void InvalidateUserPermissions(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return;
            }

            var cacheKey = $"UserPermissions_{userId}";
            _cache.Remove(cacheKey);
            _logger.LogInformation("Invalidated permission cache for user {UserId}", userId);
        }

        public async Task InvalidateRolePermissionsAsync(string roleId)
        {
            if (string.IsNullOrWhiteSpace(roleId))
            {
                return;
            }

            var userIds = await _context.UserRoles
                .Where(ur => ur.RoleId == roleId)
                .Select(ur => ur.UserId)
                .Distinct()
                .ToListAsync();

            foreach (var userId in userIds)
            {
                InvalidateUserPermissions(userId);
            }

            _logger.LogInformation(
                "Invalidated permission cache for {Count} users in role {RoleId}",
                userIds.Count,
                roleId);
        }

        /// <summary>
        /// Get the current user's ID from HttpContext
        /// </summary>
        private string? GetCurrentUserId()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
            {
                return null;
            }

            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("sub")?.Value
                ?? user.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;

            return string.IsNullOrWhiteSpace(userId) ? null : userId;
        }
    }
}
