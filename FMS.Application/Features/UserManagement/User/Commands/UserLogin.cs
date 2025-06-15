using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Infrastructure.Services.Authentication;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Memory;

namespace FMS.Application.Command.DatabaseCommand.UserManagement {
    public record LoginCommand (string Username, string Password) : IRequest<string>;

    public class LoginCommandHandler : IRequestHandler<LoginCommand, string> {
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
        public async Task<string> Handle (LoginCommand request, CancellationToken cancellationToken) {
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

            // Get user roles
            var userRoles = await _userManager.GetRolesAsync (user);

            // Create token using the new JWT token generator with permissions included
            return await _jwtTokenGenerator.GenerateTokenWithPermissions (
                user.Id,
                user.UserName,
                user.Email ?? string.Empty,
                userRoles);
        }
    }
}