using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Fueling.Notifications;
using FMS.Devices.Abstractions.Fueling.Messages;
using FMS.Application.Services;
using MediatR;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using StackExchange.Redis;

namespace FMS.Application.Features.Devices.Fueling.PumpControl.Notifications;

public sealed class PumpResponseReceivedHandler : INotificationHandler<PumpResponseReceivedNotification>
{
    private const string PumpAuthorizeConfirmationChannel = "pts-pump-authorize-confirmations";

    private readonly IAutoTransactionCompletionService _autoCompletionService;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<PumpResponseReceivedHandler> _logger;

    public PumpResponseReceivedHandler(
        IAutoTransactionCompletionService autoCompletionService,
        IConnectionMultiplexer redis,
        ILogger<PumpResponseReceivedHandler> logger)
    {
        _autoCompletionService = autoCompletionService;
        _redis = redis;
        _logger = logger;
    }

    public async Task Handle(PumpResponseReceivedNotification notification, CancellationToken cancellationToken)
    {
        var message = notification.Message;
        var response = message.Payload;

        if (response.IsError)
        {
            _logger.LogWarning(
                "Canonical pump response error {PacketType} from {Provider}/{Device}: Code={Code}, Message={Message}",
                response.PacketType,
                message.ProviderName,
                message.ExternalDeviceId,
                response.ErrorCode,
                response.ErrorMessage);
            return;
        }

        if (string.Equals(response.PacketType, "PumpAuthorizeConfirmation", StringComparison.OrdinalIgnoreCase))
        {
            await PublishPumpAuthorizeConfirmationAsync(message.ExternalDeviceId, response);
        }

        if (string.Equals(response.PacketType, "PumpEndOfTransactionStatus", StringComparison.OrdinalIgnoreCase)
            && response.PumpNumber.HasValue
            && response.TransactionId.HasValue)
        {
            await ProcessEndOfTransactionAsync(message.ExternalDeviceId, response);
        }

        _logger.LogInformation(
            "Canonical pump response {PacketType} from {Provider}/{Device}: Pump={Pump}, Transaction={Transaction}, Status={Status}, Success={Success}",
            response.PacketType,
            message.ProviderName,
            message.ExternalDeviceId,
            response.PumpNumber,
            response.TransactionId,
            response.StatusType ?? response.State,
            response.Success);
    }

    private async Task PublishPumpAuthorizeConfirmationAsync(string deviceId, PumpResponseMessage response)
    {
        var confirmationData = new
        {
            DeviceId = deviceId,
            PacketId = response.PacketId,
            PumpId = response.PumpNumber,
            TransactionId = response.TransactionId,
            Timestamp = DateTime.UtcNow,
            RawData = string.IsNullOrWhiteSpace(response.RawDataJson)
                ? null
                : JsonConvert.DeserializeObject<JToken>(response.RawDataJson)
        };

        var message = JsonConvert.SerializeObject(confirmationData);
        await _redis.GetSubscriber().PublishAsync(PumpAuthorizeConfirmationChannel, message);
        await _redis.GetDatabase().StringSetAsync(
            $"device:{deviceId}:pump-auth-confirmation:{response.PacketId}",
            message,
            TimeSpan.FromSeconds(30));
    }

    private async Task ProcessEndOfTransactionAsync(string deviceId, PumpResponseMessage response)
    {
        var statusData = string.IsNullOrWhiteSpace(response.RawDataJson)
            ? new JObject()
            : JsonConvert.DeserializeObject<JObject>(response.RawDataJson) ?? new JObject();

        await _autoCompletionService.ProcessEndOfTransactionAsync(
            deviceId,
            response.PumpNumber!.Value,
            response.TransactionId!.Value,
            statusData);
    }
}
