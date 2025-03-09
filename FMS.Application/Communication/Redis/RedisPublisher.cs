using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Communication.Redis
{
    public class RedisPublisher : IRedisPublisher
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly ILogger<RedisPublisher> _logger;

        public RedisPublisher(IConnectionMultiplexer redis, ILogger<RedisPublisher> logger)
        {
            _redis = redis;
            _logger = logger;
        }

        public async Task PublishAsync(string channel, string message)
        {
            try
            {
                var sub = _redis.GetSubscriber();
                await sub.PublishAsync(channel, message);
                _logger.LogInformation("Message published to channel: {Channel}", channel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing message to channel: {Channel}", channel);
            }
        }
    }
}