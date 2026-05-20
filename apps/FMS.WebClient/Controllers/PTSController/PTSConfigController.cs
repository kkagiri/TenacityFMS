/**
 * File: PTSConfigController.cs
 * Purpose: Exposes authenticated API endpoints for PTS configuration and calibration operations.
 * Dependencies: IPTSConfigService, FMSResponse, ASP.NET Core MVC, authorization attributes
 * Last Modified: 2026-03-23
 *
 * Key Actions:
 * - GetRemoteServerConfiguration: Reads transport configuration for a PTS device.
 * - GetTankCalibrationChartRecords: Returns probe calibration chart rows from the device.
 * - GenerateTankAutomaticCalibrationChart: Starts automatic calibration chart generation on the device.
 */
using System;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Devices.Fueling.Services;
using FMS.Application.Features.Devices.Fueling.UploadStatus.DTOs;
using FMS.Domain.Entities.PTS;
using FMS.Domain.PTSCommon.Responses;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers.PTSController
{
    [ApiController]
    [Route("api/v1/pts/{deviceId}/config")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.Admin.Device)]
    [RejectCustomerTenant]
    public class PTSConfigController : ControllerBase
    {
        private readonly IPTSConfigService _ptsConfigService;
        private readonly ILogger<PTSConfigController> _logger;

        public PTSConfigController(IPTSConfigService ptsConfigService, ILogger<PTSConfigController> logger)
        {
            _ptsConfigService = ptsConfigService;
            _logger = logger;
        }

        /// <summary>
        /// Gets the current date and time from the PTS device.
        /// </summary>
        [HttpGet("datetime")]
        public async Task<ActionResult<FMSResponse<DateTimeResponse>>> GetDeviceDateTime(string deviceId)
        {
            try
            {
                var result = await _ptsConfigService.GetDateTimeAsync(deviceId);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting DateTime for device {DeviceId}", deviceId);
                return StatusCode(500, FMSResponse<DateTimeResponse>.Failed("Internal server error"));
            }
        }

        /// <summary>
        /// Gets the network settings from the PTS device.
        /// </summary>
        [HttpGet("networksettings")]
        public async Task<ActionResult<FMSResponse<PtsNetworkSettingsResponse>>> GetDeviceNetworkSettings(string deviceId)
        {
            try
            {
                var result = await _ptsConfigService.GetPtsNetworkSettingsAsync(deviceId);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Network Settings for device {DeviceId}", deviceId);
                return StatusCode(500, FMSResponse<PtsNetworkSettingsResponse>.Failed("Internal server error"));
            }
        }

        /// <summary>
        /// Gets the pumps configuration from the PTS device.
        /// </summary>
        [HttpGet("pumps")]
        public async Task<ActionResult<FMSResponse<PumpsConfigurationResponse>>> GetDevicePumpsConfiguration(string deviceId)
        {
            try
            {
                var result = await _ptsConfigService.GetPumpsConfigurationAsync(deviceId);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Pumps Configuration for device {DeviceId}", deviceId);
                return StatusCode(500, FMSResponse<PumpsConfigurationResponse>.Failed("Internal server error"));
            }
        }

        /// <summary>
        /// Gets the probes configuration from the PTS device.
        /// Based on protocol 52. GetProbesConfiguration
        /// </summary>
        [HttpGet("probes")]
        public async Task<ActionResult<FMSResponse<ProbesConfigurationResponse>>> GetDeviceProbesConfiguration(string deviceId)
        {
            try
            {
                _logger.LogInformation("API: Getting Probes Configuration for device {DeviceId}", deviceId);
                var result = await _ptsConfigService.GetProbesConfigurationAsync(deviceId);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Probes Configuration for device {DeviceId}", deviceId);
                return StatusCode(500, FMSResponse<ProbesConfigurationResponse>.Failed("Internal server error"));
            }
        }

        /// <summary>
        /// Gets the tanks configuration from the PTS device.
        /// Based on protocol 69. GetTanksConfiguration
        /// </summary>
        [HttpGet("tanks")]
        public async Task<ActionResult<FMSResponse<TanksConfigurationResponse>>> GetDeviceTanksConfiguration(string deviceId)
        {
            try
            {
                _logger.LogInformation("API: Getting Tanks Configuration for device {DeviceId}", deviceId);
                var result = await _ptsConfigService.GetTanksConfigurationAsync(deviceId);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Tanks Configuration for device {DeviceId}", deviceId);
                return StatusCode(500, FMSResponse<TanksConfigurationResponse>.Failed("Internal server error"));
            }
        }

        /// <summary>
        /// Gets a comprehensive diagnostic report from the PTS device.
        /// </summary>
        [HttpGet("diagnostics")]
        public async Task<ActionResult<FMSResponse<object>>> GetDeviceDiagnostics(string deviceId)
        {
            try
            {
                // This will call the GetFullDeviceDiagnosticsAsync which might orchestrate multiple PTS commands
                var result = await _ptsConfigService.GetFullDeviceDiagnosticsAsync(deviceId);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting full diagnostics for device {DeviceId}", deviceId);
                return StatusCode(500, FMSResponse<object>.Failed("Internal server error while getting diagnostics"));
            }
        }

        /// <summary>
        /// Gets the remote server configuration from the PTS device.
        /// This includes HTTP upload settings, WebSocket settings, and server connection details.
        /// </summary>
        [HttpGet("remote-server")]
        public async Task<ActionResult<FMSResponse<RemoteServerConfigurationResponse>>> GetRemoteServerConfiguration(string deviceId)
        {
            try
            {
                _logger.LogInformation("API: Getting remote server configuration for device {DeviceId}", deviceId);
                var result = await _ptsConfigService.GetRemoteServerConfigurationAsync(deviceId);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Remote Server Configuration for device {DeviceId}", deviceId);
                return StatusCode(500, FMSResponse<RemoteServerConfigurationResponse>.Failed("Internal server error"));
            }
        }

        /// <summary>
        /// Sets the remote server configuration on the PTS device.
        /// Only properties that are provided (non-null) will be updated on the device.
        /// </summary>
        [HttpPost("remote-server")]
        public async Task<ActionResult<FMSResponse<bool>>> SetRemoteServerConfiguration(string deviceId, [FromBody] SetRemoteServerConfigurationRequest request)
        {
            try
            {
                _logger.LogInformation("API: Setting remote server configuration for device {DeviceId}", deviceId);
                var result = await _ptsConfigService.SetRemoteServerConfigurationAsync(deviceId, request);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting Remote Server Configuration for device {DeviceId}", deviceId);
                return StatusCode(500, FMSResponse<bool>.Failed("Internal server error"));
            }
        }

        /// <summary>
        /// Enables WebSocket UploadStatus on the PTS device.
        /// This is a convenience endpoint that configures the device to send periodic status updates via WebSocket.
        /// </summary>
        /// <param name="deviceId">The PTS device ID</param>
        /// <param name="periodSeconds">Period in seconds for status updates (default: 10)</param>
        [HttpPost("enable-upload-status")]
        public async Task<ActionResult<FMSResponse<bool>>> EnableUploadStatus(string deviceId, [FromQuery] int periodSeconds = 10)
        {
            try
            {
                _logger.LogInformation("API: Enabling WebSocket UploadStatus for device {DeviceId} with period {Period}s", deviceId, periodSeconds);
                var result = await _ptsConfigService.EnableWebSocketUploadStatusAsync(deviceId, periodSeconds);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enabling WebSocket UploadStatus for device {DeviceId}", deviceId);
                return StatusCode(500, FMSResponse<bool>.Failed("Internal server error"));
            }
        }

        /// <summary>
        /// Disables WebSocket UploadStatus on the PTS device.
        /// </summary>
        [HttpPost("disable-upload-status")]
        public async Task<ActionResult<FMSResponse<bool>>> DisableUploadStatus(string deviceId)
        {
            try
            {
                _logger.LogInformation("API: Disabling WebSocket UploadStatus for device {DeviceId}", deviceId);
                var result = await _ptsConfigService.DisableWebSocketUploadStatusAsync(deviceId);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disabling WebSocket UploadStatus for device {DeviceId}", deviceId);
                return StatusCode(500, FMSResponse<bool>.Failed("Internal server error"));
            }
        }

        /// <summary>
        /// Sets the pumps configuration on the PTS device (ports and pump assignments).
        /// Based on protocol 49. SetPumpsConfiguration
        /// </summary>
        [HttpPost("pumps")]
        public async Task<ActionResult<FMSResponse<bool>>> SetPumpsConfiguration(string deviceId, [FromBody] SetPumpsConfigurationRequest request)
        {
            try
            {
                _logger.LogInformation("API: Setting Pumps Configuration for device {DeviceId}", deviceId);
                var result = await _ptsConfigService.SetPumpsConfigurationAsync(deviceId, request);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting Pumps Configuration for device {DeviceId}", deviceId);
                return StatusCode(500, FMSResponse<bool>.Failed("Internal server error"));
            }
        }

        /// <summary>
        /// Gets the pump nozzles configuration from the PTS device.
        /// Based on protocol 66. GetPumpNozzlesConfiguration
        /// </summary>
        [HttpGet("pump-nozzles")]
        public async Task<ActionResult<FMSResponse<PumpNozzlesConfigurationResponse>>> GetPumpNozzlesConfiguration(string deviceId)
        {
            try
            {
                _logger.LogInformation("API: Getting Pump Nozzles Configuration for device {DeviceId}", deviceId);
                var result = await _ptsConfigService.GetPumpNozzlesConfigurationAsync(deviceId);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Pump Nozzles Configuration for device {DeviceId}", deviceId);
                return StatusCode(500, FMSResponse<PumpNozzlesConfigurationResponse>.Failed("Internal server error"));
            }
        }

        /// <summary>
        /// Sets the pump nozzles configuration on the PTS device.
        /// Based on protocol 67. SetPumpNozzlesConfiguration
        /// </summary>
        [HttpPost("pump-nozzles")]
        public async Task<ActionResult<FMSResponse<bool>>> SetPumpNozzlesConfiguration(string deviceId, [FromBody] SetPumpNozzlesConfigurationRequest request)
        {
            try
            {
                _logger.LogInformation("API: Setting Pump Nozzles Configuration for device {DeviceId}", deviceId);
                var result = await _ptsConfigService.SetPumpNozzlesConfigurationAsync(deviceId, request);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting Pump Nozzles Configuration for device {DeviceId}", deviceId);
                return StatusCode(500, FMSResponse<bool>.Failed("Internal server error"));
            }
        }

        [HttpGet("probes/{probeNumber:int}/calibration-chart/total-records")]
        public async Task<ActionResult<FMSResponse<ProbeChartTotalRecordsResponse>>> GetTankCalibrationChartTotalRecords(string deviceId, int probeNumber)
        {
            try
            {
                var result = await _ptsConfigService.GetTankCalibrationChartTotalRecordsNumberAsync(deviceId, probeNumber);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank calibration chart total records for device {DeviceId}, probe {ProbeNumber}", deviceId, probeNumber);
                return StatusCode(500, FMSResponse<ProbeChartTotalRecordsResponse>.Failed("Internal server error"));
            }
        }

        [HttpGet("probes/{probeNumber:int}/calibration-chart/records")]
        public async Task<ActionResult<FMSResponse<ProbeTankChartRecordsResponse>>> GetTankCalibrationChartRecords(string deviceId, int probeNumber, [FromQuery] int? startNumber = null, [FromQuery] int? totalNumber = null)
        {
            try
            {
                var result = await _ptsConfigService.GetTankCalibrationChartRecordsAsync(deviceId, probeNumber, startNumber, totalNumber);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank calibration chart records for device {DeviceId}, probe {ProbeNumber}", deviceId, probeNumber);
                return StatusCode(500, FMSResponse<ProbeTankChartRecordsResponse>.Failed("Internal server error"));
            }
        }

        [HttpGet("probes/{probeNumber:int}/interval-volume-chart/total-records")]
        public async Task<ActionResult<FMSResponse<ProbeChartTotalRecordsResponse>>> GetTankIntervalVolumeChartTotalRecords(string deviceId, int probeNumber)
        {
            try
            {
                var result = await _ptsConfigService.GetTankIntervalVolumeChartTotalRecordsNumberAsync(deviceId, probeNumber);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank interval volume chart total records for device {DeviceId}, probe {ProbeNumber}", deviceId, probeNumber);
                return StatusCode(500, FMSResponse<ProbeChartTotalRecordsResponse>.Failed("Internal server error"));
            }
        }

        [HttpGet("probes/{probeNumber:int}/interval-volume-chart/records")]
        public async Task<ActionResult<FMSResponse<ProbeTankIntervalVolumeChartRecordsResponse>>> GetTankIntervalVolumeChartRecords(string deviceId, int probeNumber, [FromQuery] int? startNumber = null, [FromQuery] int? totalNumber = null)
        {
            try
            {
                var result = await _ptsConfigService.GetTankIntervalVolumeChartRecordsAsync(deviceId, probeNumber, startNumber, totalNumber);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank interval volume chart records for device {DeviceId}, probe {ProbeNumber}", deviceId, probeNumber);
                return StatusCode(500, FMSResponse<ProbeTankIntervalVolumeChartRecordsResponse>.Failed("Internal server error"));
            }
        }

        [HttpGet("probes/{probeNumber:int}/automatic-calibration-chart/total-records")]
        public async Task<ActionResult<FMSResponse<ProbeChartTotalRecordsResponse>>> GetTankAutomaticCalibrationChartTotalRecords(string deviceId, int probeNumber)
        {
            try
            {
                var result = await _ptsConfigService.GetTankAutomaticCalibrationChartTotalRecordsNumberAsync(deviceId, probeNumber);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank automatic calibration chart total records for device {DeviceId}, probe {ProbeNumber}", deviceId, probeNumber);
                return StatusCode(500, FMSResponse<ProbeChartTotalRecordsResponse>.Failed("Internal server error"));
            }
        }

        [HttpGet("probes/{probeNumber:int}/automatic-calibration-chart/records")]
        public async Task<ActionResult<FMSResponse<ProbeTankChartRecordsResponse>>> GetTankAutomaticCalibrationChartRecords(string deviceId, int probeNumber, [FromQuery] int? startNumber = null, [FromQuery] int? totalNumber = null)
        {
            try
            {
                var result = await _ptsConfigService.GetTankAutomaticCalibrationChartRecordsAsync(deviceId, probeNumber, startNumber, totalNumber);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank automatic calibration chart records for device {DeviceId}, probe {ProbeNumber}", deviceId, probeNumber);
                return StatusCode(500, FMSResponse<ProbeTankChartRecordsResponse>.Failed("Internal server error"));
            }
        }

        [HttpGet("probes/{probeNumber:int}/volume-for-height/{height:int}")]
        public async Task<ActionResult<FMSResponse<ProbeTankVolumeForHeight>>> GetTankVolumeForHeight(string deviceId, int probeNumber, int height)
        {
            try
            {
                var result = await _ptsConfigService.GetTankVolumeForHeightAsync(deviceId, probeNumber, height);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank volume for height for device {DeviceId}, probe {ProbeNumber}", deviceId, probeNumber);
                return StatusCode(500, FMSResponse<ProbeTankVolumeForHeight>.Failed("Internal server error"));
            }
        }

        [HttpPost("probes/{probeNumber:int}/automatic-calibration-chart/generate")]
        public async Task<ActionResult<FMSResponse<bool>>> GenerateTankAutomaticCalibrationChart(string deviceId, int probeNumber)
        {
            try
            {
                var result = await _ptsConfigService.GenerateTankAutomaticCalibrationChartAsync(deviceId, probeNumber);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating automatic calibration chart for device {DeviceId}, probe {ProbeNumber}", deviceId, probeNumber);
                return StatusCode(500, FMSResponse<bool>.Failed("Internal server error"));
            }
        }

        [HttpPost("probes/{probeNumber:int}/calibration-chart/set")]
        public async Task<ActionResult<FMSResponse<bool>>> SetTankCalibrationChartRecords(string deviceId, int probeNumber, [FromBody] ProbeTankCalibrationRecordListRequestDto request)
        {
            try
            {
                var result = await _ptsConfigService.SetTankCalibrationChartRecordsAsync(deviceId, probeNumber, request);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error replacing tank calibration chart for device {DeviceId}, probe {ProbeNumber}", deviceId, probeNumber);
                return StatusCode(500, FMSResponse<bool>.Failed("Internal server error"));
            }
        }

        [HttpPost("probes/{probeNumber:int}/calibration-chart/record")]
        public async Task<ActionResult<FMSResponse<bool>>> AddTankCalibrationChartRecord(string deviceId, int probeNumber, [FromBody] ProbeTankCalibrationRecordWriteDto request)
        {
            try
            {
                var result = await _ptsConfigService.AddTankCalibrationChartRecordAsync(deviceId, probeNumber, request);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding tank calibration chart record for device {DeviceId}, probe {ProbeNumber}", deviceId, probeNumber);
                return StatusCode(500, FMSResponse<bool>.Failed("Internal server error"));
            }
        }

        [HttpPut("probes/{probeNumber:int}/calibration-chart/record")]
        public async Task<ActionResult<FMSResponse<bool>>> EditTankCalibrationChartRecord(string deviceId, int probeNumber, [FromBody] ProbeTankCalibrationRecordWriteDto request)
        {
            try
            {
                var result = await _ptsConfigService.EditTankCalibrationChartRecordAsync(deviceId, probeNumber, request);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error editing tank calibration chart record for device {DeviceId}, probe {ProbeNumber}", deviceId, probeNumber);
                return StatusCode(500, FMSResponse<bool>.Failed("Internal server error"));
            }
        }

        [HttpDelete("probes/{probeNumber:int}/calibration-chart/record/{height:int}")]
        public async Task<ActionResult<FMSResponse<bool>>> DeleteTankCalibrationChartRecord(string deviceId, int probeNumber, int height)
        {
            try
            {
                var result = await _ptsConfigService.DeleteTankCalibrationChartRecordAsync(deviceId, probeNumber, height);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting tank calibration chart record for device {DeviceId}, probe {ProbeNumber}, height {Height}", deviceId, probeNumber, height);
                return StatusCode(500, FMSResponse<bool>.Failed("Internal server error"));
            }
        }
    }
}
