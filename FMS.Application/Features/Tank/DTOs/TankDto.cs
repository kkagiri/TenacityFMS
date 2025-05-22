using System;

namespace FMS.Application.Features.Tank.DTOs {
    /// <summary>
    /// Data Transfer Object for Tank information
    /// </summary>
    public class TankDto {
        /// <summary>
        /// The unique identifier for the tank
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// The name of the tank
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// The capacity of the tank in liters
        /// </summary>
        public decimal Capacity { get; set; }

        /// <summary>
        /// The current volume of fuel in the tank
        /// </summary>
        public decimal CurrentVolume { get; set; }

        /// <summary>
        /// The percentage of the tank that is currently filled
        /// </summary>
        public decimal FillPercentage => Capacity > 0 ? (CurrentVolume / Capacity) * 100 : 0;

        /// <summary>
        /// The site ID where the tank is located
        /// </summary>
        public Guid SiteId { get; set; }

        /// <summary>
        /// The site name where the tank is located
        /// </summary>
        public string SiteName { get; set; }

        /// <summary>
        /// The type of fuel stored in the tank
        /// </summary>
        public string FuelType { get; set; }

        /// <summary>
        /// The date when the tank was last calibrated
        /// </summary>
        public DateTime? LastCalibrationDate { get; set; }

        /// <summary>
        /// The date when the tank was last reconciled
        /// </summary>
        public DateTime? LastReconciliationDate { get; set; }

        /// <summary>
        /// Flag indicating if the tank is currently active
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// The low level alert threshold as a percentage
        /// </summary>
        public decimal LowLevelAlertThreshold { get; set; }

        /// <summary>
        /// Flag indicating if the tank is currently in a low level alert state
        /// </summary>
        public bool IsLowLevelAlert => FillPercentage < LowLevelAlertThreshold;
    }
}