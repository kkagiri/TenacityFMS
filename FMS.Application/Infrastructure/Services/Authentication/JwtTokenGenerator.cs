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

namespace FMS.Application.Infrastructure.Services.Authentication {
    /// <summary>
    /// Implementation of the JWT token generator
    /// </summary>
    public class JwtTokenGenerator : IJwtTokenGenerator {
        private readonly IConfiguration _configuration;
        private readonly IMediator _mediator;
        private readonly JwtSettings _jwtSettings;

        public JwtTokenGenerator (IConfiguration configuration, IMediator mediator = null, IOptions<JwtSettings> jwtSettings = null) {
            _configuration = configuration;
            _mediator = mediator;
            _jwtSettings = jwtSettings?.Value;
        }

        /// <inheritdoc/>
        public async Task<string> GenerateTokenWithPermissions (string userId, string username, string email, IEnumerable<string> roles) {
            // Only used when mediator is provided for loading permissions
            if (_mediator == null) {
                throw new InvalidOperationException ("Cannot generate token with permissions without mediator service");
            }

            // Get user permissions from database
            var userPermissions = await _mediator.Send (new GetUserPermissionsQuery (userId));

            // Use the permissions as additional claims
            var additionalClaims = new Dictionary<string, string> ();
            foreach (var permission in userPermissions) {
                additionalClaims.Add ($"permission_{permission}", permission);
            }

            return GenerateToken (userId, username, email, roles, additionalClaims);
        }

        /// <inheritdoc/>
        public string GenerateToken (string userId, string username, string email, IEnumerable<string> roles, IDictionary<string, string> additionalClaims = null) {
            // Determine which configuration to use (JwtSettings from options or direct from Configuration)
            string secretKey = _jwtSettings?.SecretKey ?? _configuration["Jwt:Key"];
            string issuer = _jwtSettings?.Issuer ?? _configuration["Jwt:Issuer"];
            string audience = _jwtSettings?.Audience ?? _configuration["Jwt:Audience"];
            string expiryConfig = _jwtSettings != null ?
                _jwtSettings.ExpireDays.ToString () :
                _configuration["Jwt:ExpiryInMinutes"];

            // Create security key using the secret
            var securityKey = new SymmetricSecurityKey (Encoding.UTF8.GetBytes (secretKey));
            var credentials = new SigningCredentials (securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim> {
                new Claim (JwtRegisteredClaimNames.Sub, userId),
                new Claim (ClaimTypes.NameIdentifier, userId),
                new Claim (JwtRegisteredClaimNames.Name, username),
                new Claim (JwtRegisteredClaimNames.Email, email ?? string.Empty),
                new Claim (JwtRegisteredClaimNames.Jti, Guid.NewGuid ().ToString ()),
                new Claim (JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds ().ToString ())
            };

            // Add roles
            foreach (var role in roles) {
                claims.Add (new Claim (ClaimTypes.Role, role));
            }

            // Add additional claims if any
            if (additionalClaims != null) {
                foreach (var claim in additionalClaims) {
                    claims.Add (new Claim (claim.Key, claim.Value));
                }
            }

            // If permissions need to be added directly as special claim
            if (additionalClaims != null && additionalClaims.Any (c => c.Key.StartsWith ("permission_"))) {
                var permissions = additionalClaims
                    .Where (c => c.Key.StartsWith ("permission_"))
                    .Select (c => c.Value);

                // Add permissions as a specific "permissions" claim for backward compatibility
                foreach (var permission in permissions) {
                    claims.Add (new Claim ("permissions", permission));
                }
            }

            // Determine if using days or minutes for expiry
            double expiryValue = double.Parse (expiryConfig);
            TimeSpan expiry;

            if (_jwtSettings != null) {
                // If using JwtSettings, use days
                expiry = TimeSpan.FromDays (expiryValue);
            } else {
                // If using direct configuration, use minutes
                expiry = TimeSpan.FromMinutes (expiryValue);
            }

            var token = new JwtSecurityToken (
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.Add (expiry),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler ().WriteToken (token);
        }

        /// <inheritdoc/>
        public string GenerateRefreshToken () {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create ();
            rng.GetBytes (randomNumber);
            return Convert.ToBase64String (randomNumber);
        }

        /// <inheritdoc/>
        public ClaimsPrincipal ValidateToken (string token) {
            string secretKey = _jwtSettings?.SecretKey ?? _configuration["Jwt:Key"];
            string issuer = _jwtSettings?.Issuer ?? _configuration["Jwt:Issuer"];
            string audience = _jwtSettings?.Audience ?? _configuration["Jwt:Audience"];

            var tokenValidationParameters = new TokenValidationParameters {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = issuer,
                ValidAudience = audience,
                IssuerSigningKey = new SymmetricSecurityKey (Encoding.UTF8.GetBytes (secretKey))
            };

            var tokenHandler = new JwtSecurityTokenHandler ();
            var principal = tokenHandler.ValidateToken (token, tokenValidationParameters, out SecurityToken securityToken);

            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals (SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase)) {
                return null;
            }

            return principal;
        }

        /// <inheritdoc/>
        public DateTime? GetTokenExpirationTime (string token) {
            var tokenHandler = new JwtSecurityTokenHandler ();
            if (!tokenHandler.CanReadToken (token)) {
                return null;
            }

            var jwtToken = tokenHandler.ReadJwtToken (token);
            var expiryClaim = jwtToken.Claims.FirstOrDefault (c => c.Type == JwtRegisteredClaimNames.Exp);
            if (expiryClaim == null) {
                return null;
            }

            var expirySeconds = long.Parse (expiryClaim.Value);
            var expiryDate = DateTimeOffset.FromUnixTimeSeconds (expirySeconds).UtcDateTime;
            return expiryDate;
        }
    }
}