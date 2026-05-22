using FMS.Devices.Core.Routing;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public sealed class PumpAuthorizeResponseMapper : PumpResponseMapperBase
{
    public PumpAuthorizeResponseMapper(
        IDeviceMessageRouter router,
        ILogger<PumpAuthorizeResponseMapper> logger)
        : base(router, logger)
    {
    }

    public override string PacketType => "PumpAuthorize";
}
