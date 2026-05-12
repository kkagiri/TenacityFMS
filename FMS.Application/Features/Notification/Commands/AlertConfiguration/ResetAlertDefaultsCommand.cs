/**
 * File: ResetAlertDefaultsCommand.cs
 * Purpose: Command to reset a specific alert type back to factory defaults
 * Dependencies: FMSResponse
 * Last Modified: 2026-02-07
 */

using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.Notification.Commands.AlertConfiguration
{
    /// <summary>
    /// Resets all parameters for an alert type back to factory defaults
    /// </summary>
    public record ResetAlertDefaultsCommand(string AlertType) : IRequest<FMSResponse<string>>;
}
