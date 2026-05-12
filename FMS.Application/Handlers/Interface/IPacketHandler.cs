using System.Threading.Tasks;
using FMS.Domain.PTSCommon;

namespace FMS.Application.Handlers.Interface
{
    public interface IPacketHandler
    {


        /// <summary>
        /// The packet type that this handler processes (e.g., "ReaderTag").
        /// </summary>
        string PacketType { get; }


        /// <summary>
        /// Handles the incoming packet.
        /// </summary>
        /// <param name="deviceId">ID of the device sending the packet.</param>
        /// <param name="packet">The packet data.</param>
        Task<Packet> HandlePacketAsync(string deviceId, Packet packet);
    }
}