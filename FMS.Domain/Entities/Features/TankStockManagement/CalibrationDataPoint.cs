/**
 * File: CalibrationDataPoint.cs
 * Purpose: Stores extracted FMS learned-calibration observations derived from dispensing, delivery, or transfer events.
 * Dependencies: System
 * Last Modified: 2026-03-24
 */
using System;

namespace FMS.Domain.Entities.Features.TankStockManagement
{
    /// <summary>
    /// Persisted learned-calibration observation for a tank.
    /// </summary>
    public class CalibrationDataPoint
    {
        public long Id { get; set; }

        public int TankId { get; set; }

        public decimal HeightBefore { get; set; }

        public decimal HeightAfter { get; set; }

        public decimal VolumeChange { get; set; }

        public int HeightInterval { get; set; }

        public decimal VolumePerMm { get; set; }

        public string SourceType { get; set; } = null!;

        public int SourceEventId { get; set; }

        public DateTime RecordedAtUtc { get; set; }

        public bool IsProcessed { get; set; }
    }
}