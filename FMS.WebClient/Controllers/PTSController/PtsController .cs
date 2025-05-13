using FMS.Application.Communication;
using FMS.Application.Handlers.Interface;
using FMS.Application.Validation.PTSValidators;
using FMS.Domain.PTSCommon;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace FMS.WebClient.Controllers.PTSControllers
{

    [ApiController]
    [Route("jsonPTS")]
    public class PtsController : ControllerBase
    {
        private readonly ILogger<PtsController> _logger;
        private readonly IPTSMessageProcessor _messageHandler;
        private readonly DeviceConnectionTracker _deviceConnectionTracker;


        public PtsController(ILogger<PtsController> logger, IPTSMessageProcessor messageHandler, DeviceConnectionTracker deviceConnectionTracker)
        {
            _logger = logger;
            _messageHandler = messageHandler;
            _deviceConnectionTracker = deviceConnectionTracker;
        }

        [HttpPost("uploadStatus")]
        [ValidateDevice]
        public async Task<IActionResult> UploadStatus()
        {
            var deviceId = GetDeviceId();
            if (string.IsNullOrEmpty(deviceId))
            {
                return BadRequest("Device Id is required");
            }

            _logger.LogDebug("HTTP status upload from device ID: '{DeviceId}' (type: {Type}, length: {Length})", deviceId, deviceId.GetType().Name, deviceId.Length);

            try
            {
                var requestBody = await new StreamReader(Request.Body).ReadToEndAsync();
                var ptsMessage = JsonConvert.DeserializeObject<PTSMessage>(requestBody);
                if (ptsMessage == null) return BadRequest("Invalid message format");


                // Process message and get proper PTS protocol response
                var response = await _messageHandler.ProcessMessageAsync(deviceId, ptsMessage);

                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();


                // Update the device connection tracker
                await _deviceConnectionTracker.TrackHttpStatusUpdate(deviceId, ipAddress);

                // Set mandatory Content-Length header
                Response.Headers["Content-Length"] = response.ToString().Length.ToString();

                // Return proper PTS protocol response
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling message");
                return StatusCode(500, "Error handling message");
            }
        }

        protected string? GetDeviceId()
        {
            return HttpContext.Request.Headers["X-Pts-Id"].ToString();
        }
    }
}
