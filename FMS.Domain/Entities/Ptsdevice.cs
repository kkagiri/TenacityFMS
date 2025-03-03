using System;
using System.Collections.Generic;
using FMS.Domain.Entities;

namespace FMS.Domain.Entities;

public partial class Ptsdevice
{
    public string Ptsid { get; set; } = null!;

    public string? Ipaddress { get; set; }

    public int? PortNumber { get; set; }

    public string? Login { get; set; }

    public string? Password { get; set; }

    public string? ProtocolSecurityType { get; set; }

    public string? AuthenticationType { get; set; }

    public int? Site { get; set; }

    public sbyte IsActive { get; set; }

    public sbyte IsAuthenticated { get; set; }

    public sbyte WebSocketCapable { get; set; }

    public sbyte AllowedForDirectCommands { get; set; }

    public DateTime? LastActivity { get; set; }



    public virtual ICollection<Configuration> Configurations { get; set; } = new List<Configuration>();

    public virtual ICollection<Intankdelivery> Intankdeliveries { get; set; } = new List<Intankdelivery>();

    public virtual ICollection<PendingCommand> Pendingcommands { get; set; } = new List<PendingCommand>();

    public virtual ICollection<PtsDeviceCommand> PtsDeviceCommands { get; set; } = new List<PtsDeviceCommand>();

    public virtual ICollection<Pumptransaction> Pumptransactions { get; set; } = new List<Pumptransaction>();
    public virtual ICollection<Tank>? Tanks { get; set; }

    public virtual Site? SiteNavigation { get; set; }

}
