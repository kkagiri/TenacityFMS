using FMS.Application.Features.PTS.Common;
using FMS.Domain.Entities;

namespace FMS.Application.Validation.PTSValidators.Common;
public class DeviceValidationResult {
    public bool IsAllowed { get; set; }
    public string? Message { get; set; }
    public DeviceInfoDTO? DeviceInfo { get; set; }
}