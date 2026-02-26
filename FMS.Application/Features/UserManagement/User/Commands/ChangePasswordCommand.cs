/**
 * File: ChangePasswordCommand.cs
 * Purpose: CQRS command allowing an authenticated user to change their own password.
 *          Verifies the current password before applying the new one.
 * Dependencies: UserManager<User>, ILogger
 * Last Modified: 2026-02-24
 */

using FMS.Application.Common;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.UserManagement.User.Commands;

public record ChangePasswordCommand(
    string UserId,
    string CurrentPassword,
    string NewPassword) : IRequest<FMSResponse<bool>>;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, FMSResponse<bool>>
{
    private readonly UserManager<Domain.Entities.User> _userManager;
    private readonly ILogger<ChangePasswordCommandHandler> _logger;

    public ChangePasswordCommandHandler(
        UserManager<Domain.Entities.User> userManager,
        ILogger<ChangePasswordCommandHandler> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.UserId))
                return FMSResponse<bool>.Failed("User ID is required.");

            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                return FMSResponse<bool>.Failed("Current password is required.");

            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
                return FMSResponse<bool>.Failed("New password must be at least 6 characters.");

            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
            {
                _logger.LogWarning("ChangePassword: User {UserId} not found.", request.UserId);
                return FMSResponse<bool>.Failed("User not found.");
            }

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);

            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                _logger.LogWarning("ChangePassword failed for user {UserId}: {Errors}", request.UserId, errors);
                return FMSResponse<bool>.Failed(errors);
            }

            _logger.LogInformation("Password changed successfully for user {UserId}.", request.UserId);
            return FMSResponse<bool>.Success(true, "Password changed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error changing password for user {UserId}.", request.UserId);
            return FMSResponse<bool>.SystemError("An unexpected error occurred while changing the password.");
        }
    }
}
