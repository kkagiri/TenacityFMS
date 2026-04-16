using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.Services;
using FMS.Domain.Entities; // For FMSResponse
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.UserManagement;

public record UserCreateCommand(
    string? Email,
    string Username,
    string RoleName,
    string? FirstName = null,
    string? LastName = null,
    int? DepartmentId = null,
    bool SendOnboardingEmail = true,
    bool RequireEmailConfirmation = true,
    bool RequirePasswordChangeOnFirstLogin = true) : IRequest<FMSResponse<UserCreateResultDto>>;

public record UserCreateResultDto(
    string UserId,
    string? TemporaryPassword,
    bool OnboardingEmailSent,
    bool RequireEmailConfirmation,
    bool RequirePasswordChangeOnFirstLogin);

public class UserCreateCommandHandler : IRequestHandler<UserCreateCommand, FMSResponse<UserCreateResultDto>>
{
    private const string TemporaryPasswordPrefix = "Hyoung";
    private const string PasswordLetters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    private const string PasswordSpecialCharacters = "!@#$%^&*";
    private const string DevelopmentEnvironmentName = "Development";

    private readonly IConfiguration _configuration;
    private readonly GpsdataContext _context;
    private readonly IEmailService _emailService;
    private readonly UserManager<User> _manager;

    private readonly ILogger<UserCreateCommandHandler> _logger;
    private readonly RoleManager<Role> _roleManager;

    public UserCreateCommandHandler(IConfiguration configuration,
        GpsdataContext context,
        IEmailService emailService,
        ILogger<UserCreateCommandHandler>
        logger, UserManager<User> manager,
        RoleManager<Role> roleManager
    )
    {
        _configuration = configuration;
        _roleManager = roleManager;
        _context = context;
        _emailService = emailService;
        _logger = logger;
        _manager = manager;

    }

    public async Task<FMSResponse<UserCreateResultDto>> Handle(UserCreateCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var validationErrors = new List<string>();
            var normalizedEmail = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();

            // Username uniqueness
            var existingUserByUsername = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserName == request.Username, cancellationToken);
            if (existingUserByUsername != null)
            {
                validationErrors.Add("Username already exists.");
            }

            // Email uniqueness
            if (!string.IsNullOrWhiteSpace(normalizedEmail))
            {
                var existingUserByEmail = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
                if (existingUserByEmail != null)
                {
                    validationErrors.Add("Email already exists.");
                }
            }

            if (request.SendOnboardingEmail && string.IsNullOrWhiteSpace(normalizedEmail))
            {
                validationErrors.Add("Email is required when onboarding email is enabled.");
            }

            if (request.RequireEmailConfirmation && string.IsNullOrWhiteSpace(normalizedEmail))
            {
                validationErrors.Add("Email is required when email confirmation is enabled.");
            }

            if (request.RequireEmailConfirmation && !request.SendOnboardingEmail)
            {
                validationErrors.Add("Email confirmation cannot be required when onboarding email is disabled.");
            }

            if (request.RequireEmailConfirmation && IsDevelopmentEnvironment())
            {
                validationErrors.Add("Email-confirmed user creation is disabled in Development. Create the user from production so the confirmation email uses the production URL.");
            }

            // Validate DepartmentId if provided
            if (request.DepartmentId.HasValue)
            {
                var departmentExists = await _context.Departments
                    .AsNoTracking()
                    .AnyAsync(d => d.DepartmentId == request.DepartmentId.Value && d.IsActive, cancellationToken);
                if (!departmentExists)
                {
                    validationErrors.Add("Selected department does not exist or is inactive.");
                }
            }

            if (validationErrors.Any())
            {
                _logger.LogWarning("User creation validation failed for {@Request}: {Errors}", request, validationErrors);
                return FMSResponse<UserCreateResultDto>.ValidationFailed(validationErrors);
            }

            if (!string.IsNullOrWhiteSpace(request.RoleName))
            {
                var roleExist = await _roleManager.RoleExistsAsync(request.RoleName);
                if (!roleExist)
                {
                    _logger.LogWarning("Role {Role} does not exist for new user {User}", request.RoleName, request.Username);
                    return FMSResponse<UserCreateResultDto>.ValidationFailed(new List<string> { $"Role '{request.RoleName}' does not exist." });
                }
            }

            var temporaryPassword = GenerateTemporaryPassword();

            var user = new User
            {
                UserName = request.Username,
                Email = normalizedEmail,
                EmailConfirmed = !request.RequireEmailConfirmation,
                FirstName = request.FirstName,
                LastName = request.LastName,
                IsDeleted = false,
                DepartmentId = request.DepartmentId,
                RequirePasswordChangeOnFirstLogin = request.RequirePasswordChangeOnFirstLogin
            };

            var identityResult = await _manager.CreateAsync(user, temporaryPassword);
            if (!identityResult.Succeeded)
            {
                var identityErrors = identityResult.Errors.Select(e => e.Description).ToList();
                _logger.LogWarning("Temporary password / identity validation failed for {Username}: {Errors}", request.Username, identityErrors);
                return FMSResponse<UserCreateResultDto>.ValidationFailed(identityErrors);
            }

            if (!string.IsNullOrWhiteSpace(request.RoleName))
            {
                var roleResult = await _manager.AddToRoleAsync(user, request.RoleName);
                if (!roleResult.Succeeded)
                {
                    var roleErrors = roleResult.Errors.Select(e => e.Description).ToList();
                    _logger.LogWarning("Failed assigning role {Role} to user {User}: {Errors}", request.RoleName, request.Username, roleErrors);
                    await _manager.DeleteAsync(user);
                    return FMSResponse<UserCreateResultDto>.ValidationFailed(roleErrors);
                }
            }

