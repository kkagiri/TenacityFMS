using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.Common;
using FMS.Application.Common;
using FMS.Application.Communication.SignalR;
using FMS.Application.Infrastructure.ErrorCodes.Common;
using FMS.Application.Infrastructure.Expections.Base;
using FMS.Application.ModelsDTOs.PTS;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FMS.Application.PTSServices.Configuration
{
    /// <summary>
    /// Service for managing PTS configuration settings
    /// </summary>
    public class ConfigurationService : IConfigurationService
    {
        private readonly ILogger<ConfigurationService> _logger;
        private readonly ICommandExecutor _commandExecution;
        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly SemaphoreSlim _authorizationLock = new(1, 1);

        public ConfigurationService(ILogger<ConfigurationService> logger, ICommandExecutor commandExecution, IHubContext<FrontEndHub> hubContext)
        {
            _logger = logger;
            _commandExecution = commandExecution;
            _hubContext = hubContext;
        }

        public Task<FMSResponseMessage<string>> GetConfigurationIdentifierAsync(string pTSDeviceId)
        {
            throw new System.NotImplementedException();
        }

        public Task<FMSResponseMessage<DailyProcessingTimeDTO>> GetDailyProcessingTimeAsync(string pTSDeviceId)
        {
            throw new System.NotImplementedException();
        }

        public Task<FMSResponseMessage<DateTimeResponseDTO>> GetDateTimeAsync(string pTSDeviceId)
        {
            throw new System.NotImplementedException();
        }

        public Task<FMSResponseMessage<ParameterDTO>> GetParameterAsync(string pTSDeviceId, string device, int? number, int address)
        {
            throw new System.NotImplementedException();
        }

        public Task<FMSResponseMessage<PtsNetworkSettingsDTO>> GetPtsNetworkSettingsAsync(string pTSDeviceId)
        {
            throw new System.NotImplementedException();
        }

        /// <summary>
        /// Gets the pump nozzles configuration for a specific device
        /// </summary>
        /// <param name="pTSDeviceId">The ID of the PTS device</param>
        /// <returns>A response message containing the pump nozzles configuration</returns>
        public async Task<FMSResponseMessage<PumpNozzlesConfigurationDTO>> GetPumpNozzlesConfigurationAsync(string pTSDeviceId)
        {
            try
            {
                //No command data is needed for this command
                var result = await _commandExecution.ExecuteCommandAsync(pTSDeviceId, "GetPumpNozzlesConfiguration", null);
                if (!result.Success)
                {
                    if (result.Code.HasValue)
                    {
                        var errorCode = (PtsErrorCode)result.Code.Value;
                        var errorMessage = EnumExtensions.GetDescription(errorCode);
                        throw new PTSDeviceException(errorMessage);
                    }
                    return new FMSResponseMessage<PumpNozzlesConfigurationDTO>(false, result.Message, null!);
                }
                if (result.CommandData == null)
                {
                    throw new InvalidOperationException("Pump nozzles configuration is missing");
                }
                //Convert the command data to a JObject
                var responseData = JObject.FromObject(result.CommandData);
                //Convert the JObject to a PumpNozzlesConfigurationDTO
                var pumpNozzlesConfiguration = responseData.ToObject<PumpNozzlesConfigurationDTO>();

                _hubContext.Clients.All.SendAsync("PumpNozzlesConfigurationRetrieved", pumpNozzlesConfiguration);


                return new FMSResponseMessage<PumpNozzlesConfigurationDTO>(true, "Pump nozzles configuration retrieved successfully", pumpNozzlesConfiguration);

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pump nozzles configuration for device {DeviceId}", pTSDeviceId);
                return new FMSResponseMessage<PumpNozzlesConfigurationDTO>(false, ex.Message, null!);
            }
        }

        public Task<FMSResponseMessage<RemoteServerConfigurationDTO>> GetRemoteServerConfigurationAsync(string pTSDeviceId)
        {
            throw new System.NotImplementedException();
        }

        public Task<FMSResponseMessage<SystemDecimalDigitsDTO>> GetSystemDecimalDigitsAsync(string pTSDeviceId)
        {
            throw new System.NotImplementedException();
        }

        public Task<FMSResponseMessage> SetDailyProcessingTimeAsync(string pTSDeviceId, DailyProcessingTimeDTO request)
        {
            throw new System.NotImplementedException();
        }

        public Task<FMSResponseMessage> SetDateTimeAsync(string pTSDeviceId, DateTimeRequestDTO request)
        {
            throw new System.NotImplementedException();
        }

        public Task<FMSResponseMessage> SetParameterAsync(string pTSDeviceId, string device, int? number, int address, string value)
        {
            throw new System.NotImplementedException();
        }

        public Task<FMSResponseMessage> SetPtsNetworkSettingsAsync(string pTSDeviceId, PtsNetworkSettingsDTO request)
        {
            throw new System.NotImplementedException();
        }

        public Task<FMSResponseMessage> SetRemoteServerConfigurationAsync(string pTSDeviceId, RemoteServerConfigurationDTO request)
        {
            throw new System.NotImplementedException();
        }

        public Task<FMSResponseMessage> SetSystemDecimalDigitsAsync(string pTSDeviceId, SystemDecimalDigitsDTO request)
        {
            throw new System.NotImplementedException();
        }
    }
}