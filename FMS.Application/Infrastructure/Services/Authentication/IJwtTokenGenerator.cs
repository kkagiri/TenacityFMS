//To:Do learn how to enhance the interface and use it further in the application
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FMS.Application.Infrastructure.Services.Authentication {
    /// <summary>
    /// Interface for JWT token generation and validation
    /// </summary>
    public interface IJwtTokenGenerator {
        /// <summary>
        /// Generates a JWT token for the specified user
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <param name="username">The username</param>
        /// <param name="email">The user's email</param>
        /// <param name="roles">The user's roles</param>
        /// <param name="additionalClaims">Any additional claims to include in the token</param>
        /// <returns>The generated JWT token</returns>
        string GenerateToken (string userId, string username, string email, IEnumerable<string> roles, IDictionary<string, string> additionalClaims = null);

        /// <summary>
        /// Generates a JWT token with permissions loaded from database for the specified user
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <param name="username">The username</param>
        /// <param name="email">The user's email</param>
        /// <param name="roles">The user's roles</param>
        /// <returns>The generated JWT token with permissions</returns>
        Task<string> GenerateTokenWithPermissions (string userId, string username, string email, IEnumerable<string> roles);

        /// <summary>
        /// Generates a refresh token
        /// </summary>
        /// <returns>The generated refresh token</returns>
        string GenerateRefreshToken ();

        /// <summary>
        /// Validates a JWT token
        /// </summary>
        /// <param name="token">The token to validate</param>
        /// <returns>The claims from the token if valid, null otherwise</returns>
        ClaimsPrincipal ValidateToken (string token);

        /// <summary>
        /// Gets the expiration time for a JWT token
        /// </summary>
        /// <param name="token">The token to get the expiration time for</param>
        /// <returns>The expiration time of the token</returns>
        DateTime? GetTokenExpirationTime (string token);
    }
}