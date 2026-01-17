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
    public record GetPtsDeviceOfflineReportQuery(DateTime StartDate, DateTime EndDate, string? DeviceId = null)
        : IRequest<FMSResponse<List<PtsDeviceOfflineDailySummaryDto>>>;
}
