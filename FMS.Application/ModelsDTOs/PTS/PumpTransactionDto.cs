using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.Features.ATG
{
    public class PumpTransactionDto
    {
        public int Id { get; set; }

        public string PtsId { get; set; }
        public string? PtsName { get; set; }
        public int PacketId { get; set; }
        public DateTime DateTimeStart { get; set; }
        public DateTime DateTime { get; set; }
        public int Pump { get; set; }
        public int Nozzle { get; set; }
        public int? FuelGradeId { get; set; }
        public string? FuelGradeName { get; set; }
        public int Transaction { get; set; }
        public decimal Volume { get; set; }
        public decimal? TCVolume { get; set; }
        public decimal? Price { get; set; }
        public decimal Amount { get; set; }
        public decimal? TotalVolume { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? Tag { get; set; }
        public string? UserId { get; set; }
        /// <summary>
        /// The actual username resolved from UserId (joined with User table)
        /// </summary>
        public string? UserName { get; set; }
        public string? ConfigurationId { get; set; }

        // Add these fields to match PumpAuthorizeCommand
        public int? TankId { get; set; }
        public string? TankName { get; set; }
        public int? VehicleId { get; set; }
        public string? VehicleName { get; set; } // This will be VehicleCode from Vehicle entity
        public string? VehicleNumberPlate { get; set; }

        /// <summary>
        /// FK to Tank table - identifies destination tank for tank-to-tank transfers
        /// </summary>
        public int? DestinationTankId { get; set; }

        /// <summary>
        /// Destination tank name for tank-to-tank transfers
        /// </summary>
        public string? DestinationTankName { get; set; }

        /// <summary>
        /// Indicates whether this is a tank-to-tank transfer (true) or vehicle fueling (false)
        /// </summary>
        public bool IsTransferMode { get; set; } = false;

        /// <summary>
        /// Vehicle odometer reading at time of fueling (in kilometers or miles)
        /// </summary>
        public decimal? Odometer { get; set; }

        // Processing flag
        public bool HasBeenProcessed { get; set; } = false;

        // ============= New fields for mobile app audit view =============

        /// <summary>
        /// Site ID where the fueling occurred
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Site name where the fueling occurred
        /// </summary>
        public string? SiteName { get; set; }

        /// <summary>
        /// Site address where the fueling occurred
        /// </summary>
        public string? SiteAddress { get; set; }

        /// <summary>
        /// Site latitude for map display
        /// </summary>
        public decimal? SiteLatitude { get; set; }

        /// <summary>
        /// Site longitude for map display
        /// </summary>
        public decimal? SiteLongitude { get; set; }

        /// <summary>
        /// Fueling latitude captured from mobile app during authorization (if available)
        /// </summary>
        public decimal? FuelingLatitude { get; set; }

        /// <summary>
        /// Fueling longitude captured from mobile app during authorization (if available)
        /// </summary>
        public decimal? FuelingLongitude { get; set; }

        /// <summary>
        /// Accuracy of the fueling location (meters) from mobile app GPS
        /// </summary>
        public decimal? FuelingLocationAccuracy { get; set; }

        /// <summary>
        /// Source label for fueling location (e.g., MobileApp)
        /// </summary>
        public string? FuelingLocationSource { get; set; }

        /// <summary>
        /// User who performed/authorized the fueling
        /// </summary>
        public string? FueledBy { get; set; }

        /// <summary>
        /// User name of who performed the fueling
        /// </summary>
        public string? FueledByUserName { get; set; }

        /// <summary>
        /// Previous odometer/engine hours reading from last fueling event
        /// </summary>
        public decimal? PreviousOdometer { get; set; }

        /// <summary>
        /// Source of the previous odometer reading for audit purposes:
        /// "FuelRefill" = from manual FuelRefill.CurrentMeterReading
        /// "PumpTransaction" = from PTS Pumptransaction.Odometer
        /// "FuelRefill.PreviousMeterReading" = explicit previous reading stored in FuelRefill
        /// </summary>
        public string? PreviousOdometerSource { get; set; }

        /// <summary>
        /// Distance (km) or Engine Hours since last refuel (CurrentOdometer - PreviousOdometer).
        /// Use IsKmPerLiter to determine unit interpretation.
        /// </summary>
        public decimal? ConsumptionSinceLastRefuel { get; set; }

        /// <summary>
        /// Fuel efficiency calculated based on vehicle type:
        /// - For km/L vehicles (IsKmPerLiter=true): Distance / Volume = km/L
        /// - For L/hr vehicles (IsKmPerLiter=false): Volume / Hours = L/hr
        /// </summary>
        public decimal? FuelEfficiency { get; set; }

        /// <summary>
        /// True = vehicle uses km/L (distance-based), False = vehicle uses L/hr (engine hour-based).
        /// Determines how to interpret odometer and consumption values.
        /// </summary>
        public bool IsKmPerLiter { get; set; } = true;

        /// <summary>
        /// Fuel level before fueling (from GPS sensor if available)
        /// </summary>
        public decimal? FuelLevelBefore { get; set; }

        /// <summary>
        /// Fuel level after fueling (from GPS sensor if available)
        /// </summary>
        public decimal? FuelLevelAfter { get; set; }

        /// <summary>
        /// Driver name if assigned
        /// </summary>
        public string? DriverName { get; set; }

        /// <summary>
        /// Employee/Driver ID who performed the fueling
        /// </summary>
        public int? EmployeeId { get; set; }

        /// <summary>
        /// Employee/Driver name from Employee table
        /// </summary>
        public string? EmployeeName { get; set; }

        /// <summary>
        /// FuelRefill record ID if linked
        /// </summary>
        public int? FuelRefillId { get; set; }
    }
}