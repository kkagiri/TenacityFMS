using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Communication.webSocket;
using FMS.Domain.PTSCommon;

namespace FMS.Application.Communication.Connection {
    /// <summary>
    /// Manages PTS device connections
    /// </summary>
    public interface IPTSConnectionManager {

        /// <summary>
        /// Sends a message to a PTS device
        /// </summary>
        /// <param name="deviceId">The device ID</param>
        /// <param name="message">The message to send</param>
        /// <returns>The response from the device</returns>
        Task<PTSMessage> SendMessageAsync (string deviceId, string message);

        /// <summary>
        /// Checks if a connection is active for a device
        /// </summary>
        /// <param name="deviceId">The device ID</param>
        /// <returns>True if the connection is active, false otherwise</returns>

        bool HasActiveConnection (string deviceId);
        /// <summary>
        /// Checks if a connection is valid for a device
        /// </summary>
        /// <param name="deviceId">The device ID</param>
        /// <returns>True if the connection is valid, false otherwise</returns>
        Task<bool> IsConnectionValid (string deviceId);
        /// <summary>
        /// Gets all connected devices
        /// </summary>
        /// <returns>A list of connected devices</returns>
        IEnumerable<string> GetConnectedDevices ();
        /// <summary>
        /// Adds a connection for a device
        /// </summary>
        /// <param name="deviceId">The device ID</param>
        /// <param name="connection">The connection to add</param>
        void AddConnection (string deviceId, PTSDeviceConnection connection);

        void RemoveConnection (string deviceId);

    }
}