using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using FMS.Domain.Entities;

namespace FMS.Application.Features.Vehicle.DTOs
{
    public class VehicleDTO
    {
        public string HyoungNo { get; set; } = null!;

        public int VehicleId { get; set; }

        public int? VehicleTypeId { get; set; }

        public int? VehicleModelId { get; set; }

        public int? VehicleManufacturerId { get; set; }

        public string? Yom { get; set; } = null!;

        public int? DeviceId { get; set; }

        public int? DefaultEmployeeId { get; set; }
        public decimal? FuelTankCapacity { get; set; }
        public bool? IsFullTankPolicy { get; set; }

        public int? WorkingSiteId { get; set; }

        public decimal? ExcessWorkingHrCost { get; set; }

        /// <summary>
        /// Do not change this property name to NumberPlate, use HyoungNo instead
        /// </summary>
        public string? NumberPlate { get; set; } = null!;

        public bool AverageKmL { get; set; }

        public string? Capacity { get; set; } = null;

        public string? Passenger { get; set; } = null!;
        public string? CurrentPhysicalReading { get; set; } = null!;

        public int? DefaultExptdAvgid { get; set; }

        // GPS and tracking properties
        public bool HasGPSInstalled { get; set; }
        public bool GpsgategeneratedId { get; set; }

        // Added fields for tracking
        public DateTime? DateCreated { get; set; }
        public DateTime? DateModified { get; set; }
        public string? CreatedBy { get; set; }
        public string? ModifiedBy { get; set; }
        public bool? IsCompanyVehicle { get; set; }
        public bool? IsActive { get; set; }

        [JsonIgnore]
        public string? ExpectedAverageclassificationName { get; set; }

        [JsonIgnore]
        public decimal? ExpectedAverageValue { get; set; }

        [JsonIgnore]
        public string? CombinedExpectedAverage => !string.IsNullOrEmpty(ExpectedAverageclassificationName)
            ? $"{ExpectedAverageclassificationName} {ExpectedAverageValue}"
            : null;

        public List<string> Tags { get; set; } = new List<string>();

        #region Fixed Location Properties

        /// <summary>
        /// Indicates if this vehicle is a fixed/stationary asset (e.g., generator, pump, crane)
        /// </summary>
        public bool IsFixedLocation { get; set; }

        /// <summary>
        /// The registered latitude for this fixed location asset
        /// </summary>
        public decimal? FixedLatitude { get; set; }

        /// <summary>
        /// The registered longitude for this fixed location asset
        /// </summary>
        public decimal? FixedLongitude { get; set; }

        /// <summary>
        /// The allowed proximity radius in meters for fueling validation (default: 50m)
        /// </summary>
        public decimal? FixedLocationRadiusMeters { get; set; }

        /// <summary>
        /// A descriptive name for the fixed location (e.g., "Main Generator Building A")
        /// </summary>
        public string? FixedLocationName { get; set; }

        /// <summary>
        /// When the fixed location was last verified/updated
        /// </summary>
        public DateTime? FixedLocationLastVerifiedAt { get; set; }

        /// <summary>
        /// User who last verified/updated the fixed location
        /// </summary>
        public string? FixedLocationVerifiedBy { get; set; }

        /// <summary>
        /// Whether to require proximity validation for fueling this fixed asset
        /// </summary>
        public bool RequireProximityValidation { get; set; } = true;

        #endregion

    }
}