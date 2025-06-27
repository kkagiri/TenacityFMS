using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.Notification.Services {
    /// <summary>
    /// SMS service interface for sending SMS notifications
    /// </summary>
    public interface ISmsService {
        Task<bool> SendSmsAsync (string to, string message, CancellationToken cancellationToken = default);
    }
}