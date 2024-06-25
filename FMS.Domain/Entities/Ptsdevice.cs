using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Ptsdevice
{
    public int Ptsid { get; set; }

    public string? Ipaddress { get; set; }

    public int? PortNumber { get; set; }

    public string? Login { get; set; }

    public string? Password { get; set; }

    public string? ProtocolSecurityType { get; set; }

    public string? AuthenticationType { get; set; }

    public int? Site { get; set; }

    public virtual Site? SiteNavigation { get; set; }

    public virtual ICollection<Tank>? Tanks { get; set; }

    
}
