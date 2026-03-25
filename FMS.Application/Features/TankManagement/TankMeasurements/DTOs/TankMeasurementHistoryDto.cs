/**
 * File: TankMeasurementHistoryDto.cs
 * Purpose: DTO representing a single tank measurement point for history charts.
 * Dependencies: None
 * Last Modified: 2026-02-12
 */
using System;

namespace FMS.Application.Features.TankManagement.TankMeasurements.DTOs
{
    public class TankMeasurementHistoryDto
    {
        public DateTime DateTime { get; set; }
        public int TankId { get; set; }
        public decimal? ProductVolume { get; set; }
        public decimal? Temperature { get; set; }
        public decimal? WaterHeight { get; set; }
        public decimal? ProductHeight { get; set; }
        public decimal? WaterVolume { get; set; }

        /// <summary>
        /// Data source indicator: "TankMeasurement" or "UploadStatus"
        /// </summary>
        public string Source { get; set; } = "TankMeasurement";
    }
}
