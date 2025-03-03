using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Communication.Redis
{
    public class RedisSubscriber : IRedisSubscriber
    {

        private readonly IConnectionMultiplexer _redis;
        private readonly ILogger<RedisSubscriber> _logger;

        public RedisSubscriber(IConnectionMultiplexer redis, ILogger<RedisSubscriber> logger)
        {
            _redis = redis;
            _logger = logger;
        }

        public async Task SubscribeAsync(string channel, Action<RedisChannel, RedisValue> messageHandler)
        {
            try
            {
                var sub = _redis.GetSubscriber();
                await sub.SubscribeAsync(channel, (redisChannel, redisValue) =>
                {
                    _logger.LogInformation("Received message on channel {Channel}: {Message}", redisChannel, redisValue);
                    messageHandler(redisChannel, redisValue);
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error subscribing to channel: {Channel}", channel);
            }
        }
    }
}