using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace FMS.Application.Services
{
    /// <summary>
    /// Service for managing system users
    /// </summary>
    public interface ISystemUserService
    {
        Task<FMSResponse<string>> EnsureSystemUserExistsAsync(CancellationToken cancellationToken = default);
        Task<FMSResponse<string>> EnsureSystemAdministratorExistsAsync(CancellationToken cancellationToken = default);
        Task<FMSResponse<string>> GetSystemUserIdAsync(CancellationToken cancellationToken = default);
        Task<FMSResponse<string>> GetSystemAdministratorIdAsync(CancellationToken cancellationToken = default);
        Task<FMSResponse<User>> GetSystemUserAsync(CancellationToken cancellationToken = default);
        Task<FMSResponse<User>> GetSystemAdministratorAsync(CancellationToken cancellationToken = default);
    }

    public class SystemUserService : ISystemUserService
    {
        private readonly GpsdataContext _context;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<SystemUserService> _logger;

        public SystemUserService(
            GpsdataContext context,
            UserManager<User> userManager,
            ILogger<SystemUserService> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<FMSResponse<string>> EnsureSystemUserExistsAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var existingUser = await _userManager.FindByIdAsync(SystemConstants.SystemUser.UserId);
                if (existingUser != null)
                {
                    return FMSResponse<string>.Success(existingUser.Id, "System user already exists");
                }

                // Check by username as fallback
                existingUser = await _userManager.FindByNameAsync(SystemConstants.SystemUser.UserName);
                if (existingUser != null)
                {
                    return FMSResponse<string>.Success(existingUser.Id, "System user found by username");
                }

                // Create system user
                var systemUser = new User
                {
                    Id = SystemConstants.SystemUser.UserId,
                    UserName = SystemConstants.SystemUser.UserName,
                    NormalizedUserName = SystemConstants.SystemUser.UserName.ToUpper(),
                    Email = SystemConstants.SystemUser.Email,
                    NormalizedEmail = SystemConstants.SystemUser.Email.ToUpper(),
                    EmailConfirmed = true,
                    PhoneNumberConfirmed = true,
                    TwoFactorEnabled = false,
                    LockoutEnabled = false,
                    AccessFailedCount = 0,
                    IsDeleted = false
                };

                var result = await _userManager.CreateAsync(systemUser, "SystemUser@123!");
                if (result.Succeeded)
                {
                    _logger.LogInformation("System user created successfully with ID: {UserId}", systemUser.Id);
                    return FMSResponse<string>.Success(systemUser.Id, "System user created successfully");
                }

                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogError("Failed to create system user: {Errors}", errors);
                return FMSResponse<string>.Failed($"Failed to create system user: {errors}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error ensuring system user exists");
                return FMSResponse<string>.Failed($"Error ensuring system user exists: {ex.Message}");
            }
        }

        public async Task<FMSResponse<string>> EnsureSystemAdministratorExistsAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var existingUser = await _userManager.FindByIdAsync(SystemConstants.SystemAdministrator.UserId);
                if (existingUser != null)
                {
                    return FMSResponse<string>.Success(existingUser.Id, "System administrator already exists");
                }

                // Check by username as fallback
                existingUser = await _userManager.FindByNameAsync(SystemConstants.SystemAdministrator.UserName);
                if (existingUser != null)
                {
                    return FMSResponse<string>.Success(existingUser.Id, "System administrator found by username");
                }

                // Create system administrator
                var systemAdmin = new User
                {
                    Id = SystemConstants.SystemAdministrator.UserId,
                    UserName = SystemConstants.SystemAdministrator.UserName,
                    NormalizedUserName = SystemConstants.SystemAdministrator.UserName.ToUpper(),
                    Email = SystemConstants.SystemAdministrator.Email,
                    NormalizedEmail = SystemConstants.SystemAdministrator.Email.ToUpper(),
                    EmailConfirmed = true,
                    PhoneNumberConfirmed = true,
                    TwoFactorEnabled = false,
                    LockoutEnabled = false,
                    AccessFailedCount = 0,
                    IsDeleted = false
                };

                var result = await _userManager.CreateAsync(systemAdmin, "SystemAdmin@123!");
                if (result.Succeeded)
                {
                    // Try to assign Administrator role if it exists
                    try
                    {
                        var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Administrator", cancellationToken);
                        if (adminRole != null)
                        {
                            await _userManager.AddToRoleAsync(systemAdmin, "Administrator");
                        }
                    }
                    catch (Exception roleEx)
                    {
                        _logger.LogWarning(roleEx, "Could not assign Administrator role to system administrator");
                    }

                    _logger.LogInformation("System administrator created successfully with ID: {UserId}", systemAdmin.Id);
                    return FMSResponse<string>.Success(systemAdmin.Id, "System administrator created successfully");
                }

                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogError("Failed to create system administrator: {Errors}", errors);
                return FMSResponse<string>.Failed($"Failed to create system administrator: {errors}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error ensuring system administrator exists");
                return FMSResponse<string>.Failed($"Error ensuring system administrator exists: {ex.Message}");
            }
        }

        public async Task<FMSResponse<string>> GetSystemUserIdAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var ensureResult = await EnsureSystemUserExistsAsync(cancellationToken);
                if (ensureResult.IsSuccess)
                {
                    return FMSResponse<string>.Success(ensureResult.Data, "System user ID retrieved");
                }

                return FMSResponse<string>.Failed(ensureResult.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system user ID");
                return FMSResponse<string>.Failed($"Error getting system user ID: {ex.Message}");
            }
        }

        public async Task<FMSResponse<string>> GetSystemAdministratorIdAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var ensureResult = await EnsureSystemAdministratorExistsAsync(cancellationToken);
                if (ensureResult.IsSuccess)
                {
                    return FMSResponse<string>.Success(ensureResult.Data, "System administrator ID retrieved");
                }

                return FMSResponse<string>.Failed(ensureResult.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system administrator ID");
                return FMSResponse<string>.Failed($"Error getting system administrator ID: {ex.Message}");
            }
        }

        public async Task<FMSResponse<User>> GetSystemUserAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var userIdResult = await GetSystemUserIdAsync(cancellationToken);
                if (!userIdResult.IsSuccess)
                {
                    return FMSResponse<User>.Failed(userIdResult.Message);
                }

                var user = await _userManager.FindByIdAsync(userIdResult.Data);
                if (user == null)
                {
                    return FMSResponse<User>.Failed("System user not found after creation");
                }

                return FMSResponse<User>.Success(user, "System user retrieved");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system user");
                return FMSResponse<User>.Failed($"Error getting system user: {ex.Message}");
            }
        }

        public async Task<FMSResponse<User>> GetSystemAdministratorAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var userIdResult = await GetSystemAdministratorIdAsync(cancellationToken);
                if (!userIdResult.IsSuccess)
                {
                    return FMSResponse<User>.Failed(userIdResult.Message);
                }

                var user = await _userManager.FindByIdAsync(userIdResult.Data);
                if (user == null)
                {
                    return FMSResponse<User>.Failed("System administrator not found after creation");
                }

                return FMSResponse<User>.Success(user, "System administrator retrieved");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system administrator");
                return FMSResponse<User>.Failed($"Error getting system administrator: {ex.Message}");
            }
        }
    }
}