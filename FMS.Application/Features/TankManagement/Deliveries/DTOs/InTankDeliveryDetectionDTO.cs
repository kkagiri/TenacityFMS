/**
 * File: InTankDeliveryDetectionDTO.cs
 * Purpose: DTO for in-tank delivery detection results displayed in the frontend grid
 * Dependencies: None
 * Last Modified: 2026-02-10
 */
using System;

namespace FMS.Application.Features.TankManagement.Deliveries.DTOs
{
    public class InTankDeliveryDetectionDTO
    {
        public int DeliveryId { get; set; }
        public int TankProbeNumber { get; set; }
        public int? TankId { get; set; }
        public string? TankName { get; set; }
        public int? SiteId { get; set; }
        public string PtsId { get; set; } = string.Empty;
        public int FuelGradeId { get; set; }
        public string? FuelGradeName { get; set; }

        // Timing
        public DateTime? StartDateTime { get; set; }
        public DateTime? EndDateTime { get; set; }

        // Volume readings
        public float? StartProductVolume { get; set; }
        public float? EndProductVolume { get; set; }
        public float? AbsoluteProductVolume { get; set; }

        // Height readings
        public float? StartProductHeight { get; set; }
        public float? EndProductHeight { get; set; }
        public float? AbsoluteProductHeight { get; set; }

        // Temperature
        public float? StartTemperature { get; set; }
        public float? EndTemperature { get; set; }

        // Pumps dispensed during delivery
        public float? PumpsDispensedVolume { get; set; }

        // Detection metadata
        public string? Status { get; set; }
        public bool IsProcessed { get; set; }
        public DateTime? DetectedAt { get; set; }

        // Matching
        public int? MatchedDeliveryId { get; set; }
        public decimal? MatchedDeliveryAmount { get; set; }

        // PTS metadata
        public int PacketId { get; set; }
        public string? ConfigurationId { get; set; }
    }
}
