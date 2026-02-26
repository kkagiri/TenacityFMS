using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Infrastructure.Services.Authentication;
using FMS.Application.Dtos.UserManagement;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Command.DatabaseCommand.UserManagement {
    // Updated to return LoginResponseDto instead of just string token
    public record LoginCommand (string Username, string Password) : IRequest<LoginResponseDto>;

    // DTO for login response
    public class LoginResponseDto {
        public string Token { get; set; }
        public string RefreshToken { get; set; }
        public UserDetailDto User { get; set; }
    }

    public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponseDto> {
        private readonly UserManager<User> _userManager;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly GpsdataContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMemoryCache _memoryCache;

        public LoginCommandHandler (UserManager<User> userManager, IMemoryCache memoryCache, IJwtTokenGenerator jwtTokenGenerator, GpsdataContext context, IHttpContextAccessor httpContextAccessor) {
            _userManager = userManager;
            _jwtTokenGenerator = jwtTokenGenerator;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _memoryCache = memoryCache;
        }
        public async Task<LoginResponseDto> Handle (LoginCommand request, CancellationToken cancellationToken) {
            const int MaxLoginAttempts = 5;
            const int LockoutDuration = 45; // in seconds

            string cacheKey = $"Login-Attempts-{request.Username}";
            string cacheTimeKey = $"login-time-{request.Username}";

            // Attempt to get the user
            var user = await _userManager.FindByNameAsync (request.Username);
            if (user == null) {
                throw new UnauthorizedAccessException ("User not found.");
            }

            // Check if the account is locked
            if (_memoryCache.TryGetValue (cacheKey, out int loginAttempts) && loginAttempts >= MaxLoginAttempts) {
                if (_memoryCache.TryGetValue (cacheTimeKey, out DateTime lockoutTime)) {
                    var timeElapsed = DateTime.Now - lockoutTime;
                    if (timeElapsed.TotalSeconds < LockoutDuration) {
                        throw new UnauthorizedAccessException ("Account is locked out. Please try again later.");
                    }
                }

                // Reset the login attempts since the lockout duration has passed
                _memoryCache.Remove (cacheKey);
                _memoryCache.Remove (cacheTimeKey);
            }

            // Check password validity
            bool isPasswordValid = await _userManager.CheckPasswordAsync (user, request.Password);
            if (!isPasswordValid) {
                // Log the failed login
                loginAttempts++;
                _memoryCache.Set (cacheKey, loginAttempts, TimeSpan.FromMinutes (5));
                _memoryCache.Set (cacheTimeKey, DateTime.Now, TimeSpan.FromMinutes (5));

                var LoginActivity = new Loginactivity {
                    UserId = user.Id,
                    Timestamp = DateTime.UtcNow,
                    IpAddress = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress.ToString (),
                    IsSuccessful = false
                };

                _context.Loginactivities.Add (LoginActivity);
                await _context.SaveChangesAsync (cancellationToken);

                // Check if the max attempts are exceeded
                if (loginAttempts >= MaxLoginAttempts) {
                    throw new UnauthorizedAccessException ("Max login attempts exceeded. Please wait or contact an administrator.");
                }

                throw new UnauthorizedAccessException ("Username or password is invalid.");
            }

            // Login successful, reset the cache
            _memoryCache.Remove (cacheKey);
            _memoryCache.Remove (cacheTimeKey);

            // Log successful login activity
            var successfulLoginActivity = new Loginactivity {
                UserId = user.Id,
                Timestamp = DateTime.UtcNow,
                IpAddress = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress.ToString (),
                IsSuccessful = true
            };
            _context.Loginactivities.Add (successfulLoginActivity);
            await _context.SaveChangesAsync (cancellationToken);

            // Get user roles
            var userRoles = await _userManager.GetRolesAsync (user);

            // Create access token (JWT) with permissions
            var token = await _jwtTokenGenerator.GenerateTokenWithPermissions (
                user.Id,
                user.UserName,
                user.Email ?? string.Empty,
                userRoles);

            // Generate refresh token
            var refreshToken = _jwtTokenGenerator.GenerateRefreshToken ();
            var refreshTokenExpiry = DateTime.UtcNow.AddDays (30); // 30 days validity

            // Get client IP address
            var ipAddress = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress.ToString ();

            // Revoke all existing refresh tokens for this user (optional - for single-device login)
            // Comment out if you want to allow multiple devices
            /*
            var existingTokens = await _context.RefreshTokens
                .Where (rt => rt.UserId == user.Id && rt.IsActive)
                .ToListAsync (cancellationToken);
            foreach (var existingToken in existingTokens) {
                existingToken.IsRevoked = true;
                existingToken.RevokedAt = DateTime.UtcNow;
                existingToken.RevocationReason = "New login - previous token invalidated";
            }
            */

            // Store refresh token in database
            var refreshTokenEntity = new FMS.Domain.Entities.Features.UserManagement.RefreshToken {
                Token = refreshToken,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = refreshTokenExpiry,
                IsRevoked = false,
                CreatedByIp = ipAddress,
                LastUsedAt = DateTime.UtcNow,
                LastUsedByIp = ipAddress
            };

            _context.RefreshTokens.Add (refreshTokenEntity);
            await _context.SaveChangesAsync (cancellationToken);

            // Get master tag information
            var masterTag = user.MasterRFIDTag.HasValue ?
                await _context.FuelTags.FirstOrDefaultAsync (t => t.Id == user.MasterRFIDTag, cancellationToken) : null;

            // Build user detail DTO (matching GetUserByIdQuery output)
            var userDetail = new UserDetailDto {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                UserName = user.UserName,
                Email = user.Email,
                IsDeleted = user.IsDeleted ?? false,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                MasterRFIDTag = user.MasterRFIDTag ?? 0,

                // Master Tag Information
                HasMasterTag = user.MasterRFIDTag.HasValue,
                MasterTagName = masterTag?.Name,
                MasterTagIsEnabled = masterTag?.IsEnabled,

                // Location Validation Settings
                BypassLocationValidation = user.BypassLocationValidation,

                // Include roles
                Roles = userRoles.ToList ()
            };

            // Return access token, refresh token, and user data
            return new LoginResponseDto {
                Token = token,
                RefreshToken = refreshToken,
                User = userDetail
            };
        }
    }
}