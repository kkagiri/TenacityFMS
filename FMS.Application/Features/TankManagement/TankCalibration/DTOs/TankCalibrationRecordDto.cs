/**
 * File: TankCalibrationRecordDto.cs
 * Purpose: Represents a normalized tank calibration chart record stored in FMS history.
 * Dependencies: None
 * Last Modified: 2026-03-23
 *
 * Key Properties:
 * - Height: Calibration height in centimeters (PTS chart convention; probe measurements are in mm).
 * - Volume: Volume at the calibration height.
 * - PassesNumber: Optional interval-volume pass count.
 */
namespace FMS.Application.Features.TankManagement.TankCalibration.DTOs
{
    public class TankCalibrationRecordDto
    {
        public int Height { get; set; }
        public int Volume { get; set; }
        public int? PassesNumber { get; set; }
    }
}