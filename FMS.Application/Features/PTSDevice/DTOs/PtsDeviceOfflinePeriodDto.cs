/**
 * File: PtsDeviceOfflinePeriodDto.cs
 * Purpose: DTO representing a single offline period segment
 * Dependencies: None
 * Last Modified: 2026-01-17
 *
 * Key Classes:
 * - PtsDeviceOfflinePeriodDto: Offline segment payload
 */

using System;

namespace FMS.Application.Features.PTSDevice.DTOs
{
    public class PtsDeviceOfflinePeriodDto
    {
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public int DurationSeconds { get; set; }
    }
}