            var onboardingEmailSent = false;

            if (request.SendOnboardingEmail && !string.IsNullOrWhiteSpace(normalizedEmail))
            {
                string? confirmationLink = null;
                if (request.RequireEmailConfirmation)
                {
                    var confirmationToken = await _manager.GenerateEmailConfirmationTokenAsync(user);
                    var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(confirmationToken));
                    confirmationLink = BuildConfirmationLink(user.Id, encodedToken);
                }

                var emailBody = BuildWelcomeEmailBody(
                    user,
                    temporaryPassword,
                    confirmationLink,
                    request.RequirePasswordChangeOnFirstLogin);

                onboardingEmailSent = await _emailService.SendEmailAsync(
                    to: normalizedEmail,
                    subject: request.RequireEmailConfirmation ? "Confirm your Hyoung FMS account" : "Your Hyoung FMS account is ready",
                    body: emailBody,
                    isHtml: true,
                    cancellationToken: cancellationToken);

                if (!onboardingEmailSent)
                {
                    _logger.LogError("Failed sending onboarding email to {Email} for user {Username}. Rolling back user creation.", normalizedEmail, request.Username);
                    await _manager.DeleteAsync(user);
                    return FMSResponse<UserCreateResultDto>.SystemError("User could not be created because the onboarding email could not be sent.");
                }
            }

            var result = new UserCreateResultDto(
                UserId: user.Id,
                TemporaryPassword: onboardingEmailSent ? null : temporaryPassword,
                OnboardingEmailSent: onboardingEmailSent,
                RequireEmailConfirmation: request.RequireEmailConfirmation,
                RequirePasswordChangeOnFirstLogin: request.RequirePasswordChangeOnFirstLogin);

            var successMessage = onboardingEmailSent
                ? request.RequireEmailConfirmation
                    ? "User created successfully. A confirmation email with a temporary password has been sent."
                    : "User created successfully. An onboarding email with the temporary password has been sent."
                : "User created successfully. Share the generated temporary password with the user manually.";

            return FMSResponse<UserCreateResultDto>.Success(result, successMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception during user creation for {Username}", request.Username);
            return FMSResponse<UserCreateResultDto>.SystemError("Error creating user.");
        }
    }

    private string BuildConfirmationLink(string userId, string encodedToken)
    {
        var baseUrl = _configuration["Frontend:BaseUrl"]
            ?? _configuration["App:FrontendBaseUrl"]
            ?? _configuration["FrontendBaseUrl"]
            ?? "http://localhost:3000";

        return $"{baseUrl.TrimEnd('/')}/confirm-email?userId={Uri.EscapeDataString(userId)}&token={Uri.EscapeDataString(encodedToken)}";
    }

    private static string BuildWelcomeEmailBody(User user, string temporaryPassword, string? confirmationLink, bool requirePasswordChangeOnFirstLogin)
    {
        var displayName = string.Join(" ", new[] { user.FirstName, user.LastName }
            .Where(value => !string.IsNullOrWhiteSpace(value)));
        var safeName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(displayName) ? user.UserName ?? "User" : displayName);
        var safeUserName = WebUtility.HtmlEncode(user.UserName ?? string.Empty);
        var safePassword = WebUtility.HtmlEncode(temporaryPassword);
        var confirmationSection = string.IsNullOrWhiteSpace(confirmationLink)
            ? string.Empty
            : $"<p><a href=\"{WebUtility.HtmlEncode(confirmationLink)}\">Confirm your email address</a></p>";
        var passwordChangeSection = requirePasswordChangeOnFirstLogin
            ? "<p>After your first successful login, you will be required to change this temporary password.</p>"
            : string.Empty;

        return $@"
<div style=""font-family:Segoe UI, Arial, sans-serif; color:#201f1e; line-height:1.6;"">
    <p>Hello {safeName},</p>
    <p>Your Hyoung FMS account has been created. Use the temporary password below{(string.IsNullOrWhiteSpace(confirmationLink) ? string.Empty : ", then confirm your email before signing in")}.</p>
    <p><strong>Username:</strong> {safeUserName}<br />
         <strong>Temporary password:</strong> {safePassword}</p>
    {confirmationSection}
    {passwordChangeSection}
    <p>If you did not expect this account, please contact your administrator.</p>
</div>";
    }

    private bool IsDevelopmentEnvironment()
    {
        var environmentName = _configuration["ASPNETCORE_ENVIRONMENT"]
            ?? _configuration["DOTNET_ENVIRONMENT"]
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT");

        return string.Equals(environmentName, DevelopmentEnvironmentName, StringComparison.OrdinalIgnoreCase);
    }

    private static string GenerateTemporaryPassword()
    {
        var passwordChars = new char[TemporaryPasswordPrefix.Length + 5];
        TemporaryPasswordPrefix.CopyTo(0, passwordChars, 0, TemporaryPasswordPrefix.Length);

        for (var index = 0; index < 4; index++)
        {
            passwordChars[TemporaryPasswordPrefix.Length + index] = PasswordLetters[RandomNumberGenerator.GetInt32(PasswordLetters.Length)];
        }

        passwordChars[^1] = PasswordSpecialCharacters[RandomNumberGenerator.GetInt32(PasswordSpecialCharacters.Length)];
        return new string(passwordChars);
    }
}