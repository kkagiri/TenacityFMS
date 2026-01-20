/**
 * File: GetPtsDeviceOfflineReportQuery.cs
 * Purpose: Query definition for PTS device offline report
 * Dependencies: MediatR, FMSResponse, PtsDeviceOfflineDailySummaryDto
 * Last Modified: 2026-01-17
 *
 * Key Classes:
 * - GetPtsDeviceOfflineReportQuery: CQRS query for offline report
 */

using System;
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.PTSDevice.DTOs;
using MediatR;

namespace FMS.Application.Features.PTSDevice.Queries
{
    /// <summary>
    /// Query for generating PTS device offline reports
    /// </summary>
    /// <param name="StartDate">Start of reporting period</param>
    /// <param name="EndDate">End of reporting period</param>
    /// <param name="DeviceId">Optional device ID filter</param>
    /// <param name="MinOfflineThresholdSeconds">Optional minimum offline duration threshold in seconds (overrides system config)</param>
    public record GetPtsDeviceOfflineReportQuery(
        DateTime StartDate,
        DateTime EndDate,
        string? DeviceId = null,
        int? MinOfflineThresholdSeconds = null)
        : IRequest<FMSResponse<List<PtsDeviceOfflineDailySummaryDto>>>;
}
