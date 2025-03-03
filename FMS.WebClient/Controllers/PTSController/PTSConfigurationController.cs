using FMS.Application.PTSServices.Configuration;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.PTSController
{
    public class PTSConfigurationController : ControllerBase
    {
        private readonly IConfigurationService _configurationService;

        public PTSConfigurationController(IConfigurationService configurationService)
        {
            _configurationService = configurationService;
        }

        [HttpGet("GetPumpNozzlesConfiguration/{deviceId}")]

        public async Task<IActionResult> GetPumpNozzlesConfiguration(string deviceId)
        {
            if (string.IsNullOrEmpty(deviceId))
            {
                return BadRequest("Device ID is required");
            }


            var result = await _configurationService.GetPumpNozzlesConfigurationAsync(deviceId);
            //TODO: Handle error
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}