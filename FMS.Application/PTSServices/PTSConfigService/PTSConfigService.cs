using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.Common;
using FMS.Application.Common;
using FMS.Application.Infrastructure.Expections.Base;
using FMS.Application.PTSServices.PTSConfigService;
using FMS.Domain.PTSCommon.Responses;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.PTSServices.PTSConfigService {
    public class PTSConfigService : IPTSConfigService {
        private readonly ICommandExecutor _commandExecutor;
        private readonly ILogger<PTSConfigService> _logger;

        public PTSConfigService (ICommandExecutor commandExecutor, ILogger<PTSConfigService> logger) {
            _commandExecutor = commandExecutor;
            _logger = logger;
        }

        public async Task<FMSResponse<DateTimeResponse>> GetDateTimeAsync (string ptsDeviceId) {
            try {
                _logger.LogInformation ("Requesting DateTime from PTS device {DeviceId}", ptsDeviceId);
                var result = await _commandExecutor.ExecuteCommandAsync (ptsDeviceId, "GetDateTime", null);

                if (!result.Success || result.CommandData == null) {
                    _logger.LogWarning ("Failed to get DateTime from PTS device {DeviceId}. Error: {ErrorMessage}, Code: {ErrorCode}",
                        ptsDeviceId, result.Message, result.Code);
                    return FMSResponse<DateTimeResponse>.Failed (result.Message ?? "Failed to retrieve DateTime from device.");
                }

                var data = JObject.FromObject (result.CommandData);
                var dateTimeResponse = data.ToObject<DateTimeResponse> ();

                if (dateTimeResponse == null) {
                    _logger.LogError ("Failed to parse DateTime response from PTS device {DeviceId}. Data: {CommandData}", ptsDeviceId, result.CommandData);
                    return FMSResponse<DateTimeResponse>.Failed ("Failed to parse DateTime response from device");
                }

                return FMSResponse<DateTimeResponse>.Success (dateTimeResponse, "DateTime retrieved successfully");
            } catch (PTSDeviceException ex) {
                _logger.LogError (ex, "PTS Device Error while getting DateTime for device {DeviceId}", ptsDeviceId);
                return FMSResponse<DateTimeResponse>.Failed (ex.Message);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting DateTime for device {DeviceId}", ptsDeviceId);
                return FMSResponse<DateTimeResponse>.Failed ("Internal server error while getting DateTime");
            }
        }

        public async Task<FMSResponse<PumpsConfigurationResponse>> GetPumpsConfigurationAsync (string ptsDeviceId) {
            try {
                _logger.LogInformation ("Requesting Pumps Configuration from PTS device {DeviceId}", ptsDeviceId);
                var result = await _commandExecutor.ExecuteCommandAsync (ptsDeviceId, "GetPumpsConfiguration", null);

                if (!result.Success || result.CommandData == null) {
                    _logger.LogWarning ("Failed to get Pumps Configuration from PTS device {DeviceId}. Error: {ErrorMessage}, Code: {ErrorCode}",
                        ptsDeviceId, result.Message, result.Code);
                    return FMSResponse<PumpsConfigurationResponse>.Failed (result.Message ?? "Failed to retrieve Pumps Configuration from device.");
                }

                var data = JObject.FromObject (result.CommandData);
                var pumpsConfigResponse = data.ToObject<PumpsConfigurationResponse> ();

                if (pumpsConfigResponse == null) {
                    _logger.LogError ("Failed to parse Pumps Configuration response from PTS device {DeviceId}. Data: {CommandData}", ptsDeviceId, result.CommandData);
                    return FMSResponse<PumpsConfigurationResponse>.Failed ("Failed to parse Pumps Configuration response from device");
                }

                return FMSResponse<PumpsConfigurationResponse>.Success (pumpsConfigResponse, "Pumps Configuration retrieved successfully");
            } catch (PTSDeviceException ex) {
                _logger.LogError (ex, "PTS Device Error while getting Pumps Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<PumpsConfigurationResponse>.Failed (ex.Message);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting Pumps Configuration for device {DeviceId}", ptsDeviceId);
                return FMSResponse<PumpsConfigurationResponse>.Failed ("Internal server error while getting Pumps Configuration");
            }
        }

        public async Task<FMSResponse<object>> GetFullDeviceDiagnosticsAsync (string ptsDeviceId) {
            try {
                _logger.LogInformation ("Requesting full diagnostics from PTS device {DeviceId}", ptsDeviceId);
                var result = await _commandExecutor.ExecuteCommandAsync (ptsDeviceId, "MakeDiagnostics", null);

                if (!result.Success || result.CommandData == null) {
                    _logger.LogWarning ("Failed to get full diagnostics from PTS device {DeviceId}. Error: {ErrorMessage}, Code: {ErrorCode}",
                        ptsDeviceId, result.Message, result.Code);
                    return FMSResponse<object>.Failed (result.Message ?? "Failed to retrieve diagnostics from device.");
                }

                // The "MakeDiagnostics" command returns a complex object.
                // We can return it as is, or map it to a more specific DTO if one is created.
                return FMSResponse<object>.Success (result.CommandData, "Diagnostics retrieved successfully");
            } catch (PTSDeviceException ex) {
                _logger.LogError (ex, "PTS Device Error while getting diagnostics for device {DeviceId}", ptsDeviceId);
                return FMSResponse<object>.Failed (ex.Message);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting diagnostics for device {DeviceId}", ptsDeviceId);
                return FMSResponse<object>.Failed ("Internal server error getting diagnostics");
            }
        }

        public Task<FMSResponse<PtsNetworkSettingsResponse>> GetPtsNetworkSettingsAsync (string ptsDeviceId) {
            _logger.LogWarning ("GetPtsNetworkSettingsAsync is not yet implemented.");
            throw new NotImplementedException ();
        }

        public Task<FMSResponse<ProbesConfigurationResponse>> GetProbesConfigurationAsync (string ptsDeviceId) {
            _logger.LogWarning ("GetProbesConfigurationAsync is not yet implemented.");
            throw new NotImplementedException ();
        }

        public Task<FMSResponse<FuelGradesConfigurationResponse>> GetFuelGradesConfigurationAsync (string ptsDeviceId) {
            _logger.LogWarning ("GetFuelGradesConfigurationAsync is not yet implemented.");
            throw new NotImplementedException ();
        }

        public Task<FMSResponse<TanksConfigurationResponse>> GetTanksConfigurationAsync (string ptsDeviceId) {
            _logger.LogWarning ("GetTanksConfigurationAsync is not yet implemented.");
            throw new NotImplementedException ();
        }
    }
}