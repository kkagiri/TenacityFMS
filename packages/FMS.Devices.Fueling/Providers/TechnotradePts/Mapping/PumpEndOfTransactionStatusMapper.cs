using FMS.Devices.Core.Routing;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public sealed class PumpEndOfTransactionStatusMapper : PumpResponseMapperBase
{
    public PumpEndOfTransactionStatusMapper(
        IDeviceMessageRouter router,
        ILogger<PumpEndOfTransactionStatusMapper> logger)
        : base(router, logger)
    {
    }

    public override string PacketType => "PumpEndOfTransactionStatus";
}
