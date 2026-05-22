using FMS.Devices.Core.Routing;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public sealed class PumpGetStatusResponseMapper : PumpResponseMapperBase
{
    public PumpGetStatusResponseMapper(
        IDeviceMessageRouter router,
        ILogger<PumpGetStatusResponseMapper> logger)
        : base(router, logger)
    {
    }

    public override string PacketType => "PumpGetStatusResponse";
}
