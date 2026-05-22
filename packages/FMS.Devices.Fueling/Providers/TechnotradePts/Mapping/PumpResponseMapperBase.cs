using FMS.Devices.Abstractions.Common;
using FMS.Devices.Abstractions.Fueling.Messages;
using FMS.Devices.Core.Routing;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public abstract class PumpResponseMapperBase : IPtsPacketMapper<JObject, PumpResponseMessage>
{
    private const string ProviderName = "TechnotradePTS";

    protected PumpResponseMapperBase(
        IDeviceMessageRouter router,
        ILogger logger)
    {
        Router = router;
        Logger = logger;
    }

    protected IDeviceMessageRouter Router { get; }
    protected ILogger Logger { get; }

    public abstract string PacketType { get; }

    public async Task MapAndPublishAsync(TechnotradePtsPacketContext context, CancellationToken cancellationToken = default)
    {
        var data = context.Packet.Data as JObject;
        var observedAtUtc = DateTime.UtcNow;
        var payload = new PumpResponseMessage
        {
            PacketType = context.Packet.Type,
            PacketId = context.Packet.Id,
            ObservedAtUtc = observedAtUtc,
            IsError = context.Packet.Error == true,
            ErrorCode = context.Packet.Code,
            ErrorMessage = context.Packet.Message,
            PumpNumber = data?.Value<int?>("Pump"),
            TransactionId = data?.Value<int?>("Transaction"),
            NozzleNumber = data?.Value<int?>("Nozzle"),
            StatusType = data?.Value<string>("Type"),
            State = data?.Value<string>("State"),
            FuelGrade = data?.Value<string>("FuelGradeName"),
            Volume = data?.Value<decimal?>("Volume"),
            Amount = data?.Value<decimal?>("Amount"),
            Success = data?.Value<bool?>("Success"),
            RawDataJson = data?.ToString(Newtonsoft.Json.Formatting.None)
        };

        var message = new DeviceMessage<PumpResponseMessage>
        {
            TenantId = context.TenantId,
            ProviderName = ProviderName,
            ExternalDeviceId = context.DeviceId,
            OccurredAtUtc = observedAtUtc,
            Payload = payload,
            Headers = new Dictionary<string, string>
            {
                ["packetId"] = context.Packet.Id.ToString(System.Globalization.CultureInfo.InvariantCulture),
                ["packetType"] = context.Packet.Type
            }
        };

        await Router.PublishPumpResponseAsync(message, cancellationToken);
    }
}
