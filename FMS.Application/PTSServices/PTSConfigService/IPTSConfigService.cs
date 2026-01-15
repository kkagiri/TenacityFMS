//Cursor
using FMS.Application.Common;
using FMS.Application.Features.PTS;
using FMS.Domain.PTSCommon.Responses; // Assuming a namespace for response DTOs
using System.Threading.Tasks;

namespace FMS.Application.PTSServices.PTSConfigService
{
    public interface IPTSConfigService
    {
        Task<FMSResponse<DateTimeResponse>> GetDateTimeAsync(string ptsDeviceId);
        Task<FMSResponse<PtsNetworkSettingsResponse>> GetPtsNetworkSettingsAsync(string ptsDeviceId);
        Task<FMSResponse<PumpsConfigurationResponse>> GetPumpsConfigurationAsync(string ptsDeviceId);
        Task<FMSResponse<ProbesConfigurationResponse>> GetProbesConfigurationAsync(string ptsDeviceId);
        Task<FMSResponse<FuelGradesConfigurationResponse>> GetFuelGradesConfigurationAsync(string ptsDeviceId);
        Task<FMSResponse<TanksConfigurationResponse>> GetTanksConfigurationAsync(string ptsDeviceId);
        Task<FMSResponse<object>> GetFullDeviceDiagnosticsAsync(string ptsDeviceId); // For a more comprehensive diagnostic

        /// <summary>
        /// Gets the remote server configuration from the PTS device.
        /// This includes HTTP upload settings, WebSocket settings, and server connection details.
        /// </summary>
        Task<FMSResponse<RemoteServerConfigurationResponse>> GetRemoteServerConfigurationAsync(string ptsDeviceId);

        /// <summary>
        /// Sets the remote server configuration on the PTS device.
        /// Only the properties that are set (non-null) will be updated on the device.
        /// </summary>
        Task<FMSResponse<bool>> SetRemoteServerConfigurationAsync(string ptsDeviceId, SetRemoteServerConfigurationRequest request);

        /// <summary>
        /// Enables WebSocket UploadStatus on a PTS device.
        /// Convenience method that sets WebsocketsUploadStatus = true and configures the period.
        /// </summary>
        Task<FMSResponse<bool>> EnableWebSocketUploadStatusAsync(string ptsDeviceId, int periodSeconds = 10);

        /// <summary>
        /// Disables WebSocket UploadStatus on a PTS device.
        /// </summary>
        Task<FMSResponse<bool>> DisableWebSocketUploadStatusAsync(string ptsDeviceId);

        /// <summary>
        /// Sets the pumps configuration on the PTS device (ports and pump assignments).
        /// Based on protocol 49. SetPumpsConfiguration
        /// </summary>
        Task<FMSResponse<bool>> SetPumpsConfigurationAsync(string ptsDeviceId, SetPumpsConfigurationRequest request);

        /// <summary>
        /// Gets the pump nozzles configuration from the PTS device.
        /// Based on protocol 66. GetPumpNozzlesConfiguration
        /// </summary>
        Task<FMSResponse<PumpNozzlesConfigurationResponse>> GetPumpNozzlesConfigurationAsync(string ptsDeviceId);

        /// <summary>
        /// Sets the pump nozzles configuration on the PTS device.
        /// Based on protocol 67. SetPumpNozzlesConfiguration
        /// </summary>
        Task<FMSResponse<bool>> SetPumpNozzlesConfigurationAsync(string ptsDeviceId, SetPumpNozzlesConfigurationRequest request);
    }
}