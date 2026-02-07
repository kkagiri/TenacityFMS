/**
 * File: JwtTokenGenerator.cs
 * Purpose: Generates and validates JWT access tokens for authenticated users.
 * Dependencies: IConfiguration, MediatR, JwtSettings, System.IdentityModel.Tokens.Jwt.
 * Last Modified: 2026-02-07
 *
 * Key Methods:
 * - GenerateTokenWithPermissions(): Loads user permissions and embeds them in JWT.
 * - GenerateToken(): Builds signed JWT with identity, roles, and additional claims.
 * - ValidateToken(): Validates JWT signature/issuer/audience/lifetime.
 */
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions;
using FMS.Domain.Entities.Auth;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FMS.Application.Infrastructure.Services.Authentication
{
    /// <summary>
    /// Implementation of the JWT token generator
    /// </summary>
    public class JwtTokenGenerator : IJwtTokenGenerator
    {
        private readonly IConfiguration _configuration;
        private readonly IMediator _mediator;
        private readonly JwtSettings _jwtSettings;

        public JwtTokenGenerator(IConfiguration configuration, IMediator mediator = null, IOptions<JwtSettings> jwtSettings = null)
        {
            _configuration = configuration;
            _mediator = mediator;
            _jwtSettings = jwtSettings?.Value;
        }

        /// <inheritdoc/>
        /// <remarks>
        /// Permissions are no longer embedded in the JWT to keep tokens lean.
        /// Frontend fetches permissions via GET /api/v1/Permission/me after login.
        /// Backend checks permissions via DB (PermissionAuthorizationService) on each request.
        /// </remarks>
        public Task<string> GenerateTokenWithPermissions(string userId, string username, string email, IEnumerable<string> roles)
        {
            // Permissions are no longer embedded in JWT.
            // Frontend fetches them via GET /api/v1/Permission/me
            // Backend authorizes via PermissionAuthorizationService (DB + 15-min cache)
            return Task.FromResult(GenerateToken(userId, username, email, roles));
        }

        /// <inheritdoc/>
        public string GenerateToken(string userId, string username, string email, IEnumerable<string> roles, IDictionary<string, string> additionalClaims = null)
        {
            // Determine which configuration to use (JwtSettings from options or direct from Configuration)
            string secretKey = _jwtSettings?.SecretKey ?? _configuration["Jwt:Key"];
            string issuer = _jwtSettings?.Issuer ?? _configuration["Jwt:Issuer"];
            string audience = _jwtSettings?.Audience ?? _configuration["Jwt:Audience"];
            string expiryConfig = _jwtSettings != null ?
                _jwtSettings.ExpireDays.ToString() :
                _configuration["Jwt:ExpiryInMinutes"];

            // Create security key using the secret
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim> {
                new Claim (JwtRegisteredClaimNames.Sub, userId),
                new Claim (ClaimTypes.NameIdentifier, userId),
                new Claim (JwtRegisteredClaimNames.Name, username),
                new Claim (JwtRegisteredClaimNames.Email, email ?? string.Empty),
                new Claim (JwtRegisteredClaimNames.Jti, Guid.NewGuid ().ToString ()),
                new Claim (JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds ().ToString ())
            };

            // Add roles
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var extractedPermissions = new List<string>();

            // Add additional claims if any.
            // NOTE: "permission_*" entries are treated as internal carrier keys and are NOT emitted as JWT claims.
            if (additionalClaims != null)
            {
                foreach (var claim in additionalClaims)
                {
                    if (claim.Key.StartsWith("permission_", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!string.IsNullOrWhiteSpace(claim.Value))
                        {
                            extractedPermissions.Add(claim.Value);
                        }
                        continue;
                    }

                    claims.Add(new Claim(claim.Key, claim.Value));
                }
            }

            // Emit permissions only once using the standard "permissions" claim key.
            var existingPermissionClaims = new HashSet<string>(
                claims.Where(claim => claim.Type == "permissions").Select(claim => claim.Value),
                StringComparer.OrdinalIgnoreCase
            );

            foreach (var permission in extractedPermissions.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                if (existingPermissionClaims.Add(permission))
                {
                    claims.Add(new Claim("permissions", permission));
                }
            }

            // Determine if using days or minutes for expiry
            double expiryValue = double.Parse(expiryConfig);
            TimeSpan expiry;

            if (_jwtSettings != null)
            {
                // If using JwtSettings, use days
                expiry = TimeSpan.FromDays(expiryValue);
            }
            else
            {
                // If using direct configuration, use minutes
                expiry = TimeSpan.FromMinutes(expiryValue);
            }

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.Add(expiry),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <inheritdoc/>
        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        /// <inheritdoc/>
        public ClaimsPrincipal ValidateToken(string token)
        {
            string secretKey = _jwtSettings?.SecretKey ?? _configuration["Jwt:Key"];
            string issuer = _jwtSettings?.Issuer ?? _configuration["Jwt:Issuer"];
            string audience = _jwtSettings?.Audience ?? _configuration["Jwt:Audience"];

            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = issuer,
                ValidAudience = audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);

            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }

        /// <inheritdoc/>
        public DateTime? GetTokenExpirationTime(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            if (!tokenHandler.CanReadToken(token))
            {
                return null;
            }

            var jwtToken = tokenHandler.ReadJwtToken(token);
            var expiryClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Exp);
            if (expiryClaim == null)
            {
                return null;
            }

            var expirySeconds = long.Parse(expiryClaim.Value);
            var expiryDate = DateTimeOffset.FromUnixTimeSeconds(expirySeconds).UtcDateTime;
            return expiryDate;
        }
    }
}
