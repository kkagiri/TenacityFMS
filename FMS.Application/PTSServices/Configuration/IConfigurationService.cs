using FMS.Application.Common;
using FMS.Application.Common.PTSResponse;
using FMS.Application.ModelsDTOs.PTS;
using System.Threading.Tasks;

namespace FMS.Application.PTSServices.Configuration
{
    public interface IConfigurationService
    {
        // Gets a unique configuration identifier
        Task<FMSResponseMessage<string>> GetConfigurationIdentifierAsync(string pTSDeviceId);



        // Retrieves current date and time configuration
        Task<FMSResponseMessage<DateTimeResponseDTO>> GetDateTimeAsync(string pTSDeviceId);

        // Sets date and time configuration
        Task<FMSResponseMessage> SetDateTimeAsync(string pTSDeviceId, DateTimeRequestDTO request);

        // Gets PTS network settings
        Task<FMSResponseMessage<PtsNetworkSettingsDTO>> GetPtsNetworkSettingsAsync(string pTSDeviceId);

        // Sets PTS network settings
        Task<FMSResponseMessage> SetPtsNetworkSettingsAsync(string pTSDeviceId, PtsNetworkSettingsDTO request);

        // Gets remote server configuration
        Task<FMSResponseMessage<RemoteServerConfigurationDTO>> GetRemoteServerConfigurationAsync(string pTSDeviceId);

        // Sets remote server configuration
        Task<FMSResponseMessage> SetRemoteServerConfigurationAsync(string pTSDeviceId, RemoteServerConfigurationDTO request);

        // Gets daily processing time settings
        Task<FMSResponseMessage<DailyProcessingTimeDTO>> GetDailyProcessingTimeAsync(string pTSDeviceId);

        // Sets daily processing time settings
        Task<FMSResponseMessage> SetDailyProcessingTimeAsync(string pTSDeviceId, DailyProcessingTimeDTO request);

        // Gets system decimal digits configuration
        Task<FMSResponseMessage<SystemDecimalDigitsDTO>> GetSystemDecimalDigitsAsync(string pTSDeviceId);

        // Sets system decimal digits configuration
        Task<FMSResponseMessage> SetSystemDecimalDigitsAsync(string pTSDeviceId, SystemDecimalDigitsDTO request);

        // Gets a parameter value
        Task<FMSResponseMessage<ParameterDTO>> GetParameterAsync(string pTSDeviceId, string device, int? number, int address);

        // Sets a parameter value
        Task<FMSResponseMessage> SetParameterAsync(string pTSDeviceId, string device, int? number, int address, string value);

        // Gets pump nozzles configuration: assignment of pump nozzles to fuel grades
        Task<FMSResponseMessage<PumpNozzlesConfigurationDTO>> GetPumpNozzlesConfigurationAsync(string pTSDeviceId);
    }
}