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
    }
}