using System.Threading.Tasks;

namespace FMS.Application.Communication.Redis
{
    public interface IRedisPublisher
    {
        Task PublishAsync(string channel, string message);
    }
}