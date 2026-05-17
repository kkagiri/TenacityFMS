using System;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Communication;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.Devices.Fueling.PumpControl.Services;
using FMS.Application.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using StackExchange.Redis;
using Xunit;

namespace FMS.Testing.IntegrationTests;

public class AutoTransactionCompletionServiceManualCloseTests
{
    private const string DeviceId = "PTS-AUTO-CLOSE-01";
    private const int TransactionId = 4321;

    [Fact]
    public async Task ShouldSendManualCloseAsync_SkipsManualClose_ForStandardAutoCloseTransaction()
    {
        var service = CreateService(CreateRedisConnection(CreateTransactionContextJson(isTransferMode: false, autoCloseTransaction: true)));

        var result = await InvokeShouldSendManualCloseAsync(service, DeviceId, TransactionId);

        Assert.False(result);
    }

    [Fact]
    public async Task ShouldSendManualCloseAsync_KeepsManualClose_ForTransferAutoCloseContext()
    {
        var service = CreateService(CreateRedisConnection(CreateTransactionContextJson(isTransferMode: true, autoCloseTransaction: true)));

        var result = await InvokeShouldSendManualCloseAsync(service, DeviceId, TransactionId);

        Assert.True(result);
    }

    [Fact]
    public async Task ShouldSendManualCloseAsync_KeepsManualClose_WhenContextMissing()
    {
        var service = CreateService(CreateRedisConnection(null));

        var result = await InvokeShouldSendManualCloseAsync(service, DeviceId, TransactionId);

        Assert.True(result);
    }

    private static AutoTransactionCompletionService CreateService(IConnectionMultiplexer redisConnection)
    {
        var tracker = new DeviceConnectionTracker(
            Mock.Of<ILogger<DeviceConnectionTracker>>(),
            Mock.Of<IHubContext<PTSHub>>(),
            redisConnection);

        return new AutoTransactionCompletionService(
            Mock.Of<ITransactionCompletionService>(),
            Mock.Of<ITransactionMonitoringService>(),
            Mock.Of<IDirectHttpTransactionService>(),
            Mock.Of<IPumpService>(),
            tracker,
            redisConnection,
            Mock.Of<IServiceScopeFactory>(),
            Mock.Of<ILogger<AutoTransactionCompletionService>>());
    }

    private static IConnectionMultiplexer CreateRedisConnection(string? transactionContextJson)
    {
        var database = new Mock<IDatabase>();
        database
            .Setup(redis => redis.StringGetAsync(
                It.IsAny<RedisKey>(),
                It.IsAny<CommandFlags>()))
            .ReturnsAsync(transactionContextJson is null ? RedisValue.Null : new RedisValue(transactionContextJson));

        var redisConnection = new Mock<IConnectionMultiplexer>();
        redisConnection
            .Setup(connection => connection.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
            .Returns(database.Object);

        return redisConnection.Object;
    }

    private static string CreateTransactionContextJson(bool isTransferMode, bool autoCloseTransaction)
    {
        return JsonSerializer.Serialize(new
        {
            DeviceId,
            TransactionId,
            IsTransferMode = isTransferMode,
            AutoCloseTransaction = autoCloseTransaction,
            ConnectionType = "WebSocket"
        });
    }

    private static async Task<bool> InvokeShouldSendManualCloseAsync(AutoTransactionCompletionService service, string deviceId, int transactionId)
    {
        var method = typeof(AutoTransactionCompletionService).GetMethod(
            "ShouldSendManualCloseAsync",
            BindingFlags.NonPublic | BindingFlags.Instance);

        Assert.NotNull(method);

        var task = (Task<bool>)method!.Invoke(service, new object?[] { deviceId, transactionId, null })!;
        return await task;
    }
}