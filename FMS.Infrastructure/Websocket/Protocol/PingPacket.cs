
using FMS.Domain.PTSCommon;

namespace FMS.Infrastructure.websocket.Protocol
{
    public class PingPacket : Packet
    {
        public PingPacket()
        {
            Type = "Ping";
            // Any other ping-specific properties
        }
    }

    public class PongPacket : Packet
    {
        public PongPacket()
        {
            Type = "Pong";
            Error = null;
            Message = null;

            // Any other pong-specific properties
        }
    }
}