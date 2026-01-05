using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Features.Notifications;

namespace FMS.Domain.Entities;

public partial class Ptsdevice
{
    public string Ptsid { get; set; } = null!;

    /// <summary>
    /// Human-readable name for the PTS device
    /// </summary>
    public string? PtsName { get; set; }

    public string? Ipaddress { get; set; }

    public int? PortNumber { get; set; }

    public string? Login { get; set; }

    public string? Password { get; set; }

    public string? ProtocolSecurityType { get; set; }

    public string? AuthenticationType { get; set; }

    public int? Site { get; set; }

    //This means the device is allowed to connect to the server and save data to the database
    //ToDo: Check if this is the correct way to do this
    public sbyte IsActive { get; set; }

    public sbyte IsAuthenticated { get; set; }

    public sbyte WebSocketCapable { get; set; }

    public sbyte AllowedForDirectCommands { get; set; }

    public DateTime? LastActivity { get; set; }

    public string? ConnectionStatus { get; set; }

    //Cursor: Device-specific feature flag for auto-assigning user master tag when only vehicle is provided
    //This allows different PTS devices to have different behaviors based on firmware capabilities
    public sbyte? AutoAssignUserMasterTag { get; set; } = 0; // 0 = disabled, 1 = enabled

    // =====================================================
    // Location Validation Settings
    // =====================================================

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

    public virtual ICollection<Configuration> Configuration { get; set; } = new List<Configuration>();

    public virtual ICollection<Intankdelivery> Intankdeliveries { get; set; } = new List<Intankdelivery>();

    public virtual ICollection<PtsDevicePendingCommand> PtsDevicePendingCommands { get; set; } = new List<PtsDevicePendingCommand>();

    public virtual ICollection<Pumptransaction> Pumptransactions { get; set; } = new List<Pumptransaction>();
    public virtual ICollection<Tank>? Tanks { get; set; }
    public virtual ICollection<PTSDeviceConnection> DeviceConnections { get; set; } = new List<PTSDeviceConnection>();

    public virtual Site? SiteNavigation { get; set; }

    //Cursor: Navigation properties for notifications
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public virtual ICollection<NotificationPolicy> NotificationPolicies { get; set; } = new List<NotificationPolicy>();

}