using FMS.Application.Common.Commands;
using FMS.Application.CommonInterface;

namespace FMS.WebClient.Services;

public class UnavailableRedisCommandService : IRedisCommandService
{
    private const string Message = "Redis command channel is not configured.";

    public Task<RedisPTSCommandResponse> SendCommandAsync(RedisPTSCommand command, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(CreateUnavailableResponse(command.DeviceId, command.CorrelationId));
    }

    public Task<bool> TestRedisConnectionAsync()
    {
        return Task.FromResult(false);
    }

    public Task<RedisPTSCommandResponse> TestDeviceConnectionAsync(string deviceId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(CreateUnavailableResponse(deviceId, string.Empty));
    }

    private static RedisPTSCommandResponse CreateUnavailableResponse(string deviceId, string correlationId)
    {
        return new RedisPTSCommandResponse
        {
            DeviceId = deviceId,
            CorrelationId = correlationId,
            Status = "Error",
            Message = Message
        };
    }
}
