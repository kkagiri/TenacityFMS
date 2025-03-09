using System.Threading.Tasks;

namespace FMS.Application.Validation.PTSValidators.Common
{
    public interface IDeviceValidator
    {
        Task<bool> IsDeviceAllowed(string deviceId);
        Task<DeviceValidationResult> ValidateDevice(string deviceId);
    }
}