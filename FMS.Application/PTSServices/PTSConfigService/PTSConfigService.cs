/**
 * File: PTSConfigService.cs
 * Purpose: Implements PTS configuration and calibration operations over the command-execution pipeline.
 * Dependencies: ICommandExecutor, FMSResponse, Newtonsoft.Json.Linq, PTS DTOs
 * Last Modified: 2026-03-23
 *
 * Key Methods:
 * - GetRemoteServerConfigurationAsync: Reads remote communication settings from a PTS device.
 * - GetTankCalibrationChartRecordsAsync: Reads manual calibration chart records from a probe.
 * - GenerateTankAutomaticCalibrationChartAsync: Triggers automatic calibration chart generation on the controller.
 */
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.Common;
using FMS.Application.Common;
using FMS.Application.Features.PTS.DTOs;
using FMS.Application.Infrastructure.Expections.Base;
using FMS.Application.PTSServices.PTSConfigService;
using FMS.Domain.Entities.PTS;
using FMS.Domain.PTSCommon.Responses;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.PTSServices.PTSConfigService
{
    public class PTSConfigService : IPTSConfigService
    {
        private readonly ICommandExecutor _commandExecutor;
        private readonly ILogger<PTSConfigService> _logger;

        public PTSConfigService(ICommandExecutor commandExecutor, ILogger<PTSConfigService> logger)
        {
            _commandExecutor = commandExecutor;
            _logger = logger;
        }

        public async Task<FMSResponse<DateTimeResponse>> GetDateTimeAsync(string ptsDeviceId)
        {
            try
            {
                _logger.LogInformation("Requesting DateTime from PTS device {DeviceId}", ptsDeviceId);
                var result = await _commandExecutor.ExecuteCommandAsync(ptsDeviceId, "GetDateTime", null);

                if (!result.Success || result.CommandData == null)
                {
                    _logger.LogWarning("Failed to get DateTime from PTS device {DeviceId}. Error: {ErrorMessage}, Code: {ErrorCode}",
                        ptsDeviceId, result.Message, result.Code);
                    return FMSResponse<DateTimeResponse>.Failed(result.Message ?? "Failed to retrieve DateTime from device.");
                }

                var data = JObject.FromObject(result.CommandData);
                var dateTimeResponse = data.ToObject<DateTimeResponse>();

                if (dateTimeResponse == null)
                {
                    _logger.LogError("Failed to parse DateTime response from PTS device {DeviceId}. Data: {CommandData}", ptsDeviceId, result.CommandData);
                    return FMSResponse<DateTimeResponse>.Failed("Failed to parse DateTime response from device");
                }

                return FMSResponse<DateTimeResponse>.Success(dateTimeResponse, "DateTime retrieved successfully");
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "PTS Device Error while getting DateTime for device {DeviceId}", ptsDeviceId);
                return FMSResponse<DateTimeResponse>.Failed(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting DateTime for device {DeviceId}", ptsDeviceId);
                return FMSResponse<DateTimeResponse>.Failed("Internal server error while getting DateTime");
            }
        }

        public async Task<FMSResponse<PumpsConfigurationResponse>> GetPumpsConfigurationAsync(string ptsDeviceId)
        {
            try
            {
                _logger.LogInformation("Requesting Pumps Configuration from PTS device {DeviceId}", ptsDeviceId);
                var result = await _commandExecutor.ExecuteCommandAsync(ptsDeviceId, "GetPumpsConfiguration", null);

                if (!result.Success || result.CommandData == null)
                {
                    _logger.LogWarning("Failed to get Pumps Configuration from PTS device {DeviceId}. Error: {ErrorMessage}, Code: {ErrorCode}",
                        ptsDeviceId, result.Message, result.Code);
                    return FMSResponse<PumpsConfigurationResponse>.Failed(result.Message ?? "Failed to retrieve Pumps Configuration from device.");
                }

                var data = JObject.FromObject(result.CommandData);
                var pumpsConfigResponse = data.ToObject<PumpsConfigurationResponse>();

                if (pumpsConfigResponse == null)
                {
                    _logger.LogError("Failed to parse Pumps Configuration response from PTS device {DeviceId}. Data: {CommandData}", ptsDeviceId, result.CommandData);
                    return FMSResponse<PumpsConfigurationResponse>.Failed("Failed to parse Pumps Configuration response from device");
                }

                return FMSResponse<PumpsConfigurationResponse>.Success(pumpsConfigResponse, "Pumps Configuration retrieved successfully");
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "PTS Device Error while getting Pumps Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<PumpsConfigurationResponse>.Failed(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Pumps Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<PumpsConfigurationResponse>.Failed("Internal server error while getting Pumps Configuration");
            }
        }

        public async Task<FMSResponse<object>> GetFullDeviceDiagnosticsAsync(string ptsDeviceId)
        {
            try
            {
                _logger.LogInformation("Requesting full diagnostics from PTS device {DeviceId}", ptsDeviceId);
                var result = await _commandExecutor.ExecuteCommandAsync(ptsDeviceId, "MakeDiagnostics", null);

                if (!result.Success || result.CommandData == null)
                {
                    _logger.LogWarning("Failed to get full diagnostics from PTS device {DeviceId}. Error: {ErrorMessage}, Code: {ErrorCode}",
                        ptsDeviceId, result.Message, result.Code);
                    return FMSResponse<object>.Failed(result.Message ?? "Failed to retrieve diagnostics from device.");
                }

                // The "MakeDiagnostics" command returns a complex object.
                // We can return it as is, or map it to a more specific DTO if one is created.
                return FMSResponse<object>.Success(result.CommandData, "Diagnostics retrieved successfully");
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "PTS Device Error while getting diagnostics for device {DeviceId}", ptsDeviceId);
                return FMSResponse<object>.Failed(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting diagnostics for device {DeviceId}", ptsDeviceId);
                return FMSResponse<object>.Failed("Internal server error getting diagnostics");
            }
        }

        public Task<FMSResponse<PtsNetworkSettingsResponse>> GetPtsNetworkSettingsAsync(string ptsDeviceId)
        {
            _logger.LogWarning("GetPtsNetworkSettingsAsync is not yet implemented.");
            throw new NotImplementedException();
        }

        public async Task<FMSResponse<ProbesConfigurationResponse>> GetProbesConfigurationAsync(string ptsDeviceId)
        {
            try
            {
                _logger.LogInformation("Requesting Probes Configuration from PTS device {DeviceId}", ptsDeviceId);
                var result = await _commandExecutor.ExecuteCommandAsync(ptsDeviceId, "GetProbesConfiguration", null);

                if (!result.Success || result.CommandData == null)
                {
                    _logger.LogWarning("Failed to get Probes Configuration from PTS device {DeviceId}. Error: {ErrorMessage}, Code: {ErrorCode}",
                        ptsDeviceId, result.Message, result.Code);
                    return FMSResponse<ProbesConfigurationResponse>.Failed(result.Message ?? "Failed to retrieve Probes Configuration from device.");
                }

                var data = JObject.FromObject(result.CommandData);
                var probesConfigResponse = data.ToObject<ProbesConfigurationResponse>();

                if (probesConfigResponse == null)
                {
                    _logger.LogError("Failed to parse Probes Configuration response from PTS device {DeviceId}. Data: {CommandData}", ptsDeviceId, result.CommandData);
                    return FMSResponse<ProbesConfigurationResponse>.Failed("Failed to parse Probes Configuration response from device");
                }

                return FMSResponse<ProbesConfigurationResponse>.Success(probesConfigResponse, "Probes Configuration retrieved successfully");
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "PTS Device Error while getting Probes Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<ProbesConfigurationResponse>.Failed(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Probes Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<ProbesConfigurationResponse>.Failed("Internal server error while getting Probes Configuration");
            }
        }

        public Task<FMSResponse<FuelGradesConfigurationResponse>> GetFuelGradesConfigurationAsync(string ptsDeviceId)
        {
            _logger.LogWarning("GetFuelGradesConfigurationAsync is not yet implemented.");
            throw new NotImplementedException();
        }

        public Task<FMSResponse<TanksConfigurationResponse>> GetTanksConfigurationAsync(string ptsDeviceId)
        {
            _logger.LogWarning("GetTanksConfigurationAsync is not yet implemented.");
            throw new NotImplementedException();
        }

        /// <summary>
        /// Gets the remote server configuration from the PTS device.
        /// </summary>
        public async Task<FMSResponse<RemoteServerConfigurationResponse>> GetRemoteServerConfigurationAsync(string ptsDeviceId)
        {
            try
            {
                _logger.LogInformation("Requesting Remote Server Configuration from PTS device {DeviceId}", ptsDeviceId);
                var result = await _commandExecutor.ExecuteCommandAsync(ptsDeviceId, "GetRemoteServerConfiguration", null);

                if (!result.Success || result.CommandData == null)
                {
                    _logger.LogWarning("Failed to get Remote Server Configuration from PTS device {DeviceId}. Error: {ErrorMessage}, Code: {ErrorCode}",
                        ptsDeviceId, result.Message, result.Code);
                    return FMSResponse<RemoteServerConfigurationResponse>.Failed(result.Message ?? "Failed to retrieve Remote Server Configuration from device.");
                }

                var data = JObject.FromObject(result.CommandData);
                var configResponse = data.ToObject<RemoteServerConfigurationResponse>();

                if (configResponse == null)
                {
                    _logger.LogError("Failed to parse Remote Server Configuration response from PTS device {DeviceId}. Data: {CommandData}", ptsDeviceId, result.CommandData);
                    return FMSResponse<RemoteServerConfigurationResponse>.Failed("Failed to parse Remote Server Configuration response from device");
                }

                _logger.LogInformation("Successfully retrieved Remote Server Configuration from device {DeviceId}. WebsocketsUploadStatus={WebsocketsUploadStatus}",
                    ptsDeviceId, configResponse.WebsocketsUploadStatus);

                return FMSResponse<RemoteServerConfigurationResponse>.Success(configResponse, "Remote Server Configuration retrieved successfully");
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "PTS Device Error while getting Remote Server Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<RemoteServerConfigurationResponse>.Failed(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Remote Server Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<RemoteServerConfigurationResponse>.Failed("Internal server error while getting Remote Server Configuration");
            }
        }

        /// <summary>
        /// Sets the remote server configuration on the PTS device.
        /// </summary>
        public async Task<FMSResponse<bool>> SetRemoteServerConfigurationAsync(string ptsDeviceId, SetRemoteServerConfigurationRequest request)
        {
            try
            {
                _logger.LogInformation("Setting Remote Server Configuration on PTS device {DeviceId}", ptsDeviceId);

                // Build the command data - only include non-null properties
                var commandData = BuildSetConfigurationData(request);

                _logger.LogDebug("SetRemoteServerConfiguration command data: {CommandData}",
                    commandData.ToString(Newtonsoft.Json.Formatting.None));

                var result = await _commandExecutor.ExecuteCommandAsync(ptsDeviceId, "SetRemoteServerConfiguration", commandData);

                if (!result.Success)
                {
                    _logger.LogWarning("Failed to set Remote Server Configuration on PTS device {DeviceId}. Error: {ErrorMessage}, Code: {ErrorCode}",
                        ptsDeviceId, result.Message, result.Code);
                    return FMSResponse<bool>.Failed(result.Message ?? "Failed to set Remote Server Configuration on device.");
                }

                _logger.LogInformation("Successfully set Remote Server Configuration on device {DeviceId}", ptsDeviceId);
                return FMSResponse<bool>.Success(true, "Remote Server Configuration updated successfully");
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "PTS Device Error while setting Remote Server Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<bool>.Failed(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting Remote Server Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<bool>.Failed("Internal server error while setting Remote Server Configuration");
            }
        }

        /// <summary>
        /// Enables WebSocket UploadStatus on a PTS device.
        /// </summary>
        public async Task<FMSResponse<bool>> EnableWebSocketUploadStatusAsync(string ptsDeviceId, int periodSeconds = 10)
        {
            _logger.LogInformation("Enabling WebSocket UploadStatus on device {DeviceId} with period {PeriodSeconds}s", ptsDeviceId, periodSeconds);

            var request = new SetRemoteServerConfigurationRequest
            {
                WebsocketsUploadStatus = true,
                WebsocketsUploadStatusRequestsPeriodSeconds = periodSeconds
            };

            return await SetRemoteServerConfigurationAsync(ptsDeviceId, request);
        }

        /// <summary>
        /// Disables WebSocket UploadStatus on a PTS device.
        /// </summary>
        public async Task<FMSResponse<bool>> DisableWebSocketUploadStatusAsync(string ptsDeviceId)
        {
            _logger.LogInformation("Disabling WebSocket UploadStatus on device {DeviceId}", ptsDeviceId);

            var request = new SetRemoteServerConfigurationRequest
            {
                WebsocketsUploadStatus = false
            };

            return await SetRemoteServerConfigurationAsync(ptsDeviceId, request);
        }

        /// <summary>
        /// Builds a JObject with only non-null properties from the request.
        /// </summary>
        private JObject BuildSetConfigurationData(SetRemoteServerConfigurationRequest request)
        {
            var data = new JObject();

            // Server Address
            if (request.IpAddress != null) data["IpAddress"] = JArray.FromObject(request.IpAddress);
            if (request.DomainName != null) data["DomainName"] = request.DomainName;
            if (request.UserId.HasValue) data["UserId"] = request.UserId.Value;
            if (request.ProtocolType != null) data["ProtocolType"] = request.ProtocolType;
            if (request.ServerResponseTimeoutSeconds.HasValue) data["ServerResponseTimeoutSeconds"] = request.ServerResponseTimeoutSeconds.Value;
            if (request.UseDeviceIdentifierAsLogin.HasValue) data["UseDeviceIdentifierAsLogin"] = request.UseDeviceIdentifierAsLogin.Value;

            // HTTP Upload Settings
            if (request.UploadPumpTransactions.HasValue) data["UploadPumpTransactions"] = request.UploadPumpTransactions.Value;
            if (request.UploadPumpTransactionsUri != null) data["UploadPumpTransactionsUri"] = request.UploadPumpTransactionsUri;
            if (request.UploadTankMeasurements.HasValue) data["UploadTankMeasurements"] = request.UploadTankMeasurements.Value;
            if (request.UploadTankMeasurementsUri != null) data["UploadTankMeasurementsUri"] = request.UploadTankMeasurementsUri;
            if (request.UploadInTankDeliveries.HasValue) data["UploadInTankDeliveries"] = request.UploadInTankDeliveries.Value;
            if (request.UploadInTankDeliveriesUri != null) data["UploadInTankDeliveriesUri"] = request.UploadInTankDeliveriesUri;
            if (request.UploadGpsRecords.HasValue) data["UploadGpsRecords"] = request.UploadGpsRecords.Value;
            if (request.UploadGpsRecordsUri != null) data["UploadGpsRecordsUri"] = request.UploadGpsRecordsUri;
            if (request.UploadAlertRecords.HasValue) data["UploadAlertRecords"] = request.UploadAlertRecords.Value;
            if (request.UploadAlertRecordsUri != null) data["UploadAlertRecordsUri"] = request.UploadAlertRecordsUri;
            if (request.UploadConfiguration.HasValue) data["UploadConfiguration"] = request.UploadConfiguration.Value;
            if (request.UploadConfigurationUri != null) data["UploadConfigurationUri"] = request.UploadConfigurationUri;
            if (request.UploadStatus.HasValue) data["UploadStatus"] = request.UploadStatus.Value;
            if (request.UploadStatusUri != null) data["UploadStatusUri"] = request.UploadStatusUri;
            if (request.UploadStatusRequestsPeriodSeconds.HasValue) data["UploadStatusRequestsPeriodSeconds"] = request.UploadStatusRequestsPeriodSeconds.Value;
            if (request.RequestTagsInformation.HasValue) data["RequestTagsInformation"] = request.RequestTagsInformation.Value;
            if (request.RequestTagsInformationUri != null) data["RequestTagsInformationUri"] = request.RequestTagsInformationUri;
            if (request.Port.HasValue) data["Port"] = request.Port.Value;
            if (request.SecretKey != null) data["SecretKey"] = request.SecretKey;
            if (request.UpdateSecretKey.HasValue) data["UpdateSecretKey"] = request.UpdateSecretKey.Value;

            // WebSocket Settings
            if (request.WebsocketsUri != null) data["WebsocketsUri"] = request.WebsocketsUri;
            if (request.WebsocketsPort.HasValue) data["WebsocketsPort"] = request.WebsocketsPort.Value;
            if (request.WebsocketsUploadPumpTransactions.HasValue) data["WebsocketsUploadPumpTransactions"] = request.WebsocketsUploadPumpTransactions.Value;
            if (request.WebsocketsUploadTankMeasurements.HasValue) data["WebsocketsUploadTankMeasurements"] = request.WebsocketsUploadTankMeasurements.Value;
            if (request.WebsocketsUploadInTankDeliveries.HasValue) data["WebsocketsUploadInTankDeliveries"] = request.WebsocketsUploadInTankDeliveries.Value;
            if (request.WebsocketsUploadGpsRecords.HasValue) data["WebsocketsUploadGpsRecords"] = request.WebsocketsUploadGpsRecords.Value;
            if (request.WebsocketsUploadAlertRecords.HasValue) data["WebsocketsUploadAlertRecords"] = request.WebsocketsUploadAlertRecords.Value;
            if (request.WebsocketsUploadConfiguration.HasValue) data["WebsocketsUploadConfiguration"] = request.WebsocketsUploadConfiguration.Value;
            if (request.WebsocketsUploadStatus.HasValue) data["WebsocketsUploadStatus"] = request.WebsocketsUploadStatus.Value;
            if (request.WebsocketsUploadStatusRequestsPeriodSeconds.HasValue) data["WebsocketsUploadStatusRequestsPeriodSeconds"] = request.WebsocketsUploadStatusRequestsPeriodSeconds.Value;
            if (request.WebsocketsRequestTagsInformation.HasValue) data["WebsocketsRequestTagsInformation"] = request.WebsocketsRequestTagsInformation.Value;
            if (request.UseWebsocketsCommunication.HasValue) data["UseWebsocketsCommunication"] = request.UseWebsocketsCommunication.Value;

            return data;
        }

        /// <summary>
        /// Sets the pumps configuration on the PTS device.
        /// Based on protocol 49. SetPumpsConfiguration
        /// </summary>
        public async Task<FMSResponse<bool>> SetPumpsConfigurationAsync(string ptsDeviceId, SetPumpsConfigurationRequest request)
        {
            try
            {
                _logger.LogInformation("Setting Pumps Configuration on PTS device {DeviceId}", ptsDeviceId);

                var commandData = new JObject();
                if (request.Ports != null && request.Ports.Count > 0)
                {
                    commandData["Ports"] = JArray.FromObject(request.Ports);
                }
                if (request.Pumps != null && request.Pumps.Count > 0)
                {
                    commandData["Pumps"] = JArray.FromObject(request.Pumps);
                }

                _logger.LogDebug("SetPumpsConfiguration command data: {CommandData}",
                    commandData.ToString(Newtonsoft.Json.Formatting.None));

                var result = await _commandExecutor.ExecuteCommandAsync(ptsDeviceId, "SetPumpsConfiguration", commandData);

                if (!result.Success)
                {
                    _logger.LogWarning("Failed to set Pumps Configuration on PTS device {DeviceId}. Error: {ErrorMessage}, Code: {ErrorCode}",
                        ptsDeviceId, result.Message, result.Code);
                    return FMSResponse<bool>.Failed(result.Message ?? "Failed to set Pumps Configuration on device.");
                }

                _logger.LogInformation("Successfully set Pumps Configuration on device {DeviceId}", ptsDeviceId);
                return FMSResponse<bool>.Success(true, "Pumps Configuration updated successfully");
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "PTS Device Error while setting Pumps Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<bool>.Failed(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting Pumps Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<bool>.Failed("Internal server error while setting Pumps Configuration");
            }
        }

        /// <summary>
        /// Gets the pump nozzles configuration from the PTS device.
        /// Based on protocol 66. GetPumpNozzlesConfiguration
        /// </summary>
        public async Task<FMSResponse<PumpNozzlesConfigurationResponse>> GetPumpNozzlesConfigurationAsync(string ptsDeviceId)
        {
            try
            {
                _logger.LogInformation("Requesting Pump Nozzles Configuration from PTS device {DeviceId}", ptsDeviceId);
                var result = await _commandExecutor.ExecuteCommandAsync(ptsDeviceId, "GetPumpNozzlesConfiguration", null);

                if (!result.Success || result.CommandData == null)
                {
                    _logger.LogWarning("Failed to get Pump Nozzles Configuration from PTS device {DeviceId}. Error: {ErrorMessage}, Code: {ErrorCode}",
                        ptsDeviceId, result.Message, result.Code);
                    return FMSResponse<PumpNozzlesConfigurationResponse>.Failed(result.Message ?? "Failed to retrieve Pump Nozzles Configuration from device.");
                }

                var data = JObject.FromObject(result.CommandData);
                var nozzlesConfigResponse = data.ToObject<PumpNozzlesConfigurationResponse>();

                if (nozzlesConfigResponse == null)
                {
                    _logger.LogError("Failed to parse Pump Nozzles Configuration response from PTS device {DeviceId}. Data: {CommandData}", ptsDeviceId, result.CommandData);
                    return FMSResponse<PumpNozzlesConfigurationResponse>.Failed("Failed to parse Pump Nozzles Configuration response from device");
                }

                _logger.LogInformation("Successfully retrieved Pump Nozzles Configuration from device {DeviceId}. PumpNozzles count: {Count}",
                    ptsDeviceId, nozzlesConfigResponse.PumpNozzles?.Count ?? 0);

                return FMSResponse<PumpNozzlesConfigurationResponse>.Success(nozzlesConfigResponse, "Pump Nozzles Configuration retrieved successfully");
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "PTS Device Error while getting Pump Nozzles Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<PumpNozzlesConfigurationResponse>.Failed(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Pump Nozzles Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<PumpNozzlesConfigurationResponse>.Failed("Internal server error while getting Pump Nozzles Configuration");
            }
        }

        /// <summary>
        /// Sets the pump nozzles configuration on the PTS device.
        /// Based on protocol 67. SetPumpNozzlesConfiguration
        /// </summary>
        public async Task<FMSResponse<bool>> SetPumpNozzlesConfigurationAsync(string ptsDeviceId, SetPumpNozzlesConfigurationRequest request)
        {
            try
            {
                _logger.LogInformation("Setting Pump Nozzles Configuration on PTS device {DeviceId}", ptsDeviceId);

                var commandData = new JObject();
                if (request.PumpNozzles != null && request.PumpNozzles.Count > 0)
                {
                    commandData["PumpNozzles"] = JArray.FromObject(request.PumpNozzles);
                }

                _logger.LogDebug("SetPumpNozzlesConfiguration command data: {CommandData}",
                    commandData.ToString(Newtonsoft.Json.Formatting.None));

                var result = await _commandExecutor.ExecuteCommandAsync(ptsDeviceId, "SetPumpNozzlesConfiguration", commandData);

                if (!result.Success)
                {
                    _logger.LogWarning("Failed to set Pump Nozzles Configuration on PTS device {DeviceId}. Error: {ErrorMessage}, Code: {ErrorCode}",
                        ptsDeviceId, result.Message, result.Code);
                    return FMSResponse<bool>.Failed(result.Message ?? "Failed to set Pump Nozzles Configuration on device.");
                }

                _logger.LogInformation("Successfully set Pump Nozzles Configuration on device {DeviceId}", ptsDeviceId);
                return FMSResponse<bool>.Success(true, "Pump Nozzles Configuration updated successfully");
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "PTS Device Error while setting Pump Nozzles Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<bool>.Failed(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting Pump Nozzles Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<bool>.Failed("Internal server error while setting Pump Nozzles Configuration");
            }
        }

        public Task<FMSResponse<ProbeChartTotalRecordsResponse>> GetTankCalibrationChartTotalRecordsNumberAsync(string ptsDeviceId, int probeNumber)
        {
            var validationErrors = ValidateProbeNumber(probeNumber);
            if (validationErrors.Count > 0)
            {
                return Task.FromResult(FMSResponse<ProbeChartTotalRecordsResponse>.ValidationFailed(validationErrors));
            }

            return ExecuteProbeDataCommandAsync<ProbeChartTotalRecordsResponse>(
                ptsDeviceId,
                "ProbeGetTankCalibrationChartTotalRecordsNumber",
                BuildProbeCommandData(probeNumber),
                "tank calibration chart total records");
        }

        public Task<FMSResponse<ProbeTankChartRecordsResponse>> GetTankCalibrationChartRecordsAsync(string ptsDeviceId, int probeNumber, int? startNumber = null, int? totalNumber = null)
        {
            var validationErrors = ValidateProbeRequest(probeNumber, startNumber, totalNumber);
            if (validationErrors.Count > 0)
            {
                return Task.FromResult(FMSResponse<ProbeTankChartRecordsResponse>.ValidationFailed(validationErrors));
            }

            return ExecuteProbeDataCommandAsync<ProbeTankChartRecordsResponse>(
                ptsDeviceId,
                "ProbeGetTankCalibrationChartRecordsList",
                BuildProbeCommandData(probeNumber, startNumber, totalNumber),
                "tank calibration chart records");
        }

        public Task<FMSResponse<ProbeTankVolumeForHeight>> GetTankVolumeForHeightAsync(string ptsDeviceId, int probeNumber, int height)
        {
            var validationErrors = ValidateProbeRequest(probeNumber, height: height);
            if (validationErrors.Count > 0)
            {
                return Task.FromResult(FMSResponse<ProbeTankVolumeForHeight>.ValidationFailed(validationErrors));
            }

            return ExecuteProbeDataCommandAsync<ProbeTankVolumeForHeight>(
                ptsDeviceId,
                "ProbeGetTankVolumeForHeight",
                BuildProbeCommandData(probeNumber, height: height),
                "tank volume for height");
        }

        public Task<FMSResponse<bool>> GenerateTankAutomaticCalibrationChartAsync(string ptsDeviceId, int probeNumber)
        {
            var validationErrors = ValidateProbeNumber(probeNumber);
            if (validationErrors.Count > 0)
            {
                return Task.FromResult(FMSResponse<bool>.ValidationFailed(validationErrors));
            }

            return ExecuteProbeConfirmationCommandAsync(
                ptsDeviceId,
                "ProbeGenerateTankAutomaticCalibrationChart",
                BuildProbeCommandData(probeNumber),
                "automatic calibration chart generation");
        }

        public Task<FMSResponse<ProbeChartTotalRecordsResponse>> GetTankIntervalVolumeChartTotalRecordsNumberAsync(string ptsDeviceId, int probeNumber)
        {
            var validationErrors = ValidateProbeNumber(probeNumber);
            if (validationErrors.Count > 0)
            {
                return Task.FromResult(FMSResponse<ProbeChartTotalRecordsResponse>.ValidationFailed(validationErrors));
            }

            return ExecuteProbeDataCommandAsync<ProbeChartTotalRecordsResponse>(
                ptsDeviceId,
                "ProbeGetTankIntervalVolumeChartTotalRecordsNumber",
                BuildProbeCommandData(probeNumber),
                "tank interval volume chart total records");
        }

        public Task<FMSResponse<ProbeTankIntervalVolumeChartRecordsResponse>> GetTankIntervalVolumeChartRecordsAsync(string ptsDeviceId, int probeNumber, int? startNumber = null, int? totalNumber = null)
        {
            var validationErrors = ValidateProbeRequest(probeNumber, startNumber, totalNumber);
            if (validationErrors.Count > 0)
            {
                return Task.FromResult(FMSResponse<ProbeTankIntervalVolumeChartRecordsResponse>.ValidationFailed(validationErrors));
            }

            return ExecuteProbeDataCommandAsync<ProbeTankIntervalVolumeChartRecordsResponse>(
                ptsDeviceId,
                "ProbeGetTankIntervalVolumeChartRecordsList",
                BuildProbeCommandData(probeNumber, startNumber, totalNumber),
                "tank interval volume chart records");
        }

        public Task<FMSResponse<ProbeChartTotalRecordsResponse>> GetTankAutomaticCalibrationChartTotalRecordsNumberAsync(string ptsDeviceId, int probeNumber)
        {
            var validationErrors = ValidateProbeNumber(probeNumber);
            if (validationErrors.Count > 0)
            {
                return Task.FromResult(FMSResponse<ProbeChartTotalRecordsResponse>.ValidationFailed(validationErrors));
            }

            return ExecuteProbeDataCommandAsync<ProbeChartTotalRecordsResponse>(
                ptsDeviceId,
                "ProbeGetTankAutomaticCalibrationChartTotalRecordsNumber",
                BuildProbeCommandData(probeNumber),
                "tank automatic calibration chart total records");
        }

        public Task<FMSResponse<ProbeTankChartRecordsResponse>> GetTankAutomaticCalibrationChartRecordsAsync(string ptsDeviceId, int probeNumber, int? startNumber = null, int? totalNumber = null)
        {
            var validationErrors = ValidateProbeRequest(probeNumber, startNumber, totalNumber);
            if (validationErrors.Count > 0)
            {
                return Task.FromResult(FMSResponse<ProbeTankChartRecordsResponse>.ValidationFailed(validationErrors));
            }

            return ExecuteProbeDataCommandAsync<ProbeTankChartRecordsResponse>(
                ptsDeviceId,
                "ProbeGetTankAutomaticCalibrationChartRecordsList",
                BuildProbeCommandData(probeNumber, startNumber, totalNumber),
                "tank automatic calibration chart records");
        }

        public Task<FMSResponse<bool>> SetTankCalibrationChartRecordsAsync(string ptsDeviceId, int probeNumber, ProbeTankCalibrationRecordListRequestDto request)
        {
            var validationErrors = ValidateCalibrationRecordListRequest(probeNumber, request);
            if (validationErrors.Count > 0)
            {
                return Task.FromResult(FMSResponse<bool>.ValidationFailed(validationErrors));
            }

            return ExecuteProbeConfirmationCommandAsync(
                ptsDeviceId,
                "ProbeSetTankCalibrationChartRecordsList",
                BuildProbeChartRecordsCommandData(probeNumber, request.Records),
                "tank calibration chart replace");
        }

        public Task<FMSResponse<bool>> AddTankCalibrationChartRecordAsync(string ptsDeviceId, int probeNumber, ProbeTankCalibrationRecordWriteDto request)
        {
            var validationErrors = ValidateCalibrationRecordRequest(probeNumber, request);
            if (validationErrors.Count > 0)
            {
                return Task.FromResult(FMSResponse<bool>.ValidationFailed(validationErrors));
            }

            return ExecuteProbeConfirmationCommandAsync(
                ptsDeviceId,
                "ProbeAddTankCalibrationChartRecordToList",
                BuildProbeChartRecordCommandData(probeNumber, request.Height, request.Volume),
                "tank calibration chart add record");
        }

        public Task<FMSResponse<bool>> EditTankCalibrationChartRecordAsync(string ptsDeviceId, int probeNumber, ProbeTankCalibrationRecordWriteDto request)
        {
            var validationErrors = ValidateCalibrationRecordRequest(probeNumber, request);
            if (validationErrors.Count > 0)
            {
                return Task.FromResult(FMSResponse<bool>.ValidationFailed(validationErrors));
            }

            return ExecuteProbeConfirmationCommandAsync(
                ptsDeviceId,
                "ProbeEditTankCalibrationChartRecordInList",
                BuildProbeChartRecordCommandData(probeNumber, request.Height, request.Volume),
                "tank calibration chart edit record");
        }

        public Task<FMSResponse<bool>> DeleteTankCalibrationChartRecordAsync(string ptsDeviceId, int probeNumber, int height)
        {
            var validationErrors = ValidateProbeRequest(probeNumber, height: height);
            if (validationErrors.Count > 0)
            {
                return Task.FromResult(FMSResponse<bool>.ValidationFailed(validationErrors));
            }

            return ExecuteProbeConfirmationCommandAsync(
                ptsDeviceId,
                "ProbeDeleteTankCalibrationChartRecordFromList",
                BuildProbeChartDeleteCommandData(probeNumber, height),
                "tank calibration chart delete record");
        }

        private async Task<FMSResponse<TResponse>> ExecuteProbeDataCommandAsync<TResponse>(string ptsDeviceId, string commandType, object commandData, string operationName)
            where TResponse : class
        {
            try
            {
                _logger.LogInformation("Requesting {OperationName} from PTS device {DeviceId}", operationName, ptsDeviceId);
                var result = await _commandExecutor.ExecuteCommandAsync(ptsDeviceId, commandType, commandData);

                if (!result.Success || result.CommandData == null)
                {
                    _logger.LogWarning("Failed to get {OperationName} from PTS device {DeviceId}. Error: {ErrorMessage}, Code: {ErrorCode}",
                        operationName, ptsDeviceId, result.Message, result.Code);
                    return FMSResponse<TResponse>.Failed(result.Message ?? $"Failed to retrieve {operationName} from device.");
                }

                var commandToken = result.CommandData as JToken ?? JToken.FromObject(result.CommandData);
                var responseToken = commandToken.Type == JTokenType.Array ? commandToken.First : commandToken;
                var response = responseToken?.ToObject<TResponse>();

                if (response == null)
                {
                    _logger.LogError("Failed to parse {OperationName} response from PTS device {DeviceId}. Data: {CommandData}",
                        operationName, ptsDeviceId, result.CommandData);
                    return FMSResponse<TResponse>.Failed($"Failed to parse {operationName} response from device");
                }

                return FMSResponse<TResponse>.Success(response, $"{operationName} retrieved successfully");
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "PTS Device Error while getting {OperationName} for device {DeviceId}", operationName, ptsDeviceId);
                return FMSResponse<TResponse>.Failed(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting {OperationName} for device {DeviceId}", operationName, ptsDeviceId);
                return FMSResponse<TResponse>.Failed($"Internal server error while getting {operationName}");
            }
        }

        private async Task<FMSResponse<bool>> ExecuteProbeConfirmationCommandAsync(string ptsDeviceId, string commandType, object commandData, string operationName)
        {
            try
            {
                _logger.LogInformation("Executing {OperationName} on PTS device {DeviceId}", operationName, ptsDeviceId);
                var result = await _commandExecutor.ExecuteCommandAsync(ptsDeviceId, commandType, commandData);

                if (!result.Success)
                {
                    _logger.LogWarning("Failed to execute {OperationName} on PTS device {DeviceId}. Error: {ErrorMessage}, Code: {ErrorCode}",
                        operationName, ptsDeviceId, result.Message, result.Code);
                    return FMSResponse<bool>.Failed(result.Message ?? $"Failed to execute {operationName} on device.");
                }

                return FMSResponse<bool>.Success(true, $"{operationName} executed successfully");
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "PTS Device Error while executing {OperationName} for device {DeviceId}", operationName, ptsDeviceId);
                return FMSResponse<bool>.Failed(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing {OperationName} for device {DeviceId}", operationName, ptsDeviceId);
                return FMSResponse<bool>.Failed($"Internal server error while executing {operationName}");
            }
        }

        private static JObject BuildProbeCommandData(int probeNumber, int? startNumber = null, int? totalNumber = null, int? height = null)
        {
            var commandData = new JObject
            {
                ["Probe"] = probeNumber
            };

            if (startNumber.HasValue)
            {
                commandData["StartNumber"] = startNumber.Value;
            }

            if (totalNumber.HasValue)
            {
                commandData["TotalNumber"] = totalNumber.Value;
            }

            if (height.HasValue)
            {
                commandData["Height"] = height.Value;
            }

            return commandData;
        }

        private static JObject BuildProbeChartRecordsCommandData(int probeNumber, System.Collections.Generic.IEnumerable<ProbeTankCalibrationRecordWriteDto> records)
        {
            var commandData = BuildProbeCommandData(probeNumber);
            commandData["Records"] = JArray.FromObject(records);
            return commandData;
        }

        private static JObject BuildProbeChartRecordCommandData(int probeNumber, int height, int volume)
        {
            var commandData = BuildProbeCommandData(probeNumber, height: height);
            commandData["Volume"] = volume;
            return commandData;
        }

        private static JObject BuildProbeChartDeleteCommandData(int probeNumber, int height)
        {
            return BuildProbeCommandData(probeNumber, height: height);
        }

        private static List<string> ValidateProbeRequest(int probeNumber, int? startNumber = null, int? totalNumber = null, int? height = null)
        {
            var errors = ValidateProbeNumber(probeNumber);

            if (startNumber.HasValue && startNumber.Value < 1)
            {
                errors.Add("Start number must be greater than or equal to 1.");
            }

            if (totalNumber.HasValue && (totalNumber.Value < 1 || totalNumber.Value > 100))
            {
                errors.Add("Total number must be between 1 and 100.");
            }

            if (height.HasValue && height.Value < 0)
            {
                errors.Add("Height must be greater than or equal to 0.");
            }

            return errors;
        }

        private static List<string> ValidateProbeNumber(int probeNumber)
        {
            var errors = new List<string>();
            if (probeNumber < 1 || probeNumber > 20)
            {
                errors.Add("Probe number must be between 1 and 20.");
            }

            return errors;
        }

        private static List<string> ValidateCalibrationRecordListRequest(int probeNumber, ProbeTankCalibrationRecordListRequestDto request)
        {
            var validationErrors = ValidateProbeNumber(probeNumber);
            if (request?.Records == null || request.Records.Count == 0)
            {
                validationErrors.Add("At least one calibration chart record is required.");
                return validationErrors;
            }

            if (request.Records.Count > 100)
            {
                validationErrors.Add("A maximum of 100 calibration chart records can be sent in a single replace request.");
            }

            foreach (var record in request.Records)
            {
                ValidateCalibrationRecord(record, validationErrors);
            }

            return validationErrors;
        }

        private static List<string> ValidateCalibrationRecordRequest(int probeNumber, ProbeTankCalibrationRecordWriteDto request)
        {
            var validationErrors = ValidateProbeNumber(probeNumber);
            ValidateCalibrationRecord(request, validationErrors);
            return validationErrors;
        }

        private static void ValidateCalibrationRecord(ProbeTankCalibrationRecordWriteDto? record, System.Collections.Generic.ICollection<string> validationErrors)
        {
            if (record == null)
            {
                validationErrors.Add("Calibration chart record payload is required.");
                return;
            }

            if (record.Height <= 0)
            {
                validationErrors.Add("Height must be greater than 0.");
            }

            if (record.Volume < 0)
            {
                validationErrors.Add("Volume cannot be negative.");
            }
        }
    }
}