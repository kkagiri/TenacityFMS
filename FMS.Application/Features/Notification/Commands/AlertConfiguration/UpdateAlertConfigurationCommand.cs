/**
 * File: UpdateAlertConfigurationCommand.cs
 * Purpose: Command to update threshold parameters for an alert type
 * Dependencies: FMSResponse
 * Last Modified: 2026-02-07
 */

using System.Collections.Generic;
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.Notification.Commands.AlertConfiguration
{
    /// <summary>
    /// Updates threshold parameters for a specific alert type.
    /// Only provided parameters will be updated; omitted parameters remain unchanged.
    /// </summary>
    public record UpdateAlertConfigurationCommand(
        string AlertType,
        bool? Enabled,
        Dictionary<string, string>? Parameters
    ) : IRequest<FMSResponse<string>>;
}
