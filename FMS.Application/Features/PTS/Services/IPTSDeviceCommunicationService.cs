using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Core.Common.Responses;
using FMS.Application.Features.PTS.DTOs;

namespace FMS.Application.Features.PTS.Services {
    /// <summary>
    /// Interface for communication with PTS devices
    /// </summary>
    public interface IPTSDeviceCommunicationService {
        /// <summary>
        /// Connects to a PTS device
        /// </summary>
        /// <param name="deviceId">The ID of the device to connect to</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>A response indicating success or failure</returns>
        Task<FMSResponse> ConnectDeviceAsync (Guid deviceId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Disconnects from a PTS device
        /// </summary>
        /// <param name="deviceId">The ID of the device to disconnect from</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>A response indicating success or failure</returns>
        Task<FMSResponse> DisconnectDeviceAsync (Guid deviceId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the current status of a PTS device
        /// </summary>
        /// <param name="deviceId">The ID of the device to get status for</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>A response containing the device status</returns>
        Task<FMSResponse<PTSDeviceStatusDto>> GetDeviceStatusAsync (Guid deviceId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Sends a command to a PTS device
        /// </summary>
        /// <param name="deviceId">The ID of the device to send the command to</param>
        /// <param name="command">The command to send</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>A response containing the command result</returns>
        Task<FMSResponse<PTSCommandResultDto>> SendCommandAsync (Guid deviceId, string command, CancellationToken cancellationToken = default);

        /// <summary>
        /// Updates the firmware of a PTS device
        /// </summary>
        /// <param name="deviceId">The ID of the device to update</param>
        /// <param name="firmwareVersion">The firmware version to update to</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>A response indicating success or failure</returns>
        Task<FMSResponse> UpdateFirmwareAsync (Guid deviceId, string firmwareVersion, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a list of available PTS devices
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>A response containing the list of devices</returns>
        Task<FMSResponse<List<PTSDeviceDto>>> GetAvailableDevicesAsync (CancellationToken cancellationToken = default);
    }
}