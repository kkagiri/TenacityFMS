/**
 * File: SendTestEmailRequest.cs
 * Purpose: Request DTO for the send-test-email endpoint.
 * Dependencies: None
 * Last Modified: 2026-03-05
 *
 * Key Types:
 * - SendTestEmailRequest: Contains target address, optional subject and message.
 */
namespace FMS.Application.Features.Notification.DTOs
{
    public class SendTestEmailRequest
    {
        public string ToAddress { get; set; } = string.Empty;
        public string? Subject { get; set; }
        public string? Message { get; set; }
    }
}
