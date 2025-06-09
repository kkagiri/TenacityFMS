using System;

namespace FMS.Application.Features.PTSDevice.DTOs
{
    public class CreatePTSDeviceDTO
    {
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
    }
}