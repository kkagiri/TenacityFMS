using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace FMS.Application.Features.FMS.Tank
{
    public class TankDTO
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public decimal TankVolume { get; set; }

        public decimal? TankHeight { get; set; }

        public string? PtsId { get; set; }

        public int SiteId { get; set; }
        public decimal? DiscrepancyThreshold { get; set; }
        public decimal? TankLength { get; set; }

        // Align with Domain entity types/nullability
        public decimal? CurrentStock { get; set; }
        public bool UseBookKeeping { get; set; }

        public DateTime LastStockUpdate { get; set; }

        public decimal? PhysicalStockValue { get; set; }

        public DateTime? LastPhysicalStockUpdate { get; set; }

        public string? PhysicalStockSource { get; set; }

        public int? FuelGradeId { get; set; }
        public string? FuelGradeName { get; set; }

        /// <summary>
        /// Whether automatic book keeping is enabled for this tank
        /// </summary>
        public bool HasAutomaticBookKeeping { get; set; }

        /// <summary>
        /// Priority level of the tank (e.g., High, Medium, Low)
        /// </summary>
        public string? Priority { get; set; }

        // =====================================================
        // Location Validation Properties
        // =====================================================

        /// <summary>
        /// Type of tank: Stationary (fixed location) or MobileTanker (moves with vehicle)
        /// </summary>
        public string TankType { get; set; } = "Stationary";

        /// <summary>
        /// GPS Latitude for stationary tanks. For mobile tankers, use LinkedVehicle's GPS.
        /// </summary>
        public decimal? Latitude { get; set; }

        /// <summary>
        /// GPS Longitude for stationary tanks. For mobile tankers, use LinkedVehicle's GPS.
        /// </summary>
        public decimal? Longitude { get; set; }

        /// <summary>
        /// For MobileTanker type: The vehicle that carries this tank. GPS location comes from this vehicle.
        /// </summary>
        public int? LinkedVehicleId { get; set; }

        /// <summary>
        /// Proximity radius in meters for location validation. Overrides PTS device default if set.
        /// </summary>
        public int? LocationValidationRadius { get; set; } = 100;

        /// <summary>
        /// Display name for the linked vehicle (for UI display purposes)
        /// </summary>
        public string? LinkedVehicleName { get; set; }

        [JsonIgnore]
        public string? SiteName { get; set; }
    }
}