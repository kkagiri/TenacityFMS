using System;
using System.Threading.Tasks;
using FMS.Application.Features.PTSDevice.Queries;
using FMS.Application.Validation.PTSValidators.Common;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Validation.PTSValidators
{
    public class DeviceValidator : IDeviceValidator
    {
        private readonly IMediator _mediator;
        private readonly ILogger<DeviceValidator> _logger;
        public DeviceValidator(IMediator mediator, ILogger<DeviceValidator> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }
        public async Task<bool> IsDeviceAllowed(string deviceId)
        {
            var result = await ValidateDevice(deviceId);
            return result.IsAllowed;
        }

        public async Task<DeviceValidationResult> ValidateDevice(string deviceId)
        {
            try
            {

                var deviceInfo = await _mediator.Send(new GetAllowedDeviceQuery(deviceId));
                var isAllowed = deviceInfo != null;

                if (!isAllowed)
                {
                    _logger.LogInformation("Device {DeviceId} not authorized.", deviceId);
                }

                return new DeviceValidationResult
                {
                    IsAllowed = deviceInfo != null,
                    DeviceInfo = deviceInfo,
                    Message = deviceInfo == null ? "Device Not Authorized " : null
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating Device  {DeviceID}", deviceId);

                return new DeviceValidationResult

                {
                    IsAllowed = false,
                    Message = "Error validating Device"
                };
            }
        }
    }
}