using System;
using System.Threading.Tasks;
using StackExchange.Redis;

namespace FMS.Application.Communication.Redis
{
    public interface IRedisSubscriber
    {
        Task SubscribeAsync(string channel, Action<RedisChannel, RedisValue> messageHandler);
    }
}