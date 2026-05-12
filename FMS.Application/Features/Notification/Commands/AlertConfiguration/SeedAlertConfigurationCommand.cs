/**
 * File: SeedAlertConfigurationCommand.cs
 * Purpose: Command to seed all alert configuration defaults into the SystemConfiguration table
 * Dependencies: FMSResponse
 * Last Modified: 2026-02-07
 */

using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.Notification.Commands.AlertConfiguration
{
    /// <summary>
    /// Seeds all alert configuration defaults into the database.
    /// Only creates entries that don't already exist — does not overwrite existing custom values.
    /// </summary>
    public record SeedAlertConfigurationCommand() : IRequest<FMSResponse<string>>;
}
