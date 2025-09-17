using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Features.Notifications;

namespace FMS.Domain.Entities;

public partial class Ptsdevice {
    public string Ptsid { get; set; } = null!;

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

    public virtual ICollection<Configuration> Configuration { get; set; } = new List<Configuration> ();

    public virtual ICollection<Intankdelivery> Intankdeliveries { get; set; } = new List<Intankdelivery> ();

    public virtual ICollection<PtsDevicePendingCommand> PtsDevicePendingCommands { get; set; } = new List<PtsDevicePendingCommand> ();

    public virtual ICollection<Pumptransaction> Pumptransactions { get; set; } = new List<Pumptransaction> ();
    public virtual ICollection<Tank> ? Tanks { get; set; }
    public virtual ICollection<PTSDeviceConnection> DeviceConnections { get; set; } = new List<PTSDeviceConnection> ();

    public virtual Site? SiteNavigation { get; set; }

    //Cursor: Navigation properties for notifications
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification> ();
    public virtual ICollection<NotificationPolicy> NotificationPolicies { get; set; } = new List<NotificationPolicy> ();

}