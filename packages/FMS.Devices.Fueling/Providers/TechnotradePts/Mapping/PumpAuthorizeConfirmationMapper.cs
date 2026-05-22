using FMS.Devices.Core.Routing;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public sealed class PumpAuthorizeConfirmationMapper : PumpResponseMapperBase
{
    public PumpAuthorizeConfirmationMapper(
        IDeviceMessageRouter router,
        ILogger<PumpAuthorizeConfirmationMapper> logger)
        : base(router, logger)
    {
    }

    public override string PacketType => "PumpAuthorizeConfirmation";
}
