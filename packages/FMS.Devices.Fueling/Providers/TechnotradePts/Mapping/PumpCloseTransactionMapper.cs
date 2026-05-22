using FMS.Devices.Core.Routing;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public sealed class PumpCloseTransactionMapper : PumpResponseMapperBase
{
    public PumpCloseTransactionMapper(
        IDeviceMessageRouter router,
        ILogger<PumpCloseTransactionMapper> logger)
        : base(router, logger)
    {
    }

    public override string PacketType => "PumpCloseTransaction";
}
