namespace FMS.Application.Features.Notification {
    /// <summary>
    /// Constants for notification categories
    /// </summary>
    public static class NotificationCategories {
        public const string SensorVariance = "SensorVariance";
        public const string TankVariance = "TankVariance";
        public const string OpeningStock = "OpeningStock";
        public const string StockReconciliation = "StockReconciliation";
        public const string SystemMaintenance = "SystemMaintenance";
        public const string SecurityAlerts = "SecurityAlerts";
        public const string DeliveryAlerts = "DeliveryAlerts";
        public const string InventoryAlerts = "InventoryAlerts";
        public const string ClosingStock = "ClosingStock";
        public const string DeviceAlerts = "DeviceAlerts";
        public const string UserActivity = "UserActivity";
        public const string SystemError = "SystemError";

        public const string System = "System";

    }

    /// <summary>
    /// Constants for notification priorities
    /// </summary>
    public static class NotificationPriorities {
        public const string Low = "Low";
        public const string Medium = "Medium";
        public const string High = "High";
        public const string Critical = "Critical";
    }

    /// <summary>
    /// Constants for delivery methods
    /// </summary>
    public static class DeliveryMethods {
        public const string System = "System";
        public const string Email = "Email";
        public const string SMS = "SMS";
    }

    /// <summary>
    /// Constants for notification types
    /// </summary>
    public static class NotificationTypes {
        public const string Info = "Info";
        public const string Warning = "Warning";
        public const string Alert = "Alert";
        public const string Error = "Error";
    }
}