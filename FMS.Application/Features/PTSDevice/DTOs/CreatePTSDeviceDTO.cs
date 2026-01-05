using System;

namespace FMS.Application.Features.PTSDevice.DTOs
{
    public class CreatePTSDeviceDTO
    {
        /// <summary>
        /// Human-readable name for the PTS device
        /// </summary>
        public string? PtsName { get; set; }

        public string Ipaddress { get; set; }
        public int PortNumber { get; set; }
        public string Login { get; set; }
        public string? Password { get; set; }

        public DateTime? LastActivity { get; set; }
        public string? ProtocolSecurityType { get; set; }
        public bool IsActive { get; set; }
        public string? AuthenticationType { get; set; }
        public bool IsAuthenticated { get; set; }
        public bool WebSocketCapable { get; set; }
        public bool AllowedForDirectCommands { get; set; }
        public int? Site { get; set; }

        // Location Validation Settings
        /// <summary>
        /// Enable location-based validation for this PTS device.
        /// When enabled, checks vehicle and/or mobile app proximity to tank.
        /// </summary>
        public sbyte EnableLocationValidation { get; set; } = 0;

        /// <summary>
        /// Require the receiving vehicle to be near the tank/dispenser for fueling.
        /// Only applies to vehicles with GPS tracking enabled.
        /// </summary>
        public sbyte RequireVehicleProximity { get; set; } = 0;

        /// <summary>
        /// Require the mobile app operator to be near the tank/dispenser.
        /// Uses device geolocation from the mobile app.
        /// </summary>
        public sbyte RequireMobileAppProximity { get; set; } = 0;

        /// <summary>
        /// Radius in meters for vehicle proximity validation. Default 100m.
        /// </summary>
        public int? VehicleProximityRadius { get; set; } = 100;

        /// <summary>
        /// Radius in meters for mobile app proximity validation. Default 50m.
        /// </summary>
        public int? MobileAppProximityRadius { get; set; } = 50;

        /// <summary>
        /// Allow fueling if GPS location is temporarily unavailable.
        /// Provides graceful degradation when GPS fails.
        /// </summary>
        public sbyte BypassOnGPSFailure { get; set; } = 1;

        /// <summary>
        /// Minimum required GPS accuracy in meters (lower is better). Default 20m.
        /// Locations with accuracy worse than this threshold may be rejected or warned.
        /// </summary>
        public int? MinimumGPSAccuracy { get; set; } = 20;

        /// <summary>
        /// Grace period in meters added to proximity radius. Default 10m.
        /// Allows slight tolerance (e.g., 110m actual when 100m radius = pass with 10m grace).
        /// </summary>
        public int? ProximityGracePeriodMeters { get; set; } = 10;
    }
}