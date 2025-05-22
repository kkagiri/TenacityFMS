using System;

namespace FMS.Application.Features.PTS.DTOs {
    /// <summary>
    /// Data Transfer Object for PTS Device information
    /// </summary>
    public class PTSDeviceDto {
        /// <summary>
        /// The unique identifier for the PTS device
        /// </summary>
        public Guid Id { get; set; }

        /// <summary>
        /// The serial number of the device
        /// </summary>
        public string SerialNumber { get; set; }

        /// <summary>
        /// The type of the device
        /// </summary>
        public string DeviceType { get; set; }

        /// <summary>
        /// The site ID where the device is located
        /// </summary>
        public Guid SiteId { get; set; }

        /// <summary>
        /// The site name where the device is located
        /// </summary>
        public string SiteName { get; set; }

        /// <summary>
        /// The IP address of the device
        /// </summary>
        public string IpAddress { get; set; }

        /// <summary>
        /// The port number for device communication
        /// </summary>
        public int Port { get; set; }

        /// <summary>
        /// The current connection status of the device
        /// </summary>
        public string ConnectionStatus { get; set; }

        /// <summary>
        /// Flag indicating if the device is currently connected
        /// </summary>
        public bool IsConnected => ConnectionStatus == "Connected";

        /// <summary>
        /// The last time the device was connected
        /// </summary>
        public DateTime? LastConnectedAt { get; set; }

        /// <summary>
        /// The current firmware version of the device
        /// </summary>
        public string FirmwareVersion { get; set; }

        /// <summary>
        /// The last time the device's firmware was updated
        /// </summary>
        public DateTime? LastFirmwareUpdateAt { get; set; }
    }

    /// <summary>
    /// Data Transfer Object for PTS Device Status information
    /// </summary>
    public class PTSDeviceStatusDto {
        /// <summary>
        /// The device ID
        /// </summary>
        public Guid DeviceId { get; set; }

        /// <summary>
        /// The current connection status
        /// </summary>
        public string ConnectionStatus { get; set; }

        /// <summary>
        /// The current battery level percentage (if applicable)
        /// </summary>
        public decimal? BatteryLevel { get; set; }

        /// <summary>
        /// The current signal strength percentage (if applicable)
        /// </summary>
        public decimal? SignalStrength { get; set; }

        /// <summary>
        /// The current temperature in Celsius (if applicable)
        /// </summary>
        public decimal? Temperature { get; set; }

        /// <summary>
        /// The uptime in seconds
        /// </summary>
        public long Uptime { get; set; }

        /// <summary>
        /// Any error codes reported by the device
        /// </summary>
        public string ErrorCodes { get; set; }

        /// <summary>
        /// Flag indicating if the device is reporting any errors
        /// </summary>
        public bool HasErrors => !string.IsNullOrEmpty (ErrorCodes);
    }

    /// <summary>
    /// Data Transfer Object for PTS Command Result
    /// </summary>
    public class PTSCommandResultDto {
        /// <summary>
        /// The command that was sent
        /// </summary>
        public string Command { get; set; }

        /// <summary>
        /// Flag indicating if the command was successful
        /// </summary>
        public bool IsSuccess { get; set; }

        /// <summary>
        /// The response message from the device
        /// </summary>
        public string ResponseMessage { get; set; }

        /// <summary>
        /// Any error code returned by the device
        /// </summary>
        public string ErrorCode { get; set; }

        /// <summary>
        /// The timestamp when the command was executed
        /// </summary>
        public DateTime ExecutedAt { get; set; }
    }
}