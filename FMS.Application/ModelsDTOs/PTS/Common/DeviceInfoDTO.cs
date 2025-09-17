using FMS.Application.Features.PTS.Enum;

namespace FMS.Application.Features.PTS.Common;

public class DeviceInfoDTO {
    public string PtsId { get; set; }
    public string DeviceId => PtsId.ToString ();
    public string? IpAddress { get; set; }
    public int? PortNumber { get; set; }
    public bool IsAuthenticated { get; set; }
    public string? ProtocolSecurityType { get; set; }
    public string? AuthenticationType { get; set; }
    public int? SiteId { get; set; }
    public string? SiteName { get; set; }
    public bool IsActive { get; set; }

    // Communication capabilities
    public bool WebSocketCapable { get; set; }
    public bool AllowedForDirectCommands { get; set; }
    public bool CanReceivePushCommands => WebSocketCapable && AllowedForDirectCommands;

    public CommunicationMode PreferredCommunicationMode =>
        CanReceivePushCommands ? CommunicationMode.WebSocket : CommunicationMode.Http;
}