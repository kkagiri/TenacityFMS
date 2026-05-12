/**
 * File: TankCalibrationSnapshotHistoryItemDto.cs
 * Purpose: Represents a paged history row for a persisted tank calibration snapshot.
 * Dependencies: System
 * Last Modified: 2026-03-23
 *
 * Key Properties:
 * - Source: Operation that created the snapshot.
 * - TotalRecords: Number of chart rows captured.
 * - RecordedAtUtc: UTC timestamp of local persistence.
 */
using System;

namespace FMS.Application.Features.TankManagement.TankCalibration.DTOs
{
    public class TankCalibrationSnapshotHistoryItemDto
    {
        public long Id { get; set; }
        public int TankId { get; set; }
        public string TankName { get; set; } = string.Empty;
        public string ChartType { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public int TotalRecords { get; set; }
        public DateTime RecordedAtUtc { get; set; }
        public string? RecordedBy { get; set; }
        public string? Notes { get; set; }
    }
}