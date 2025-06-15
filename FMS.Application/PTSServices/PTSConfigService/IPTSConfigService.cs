//Cursor
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.PTS;
using FMS.Domain.PTSCommon.Responses; // Assuming a namespace for response DTOs
using System.Threading.Tasks;

namespace FMS.Application.PTSServices.PTSConfigService {
    public interface IPTSConfigService {
        Task<FMSResponse<DateTimeResponse>> GetDateTimeAsync (string ptsDeviceId);
        Task<FMSResponse<PtsNetworkSettingsResponse>> GetPtsNetworkSettingsAsync (string ptsDeviceId);
        Task<FMSResponse<PumpsConfigurationResponse>> GetPumpsConfigurationAsync (string ptsDeviceId);
        Task<FMSResponse<ProbesConfigurationResponse>> GetProbesConfigurationAsync (string ptsDeviceId);
        Task<FMSResponse<FuelGradesConfigurationResponse>> GetFuelGradesConfigurationAsync (string ptsDeviceId);
        Task<FMSResponse<TanksConfigurationResponse>> GetTanksConfigurationAsync (string ptsDeviceId);
        Task<FMSResponse<object>> GetFullDeviceDiagnosticsAsync (string ptsDeviceId); // For a more comprehensive diagnostic
    }
}