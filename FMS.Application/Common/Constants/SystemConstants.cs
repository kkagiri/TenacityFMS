namespace FMS.Application.Common.Constants
{
    /// <summary>
    /// System-wide constants for the FMS application
    /// </summary>
    public static class SystemConstants
    {
        /// <summary>
        /// System user constants
        /// </summary>
        public static class SystemUser
        {
            public const string UserId = "system-user-001";
            public const string UserName = "system";
            public const string Email = "system@fms.local";
            public const string DisplayName = "System User";
            public const string FirstName = "System";
            public const string LastName = "User";
        }

        /// <summary>
        /// System administrator constants
        /// </summary>
        public static class SystemAdministrator
        {
            public const string UserId = "system-administrator";
            public const string UserName = "system-admin";
            public const string Email = "system-admin@fms.local";
            public const string DisplayName = "System Administrator";
        }

        /// <summary>
        /// Default system values
        /// </summary>
        public static class Defaults
        {
            public const string SystemTriggeredBy = "System";
            public const string SystemRecordedBy = "System";
            public const string SystemCreatedBy = "System";
            public const string SystemApprovedBy = "System";
        }

        /// <summary>
        /// Notification system constants
        /// </summary>
        public static class Notifications
        {
            public const string SystemDeliveryMethod = "System";
            public const string SystemNotificationType = "SystemNotification";
            public const string SystemTriggerSource = "System";
        }
    }
}