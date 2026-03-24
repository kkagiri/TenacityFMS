/**
 * File: CalibrationDataPointDto.cs
 * Purpose: Represents a learned-calibration observation extracted from dispensing or delivery events.
 * Dependencies: System
 * Last Modified: 2026-03-24
 *
 * Key Properties:
 * - HeightBeforeMm/HeightAfterMm: Stable tank heights bracketing the source event.
 * - VolumePerMm: Derived litres-per-millimetre ratio for the observed interval.
 * - HeightIntervalMm: Bucket start used for learned calibration accumulation.
 */
using System;

namespace FMS.Application.Features.TankManagement.TankCalibration.DTOs
{
    public class CalibrationDataPointDto
    {
        public long Id { get; set; }

        public int TankId { get; set; }

        public decimal HeightBeforeMm { get; set; }

        public decimal HeightAfterMm { get; set; }

        public decimal VolumeChangeLitres { get; set; }

        public int HeightIntervalMm { get; set; }

        public decimal VolumePerMm { get; set; }

        public string SourceType { get; set; } = string.Empty;

        public int SourceEventId { get; set; }

        public DateTime RecordedAtUtc { get; set; }

        public bool IsProcessed { get; set; }
    }
}