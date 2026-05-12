/**
 * File: ToggleAlertCommand.cs
 * Purpose: Command to enable or disable a specific alert type
 * Dependencies: FMSResponse
 * Last Modified: 2026-02-07
 */

using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.Notification.Commands.AlertConfiguration
{
    /// <summary>
    /// Toggles an alert type on or off
    /// </summary>
    public record ToggleAlertCommand(string AlertType, bool Enabled) : IRequest<FMSResponse<string>>;
}
