using System;

namespace FMS.Application.ModelsDTOs.FMS.UserActivities
{
    public class UserActivityDTO
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; } // Include the username for display purposes
        public string Action { get; set; }
        public string Controller { get; set; }
        public string ActionName { get; set; }
        public string Parameters { get; set; }
        public string IpAddress { get; set; }
        public DateTime Timestamp { get; set; }
    }
}