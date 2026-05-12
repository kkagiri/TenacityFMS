using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs {
    public class TestNotificationRequest {
        public string Title { get; set; } = "Test Notification";
        public string Message { get; set; } = "This is a test notification";
        public List<string> DeliveryMethods { get; set; } = new () { "System" };
    }
}