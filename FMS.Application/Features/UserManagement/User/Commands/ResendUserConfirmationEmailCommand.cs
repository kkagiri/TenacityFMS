/**
 * File: ResendUserConfirmationEmailCommand.cs
 * Purpose: Resends an email confirmation link for an existing user account.
 * Dependencies: MediatR, Identity UserManager, IEmailService, IConfiguration
 * Last Modified: 2026-04-15
 *
 * Key Functions:
 * - ResendUserConfirmationEmailCommandHandler.Handle(): Generates a fresh confirmation token and sends the email.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.Services;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.UserManagement;

public record ResendUserConfirmationEmailCommand(string UserId) : IRequest<FMSResponse<bool>>;

public class ResendUserConfirmationEmailCommandHandler : IRequestHandler<ResendUserConfirmationEmailCommand, FMSResponse<bool>>
{
    private const string DevelopmentEnvironmentName = "Development";
    private const string DefaultFrontendBaseUrl = "http://10.0.10.153";
    private const string InternalFrontendBaseUrl = "http://10.0.10.153";
    private const string ExternalFrontendBaseUrl = "http://197.254.33.227";

    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly ILogger<ResendUserConfirmationEmailCommandHandler> _logger;
    private readonly UserManager<User> _userManager;

    public ResendUserConfirmationEmailCommandHandler(
        IConfiguration configuration,
        IEmailService emailService,
        ILogger<ResendUserConfirmationEmailCommandHandler> logger,
        UserManager<User> userManager)
    {
        _configuration = configuration;
        _emailService = emailService;
        _logger = logger;
        _userManager = userManager;
    }

    public async Task<FMSResponse<bool>> Handle(ResendUserConfirmationEmailCommand request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.UserId))
            {
                return FMSResponse<bool>.ValidationFailed(new List<string> { "User ID is required." });
            }

            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
            {
                return FMSResponse<bool>.Failed("User not found.");
            }

            if (user.EmailConfirmed)
            {
                return FMSResponse<bool>.ValidationFailed(new List<string> { "This user's email address is already confirmed." });
            }

            var normalizedEmail = string.IsNullOrWhiteSpace(user.Email) ? null : user.Email.Trim();
            if (string.IsNullOrWhiteSpace(normalizedEmail))
            {
                return FMSResponse<bool>.ValidationFailed(new List<string> { "This user does not have an email address." });
            }

            if (IsDevelopmentEnvironment())
            {
                return FMSResponse<bool>.ValidationFailed(new List<string> { "Resending confirmation emails is disabled in Development. Use production so the confirmation email uses the production URL." });
            }

            var confirmationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(confirmationToken));
            var confirmationLink = BuildConfirmationLink(user.Id, encodedToken);
            var emailBody = BuildConfirmationEmailBody(user, confirmationLink);

            var sent = await _emailService.SendEmailAsync(
                to: normalizedEmail,
                subject: "Confirm your Hyoung FMS account",
                body: emailBody,
                isHtml: true,
                cancellationToken: cancellationToken);

            if (!sent)
            {
                _logger.LogError("Failed to resend confirmation email to {Email} for user {UserId}", normalizedEmail, user.Id);
                return FMSResponse<bool>.SystemError("The confirmation email could not be sent.");
            }

            return FMSResponse<bool>.Success(true, "Confirmation email sent successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resend confirmation email for user {UserId}", request.UserId);
            return FMSResponse<bool>.SystemError("An error occurred while resending the confirmation email.");
        }
    }

    private string BuildConfirmationLink(string userId, string encodedToken)
    {
        var baseUrl = ResolveFrontendBaseUrl();

        return $"{baseUrl.TrimEnd('/')}/confirm-email?userId={Uri.EscapeDataString(userId)}&token={Uri.EscapeDataString(encodedToken)}";
    }

    private string ResolveFrontendBaseUrl()
    {
        var configuredBaseUrl = _configuration["Frontend:BaseUrl"]
            ?? _configuration["App:FrontendBaseUrl"]
            ?? _configuration["FrontendBaseUrl"]
            ?? _configuration["AppSettings:FrontendBaseUrl"]
            ?? _configuration["IssueTracker:FrontendBaseUrl"]
            ?? DefaultFrontendBaseUrl;

        if (!Uri.TryCreate(configuredBaseUrl, UriKind.Absolute, out var parsedBaseUrl))
        {
            return DefaultFrontendBaseUrl;
        }

        if (string.Equals(parsedBaseUrl.Host, "localhost", StringComparison.OrdinalIgnoreCase)
            || string.Equals(parsedBaseUrl.Host, "127.0.0.1", StringComparison.OrdinalIgnoreCase)
            || string.Equals(parsedBaseUrl.Host, "0.0.0.0", StringComparison.OrdinalIgnoreCase))
        {
            return DefaultFrontendBaseUrl;
        }

        return configuredBaseUrl.TrimEnd('/');
    }

    private static string BuildConfirmationEmailBody(User user, string confirmationLink)
    {
        var displayName = string.Join(" ", new[] { user.FirstName, user.LastName }
            .Where(value => !string.IsNullOrWhiteSpace(value)));
        var safeName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(displayName) ? user.UserName ?? "User" : displayName);
        var safeLink = WebUtility.HtmlEncode(confirmationLink);
        var alternativeAccessNote = BuildAlternativeAccessNote(confirmationLink);

        return $@"
<div style=""font-family:Segoe UI, Arial, sans-serif; color:#201f1e; line-height:1.6;"">
    <p>Hello {safeName},</p>
    <p>Your Hyoung FMS account is waiting for email confirmation before sign-in can complete.</p>
    <p><a href=""{safeLink}"">Confirm your email address</a></p>
    {alternativeAccessNote}
    <p>If you did not expect this account, please contact your administrator.</p>
</div>";
    }

    private static string BuildAlternativeAccessNote(string? confirmationLink)
    {
        if (string.IsNullOrWhiteSpace(confirmationLink)
            || !Uri.TryCreate(confirmationLink, UriKind.Absolute, out var confirmationUri))
        {
            return string.Empty;
        }

        var activeBaseUrl = $"{confirmationUri.Scheme}://{confirmationUri.Authority}";
        var alternateBaseUrl = string.Equals(activeBaseUrl, InternalFrontendBaseUrl, StringComparison.OrdinalIgnoreCase)
            ? ExternalFrontendBaseUrl
            : string.Equals(activeBaseUrl, ExternalFrontendBaseUrl, StringComparison.OrdinalIgnoreCase)
                ? InternalFrontendBaseUrl
                : string.Empty;

        if (string.IsNullOrWhiteSpace(alternateBaseUrl))
        {
            return string.Empty;
        }

        var accessType = string.Equals(alternateBaseUrl, InternalFrontendBaseUrl, StringComparison.OrdinalIgnoreCase)
            ? "Internal network access"
            : "External network access";

        return $"<p><strong>{accessType}:</strong> {WebUtility.HtmlEncode(alternateBaseUrl)}</p>";
    }

    private bool IsDevelopmentEnvironment()
    {
        var environmentName = _configuration["ASPNETCORE_ENVIRONMENT"]
            ?? _configuration["DOTNET_ENVIRONMENT"]
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT");

        return string.Equals(environmentName, DevelopmentEnvironmentName, StringComparison.OrdinalIgnoreCase);
    }
}