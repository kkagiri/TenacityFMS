using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.Notification.Services {
    /// <summary>
    /// Email service interface for sending email notifications
    /// </summary>
    public interface IEmailService {
        Task<bool> SendEmailAsync (string to, string subject, string body, bool isHtml = false, CancellationToken cancellationToken = default);
    }
}