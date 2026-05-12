/**
 * File: GetAlertConfigurationByTypeQuery.cs
 * Purpose: Query to retrieve configuration for a specific alert type
 * Dependencies: FMSResponse, AlertConfigurationDto
 * Last Modified: 2026-02-07
 */

using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs.AlertConfiguration;
using MediatR;

namespace FMS.Application.Features.Notification.Queries.AlertConfiguration
{
    /// <summary>
    /// Returns configuration for a specific alert type
    /// </summary>
    public record GetAlertConfigurationByTypeQuery(string AlertType) : IRequest<FMSResponse<AlertConfigurationDto>>;
}
