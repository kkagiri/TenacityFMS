/**
 * File: UserController.cs
 * Purpose: Handles user management endpoints including authentication and token refresh.
 * Dependencies: IMediator, GpsdataContext, IJwtTokenGenerator, UserManager<User>
 * Last Modified: 2026-02-04
 *
 * Key Functions:
 * - RefreshToken(): Rotates refresh tokens and issues a new access token.
 * - CreateUser(): Creates a new user via CQRS command.
 */
using System.Configuration;
using System.Security.Claims;
using System.Text;
using FMS.Application.Command.DatabaseCommand.UserManagement;
using FMS.Application.Abstractions.Identity;
using FMS.Application.Common; // FMSResponse
using FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries;
using FMS.Application.Features.UserManagement.User.Queries;
using FMS.Application.Features.UserManagement.User.Commands;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FMS.Domain.Entities;
using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;
using FMS.Application.Infrastructure.Services.Authentication;
using FMS.Domain.Entities.Features.MultiTenancy;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class UserController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly GpsdataContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly UserManager<User> _userManager;

    public UserController(
        IMediator mediator,
        GpsdataContext context,
        IJwtTokenGenerator jwtTokenGenerator,
        UserManager<User> userManager)
    {
        _mediator = mediator;
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
        _userManager = userManager;
    }

    private bool TryGetCurrentUserId(out string userId)
    {
        userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? string.Empty;

        return !string.IsNullOrWhiteSpace(userId);
    }

    [HttpPost]
    [RequirePermission(Permissions.Admin.Users)]
    public async Task<IActionResult> CreateUser([FromBody] UserCreateCommand command)
    {
        if (!ModelState.IsValid)
        {
            // Convert model state errors to our response format
            var allErrors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(FMSResponse<string>.ValidationFailed(allErrors));
        }
        var response = await _mediator.Send(command);

        if (response.IsSuccess)
        {
            return Ok(response);
        }

        // Map error type to status code (expandable)
        return response.ErrorType
        switch
        {
            ErrorType.Validation => BadRequest(response),
            ErrorType.SystemError => StatusCode(StatusCodes.Status500InternalServerError, response),
            _ => BadRequest(response)
        };
    }

    //Get:api/User/{id}
    [HttpGet("{id}")]
    [RequirePermission(Permissions.Admin.Users)]
    public async Task<IActionResult> GetUser(string id)
    {
        var command = new GetUserByIdQuery(id);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    //Get user list:api/User
    [HttpGet]
    [RequirePermission(Permissions.Admin.Users)]
    public async Task<IActionResult> GetUserList()
    {
        var command = new GetUserListQuery();
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Quick search for users by username or email
    /// </summary>
    /// <param name="searchTerm">Search term (min 2 characters)</param>
    /// <param name="limit">Maximum results to return (default 10, max 100)</param>
    /// <returns>List of matching users</returns>
    [HttpGet("quick-search")]
    [RequirePermission(Permissions.Admin.Users)]
    public async Task<IActionResult> QuickSearchUsers(
        [FromQuery] string searchTerm, [FromQuery] int limit = 10)
    {
        var query = new SearchUserQuery
        {
            SearchTerm = searchTerm,
            Limit = limit
        };
        var result = await _mediator.Send(query);

        if (result.IsSuccess)
        {
            return Ok(result);
        }

        return BadRequest(result);
    }

    //Delete:api/User/{id}
    [HttpDelete("{id}")]
    [RequirePermission(Permissions.Admin.Users)]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var command = new UserPermanentDeleteCommand(id);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPut("softuserdelete/{id}")]
    [RequirePermission(Permissions.Admin.Users)]
    public async Task<IActionResult> SoftDeleteUser(string id)
    {
        var command = new UserDeleteCommand(id);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPut("restoreuser/{id}")]
    [RequirePermission(Permissions.Admin.Users)]
    public async Task<IActionResult> RestoreUser(string id)
    {
        var command = new RestoreUserCommand(id);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    //Update:api/User/{id}
    [HttpPut("{id}")]
    [RequirePermission(Permissions.Admin.Users)]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UserUpdateCommand command)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        command = command with { UserId = id };
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("Login")]
    [AllowAnonymous] // Override class-level authorization for login
    public async Task<ActionResult> Login(LoginCommand command)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(FMSResponse<object>.ValidationFailed(errors));
            }

            // Now returns LoginResponseDto with token, refresh token, and user
            var loginResponse = await _mediator.Send(command);

            // Return token, refresh token, and user object for frontend
            var responseData = new
            {
                Token = loginResponse.Token,
                RefreshToken = loginResponse.RefreshToken,
                User = loginResponse.User
            };
            return Ok(FMSResponse<object>.Success(responseData, "Login successful"));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(FMSResponse<object>.Failed(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,
                FMSResponse<object>.SystemError($"An error occurred during login: {ex.Message}"));
        }
    }

    [HttpPost("confirm-email")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserId) || string.IsNullOrWhiteSpace(request.Token))
        {
            return BadRequest(FMSResponse<bool>.ValidationFailed(new List<string> { "User ID and token are required." }));
        }

        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
        {
            return NotFound(FMSResponse<bool>.Failed("User not found."));
        }

        if (user.EmailConfirmed)
        {
            return Ok(FMSResponse<bool>.Success(true, "Email address is already confirmed."));
        }

        string decodedToken;
        try
        {
            decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Token));
        }
        catch (Exception)
        {
            return BadRequest(FMSResponse<bool>.Failed("Invalid confirmation token."));
        }

        var result = await _userManager.ConfirmEmailAsync(user, decodedToken);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(FMSResponse<bool>.ValidationFailed(errors));
        }

        return Ok(FMSResponse<bool>.Success(true, "Email confirmed successfully. You can now sign in."));
    }

    [HttpPost("{id}/resend-confirmation-email")]
    [RequirePermission(Permissions.Admin.Users)]
    public async Task<IActionResult> ResendConfirmationEmail(string id)
    {
        var result = await _mediator.Send(new ResendUserConfirmationEmailCommand(id));

        if (result.IsSuccess)
        {
            return Ok(result);
        }

        return result.ErrorType switch
        {
            ErrorType.Validation => BadRequest(result),
            ErrorType.NotFound => NotFound(result),
            ErrorType.SystemError => StatusCode(StatusCodes.Status500InternalServerError, result),
            _ => BadRequest(result)
        };
    }

    [HttpGet("details")]
    public async Task<IActionResult> GetUserDetails()
    {
        if (!TryGetCurrentUserId(out var userID))
        {
            return Unauthorized();
        }

        var command = new GetUserByIdQuery(userID);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Validates the current JWT token and returns user data if valid
    /// Used for session restoration when app loads with existing token
    /// </summary>
    [HttpPost("validate-token")]
    public async Task<IActionResult> ValidateToken()
    {
        try
        {
            // If we get here, JWT middleware already validated the token
            if (!TryGetCurrentUserId(out var userID))
            {
                return Unauthorized(FMSResponse<object>.Failed("Invalid token - no user ID found"));
            }

            // Load fresh user data
            var command = new GetUserByIdQuery(userID);
            var userDetail = await _mediator.Send(command);

            if (userDetail == null)
            {
                return Unauthorized(FMSResponse<object>.Failed("User not found"));
            }

            var responseData = new
            {
                IsValid = true,
                User = userDetail
            };

            return Ok(FMSResponse<object>.Success(responseData, "Token is valid"));
        }
        catch (Exception ex)
        {
            return Unauthorized(FMSResponse<object>.Failed($"Token validation failed: {ex.Message}"));
        }
    }

    /// <summary>
    /// Refreshes an access token using a valid refresh token
    /// Returns new access token and refresh token (token rotation)
    /// </summary>
    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.RefreshToken))
            {
                return BadRequest(FMSResponse<object>.Failed("Refresh token is required"));
            }

            // Find the refresh token in database
            var refreshToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

            if (refreshToken == null)
            {
                return Unauthorized(FMSResponse<object>.Failed("Invalid refresh token"));
            }

            // Check if token is active (not revoked and not expired)
            if (!refreshToken.IsActive)
            {
                return Unauthorized(FMSResponse<object>.Failed(
                    refreshToken.IsExpired ? "Refresh token expired" : "Refresh token has been revoked"));
            }

            // Get user
            var user = refreshToken.User;
            if (user == null || user.IsDeleted == true)
            {
                return Unauthorized(FMSResponse<object>.Failed("User not found or deleted"));
            }

            // Get user roles
            var userRoles = await _userManager.GetRolesAsync(user);
            var userName = user.UserName ?? user.Email ?? user.Id;
            var tenantClaims = await ResolveTenantClaimsAsync(user, userRoles, cancellationToken);

            // Generate new access token with fresh permissions
            var newAccessToken = await _jwtTokenGenerator.GenerateTokenWithPermissions(
                user.Id,
                userName,
                user.Email ?? string.Empty,
                userRoles,
                tenantClaims);

            // Generate new refresh token (token rotation for security)
            var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
            var newRefreshTokenExpiry = DateTime.UtcNow.AddDays(30);

            // Get client IP
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

            // Revoke old refresh token
            refreshToken.IsRevoked = true;
            refreshToken.RevokedAt = DateTime.UtcNow;
            refreshToken.RevocationReason = "Replaced by new token";
            refreshToken.ReplacedByTokenId = null; // Will be updated after new token is saved

            // Create new refresh token entity
            var newRefreshTokenEntity = new FMS.Domain.Entities.Features.UserManagement.RefreshToken
            {
                Token = newRefreshToken,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = newRefreshTokenExpiry,
                IsRevoked = false,
                CreatedByIp = ipAddress,
                LastUsedAt = DateTime.UtcNow,
                LastUsedByIp = ipAddress
            };

            _context.RefreshTokens.Add(newRefreshTokenEntity);
            await _context.SaveChangesAsync();

            // Update the replaced by token ID
            refreshToken.ReplacedByTokenId = newRefreshTokenEntity.Id;
            await _context.SaveChangesAsync();

            // Get fresh user details
            var userDetail = await _mediator.Send(new GetUserByIdQuery(user.Id));

            // Return new tokens and user data
            var responseData = new
            {
                Token = newAccessToken,
                RefreshToken = newRefreshToken,
                User = userDetail
            };

            return Ok(FMSResponse<object>.Success(responseData, "Token refreshed successfully"));
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,
                FMSResponse<object>.SystemError($"An error occurred during token refresh: {ex.Message}"));
        }
    }

    /// <summary>
    /// DTO for refresh token request
    /// </summary>
    public class RefreshTokenRequest
    {
        public string? RefreshToken { get; set; }
    }

    [HttpPost("assignRoles")]
    [RequirePermission(Permissions.Admin.Users)]
    public async Task<IActionResult> AssignRoles(AssignUserRoleCommand command)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Get user's sites
    [HttpGet("{id}/sites")]
    [RequirePermission(Permissions.Admin.Users)]
    public async Task<IActionResult> GetUserSites(string id)
    {
        var command = new GetUserSitesQuery(id);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Update user's sites
    [HttpPost("{id}/sites")]
    [RequirePermission(Permissions.Admin.Users)]
    public async Task<IActionResult> UpdateUserSites(string id, [FromBody] UpdateUserSitesCommand command)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        command = command with { UserId = id };
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Changes the authenticated user's own password.
    /// Requires the current password for verification.
    /// </summary>
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(FMSResponse<bool>.Failed("Not authenticated."));

        var command = new ChangePasswordCommand(
            UserId: userId,
            CurrentPassword: request.CurrentPassword,
            NewPassword: request.NewPassword);

        var result = await _mediator.Send(command);

        if (result.IsSuccess)
            return Ok(result);

        return BadRequest(result);
    }

    private async Task<TenantClaims?> ResolveTenantClaimsAsync(User user, IList<string> userRoles, CancellationToken cancellationToken)
    {
        Tenant? tenant = null;
        if (user.TenantId != Guid.Empty)
        {
            tenant = await _context.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == user.TenantId, cancellationToken);
        }

        bool hasOperatorRole = userRoles.Any(role =>
            string.Equals(role, "Administrator", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "PlatformOperator", StringComparison.OrdinalIgnoreCase));

        if (tenant is null)
        {
            tenant = hasOperatorRole
                ? await _context.Tenants
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Code == "_platform", cancellationToken)
                : await _context.Tenants
                    .AsNoTracking()
                    .Where(t => t.IsActive && t.TenantKind == TenantKind.Client)
                    .OrderBy(t => t.CreatedAt)
                    .FirstOrDefaultAsync(cancellationToken);
        }

        if (tenant is null)
        {
            return null;
        }

        bool isPlatformOperator = hasOperatorRole &&
            tenant.TenantKind == TenantKind.System &&
            string.Equals(tenant.Code, "_platform", StringComparison.OrdinalIgnoreCase);

        var userScopes = await ResolveUserScopeClaimsAsync(user.Id, cancellationToken);

        return new TenantClaims(
            TenantId: tenant.Id,
            TenantKind: tenant.TenantKind,
            ParentTenantId: tenant.ParentTenantId,
            IsPlatformOperator: isPlatformOperator,
            UserScopes: userScopes);
    }

    private async Task<IReadOnlyCollection<UserScopeClaim>> ResolveUserScopeClaimsAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var scopes = await _context.UserResourceScopes
            .AsNoTracking()
            .Where(scope => scope.UserId == userId)
            .Select(scope => new { scope.ResourceKind, scope.ResourceId })
            .ToListAsync(cancellationToken);

        return scopes
            .GroupBy(scope => scope.ResourceKind)
            .Select(group => new UserScopeClaim(
                group.Key,
                group.Select(scope => scope.ResourceId)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(resourceId => resourceId)
                    .ToArray()))
            .ToArray();
    }
}

/// <summary>Request DTO for ChangePassword endpoint.</summary>
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record ConfirmEmailRequest(string UserId, string Token);
