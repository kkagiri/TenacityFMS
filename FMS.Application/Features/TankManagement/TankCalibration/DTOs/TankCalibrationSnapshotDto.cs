/**
 * File: TankCalibrationSnapshotDto.cs
 * Purpose: Represents a persisted local snapshot of a tank calibration chart and its records.
 * Dependencies: System, System.Collections.Generic, TankCalibrationRecordDto
 * Last Modified: 2026-03-23
 *
 * Key Properties:
 * - ChartType: Manual, interval-volume, or automatic chart category.
 * - Source: Operation that produced the snapshot.
 * - Records: Full chart rows captured at the snapshot moment.
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.TankManagement.TankCalibration.DTOs
{
    public class TankCalibrationSnapshotDto
    {
        public long Id { get; set; }
        public int TankId { get; set; }
        public string TankName { get; set; } = string.Empty;
        public string PtsDeviceId { get; set; } = string.Empty;
        public int ProbeNumber { get; set; }
        public string ChartType { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public int TotalRecords { get; set; }
        public DateTime RecordedAtUtc { get; set; }
        public string? RecordedBy { get; set; }
        public string? Notes { get; set; }
        public List<TankCalibrationRecordDto> Records { get; set; } = new();
    }
}