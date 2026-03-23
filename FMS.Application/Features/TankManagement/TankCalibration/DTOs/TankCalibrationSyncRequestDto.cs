/**
 * File: TankCalibrationSyncRequestDto.cs
 * Purpose: Defines the request payload for syncing a linked tank calibration chart into local history.
 * Dependencies: None
 * Last Modified: 2026-03-23
 *
 * Key Properties:
 * - ChartType: Target chart category to sync.
 * - Source: Optional operation label persisted with the snapshot.
 * - Notes: Optional operator note stored with the snapshot.
 */
namespace FMS.Application.Features.TankManagement.TankCalibration.DTOs
{
    public class TankCalibrationSyncRequestDto
    {
        public string ChartType { get; set; } = string.Empty;
        public string? Source { get; set; }
        public string? Notes { get; set; }
    }
}