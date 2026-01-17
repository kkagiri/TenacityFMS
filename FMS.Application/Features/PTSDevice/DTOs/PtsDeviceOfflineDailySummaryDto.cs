/**
 * File: PtsDeviceOfflineDailySummaryDto.cs
 * Purpose: DTO representing daily offline summary for a PTS device
 * Dependencies: PtsDeviceOfflinePeriodDto
 * Last Modified: 2026-01-17
 *
 * Key Classes:
 * - PtsDeviceOfflineDailySummaryDto: Daily summary payload
 */

using System;
using System.Collections.Generic;

namespace FMS.Application.Features.PTSDevice.DTOs
{
    public class PtsDeviceOfflineDailySummaryDto
    {
        public string DeviceId { get; set; } = string.Empty;
        public string? DeviceName { get; set; }
        public string? SiteName { get; set; }
        public DateTime Date { get; set; }
        public int OfflineCount { get; set; }
        public int TotalOfflineSeconds { get; set; }
        public List<PtsDeviceOfflinePeriodDto> Periods { get; set; } = new();
    }
}
