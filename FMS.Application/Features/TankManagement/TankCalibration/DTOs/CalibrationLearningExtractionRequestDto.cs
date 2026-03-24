/**
 * File: CalibrationLearningExtractionRequestDto.cs
 * Purpose: Defines the request payload for extracting FMS learned-calibration data points over a date range.
 * Dependencies: System
 * Last Modified: 2026-03-24
 */
using System;

namespace FMS.Application.Features.TankManagement.TankCalibration.DTOs
{
    public class CalibrationLearningExtractionRequestDto
    {
        public DateTime? StartDateUtc { get; set; }

        public DateTime? EndDateUtc { get; set; }

        public bool IncludeDispensing { get; set; } = true;

        public bool IncludeDeliveries { get; set; } = true;
    }
}