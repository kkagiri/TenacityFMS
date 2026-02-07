/**
 * File: GetAlertConfigurationsQuery.cs
 * Purpose: Query to retrieve all alert configurations grouped by category
 * Dependencies: FMSResponse, AlertTypeGroupDto
 * Last Modified: 2026-02-07
 */

using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs.AlertConfiguration;
using MediatR;

namespace FMS.Application.Features.Notification.Queries.AlertConfiguration
{
    /// <summary>
    /// Returns all alert configurations grouped by category for the management UI
    /// </summary>
    public record GetAlertConfigurationsQuery() : IRequest<FMSResponse<List<AlertTypeGroupDto>>>;
}
