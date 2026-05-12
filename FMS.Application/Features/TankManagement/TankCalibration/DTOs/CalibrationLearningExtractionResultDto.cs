/**
 * File: CalibrationLearningExtractionResultDto.cs
 * Purpose: Summarizes the data points created during a learned-calibration extraction run.
 * Dependencies: System.Collections.Generic, CalibrationDataPointDto
 * Last Modified: 2026-03-24
 */
using System.Collections.Generic;

namespace FMS.Application.Features.TankManagement.TankCalibration.DTOs
{
    public class CalibrationLearningExtractionResultDto
    {
        public int TankId { get; set; }

        public int DispensingPointCount { get; set; }

        public int DeliveryPointCount { get; set; }

        public int TotalPointCount { get; set; }

        public List<CalibrationDataPointDto> DataPoints { get; set; } = new();
    }
}