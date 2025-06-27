using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Services {
    //Cursor - Implementation of ISmsService
    public class SmsService : ISmsService {
        private readonly ILogger<SmsService> _logger;

        public SmsService (ILogger<SmsService> logger) {
            _logger = logger;
        }

        public async Task<bool> SendSmsAsync (string to, string message, CancellationToken cancellationToken = default) {
            try {
                // TODO: Implement actual SMS sending logic (Twilio, AWS SNS, etc.)
                _logger.LogInformation ("Sending SMS to {To} with message: {Message}", to, message);

                // Simulate SMS sending
                await Task.Delay (100, cancellationToken);

                _logger.LogInformation ("SMS sent successfully to {To}", to);
                return true;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send SMS to {To}", to);
                return false;
            }
        }
    }
}