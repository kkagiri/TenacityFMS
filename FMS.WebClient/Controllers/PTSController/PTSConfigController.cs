//Cursor
using System;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.PTSServices.PTSConfigService;
using FMS.Domain.PTSCommon.Responses;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers.PTSController {
    [ApiController]
    [Route ("api/pts/{deviceId}/config")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class PTSConfigController : ControllerBase {
        private readonly IPTSConfigService _ptsConfigService;
        private readonly ILogger<PTSConfigController> _logger;

        public PTSConfigController (IPTSConfigService ptsConfigService, ILogger<PTSConfigController> logger) {
            _ptsConfigService = ptsConfigService;
            _logger = logger;
        }

        /// <summary>
        /// Gets the current date and time from the PTS device.
        /// </summary>
        [HttpGet ("datetime")]
        public async Task<ActionResult<FMSResponse<DateTimeResponse>>> GetDeviceDateTime (string deviceId) {
            try {
                var result = await _ptsConfigService.GetDateTimeAsync (deviceId);
                if (!result.IsSuccess) {
                    return BadRequest (result);
                }
                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting DateTime for device {DeviceId}", deviceId);
                return StatusCode (500, FMSResponse<DateTimeResponse>.Failed ("Internal server error"));
            }
        }

        /// <summary>
        /// Gets the network settings from the PTS device.
        /// </summary>
        [HttpGet ("networksettings")]
        public async Task<ActionResult<FMSResponse<PtsNetworkSettingsResponse>>> GetDeviceNetworkSettings (string deviceId) {
            try {
                var result = await _ptsConfigService.GetPtsNetworkSettingsAsync (deviceId);
                if (!result.IsSuccess) {
                    return BadRequest (result);
                }
                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting Network Settings for device {DeviceId}", deviceId);
                return StatusCode (500, FMSResponse<PtsNetworkSettingsResponse>.Failed ("Internal server error"));
            }
        }

        /// <summary>
        /// Gets the pumps configuration from the PTS device.
        /// </summary>
        [HttpGet ("pumps")]
        public async Task<ActionResult<FMSResponse<PumpsConfigurationResponse>>> GetDevicePumpsConfiguration (string deviceId) {
            try {
                var result = await _ptsConfigService.GetPumpsConfigurationAsync (deviceId);
                if (!result.IsSuccess) {
                    return BadRequest (result);
                }
                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting Pumps Configuration for device {DeviceId}", deviceId);
                return StatusCode (500, FMSResponse<PumpsConfigurationResponse>.Failed ("Internal server error"));
            }
        }

        /// <summary>
        /// Gets a comprehensive diagnostic report from the PTS device.
        /// </summary>
        [HttpGet ("diagnostics")]
        public async Task<ActionResult<FMSResponse<object>>> GetDeviceDiagnostics (string deviceId) {
            try {
                // This will call the GetFullDeviceDiagnosticsAsync which might orchestrate multiple PTS commands
                var result = await _ptsConfigService.GetFullDeviceDiagnosticsAsync (deviceId);
                if (!result.IsSuccess) {
                    return BadRequest (result);
                }
                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting full diagnostics for device {DeviceId}", deviceId);
                return StatusCode (500, FMSResponse<object>.Failed ("Internal server error while getting diagnostics"));
            }
        }
    }
}