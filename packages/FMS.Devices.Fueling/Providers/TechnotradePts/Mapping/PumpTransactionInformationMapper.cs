using FMS.Devices.Core.Routing;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public sealed class PumpTransactionInformationMapper : PumpResponseMapperBase
{
    public PumpTransactionInformationMapper(
        IDeviceMessageRouter router,
        ILogger<PumpTransactionInformationMapper> logger)
        : base(router, logger)
    {
    }

    public override string PacketType => "PumpTransactionInformation";
}
