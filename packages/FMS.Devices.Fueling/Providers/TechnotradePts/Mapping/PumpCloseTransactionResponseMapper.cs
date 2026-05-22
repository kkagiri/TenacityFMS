using FMS.Devices.Core.Routing;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public sealed class PumpCloseTransactionResponseMapper : PumpResponseMapperBase
{
    public PumpCloseTransactionResponseMapper(
        IDeviceMessageRouter router,
        ILogger<PumpCloseTransactionResponseMapper> logger)
        : base(router, logger)
    {
    }

    public override string PacketType => "PumpCloseTransactionResponse";
}
